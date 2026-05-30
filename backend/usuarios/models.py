from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UsuarioManager(BaseUserManager):
    def create_user(self, correo_electronico, password=None, **extra_fields):
        if not correo_electronico:
            raise ValueError('El correo electrónico es obligatorio')
        correo_electronico = self.normalize_email(correo_electronico)
        user = self.model(correo_electronico=correo_electronico, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo_electronico, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(correo_electronico, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):

    GENERO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
        ('P', 'Prefiero no decirlo'),
    ]

    TIPO_USUARIO_CHOICES = [
        ('admin',     'Administrador'),
        ('arrendatario',   'Arrendatario'),
        ('arrendador',  'Arrendador'),
    ]

    correo_electronico     = models.EmailField(unique=True)
    nombre_usuario         = models.CharField(max_length=50, unique=True)
    nombres                = models.CharField(max_length=100)
    apellidos              = models.CharField(max_length=100)
    fecha_nacimiento       = models.DateField(null=True, blank=True)
    genero                 = models.CharField(max_length=1, choices=GENERO_CHOICES, blank=True)
    tipo_usuario           = models.CharField(max_length=20, choices=TIPO_USUARIO_CHOICES, default='arrendatario')
    documento_verificacion = models.FileField(upload_to='documentos/', null=True, blank=True)

    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UsuarioManager()

    USERNAME_FIELD  = 'correo_electronico'   # campo usado para login
    REQUIRED_FIELDS = ['nombre_usuario', 'nombres', 'apellidos']

    class Meta:
        verbose_name        = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.nombre_usuario} <{self.correo_electronico}>'