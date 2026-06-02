from rest_framework import viewsets
from rest_framework import status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from usuarios.models import Usuario
from .models import Departamento, ImagenDepartamento, Favorito
from .serializers import DepartamentoSerializer, ImagenDepartamentoSerializer, FavoritoSerializer


def to_bool(val):
    """Convierte 'true'/'false' (string de FormData) a booleano real."""
    return str(val).lower() == "true"


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # ── Contexto con request para que SerializerMethodField construya URLs absolutas ──
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        arrendador_id = self.request.data.get("arrendador")
        try:
            arrendador = Usuario.objects.get(id=arrendador_id)
        except Usuario.DoesNotExist:
            arrendador = None
        serializer.save(
            arrendador=arrendador,
            activo=True,
            disponible=True,
            amueblado=to_bool(self.request.data.get("amueblado",       False)),   # ← strings → bool
            internet=to_bool(self.request.data.get("internet",         False)),
            estacionamiento=to_bool(self.request.data.get("estacionamiento", False)),
            pet_friendly=to_bool(self.request.data.get("pet_friendly", False)),
            cocina=to_bool(self.request.data.get("cocina",             False)),
        )

    def get_queryset(self):
        qs = Departamento.objects.filter(activo=True)

        arrendador_id = self.request.query_params.get('arrendador')
        inquilino_id  = self.request.query_params.get('inquilino')
        disponible    = self.request.query_params.get('disponible')
        alcaldia      = self.request.query_params.get('alcaldia')
        tipo          = self.request.query_params.get('tipo_renta')

        if arrendador_id:
            qs = qs.filter(arrendador_id=arrendador_id)
        if inquilino_id:
            qs = qs.filter(inquilino_id=inquilino_id)
        if disponible:
            qs = qs.filter(disponible=disponible.lower() == 'true')
        if alcaldia:
            qs = qs.filter(alcaldia__icontains=alcaldia)
        if tipo:
            qs = qs.filter(tipo_renta=tipo)

        return qs

    def destroy(self, request, *args, **kwargs):
        depa = self.get_object()
        if not depa.disponible:
            return Response(
                {"error": "No puedes eliminar un departamento con renta activa."},
                status=status.HTTP_400_BAD_REQUEST
            )
        depa.activo = False  # borrado lógico
        depa.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["POST"], url_path="galeria",
            parser_classes=[MultiPartParser, FormParser])
    def subir_imagen_galeria(self, request, pk=None):
        try:
            depa = Departamento.objects.get(pk=pk)
        except Departamento.DoesNotExist:
            return Response({"error": "Departamento no encontrado."}, status=404)

        if depa.total_imagenes() >= 10:
            return Response(
                {"error": "Límite de 10 imágenes alcanzado."},
                status=status.HTTP_400_BAD_REQUEST
            )
        imagen = request.FILES.get("imagen")
        if not imagen:
            return Response(
                {"error": "No se envió ninguna imagen."},
                status=status.HTTP_400_BAD_REQUEST
            )
        img = ImagenDepartamento.objects.create(
            departamento=depa,
            imagen=imagen,
            orden=depa.galeria.count()
        )
        return Response(
            ImagenDepartamentoSerializer(img, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["DELETE"],
            url_path="galeria/(?P<img_id>[^/.]+)",
            url_name="galeria-eliminar")
    def eliminar_imagen_galeria(self, request, pk=None, img_id=None):
        try:
            depa = Departamento.objects.get(pk=pk)
        except Departamento.DoesNotExist:
            return Response({"error": "Departamento no encontrado."}, status=404)
        try:
            img = ImagenDepartamento.objects.get(id=int(img_id), departamento=depa)
        except ImagenDepartamento.DoesNotExist:
            return Response({"error": "Imagen no encontrada."}, status=404)
        img.imagen.delete(save=False)
        img.delete()
        for i, im in enumerate(depa.galeria.all()):
            im.orden = i
            im.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Vistas funcionales ────────────────────────────────────────────

@api_view(['GET'])
def departamentos_por_usuario(request):
    arrendador_id = request.query_params.get('arrendador')
    inquilino_id  = request.query_params.get('inquilino')

    if arrendador_id:
        qs = Departamento.objects.filter(arrendador_id=arrendador_id, activo=True)
    elif inquilino_id:
        qs = Departamento.objects.filter(inquilino_id=inquilino_id, activo=True)
    else:
        return Response({'error': 'Parámetro arrendador o inquilino requerido'}, status=400)

    data = [
        {
            'id':               d.id,
            'titulo':           d.titulo,
            'colonia':          d.colonia,
            'disponible':       d.disponible,
            'precio':           d.precio,
            'vistas_mes':       d.vistas_mes,
            'calificacion':     float(d.calificacion) if d.calificacion else None,
            'rentado_hasta':    str(d.rentado_hasta) if d.rentado_hasta else None,
            'inquilino_nombre': str(d.inquilino) if d.inquilino else None,
        }
        for d in qs
    ]
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
def listar_favoritos(request, usuario_id):
    favs = Favorito.objects.filter(usuario_id=usuario_id).select_related("departamento")
    data = FavoritoSerializer(favs, many=True, context={"request": request}).data
    return Response(data)


@api_view(["POST"])
def agregar_favorito(request, usuario_id):
    depa_id = request.data.get("departamento_id")
    if not depa_id:
        return Response({"error": "departamento_id requerido"}, status=400)
    fav, creado = Favorito.objects.get_or_create(
        usuario_id=usuario_id,
        departamento_id=depa_id
    )
    return Response(
        {"mensaje": "Agregado" if creado else "Ya estaba en favoritos"},
        status=201 if creado else 200
    )


@api_view(["DELETE"])
def eliminar_favorito(request, usuario_id, depa_id):
    eliminados, _ = Favorito.objects.filter(
        usuario_id=usuario_id,
        departamento_id=depa_id
    ).delete()
    if eliminados:
        return Response({"mensaje": "Eliminado"})
    return Response({"error": "No encontrado"}, status=404)


@api_view(["GET"])
def ids_favoritos(request, usuario_id):
    ids = Favorito.objects.filter(usuario_id=usuario_id).values_list(
        "departamento_id", flat=True
    )
    return Response(list(ids))