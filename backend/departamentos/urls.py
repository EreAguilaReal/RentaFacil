from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartamentoViewSet

router = DefaultRouter()
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')

urlpatterns = [
    path('', include(router.urls)),
]