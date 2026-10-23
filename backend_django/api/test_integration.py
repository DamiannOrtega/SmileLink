"""
Pruebas de Integración para SmileLink Backend (DRF).
Valida la interacción conjunta entre:
URLs -> Vistas (Views) -> Autenticación JWT / Hash -> Modelos ORM -> Persistencia y Cifrado.
"""
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from unittest.mock import patch
from api.models import Padrino, PuntoEntrega
from utils.encryption import descifrar_campo


class TestAuthIntegration(APITestCase):
    """Pruebas de integración del flujo completo de registro, login y sesión."""

    def setUp(self):
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.me_url = reverse('auth-me')
        self.valid_payload = {
            'nombre': 'María Rodríguez Donante',
            'email': 'maria.donante@smilelink.org',
            'password': 'PasswordSegura2026!',
            'direccion': 'Av. de los Bosques 456, Int 12',
            'telefono': '4491234567'
        }

    @patch('api.auth_views.registrar_bitacora')
    def test_flujo_completo_registro_login_y_perfil(self, mock_bitacora):
        """
        Flujo de integración:
        1. Registro vía POST -> valida persistencia, cifrado en BD y retorno de JWT.
        2. Intento de login con credenciales correctas -> valida generación de sesión.
        3. Consulta del perfil autenticado con token Bearer -> valida middleware de autenticación.
        """
        # 1. Registro
        response_reg = self.client.post(self.register_url, self.valid_payload, format='json')
        self.assertIn(response_reg.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertIn('token', response_reg.data)

        # Validar persistencia real en base de datos
        padrino_db = Padrino.objects.filter(email=self.valid_payload['email']).first()
        self.assertIsNotNone(padrino_db)

        # Validar que los campos sensibles estén cifrados en BD (bytes Fernet)
        self.assertIsInstance(padrino_db.nombre_cifrado, bytes)
        self.assertNotEqual(padrino_db.nombre_cifrado, self.valid_payload['nombre'].encode())
        self.assertEqual(descifrar_campo(padrino_db.nombre_cifrado), self.valid_payload['nombre'])

        # Validar que la contraseña esté hasheada (no texto plano)
        self.assertNotEqual(padrino_db.password_hash, self.valid_payload['password'])
        self.assertTrue(padrino_db.password_hash.startswith('pbkdf2_'))

        # 2. Login con credenciales válidas
        login_payload = {
            'email': self.valid_payload['email'],
            'password': self.valid_payload['password']
        }
        response_login = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response_login.status_code, status.HTTP_200_OK)
        self.assertIn('token', response_login.data)
        token = response_login.data['token']

        # 3. Consulta de perfil con cabecera de autorización Bearer
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response_me = self.client.get(self.me_url)
        self.assertEqual(response_me.status_code, status.HTTP_200_OK)
        self.assertEqual(response_me.data.get('email'), self.valid_payload['email'])

    def test_registro_rechaza_campos_incompletos_o_invalidos(self):
        """Valida que la integración de validaciones rechace peticiones inválidas."""
        payload_invalido = {
            'nombre': 'Al',  # Demasiado corto
            'email': 'correo-sin-arroba',
            'password': '123'  # Menos de 6 caracteres
        }
        response = self.client.post(self.register_url, payload_invalido, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('api.auth_views.registrar_bitacora')
    def test_login_rechaza_credenciales_incorrectas(self, mock_bitacora):
        """Valida respuesta ante contraseña incorrecta (401 Unauthorized)."""
        # Registrar primero
        self.client.post(self.register_url, self.valid_payload, format='json')

        # Intentar login con contraseña incorrecta
        bad_login = {
            'email': self.valid_payload['email'],
            'password': 'PasswordIncorrecto999'
        }
        response = self.client.post(self.login_url, bad_login, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestPuntosEntregaIntegration(APITestCase):
    """Pruebas de integración del CRUD en la API de Puntos de Entrega."""

    def test_creacion_y_listado_punto_entrega(self):
        """Prueba integración: POST crea punto -> GET lista punto con status 200."""
        payload = {
            'nombre_punto': 'Punto DIF Central Aguascalientes',
            'direccion_fisica': 'Av. Convención 101, Col. Del Carmen',
            'latitud': '21.8853000',
            'longitud': '-102.2915000',
            'horario_atencion': 'Lunes a Viernes 09:00 - 17:00',
            'contacto_referencia': 'Lic. Juan González',
            'estado_punto': 'Activo'
        }

        # 1. Crear punto vía POST
        res_post = self.client.post('/api/puntos-entrega/', payload, format='json')
        self.assertIn(res_post.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        # 2. Consultar listado vía GET
        res_get = self.client.get('/api/puntos-entrega/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        nombres = [item['nombre_punto'] for item in res_get.data]
        self.assertIn(payload['nombre_punto'], nombres)


class TestDiagnosticsIntegration(APITestCase):
    """Pruebas de integración para endpoint de salud y diagnósticos."""

    def test_endpoint_diagnostico_responde(self):
        """Verifica que el endpoint de diagnósticos responda con éxito."""
        response = self.client.get('/api/diagnostics/check/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertIn('encryption', response.data)
