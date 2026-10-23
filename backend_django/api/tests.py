"""
Pruebas Unitarias para el Backend de SmileLink.
Prueba lógica de cifrado Fernet, modelos y serializadores de forma aislada.
"""
from django.test import TestCase
from utils.encryption import cifrar_campo, descifrar_campo
from api.models import Administrador, Padrino, Nino, PuntoEntrega
from api.serializers import AdministradorSerializer


class TestFernetEncryptionUnit(TestCase):
    """Pruebas unitarias de las utilidades de cifrado Fernet."""

    def test_cifrado_y_descifrado_exitoso(self):
        """Verifica que un texto en claro cifrado se pueda recuperar íntegro."""
        texto_original = "Juan Pérez González - Dirección Confidencial 123"
        cifrado = cifrar_campo(texto_original)
        self.assertIsInstance(cifrado, bytes)
        self.assertNotEqual(cifrado, texto_original.encode('utf-8'))

        recuperado = descifrar_campo(cifrado)
        self.assertEqual(recuperado, texto_original)

    def test_cifrar_campo_vacio_o_nulo(self):
        """Verifica el comportamiento seguro ante cadenas vacías o None."""
        self.assertEqual(cifrar_campo(""), b'')
        self.assertEqual(cifrar_campo(None), b'')
        self.assertEqual(descifrar_campo(b''), '')
        self.assertEqual(descifrar_campo(None), '')

    def test_descifrado_corrupto_retorna_fallback(self):
        """Bytes corruptos no deben lanzar excepción sino retornar [CIFRADO]."""
        bytes_corruptos = b"bytes_invalidos_que_no_son_fernet"
        resultado = descifrar_campo(bytes_corruptos)
        self.assertEqual(resultado, '[CIFRADO]')


class TestModelosUnit(TestCase):
    """Pruebas unitarias sobre la lógica y atributos de los modelos."""

    def test_creacion_administrador_por_defecto(self):
        """Verifica rol y estado por defecto de un Administrador."""
        admin = Administrador(nombre="Admin Prueba", email="admin@smilelink.org")
        self.assertEqual(admin.rol, "Gestor")
        self.assertTrue(admin.activo)
        self.assertEqual(str(admin), "Admin Prueba (Gestor)")

    def test_creacion_padrino_reglas_por_defecto(self):
        """Verifica que un nuevo padrino requiera verificación antes de apadrinar."""
        padrino = Padrino(
            nombre_cifrado=cifrar_campo("Carlos Donante"),
            email="carlos@donante.com"
        )
        self.assertFalse(padrino.puede_apadrinar)
        self.assertEqual(padrino.estado_verificacion, "Pendiente")
        self.assertTrue(padrino.activo)

    def test_punto_entrega_str_representacion(self):
        """Verifica representación de texto del modelo PuntoEntrega."""
        punto = PuntoEntrega(
            nombre_punto="Sede Central Aguascalientes",
            direccion_fisica="Av. Universidad 940",
            latitud=21.88,
            longitud=-102.29
        )
        self.assertEqual(str(punto), "Sede Central Aguascalientes")


class TestSerializersUnit(TestCase):
    """Pruebas unitarias de serializadores."""

    def test_administrador_serializer_campos_requeridos(self):
        """Valida que no se pueda serializar un administrador sin email válido."""
        serializer = AdministradorSerializer(data={"nombre": "Invalido", "email": "no-es-un-email"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
