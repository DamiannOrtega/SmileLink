"""
SmileLink — MongoDB Client
Conexión singleton a MongoDB (Nodo Secundario: 10.66.207.161, Docker puerto 27017).

Colecciones usadas:
    - evidencias            → fotos/archivos de entrega, ligadas a api_entrega por entrega_id
    - bitacora_eventos      → log de acciones de usuarios
    - historial_notificaciones → notificaciones push enviadas a padrinos
    - cartas                → cartas del niño al padrino (texto cifrado)
"""
from pymongo import MongoClient
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

_client = None


def get_mongo_db():
    """
    Retorna la instancia de base de datos MongoDB (patrón singleton).
    La conexión se crea una sola vez y se reutiliza.
    """
    global _client
    if _client is None:
        uri = (
            f"mongodb://{settings.MONGODB_USER}:{settings.MONGODB_PASS}"
            f"@{settings.MONGODB_HOST}:{settings.MONGODB_PORT}/"
            f"?authSource=admin"
        )
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        logger.info(f"MongoDB client creado → {settings.MONGODB_HOST}:{settings.MONGODB_PORT}")
    return _client[settings.MONGODB_DB]


# ──────────────────────────────────────────────────────────────────────────────
# EVIDENCIAS
# ──────────────────────────────────────────────────────────────────────────────

def guardar_evidencia(
    entrega_id: int,
    apadrinamiento_id: int,
    nino_id: int,
    tipo: str,
    url_archivo: str,
    metadatos: dict,
    subido_por: str,
    descripcion_cifrada: bytes = None
) -> str:
    """
    Guarda evidencia de entrega en la colección 'evidencias'.

    Args:
        entrega_id:           ID de la entrega en MySQL (api_entrega.id)
        apadrinamiento_id:    ID del apadrinamiento en MySQL
        nino_id:              ID del niño en MySQL
        tipo:                 'foto' | 'video' | 'documento'
        url_archivo:          Ruta relativa al archivo (ej: 'media/evidencias/E42.jpg')
        metadatos:            Dict con tamaño, formato, resolución, etc.
        subido_por:           Email del usuario que subió el archivo
        descripcion_cifrada:  bytes Fernet (opcional)

    Returns:
        str: ObjectId del documento insertado (para guardar en api_entrega.mongo_evidencia_id)
    """
    from datetime import datetime, timezone
    db = get_mongo_db()
    doc = {
        'entrega_id':          entrega_id,
        'apadrinamiento_id':   apadrinamiento_id,
        'nino_id':             nino_id,
        'tipo':                tipo,
        'url_archivo':         url_archivo,
        'descripcion_cifrada': descripcion_cifrada,
        'metadatos':           metadatos,
        'subido_por':          subido_por,
        'timestamp':           datetime.now(timezone.utc),
    }
    result = db.evidencias.insert_one(doc)
    logger.info(f"Evidencia guardada en MongoDB: {result.inserted_id} (entrega_id={entrega_id})")
    return str(result.inserted_id)


def obtener_evidencias(entrega_id: int) -> list:
    """
    Obtiene todas las evidencias de una entrega específica.

    Returns:
        list: Lista de documentos con _id convertido a string.
    """
    db = get_mongo_db()
    evidencias = list(db.evidencias.find(
        {'entrega_id': entrega_id},
        {'_id': 1, 'tipo': 1, 'url_archivo': 1, 'timestamp': 1, 'subido_por': 1}
    ))
    for ev in evidencias:
        ev['_id'] = str(ev['_id'])
        if 'timestamp' in ev and ev['timestamp']:
            ev['timestamp'] = ev['timestamp'].isoformat()
    return evidencias


# ──────────────────────────────────────────────────────────────────────────────
# BITÁCORA DE EVENTOS
# ──────────────────────────────────────────────────────────────────────────────

def registrar_bitacora(usuario_id, tabla: str, accion: str, detalle: dict = None) -> str:
    """
    Registra una acción en la bitácora de eventos.

    Args:
        usuario_id:  ID del usuario que realizó la acción (int o str)
        tabla:       Tabla afectada (ej: 'api_nino', 'api_padrino')
        accion:      Descripción de la acción (ej: 'CREATE', 'UPDATE', 'LOGIN')
        detalle:     Dict con información adicional (opcional)

    Returns:
        str: ObjectId del log insertado
    """
    from datetime import datetime, timezone
    db = get_mongo_db()
    result = db.bitacora_eventos.insert_one({
        'usuario_id': usuario_id,
        'tabla':      tabla,
        'accion':     accion,
        'detalle':    detalle or {},
        'timestamp':  datetime.now(timezone.utc),
    })
    return str(result.inserted_id)


# ──────────────────────────────────────────────────────────────────────────────
# CARTAS
# ──────────────────────────────────────────────────────────────────────────────

def guardar_carta(
    nino_id: int,
    apadrinamiento_id: int,
    contenido_cifrado: bytes,
    remitente: str
) -> str:
    """
    Guarda carta del niño al padrino (contenido cifrado con Fernet).

    Returns:
        str: ObjectId del documento insertado
    """
    from datetime import datetime, timezone
    db = get_mongo_db()
    result = db.cartas.insert_one({
        'nino_id':             nino_id,
        'apadrinamiento_id':   apadrinamiento_id,
        'contenido_cifrado':   contenido_cifrado,
        'remitente':           remitente,
        'timestamp':           datetime.now(timezone.utc),
    })
    logger.info(f"Carta guardada en MongoDB: {result.inserted_id} (nino_id={nino_id})")
    return str(result.inserted_id)


# ──────────────────────────────────────────────────────────────────────────────
# NOTIFICACIONES
# ──────────────────────────────────────────────────────────────────────────────

def registrar_notificacion(padrino_id: int, tipo: str, mensaje: str, enviado: bool = True) -> str:
    """
    Registra una notificación push enviada a un padrino.

    Returns:
        str: ObjectId del documento insertado
    """
    from datetime import datetime, timezone
    db = get_mongo_db()
    result = db.historial_notificaciones.insert_one({
        'padrino_id': padrino_id,
        'tipo':       tipo,
        'mensaje':    mensaje,
        'enviado':    enviado,
        'timestamp':  datetime.now(timezone.utc),
    })
    return str(result.inserted_id)


# ──────────────────────────────────────────────────────────────────────────────
# FOTOS DE NIÑOS
# ──────────────────────────────────────────────────────────────────────────────

def guardar_foto_nino(nino_id: int, foto_url: str) -> str:
    """
    Guarda o actualiza la foto (URL o avatar) de un niño en MongoDB.

    Returns:
        str: ID de MongoDB
    """
    db = get_mongo_db()
    result = db.ninos_fotos.update_one(
        {'nino_id': nino_id},
        {'$set': {'foto_url': foto_url}},
        upsert=True
    )
    return str(result.upserted_id or '')


def obtener_foto_nino(nino_id: int) -> str:
    """
    Obtiene la URL de la foto de un niño desde MongoDB.
    """
    db = get_mongo_db()
    doc = db.ninos_fotos.find_one({'nino_id': nino_id})
    if doc:
        return doc.get('foto_url', '')
    return ''


def obtener_fotos_ninos(nino_ids: list) -> dict:
    """
    Obtiene las URLs de las fotos de varios niños desde MongoDB en una sola consulta.
    Retorna un diccionario {nino_id: foto_url}.
    """
    if not nino_ids:
        return {}
    db = get_mongo_db()
    cursor = db.ninos_fotos.find({'nino_id': {'$in': nino_ids}})
    return {doc['nino_id']: doc.get('foto_url', '') for doc in cursor}


def _serialize_doc(doc: dict) -> dict:
    """Convierte ObjectId y datetime a formatos JSON-serializables."""
    if not doc:
        return doc
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    if 'timestamp' in doc and doc['timestamp']:
        doc['timestamp'] = doc['timestamp'].isoformat()
    return doc


def listar_contenido_nosql(coleccion: str, limit: int = 50, tipo: str = None) -> list:
    """
    Lista documentos recientes de una colección NoSQL para drill-down del dashboard.

    Args:
        coleccion: evidencias | ninos_fotos | cartas | bitacora_eventos
        limit:     máximo de documentos (1–100)
        tipo:      filtro opcional para evidencias (foto, video, documento)
    """
    db = get_mongo_db()
    limit = max(1, min(int(limit), 100))

    if coleccion == 'evidencias':
        filt = {}
        if tipo:
            import re
            filt['tipo'] = {'$regex': f'^{re.escape(tipo)}$', '$options': 'i'}
        projection = {
            '_id': 1, 'tipo': 1, 'url_archivo': 1, 'entrega_id': 1,
            'nino_id': 1, 'subido_por': 1, 'timestamp': 1,
        }
        cursor = db.evidencias.find(filt, projection).sort('timestamp', -1).limit(limit)
    elif coleccion == 'ninos_fotos':
        projection = {'_id': 1, 'nino_id': 1, 'foto_url': 1}
        cursor = db.ninos_fotos.find({}, projection).limit(limit)
    elif coleccion == 'cartas':
        projection = {
            '_id': 1, 'nino_id': 1, 'apadrinamiento_id': 1,
            'remitente': 1, 'timestamp': 1,
        }
        cursor = db.cartas.find({}, projection).sort('timestamp', -1).limit(limit)
    elif coleccion == 'bitacora_eventos':
        projection = {
            '_id': 1, 'tabla': 1, 'accion': 1,
            'usuario_id': 1, 'timestamp': 1,
        }
        cursor = db.bitacora_eventos.find({}, projection).sort('timestamp', -1).limit(limit)
    else:
        return []

    return [_serialize_doc(dict(doc)) for doc in cursor]


