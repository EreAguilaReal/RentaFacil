from rest_framework import viewsets
from .models import Departamento
from .serializers import DepartamentoSerializer

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