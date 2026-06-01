from rest_framework import viewsets
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import DepartamentoSerializer, FavoritoSerializer
from .models import Departamento, Favorito
from usuarios.models import Usuario


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser,FormParser,JSONParser]
    def perform_create(self, serializer):
        arrendador_id = self.request.data.get("arrendador")
        try:
            arrendador = Usuario.objects.get(id=arrendador_id)
        except Usuario.DoesNotExist:
            arrendador = None
        serializer.save(arrendador=arrendador)
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
        depa.activo = False   # borrado lógico
        depa.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
def departamentos_por_usuario(request):
    """
    ?arrendador=<id>  → depas del arrendador
    ?inquilino=<id>   → depa(s) del arrendatario
    """
    from departamentos.models import Departamento  # ajusta el import a tu app

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
            'id':              d.id,
            'titulo':          d.titulo,
            'colonia':         d.colonia,
            'disponible':      d.disponible,
            'precio':          d.precio,
            'vistas_mes':      d.vistas_mes,
            'calificacion':    float(d.calificacion) if d.calificacion else None,
            'rentado_hasta':   str(d.rentado_hasta) if d.rentado_hasta else None,
            'inquilino_nombre': str(d.inquilino) if d.inquilino else None,
        }
        for d in qs
    ]
    return Response(data, status=status.HTTP_200_OK)

@api_view(["GET"])
def listar_favoritos(request, usuario_id):
    favs = Favorito.objects.filter(usuario_id=usuario_id).select_related("departamento")
    data = FavoritoSerializer(favs, many=True).data
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
    """Devuelve solo los IDs para saber rápido cuáles están en favoritos."""
    ids = Favorito.objects.filter(usuario_id=usuario_id).values_list(
        "departamento_id", flat=True
    )
    return Response(list(ids))