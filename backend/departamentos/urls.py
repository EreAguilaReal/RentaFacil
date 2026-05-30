from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartamentoViewSet
from . import views as dep_views

router = DefaultRouter()
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')

urlpatterns = [
    path('', include(router.urls)),
]

urlpatterns += [
    path('departamentos/por-usuario/', dep_views.departamentos_por_usuario),
]