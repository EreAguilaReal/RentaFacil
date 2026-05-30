# mensajes/models.py
from django.db import models
from usuarios.models import Usuario

# mensajes/models.py
class Chat(models.Model):
    participantes  = models.ManyToManyField(Usuario, related_name='chats')
    creado_en      = models.DateTimeField(auto_now_add=True)
    eliminado_por  = models.ManyToManyField(
        Usuario, related_name='chats_eliminados', blank=True
    )

class ChatOculto(models.Model):
    """Registra desde qué momento el chat fue ocultado para cada usuario."""
    chat       = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='ocultaciones')
    usuario    = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    oculto_desde = models.DateTimeField()

    class Meta:
        unique_together = ('chat', 'usuario')


class Mensaje(models.Model):
    chat      = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='mensajes')
    emisor    = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='mensajes_enviados')
    contenido = models.TextField()
    enviado_en = models.DateTimeField(auto_now_add=True)
    leido     = models.BooleanField(default=False)

    class Meta:
        ordering = ['enviado_en']

    def __str__(self):
        return f"Mensaje de {self.emisor} en Chat {self.chat_id}"