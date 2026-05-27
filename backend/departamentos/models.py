from django.db import models

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