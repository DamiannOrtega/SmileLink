"""
SmileLink Storage - Encryption Manager
Maneja encriptación/desencriptación AES-256 de archivos JSON
"""
import json
import os
from cryptography.fernet import Fernet
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()


class EncryptionManager:
    """Maneja encriptación y desencriptación de datos con AES-256 (Fernet)"""
    
    def __init__(self):
        encryption_key = os.getenv('ENCRYPTION_KEY')
        
        if not encryption_key:
            # Generar key temporal para desarrollo
            encryption_key = Fernet.generate_key().decode()
            print(f"⚠️  WARNING: Using temporary encryption key: {encryption_key}")
            print("   Set ENCRYPTION_KEY in .env for production!")
        
        self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
    
    def encrypt_data(self, data: Dict[str, Any]) -> bytes:
        """
        Encripta un diccionario a bytes
        
        Args:
            data: Diccionario con datos a encriptar
            
        Returns:
            bytes: Datos encriptados
        """
        try:
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            json_bytes = json_str.encode('utf-8')
            encrypted = self.cipher.encrypt(json_bytes)
            return encrypted
        except Exception as e:
            raise Exception(f"Error al encriptar datos: {str(e)}")
    
    def decrypt_data(self, encrypted_data: bytes) -> Dict[str, Any]:
        """
        Desencripta bytes a diccionario
        
        Args:
            encrypted_data: Bytes encriptados
            
        Returns:
            dict: Datos desencriptados
        """
        try:
            decrypted_bytes = self.cipher.decrypt(encrypted_data)
            json_str = decrypted_bytes.decode('utf-8')
            data = json.loads(json_str)
            return data
        except Exception as e:
            raise Exception(f"Error al desencriptar datos: {str(e)}")
    
    def encrypt_file(self, input_path: str, output_path: str):
        """Encripta un archivo JSON existente"""
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        encrypted = self.encrypt_data(data)
        
        with open(output_path, 'wb') as f:
            f.write(encrypted)
    
    def decrypt_file(self, input_path: str, output_path: str):
        """Desencripta un archivo a JSON"""
        with open(input_path, 'rb') as f:
            encrypted = f.read()
        
        data = self.decrypt_data(encrypted)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


# Singleton instance
_encryption_manager = None

def get_encryption_manager() -> EncryptionManager:
    """Retorna instancia singleton del EncryptionManager"""
    global _encryption_manager
    if _encryption_manager is None:
        _encryption_manager = EncryptionManager()
    return _encryption_manager
