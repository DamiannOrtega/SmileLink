"""
SmileLink Storage - Sync Manager
Maneja sincronización automática entre NFS y HDFS
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from .file_manager import get_storage_manager
from .hdfs_client import get_hdfs_client

load_dotenv()


class SyncManager:
    """Maneja sincronización de archivos entre NFS y HDFS"""
    
    def __init__(self):
        self.storage = get_storage_manager()
        self.hdfs = get_hdfs_client()
        self.auto_sync = os.getenv('USE_HDFS_REPLICATION', 'False').lower() == 'true'
    
    def sync_entity(self, entity_type: str, entity_id: str) -> bool:
        """
        Sincroniza una entidad específica a HDFS
        
        Args:
            entity_type: Tipo de entidad
            entity_id: ID de la entidad
            
        Returns:
            bool: True si se sincronizó exitosamente
        """
        if not self.auto_sync or not self.hdfs.is_available():
            return False
        
        # Obtener ruta local del archivo
        local_path = self.storage._get_entity_path(entity_type, entity_id)
        
        if not local_path.exists():
            return False
        
        # Ruta relativa para HDFS
        hdfs_relative = f"{entity_type}/{entity_id}.json.enc"
        
        return self.hdfs.replicate_file(str(local_path), hdfs_relative)
    
    def sync_index(self, entity_type: str) -> bool:
        """Sincroniza el archivo índice de una entidad"""
        if not self.auto_sync or not self.hdfs.is_available():
            return False
        
        index_path = self.storage._get_index_path(entity_type)
        
        if not index_path.exists():
            return False
        
        hdfs_relative = f"{entity_type}/index.json.enc"
        
        return self.hdfs.replicate_file(str(index_path), hdfs_relative)
    
    def sync_all_entities(self, entity_type: str) -> int:
        """
        Sincroniza todas las entidades de un tipo
        
        Returns:
            int: Número de archivos sincronizados
        """
        if not self.auto_sync or not self.hdfs.is_available():
            return 0
        
        entity_dir = self.storage.base_path / entity_type
        
        if not entity_dir.exists():
            return 0
        
        return self.hdfs.sync_directory(str(entity_dir), entity_type)
    
    def sync_all(self) -> dict:
        """
        Sincroniza todos los tipos de entidades
        
        Returns:
            dict: Resumen de sincronización por tipo
        """
        if not self.auto_sync or not self.hdfs.is_available():
            return {}
        
        results = {}
        
        for entity_type in self.storage.ENTITY_TYPES:
            count = self.sync_all_entities(entity_type)
            results[entity_type] = count
        
        return results


# Singleton instance
_sync_manager = None

def get_sync_manager() -> SyncManager:
    """Retorna instancia singleton del SyncManager"""
    global _sync_manager
    if _sync_manager is None:
        _sync_manager = SyncManager()
    return _sync_manager
