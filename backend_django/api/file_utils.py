import os
import time
from django.conf import settings

def save_avatar_file(nino_id, file_obj):
    """
    Guarda un archivo de avatar en local_data/avatars/
    Retorna la URL relativa para accederlo.
    """
    # Definir directorio de destino
    avatars_dir = os.path.join(settings.BASE_DIR, 'local_data', 'avatars')
    os.makedirs(avatars_dir, exist_ok=True)

    # Generar nombre único: id_timestamp.svg
    timestamp = int(time.time())
    file_ext = 'png' # Usamos PNG para compatibilidad móvil
    filename = f"{nino_id}_{timestamp}.{file_ext}"
    file_path = os.path.join(avatars_dir, filename)

    # Guardar el archivo chunk por chunk
    with open(file_path, 'wb+') as destination:
        for chunk in file_obj.chunks():
            destination.write(chunk)

    # Retornar la ruta relativa o absoluta para la API
    # En este caso, retornaremos una ruta que Django pueda servir si configuramos media
    # OJO: Si no tenemos media configurado, tendremos que servirlo manualmente o usar una ruta estática
    # Por ahora, retornamos la ruta relativa a local_data
    return f"/media/avatars/{filename}"

def save_delivery_evidence(entrega_id, file_obj):
    """
    Guarda evidencia de entrega en local_data/evidence/
    """
    evidence_dir = os.path.join(settings.BASE_DIR, 'local_data', 'evidence')
    os.makedirs(evidence_dir, exist_ok=True)

    timestamp = int(time.time())
    # Keep original extension if possible or default to jpg
    original_name = file_obj.name or ''
    ext = original_name.split('.')[-1] if '.' in original_name else 'jpg'
    
    filename = f"{entrega_id}_{timestamp}.{ext}"
    file_path = os.path.join(evidence_dir, filename)

    with open(file_path, 'wb+') as destination:
        for chunk in file_obj.chunks():
            destination.write(chunk)

    return f"/media/evidence/{filename}"
