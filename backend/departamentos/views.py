from rest_framework import viewsets
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import DepartamentoSerializer
from .models import Departamento
from usuarios.models import Usuario


class DepartamentoViewSet(viewsets.ModelViewSet):

    queryset = Departamento.objects.all()

    serializer_class = DepartamentoSerializer

    permission_classes = [AllowAny]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser
    ]

    def perform_create(self, serializer):

        arrendador_id = self.request.data.get("arrendador")

        try:
            arrendador = Usuario.objects.get(id=arrendador_id)
        except Usuario.DoesNotExist:
            arrendador = None

        serializer.save(arrendador=arrendador)

    def get_queryset(self):

        qs = Departamento.objects.filter(
            activo=True
        )

        disponible = self.request.query_params.get(
            'disponible'
        )

        alcaldia = self.request.query_params.get(
            'alcaldia'
        )

        tipo = self.request.query_params.get(
            'tipo_renta'
        )

        if disponible:
            qs = qs.filter(
                disponible=disponible.lower() == 'true'
            )

        if alcaldia:
            qs = qs.filter(
                alcaldia__icontains=alcaldia
            )

        if tipo:
            qs = qs.filter(
                tipo_renta=tipo
            )

        return qs
    
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