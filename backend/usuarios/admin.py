# usuarios/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    ordering     = ('correo_electronico',)
    list_display = ('correo_electronico', 'nombre_usuario', 'tipo_usuario', 'is_active', 'is_staff')

    fieldsets = (
        (None,            {'fields': ('correo_electronico', 'password')}),
        ('Información',   {'fields': ('nombre_usuario', 'nombres', 'apellidos',
                                      'fecha_nacimiento', 'genero', 'tipo_usuario',
                                      'documento_verificacion')}),
        ('Permisos',      {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas',        {'fields': ('last_login',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('correo_electronico', 'nombre_usuario', 'nombres',
                        'apellidos', 'password1', 'password2'),
        }),
    )