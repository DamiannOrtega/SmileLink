"""
SmileLink Storage - NFS Client
Maneja montaje y verificación de NFS share
"""
import os
import subprocess
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class NFSClient:
    """Cliente para montar y gestionar NFS share"""
    
    def __init__(self):
        self.server = os.getenv('NFS_SERVER', '192.168.1.107')
        self.share_path = os.getenv('NFS_SHARE_PATH', '/eData')
        self.mount_point = os.getenv('NFS_MOUNT_POINT', '/mnt/nfs')
    
    def is_mounted(self) -> bool:
        """Verifica si el NFS share está montado"""
        try:
            result = subprocess.run(
                ['mount'],
                capture_output=True,
                text=True,
                check=False
            )
            return self.mount_point in result.stdout
        except Exception as e:
            print(f"Error checking NFS mount: {e}")
            return False
    
    def mount(self) -> bool:
        """
        Monta el NFS share
        
        Returns:
            bool: True si se montó exitosamente o ya estaba montado
        """
        if self.is_mounted():
            print(f"✓ NFS already mounted at {self.mount_point}")
            return True
        
        try:
            # Crear punto de montaje si no existe
            Path(self.mount_point).mkdir(parents=True, exist_ok=True)
            
            # Montar NFS
            cmd = [
                'mount',
                '-t', 'nfs',
                f'{self.server}:{self.share_path}',
                self.mount_point
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"✓ NFS mounted successfully at {self.mount_point}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"✗ Error mounting NFS: {e.stderr}")
            return False
        except Exception as e:
            print(f"✗ Unexpected error mounting NFS: {e}")
            return False
    
    def unmount(self) -> bool:
        """Desmonta el NFS share"""
        if not self.is_mounted():
            print("NFS is not mounted")
            return True
        
        try:
            subprocess.run(['umount', self.mount_point], check=True)
            print(f"✓ NFS unmounted from {self.mount_point}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"✗ Error unmounting NFS: {e}")
            return False
    
    def get_mount_info(self) -> dict:
        """Retorna información sobre el montaje NFS"""
        return {
            'server': self.server,
            'share_path': self.share_path,
            'mount_point': self.mount_point,
            'is_mounted': self.is_mounted()
        }


# Singleton instance
_nfs_client = None

def get_nfs_client() -> NFSClient:
    """Retorna instancia singleton del NFSClient"""
    global _nfs_client
    if _nfs_client is None:
        _nfs_client = NFSClient()
    return _nfs_client
