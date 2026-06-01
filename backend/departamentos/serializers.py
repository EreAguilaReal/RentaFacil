from rest_framework import serializers
from .models import Departamento, Favorito


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

# departamentos/serializers.py
class FavoritoSerializer(serializers.ModelSerializer):
    departamento = DepartamentoSerializer(read_only=True)
    departamento_id = serializers.IntegerField(write_only=True)

    class Meta:
        model  = Favorito
        fields = ["id", "departamento", "departamento_id", "fecha"]