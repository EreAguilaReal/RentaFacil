from rest_framework.decorators import api_view
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from .models import Usuario

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
    }, status=status.HTTP_200_OK)