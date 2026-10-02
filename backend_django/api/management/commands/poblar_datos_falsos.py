"""
SmileLink — Script de Poblamiento de Datos Falsos con Faker
Genera exactamente 40 registros consistentes por tabla, con cifrado Fernet en campos sensibles,
fragmentación vertical en Supabase y estados de verificación de identidad.

Uso:
    python manage.py poblar_datos_falsos
    python manage.py poblar_datos_falsos --consultar <id_padrino>
"""
import random
from datetime import date, timedelta, datetime, timezone
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import connection
from faker import Faker

from api.models import (
    Administrador, Padrino, Nino, PuntoEntrega,
    Evento, Apadrinamiento, Entrega, Solicitud
)
from utils.encryption import cifrar_campo, descifrar_campo
from api.mongo_client import guardar_foto_nino, registrar_bitacora
from api.supabase_client import guardar_fragmento_padrino


class Command(BaseCommand):
    help = 'Pobla la base de datos con 40 registros por tabla usando Faker, con cifrado Fernet y Supabase'

    def add_arguments(self, parser):
        parser.add_argument(
            '--consultar',
            type=int,
            help='ID de un Padrino a consultar para ver sus datos cifrados y descifrados con la FernetKey',
        )

    def handle(self, *args, **options):
        # Modo consulta directa para verificar descifrado
        id_consulta = options.get('consultar')
        if id_consulta:
            self._consultar_padrino(id_consulta)
            return

        self.stdout.write(self.style.WARNING("================================================================"))
        self.stdout.write(self.style.WARNING(" INICIANDO POBLAMIENTO CON FAKER (40 REGISTROS POR TABLA)"))
        self.stdout.write(self.style.WARNING("================================================================"))

        fake = Faker('es_MX')
        Faker.seed(2026)
        random.seed(2026)

        # 1. Limpiar tablas existentes en orden de dependencias
        self.stdout.write("1. Vaciando tablas relacionales...")
        with connection.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            for model in [Solicitud, Entrega, Apadrinamiento, Nino, Padrino, Evento, PuntoEntrega, Administrador]:
                table_name = model._meta.db_table
                cursor.execute(f"TRUNCATE TABLE `{table_name}`;")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        self.stdout.write(self.style.SUCCESS("   ✔ Tablas vaciadas exitosamente."))

        # 2. Administradores (Cuentas clave para pruebas)
        self.stdout.write("2. Creando Administradores...")
        admin_pass = make_password("Admin2026!*")
        gestor_pass = make_password("Gestor2026!*")

        Administrador.objects.create(
            nombre="Lic. Roberto Valadez (Superadmin)",
            email="admin@smilelink.org",
            rol="Superadmin",
            activo=True,
            password_hash=admin_pass
        )
        Administrador.objects.create(
            nombre="Lic. Mariana Morales (Gestor)",
            email="gestor@smilelink.org",
            rol="Gestor",
            activo=True,
            password_hash=gestor_pass
        )
        # Completar hasta 40 administradores para consistencia
        for i in range(3, 41):
            Administrador.objects.create(
                nombre=fake.name(),
                email=f"admin{i}@smilelink.org",
                rol="Gestor" if i % 2 == 0 else "Superadmin",
                activo=True,
                password_hash=admin_pass
            )
        self.stdout.write(self.style.SUCCESS(f"   ✔ 40 Administradores creados."))

        # 3. Puntos de Entrega (40 ubicaciones)
        self.stdout.write("3. Creando 40 Puntos de Entrega en México...")
        ciudades = [
            ("Aguascalientes", 21.8853, -102.2916),
            ("Jesús María", 21.9611, -102.3436),
            ("Calvillo", 21.8469, -102.7188),
            ("Rincón de Romos", 22.2289, -102.3228),
            ("Pabellón de Arteaga", 22.1469, -102.2778),
            ("Guadalajara", 20.6597, -103.3496),
            ("Zapopan", 20.7167, -103.4000),
            ("León", 21.1221, -101.6826),
        ]
        puntos = []
        for i in range(1, 41):
            ciudad, base_lat, base_lng = random.choice(ciudades)
            lat = round(base_lat + random.uniform(-0.05, 0.05), 7)
            lng = round(base_lng + random.uniform(-0.05, 0.05), 7)
            punto = PuntoEntrega.objects.create(
                nombre_punto=f"Centro Comunitario {fake.street_name()} #{i}",
                direccion_fisica=f"{fake.street_address()}, Col. {fake.neighborhood()}, {ciudad}",
                latitud=lat,
                longitud=lng,
                horario_atencion="Lunes a Viernes 09:00 - 18:00",
                contacto_referencia=f"{fake.name()} (Tel: {fake.msisdn()[:10]})",
                estado_punto="Activo" if i <= 36 else "Inactivo"
            )
            puntos.append(punto)
        self.stdout.write(self.style.SUCCESS("   ✔ 40 Puntos de Entrega creados."))

        # 4. Eventos (40 campañas/eventos)
        self.stdout.write("4. Creando 40 Eventos...")
        tipos_eventos = ['Navidad', 'Día del Niño', 'Otro']
        eventos = []
        for i in range(1, 41):
            tipo = random.choice(tipos_eventos)
            f_inicio = date.today() - timedelta(days=random.randint(0, 180))
            f_fin = f_inicio + timedelta(days=random.randint(30, 90))
            estado = "Activo" if f_fin >= date.today() else "Cerrado"
            evento = Evento.objects.create(
                nombre_evento=f"Campaña {tipo} {fake.city()} {2025 + (i % 2)} #{i}",
                tipo_evento=tipo,
                fecha_inicio=f_inicio,
                fecha_fin=f_fin,
                estado_evento=estado,
                descripcion=f"Recolección y entrega de sonrisas para {fake.catch_phrase()}."
            )
            eventos.append(evento)
        self.stdout.write(self.style.SUCCESS("   ✔ 40 Eventos creados."))

        # 5. Niños (40 niños con datos cifrados Fernet)
        self.stdout.write("5. Creando 40 Niños (nombres cifrados con Fernet)...")
        necesidades_opciones = [
            "Mochila escolar", "Zapatos escolares talla 20", "Tenis deportivos",
            "Chamarra para el frío", "Cuadernos y juego de geometría", "Kit de arte y colores",
            "Juguete didáctico", "Suéter escolar azul", "Pantalón de mezclilla", "Bicicleta"
        ]
        ninos = []
        for i in range(1, 41):
            genero = "Femenino" if i % 2 == 0 else "Masculino"
            nombre_plano = fake.first_name_female() if genero == "Femenino" else fake.first_name_male()
            nombre_completo = f"{nombre_plano} {fake.last_name()} {fake.last_name()}"
            edad = random.randint(4, 15)
            necesidades = random.sample(necesidades_opciones, k=random.randint(2, 4))

            nino = Nino.objects.create(
                nombre_cifrado=cifrar_campo(nombre_completo),
                edad=edad,
                genero=genero,
                descripcion=f"Le apasiona {fake.word()} y sueña con ser {fake.job()}.",
                necesidades=necesidades,
                estado_apadrinamiento="Disponible",
                activo=True
            )
            # Guardar avatar en MongoDB
            try:
                from utils.avatars import generar_url_avatar
                guardar_foto_nino(nino.pk, generar_url_avatar(nombre_plano))
            except Exception:
                pass
            ninos.append(nino)
        self.stdout.write(self.style.SUCCESS("   ✔ 40 Niños creados."))

        # 6. Padrinos (40 Padrinos con fragmentación en Supabase y estados de verificación)
        self.stdout.write("6. Creando 40 Padrinos (cifrado Fernet + Fragmentación Supabase)...")
        padrinos = []
        padrino_pass_hash = make_password("Padrino2026!*")

        for i in range(1, 41):
            nombre_plano = fake.name()
            email = f"padrino{i}@smilelink.org"
            telefono_plano = f"449{random.randint(1000000, 9999999)}"
            direccion_plana = f"Av. {fake.street_name()} #{random.randint(100, 2500)}, Col. {fake.neighborhood()}, Aguascalientes, Ags."

            direccion_cifrada_bytes = cifrar_campo(direccion_plana)

            # Distribución de estados de verificación:
            # 1 a 20: Aprobados (pueden apadrinar)
            # 21 a 30: Pendientes (esperando revisión)
            # 31 a 36: Requiere_Reintento (con mensaje de que se tomó mal la foto)
            # 37 a 40: Rechazados
            if i <= 20:
                puede_apadrinar = True
                estado_verif = "Aprobado"
                motivo = ""
                ia_sospecha = False
                ia_rep = {"estado": "Verificado con cámara física Apple/Samsung"}
            elif i <= 30:
                puede_apadrinar = False
                estado_verif = "Pendiente"
                motivo = ""
                # Simular sospecha de IA en algunos pendientes para prueba en web
                ia_sospecha = (i in [23, 27])
                if ia_sospecha:
                    ia_rep = {
                        "es_sospechosa_ia": True,
                        "nivel_riesgo": "ALTO",
                        "motivos": ["Firma de IA encontrada en metadatos PNG (prompt: 'portrait, realistic face, highly detailed')"]
                    }
                else:
                    ia_rep = {"es_sospechosa_ia": False, "nivel_riesgo": "BAJO", "motivos": ["Cámara física Xiaomi Redmi"]}
            elif i <= 36:
                puede_apadrinar = False
                estado_verif = "Requiere_Reintento"
                motivo = "La fotografía de la credencial INE salió borrosa y con reflejo de luz. Por favor vuelve a tomar la foto con iluminación natural."
                ia_sospecha = False
                ia_rep = {"es_sospechosa_ia": False, "motivos": ["Sin metadatos"]}
            else:
                puede_apadrinar = False
                estado_verif = "Rechazado"
                motivo = "La documentación proporcionada no corresponde con el titular de la cuenta o es apócrifa."
                ia_sospecha = True
                ia_rep = {
                    "es_sospechosa_ia": True,
                    "nivel_riesgo": "ALTO",
                    "motivos": ["Software generativo detectado en EXIF: 'Midjourney v6.0'"]
                }

            padrino = Padrino.objects.create(
                nombre_cifrado=cifrar_campo(nombre_plano),
                email=email,
                telefono_cifrado=cifrar_campo(telefono_plano),
                direccion_cifrada=direccion_cifrada_bytes,
                password_hash=padrino_pass_hash,
                puede_apadrinar=puede_apadrinar,
                estado_verificacion=estado_verif,
                motivo_rechazo=motivo,
                foto_ine_path=f"padrinos/{i}/ine_demo.jpg",
                foto_rostro_path=f"padrinos/{i}/rostro_demo.jpg",
                ia_sospecha=ia_sospecha,
                ia_reporte=ia_rep,
                fecha_verificacion=datetime.now(timezone.utc) if estado_verif != "Pendiente" else None,
                activo=True
            )

            # Fragmentación vertical: enviar dirección cifrada a Supabase
            try:
                guardar_fragmento_padrino(
                    id_padrino=padrino.pk,
                    direccion_cifrada_str=direccion_cifrada_bytes.decode('latin1', errors='ignore'),
                    foto_ine_path=padrino.foto_ine_path,
                    foto_rostro_path=padrino.foto_rostro_path,
                    ia_sospecha=ia_sospecha,
                    ia_reporte=ia_rep
                )
            except Exception:
                pass

            padrinos.append(padrino)
        self.stdout.write(self.style.SUCCESS("   ✔ 40 Padrinos creados (con estados de verificación y fragmentación)."))

        # 7. Apadrinamientos (40 registros con padrinos Aprobados)
        self.stdout.write("7. Creando 40 Apadrinamientos...")
        padrinos_aprobados = [p for p in padrinos if p.puede_apadrinar]
        apadrinamientos = []
        for i in range(1, 41):
            padrino = padrinos_aprobados[(i - 1) % len(padrinos_aprobados)]
            nino = ninos[i - 1]
            evento = eventos[i - 1]

            f_inicio = date.today() - timedelta(days=random.randint(10, 100))
            es_activo = (i <= 32)
            f_fin = None if es_activo else f_inicio + timedelta(days=30)

            ap = Apadrinamiento.objects.create(
                id_padrino=padrino,
                id_nino=nino,
                id_evento=evento,
                fecha_inicio=f_inicio,
                fecha_fin=f_fin,
                tipo_apadrinamiento="Elección Padrino" if i % 2 == 0 else "Asignación Automática",
                estado_apadrinamiento_registro="Activo" if es_activo else "Finalizado"
            )
            # Actualizar estado del niño si está activo
            if es_activo:
                nino.estado_apadrinamiento = "Apadrinado"
                nino.id_padrino_actual = padrino
                nino.fecha_apadrinamiento_actual = f_inicio
                nino.save()

            apadrinamientos.append(ap)
        self.stdout.write(self.style.SUCCESS("   ✔ 40 Apadrinamientos creados."))

        # 8. Entregas (40 entregas vinculadas a apadrinamientos y puntos de entrega)
        self.stdout.write("8. Creando 40 Entregas de Regalos (observaciones cifradas con Fernet)...")
        regalos = [
            "Mochila con útiles escolares y calculadora", "Bicicleta rodada 20 azul",
            "Tenis deportivos con juego de calcetines", "Kit de acuarelas y block de dibujo profesional",
            "Chamarra abrigadora y bufanda", "Muñeca artesanal con accesorios",
            "Juego de mesa educativo y libros de cuentos", "Balón de fútbol y playera deportiva"
        ]
        entregas = []
        for i in range(1, 41):
            ap = apadrinamientos[i - 1]
            punto = puntos[i - 1]
            f_prog = ap.fecha_inicio + timedelta(days=20)
            if i <= 20:
                estado_ent = "Entregado"
                f_real = f_prog + timedelta(days=random.randint(-2, 2))
            elif i <= 32:
                estado_ent = "En Proceso"
                f_real = None
            else:
                estado_ent = "Pendiente"
                f_real = None

            obs = f"Entrega coordinada con {fake.name()}. Todo en perfecto estado."
            entrega = Entrega.objects.create(
                id_apadrinamiento=ap,
                id_punto_entrega=punto,
                descripcion_regalo=random.choice(regalos),
                fecha_programada=f_prog,
                fecha_entrega_real=f_real,
                estado_entrega=estado_ent,
                observaciones_cifradas=cifrar_campo(obs)
            )
            entregas.append(entrega)
        self.stdout.write(self.style.SUCCESS("   ✔ 40 Entregas creadas."))

        # 9. Solicitudes (40 solicitudes de regalos)
        self.stdout.write("9. Creando 40 Solicitudes de Niños...")
        for i in range(1, 41):
            nino = ninos[i - 1]
            padrino = padrinos[i - 1] if i <= 20 else None
            entrega = entregas[i - 1] if i <= 20 else None

            if i <= 20:
                estado_sol = "Cumplida"
            elif i <= 30:
                estado_sol = "En Proceso"
            else:
                estado_sol = "Abierta"

            Solicitud.objects.create(
                id_nino=nino,
                id_padrino_interesado=padrino,
                id_entrega_asociada=entrega,
                descripcion_solicitud=f"Hola, me gustaría mucho recibir {random.choice(regalos).lower()} para mis clases.",
                fecha_solicitud=date.today() - timedelta(days=random.randint(10, 60)),
                fecha_cierre=date.today() if estado_sol == "Cumplida" else None,
                estado_solicitud=estado_sol
            )
        self.stdout.write(self.style.SUCCESS("   ✔ 40 Solicitudes creadas."))

        # Resumen final de credenciales
        self.stdout.write(self.style.SUCCESS("\n================================================================"))
        self.stdout.write(self.style.SUCCESS(" ¡POBLAMIENTO EXITOSO! EXACTAMENTE 40 REGISTROS POR TABLA"))
        self.stdout.write(self.style.SUCCESS("================================================================"))
        self.stdout.write(f"\n🔑 CREDENCIALES DE ACCESO PARA PRUEBAS:")
        self.stdout.write(f"----------------------------------------------------------------")
        self.stdout.write(f"👉 Administrador (Web Panel):")
        self.stdout.write(f"   Email:    admin@smilelink.org")
        self.stdout.write(f"   Password: Admin2026!*")
        self.stdout.write(f"   Rol:      Superadmin")
        self.stdout.write(f"\n👉 Padrino Aprobado (Puede ver niños y apadrinar):")
        self.stdout.write(f"   Email:    padrino1@smilelink.org")
        self.stdout.write(f"   Password: Padrino2026!*")
        self.stdout.write(f"\n👉 Padrino Pendiente (En revisión de INE y selfie):")
        self.stdout.write(f"   Email:    padrino21@smilelink.org")
        self.stdout.write(f"   Password: Padrino2026!*")
        self.stdout.write(f"\n👉 Padrino con Reintento Solicitado (Ver mensaje del admin):")
        self.stdout.write(f"   Email:    padrino31@smilelink.org")
        self.stdout.write(f"   Password: Padrino2026!*")
        self.stdout.write(f"\n👉 Padrino con Alerta de IA detectada (Midjourney):")
        self.stdout.write(f"   Email:    padrino37@smilelink.org")
        self.stdout.write(f"   Password: Padrino2026!*")
        self.stdout.write(f"----------------------------------------------------------------")
        self.stdout.write(f"💡 Para consultar cualquier registro cifrado desde la consola:")
        self.stdout.write(f"   python manage.py poblar_datos_falsos --consultar <id_padrino>\n")

    def _consultar_padrino(self, id_padrino):
        """Muestra cómo se ve un registro en bruto en la BD y cómo se descifra con Fernet."""
        try:
            padrino = Padrino.objects.get(pk=id_padrino)
        except Padrino.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Padrino #{id_padrino} no encontrado."))
            return

        self.stdout.write(self.style.SUCCESS(f"\n=================================================="))
        self.stdout.write(self.style.SUCCESS(f" INSPECCIÓN DE REGISTRO PADRINO #{id_padrino}"))
        self.stdout.write(self.style.SUCCESS(f"=================================================="))
        self.stdout.write(f"Email (Texto plano para búsquedas): {padrino.email}")
        self.stdout.write(f"Estado Verificación:                {padrino.estado_verificacion}")
        self.stdout.write(f"¿Puede Apadrinar?:                  {padrino.puede_apadrinar}")
        self.stdout.write(f"¿Sospecha de IA?:                   {padrino.ia_sospecha}")
        if padrino.motivo_rechazo:
            self.stdout.write(f"Motivo / Mensaje Admin:             {padrino.motivo_rechazo}")

        self.stdout.write(f"\n🔒 EN BASE DE DATOS (VARBINARY / CIFRADO CON FERNET):")
        self.stdout.write(f"   nombre_cifrado:    {bytes(padrino.nombre_cifrado)[:45]}...")
        self.stdout.write(f"   telefono_cifrado:  {bytes(padrino.telefono_cifrado)[:45]}...")
        self.stdout.write(f"   direccion_cifrada: {bytes(padrino.direccion_cifrada)[:45]}...")

        self.stdout.write(f"\n🔓 DESCIFRADO AL VUELO CON FERNET_KEY:")
        self.stdout.write(f"   Nombre:    {descifrar_campo(padrino.nombre_cifrado)}")
        self.stdout.write(f"   Teléfono:  {descifrar_campo(padrino.telefono_cifrado)}")
        self.stdout.write(f"   Dirección: {descifrar_campo(padrino.direccion_cifrada)}")
        self.stdout.write(self.style.SUCCESS(f"==================================================\n"))
