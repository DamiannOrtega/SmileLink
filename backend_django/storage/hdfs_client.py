"""
SmileLink Storage - HDFS Client
Maneja replicación de archivos a HDFS
"""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

try:
    from hdfs import InsecureClient
    HDFS_AVAILABLE = True
except ImportError:
    HDFS_AVAILABLE = False
    print("⚠️  hdfs library not available. Install with: pip install hdfs")


class HDFSClient:
    """Cliente para replicar archivos a HDFS"""
    
    def __init__(self):
        self.namenode_url = os.getenv('HDFS_NAMENODE_URL', 'http://192.168.193.26:9870')
        self.user = os.getenv('HDFS_USER', 'hadoop')
        self.replication_path = os.getenv('HDFS_REPLICATION_PATH', '/smilelink/data')
        self.replication_factor = int(os.getenv('HDFS_REPLICATION_FACTOR', '2'))
        
        self.client = None
        if HDFS_AVAILABLE:
            try:
                self.client = InsecureClient(self.namenode_url, user=self.user)
            except Exception as e:
                print(f"⚠️  Could not connect to HDFS: {e}")
    
    def is_available(self) -> bool:
        """Verifica si HDFS está disponible"""
        return self.client is not None
    
    def replicate_file(self, local_path: str, hdfs_relative_path: str) -> bool:
        """
        Replica un archivo local a HDFS
        
        Args:
            local_path: Ruta del archivo local
            hdfs_relative_path: Ruta relativa en HDFS (ej: 'ninos/N001.json.enc')
            
        Returns:
            bool: True si se replicó exitosamente
        """
        if not self.is_available():
            return False
        
        hdfs_full_path = f"{self.replication_path}/{hdfs_relative_path}"
        
        try:
            # Crear directorio padre si no existe
            parent_dir = str(Path(hdfs_full_path).parent)
            try:
                self.client.makedirs(parent_dir)
            except Exception:
                pass  # Directorio ya existe
            
            # Subir archivo
            with open(local_path, 'rb') as f:
                self.client.write(
                    hdfs_full_path,
                    f,
                    overwrite=True,
                    replication=self.replication_factor
                )
            
            return True
        except Exception as e:
            print(f"Error replicating {local_path} to HDFS: {e}")
            return False
    
    def sync_directory(self, local_dir: str, hdfs_relative_dir: str) -> int:
        """
        Sincroniza un directorio completo a HDFS
        
        Args:
            local_dir: Directorio local
            hdfs_relative_dir: Directorio relativo en HDFS
            
        Returns:
            int: Número de archivos sincronizados
        """
        if not self.is_available():
            return 0
        
        synced_count = 0
        local_path = Path(local_dir)
        
        for file_path in local_path.rglob('*'):
            if file_path.is_file():
                relative = file_path.relative_to(local_path)
                hdfs_path = f"{hdfs_relative_dir}/{relative}"
                
                if self.replicate_file(str(file_path), hdfs_path):
                    synced_count += 1
        
        return synced_count
    
    def list_files(self, hdfs_relative_path: str = '') -> list:
        """Lista archivos en HDFS"""
        if not self.is_available():
            return []
        
        hdfs_full_path = f"{self.replication_path}/{hdfs_relative_path}"
        
        try:
            return self.client.list(hdfs_full_path)
        except Exception as e:
            print(f"Error listing HDFS files: {e}")
            return []
    
    def delete_file(self, hdfs_relative_path: str) -> bool:
        """Elimina un archivo de HDFS"""
        if not self.is_available():
            return False
        
        hdfs_full_path = f"{self.replication_path}/{hdfs_relative_path}"
        
        try:
            self.client.delete(hdfs_full_path)
            return True
        except Exception as e:
            print(f"Error deleting HDFS file: {e}")
            return False


# Singleton instance
_hdfs_client = None

def get_hdfs_client() -> HDFSClient:
    """Retorna instancia singleton del HDFSClient"""
    global _hdfs_client
    if _hdfs_client is None:
        _hdfs_client = HDFSClient()
    return _hdfs_client
