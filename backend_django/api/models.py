"""
SmileLink API — Models
Modelos Django para MySQL (ORM como única fuente de verdad).
Las tablas fueron creadas manualmente; usar: python manage.py migrate --fake-initial
"""
from django.db import models


class Administrador(models.Model):
    """Administradores del sistema (Gestor o Superadmin)."""
    ROL_CHOICES = [('Gestor', 'Gestor'), ('Superadmin', 'Superadmin')]

    nombre     = models.CharField(max_length=200)
    email      = models.EmailField(unique=True)
    rol        = models.CharField(max_length=20, choices=ROL_CHOICES, default='Gestor')
    activo     = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_administrador'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.rol})"


class Padrino(models.Model):
    """
    Padrinos/donantes del sistema.
    Los campos nombre, teléfono y dirección se guardan cifrados con Fernet (BinaryField).
    El email se guarda en texto plano para permitir búsquedas.
    """
    nombre_cifrado    = models.BinaryField()                              # Fernet
    email             = models.EmailField(unique=True)
    telefono_cifrado  = models.BinaryField(null=True, blank=True)         # Fernet
    direccion_cifrada = models.BinaryField(null=True, blank=True)         # Fernet
    id_google_auth    = models.CharField(max_length=255, null=True, blank=True)
    fecha_registro    = models.DateField(auto_now_add=True)
    activo            = models.BooleanField(default=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    # Contraseña (Django PBKDF2+salt — no SHA-256 manual)
    password_hash     = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        db_table = 'api_padrino'

    def __str__(self):
        return self.email


class Nino(models.Model):
    """Niños registrados en el programa de apadrinamiento."""
    ESTADO_CHOICES = [('Disponible', 'Disponible'), ('Apadrinado', 'Apadrinado')]
    GENERO_CHOICES = [('Masculino', 'Masculino'), ('Femenino', 'Femenino')]

    nombre_cifrado              = models.BinaryField()                   # Fernet
    edad                        = models.PositiveSmallIntegerField()
    genero                      = models.CharField(max_length=10, choices=GENERO_CHOICES)
    descripcion                 = models.TextField()
    necesidades                 = models.JSONField(default=list, blank=True)
    estado_apadrinamiento       = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default='Disponible'
    )
    id_padrino_actual           = models.ForeignKey(
        Padrino, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='ninos_actuales'
    )
    fecha_apadrinamiento_actual = models.DateField(null=True, blank=True)
    activo                      = models.BooleanField(default=True)
    created_at                  = models.DateTimeField(auto_now_add=True)
    updated_at                  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_nino'
        indexes  = [
            models.Index(fields=['estado_apadrinamiento']),
            models.Index(fields=['activo']),
        ]

    def __str__(self):
        return f"Niño #{self.pk} ({self.estado_apadrinamiento})"


class PuntoEntrega(models.Model):
    """Puntos físicos donde se realizan las entregas de regalos."""
    ESTADO_CHOICES = [('Activo', 'Activo'), ('Inactivo', 'Inactivo')]

    nombre_punto        = models.CharField(max_length=200)
    direccion_fisica    = models.TextField()
    latitud             = models.DecimalField(max_digits=10, decimal_places=7)
    longitud            = models.DecimalField(max_digits=10, decimal_places=7)
    horario_atencion    = models.CharField(max_length=255, blank=True)
    contacto_referencia = models.CharField(max_length=255, blank=True)
    estado_punto        = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='Activo')
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_puntoentrega'

    def __str__(self):
        return self.nombre_punto


class Evento(models.Model):
    """Eventos (Navidad, Día del Niño, Otro) que agrupan apadrinamientos."""
    TIPO_CHOICES   = [('Navidad', 'Navidad'), ('Día del Niño', 'Día del Niño'), ('Otro', 'Otro')]
    ESTADO_CHOICES = [('Planeado', 'Planeado'), ('Activo', 'Activo'), ('Cerrado', 'Cerrado')]

    nombre_evento  = models.CharField(max_length=200)
    tipo_evento    = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_inicio   = models.DateField()
    fecha_fin      = models.DateField()
    estado_evento  = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='Planeado')
    descripcion    = models.TextField(blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_evento'

    def __str__(self):
        return f"{self.nombre_evento} ({self.estado_evento})"


class Apadrinamiento(models.Model):
    """Relación entre Padrino y Niño, opcionalmente ligada a un Evento."""
    TIPO_CHOICES   = [
        ('Elección Padrino',     'Elección Padrino'),
        ('Asignación Automática','Asignación Automática'),
        ('Solicitud Niño',       'Solicitud Niño'),
    ]
    ESTADO_CHOICES = [('Activo', 'Activo'), ('Finalizado', 'Finalizado')]

    id_padrino   = models.ForeignKey(Padrino, on_delete=models.CASCADE, related_name='apadrinamientos')
    id_nino      = models.ForeignKey(Nino,    on_delete=models.CASCADE, related_name='apadrinamientos')
    id_evento    = models.ForeignKey(Evento,  null=True, blank=True, on_delete=models.SET_NULL)
    fecha_inicio = models.DateField(auto_now_add=True)
    fecha_fin    = models.DateField(null=True, blank=True)
    tipo_apadrinamiento            = models.CharField(
        max_length=30, choices=TIPO_CHOICES, default='Elección Padrino'
    )
    estado_apadrinamiento_registro = models.CharField(
        max_length=15, choices=ESTADO_CHOICES, default='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_apadrinamiento'

    def __str__(self):
        return f"Apadrinamiento #{self.pk} ({self.estado_apadrinamiento_registro})"


class Entrega(models.Model):
    """
    Registro de entrega de regalo.
    mongo_evidencia_id: ObjectId del documento en MongoDB (colección evidencias).
    observaciones_cifradas: texto cifrado con Fernet.
    """
    ESTADO_CHOICES = [
        ('Pendiente',   'Pendiente'),
        ('En Proceso',  'En Proceso'),
        ('Entregado',   'Entregado'),
    ]

    id_apadrinamiento      = models.ForeignKey(Apadrinamiento, on_delete=models.CASCADE, related_name='entregas')
    id_punto_entrega       = models.ForeignKey(PuntoEntrega,   on_delete=models.RESTRICT,  related_name='entregas')
    descripcion_regalo     = models.TextField()
    fecha_programada       = models.DateField()
    fecha_entrega_real     = models.DateField(null=True, blank=True)
    estado_entrega         = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='Pendiente')
    observaciones_cifradas = models.BinaryField(null=True, blank=True)  # Fernet
    mongo_evidencia_id     = models.CharField(max_length=50, blank=True)  # ObjectId MongoDB
    created_at             = models.DateTimeField(auto_now_add=True)
    updated_at             = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_entrega'
        indexes  = [models.Index(fields=['estado_entrega'])]

    def __str__(self):
        return f"Entrega #{self.pk} — {self.estado_entrega}"


class Solicitud(models.Model):
    """
    Solicitud de regalo de un niño.
    mongo_log_id: ObjectId del log en MongoDB (colección bitacora_eventos).
    """
    ESTADO_CHOICES = [('Abierta', 'Abierta'), ('En Proceso', 'En Proceso'), ('Cumplida', 'Cumplida')]

    id_nino               = models.ForeignKey(Nino,    on_delete=models.CASCADE)
    id_padrino_interesado = models.ForeignKey(
        Padrino,  null=True, blank=True, on_delete=models.SET_NULL,
        related_name='solicitudes_interesadas'
    )
    id_entrega_asociada   = models.ForeignKey(
        Entrega,  null=True, blank=True, on_delete=models.SET_NULL,
        related_name='solicitudes'
    )
    descripcion_solicitud = models.TextField()
    fecha_solicitud       = models.DateField(auto_now_add=True)
    fecha_cierre          = models.DateField(null=True, blank=True)
    estado_solicitud      = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='Abierta')
    mongo_log_id          = models.CharField(max_length=50, blank=True)  # ObjectId MongoDB
    created_at            = models.DateTimeField(auto_now_add=True)
    updated_at            = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_solicitud'

    def __str__(self):
        return f"Solicitud #{self.pk} ({self.estado_solicitud})"
