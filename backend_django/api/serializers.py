"""
SmileLink API — Serializers
ModelSerializers basados en los modelos Django.
Los campos cifrados (nombre, teléfono, dirección) se exponen como texto plano
en la API; el cifrado/descifrado ocurre en las views.
"""
from rest_framework import serializers
from .models import (
    Administrador, Padrino, Nino, PuntoEntrega,
    Evento, Apadrinamiento, Entrega, Solicitud
)
from utils.encryption import descifrar_campo


# ──────────────────────────────────────────────────────────────────────────────
# ADMINISTRADOR
# ──────────────────────────────────────────────────────────────────────────────

class AdministradorSerializer(serializers.ModelSerializer):
    """Serializer para Administrador. Sin campos cifrados."""
    class Meta:
        model   = Administrador
        fields  = ['id', 'nombre', 'email', 'rol', 'activo', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


# ──────────────────────────────────────────────────────────────────────────────
# PADRINO
# ──────────────────────────────────────────────────────────────────────────────

class PadrinoSerializer(serializers.ModelSerializer):
    """
    Serializer para Padrino.
    - nombre, telefono, direccion: campos virtuales (texto plano en API, cifrado en BD)
    - password_hash: write-only, nunca se devuelve en la respuesta
    """
    nombre    = serializers.SerializerMethodField()
    telefono  = serializers.SerializerMethodField()
    direccion = serializers.SerializerMethodField()

    # Campos de escritura (entrada de la API)
    nombre_input    = serializers.CharField(write_only=True, required=False, source='nombre')
    telefono_input  = serializers.CharField(write_only=True, required=False, allow_blank=True)
    direccion_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password        = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = Padrino
        fields = [
            'id', 'nombre', 'nombre_input',
            'email',
            'telefono', 'telefono_input',
            'direccion', 'direccion_input',
            'password',
            'id_google_auth', 'fecha_registro', 'activo',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'fecha_registro', 'created_at', 'updated_at']

    def get_nombre(self, obj):
        return descifrar_campo(obj.nombre_cifrado)

    def get_telefono(self, obj):
        return descifrar_campo(obj.telefono_cifrado)

    def get_direccion(self, obj):
        return descifrar_campo(obj.direccion_cifrada)


class PadrinoListSerializer(serializers.ModelSerializer):
    """Versión liviana para listados (sin descifrar todos los campos)."""
    nombre = serializers.SerializerMethodField()

    class Meta:
        model  = Padrino
        fields = ['id', 'nombre', 'email', 'activo', 'fecha_registro']

    def get_nombre(self, obj):
        return descifrar_campo(obj.nombre_cifrado)


# ──────────────────────────────────────────────────────────────────────────────
# NIÑO
# ──────────────────────────────────────────────────────────────────────────────

class NinoSerializer(serializers.ModelSerializer):
    """
    Serializer para Niño.
    - nombre: campo virtual (texto plano en API, cifrado en BD)
    """
    nombre        = serializers.SerializerMethodField()
    nombre_input  = serializers.CharField(write_only=True, required=False)
    foto          = serializers.SerializerMethodField()

    class Meta:
        model  = Nino
        fields = [
            'id', 'nombre', 'nombre_input', 'foto',
            'edad', 'genero', 'descripcion', 'necesidades',
            'estado_apadrinamiento',
            'id_padrino_actual', 'fecha_apadrinamiento_actual',
            'activo', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_nombre(self, obj):
        return descifrar_campo(obj.nombre_cifrado)

    def get_foto(self, obj):
        from .mongo_client import obtener_foto_nino
        from utils.avatars import generar_url_avatar
        try:
            foto = obtener_foto_nino(obj.pk)
            if not foto:
                nombre = descifrar_campo(obj.nombre_cifrado)
                foto = generar_url_avatar(nombre)
            return foto
        except Exception:
            return ''


class NinoListSerializer(serializers.ModelSerializer):
    """Versión liviana para listados."""
    nombre = serializers.SerializerMethodField()
    foto   = serializers.SerializerMethodField()

    class Meta:
        model  = Nino
        fields = ['id', 'nombre', 'foto', 'edad', 'genero', 'estado_apadrinamiento', 'activo']

    def get_nombre(self, obj):
        return descifrar_campo(obj.nombre_cifrado)

    def get_foto(self, obj):
        from .mongo_client import obtener_foto_nino
        from utils.avatars import generar_url_avatar
        try:
            foto = obtener_foto_nino(obj.pk)
            if not foto:
                nombre = descifrar_campo(obj.nombre_cifrado)
                foto = generar_url_avatar(nombre)
            return foto
        except Exception:
            return ''


# ──────────────────────────────────────────────────────────────────────────────
# PUNTO DE ENTREGA
# ──────────────────────────────────────────────────────────────────────────────

class PuntoEntregaSerializer(serializers.ModelSerializer):
    """Sin campos cifrados."""
    class Meta:
        model  = PuntoEntrega
        fields = [
            'id', 'nombre_punto', 'direccion_fisica',
            'latitud', 'longitud', 'horario_atencion',
            'contacto_referencia', 'estado_punto',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ──────────────────────────────────────────────────────────────────────────────
# EVENTO
# ──────────────────────────────────────────────────────────────────────────────

class EventoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Evento
        fields = [
            'id', 'nombre_evento', 'tipo_evento',
            'fecha_inicio', 'fecha_fin', 'estado_evento',
            'descripcion', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ──────────────────────────────────────────────────────────────────────────────
# APADRINAMIENTO
# ──────────────────────────────────────────────────────────────────────────────

class ApadrinamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Apadrinamiento
        fields = [
            'id', 'id_padrino', 'id_nino', 'id_evento',
            'fecha_inicio', 'fecha_fin',
            'tipo_apadrinamiento', 'estado_apadrinamiento_registro',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'fecha_inicio', 'created_at', 'updated_at']


# ──────────────────────────────────────────────────────────────────────────────
# ENTREGA
# ──────────────────────────────────────────────────────────────────────────────

class EntregaSerializer(serializers.ModelSerializer):
    """
    observaciones: campo virtual texto plano (almacenado cifrado en BD).
    evidencias_nosql: se inyecta desde MongoDB en la view de detalle.
    """
    observaciones   = serializers.SerializerMethodField()
    evidencias_nosql = serializers.SerializerMethodField()

    class Meta:
        model  = Entrega
        fields = [
            'id', 'id_apadrinamiento', 'id_punto_entrega',
            'descripcion_regalo', 'fecha_programada', 'fecha_entrega_real',
            'estado_entrega', 'observaciones',
            'mongo_evidencia_id', 'evidencias_nosql',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'mongo_evidencia_id', 'created_at', 'updated_at']

    def get_observaciones(self, obj):
        from utils.encryption import descifrar_campo
        return descifrar_campo(obj.observaciones_cifradas)

    def get_evidencias_nosql(self, obj):
        # Solo se incluye en el detalle (inyectado desde la view)
        return getattr(obj, '_evidencias_nosql', [])


# ──────────────────────────────────────────────────────────────────────────────
# SOLICITUD
# ──────────────────────────────────────────────────────────────────────────────

class SolicitudSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Solicitud
        fields = [
            'id', 'id_nino', 'id_padrino_interesado', 'id_entrega_asociada',
            'descripcion_solicitud', 'fecha_solicitud', 'fecha_cierre',
            'estado_solicitud', 'mongo_log_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'fecha_solicitud', 'mongo_log_id', 'created_at', 'updated_at']


# ──────────────────────────────────────────────────────────────────────────────
# DASHBOARD KPIs
# ──────────────────────────────────────────────────────────────────────────────

class DashboardKPIsSerializer(serializers.Serializer):
    total_ninos              = serializers.IntegerField()
    ninos_disponibles        = serializers.IntegerField()
    ninos_apadrinados        = serializers.IntegerField()
    total_padrinos           = serializers.IntegerField()
    padrinos_activos         = serializers.IntegerField()
    total_apadrinamientos    = serializers.IntegerField()
    apadrinamientos_activos  = serializers.IntegerField()
    total_entregas           = serializers.IntegerField()
    entregas_completadas     = serializers.IntegerField()
    entregas_pendientes      = serializers.IntegerField()
