from django.urls import path
from . import views

urlpatterns = [
    path('registro/', views.registrar_usuario),
    path('login/',    views.login_usuario),
    path('<int:id>/subir-documento/', views.subir_documento),
]