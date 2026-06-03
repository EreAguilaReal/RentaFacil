import calendar
import datetime

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Cita
from .serializers import CitaSerializer
from departamentos.models import Departamento
from usuarios.models import Usuario


def sumar_meses(fecha: datetime.date, meses: int) -> datetime.date:
    mes = fecha.month - 1 + meses
    ano = fecha.year + mes // 12
    mes = mes % 12 + 1
    dia = min(fecha.day, calendar.monthrange(ano, mes)[1])
    return datetime.date(ano, mes, dia)


# ── Arrendatario: agendar cita ────────────────────────────────────
@api_view(['POST'])
def agendar_cita(request):
    arrendatario_id = request.data.get('arrendatario')
    try:
        usuario = Usuario.objects.get(id=arrendatario_id)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=404)

    if usuario.tipo_usuario != 'arrendatario':
        return Response(
            {'error': 'Solo los arrendatarios pueden agendar citas.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = CitaSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Detalle de una cita ───────────────────────────────────────────
@api_view(['GET'])
def detalle_cita(request, cita_id):
    try:
        cita = Cita.objects.get(id=cita_id)
    except Cita.DoesNotExist:
        return Response({'error': 'Cita no encontrada.'}, status=404)
    return Response(CitaSerializer(cita).data)


# ── Arrendatario: listar sus citas ────────────────────────────────
@api_view(['GET'])
def citas_arrendatario(request, usuario_id):
    citas = Cita.objects.filter(
        arrendatario_id=usuario_id
    ).select_related('departamento').exclude(estado='cancelada')
    return Response(CitaSerializer(citas, many=True).data)


# ── Arrendatario: cancelar su cita ───────────────────────────────
@api_view(['PATCH'])
def cancelar_cita(request, cita_id):
    try:
        cita = Cita.objects.get(id=cita_id)
    except Cita.DoesNotExist:
        return Response({'error': 'Cita no encontrada.'}, status=404)

    if cita.estado not in ('pendiente', 'aceptada'):
        return Response({'error': 'No se puede cancelar esta cita.'}, status=400)

    cita.estado = 'cancelada'
    cita.save()
    return Response(CitaSerializer(cita).data)


# ── Arrendador: ver citas de su departamento ──────────────────────
@api_view(['GET'])
def citas_departamento(request, depa_id):
    citas = Cita.objects.filter(
        departamento_id=depa_id
    ).exclude(estado='cancelada').select_related('arrendatario')
    return Response(CitaSerializer(citas, many=True).data)


# ── Arrendador: aceptar o rechazar cita ──────────────────────────
@api_view(['PATCH'])
def responder_cita(request, cita_id):
    try:
        cita = Cita.objects.get(id=cita_id)
    except Cita.DoesNotExist:
        return Response({'error': 'Cita no encontrada.'}, status=404)

    accion = request.data.get('accion')
    if accion not in ('aceptar', 'rechazar'):
        return Response({'error': 'Acción inválida. Usa "aceptar" o "rechazar".'}, status=400)

    if cita.estado != 'pendiente':
        return Response({'error': 'Solo se pueden responder citas pendientes.'}, status=400)

    cita.estado = 'aceptada' if accion == 'aceptar' else 'rechazada'
    cita.save()
    return Response(CitaSerializer(cita).data)


# ── Arrendador: cerrar trato ──────────────────────────────────────
@api_view(['PATCH'])
def cerrar_trato(request, cita_id):
    try:
        cita = Cita.objects.get(id=cita_id)
    except Cita.DoesNotExist:
        return Response({'error': 'Cita no encontrada.'}, status=404)

    if cita.estado != 'aceptada':
        return Response(
            {'error': 'La cita debe estar aceptada para cerrar el trato.'},
            status=400
        )

    depa = cita.departamento
    if not depa.disponible:
        return Response({'error': 'El departamento ya no está disponible.'}, status=400)

    fecha_inicio = request.data.get('fecha_inicio')
    duracion_meses = request.data.get('duracion_meses')
    rentado_hasta = request.data.get('rentado_hasta')

    if fecha_inicio is not None or duracion_meses is not None:
        if fecha_inicio is None or duracion_meses is None:
            return Response(
                {'error': 'Se requieren fecha de inicio y duración en meses.'},
                status=400
            )

        try:
            fecha_inicio_date = datetime.datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return Response(
                {'error': 'Fecha de inicio inválida. Usa el formato YYYY-MM-DD.'},
                status=400
            )

        try:
            duracion_meses = int(duracion_meses)
            if duracion_meses <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {'error': 'Duración inválida. Debe ser un número entero mayor a 0.'},
                status=400
            )

        rentado_hasta_date = sumar_meses(fecha_inicio_date, duracion_meses)
        rentado_hasta = rentado_hasta_date.isoformat()
    elif rentado_hasta:
        try:
            datetime.datetime.strptime(rentado_hasta, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return Response(
                {'error': 'rentado_hasta inválido. Usa el formato YYYY-MM-DD.'},
                status=400
            )
    else:
        return Response(
            {'error': 'Se requieren fecha de inicio y duración para iniciar la renta.'},
            status=400
        )

    depa.disponible = False
    depa.inquilino = cita.arrendatario
    depa.rentado_hasta = rentado_hasta
    depa.save()

    cita.estado = 'cancelada'
    cita.save()

    return Response({
        'mensaje':      'Trato cerrado correctamente.',
        'departamento': depa.id,
        'inquilino':    cita.arrendatario.id,
    })