from django.urls import path
from . import views

urlpatterns = [
    path('registro/',                       views.registrar_usuario),
    path('login/',                          views.login_usuario),
    path('<int:id>/',                       views.obtener_usuario),
    path('<int:id>/subir-documento/',       views.subir_documento),
    path('<int:id>/editar/',                views.editar_usuario),
    path('<int:id>/cambiar-password/',      views.cambiar_password),
    path('<int:id>/verificar-documento/',   views.verificar_documento),   # nuevo
    path('documentos-pendientes/',          views.documentos_pendientes),  # nuevo
]