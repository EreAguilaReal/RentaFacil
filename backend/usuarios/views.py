import os 
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.conf import settings
from .models import Usuario

@api_view(['GET'])
def obtener_usuario(request, id):
    try:
        usuario = Usuario.objects.get(id=id)
        return Response({
            'id':                      usuario.id,
            'nombre_usuario':          usuario.nombre_usuario,
            'nombres':                 usuario.nombres,
            'apellidos':               usuario.apellidos,
            'correo_electronico':      usuario.correo_electronico,
            'fecha_nacimiento':        str(usuario.fecha_nacimiento),
            'genero':                  usuario.genero,
            'tipo_usuario':            usuario.tipo_usuario,
            'documento_verificacion':  usuario.documento_verificacion.url
                if usuario.documento_verificacion else None,
            'verificado': usuario.verificado,
        })
    except Usuario.DoesNotExist:
        return Response({'error': 'No encontrado'}, status=404)

@api_view(['PATCH'])
def subir_documento(request, id):
    try:
        usuario = Usuario.objects.get(id=id)

        if 'documento_verificacion' in request.FILES:
            # Eliminar archivo anterior si existe
            if usuario.documento_verificacion:
                ruta_anterior = os.path.join(settings.MEDIA_ROOT, str(usuario.documento_verificacion))
                if os.path.exists(ruta_anterior):
                    os.remove(ruta_anterior)

            usuario.documento_verificacion = request.FILES['documento_verificacion']

        else:
            # Eliminar archivo al recibir null
            if usuario.documento_verificacion:
                ruta = os.path.join(settings.MEDIA_ROOT, str(usuario.documento_verificacion))
                if os.path.exists(ruta):
                    os.remove(ruta)
            usuario.documento_verificacion = None

        usuario.save()
        return Response({
            'mensaje': 'Operación exitosa',
            'documento_verificacion': usuario.documento_verificacion.url
                if usuario.documento_verificacion else None,
        }, status=status.HTTP_200_OK)

    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['POST'])
def registrar_usuario(request):
    data = request.data

    # Verificar que el correo no exista
    if Usuario.objects.filter(correo_electronico=data.get('correo_electronico')).exists():
        return Response({'error': 'El correo ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)

    # Verificar que el nombre de usuario no exista
    if Usuario.objects.filter(nombre_usuario=data.get('nombre_usuario')).exists():
        return Response({'error': 'El nombre de usuario ya está en uso'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        usuario = Usuario.objects.create_user(
            correo_electronico = data['correo_electronico'],
            password           = data['password'],
            nombre_usuario     = data['nombre_usuario'],
            nombres            = data['nombres'],
            apellidos          = data['apellidos'],
            fecha_nacimiento   = data['fecha_nacimiento'],
            genero             = data['genero'],
            tipo_usuario       = data['tipo_usuario'],
        )
        return Response({'mensaje': 'Usuario creado exitosamente'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
def login_usuario(request):
    correo    = request.data.get('correo_electronico')
    password  = request.data.get('password')

    if not correo or not password:
        return Response(
            {'error': 'Correo y contraseña son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    usuario = authenticate(request, username=correo, password=password)

    if usuario is None:
        return Response(
            {'error': 'Correo o contraseña incorrectos'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not usuario.is_active:
        return Response(
            {'error': 'Esta cuenta está desactivada'},
            status=status.HTTP_403_FORBIDDEN
        )

    return Response({
    'mensaje':                 'Login exitoso',
    'id':                      usuario.id,
    'nombre_usuario':          usuario.nombre_usuario,
    'nombres':                 usuario.nombres,
    'apellidos':               usuario.apellidos,
    'correo_electronico':      usuario.correo_electronico,
    'fecha_nacimiento':        str(usuario.fecha_nacimiento),
    'genero':                  usuario.genero,
    'tipo_usuario':            usuario.tipo_usuario,
    'documento_verificacion':  str(usuario.documento_verificacion) if usuario.documento_verificacion else None,
    'verificado': usuario.verificado,
    }, status=status.HTTP_200_OK)

@api_view(['PATCH'])
def editar_usuario(request, id):
    try:
        usuario = Usuario.objects.get(id=id)
        campos_editables = ['nombres', 'apellidos', 'nombre_usuario', 'fecha_nacimiento', 'genero']
        
        for campo in campos_editables:
            if campo in request.data:
                setattr(usuario, campo, request.data[campo])
        
        usuario.save()
        return Response({'mensaje': 'Datos actualizados correctamente'}, status=status.HTTP_200_OK)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
# usuarios/views.py — agregar esta función
@api_view(['PATCH'])
def cambiar_password(request, id):
    password_actual = request.data.get('password_actual')
    password_nueva  = request.data.get('password_nueva')

    if not password_actual or not password_nueva:
        return Response({'error': 'Ambos campos son obligatorios'}, status=400)

    if len(password_nueva) < 8:
        return Response({'error': 'La nueva contraseña debe tener al menos 8 caracteres'}, status=400)

    try:
        usuario = Usuario.objects.get(id=id)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=404)

    if not usuario.check_password(password_actual):
        return Response({'error': 'La contraseña actual es incorrecta'}, status=400)

    usuario.set_password(password_nueva)
    usuario.save()
    return Response({'mensaje': 'Contraseña actualizada correctamente'}, status=200)

# ── Verificar documento (Staff) ───────────────────────────────────
@api_view(['PATCH'])
def verificar_documento(request, id):
    accion = request.data.get('accion')  # "aprobar" | "rechazar"
    if accion not in ('aprobar', 'rechazar'):
        return Response({'error': 'Acción inválida'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        usuario = Usuario.objects.get(id=id)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if accion == 'aprobar':
        usuario.verificado = True
        # Conserva el archivo como evidencia, solo marca verificado
    else:
        # Rechazar: elimina el documento y deja al usuario volver a subir uno
        if usuario.documento_verificacion:
            ruta = os.path.join(settings.MEDIA_ROOT, str(usuario.documento_verificacion))
            if os.path.exists(ruta):
                os.remove(ruta)
        usuario.documento_verificacion = None
        usuario.verificado = False

    usuario.save()
    return Response({'mensaje': f'Documento {accion}do correctamente'}, status=status.HTTP_200_OK)


# ── Documentos pendientes (Staff) ─────────────────────────────────
@api_view(['GET'])
def documentos_pendientes(request):
    """Usuarios que tienen documento subido pero aún no están verificados."""
    usuarios = Usuario.objects.filter(
        documento_verificacion__isnull=False,
        verificado=False,
    ).exclude(documento_verificacion='')

    data = [
        {
            'id':            u.id,
            'usuario_nombre': f'{u.nombres} {u.apellidos}',
            'tipo_usuario':  u.tipo_usuario,
            'url':           u.documento_verificacion.url if u.documento_verificacion else None,
        }
        for u in usuarios
    ]
    return Response(data, status=status.HTTP_200_OK)