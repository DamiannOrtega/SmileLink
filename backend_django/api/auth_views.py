"""
SmileLink — Authentication Views
Registro, login y sesión de padrinos.
- Contraseñas: Django PBKDF2+salt (make_password / check_password)
- Datos personales: cifrado Fernet
- JWT para sesiones
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password
from django.conf import settings
import jwt
import re
import logging
from datetime import datetime, timedelta, timezone

from api.models import Padrino
from utils.encryption import cifrar_campo, descifrar_campo
from api.mongo_client import registrar_bitacora

logger = logging.getLogger(__name__)


def validate_email(email: str) -> bool:
    """Valida formato de email."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def generar_jwt(padrino: Padrino) -> str:
    """Genera un token JWT para el padrino."""
    payload = {
        'padrino_id': padrino.pk,
        'email':      padrino.email,
        'exp':        datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        'iat':        datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _padrino_to_dict(padrino: Padrino) -> dict:
    """Convierte un Padrino a dict con campos descifrados (sin password_hash)."""
    return {
        'id':             padrino.pk,
        'nombre':         descifrar_campo(padrino.nombre_cifrado),
        'email':          padrino.email,
        'telefono':       descifrar_campo(padrino.telefono_cifrado),
        'direccion':      descifrar_campo(padrino.direccion_cifrada),
        'id_google_auth': padrino.id_google_auth,
        'fecha_registro': str(padrino.fecha_registro),
        'activo':         padrino.activo,
    }


# ──────────────────────────────────────────────────────────────────────────────
# REGISTRO
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
def register(request):
    """
    POST /api/auth/register/
    Body: { nombre, email, password, direccion, telefono (opcional) }
    """
    required = ['nombre', 'email', 'password', 'direccion']
    for field in required:
        if not request.data.get(field):
            return Response(
                {'error': f'El campo {field} es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

    nombre   = request.data['nombre'].strip()
    email    = request.data['email'].lower().strip()
    password = request.data['password']
    direccion = request.data['direccion']
    telefono  = request.data.get('telefono', '')

    if not validate_email(email):
        return Response({'error': 'Formato de email inválido'}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 6:
        return Response({'error': 'La contraseña debe tener al menos 6 caracteres'},
                        status=status.HTTP_400_BAD_REQUEST)
    if len(nombre) < 3:
        return Response({'error': 'El nombre debe tener al menos 3 caracteres'},
                        status=status.HTTP_400_BAD_REQUEST)

    if Padrino.objects.filter(email=email).exists():
        return Response({'error': 'Este email ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)

    padrino = Padrino(
        nombre_cifrado    = cifrar_campo(nombre),
        email             = email,
        telefono_cifrado  = cifrar_campo(telefono) if telefono else None,
        direccion_cifrada = cifrar_campo(direccion),
        password_hash     = make_password(password),   # PBKDF2+SHA256+salt
    )
    try:
        padrino.save()
    except Exception as e:
        logger.error(f"Error al registrar padrino: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Registrar en bitácora MongoDB
    try:
        registrar_bitacora(padrino.pk, 'api_padrino', 'REGISTER', {'email': email})
    except Exception as e:
        logger.warning(f"No se pudo registrar en bitácora MongoDB: {e}")

    token = generar_jwt(padrino)

    return Response(
        {
            'message': 'Registro exitoso',
            'token':   token,
            'padrino': _padrino_to_dict(padrino),
        },
        status=status.HTTP_201_CREATED
    )


# ──────────────────────────────────────────────────────────────────────────────
# LOGIN
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
def login(request):
    """
    POST /api/auth/login/
    Body: { email, password }
    """
    email    = request.data.get('email', '').lower().strip()
    password = request.data.get('password', '')

    if not email or not password:
        return Response({'error': 'Email y contraseña son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        padrino = Padrino.objects.get(email=email)
    except Padrino.DoesNotExist:
        return Response({'error': 'Email no registrado'}, status=status.HTTP_404_NOT_FOUND)

    if not padrino.activo:
        return Response({'error': 'Cuenta inactiva'}, status=status.HTTP_403_FORBIDDEN)

    # Verificar contraseña con Django check_password (PBKDF2)
    if not check_password(password, padrino.password_hash):
        # Registrar intento fallido en bitácora
        try:
            registrar_bitacora(padrino.pk, 'api_padrino', 'LOGIN_FAILED', {'email': email})
        except Exception:
            pass
        return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)

    # Registrar login exitoso
    try:
        registrar_bitacora(padrino.pk, 'api_padrino', 'LOGIN', {'email': email})
    except Exception as e:
        logger.warning(f"No se pudo registrar en bitácora MongoDB: {e}")

    token = generar_jwt(padrino)

    return Response(
        {
            'message': 'Login exitoso',
            'token':   token,
            'padrino': _padrino_to_dict(padrino),
        },
        status=status.HTTP_200_OK
    )


# ──────────────────────────────────────────────────────────────────────────────
# USUARIO ACTUAL
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def get_current_user(request):
    """
    GET /api/auth/me/
    Header: Authorization: Bearer <jwt_token>
    O query param: ?padrino_id=<id>
    """
    # Intentar desde token JWT
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            padrino_id = payload.get('padrino_id')
            padrino = Padrino.objects.get(pk=padrino_id)
            return Response(_padrino_to_dict(padrino))
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except Padrino.DoesNotExist:
            return Response({'error': 'Padrino no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    # Fallback: por query param (compatibilidad con versión anterior)
    padrino_id = request.query_params.get('padrino_id')
    if padrino_id:
        try:
            padrino = Padrino.objects.get(pk=padrino_id)
            return Response(_padrino_to_dict(padrino))
        except Padrino.DoesNotExist:
            return Response({'error': 'Padrino no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    return Response({'error': 'Autenticación requerida'}, status=status.HTTP_401_UNAUTHORIZED)


# ──────────────────────────────────────────────────────────────────────────────
# LOGOUT
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
def logout(request):
    """POST /api/auth/logout/ — el cliente descarta el token JWT."""
    return Response({'message': 'Sesión cerrada exitosamente'}, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────────────────────
# LOGIN CON GOOGLE OAuth
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
def google_login(request):
    """
    POST /api/auth/google/
    Body: { token: "<google_id_token>" }
    Verifica el token con Google y crea/recupera el padrino.
    """
    if not settings.GOOGLE_CLIENT_ID:
        return Response({'error': 'Google OAuth no está configurado'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    google_token = request.data.get('token')
    if not google_token:
        return Response({'error': 'token es requerido'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            google_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        google_id = idinfo['sub']
        email     = idinfo['email'].lower()
        nombre    = idinfo.get('name', '')

    except Exception as e:
        logger.warning(f"Google token inválido: {e}")
        return Response({'error': 'Token de Google inválido'}, status=status.HTTP_400_BAD_REQUEST)

    padrino, created = Padrino.objects.get_or_create(
        email=email,
        defaults={
            'nombre_cifrado': cifrar_campo(nombre),
            'id_google_auth': google_id,
            'password_hash':  '',
        }
    )

    if not created and not padrino.id_google_auth:
        padrino.id_google_auth = google_id
        padrino.save()

    try:
        registrar_bitacora(padrino.pk, 'api_padrino', 'GOOGLE_LOGIN', {'email': email})
    except Exception:
        pass

    token = generar_jwt(padrino)
    return Response({
        'message': 'Login con Google exitoso',
        'token':   token,
        'nuevo':   created,
        'padrino': _padrino_to_dict(padrino),
    })
