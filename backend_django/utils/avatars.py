"""
SmileLink — Avatar Generation Utilities
Integración con DiceBear API para generar avatares basados en semillas.
"""
AVATAR_BASE_URL = "https://api.dicebear.com/7.x/fun-emoji/svg"

def generar_url_avatar(seed: str) -> str:
    """
    Genera URL de avatar usando DiceBear API.
    Ej: generar_url_avatar("Carlos") -> "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos&size=128"
    """
    import urllib.parse
    safe_seed = urllib.parse.quote(seed)
    return f"{AVATAR_BASE_URL}?seed={safe_seed}&size=128"
