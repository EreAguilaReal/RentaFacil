from django.urls import path
from . import views

urlpatterns = [
    path('registro/', views.registrar_usuario),
]