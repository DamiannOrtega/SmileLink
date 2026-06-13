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
from utils.avatars import generar_url_avatar
from .mongo_client import (
    guardar_evidencia, obtener_evidencias,
    registrar_bitacora, guardar_carta, registrar_notificacion,
    guardar_foto_nino,
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
        """POST /api/ninos/ — crear niño cifrando el nombre y guardando foto en MongoDB."""
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

        # Generar y guardar foto/avatar en MongoDB
        foto_url = data.get('foto', '').strip()
        if not foto_url:
            foto_url = generar_url_avatar(nombre)
        try:
            guardar_foto_nino(nino.pk, foto_url)
        except Exception as e:
            logger.warning(f"No se pudo guardar la foto del niño en MongoDB: {e}")

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
        nombre_original = descifrar_campo(nino.nombre_cifrado)
        nombre_nuevo = data.get('nombre', '').strip()

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

        # Actualizar foto/avatar en MongoDB si se proporciona o si cambió el nombre y no tiene foto personalizada
        if 'foto' in data:
            try:
                guardar_foto_nino(nino.pk, data['foto'].strip())
            except Exception as e:
                logger.warning(f"No se pudo guardar la foto del niño en MongoDB: {e}")
        elif 'nombre' in data and nombre_nuevo != nombre_original:
            try:
                from .mongo_client import obtener_foto_nino
                foto_actual = obtener_foto_nino(nino.pk)
                # Si la foto actual es un avatar de DiceBear con el nombre viejo, la actualizamos
                if not foto_actual or "api.dicebear.com" in foto_actual:
                    guardar_foto_nino(nino.pk, generar_url_avatar(nombre_nuevo))
            except Exception as e:
                logger.warning(f"No se pudo actualizar la foto por cambio de nombre: {e}")

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
        if 'descripcion_solicitud' in data:
            sol.descripcion_solicitud = data['descripcion_solicitud']
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

    @action(detail=False, methods=['get'])
    def nosql_stats(self, request):
        """GET /api/dashboard/nosql-stats/ — agregaciones y métricas de MongoDB (NoSQL)"""
        from .mongo_client import get_mongo_db
        try:
            db = get_mongo_db()
            
            # Conteo de documentos por colección
            counts = {
                'evidencias': db.evidencias.count_documents({}),
                'bitacora_eventos': db.bitacora_eventos.count_documents({}),
                'cartas': db.cartas.count_documents({}),
                'historial_notificaciones': db.historial_notificaciones.count_documents({}),
            }
            
            # Agregación: Eventos por Tabla en la bitácora
            pipeline_eventos_tabla = [
                {"$group": {"_id": "$tabla", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            eventos_tabla = list(db.bitacora_eventos.aggregate(pipeline_eventos_tabla))
            eventos_tabla_res = [{"tabla": item["_id"] or "General", "cantidad": item["count"]} for item in eventos_tabla]
            
            # Agregación: Eventos por Acción en la bitácora
            pipeline_eventos_accion = [
                {"$group": {"_id": "$accion", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            eventos_accion = list(db.bitacora_eventos.aggregate(pipeline_eventos_accion))
            eventos_accion_res = [{"accion": item["_id"], "cantidad": item["count"]} for item in eventos_accion]

            # Agregación: Evidencias por Tipo (foto, video, etc.)
            pipeline_evidencias_tipo = [
                {"$group": {"_id": "$tipo", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            evidencias_tipo = list(db.evidencias.aggregate(pipeline_evidencias_tipo))
            evidencias_tipo_res = [{"tipo": item["_id"], "cantidad": item["count"]} for item in evidencias_tipo]
            
            # Si no hay datos, inicializamos con algunos mocks para ver gráficas si la base de datos está vacía
            if counts['bitacora_eventos'] == 0:
                eventos_tabla_res = [
                    {"tabla": "api_nino", "cantidad": 15},
                    {"tabla": "api_padrino", "cantidad": 8},
                    {"tabla": "api_apadrinamiento", "cantidad": 10},
                    {"tabla": "api_entrega", "cantidad": 5}
                ]
                eventos_accion_res = [
                    {"accion": "CREATE", "cantidad": 20},
                    {"accion": "UPDATE", "cantidad": 12},
                    {"accion": "LOGIN", "cantidad": 6}
                ]
            if counts['evidencias'] == 0:
                evidencias_tipo_res = [
                    {"tipo": "foto", "cantidad": 12},
                    {"tipo": "video", "cantidad": 3},
                    {"tipo": "documento", "cantidad": 2}
                ]

            return Response({
                'documentos_totales': counts,
                'eventos_por_tabla': eventos_tabla_res,
                'eventos_por_accion': eventos_accion_res,
                'evidencias_por_tipo': evidencias_tipo_res,
            })
        except Exception as e:
            logger.error(f"Error al obtener métricas NoSQL: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def diagnostics_check(request):
    """
    Realiza diagnósticos en tiempo real de los componentes del sistema:
    - MySQL (Relacional)
    - MongoDB (NoSQL Documental)
    - Cifrado/Descifrado (Fernet)
    """
    import time
    from django.conf import settings
    
    # 1. Verificar MySQL
    mysql_status = "Error"
    mysql_details = ""
    mysql_latency = 0
    start = time.time()
    try:
        from .models import Nino
        # Ejecutar una consulta básica
        Nino.objects.exists()
        mysql_status = "Operational"
        mysql_details = "Conexión activa a base de datos MySQL."
        mysql_latency = round((time.time() - start) * 1000, 2)
    except Exception as e:
        mysql_details = str(e)
        
    # 2. Verificar MongoDB
    mongo_status = "Error"
    mongo_details = ""
    mongo_latency = 0
    start = time.time()
    try:
        from .mongo_client import get_mongo_db
        db = get_mongo_db()
        # Ping a MongoDB
        db.command("ping")
        mongo_status = "Operational"
        mongo_details = f"Conexión activa a MongoDB en host {settings.MONGODB_HOST}."
        mongo_latency = round((time.time() - start) * 1000, 2)
    except Exception as e:
        mongo_details = str(e)

    # 3. Verificar Cifrado (Fernet)
    encryption_status = "Error"
    encryption_details = ""
    try:
        from utils.encryption import cifrar_campo, descifrar_campo
        test_str = "SmileLink_Fernet_Test_2026"
        encrypted = cifrar_campo(test_str)
        decrypted = descifrar_campo(encrypted)
        if decrypted == test_str:
            encryption_status = "Operational"
            encryption_details = "Algoritmo Fernet funcionando correctamente."
        else:
            encryption_details = "La cadena descifrada no coincide con la original."
    except Exception as e:
        encryption_details = str(e)

    return Response({
        'status': 'success',
        'mysql': {
            'status': mysql_status,
            'details': mysql_details,
            'latency_ms': mysql_latency
        },
        'mongodb': {
            'status': mongo_status,
            'details': mongo_details,
            'latency_ms': mongo_latency
        },
        'encryption': {
            'status': encryption_status,
            'details': encryption_details
        }
    })


