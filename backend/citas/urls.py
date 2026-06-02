from django.urls import path
from . import views

urlpatterns = [
    path('agendar/',                        views.agendar_cita,       name='agendar-cita'),
    path('arrendatario/<int:usuario_id>/',  views.citas_arrendatario, name='citas-arrendatario'),
    path('departamento/<int:depa_id>/',     views.citas_departamento, name='citas-departamento'),
    path('<int:cita_id>/cancelar/',         views.cancelar_cita,      name='cancelar-cita'),
    path('<int:cita_id>/responder/',        views.responder_cita,     name='responder-cita'),
    path('<int:cita_id>/cerrar-trato/',     views.cerrar_trato,       name='cerrar-trato'),
    path('<int:cita_id>/',                  views.detalle_cita,       name='detalle-cita'),  # ← nuevo
]