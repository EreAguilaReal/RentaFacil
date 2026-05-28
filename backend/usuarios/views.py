from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
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