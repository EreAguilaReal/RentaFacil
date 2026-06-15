import os 
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.conf import settings
from .models import Usuario
from departamentos.models import Departamento
from citas.models import Cita

def puede_eliminar_usuario(usuario):
    if usuario.tipo_usuario == 'arrendador':
        return not Departamento.objects.filter(arrendador=usuario).exists()

    if usuario.tipo_usuario == 'arrendatario':
        tiene_citas = Cita.objects.filter(arrendatario=usuario, estado__in=['pendiente', 'aceptada']).exists()
        tiene_rentado = Departamento.objects.filter(inquilino=usuario).exists()
        return not (tiene_citas or tiene_rentado)

    return True


@api_view(['GET', 'DELETE', 'PATCH'])
def obtener_usuario(request, id):
    try:
        usuario = Usuario.objects.get(id=id)
        if request.method == 'PATCH':
            for campo in ['nombres', 'apellidos', 'nombre_usuario',
                        'fecha_nacimiento', 'genero', 'tipo_documento','telefono','whatsapp','sitio_web',]:
                if campo in request.data:
                    setattr(usuario, campo, request.data[campo])

            usuario.save()
            return Response(
                {'mensaje': 'Datos actualizados correctamente'},
                status=200
            )
        if request.method == 'DELETE':
            if not puede_eliminar_usuario(usuario):
                return Response(
                    {'error': 'No se puede eliminar la cuenta mientras haya datos asociados.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            usuario.delete()
            return Response({'mensaje': 'Usuario eliminado correctamente'}, status=status.HTTP_200_OK)

        tiene_departamentos = Departamento.objects.filter(arrendador=usuario).exists()
        tiene_citas = Cita.objects.filter(arrendatario=usuario, estado__in=['pendiente', 'aceptada']).exists()
        tiene_departamento_rentado = Departamento.objects.filter(inquilino=usuario).exists()
        puede_eliminar = puede_eliminar_usuario(usuario)

        return Response({
            'id':                      usuario.id,
            'nombre_usuario':          usuario.nombre_usuario,
            'nombres':                 usuario.nombres,
            'apellidos':               usuario.apellidos,
            'correo_electronico':      usuario.correo_electronico,
            'fecha_nacimiento':        str(usuario.fecha_nacimiento),
            'genero':                  usuario.genero,
            'tipo_usuario':            usuario.tipo_usuario,
            'tipo_documento':          usuario.tipo_documento,
            'documento_verificacion':  usuario.documento_verificacion.url
                if usuario.documento_verificacion else None,
            'verificado': usuario.verificado,
            'estado_verificacion': usuario.estado_verificacion,
            'tiene_departamentos': tiene_departamentos,
            'tiene_citas': tiene_citas,
            'tiene_departamento_rentado': tiene_departamento_rentado,
            'puede_eliminar_cuenta': puede_eliminar,
            'telefono': usuario.telefono,
            'whatsapp': usuario.whatsapp,
            'sitio_web': usuario.sitio_web,
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

        tipo_documento = request.data.get('tipo_documento') or request.data.get('documento_tipo')
        if tipo_documento is not None:
            usuario.tipo_documento = tipo_documento

        usuario.save()
        return Response({
            'mensaje': 'Operación exitosa',
            'tipo_documento': usuario.tipo_documento,
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
            tipo_documento     = data.get('tipo_documento') or data.get('documento_tipo'),
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
    'tipo_documento':          usuario.tipo_documento,
    'documento_verificacion':  str(usuario.documento_verificacion) if usuario.documento_verificacion else None,
    'verificado': usuario.verificado,
    'estado_verificacion': usuario.estado_verificacion,
    'telefono': usuario.telefono,
    'whatsapp': usuario.whatsapp,
    'sitio_web': usuario.sitio_web,
    }, status=status.HTTP_200_OK)

@api_view(['PATCH'])
def editar_usuario(request, id):
    try:
        usuario = Usuario.objects.get(id=id)
        campos_editables = ['nombres', 'apellidos', 'nombre_usuario', 'fecha_nacimiento', 'genero', 'tipo_documento','telefono','whatsapp','sitio_web',]
        
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
    accion = request.data.get('accion')
    if accion not in ('aprobar', 'rechazar'):
        return Response({'error': 'Acción inválida'}, status=400)

    try:
        usuario = Usuario.objects.get(id=id)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=404)

    if accion == 'aprobar':
        usuario.verificado           = True
        usuario.estado_verificacion  = 'aprobado'
    else:
        if usuario.documento_verificacion:
            ruta = os.path.join(settings.MEDIA_ROOT, str(usuario.documento_verificacion))
            if os.path.exists(ruta):
                os.remove(ruta)
        usuario.documento_verificacion = None
        usuario.verificado             = False
        usuario.estado_verificacion    = 'rechazado'

    usuario.save()
    return Response({'mensaje': f'Documento {accion}do correctamente'}, status=200)


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
            'tipo_documento': u.tipo_documento,
            'url':           u.documento_verificacion.url if u.documento_verificacion else None,
        }
        for u in usuarios
    ]
    return Response(data, status=status.HTTP_200_OK)