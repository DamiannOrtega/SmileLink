"""
SmileLink — Módulo de Análisis de Imágenes (Revisión de IA Desactivada)
"""

def analizar_imagen_ia(file_bytes: bytes, filename: str = "") -> dict:
    """
    Función no-op: La detección de Inteligencia Artificial mediante Pillow
    ha sido desactivada a petición del sistema.
    """
    return {
        "es_sospechosa_ia": False,
        "nivel_riesgo": "BAJO",
        "motivos": [],
        "metadatos_camara": {},
        "software": "",
        "dimensiones": "",
        "formato": "",
        "detalles_crudos": {}
    }
