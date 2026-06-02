from django.db import models
from django.conf import settings


class Cita(models.Model):
    ESTADO_CHOICES = [
        ('pendiente',  'Pendiente'),
        ('aceptada',   'Aceptada'),
        ('rechazada',  'Rechazada'),
        ('cancelada',  'Cancelada'),
    ]

    departamento = models.ForeignKey(
        'departamentos.Departamento',
        on_delete=models.CASCADE,
        related_name='citas'
    )
    arrendatario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='citas'
    )
    dia     = models.CharField(max_length=20)   # "Lunes", "Martes", etc.
    horario = models.CharField(max_length=30)   # "9:00 - 10:00"
    estado  = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')

    fecha_creacion    = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'citas'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'{self.arrendatario} → {self.departamento} | {self.dia} {self.horario} [{self.estado}]'