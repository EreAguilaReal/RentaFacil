from rest_framework import viewsets
from .models import Departamento
from .serializers import DepartamentoSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

class DepartamentoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DepartamentoSerializer

    def get_queryset(self):
        qs = Departamento.objects.filter(activo=True)
        
        precio_max   = self.request.query_params.get('precio_max')
        tipo_renta   = self.request.query_params.get('tipo_renta')
        pet_friendly = self.request.query_params.get('pet_friendly')
        amueblado    = self.request.query_params.get('amueblado')
        internet     = self.request.query_params.get('internet')
        estacionamiento = self.request.query_params.get('estacionamiento')
        cocina       = self.request.query_params.get('cocina')

        if precio_max:
            qs = qs.filter(precio__lte=precio_max)
        if tipo_renta:
            qs = qs.filter(tipo_renta=tipo_renta)
        if pet_friendly == 'true':
            qs = qs.filter(pet_friendly=True)
        if amueblado == 'true':
            qs = qs.filter(amueblado=True)
        if internet == 'true':
            qs = qs.filter(internet=True)
        if estacionamiento == 'true':
            qs = qs.filter(estacionamiento=True)
        if cocina == 'true':
            qs = qs.filter(cocina=True)

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