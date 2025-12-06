"""
SmileLink API - Views
ViewSets para todas las entidades del sistema
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from storage import get_storage_manager, get_sync_manager
from .serializers import (
    NinoSerializer, PadrinoSerializer, ApadrinamientoSerializer,
    EntregaSerializer, SolicitudRegaloSerializer, PuntoEntregaSerializer,
    AdministradorSerializer, EventoSerializer, DashboardKPIsSerializer
)


storage = get_storage_manager()
sync = get_sync_manager()


class NinosViewSet(viewsets.ViewSet):
    """ViewSet para Niños"""
    
    def list(self, request):
        """GET /api/ninos/"""
        ninos = storage.list_all('ninos')
        serializer = NinoSerializer(ninos, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """GET /api/ninos/{id}/"""
        nino = storage.load('ninos', pk)
        if not nino:
            return Response({'error': 'Niño no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = NinoSerializer(nino)
        return Response(serializer.data)
    
    def create(self, request):
        """POST /api/ninos/"""
        print(f"[NINOS] Received create request: {request.data}")
        serializer = NinoSerializer(data=request.data)
        if serializer.is_valid():
            new_id = storage.get_next_id('ninos', 'N')
            data = serializer.validated_data
            data['id_nino'] = new_id
            
            # Default fields
            if 'estado_apadrinamiento' not in data:
                data['estado_apadrinamiento'] = 'Disponible'
            
            storage.save('ninos', new_id, data)
            sync.sync_entity('ninos', new_id)
            return Response(data, status=status.HTTP_201_CREATED)
        print(f"[NINOS] Validation error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        """PATCH /api/ninos/{id}/"""
        nino = storage.load('ninos', pk)
        if not nino:
            return Response({'error': 'Niño no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        nino.update(request.data)
        storage.update('ninos', pk, nino)
        sync.sync_entity('ninos', pk)
        
        serializer = NinoSerializer(nino)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='upload_avatar', parser_classes=[MultiPartParser, FormParser])
    def upload_avatar(self, request, pk=None):
        """Sube y guarda el avatar generado"""
        nino = storage.load('ninos', pk)
        if not nino:
            return Response({'error': 'Niño no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No se proporcionó ningún archivo'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .file_utils import save_avatar_file
            avatar_url = save_avatar_file(pk, file_obj)
            
            # Update Nino record
            nino['avatar_url'] = avatar_url
            storage.update('ninos', pk, nino)
            try:
                sync.sync_entity('ninos', pk)
            except:
                pass # Ignore sync errors in dev
            
            return Response({'status': 'Avatar subido', 'avatar_url': avatar_url})
        except Exception as e:
            print(f"Error uploading avatar: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        """DELETE /api/ninos/{id}/"""
        if storage.delete('ninos', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Niño no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class PadrinosViewSet(viewsets.ViewSet):
    """ViewSet para Padrinos"""
    
    def list(self, request):
        padrinos = storage.list_all('padrinos')
        serializer = PadrinoSerializer(padrinos, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        padrino = storage.load('padrinos', pk)
        if not padrino:
            return Response({'error': 'Padrino no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PadrinoSerializer(padrino)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = PadrinoSerializer(data=request.data)
        if serializer.is_valid():
            new_id = storage.get_next_id('padrinos', 'P')
            data = serializer.validated_data
            data['id_padrino'] = new_id
            storage.save('padrinos', new_id, data)
            sync.sync_entity('padrinos', new_id)
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        padrino = storage.load('padrinos', pk)
        if not padrino:
            return Response({'error': 'Padrino no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        padrino.update(request.data)
        storage.update('padrinos', pk, padrino)
        sync.sync_entity('padrinos', pk)
        serializer = PadrinoSerializer(padrino)
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        if storage.delete('padrinos', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Padrino no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class ApadrinamientosViewSet(viewsets.ViewSet):
    """ViewSet para Apadrinamientos"""
    
    def list(self, request):
        apadrinamientos = storage.list_all('apadrinamientos')
        serializer = ApadrinamientoSerializer(apadrinamientos, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        apadrinamiento = storage.load('apadrinamientos', pk)
        if not apadrinamiento:
            return Response({'error': 'Apadrinamiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ApadrinamientoSerializer(apadrinamiento)
        return Response(serializer.data)
    
    def create(self, request):
        print(f"[DEBUG] Received apadrinamiento creation request: {request.data}")
        serializer = ApadrinamientoSerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"[ERROR] Serializer validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"[DEBUG] Serializer validated data: {serializer.validated_data}")
        
        # Generate new ID if not provided
        if 'id_apadrinamiento' in serializer.validated_data:
            new_id = serializer.validated_data['id_apadrinamiento']
            print(f"[DEBUG] Using provided ID: {new_id}")
        else:
            new_id = storage.get_next_id('apadrinamientos', 'AP')
            print(f"[DEBUG] Generated new ID: {new_id}")
        
        data = serializer.validated_data
        data['id_apadrinamiento'] = new_id
        
        # Convert date objects to strings for JSON serialization
        if 'fecha_inicio' in data and hasattr(data['fecha_inicio'], 'isoformat'):
            data['fecha_inicio'] = data['fecha_inicio'].isoformat()
        if 'fecha_fin' in data and data['fecha_fin'] and hasattr(data['fecha_fin'], 'isoformat'):
            data['fecha_fin'] = data['fecha_fin'].isoformat()
        
        # Initialize entregas_ids if not present
        if 'entregas_ids' not in data:
            data['entregas_ids'] = []
        
        print(f"[DEBUG] Final data to save: {data}")
        
        # Save apadrinamiento
        save_result = storage.save('apadrinamientos', new_id, data)
        print(f"[DEBUG] Save result: {save_result}")
        sync.sync_entity('apadrinamientos', new_id)
        
        # Update child status to "Apadrinado"
        nino = storage.load('ninos', data['id_nino'])
        if nino:
            print(f"[DEBUG] Updating child {data['id_nino']} status")
            nino['estado_apadrinamiento'] = 'Apadrinado'
            nino['id_padrino_actual'] = data['id_padrino']
            storage.update('ninos', data['id_nino'], nino)
            sync.sync_entity('ninos', data['id_nino'])
        else:
            print(f"[WARNING] Child {data['id_nino']} not found")
        
        # Update padrino's history
        padrino = storage.load('padrinos', data['id_padrino'])
        if padrino:
            print(f"[DEBUG] Updating padrino {data['id_padrino']} history")
            if 'historial_apadrinamiento_ids' not in padrino:
                padrino['historial_apadrinamiento_ids'] = []
            if new_id not in padrino['historial_apadrinamiento_ids']:
                padrino['historial_apadrinamiento_ids'].append(new_id)
            storage.update('padrinos', data['id_padrino'], padrino)
            sync.sync_entity('padrinos', data['id_padrino'])
        else:
            print(f"[WARNING] Padrino {data['id_padrino']} not found")
        
        print(f"[SUCCESS] Apadrinamiento {new_id} created successfully")
        return Response(data, status=status.HTTP_201_CREATED)
    
    def partial_update(self, request, pk=None):
        apadrinamiento = storage.load('apadrinamientos', pk)
        if not apadrinamiento:
            return Response({'error': 'Apadrinamiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        apadrinamiento.update(request.data)
        storage.update('apadrinamientos', pk, apadrinamiento)
        sync.sync_entity('apadrinamientos', pk)
        serializer = ApadrinamientoSerializer(apadrinamiento)
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        if storage.delete('apadrinamientos', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Apadrinamiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class EntregasViewSet(viewsets.ViewSet):
    """ViewSet para Entregas"""
    
    def list(self, request):
        """GET /api/entregas/ with optional filtering by apadrinamiento"""
        entregas = storage.list_all('entregas')
        
        # Filter by apadrinamiento if query parameter provided
        apadrinamiento_id = request.query_params.get('apadrinamiento', None)
        if apadrinamiento_id:
            entregas = [e for e in entregas if e.get('id_apadrinamiento') == apadrinamiento_id]
        
        serializer = EntregaSerializer(entregas, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        entrega = storage.load('entregas', pk)
        if not entrega:
            return Response({'error': 'Entrega no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EntregaSerializer(entrega)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='upload_evidence', parser_classes=[MultiPartParser, FormParser])
    def upload_evidence(self, request, pk=None):
        """Sube foto de evidencia de entrega"""
        entrega = storage.load('entregas', pk)
        if not entrega:
            return Response({'error': 'Entrega no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No se proporcionó ningún archivo'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .file_utils import save_delivery_evidence
            evidence_url = save_delivery_evidence(pk, file_obj)
            
            # Update Entrega record
            entrega['evidencia_foto_path'] = evidence_url
            entrega['estado_entrega'] = 'Entregado' # Auto-complete functionality
            entrega['fecha_entrega_real'] = request.data.get('fecha_entrega_real', date.today().isoformat())
            
            storage.update('entregas', pk, entrega)
            sync.sync_entity('entregas', pk)
            
            return Response({'status': 'Evidencia subida', 'evidence_url': evidence_url})
        except Exception as e:
            print(f"Error uploading evidence: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request):
        print(f"[ENTREGAS] Received create request: {request.data}")
        serializer = EntregaSerializer(data=request.data)
        if serializer.is_valid():
            print(f"[ENTREGAS] Serializer valid, validated data: {serializer.validated_data}")
            new_id = storage.get_next_id('entregas', 'E')
            print(f"[ENTREGAS] Generated ID: {new_id}")
            data = serializer.validated_data
            data['id_entrega'] = new_id
            
            # Convert date objects to strings for JSON serialization
            if 'fecha_programada' in data and hasattr(data['fecha_programada'], 'isoformat'):
                data['fecha_programada'] = data['fecha_programada'].isoformat()
            if 'fecha_entrega_real' in data and data['fecha_entrega_real'] and hasattr(data['fecha_entrega_real'], 'isoformat'):
                data['fecha_entrega_real'] = data['fecha_entrega_real'].isoformat()
            
            print(f"[ENTREGAS] Calling storage.save with data: {data}")
            save_result = storage.save('entregas', new_id, data)
            print(f"[ENTREGAS] Save result: {save_result}")
            sync.sync_entity('entregas', new_id)
            print(f"[ENTREGAS] Returning HTTP 201 with: {data}")
            return Response(data, status=status.HTTP_201_CREATED)
        print(f"[ENTREGAS] Serializer invalid: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        entrega = storage.load('entregas', pk)
        if not entrega:
            return Response({'error': 'Entrega no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        entrega.update(request.data)
        storage.update('entregas', pk, entrega)
        sync.sync_entity('entregas', pk)
        serializer = EntregaSerializer(entrega)
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        if storage.delete('entregas', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Entrega no encontrada'}, status=status.HTTP_404_NOT_FOUND)


class SolicitudesViewSet(viewsets.ViewSet):
    """ViewSet para Solicitudes de Regalo"""
    
    def list(self, request):
        solicitudes = storage.list_all('solicitudes')
        serializer = SolicitudRegaloSerializer(solicitudes, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        solicitud = storage.load('solicitudes', pk)
        if not solicitud:
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SolicitudRegaloSerializer(solicitud)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = SolicitudRegaloSerializer(data=request.data)
        if serializer.is_valid():
            new_id = storage.get_next_id('solicitudes', 'SR')
            data = serializer.validated_data
            data['id_solicitud'] = new_id
            storage.save('solicitudes', new_id, data)
            sync.sync_entity('solicitudes', new_id)
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        solicitud = storage.load('solicitudes', pk)
        if not solicitud:
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        solicitud.update(request.data)
        storage.update('solicitudes', pk, solicitud)
        sync.sync_entity('solicitudes', pk)
        serializer = SolicitudRegaloSerializer(solicitud)
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        if storage.delete('solicitudes', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)


class PuntosEntregaViewSet(viewsets.ViewSet):
    """ViewSet para Puntos de Entrega"""
    
    def list(self, request):
        puntos = storage.list_all('puntos_entrega')
        serializer = PuntoEntregaSerializer(puntos, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        punto = storage.load('puntos_entrega', pk)
        if not punto:
            return Response({'error': 'Punto de entrega no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PuntoEntregaSerializer(punto)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = PuntoEntregaSerializer(data=request.data)
        if serializer.is_valid():
            new_id = storage.get_next_id('puntos_entrega', 'PE')
            data = serializer.validated_data
            data['id_punto_entrega'] = new_id
            storage.save('puntos_entrega', new_id, data)
            sync.sync_entity('puntos_entrega', new_id)
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        punto = storage.load('puntos_entrega', pk)
        if not punto:
            return Response({'error': 'Punto de entrega no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        punto.update(request.data)
        storage.update('puntos_entrega', pk, punto)
        sync.sync_entity('puntos_entrega', pk)
        serializer = PuntoEntregaSerializer(punto)
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        if storage.delete('puntos_entrega', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Punto de entrega no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class EventosViewSet(viewsets.ViewSet):
    """ViewSet para Eventos"""
    
    def list(self, request):
        eventos = storage.list_all('eventos')
        serializer = EventoSerializer(eventos, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        evento = storage.load('eventos', pk)
        if not evento:
            return Response({'error': 'Evento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EventoSerializer(evento)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = EventoSerializer(data=request.data)
        if serializer.is_valid():
            new_id = storage.get_next_id('eventos', 'EV')
            data = serializer.validated_data
            data['id_evento'] = new_id
            storage.save('eventos', new_id, data)
            sync.sync_entity('eventos', new_id)
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        evento = storage.load('eventos', pk)
        if not evento:
            return Response({'error': 'Evento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        evento.update(request.data)
        storage.update('eventos', pk, evento)
        sync.sync_entity('eventos', pk)
        serializer = EventoSerializer(evento)
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        if storage.delete('eventos', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Evento no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class AdministradoresViewSet(viewsets.ViewSet):
    """ViewSet para Administradores"""
    
    def list(self, request):
        admins = storage.list_all('administradores')
        serializer = AdministradorSerializer(admins, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        admin = storage.load('administradores', pk)
        if not admin:
            return Response({'error': 'Administrador no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdministradorSerializer(admin)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = AdministradorSerializer(data=request.data)
        if serializer.is_valid():
            new_id = storage.get_next_id('administradores', 'A')
            data = serializer.validated_data
            data['id_admin'] = new_id
            storage.save('administradores', new_id, data)
            sync.sync_entity('administradores', new_id)
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        admin = storage.load('administradores', pk)
        if not admin:
            return Response({'error': 'Administrador no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        admin.update(request.data)
        storage.update('administradores', pk, admin)
        sync.sync_entity('administradores', pk)
        serializer = AdministradorSerializer(admin)
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        if storage.delete('administradores', pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Administrador no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class DashboardViewSet(viewsets.ViewSet):
    """ViewSet para Dashboard KPIs"""
    
    @action(detail=False, methods=['get'])
    def kpis(self, request):
        """GET /api/dashboard/kpis/"""
        ninos = storage.list_all('ninos')
        padrinos = storage.list_all('padrinos')
        apadrinamientos = storage.list_all('apadrinamientos')
        entregas = storage.list_all('entregas')
        
        kpis = {
            'total_ninos': len(ninos),
            'ninos_disponibles': len([n for n in ninos if n.get('estado_apadrinamiento') == 'Disponible']),
            'ninos_apadrinados': len([n for n in ninos if n.get('estado_apadrinamiento') == 'Apadrinado']),
            'total_padrinos': len(padrinos),
            'padrinos_activos': len([p for p in padrinos if p.get('historial_apadrinamiento_ids')]),
            'total_apadrinamientos': len(apadrinamientos),
            'apadrinamientos_activos': len([a for a in apadrinamientos if a.get('estado_apadrinamiento_registro') == 'Activo']),
            'total_entregas': len(entregas),
            'entregas_completadas': len([e for e in entregas if e.get('estado_entrega') == 'Entregado']),
            'entregas_pendientes': len([e for e in entregas if e.get('estado_entrega') == 'Pendiente']),
        }
        
        serializer = DashboardKPIsSerializer(kpis)
        return Response(serializer.data)
