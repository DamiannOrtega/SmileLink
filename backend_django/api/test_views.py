"""
Pruebas de reglas de negocio de las vistas de SmileLink.

Cubre:
- Bloqueo de acceso a los niños para padrinos no verificados (Pendiente / Rechazado).
- Ciclo de vida de un niño (alta con nombre cifrado, edición, baja lógica).
- Login de administradores.

MongoDB y la bitácora se simulan: estas pruebas no necesitan servicios externos.
"""
from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from api.authentication import generar_jwt_admin, generar_jwt_padrino
from api.models import Administrador, Nino, Padrino
from utils.encryption import cifrar_campo, descifrar_campo


def _token_padrino(padrino):
    return generar_jwt_padrino(padrino)


def _token_admin():
    admin = Administrador.objects.create(
        nombre='Admin Pruebas', email='admin.pruebas@smilelink.org', rol='Administrador',
        password_hash=make_password('ClaveAdmin2026!'),
    )
    return generar_jwt_admin(admin)


def _crear_padrino(email, **extra):
    return Padrino.objects.create(
        nombre_cifrado=cifrar_campo('Padrino Prueba'),
        email=email,
        password_hash=make_password('PasswordSegura2026!'),
        **extra,
    )


def _crear_nino(nombre='Pepito', estado='Disponible', activo=True):
    return Nino.objects.create(
        nombre_cifrado=cifrar_campo(nombre),
        edad=8,
        genero='Masculino',
        descripcion='Le gusta dibujar',
        necesidades=['útiles escolares'],
        estado_apadrinamiento=estado,
        activo=activo,
    )


@patch('api.mongo_client.obtener_fotos_ninos', return_value={})
@patch('api.views.registrar_bitacora')
class TestAccesoNinosPorVerificacion(APITestCase):
    """Un padrino solo puede ver niños si su identidad fue verificada."""

    def setUp(self):
        self.nino = _crear_nino()

    def _get(self, url, padrino=None):
        if padrino is not None:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {_token_padrino(padrino)}')
        return self.client.get(url)

    def test_padrino_pendiente_recibe_403_en_listado(self, _bit, _fotos):
        padrino = _crear_padrino('pendiente@smilelink.org')
        res = self._get('/api/ninos/', padrino)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(res.data['puede_apadrinar'])
        self.assertEqual(res.data['estado_verificacion'], 'Pendiente')

    def test_padrino_rechazado_recibe_403_con_motivo(self, _bit, _fotos):
        padrino = _crear_padrino(
            'rechazado@smilelink.org',
            estado_verificacion='Rechazado',
            motivo_rechazo='INE ilegible',
        )
        res = self._get('/api/ninos/', padrino)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data['motivo_rechazo'], 'INE ilegible')

    def test_padrino_no_verificado_no_ve_disponibles_ni_detalle(self, _bit, _fotos):
        padrino = _crear_padrino('pendiente2@smilelink.org')
        self.assertEqual(self._get('/api/ninos/disponibles/', padrino).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._get(f'/api/ninos/{self.nino.pk}/', padrino).status_code, status.HTTP_403_FORBIDDEN)

    def test_padrino_verificado_ve_el_listado_con_nombre_descifrado(self, _bit, _fotos):
        padrino = _crear_padrino(
            'aprobado@smilelink.org',
            puede_apadrinar=True,
            estado_verificacion='Aprobado',
        )
        res = self._get('/api/ninos/', padrino)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['nombre'], 'Pepito')

    def test_disponibles_excluye_apadrinados_e_inactivos(self, _bit, _fotos):
        _crear_nino('Apadrinado Ana', estado='Apadrinado')
        _crear_nino('Inactivo Luis', activo=False)
        padrino = _crear_padrino('ok@smilelink.org', puede_apadrinar=True, estado_verificacion='Aprobado')
        res = self._get('/api/ninos/disponibles/', padrino)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual([n['nombre'] for n in res.data], ['Pepito'])

    def test_detalle_inexistente_devuelve_404(self, _bit, _fotos):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {_token_admin()}')
        res = self.client.get('/api/ninos/99999/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


@patch('api.views.guardar_foto_nino')
@patch('api.mongo_client.obtener_fotos_ninos', return_value={})
@patch('api.views.registrar_bitacora')
class TestCicloDeVidaNino(APITestCase):
    """Alta, edición y baja lógica de niños (panel administrativo)."""

    payload = {
        'nombre': 'Lupita Hernández',
        'edad': 6,
        'genero': 'Femenino',
        'descripcion': 'Le gusta cantar',
        'necesidades': ['mochila'],
    }

    def setUp(self):
        # Estas acciones son del panel web: requieren token de administrador.
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {_token_admin()}')

    def test_crear_cifra_el_nombre_en_la_base_de_datos(self, _bit, _fotos, _guardar):
        res = self.client.post('/api/ninos/', self.payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        nino = Nino.objects.get(pk=res.data['id'])
        self.assertNotEqual(bytes(nino.nombre_cifrado), self.payload['nombre'].encode())
        self.assertEqual(descifrar_campo(bytes(nino.nombre_cifrado)), self.payload['nombre'])
        self.assertEqual(nino.estado_apadrinamiento, 'Disponible')

    def test_crear_sin_nombre_devuelve_400_y_no_guarda(self, _bit, _fotos, _guardar):
        res = self.client.post('/api/ninos/', {**self.payload, 'nombre': '   '}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Nino.objects.count(), 0)

    def test_editar_nombre_lo_vuelve_a_cifrar(self, _bit, _fotos, _guardar):
        nino = _crear_nino('Nombre Viejo')
        res = self.client.patch(f'/api/ninos/{nino.pk}/', {'nombre': 'Nombre Nuevo', 'foto': 'http://x/y.png'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        nino.refresh_from_db()
        self.assertEqual(descifrar_campo(bytes(nino.nombre_cifrado)), 'Nombre Nuevo')

    def test_eliminar_es_baja_logica(self, _bit, _fotos, _guardar):
        nino = _crear_nino()
        res = self.client.delete(f'/api/ninos/{nino.pk}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        nino.refresh_from_db()  # el registro sigue existiendo
        self.assertFalse(nino.activo)
        self.assertEqual(self.client.get('/api/ninos/').data, [])
        self.assertEqual(self.client.get(f'/api/ninos/{nino.pk}/').status_code, status.HTTP_404_NOT_FOUND)

    def test_eliminar_inexistente_devuelve_404(self, _bit, _fotos, _guardar):
        self.assertEqual(self.client.delete('/api/ninos/99999/').status_code, status.HTTP_404_NOT_FOUND)


@patch('api.auth_views.registrar_bitacora')
class TestAdminLogin(APITestCase):
    url = '/api/auth/admin-login/'

    def setUp(self):
        self.admin = Administrador.objects.create(
            nombre='Gestora Uno',
            email='gestora@smilelink.org',
            rol='Gestor',
            password_hash=make_password('ClaveAdmin2026!'),
        )

    def test_credenciales_correctas_devuelven_token_y_rol(self, _bit):
        res = self.client.post(self.url, {'email': 'gestora@smilelink.org', 'password': 'ClaveAdmin2026!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['token'])
        self.assertEqual(res.data['admin']['rol'], 'Gestor')

    def test_contrasena_incorrecta_devuelve_401(self, _bit):
        res = self.client.post(self.url, {'email': 'gestora@smilelink.org', 'password': 'incorrecta'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('token', res.data)

    def test_administrador_inactivo_devuelve_403(self, _bit):
        self.admin.activo = False
        self.admin.save()
        res = self.client.post(self.url, {'email': 'gestora@smilelink.org', 'password': 'ClaveAdmin2026!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_campos_faltantes_devuelven_400(self, _bit):
        self.assertEqual(self.client.post(self.url, {'email': 'x@x.org'}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.post(self.url, {}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
