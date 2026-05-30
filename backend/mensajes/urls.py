# mensajes/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('<int:usuario_id>/chats/',                        views.listar_chats),
    path('<int:usuario_id>/chats/crear/',                  views.crear_chat),
    path('<int:usuario_id>/chats/<int:chat_id>/eliminar/', views.eliminar_chat),
    path('<int:usuario_id>/chats/<int:chat_id>/mensajes/', views.obtener_mensajes),
    path('<int:usuario_id>/chats/<int:chat_id>/enviar/',   views.enviar_mensaje),
]