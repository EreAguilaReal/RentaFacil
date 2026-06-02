from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartamentoViewSet
from . import views as dep_views

router = DefaultRouter()
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'departamentos/<int:pk>/galeria/',
        DepartamentoViewSet.as_view({'post': 'subir_imagen_galeria'}),
        name='departamento-galeria-subir'
    ),
    path(
        'departamentos/<int:pk>/galeria/<int:img_id>/',
        DepartamentoViewSet.as_view({'delete': 'eliminar_imagen_galeria'}),
        name='departamento-galeria-eliminar'
    ),
]

urlpatterns += [
    path('departamentos/por-usuario/', dep_views.departamentos_por_usuario),
    path("departamentos/favoritos/<int:usuario_id>/",          dep_views.listar_favoritos),
    path("departamentos/favoritos/<int:usuario_id>/ids/",      dep_views.ids_favoritos),
    path("departamentos/favoritos/<int:usuario_id>/agregar/",  dep_views.agregar_favorito),
    path("departamentos/favoritos/<int:usuario_id>/<int:depa_id>/eliminar/", dep_views.eliminar_favorito),
]