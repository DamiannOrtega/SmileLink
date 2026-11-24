"""
Crea usuarios de prueba para revisar el JWT en tu máquina (modo USE_SQLITE_LOCAL).

    python manage.py crear_usuarios_demo --password "TuClaveDePrueba"

Crea (o actualiza) con esa misma contraseña:
  - admin.demo@smilelink.test  → Administrador (entra al panel web)
  - ana.demo@smilelink.test    → Padrino verificado
  - luis.demo@smilelink.test   → Padrino verificado
y un niño de ejemplo. Solo para pruebas locales: no lo uses con la base real.
"""
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError

from api.models import Administrador, Nino, Padrino
from utils.encryption import cifrar_campo


class Command(BaseCommand):
    help = 'Crea un administrador, dos padrinos y un niño de prueba (solo en SQLite local).'

    def add_arguments(self, parser):
        parser.add_argument('--password', required=True,
                            help='Contraseña de prueba para los tres usuarios (mínimo 6 caracteres).')

    def handle(self, *args, **options):
        if 'sqlite3' not in settings.DATABASES['default']['ENGINE']:
            raise CommandError('Por seguridad, este comando solo corre con USE_SQLITE_LOCAL=True.')
        password = options['password']
        if len(password) < 6:
            raise CommandError('La contraseña debe tener al menos 6 caracteres.')
        hash_ = make_password(password)

        Administrador.objects.update_or_create(
            email='admin.demo@smilelink.test',
            defaults={'nombre': 'Admin Demo', 'rol': 'Administrador',
                      'password_hash': hash_, 'activo': True},
        )
        for nombre, email in [('Ana Demo', 'ana.demo@smilelink.test'),
                              ('Luis Demo', 'luis.demo@smilelink.test')]:
            Padrino.objects.update_or_create(
                email=email,
                defaults={'nombre_cifrado': cifrar_campo(nombre), 'password_hash': hash_,
                          'puede_apadrinar': True, 'estado_verificacion': 'Aprobado', 'activo': True},
            )
        if not Nino.objects.exists():
            Nino.objects.create(nombre_cifrado=cifrar_campo('Pepito Demo'), edad=8, genero='Masculino')

        ids = {p.email: p.pk for p in Padrino.objects.filter(email__endswith='.demo@smilelink.test')}
        self.stdout.write(self.style.SUCCESS('Usuarios de prueba listos:'))
        self.stdout.write('  admin.demo@smilelink.test  (administrador)')
        for email, pk in sorted(ids.items()):
            self.stdout.write(f'  {email:<26} (padrino, id {pk})')
