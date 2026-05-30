# mensajes/views.py
from django.db.models import Q, Max, OuterRef, Subquery
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Chat, Mensaje
from usuarios.models import Usuario
from django.utils import timezone
from .models import Chat, Mensaje, ChatOculto

def _serializar_usuario(u):
    return {
        "id":           u.id,
        "nombres":      u.nombres,
        "apellidos":    u.apellidos,
        "nombre_usuario": u.nombre_usuario,
        "tipo_usuario": u.tipo_usuario,
    }


def _serializar_chat(chat, usuario_actual_id):
    # El otro participante
    otro = chat.participantes.exclude(id=usuario_actual_id).first()
    # Último mensaje
    ultimo = chat.mensajes.order_by('-enviado_en').first()
    # Mensajes no leídos
    no_leidos = chat.mensajes.filter(leido=False).exclude(emisor_id=usuario_actual_id).count()

    return {
        "id":            chat.id,
        "otro_usuario":  _serializar_usuario(otro) if otro else None,
        "ultimo_mensaje": {
            "contenido":   ultimo.contenido,
            "enviado_en":  ultimo.enviado_en.isoformat(),
            "es_mio":      ultimo.emisor_id == usuario_actual_id,
        } if ultimo else None,
        "no_leidos":     no_leidos,
        "creado_en":     chat.creado_en.isoformat(),
    }


@api_view(['GET'])
def listar_chats(request, usuario_id):
    chats = (
        Chat.objects
        .filter(participantes__id=usuario_id)
        .exclude(eliminado_por__id=usuario_id)   # ← agregar esto
        .annotate(ultimo=Max('mensajes__enviado_en'))
        .order_by('-ultimo', '-creado_en')
    )
    return Response([_serializar_chat(c, usuario_id) for c in chats])


@api_view(['POST'])
def crear_chat(request, usuario_id):
    """
    Crea un chat entre usuario_id y otro usuario buscado por nombre real o nombre_usuario.
    Body: { "busqueda": "texto" }
    """
    busqueda = request.data.get('busqueda', '').strip()
    if not busqueda:
        return Response({'error': 'Campo busqueda requerido'}, status=400)

    try:
        usuario_actual = Usuario.objects.get(id=usuario_id)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=404)

    # Buscar por nombre_usuario exacto o por nombre/apellido (icontains)
    otro = Usuario.objects.filter(
        Q(nombre_usuario__iexact=busqueda) |
        Q(nombres__icontains=busqueda) |
        Q(apellidos__icontains=busqueda)
    ).exclude(id=usuario_id).first()

    if not otro:
        return Response({'error': 'No se encontró ningún usuario'}, status=404)

    # Verificar si ya existe un chat entre ambos
    chat_existente = (
        Chat.objects
        .filter(participantes=usuario_actual)
        .filter(participantes=otro)
        .first()
    )
    if chat_existente:
        return Response(_serializar_chat(chat_existente, usuario_id), status=200)

    # Crear nuevo chat
    chat = Chat.objects.create()
    chat.participantes.add(usuario_actual, otro)
    return Response(_serializar_chat(chat, usuario_id), status=201)


@api_view(['DELETE'])
def eliminar_chat(request, usuario_id, chat_id):
    try:
        chat    = Chat.objects.get(id=chat_id, participantes__id=usuario_id)
        usuario = Usuario.objects.get(id=usuario_id)
        chat.eliminado_por.add(usuario)
        # Guardar el momento exacto en que se ocultó
        ChatOculto.objects.update_or_create(
            chat=chat, usuario=usuario,
            defaults={'oculto_desde': timezone.now()}
        )
        return Response({'mensaje': 'Chat ocultado'}, status=200)
    except Chat.DoesNotExist:
        return Response({'error': 'Chat no encontrado'}, status=404)

@api_view(['POST'])
def enviar_mensaje(request, chat_id, usuario_id):
    contenido = request.data.get('contenido', '').strip()
    if not contenido:
        return Response({'error': 'Contenido requerido'}, status=400)

    try:
        chat   = Chat.objects.get(id=chat_id, participantes__id=usuario_id)
        emisor = Usuario.objects.get(id=usuario_id)
    except (Chat.DoesNotExist, Usuario.DoesNotExist):
        return Response({'error': 'No encontrado'}, status=404)

    # Al enviar un mensaje, limpiar eliminado_por para todos los participantes
    # para que el chat reaparezca en ambos lados
    chat.eliminado_por.clear()

    mensaje = Mensaje.objects.create(chat=chat, emisor=emisor, contenido=contenido)
    return Response({
        "id":         mensaje.id,
        "contenido":  mensaje.contenido,
        "emisor_id":  mensaje.emisor_id,
        "enviado_en": mensaje.enviado_en.isoformat(),
        "leido":      mensaje.leido,
    }, status=201)

@api_view(['GET'])
def obtener_mensajes(request, chat_id, usuario_id):
    try:
        chat = Chat.objects.get(id=chat_id, participantes__id=usuario_id)
    except Chat.DoesNotExist:
        return Response({'error': 'Chat no encontrado'}, status=404)

    chat.mensajes.filter(leido=False).exclude(emisor_id=usuario_id).update(leido=True)

    # Solo mensajes desde que se reactivó el chat para este usuario
    try:
        ocultacion = ChatOculto.objects.get(chat=chat, usuario_id=usuario_id)
        mensajes = chat.mensajes.filter(enviado_en__gt=ocultacion.oculto_desde)
    except ChatOculto.DoesNotExist:
        mensajes = chat.mensajes.all()

    return Response([
        {
            "id":         m.id,
            "contenido":  m.contenido,
            "emisor_id":  m.emisor_id,
            "enviado_en": m.enviado_en.isoformat(),
            "leido":      m.leido,
        }
        for m in mensajes
    ])