from django.contrib import admin
from .models import Departamento

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'precio', 'colonia', 'tipo_renta', 'activo']
    list_filter  = ['tipo_renta', 'amueblado', 'pet_friendly', 'activo']
    search_fields = ['titulo', 'colonia', 'alcaldia']