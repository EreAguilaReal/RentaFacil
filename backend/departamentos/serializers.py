from rest_framework import serializers
from .models import Departamento, ImagenDepartamento, Favorito


class ImagenDepartamentoSerializer(serializers.ModelSerializer):
    imagen = serializers.SerializerMethodField()

    class Meta:
        model  = ImagenDepartamento
        fields = ["id", "imagen", "orden"]

    def get_imagen(self, obj):
        request = self.context.get("request")
        if obj.imagen and request:
            return request.build_absolute_uri(obj.imagen.url)
        return None


class DepartamentoSerializer(serializers.ModelSerializer):
    galeria          = ImagenDepartamentoSerializer(many=True, read_only=True)
    imagen_principal = serializers.ImageField(required=False, allow_null=True, use_url=True)
    inquilino_nombre = serializers.SerializerMethodField()
    arrendador_nombre = serializers.SerializerMethodField()

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
            'imagen_principal',  # ← reemplaza 'imagen'
            'galeria',           # ← nuevo
            'activo',
            'arrendador',
            'inquilino',
            'disponible',
            'rentado_hasta',
            'vistas_mes',
            'calificacion',
            'latitud', 
            'longitud', 
            'fecha_creacion',
            'fecha_actualizacion',
            'inquilino_nombre',
            'arrendador_nombre',
            "direccion",
            "colonia",
            "alcaldia",

            "latitud",
            "longitud",
        ]
        read_only_fields = [
            'id',
            'fecha_creacion',
            'fecha_actualizacion',
            'vistas_mes',
            'galeria',
            'inquilino_nombre',
        ]

    def get_inquilino_nombre(self, obj):
        return str(obj.inquilino) if obj.inquilino else None
    def get_arrendador_nombre(self, obj):
        if obj.arrendador:
            return f"{obj.arrendador.nombres} {obj.arrendador.apellidos}"
        return ""

class FavoritoSerializer(serializers.ModelSerializer):
    departamento    = DepartamentoSerializer(read_only=True)
    departamento_id = serializers.IntegerField(write_only=True)

    class Meta:
        model  = Favorito
        fields = ["id", "departamento", "departamento_id", "fecha"]