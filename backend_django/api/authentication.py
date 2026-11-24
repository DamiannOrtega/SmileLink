"""
SmileLink — Autenticación JWT para Django REST Framework.

Cómo funciona:
1. El cliente (panel web o app Android) envía en cada petición el header
       Authorization: Bearer <token>
2. JWTAuthentication verifica la firma con settings.JWT_SECRET_KEY y que el
   token no haya expirado (claim "exp").
3. Según el contenido del token, request.user queda como un UsuarioToken con
   rol "admin" (token con admin_id) o rol "padrino" (token con padrino_id).
4. Las clases de permisos (EsAdministrador, EsAdminOPadrino) deciden quién
   puede usar cada endpoint.

Si el token falta, la petición se trata como anónima y los permisos
responden 401. Si el token es inválido o expiró, se responde 401 directamente.
"""
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.permissions import BasePermission

from .models import Administrador, Padrino

ROL_ADMIN = 'admin'
ROL_PADRINO = 'padrino'


# ──────────────────────────────────────────────────────────────────────────────
# Creación de tokens
# ──────────────────────────────────────────────────────────────────────────────

def _expiracion():
    ahora = datetime.now(timezone.utc)
    return ahora, ahora + timedelta(hours=settings.JWT_EXPIRATION_HOURS)


def generar_jwt_padrino(padrino: Padrino) -> str:
    """Token para la app móvil (padrinos)."""
    iat, exp = _expiracion()
    payload = {
        'padrino_id': padrino.pk,
        'email':      padrino.email,
        'tipo':       ROL_PADRINO,
        'iat':        iat,
        'exp':        exp,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def generar_jwt_admin(admin: Administrador) -> str:
    """Token para el panel web (administradores)."""
    iat, exp = _expiracion()
    payload = {
        'admin_id': admin.pk,
        'email':    admin.email,
        'rol':      admin.rol,
        'nombre':   admin.nombre,
        'tipo':     ROL_ADMIN,
        'iat':      iat,
        'exp':      exp,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# ──────────────────────────────────────────────────────────────────────────────
# Usuario autenticado
# ──────────────────────────────────────────────────────────────────────────────

class UsuarioToken:
    """Representa a quien hizo la petición, según su token."""

    is_authenticated = True
    is_anonymous = False

    def __init__(self, rol, admin=None, padrino=None):
        self.rol = rol
        self.admin = admin
        self.padrino = padrino

    @property
    def es_admin(self):
        return self.rol == ROL_ADMIN

    @property
    def es_padrino(self):
        return self.rol == ROL_PADRINO

    @property
    def pk(self):
        return self.admin.pk if self.admin else self.padrino.pk

    def __str__(self):
        return f'{self.rol}:{self.pk}'


class JWTAuthentication(BaseAuthentication):
    """Lee y valida el header 'Authorization: Bearer <token>'."""

    keyword = 'Bearer'

    def authenticate(self, request):
        partes = get_authorization_header(request).split()
        if not partes or partes[0].lower() != self.keyword.lower().encode():
            return None  # sin token → petición anónima
        if len(partes) != 2:
            raise exceptions.AuthenticationFailed('Header Authorization mal formado.')

        token = partes[1].decode('utf-8', errors='ignore')
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                options={'require': ['exp']},
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('El token expiró. Inicia sesión de nuevo.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Token inválido.')

        if payload.get('admin_id') is not None:
            admin = Administrador.objects.filter(pk=payload['admin_id'], activo=True).first()
            if not admin:
                raise exceptions.AuthenticationFailed('Administrador no encontrado o inactivo.')
            return UsuarioToken(ROL_ADMIN, admin=admin), payload

        if payload.get('padrino_id') is not None:
            padrino = Padrino.objects.filter(pk=payload['padrino_id'], activo=True).first()
            if not padrino:
                raise exceptions.AuthenticationFailed('Padrino no encontrado o inactivo.')
            return UsuarioToken(ROL_PADRINO, padrino=padrino), payload

        raise exceptions.AuthenticationFailed('Token sin usuario.')

    def authenticate_header(self, request):
        # Hace que DRF responda 401 (no 403) cuando falta el token.
        return self.keyword


# ──────────────────────────────────────────────────────────────────────────────
# Permisos
# ──────────────────────────────────────────────────────────────────────────────

class EsAdministrador(BasePermission):
    """Solo administradores del panel web."""
    message = 'Solo un administrador puede realizar esta acción.'

    def has_permission(self, request, view):
        return bool(getattr(request.user, 'is_authenticated', False)
                    and getattr(request.user, 'es_admin', False))


class EsAdminOPadrino(BasePermission):
    """Cualquier usuario con token válido (administrador o padrino)."""

    def has_permission(self, request, view):
        return bool(getattr(request.user, 'is_authenticated', False)
                    and (getattr(request.user, 'es_admin', False)
                         or getattr(request.user, 'es_padrino', False)))


class PermisosPorRolMixin:
    """
    Por defecto cada acción de un ViewSet es solo para administradores.
    Las acciones listadas en `acciones_padrino` también las puede usar un padrino
    (la vista se encarga de que solo vea/modifique lo suyo).
    """
    acciones_padrino = ()

    def get_permissions(self):
        if self.action in self.acciones_padrino:
            return [EsAdminOPadrino()]
        return [EsAdministrador()]
