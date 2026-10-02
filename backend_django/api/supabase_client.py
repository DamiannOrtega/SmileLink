"""
SmileLink — Supabase Client (Fragmentación Vertical)
Maneja el fragmento sensible y biométrico de los padrinos en la nube (Supabase):
1. Bucket Privado 'identificaciones': almacena fotos de INE y Rostro.
2. Tabla 'padrinos_fragmento_sensible': almacena dirección cifrada y metadatos de IA.
3. Generación de URLs firmadas temporales para visualización exclusiva de administradores.
"""
import logging
import httpx
from django.conf import settings
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def _get_base_url() -> str:
    return getattr(settings, 'SUPABASE_URL', '').rstrip('/')


def _get_service_key() -> str:
    return getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', '')


def _get_bucket_name() -> str:
    return getattr(settings, 'SUPABASE_BUCKET_IDENTIFICACIONES', 'identificaciones')


def subir_archivo_identificacion(ruta_destino: str, file_bytes: bytes, content_type: str = "image/jpeg") -> str:
    """
    Sube una fotografía al bucket privado de Supabase Storage.

    Args:
        ruta_destino: ej. "padrinos/42/ine.jpg"
        file_bytes: bytes binarios del archivo
        content_type: MIME type (ej. image/jpeg, image/png)

    Returns:
        str: la ruta interna en el bucket si tuvo éxito, o "" si falló.
    """
    base_url = _get_base_url()
    key = _get_service_key()
    bucket = _get_bucket_name()

    if not base_url or not key:
        logger.warning("Supabase no está configurado (faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)")
        return ""

    url = f"{base_url}/storage/v1/object/{bucket}/{ruta_destino}"
    headers = {
        "Authorization": f"Bearer {key}",
        "apiKey": key,
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, headers=headers, content=file_bytes)
            if resp.status_code in [200, 201]:
                logger.info(f"Archivo subido exitosamente a Supabase Storage: {bucket}/{ruta_destino}")
                return ruta_destino
            else:
                logger.error(f"Error subiendo archivo a Supabase Storage ({resp.status_code}): {resp.text}")
                return ""
    except Exception as e:
        logger.error(f"Excepción al conectar con Supabase Storage: {e}")
        return ""


def generar_url_firmada(ruta: str, expires_in: int = 3600) -> str:
    """
    Genera una URL firmada con tiempo de caducidad para que un administrador
    pueda visualizar la imagen confidencial en el navegador de forma segura.

    Args:
        ruta: ruta dentro del bucket (ej. "padrinos/42/ine.jpg")
        expires_in: segundos de vigencia (default 1 hora)

    Returns:
        str: URL pública temporal firmada, o "" si falla.
    """
    if not ruta:
        return ""

    base_url = _get_base_url()
    key = _get_service_key()
    bucket = _get_bucket_name()

    if not base_url or not key:
        return ""

    url = f"{base_url}/storage/v1/object/sign/{bucket}/{ruta}"
    headers = {
        "Authorization": f"Bearer {key}",
        "apiKey": key,
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json={"expiresIn": expires_in})
            if resp.status_code == 200:
                data = resp.json()
                signed_path = data.get("signedURL", "")
                if signed_path:
                    # Si signedURL viene relativo
                    if signed_path.startswith("http"):
                        return signed_path
                    return f"{base_url}/storage/v1{signed_path}"
            logger.warning(f"No se pudo generar URL firmada para {ruta}: {resp.text}")
            return ""
    except Exception as e:
        logger.error(f"Excepción generando URL firmada en Supabase: {e}")
        return ""


def guardar_fragmento_padrino(
    id_padrino: int,
    direccion_cifrada_str: str,
    foto_ine_path: str = "",
    foto_rostro_path: str = "",
    ia_sospecha: bool = False,
    ia_reporte: dict = None
) -> bool:
    """
    Guarda o actualiza el fragmento vertical sensible del padrino en Supabase PostgREST
    (tabla 'padrinos_fragmento_sensible').
    """
    base_url = _get_base_url()
    key = _get_service_key()

    if not base_url or not key:
        return False

    url = f"{base_url}/rest/v1/padrinos_fragmento_sensible"
    headers = {
        "Authorization": f"Bearer {key}",
        "apiKey": key,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    payload = {
        "id_padrino": id_padrino,
        "direccion_cifrada": direccion_cifrada_str or "",
        "foto_ine_path": foto_ine_path or "",
        "foto_rostro_path": foto_rostro_path or "",
        "ia_sospecha": bool(ia_sospecha),
        "ia_reporte": ia_reporte or {},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code in [200, 201, 204]:
                logger.info(f"Fragmento vertical de Padrino #{id_padrino} guardado en Supabase")
                return True
            else:
                logger.warning(f"Aviso al guardar fragmento sensible en Supabase ({resp.status_code}): {resp.text}")
                return False
    except Exception as e:
        logger.warning(f"No se pudo guardar fragmento en Supabase: {e}")
        return False


def obtener_fragmento_padrino(id_padrino: int) -> dict:
    """
    Obtiene el fragmento sensible del padrino desde Supabase PostgREST.
    """
    base_url = _get_base_url()
    key = _get_service_key()

    if not base_url or not key:
        return {}

    url = f"{base_url}/rest/v1/padrinos_fragmento_sensible?id_padrino=eq.{id_padrino}&select=*"
    headers = {
        "Authorization": f"Bearer {key}",
        "apiKey": key,
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=headers)
            if resp.status_code == 200:
                rows = resp.json()
                if rows and isinstance(rows, list):
                    return rows[0]
            return {}
    except Exception as e:
        logger.warning(f"Error consultando fragmento en Supabase: {e}")
        return {}
