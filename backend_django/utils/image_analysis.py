"""
SmileLink — Image Forensic & AI Detection Module
Analiza metadatos EXIF, chunks de imagen y firmas digitales para detectar
si una fotografía proviene de una cámara física real o si fue generada con Inteligencia Artificial.
"""
import io
import logging
from PIL import Image
from PIL.ExifTags import TAGS

logger = logging.getLogger(__name__)

# Palabras clave asociadas con generadores de imágenes por IA o software de manipulación
AI_KEYWORDS = [
    "midjourney", "stable diffusion", "stablediffusion", "dall-e", "dalle",
    "novelai", "invokeai", "comfyui", "flux.1", "flux", "bing image",
    "adobe firefly", "firefly", "generative", "c2pa", "synthid",
    "artificial intelligence", "prompt:", "steps:", "sampler:"
]

# Fabricantes conocidos de cámaras y teléfonos móviles reales
CAM_MAKERS = [
    "apple", "samsung", "xiaomi", "motorola", "huawei", "sony", "google",
    "oppo", "vivo", "oneplus", "realme", "canon", "nikon", "fujifilm"
]


def analizar_imagen_ia(file_bytes: bytes, filename: str = "") -> dict:
    """
    Analiza los bytes de una imagen en busca de metadatos EXIF y firmas de IA.

    Returns:
        dict con:
            - es_sospechosa_ia: bool
            - nivel_riesgo: 'ALTO' | 'MEDIO' | 'BAJO'
            - motivos: list[str]
            - metadatos_camara: dict
            - software: str
            - dimensiones: str
            - formato: str
    """
    resultado = {
        "es_sospechosa_ia": False,
        "nivel_riesgo": "BAJO",
        "motivos": [],
        "metadatos_camara": {},
        "software": "",
        "dimensiones": "",
        "formato": "",
        "detalles_crudos": {}
    }

    try:
        img = Image.open(io.BytesIO(file_bytes))
        resultado["formato"] = img.format or "UNKNOWN"
        resultado["dimensiones"] = f"{img.width}x{img.height}"

        # 1. Analizar metadatos de formato PNG (chunks de texto donde SD/ComfyUI guardan prompts)
        if hasattr(img, 'text') and img.text:
            for k, v in img.text.items():
                val_lower = str(v).lower()
                for keyword in AI_KEYWORDS:
                    if keyword in val_lower or keyword in str(k).lower():
                        resultado["es_sospechosa_ia"] = True
                        resultado["nivel_riesgo"] = "ALTO"
                        resultado["motivos"].append(
                            f"Firma de IA encontrada en metadatos PNG ('{k}': contiene '{keyword}')"
                        )
                        resultado["detalles_crudos"][k] = str(v)[:200]

        # 2. Analizar metadatos EXIF (JPEG, WebP, TIFF)
        exif_data = {}
        try:
            raw_exif = img.getexif()
            if raw_exif:
                for tag_id, val in raw_exif.items():
                    tag_name = TAGS.get(tag_id, str(tag_id))
                    exif_data[tag_name] = str(val)
        except Exception as e:
            logger.debug(f"No se pudieron extraer tags EXIF estándar: {e}")

        # Extraer sub-IFDs (datos avanzados de cámara como DateTimeOriginal, MakerNote)
        try:
            if hasattr(img, '_getexif') and callable(img._getexif):
                detailed_exif = img._getexif()
                if detailed_exif:
                    for tag_id, val in detailed_exif.items():
                        tag_name = TAGS.get(tag_id, str(tag_id))
                        exif_data[tag_name] = str(val)
        except Exception:
            pass

        # 3. Inspeccionar campos sospechosos en EXIF
        software = exif_data.get("Software", "").strip()
        make = exif_data.get("Make", "").strip()
        model = exif_data.get("Model", "").strip()
        user_comment = exif_data.get("UserComment", "").strip()

        if software:
            resultado["software"] = software
            for keyword in AI_KEYWORDS:
                if keyword in software.lower():
                    resultado["es_sospechosa_ia"] = True
                    resultado["nivel_riesgo"] = "ALTO"
                    resultado["motivos"].append(
                        f"Software generativo detectado en EXIF: '{software}'"
                    )

        if user_comment:
            for keyword in AI_KEYWORDS:
                if keyword in user_comment.lower():
                    resultado["es_sospechosa_ia"] = True
                    resultado["nivel_riesgo"] = "ALTO"
                    resultado["motivos"].append(
                        f"Marcador de IA en UserComment EXIF: contiene '{keyword}'"
                    )

        # 4. Evaluación de consistencia física de cámara
        if make or model:
            resultado["metadatos_camara"] = {
                "marca": make,
                "modelo": model,
                "fecha_captura": exif_data.get("DateTimeOriginal") or exif_data.get("DateTime", ""),
                "lente": exif_data.get("LensModel", ""),
            }
            # Si tiene fabricante reconocido de cámara física
            es_marca_real = any(c in make.lower() for c in CAM_MAKERS)
            if es_marca_real and not resultado["es_sospechosa_ia"]:
                resultado["nivel_riesgo"] = "BAJO"
                resultado["motivos"].append(f"Cámara física identificada: {make} {model}")
        else:
            # Si no tiene ningún dato de cámara, en documentos oficiales o selfies suele haber EXIF de smartphone.
            # No es necesariamente IA, pero amerita sospecha MEDIA si fue tomada desde móvil.
            if not resultado["es_sospechosa_ia"]:
                resultado["nivel_riesgo"] = "MEDIO"
                resultado["motivos"].append(
                    "Fotografía sin telemetría de sensor físico de cámara (metadatos ausentes o eliminados)"
                )

    except Exception as e:
        logger.error(f"Error analizando imagen: {e}")
        resultado["nivel_riesgo"] = "MEDIO"
        resultado["motivos"].append(f"No se pudieron leer metadatos de la imagen ({str(e)})")

    return resultado
