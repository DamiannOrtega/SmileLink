"""
Pruebas de la autenticación JWT y los permisos por rol.

Demuestran que:
- Sin token, con token alterado, firmado con otra clave o vencido → 401.
- El token dura JWT_EXPIRATION_HOURS (8 h).
- Un padrino no puede usar endpoints del panel de administración (403).
- Un padrino no puede ver datos de otro padrino aunque cambie el id en la URL.
- Login y registro siguen siendo públicos.
"""
import base64
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from api.authentication import generar_jwt_admin, generar_jwt_padrino
from api.models import Administrador, Apadrinamiento, Nino, Padrino
from utils.encryption import cifrar_campo


def _padrino(email, **extra):
    return Padrino.objects.create(
        nombre_cifrado=cifrar_campo('Padrino Prueba'),
        email=email,
        password_hash=make_password('PasswordSegura2026!'),
        puede_apadrinar=True,
        estado_verificacion='Aprobado',
        **extra,
    )


def _admin():
    return Administrador.objects.create(
        nombre='Admin JWT', email='admin.jwt@smilelink.org', rol='Administrador',
        password_hash=make_password('ClaveAdmin2026!'),
    )


@patch('api.mongo_client.obtener_fotos_ninos', return_value={})
@patch('api.views.registrar_bitacora')
class TestTokenObligatorio(APITestCase):

    def setUp(self):
        self.admin = _admin()

    def _con(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_sin_token_responde_401(self, *_):
        for url in ['/api/ninos/', '/api/padrinos/', '/api/dashboard/kpis/', '/api/auth/me/']:
            self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED, url)

    def test_borrar_sin_token_no_hace_nada(self, *_):
        nino = Nino.objects.create(nombre_cifrado=cifrar_campo('Pepito'), edad=8, genero='Masculino')
        self.assertEqual(self.client.delete(f'/api/ninos/{nino.pk}/').status_code, status.HTTP_401_UNAUTHORIZED)
        nino.refresh_from_db()
        self.assertTrue(nino.activo)

    def test_token_valido_de_admin_funciona(self, *_):
        self._con(generar_jwt_admin(self.admin))
        self.assertEqual(self.client.get('/api/ninos/').status_code, status.HTTP_200_OK)
        me = self.client.get('/api/auth/me/')
        self.assertEqual(me.data['email'], self.admin.email)

    def test_token_alterado_responde_401(self, *_):
        header, payload, firma = generar_jwt_padrino(_padrino('p@smilelink.org')).split('.')
        datos = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4)))
        # Intento de "ascender" a administrador cambiando el contenido
        datos.pop('padrino_id')
        datos['admin_id'] = self.admin.pk
        nuevo = base64.urlsafe_b64encode(json.dumps(datos).encode()).decode().rstrip('=')
        self._con(f'{header}.{nuevo}.{firma}')
        self.assertEqual(self.client.get('/api/dashboard/kpis/').status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_firmado_con_otra_clave_responde_401(self, *_):
        falso = jwt.encode(
            {'admin_id': self.admin.pk, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)},
            'clave-adivinada', algorithm='HS256',
        )
        self._con(falso)
        self.assertEqual(self.client.get('/api/ninos/').status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_vencido_responde_401(self, *_):
        vencido = jwt.encode(
            {'admin_id': self.admin.pk, 'exp': datetime.now(timezone.utc) - timedelta(minutes=1)},
            settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM,
        )
        self._con(vencido)
        res = self.client.get('/api/ninos/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('expir', str(res.data['detail']))

    def test_token_sin_expiracion_responde_401(self, *_):
        sin_exp = jwt.encode({'admin_id': self.admin.pk}, settings.JWT_SECRET_KEY,
                             algorithm=settings.JWT_ALGORITHM)
        self._con(sin_exp)
        self.assertEqual(self.client.get('/api/ninos/').status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(JWT_EXPIRATION_HOURS=8)
    def test_token_dura_8_horas(self, *_):
        datos = jwt.decode(generar_jwt_admin(self.admin), settings.JWT_SECRET_KEY,
                           algorithms=[settings.JWT_ALGORITHM])
        self.assertEqual(datos['exp'] - datos['iat'], 8 * 3600)

    def test_administrador_desactivado_pierde_acceso(self, *_):
        token = generar_jwt_admin(self.admin)
        self.admin.activo = False
        self.admin.save()
        self._con(token)
        self.assertEqual(self.client.get('/api/ninos/').status_code, status.HTTP_401_UNAUTHORIZED)


@patch('api.mongo_client.obtener_fotos_ninos', return_value={})
@patch('api.views.registrar_bitacora')
class TestPermisosDePadrino(APITestCase):

    def setUp(self):
        self.ana = _padrino('ana@smilelink.org')
        self.luis = _padrino('luis@smilelink.org')
        self.nino = Nino.objects.create(nombre_cifrado=cifrar_campo('Pepito'), edad=8, genero='Masculino')
        self.ap_luis = Apadrinamiento.objects.create(id_padrino=self.luis, id_nino=self.nino)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {generar_jwt_padrino(self.ana)}')

    def test_padrino_no_entra_al_panel_de_admin(self, *_):
        for url in ['/api/dashboard/kpis/', '/api/padrinos/', '/api/administradores/']:
            self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN, url)

    def test_padrino_no_puede_borrar_ninos(self, *_):
        self.assertEqual(self.client.delete(f'/api/ninos/{self.nino.pk}/').status_code,
                         status.HTTP_403_FORBIDDEN)

    def test_padrino_ve_su_perfil_pero_no_el_de_otro(self, *_):
        self.assertEqual(self.client.get(f'/api/padrinos/{self.ana.pk}/').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(f'/api/padrinos/{self.luis.pk}/').status_code,
                         status.HTTP_403_FORBIDDEN)

    def test_cambiar_padrino_id_en_la_url_no_sirve(self, *_):
        # Antes, ?padrino_id= bastaba para hacerse pasar por otro. Ahora manda el token.
        res = self.client.get(f'/api/apadrinamientos/?padrino_id={self.luis.pk}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])
        me = self.client.get(f'/api/auth/me/?padrino_id={self.luis.pk}')
        self.assertEqual(me.data['email'], 'ana@smilelink.org')

    def test_padrino_no_ve_apadrinamiento_ajeno(self, *_):
        self.assertEqual(self.client.get(f'/api/apadrinamientos/{self.ap_luis.pk}/').status_code,
                         status.HTTP_403_FORBIDDEN)

    def test_padrino_no_apadrina_a_nombre_de_otro(self, *_):
        res = self.client.post('/api/apadrinamientos/',
                               {'id_padrino': self.luis.pk, 'id_nino': self.nino.pk}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_padrino_si_puede_ver_ninos(self, *_):
        self.assertEqual(self.client.get('/api/ninos/').status_code, status.HTTP_200_OK)


class TestRutasPublicas(APITestCase):

    @patch('api.auth_views.registrar_bitacora')
    def test_login_funciona_aunque_traiga_un_token_vencido(self, _bit):
        _padrino('viejo@smilelink.org')
        vencido = jwt.encode({'padrino_id': 1, 'exp': datetime.now(timezone.utc) - timedelta(days=1)},
                             settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {vencido}')
        res = self.client.post('/api/auth/login/',
                               {'email': 'viejo@smilelink.org', 'password': 'PasswordSegura2026!'},
                               format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
