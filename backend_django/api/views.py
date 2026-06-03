"""
SmileLink API — Views
ViewSets completos usando ORM Django (MySQL) + MongoDB para datos semiestructurados.
Todos los campos sensibles se cifran/descifran con Fernet antes de persistir.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password
from django.db import transaction

from .models import (
    Administrador, Padrino, Nino, PuntoEntrega,
    Evento, Apadrinamiento, Entrega, Solicitud
)
from .serializers import (
    AdministradorSerializer,
    PadrinoSerializer, PadrinoListSerializer,
    NinoSerializer, NinoListSerializer,
    PuntoEntregaSerializer, EventoSerializer,
    ApadrinamientoSerializer, EntregaSerializer,
    SolicitudSerializer, DashboardKPIsSerializer,
)
from utils.encryption import cifrar_campo, descifrar_campo
from .mongo_client import (
    guardar_evidencia, obtener_evidencias,
    registrar_bitacora, guardar_carta, registrar_notificacion,
)

import logging
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# NIÑOS
# ──────────────────────────────────────────────────────────────────────────────

class NinosViewSet(viewsets.ViewSet):
    """
    ViewSet para Niños.
    GET    /api/ninos/           → lista (con filtros opcionales por estado)
    POST   /api/ninos/           → crear niño (nombre cifrado con Fernet)
    GET    /api/ninos/{id}/      → detalle con nombre descifrado
    PUT    /api/ninos/{id}/      → actualizar
    PATCH  /api/ninos/{id}/      → actualizar parcialmente
    DELETE /api/ninos/{id}/      → soft-delete (activo=False)
    GET    /api/ninos/disponibles/ → niños con estado=Disponible
    """

    def list(self, request):
        """GET /api/ninos/ — lista todos los niños activos."""
        estado = request.query_params.get('estado')
        qs = Nino.objects.filter(activo=True)
        if estado:
            qs = qs.filter(estado_apadrinamiento=estado)
        serializer = NinoListSerializer(qs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /api/ninos/{id}/ — detalle con nombre descifrado."""
        try:
            nino = Nino.objects.get(pk=pk, activo=True)
        except Nino.DoesNotExist:
            return Response({'error': 'Niño no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = NinoSerializer(nino)
        return Response(serializer.data)

    def create(self, request):
        """POST /api/ninos/ — crear niño cifrando el nombre."""
        data = request.data
        nombre = data.get('nombre', '').strip()
        if not nombre:
            return Response({'error': 'El campo nombre es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        nino = Nino(
            nombre_cifrado        = cifrar_campo(nombre),
            edad                  = data.get('edad'),
            genero                = data.get('genero'),
            descripcion           = data.get('descripcion', ''),
            necesidades           = data.get('necesidades', []),
            estado_apadrinamiento = data.get('estado_apadrinamiento', 'Disponible'),
        )
        try:
            nino.save()
        except Exception as e:
            logger.error(f"Error al crear niño: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        registrar_bitacora(None, 'api_nino', 'CREATE', {'nino_id': nino.pk, 'genero': nino.genero})
        return Response({'id': nino.pk, 'mensaje': 'Niño registrado correctamente'},
                        status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        """PUT /api/ninos/{id}/ — actualización completa."""
        try:
            nino = Nino.objects.get(pk=pk)
        except Nino.DoesNotExist:
            return Response({'error': 'Niño no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'nombre' in data:
            nino.nombre_cifrado = cifrar_campo(data['nombre'])
        if 'edad' in data:
            nino.edad = data['edad']
        if 'genero' in data:
            nino.genero = data['genero']
        if 'descripcion' in data:
            nino.descripcion = data['descripcion']
        if 'necesidades' in data:
            nino.necesidades = data['necesidades']
        if 'estado_apadrinamiento' in data:
            nino.estado_apadrinamiento = data['estado_apadrinamiento']
        if 'activo' in data:
            nino.activo = data['activo']

        nino.save()
        registrar_bitacora(None, 'api_nino', 'UPDATE', {'nino_id': nino.pk})
        return Response(NinoSerializer(nino).data)

    def partial_update(self, request, pk=None):
        """PATCH /api/ninos/{id}/ — actualización parcial."""
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        """DELETE /api/ninos/{id}/ — soft delete."""
        try:
            nino = Nino.objects.get(pk=pk)
        except Nino.DoesNotExist:
            return Response({'error': 'Niño no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        nino.activo = False
        nino.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """GET /api/ninos/disponibles/ — niños listos para apadrinar."""
        ninos = Nino.objects.filter(estado_apadrinamiento='Disponible', activo=True)
        serializer = NinoListSerializer(ninos, many=True)
        return Response(serializer.data)


# ──────────────────────────────────────────────────────────────────────────────
# PADRINOS
# ──────────────────────────────────────────────────────────────────────────────

class PadrinosViewSet(viewsets.ViewSet):
    """
    ViewSet para Padrinos.
    Nombre, teléfono y dirección se cifran con Fernet.
    La contraseña se hashea con Django PBKDF2.
    """

    def list(self, request):
        """GET /api/padrinos/"""
        padrinos = Padrino.objects.filter(activo=True)
        serializer = PadrinoListSerializer(padrinos, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /api/padrinos/{id}/"""
        try:
            padrino = Padrino.objects.get(pk=pk)
        except Padrino.DoesNotExist:
            return Response({'error': 'Padrino no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'id':              padrino.pk,
            'nombre':          descifrar_campo(padrino.nombre_cifrado),
            'email':           padrino.email,
            'telefono':        descifrar_campo(padrino.telefono_cifrado),
            'direccion':       descifrar_campo(padrino.direccion_cifrada),
            'id_google_auth':  padrino.id_google_auth,
            'fecha_registro':  str(padrino.fecha_registro),
            'activo':          padrino.activo,
        })

    def create(self, request):
        """POST /api/padrinos/ — crear padrino con campos cifrados."""
        data    = request.data
        nombre  = data.get('nombre', '').strip()
        email   = data.get('email', '').lower().strip()

        if not nombre or not email:
            return Response({'error': 'nombre y email son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        if Padrino.objects.filter(email=email).exists():
            return Response({'error': 'Este email ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)

        password = data.get('password', '')
        padrino = Padrino(
            nombre_cifrado    = cifrar_campo(nombre),
            email             = email,
            telefono_cifrado  = cifrar_campo(data.get('telefono', '')),
            direccion_cifrada = cifrar_campo(data.get('direccion', '')),
            id_google_auth    = data.get('id_google_auth'),
            password_hash     = make_password(password) if password else '',
        )
        try:
            padrino.save()
        except Exception as e:
            logger.error(f"Error al crear padrino: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        registrar_bitacora(padrino.pk, 'api_padrino', 'CREATE', {'email': email})
        return Response({'id': padrino.pk, 'mensaje': 'Padrino registrado correctamente'},
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        """PATCH /api/padrinos/{id}/"""
        try:
            padrino = Padrino.objects.get(pk=pk)
        except Padrino.DoesNotExist:
            return Response({'error': 'Padrino no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'nombre' in data:
            padrino.nombre_cifrado = cifrar_campo(data['nombre'])
        if 'telefono' in data:
            padrino.telefono_cifrado = cifrar_campo(data['telefono'])
        if 'direccion' in data:
            padrino.direccion_cifrada = cifrar_campo(data['direccion'])
        if 'activo' in data:
            padrino.activo = data['activo']

        padrino.save()
        registrar_bitacora(padrino.pk, 'api_padrino', 'UPDATE', {})
        return Response({'id': padrino.pk, 'mensaje': 'Padrino actualizado'})

    def destroy(self, request, pk=None):
        """DELETE /api/padrinos/{id}/ — soft delete."""
        try:
            padrino = Padrino.objects.get(pk=pk)
        except Padrino.DoesNotExist:
            return Response({'error': 'Padrino no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        padrino.activo = False
        padrino.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ──────────────────────────────────────────────────────────────────────────────
# APADRINAMIENTOS
# ──────────────────────────────────────────────────────────────────────────────

class ApadrinamientosViewSet(viewsets.ViewSet):
    """ViewSet para Apadrinamientos."""

    def list(self, request):
        """GET /api/apadrinamientos/"""
        qs = Apadrinamiento.objects.select_related('id_padrino', 'id_nino', 'id_evento').all()
        estado = request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado_apadrinamiento_registro=estado)
        serializer = ApadrinamientoSerializer(qs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /api/apadrinamientos/{id}/"""
        try:
            ap = Apadrinamiento.objects.select_related('id_padrino', 'id_nino').get(pk=pk)
        except Apadrinamiento.DoesNotExist:
            return Response({'error': 'Apadrinamiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ApadrinamientoSerializer(ap)
        return Response(serializer.data)

    @transaction.atomic
    def create(self, request):
        """POST /api/apadrinamientos/ — crea el vínculo y actualiza estado del niño."""
        data = request.data
        try:
            padrino = Padrino.objects.get(pk=data['id_padrino'])
            nino    = Nino.objects.get(pk=data['id_nino'])
        except Padrino.DoesNotExist:
            return Response({'error': 'Padrino no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Nino.DoesNotExist:
            return Response({'error': 'Niño no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except KeyError as e:
            return Response({'error': f'Campo requerido: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        ap = Apadrinamiento(
            id_padrino              = padrino,
            id_nino                 = nino,
            tipo_apadrinamiento     = data.get('tipo_apadrinamiento', 'Elección Padrino'),
            estado_apadrinamiento_registro = 'Activo',
        )
        if data.get('id_evento'):
            try:
                ap.id_evento = Evento.objects.get(pk=data['id_evento'])
            except Evento.DoesNotExist:
                pass

        ap.save()

        # Actualizar estado del niño
        nino.estado_apadrinamiento       = 'Apadrinado'
        nino.id_padrino_actual           = padrino
        nino.fecha_apadrinamiento_actual = ap.fecha_inicio
        nino.save()

        registrar_bitacora(
            padrino.pk, 'api_apadrinamiento', 'CREATE',
            {'apadrinamiento_id': ap.pk, 'nino_id': nino.pk}
        )
        return Response(
            {'id': ap.pk, 'mensaje': 'Apadrinamiento creado correctamente'},
            status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, pk=None):
        """PATCH /api/apadrinamientos/{id}/"""
        try:
            ap = Apadrinamiento.objects.get(pk=pk)
        except Apadrinamiento.DoesNotExist:
            return Response({'error': 'Apadrinamiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'estado_apadrinamiento_registro' in data:
            ap.estado_apadrinamiento_registro = data['estado_apadrinamiento_registro']
        if 'fecha_fin' in data:
            ap.fecha_fin = data['fecha_fin']
        if 'tipo_apadrinamiento' in data:
            ap.tipo_apadrinamiento = data['tipo_apadrinamiento']
        ap.save()
        return Response(ApadrinamientoSerializer(ap).data)

    def destroy(self, request, pk=None):
        """DELETE /api/apadrinamientos/{id}/ — finaliza el apadrinamiento."""
        try:
            ap = Apadrinamiento.objects.get(pk=pk)
        except Apadrinamiento.DoesNotExist:
            return Response({'error': 'Apadrinamiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        ap.estado_apadrinamiento_registro = 'Finalizado'
        ap.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ──────────────────────────────────────────────────────────────────────────────
# ENTREGAS
# ──────────────────────────────────────────────────────────────────────────────

class EntregasViewSet(viewsets.ViewSet):
    """
    ViewSet para Entregas.
    Las observaciones se cifran con Fernet.
    Las evidencias (fotos) se guardan en MongoDB.
    """

    def list(self, request):
        """GET /api/entregas/"""
        qs = Entrega.objects.select_related('id_apadrinamiento', 'id_punto_entrega').all()
        estado = request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado_entrega=estado)
        serializer = EntregaSerializer(qs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /api/entregas/{id}/ — datos básicos de MySQL."""
        try:
            entrega = Entrega.objects.get(pk=pk)
        except Entrega.DoesNotExist:
            return Response({'error': 'Entrega no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EntregaSerializer(entrega)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def detalle(self, request, pk=None):
        """
        GET /api/entregas/{id}/detalle/
        Consulta distribuida: datos relacionales de MySQL + evidencias de MongoDB.
        """
        try:
            entrega = Entrega.objects.select_related(
                'id_apadrinamiento',
                'id_punto_entrega',
                'id_apadrinamiento__id_padrino',
                'id_apadrinamiento__id_nino'
            ).get(pk=pk)
        except Entrega.DoesNotExist:
            return Response({'error': 'Entrega no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        # Obtener evidencias de MongoDB
        try:
            evidencias = obtener_evidencias(entrega.pk)
        except Exception as e:
            logger.warning(f"No se pudo conectar a MongoDB: {e}")
            evidencias = []

        entrega._evidencias_nosql = evidencias
        serializer = EntregaSerializer(entrega)
        return Response(serializer.data)

    def create(self, request):
        """POST /api/entregas/ — registrar entrega con observaciones cifradas."""
        data = request.data
        try:
            ap     = Apadrinamiento.objects.get(pk=data['id_apadrinamiento'])
            punto  = PuntoEntrega.objects.get(pk=data['id_punto_entrega'])
        except Apadrinamiento.DoesNotExist:
            return Response({'error': 'Apadrinamiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except PuntoEntrega.DoesNotExist:
            return Response({'error': 'Punto de entrega no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except KeyError as e:
            return Response({'error': f'Campo requerido: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        observaciones = data.get('observaciones', '')
        entrega = Entrega(
            id_apadrinamiento      = ap,
            id_punto_entrega       = punto,
            descripcion_regalo     = data.get('descripcion_regalo', ''),
            fecha_programada       = data.get('fecha_programada'),
            estado_entrega         = data.get('estado_entrega', 'Pendiente'),
            observaciones_cifradas = cifrar_campo(observaciones) if observaciones else None,
        )
        try:
            entrega.save()
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        registrar_bitacora(
            ap.id_padrino.pk, 'api_entrega', 'CREATE',
            {'entrega_id': entrega.pk}
        )
        return Response({'id': entrega.pk, 'mensaje': 'Entrega registrada correctamente'},
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        """PATCH /api/entregas/{id}/"""
        try:
            entrega = Entrega.objects.get(pk=pk)
        except Entrega.DoesNotExist:
            return Response({'error': 'Entrega no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'estado_entrega' in data:
            entrega.estado_entrega = data['estado_entrega']
        if 'fecha_entrega_real' in data:
            entrega.fecha_entrega_real = data['fecha_entrega_real']
        if 'observaciones' in data:
            entrega.observaciones_cifradas = cifrar_campo(data['observaciones'])
        entrega.save()
        return Response(EntregaSerializer(entrega).data)

    def destroy(self, request, pk=None):
        """DELETE /api/entregas/{id}/"""
        try:
            entrega = Entrega.objects.get(pk=pk)
        except Entrega.DoesNotExist:
            return Response({'error': 'Entrega no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        entrega.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def evidencia(self, request, pk=None):
        """
        POST /api/entregas/{id}/evidencia/
        Sube evidencia (foto/video) y guarda metadatos en MongoDB.
        El archivo se guarda en MEDIA_ROOT/evidencias/.
        """
        try:
            entrega = Entrega.objects.select_related(
                'id_apadrinamiento__id_padrino',
                'id_apadrinamiento__id_nino'
            ).get(pk=pk)
        except Entrega.DoesNotExist:
            return Response({'error': 'Entrega no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        archivo = request.FILES.get('foto') or request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'Se requiere un archivo (campo: foto o archivo)'},
                            status=status.HTTP_400_BAD_REQUEST)

        import os
        from django.conf import settings as django_settings
        from datetime import datetime, timezone

        # Guardar archivo en disco
        ext        = os.path.splitext(archivo.name)[1].lower()
        nombre_archivo = f"E{pk}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}{ext}"
        ruta_relativa  = f"evidencias/{nombre_archivo}"
        ruta_absoluta  = os.path.join(django_settings.MEDIA_ROOT, 'evidencias', nombre_archivo)

        os.makedirs(os.path.dirname(ruta_absoluta), exist_ok=True)
        with open(ruta_absoluta, 'wb+') as f:
            for chunk in archivo.chunks():
                f.write(chunk)

        # Determinar tipo
        tipo = 'foto' if ext in ['.jpg', '.jpeg', '.png', '.webp'] else \
               'video' if ext in ['.mp4', '.mov', '.avi'] else 'documento'

        descripcion_texto = request.data.get('descripcion', '')
        descripcion_cifrada = cifrar_campo(descripcion_texto) if descripcion_texto else None

        # Guardar metadatos en MongoDB
        mongo_id = guardar_evidencia(
            entrega_id          = entrega.pk,
            apadrinamiento_id   = entrega.id_apadrinamiento.pk,
            nino_id             = entrega.id_apadrinamiento.id_nino.pk,
            tipo                = tipo,
            url_archivo         = f"media/{ruta_relativa}",
            metadatos           = {
                'tamaño_bytes': archivo.size,
                'formato':      ext.lstrip('.').upper(),
                'nombre_original': archivo.name,
            },
            subido_por          = request.data.get('subido_por', 'unknown'),
            descripcion_cifrada = descripcion_cifrada,
        )

        # Guardar ObjectId de MongoDB en MySQL
        entrega.mongo_evidencia_id = mongo_id
        entrega.save()

        return Response({
            'mensaje':         'Evidencia guardada correctamente',
            'mongo_id':        mongo_id,
            'url_archivo':     f"media/{ruta_relativa}",
        }, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────────────────────────────────────
# SOLICITUDES
# ──────────────────────────────────────────────────────────────────────────────

class SolicitudesViewSet(viewsets.ViewSet):
    """ViewSet para Solicitudes de Regalo."""

    def list(self, request):
        qs = Solicitud.objects.select_related('id_nino', 'id_padrino_interesado').all()
        estado = request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado_solicitud=estado)
        return Response(SolicitudSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        try:
            sol = Solicitud.objects.get(pk=pk)
        except Solicitud.DoesNotExist:
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SolicitudSerializer(sol).data)

    def create(self, request):
        data = request.data
        try:
            nino = Nino.objects.get(pk=data['id_nino'])
        except Nino.DoesNotExist:
            return Response({'error': 'Niño no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except KeyError:
            return Response({'error': 'id_nino es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        sol = Solicitud(
            id_nino               = nino,
            descripcion_solicitud = data.get('descripcion_solicitud', ''),
            estado_solicitud      = 'Abierta',
        )
        if data.get('id_padrino_interesado'):
            try:
                sol.id_padrino_interesado = Padrino.objects.get(pk=data['id_padrino_interesado'])
            except Padrino.DoesNotExist:
                pass

        sol.save()

        # Registrar en bitácora MongoDB
        mongo_id = registrar_bitacora(
            nino.pk, 'api_solicitud', 'CREATE',
            {'solicitud_id': sol.pk, 'descripcion': data.get('descripcion_solicitud', '')[:100]}
        )
        sol.mongo_log_id = mongo_id
        sol.save()

        return Response({'id': sol.pk, 'mensaje': 'Solicitud creada correctamente'},
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        try:
            sol = Solicitud.objects.get(pk=pk)
        except Solicitud.DoesNotExist:
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data
        if 'estado_solicitud' in data:
            sol.estado_solicitud = data['estado_solicitud']
        if 'fecha_cierre' in data:
            sol.fecha_cierre = data['fecha_cierre']
        if 'id_padrino_interesado' in data:
            try:
                sol.id_padrino_interesado = Padrino.objects.get(pk=data['id_padrino_interesado'])
            except Padrino.DoesNotExist:
                pass
        sol.save()
        return Response(SolicitudSerializer(sol).data)

    def destroy(self, request, pk=None):
        try:
            sol = Solicitud.objects.get(pk=pk)
        except Solicitud.DoesNotExist:
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        sol.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ──────────────────────────────────────────────────────────────────────────────
# PUNTOS DE ENTREGA
# ──────────────────────────────────────────────────────────────────────────────

class PuntosEntregaViewSet(viewsets.ViewSet):
    """ViewSet para Puntos de Entrega."""

    def list(self, request):
        puntos = PuntoEntrega.objects.filter(estado_punto='Activo')
        return Response(PuntoEntregaSerializer(puntos, many=True).data)

    def retrieve(self, request, pk=None):
        try:
            punto = PuntoEntrega.objects.get(pk=pk)
        except PuntoEntrega.DoesNotExist:
            return Response({'error': 'Punto de entrega no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PuntoEntregaSerializer(punto).data)

    def create(self, request):
        serializer = PuntoEntregaSerializer(data=request.data)
        if serializer.is_valid():
            punto = serializer.save()
            return Response(PuntoEntregaSerializer(punto).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        try:
            punto = PuntoEntrega.objects.get(pk=pk)
        except PuntoEntrega.DoesNotExist:
            return Response({'error': 'Punto de entrega no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PuntoEntregaSerializer(punto, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        try:
            punto = PuntoEntrega.objects.get(pk=pk)
        except PuntoEntrega.DoesNotExist:
            return Response({'error': 'Punto de entrega no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        punto.estado_punto = 'Inactivo'
        punto.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def cercanos(self, request):
        """GET /api/puntos-entrega/cercanos/?lat=&lng=&radio_km="""
        puntos = PuntoEntrega.objects.filter(estado_punto='Activo')
        return Response(PuntoEntregaSerializer(puntos, many=True).data)


# ──────────────────────────────────────────────────────────────────────────────
# EVENTOS
# ──────────────────────────────────────────────────────────────────────────────

class EventosViewSet(viewsets.ViewSet):
    """ViewSet para Eventos."""

    def list(self, request):
        eventos = Evento.objects.all()
        estado  = request.query_params.get('estado')
        if estado:
            eventos = eventos.filter(estado_evento=estado)
        return Response(EventoSerializer(eventos, many=True).data)

    def retrieve(self, request, pk=None):
        try:
            evento = Evento.objects.get(pk=pk)
        except Evento.DoesNotExist:
            return Response({'error': 'Evento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response(EventoSerializer(evento).data)

    def create(self, request):
        serializer = EventoSerializer(data=request.data)
        if serializer.is_valid():
            evento = serializer.save()
            return Response(EventoSerializer(evento).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        try:
            evento = Evento.objects.get(pk=pk)
        except Evento.DoesNotExist:
            return Response({'error': 'Evento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EventoSerializer(evento, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        try:
            evento = Evento.objects.get(pk=pk)
        except Evento.DoesNotExist:
            return Response({'error': 'Evento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        evento.estado_evento = 'Cerrado'
        evento.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ──────────────────────────────────────────────────────────────────────────────
# ADMINISTRADORES
# ──────────────────────────────────────────────────────────────────────────────

class AdministradoresViewSet(viewsets.ViewSet):
    """ViewSet para Administradores."""

    def list(self, request):
        admins = Administrador.objects.filter(activo=True)
        return Response(AdministradorSerializer(admins, many=True).data)

    def retrieve(self, request, pk=None):
        try:
            admin = Administrador.objects.get(pk=pk)
        except Administrador.DoesNotExist:
            return Response({'error': 'Administrador no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdministradorSerializer(admin).data)

    def create(self, request):
        serializer = AdministradorSerializer(data=request.data)
        if serializer.is_valid():
            admin = serializer.save()
            registrar_bitacora(admin.pk, 'api_administrador', 'CREATE', {'email': admin.email})
            return Response(AdministradorSerializer(admin).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        try:
            admin = Administrador.objects.get(pk=pk)
        except Administrador.DoesNotExist:
            return Response({'error': 'Administrador no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdministradorSerializer(admin, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        try:
            admin = Administrador.objects.get(pk=pk)
        except Administrador.DoesNotExist:
            return Response({'error': 'Administrador no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        admin.activo = False
        admin.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ──────────────────────────────────────────────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────────────────────────────────────────────

class DashboardViewSet(viewsets.ViewSet):
    """ViewSet para Dashboard KPIs — consulta MySQL directamente."""

    @action(detail=False, methods=['get'])
    def kpis(self, request):
        """GET /api/dashboard/kpis/ — métricas generales del sistema."""
        kpis = {
            'total_ninos':             Nino.objects.filter(activo=True).count(),
            'ninos_disponibles':       Nino.objects.filter(activo=True, estado_apadrinamiento='Disponible').count(),
            'ninos_apadrinados':       Nino.objects.filter(activo=True, estado_apadrinamiento='Apadrinado').count(),
            'total_padrinos':          Padrino.objects.filter(activo=True).count(),
            'padrinos_activos':        Padrino.objects.filter(
                                           activo=True,
                                           apadrinamientos__estado_apadrinamiento_registro='Activo'
                                       ).distinct().count(),
            'total_apadrinamientos':   Apadrinamiento.objects.count(),
            'apadrinamientos_activos': Apadrinamiento.objects.filter(estado_apadrinamiento_registro='Activo').count(),
            'total_entregas':          Entrega.objects.count(),
            'entregas_completadas':    Entrega.objects.filter(estado_entrega='Entregado').count(),
            'entregas_pendientes':     Entrega.objects.filter(estado_entrega='Pendiente').count(),
        }
        serializer = DashboardKPIsSerializer(kpis)
        return Response(serializer.data)
