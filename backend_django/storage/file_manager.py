"""
SmileLink Storage - File Manager
Maneja almacenamiento de archivos JSON encriptados en filesystem
Soporta almacenamiento local y NFS
"""
import os
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from dotenv import load_dotenv
from .encryption import get_encryption_manager

load_dotenv()


class FileStorageManager:
    """Maneja almacenamiento y recuperación de archivos JSON encriptados"""
    
    # Tipos de entidades soportadas
    ENTITY_TYPES = [
        'ninos', 'padrinos', 'apadrinamientos', 'entregas',
        'solicitudes', 'puntos_entrega', 'eventos', 'administradores'
    ]
    
    def __init__(self, base_path: Optional[str] = None):
        """
        Inicializa el file manager
        
        Args:
            base_path: Ruta base para almacenamiento. Si es None, usa configuración de .env
        """
        self.encryption = get_encryption_manager()
        
        # Determinar ruta base
        use_nfs = os.getenv('USE_NFS', 'False').lower() == 'true'
        
        if base_path:
            self.base_path = Path(base_path)
        elif use_nfs:
            nfs_path = os.getenv('NFS_DATA_PATH', '/mnt/nfs/smilelink/data')
            self.base_path = Path(nfs_path)
        else:
            local_path = os.getenv('LOCAL_STORAGE_PATH', './local_data')
            self.base_path = Path(local_path)
        
        # Crear directorios si no existen
        self._initialize_storage()
    
    def _initialize_storage(self):
        """Crea estructura de directorios para todas las entidades"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        for entity_type in self.ENTITY_TYPES:
            entity_dir = self.base_path / entity_type
            entity_dir.mkdir(exist_ok=True)
            
            # Crear índice si no existe
            index_path = entity_dir / 'index.json.enc'
            if not index_path.exists():
                self._save_index(entity_type, [])
    
    def _get_entity_path(self, entity_type: str, entity_id: str) -> Path:
        """Retorna ruta completa para un archivo de entidad"""
        return self.base_path / entity_type / f"{entity_id}.json.enc"
    
    def _get_index_path(self, entity_type: str) -> Path:
        """Retorna ruta del archivo índice"""
        return self.base_path / entity_type / 'index.json.enc'
    
    def _load_index(self, entity_type: str) -> List[str]:
        """Carga lista de IDs del índice"""
        index_path = self._get_index_path(entity_type)
        
        if not index_path.exists():
            return []
        
        try:
            with open(index_path, 'rb') as f:
                encrypted = f.read()
            return self.encryption.decrypt_data(encrypted)
        except Exception as e:
            print(f"Error loading index for {entity_type}: {e}")
            return []
    
    def _save_index(self, entity_type: str, index: List[str]):
        """Guarda lista de IDs en el índice"""
        index_path = self._get_index_path(entity_type)
        encrypted = self.encryption.encrypt_data(index)
        
        with open(index_path, 'wb') as f:
            f.write(encrypted)
    
    def _add_to_index(self, entity_type: str, entity_id: str):
        """Agrega un ID al índice si no existe"""
        index = self._load_index(entity_type)
        if entity_id not in index:
            index.append(entity_id)
            self._save_index(entity_type, index)
    
    def _remove_from_index(self, entity_type: str, entity_id: str):
        """Remueve un ID del índice"""
        index = self._load_index(entity_type)
        if entity_id in index:
            index.remove(entity_id)
            self._save_index(entity_type, index)
    
    def save(self, entity_type: str, entity_id: str, data: Dict[str, Any]) -> bool:
        """
        Guarda una entidad encriptada
        
        Args:
            entity_type: Tipo de entidad (ninos, padrinos, etc.)
            entity_id: ID único de la entidad
            data: Datos a guardar
            
        Returns:
            bool: True si se guardó exitosamente
        """
        if entity_type not in self.ENTITY_TYPES:
            raise ValueError(f"Invalid entity type: {entity_type}")
        
        try:
            # Encriptar datos
            encrypted = self.encryption.encrypt_data(data)
            
            # Guardar archivo
            file_path = self._get_entity_path(entity_type, entity_id)
            with open(file_path, 'wb') as f:
                f.write(encrypted)
            
            # Actualizar índice
            self._add_to_index(entity_type, entity_id)
            
            return True
        except Exception as e:
            print(f"Error saving {entity_type}/{entity_id}: {e}")
            return False
    
    def load(self, entity_type: str, entity_id: str) -> Optional[Dict[str, Any]]:
        """
        Carga una entidad desencriptada
        
        Args:
            entity_type: Tipo de entidad
            entity_id: ID de la entidad
            
        Returns:
            dict: Datos desencriptados o None si no existe
        """
        if entity_type not in self.ENTITY_TYPES:
            raise ValueError(f"Invalid entity type: {entity_type}")
        
        file_path = self._get_entity_path(entity_type, entity_id)
        
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'rb') as f:
                encrypted = f.read()
            return self.encryption.decrypt_data(encrypted)
        except Exception as e:
            print(f"Error loading {entity_type}/{entity_id}: {e}")
            return None
    
    def list_all(self, entity_type: str) -> List[Dict[str, Any]]:
        """
        Lista todas las entidades de un tipo
        
        Args:
            entity_type: Tipo de entidad
            
        Returns:
            list: Lista de todas las entidades
        """
        if entity_type not in self.ENTITY_TYPES:
            raise ValueError(f"Invalid entity type: {entity_type}")
        
        index = self._load_index(entity_type)
        entities = []
        
        for entity_id in index:
            data = self.load(entity_type, entity_id)
            if data:
                entities.append(data)
        
        return entities
    
    def delete(self, entity_type: str, entity_id: str) -> bool:
        """
        Elimina una entidad
        
        Args:
            entity_type: Tipo de entidad
            entity_id: ID de la entidad
            
        Returns:
            bool: True si se eliminó exitosamente
        """
        if entity_type not in self.ENTITY_TYPES:
            raise ValueError(f"Invalid entity type: {entity_type}")
        
        file_path = self._get_entity_path(entity_type, entity_id)
        
        if not file_path.exists():
            return False
        
        try:
            file_path.unlink()
            self._remove_from_index(entity_type, entity_id)
            return True
        except Exception as e:
            print(f"Error deleting {entity_type}/{entity_id}: {e}")
            return False
    
    def exists(self, entity_type: str, entity_id: str) -> bool:
        """Verifica si una entidad existe"""
        file_path = self._get_entity_path(entity_type, entity_id)
        return file_path.exists()
    
    def update(self, entity_type: str, entity_id: str, data: Dict[str, Any]) -> bool:
        """Actualiza una entidad (alias de save)"""
        return self.save(entity_type, entity_id, data)
    
    def get_next_id(self, entity_type: str, prefix: str) -> str:
        """
        Genera el siguiente ID disponible para una entidad
        
        Args:
            entity_type: Tipo de entidad
            prefix: Prefijo del ID (ej: 'N' para niños, 'P' para padrinos)
            
        Returns:
            str: Siguiente ID disponible (ej: 'N005')
        """
        index = self._load_index(entity_type)
        
        if not index:
            return f"{prefix}001"
        
        # Extraer números de los IDs existentes
        numbers = []
        for entity_id in index:
            try:
                num = int(entity_id.replace(prefix, ''))
                numbers.append(num)
            except ValueError:
                continue
        
        if not numbers:
            return f"{prefix}001"
        
        next_num = max(numbers) + 1
        return f"{prefix}{str(next_num).zfill(3)}"


# Singleton instance
_storage_manager = None

def get_storage_manager() -> FileStorageManager:
    """Retorna instancia singleton del FileStorageManager"""
    global _storage_manager
    if _storage_manager is None:
        _storage_manager = FileStorageManager()
    return _storage_manager
