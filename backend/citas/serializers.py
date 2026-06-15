from rest_framework import serializers
from .models import Cita


class CitaSerializer(serializers.ModelSerializer):
    departamento_titulo  = serializers.CharField(source='departamento.titulo',  read_only=True)
    departamento_colonia = serializers.CharField(source='departamento.colonia', read_only=True)
    arrendatario_nombre  = serializers.SerializerMethodField()

    class Meta:
        model  = Cita
        fields = [
            'id', 'departamento', 'departamento_titulo', 'departamento_colonia',
            'arrendatario', 'arrendatario_nombre',
            'dia', 'horario', 'estado',
            'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'estado', 'fecha_creacion', 'fecha_actualizacion']

    def get_arrendatario_nombre(self, obj):
        return f'{obj.arrendatario.nombres} {obj.arrendatario.apellidos}'