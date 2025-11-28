"""
SmileLink API - Serializers
Serializers para todas las entidades del sistema
"""
from rest_framework import serializers
from datetime import date


class NinoSerializer(serializers.Serializer):
    """Serializer para Niño"""
    id_nino = serializers.CharField(read_only=True)
    nombre = serializers.CharField(max_length=200)
    edad = serializers.IntegerField(min_value=0, max_value=18)
    genero = serializers.ChoiceField(choices=['Masculino', 'Femenino'])
    descripcion = serializers.CharField()
    necesidades = serializers.ListField(child=serializers.CharField())
    id_padrino_actual = serializers.CharField(required=False, allow_null=True)
    estado_apadrinamiento = serializers.ChoiceField(
        choices=['Disponible', 'Apadrinado'],
        default='Disponible'
    )
    fecha_apadrinamiento_actual = serializers.DateField(required=False, allow_null=True)


class PadrinoSerializer(serializers.Serializer):
    """Serializer para Padrino"""
    id_padrino = serializers.CharField(read_only=True)
    nombre = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password_hash = serializers.CharField(required=False, write_only=True)
    fecha_registro = serializers.DateField(default=date.today)
    id_google_auth = serializers.CharField(required=False, allow_null=True)
    direccion = serializers.CharField(required=False, allow_blank=True)
    telefono = serializers.CharField(required=False, allow_blank=True)
    historial_apadrinamiento_ids = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )


class ApadrinamientoSerializer(serializers.Serializer):
    """Serializer para Apadrinamiento"""
    id_apadrinamiento = serializers.CharField(required=False)
    id_padrino = serializers.CharField()
    id_nino = serializers.CharField()
    fecha_inicio = serializers.DateField(default=date.today)
    fecha_fin = serializers.DateField(required=False, allow_null=True)
    tipo_apadrinamiento = serializers.ChoiceField(
        choices=['Elección Padrino', 'Asignación Automática', 'Solicitud Niño'],
        default='Elección Padrino'
    )
    estado_apadrinamiento_registro = serializers.ChoiceField(
        choices=['Activo', 'Finalizado'],
        default='Activo'
    )
    entregas_ids = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )


class EntregaSerializer(serializers.Serializer):
    """Serializer para Entrega"""
    id_entrega = serializers.CharField(read_only=True)
    id_apadrinamiento = serializers.CharField()
    descripcion_regalo = serializers.CharField()
    fecha_programada = serializers.DateField()
    fecha_entrega_real = serializers.DateField(required=False, allow_null=True)
    estado_entrega = serializers.ChoiceField(
        choices=['Pendiente', 'En Proceso', 'Entregado'],
        default='Pendiente'
    )
    observaciones = serializers.CharField(required=False, allow_blank=True)
    id_punto_entrega = serializers.CharField()
    evidencia_foto_path = serializers.CharField(required=False, allow_null=True)


class SolicitudRegaloSerializer(serializers.Serializer):
    """Serializer para Solicitud de Regalo"""
    id_solicitud = serializers.CharField(read_only=True)
    id_nino = serializers.CharField()
    id_padrino_interesado = serializers.CharField(required=False, allow_null=True)
    descripcion_solicitud = serializers.CharField()
    fecha_solicitud = serializers.DateField(default=date.today)
    fecha_cierre = serializers.DateField(required=False, allow_null=True)
    estado_solicitud = serializers.ChoiceField(
        choices=['Abierta', 'En Proceso', 'Cumplida'],
        default='Abierta'
    )
    id_entrega_asociada = serializers.CharField(required=False, allow_null=True)


class PuntoEntregaSerializer(serializers.Serializer):
    """Serializer para Punto de Entrega"""
    id_punto_entrega = serializers.CharField(read_only=True)
    nombre_punto = serializers.CharField(max_length=200)
    direccion_fisica = serializers.CharField()
    latitud = serializers.FloatField()
    longitud = serializers.FloatField()
    horario_atencion = serializers.CharField(required=False, allow_blank=True)
    contacto_referencia = serializers.CharField(required=False, allow_blank=True)
    estado_punto = serializers.ChoiceField(
        choices=['Activo', 'Inactivo'],
        default='Activo'
    )


class AdministradorSerializer(serializers.Serializer):
    """Serializer para Administrador"""
    id_admin = serializers.CharField(read_only=True)
    nombre = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password_hash = serializers.CharField(write_only=True)
    fecha_registro = serializers.DateField(default=date.today)
    rol = serializers.ChoiceField(choices=['Gestor', 'Superadmin'])


class EventoSerializer(serializers.Serializer):
    """Serializer para Evento"""
    id_evento = serializers.CharField(read_only=True)
    nombre_evento = serializers.CharField(max_length=200)
    tipo_evento = serializers.ChoiceField(
        choices=['Navidad', 'Día del Niño', 'Otro']
    )
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
    estado_evento = serializers.ChoiceField(
        choices=['Planeado', 'Activo', 'Cerrado'],
        default='Planeado'
    )
    descripcion = serializers.CharField(required=False, allow_blank=True)


class DashboardKPIsSerializer(serializers.Serializer):
    """Serializer para KPIs del Dashboard"""
    total_ninos = serializers.IntegerField()
    ninos_disponibles = serializers.IntegerField()
    ninos_apadrinados = serializers.IntegerField()
    total_padrinos = serializers.IntegerField()
    padrinos_activos = serializers.IntegerField()
    total_apadrinamientos = serializers.IntegerField()
    apadrinamientos_activos = serializers.IntegerField()
    total_entregas = serializers.IntegerField()
    entregas_completadas = serializers.IntegerField()
    entregas_pendientes = serializers.IntegerField()
