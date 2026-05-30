from django.db import models
from django.conf import settings

class Departamento(models.Model):
    TIPO_RENTA_CHOICES = [
        ('solo_mujeres', 'Solo mujeres'),
        ('solo_hombres', 'Solo hombres'),
        ('mixto', 'Mixto'),
    ]

    titulo         = models.CharField(max_length=200)
    descripcion    = models.TextField(blank=True)
    precio         = models.IntegerField()
    colonia        = models.CharField(max_length=100)
    alcaldia       = models.CharField(max_length=100)
    direccion      = models.CharField(max_length=255)
    tipo_renta     = models.CharField(max_length=20, choices=TIPO_RENTA_CHOICES, default='mixto')
    cuartos        = models.IntegerField(default=1)
    amueblado      = models.BooleanField(default=False)
    pet_friendly   = models.BooleanField(default=False)
    internet       = models.BooleanField(default=False)
    estacionamiento= models.BooleanField(default=False)
    cocina         = models.BooleanField(default=False)
    metro_cercano  = models.CharField(max_length=100, blank=True)
    activo         = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'departamentos'
        ordering     = ['-fecha_creacion']
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'

    def __str__(self):
        return f"{self.titulo} - ${self.precio}/mes"
     
    arrendador    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='departamentos', null=True, blank=True
    )
    inquilino     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='renta_actual', null=True, blank=True
    )
    disponible    = models.BooleanField(default=True)
    rentado_hasta = models.DateField(null=True, blank=True)
    vistas_mes    = models.IntegerField(default=0)
    calificacion  = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)