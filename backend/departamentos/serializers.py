from rest_framework import serializers
from .models import Departamento


class DepartamentoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Departamento

        fields = [
            'id',
            'titulo',
            'descripcion',
            'precio',
            'colonia',
            'alcaldia',
            'direccion',
            'tipo_renta',
            'cuartos',
            'amueblado',
            'pet_friendly',
            'internet',
            'estacionamiento',
            'cocina',
            'metro_cercano',
            'imagen',
            'activo',
            'arrendador',
            'inquilino',
            'disponible',
            'rentado_hasta',
            'vistas_mes',
            'calificacion',
            'fecha_creacion',
            'fecha_actualizacion',
        ]

        read_only_fields = [
            'id',
            'fecha_creacion',
            'fecha_actualizacion',
            'vistas_mes',
        ]