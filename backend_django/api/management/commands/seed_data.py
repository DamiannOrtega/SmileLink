import random
from datetime import date, timedelta, datetime, timezone
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from api.models import Nino, Padrino, Apadrinamiento, Entrega, Solicitud, PuntoEntrega, Evento
from utils.encryption import cifrar_campo
from api.mongo_client import registrar_bitacora, guardar_evidencia, guardar_carta

class Command(BaseCommand):
    help = 'Poblar las bases de datos (MySQL y MongoDB) con más de 500 registros coherentes y cifrados'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando poblamiento de base de datos distribuidas (SmileLink)...")

        # Limpiar datos previos opcionalmente
        # (Descomentar si se desea hacer un reset total)
        # Solicitud.objects.all().delete()
        # Entrega.objects.all().delete()
        # Apadrinamiento.objects.all().delete()
        # Nino.objects.all().delete()
        # Padrino.objects.all().delete()

        # Nombres y apellidos comunes para generar
        nombres_masc = ["Liam", "Noah", "Oliver", "Mateo", "Lucas", "Leo", "Daniel", "Mateo", "Javier", "David", "Carlos", "Luis", "Jorge", "Andres", "Juan", "Pedro", "Miguel", "Angel", "Alejandro", "Jose"]
        nombres_fem = ["Sofia", "Olivia", "Emma", "Isabella", "Mia", "Aria", "Lucia", "Camila", "Valentina", "Isabella", "Elena", "Victoria", "Mariana", "Ana", "Maria", "Laura", "Andrea", "Sofia", "Clara", "Daniela"]
        apellidos = ["Garcia", "Martinez", "Lopez", "Gonzalez", "Rodriguez", "Hernandez", "Sanchez", "Perez", "Gomez", "Diaz", "Alvarez", "Torres", "Ruiz", "Ramirez", "Flores", "Acosta", "Benitez", "Medina", "Herrera", "Castillo"]

        necesidades_pool = [
            "Mochila escolar", "Zapatos escolares", "Cuadernos y lápices", "Tenis deportivos",
            "Chamarra de frío", "Suéter escolar", "Pantalón de mezclilla", "Kit de higiene",
            "Cuentos infantiles", "Juguete educativo", "Colores y acuarelas", "Calculadora"
        ]
        
        regalos_pool = [
            "Bicicleta de montaña", "Balón de fútbol", "Muñeca de colección", "Juego de mesa educativo",
            "Tenis deportivos y calcetines", "Mochila equipada con útiles escolares", "Chamarra térmica y gorro",
            "Set de libros de aventura", "Rompecabezas de 500 piezas", "Kit de pintura artística"
        ]

        # 0. Crear Puntos de Entrega y Eventos si no existen
        if PuntoEntrega.objects.count() == 0:
            self.stdout.write("Creando puntos de entrega base...")
            PuntoEntrega.objects.create(
                nombre_punto="Centro Comunitario Norte",
                direccion_fisica="Av. Independencia 405, Zona Norte",
                latitud=21.8853,
                longitud=-102.2916,
                horario_atencion="Lunes a Viernes 9:00 - 17:00",
                contacto_referencia="Sra. Martha Gómez",
                estado_punto="Activo"
            )
            PuntoEntrega.objects.create(
                nombre_punto="DIF Municipal Sur",
                direccion_fisica="Calle de la Salud 120, Fracc. Las Torres",
                latitud=21.8700,
                longitud=-102.2900,
                horario_atencion="Lunes a Sábado 10:00 - 18:00",
                contacto_referencia="Lic. José Antonio",
                estado_punto="Activo"
            )

        if Evento.objects.count() == 0:
            self.stdout.write("Creando eventos base...")
            Evento.objects.create(
                nombre_evento="Campaña Navideña 2026",
                tipo_evento="Navidad",
                fecha_inicio=date.today(),
                fecha_fin=date.today() + timedelta(days=60),
                estado_evento="Activo",
                descripcion="Campaña anual para llevar regalos navideños a los niños del programa."
            )

        evento = Evento.objects.first()
        punto = PuntoEntrega.objects.first()

        # 1. Generar 500 Padrinos (MySQL + Bitácora NoSQL)
        self.stdout.write("Poblando 500 Padrinos...")
        padrinos_creados = []
        for i in range(1, 501):
            nombre = f"{random.choice(nombres_masc if random.random() > 0.5 else nombres_fem)} {random.choice(apellidos)} {random.choice(apellidos)}"
            email = f"padrino{i}@smilelink.org"
            telefono = f"449-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            direccion = f"Calle {random.choice(apellidos)} #{random.randint(10, 999)}, Aguascalientes"
            
            padrino = Padrino(
                nombre_cifrado=cifrar_campo(nombre),
                email=email,
                telefono_cifrado=cifrar_campo(telefono),
                direccion_cifrada=cifrar_campo(direccion),
                activo=True
            )
            padrino.save()
            padrinos_creados.append(padrino)
            
            # Registrar logs aleatorios en Mongo
            if i % 10 == 0:
                registrar_bitacora(padrino.pk, 'api_padrino', 'CREATE', {'email': email})

        # 2. Generar 500 Niños (MySQL + Bitácora NoSQL)
        self.stdout.write("Poblando 500 Niños...")
        ninos_creados = []
        for i in range(1, 501):
            genero = "Masculino" if random.random() > 0.5 else "Femenino"
            nombre = f"{random.choice(nombres_masc if genero == 'Masculino' else nombres_fem)} {random.choice(apellidos)} {random.choice(apellidos)}"
            edad = random.randint(5, 16)
            descripcion = f"Niño alegre que está cursando la escuela básica. Interés por las actividades lúdicas."
            necesidades = random.sample(necesidades_pool, k=random.randint(1, 3))
            
            nino = Nino(
                nombre_cifrado=cifrar_campo(nombre),
                edad=edad,
                genero=genero,
                descripcion=descripcion,
                necesidades=necesidades,
                estado_apadrinamiento="Disponible",
                activo=True
            )
            nino.save()
            ninos_creados.append(nino)
            
            if i % 10 == 0:
                registrar_bitacora(None, 'api_nino', 'CREATE', {'nino_id': nino.pk, 'genero': genero})

        # 3. Vincular 300 Apadrinamientos (MySQL + Bitácora NoSQL)
        self.stdout.write("Creando 300 Apadrinamientos...")
        padrinos_elegidos = random.sample(padrinos_creados, 300)
        ninos_elegidos = random.sample(ninos_creados, 300)
        
        apadrinamientos_creados = []
        for idx in range(300):
            padrino = padrinos_elegidos[idx]
            nino = ninos_elegidos[idx]
            
            # Crear apadrinamiento
            ap = Apadrinamiento(
                id_padrino=padrino,
                id_nino=nino,
                id_evento=evento,
                tipo_apadrinamiento="Elección Padrino",
                estado_apadrinamiento_registro="Activo"
            )
            ap.save()
            apadrinamientos_creados.append(ap)
            
            # Actualizar estado del niño
            nino.estado_apadrinamiento = "Apadrinado"
            nino.id_padrino_actual = padrino
            nino.fecha_apadrinamiento_actual = ap.fecha_inicio
            nino.save()
            
            registrar_bitacora(padrino.pk, 'api_apadrinamiento', 'CREATE', {
                'apadrinamiento_id': ap.pk,
                'nino_id': nino.pk
            })

        # 4. Registrar 200 Entregas (MySQL + Evidencias en MongoDB)
        self.stdout.write("Poblando 200 Entregas y evidencias en NoSQL...")
        entregas_elegidas = random.sample(apadrinamientos_creados, 200)
        for idx, ap in enumerate(entregas_elegidas):
            estado = random.choice(["Pendiente", "En Proceso", "Entregado"])
            obs = "Regalo entregado en tiempo y forma a los padres." if estado == "Entregado" else "Entrega programada para fin de mes."
            
            entrega = Entrega(
                id_apadrinamiento=ap,
                id_punto_entrega=punto,
                descripcion_regalo=random.choice(regalos_pool),
                fecha_programada=date.today() + timedelta(days=random.randint(-15, 30)),
                estado_entrega=estado,
                observaciones_cifradas=cifrar_campo(obs)
            )
            if estado == "Entregado":
                entrega.fecha_entrega_real = date.today()
            entrega.save()
            
            # Guardar metadatos en MongoDB si el estado es 'Entregado' o 'En Proceso'
            if estado in ["Entregado", "En Proceso"] and random.random() > 0.3:
                mongo_id = guardar_evidencia(
                    entrega_id=entrega.pk,
                    apadrinamiento_id=ap.pk,
                    nino_id=ap.id_nino.pk,
                    tipo=random.choice(["foto", "video", "documento"]),
                    url_archivo=f"media/evidencias/E{entrega.pk}_proof.jpg",
                    metadatos={
                        "tamaño_bytes": random.randint(150000, 500000),
                        "formato": "JPEG",
                        "nombre_original": f"foto_evidencia_{entrega.pk}.jpg"
                    },
                    subido_por=ap.id_padrino.email
                )
                entrega.mongo_evidencia_id = mongo_id
                entrega.save()
                
            # Registrar bitácora de entrega
            registrar_bitacora(ap.id_padrino.pk, 'api_entrega', 'CREATE', {'entrega_id': entrega.pk})

        # 5. Generar 200 Solicitudes de Regalo y Cartas Cifradas
        self.stdout.write("Poblando 200 Solicitudes y Cartas...")
        for i in range(200):
            nino = random.choice(ninos_creados)
            sol = Solicitud(
                id_nino=nino,
                descripcion_solicitud=f"Solicitud especial de: {random.choice(necesidades_pool)}",
                estado_solicitud=random.choice(["Abierta", "En Proceso", "Cumplida"])
            )
            sol.save()
            
            # Registrar log de bitácora NoSQL
            mongo_log = registrar_bitacora(nino.pk, 'api_solicitud', 'CREATE', {
                'solicitud_id': sol.pk,
                'descripcion': sol.descripcion_solicitud
            })
            sol.mongo_log_id = mongo_log
            sol.save()
            
            # Si el niño tiene padrino, simular una carta guardada en MongoDB
            if nino.id_padrino_actual:
                guardar_carta(
                    nino_id=nino.pk,
                    apadrinamiento_id=nino.apadrinamientos.first().pk,
                    contenido_cifrado=cifrar_campo("Hola padrino, te escribo para darte las gracias por apoyarme. Espero verte pronto!"),
                    remitente="Niño"
                )

        self.stdout.write(self.style.SUCCESS(
            "\n✅ ¡Poblamiento masivo completado con éxito!"
            "\nMySQL poblado con más de 1700 registros (Padrinos, Niños, Apadrinamientos, Entregas, Solicitudes)"
            "\nMongoDB poblado con cientos de logs, evidencias desnormalizadas y cartas cifradas."
        ))
