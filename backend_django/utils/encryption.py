"""
SmileLink — Encryption Utilities
Cifrado y descifrado de campos sensibles con Fernet (AES-128-CBC).

Uso:
    from utils.encryption import cifrar_campo, descifrar_campo

    # Al guardar en BD:
    padrino.nombre_cifrado = cifrar_campo("Juan Pérez")

    # Al leer de BD:
    nombre = descifrar_campo(padrino.nombre_cifrado)
"""
from cryptography.fernet import Fernet
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def _get_fernet() -> Fernet:
    """Devuelve instancia Fernet usando la clave del settings/env."""
    key = settings.FERNET_KEY
    if not key:
        raise ValueError(
            "FERNET_KEY no está configurada. "
            "Generala con: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            " y agrégala al .env"
        )
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def cifrar_campo(valor: str) -> bytes:
    """
    Cifra un string y retorna bytes para guardar en BinaryField.

    Args:
        valor: Texto en claro (nombre, teléfono, dirección, etc.)

    Returns:
        bytes: Token Fernet cifrado listo para guardar en VARBINARY/BinaryField.
               Retorna b'' si valor es vacío o None.
    """
    if not valor:
        return b''
    return _get_fernet().encrypt(valor.encode('utf-8'))


def descifrar_campo(valor_cifrado) -> str:
    """
    Descifra bytes recuperados de BinaryField y retorna el string original.

    Args:
        valor_cifrado: bytes o memoryview proveniente de BinaryField en MySQL.

    Returns:
        str: Texto en claro. Retorna '' si el valor está vacío.
             Retorna '[CIFRADO]' si falla el descifrado (clave incorrecta o datos corruptos).
    """
    if not valor_cifrado:
        return ''
    if isinstance(valor_cifrado, memoryview):
        valor_cifrado = bytes(valor_cifrado)
    try:
        return _get_fernet().decrypt(valor_cifrado).decode('utf-8')
    except Exception as e:
        logger.error(f"Error al descifrar campo: {e}")
        return '[CIFRADO]'
