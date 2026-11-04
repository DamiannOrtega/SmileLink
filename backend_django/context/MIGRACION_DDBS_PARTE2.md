## 4. Replicación MySQL Primary → Replica

### 4.1 Crear usuario de replicación en el Nodo Primario

```sql
-- En el nodo PRIMARIO (192.168.1.87)
sudo mysql -u root -p

CREATE USER 'repl_user'@'192.168.1.100' IDENTIFIED WITH mysql_native_password BY 'ReplicaPass2025!';
GRANT REPLICATION SLAVE ON *.* TO 'repl_user'@'192.168.1.100';
FLUSH PRIVILEGES;

-- Obtener posición del binlog (guardar estos valores)
FLUSH TABLES WITH READ LOCK;
SHOW MASTER STATUS;
-- Anotar: File = mysql-bin.000001, Position = XXXX
UNLOCK TABLES;
```

Salida esperada:
```
+------------------+----------+--------------+------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB |
+------------------+----------+--------------+------------------+
| mysql-bin.000001 |      154  | smilelink    |                  |
+------------------+----------+--------------+------------------+
```

> **MySQL 8.0+:** `SHOW MASTER STATUS` fue renombrado a `SHOW BINARY LOG STATUS`. Ambos funcionan en MySQL 8.0.

### 4.2 Configurar Nodo Secundario (Replica)

En el **nodo secundario** (`192.168.1.100`), instalar MySQL igual que en el primario, luego editar `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
server-id          = 2
bind-address       = 0.0.0.0
relay-log          = /var/log/mysql/mysql-relay-bin.log
read_only          = 1
log_bin            = /var/log/mysql/mysql-bin.log
binlog_do_db       = smilelink
```

```bash
sudo systemctl restart mysql
```

### 4.3 Conectar la Replica al Primario

```sql
-- En el nodo SECUNDARIO
sudo mysql -u root -p

-- MySQL 8.0 usa CHANGE REPLICATION SOURCE TO
CHANGE REPLICATION SOURCE TO
    SOURCE_HOST='192.168.1.87',
    SOURCE_PORT=3306,
    SOURCE_USER='repl_user',
    SOURCE_PASSWORD='ReplicaPass2025!',
    SOURCE_LOG_FILE='mysql-bin.000001',
    SOURCE_LOG_POS=154;

-- Iniciar la réplica
START REPLICA;

-- Verificar estado (buscar: Replica_IO_Running: Yes, Replica_SQL_Running: Yes)
SHOW REPLICA STATUS\G
```

Salida exitosa esperada:
```
Replica_IO_Running: Yes
Replica_SQL_Running: Yes
Seconds_Behind_Source: 0
```

> **MySQL 5.7:** Usar `CHANGE MASTER TO` y `START SLAVE` / `SHOW SLAVE STATUS\G`.

### 4.4 Validar que la Réplica Funciona

```sql
-- En el PRIMARIO: insertar un registro de prueba
USE smilelink;
INSERT INTO api_puntoentrega (nombre_punto, direccion_fisica, latitud, longitud)
VALUES ('Centro Comunitario Test', 'Calle Prueba 123', 25.686614, -100.316113);

-- En el SECUNDARIO: verificar que se replicó
USE smilelink;
SELECT * FROM api_puntoentrega WHERE nombre_punto = 'Centro Comunitario Test';
-- Debe aparecer el registro sin haberlo insertado manualmente
```

---

## 5. Fragmentación Híbrida de Datos

El PDF pide implementar fragmentación. Para SmileLink se define la siguiente estrategia **híbrida**:

### 5.1 Mapa de Fragmentación

| Fragmento | Tipo | Nodo | Datos |
|---|---|---|---|
| F1 — Transaccional principal | Horizontal (completo) | MySQL Primario | Todas las tablas activas |
| F2 — Réplica sincronizada | Copia replicada | MySQL Secundario | Todas las tablas (read-only) |
| F3 — Datos semiestructurados | Vertical (complemento) | MongoDB Docker | Evidencias, logs, cartas, bitácora |
| F4 — Fragmentación horizontal lógica | Horizontal por estado | MySQL Primario | Niños activos vs histórico |

### 5.2 Fragmentación Horizontal Lógica en MySQL

```sql
-- Vista: niños disponibles para apadrinar (fragmento activo)
CREATE VIEW v_ninos_disponibles AS
SELECT * FROM api_nino
WHERE estado_apadrinamiento = 'Disponible' AND activo = 1;

-- Vista: niños ya apadrinados (fragmento histórico)
CREATE VIEW v_ninos_apadrinados AS
SELECT * FROM api_nino
WHERE estado_apadrinamiento = 'Apadrinado' AND activo = 1;

-- Vista: entregas pendientes (fragmento operativo)
CREATE VIEW v_entregas_pendientes AS
SELECT e.*, ap.id_padrino_id, ap.id_nino_id
FROM api_entrega e
JOIN api_apadrinamiento ap ON e.id_apadrinamiento_id = ap.id
WHERE e.estado_entrega IN ('Pendiente', 'En Proceso');

-- Vista: entregas completadas (fragmento histórico)
CREATE VIEW v_entregas_completadas AS
SELECT * FROM api_entrega WHERE estado_entrega = 'Entregado';
```

### 5.3 Fragmentación Vertical — Separar Datos Sensibles

Los campos cifrados (`nombre_cifrado`, `telefono_cifrado`, `direccion_cifrada`) residen en columnas VARBINARY separadas de los datos operativos. Django los recupera y descifra solo cuando son necesarios, evitando exponer PII en logs o consultas de analítica.

```sql
-- Consulta operativa (sin datos sensibles)
SELECT id, email, fecha_registro, activo FROM api_padrino;

-- Consulta con datos personales (solo cuando se necesitan)
SELECT id, email, nombre_cifrado, telefono_cifrado, direccion_cifrada FROM api_padrino WHERE id = 5;
```

### 5.4 Fragmento NoSQL — Datos Semiestructurados en MongoDB

Colecciones en MongoDB (`smilelink_nosql`):

| Colección | Contenido | Campo de unión |
|---|---|---|
| `evidencias` | Fotos/archivos de entrega, metadatos | `entrega_id` (int MySQL) |
| `bitacora_eventos` | Log de acciones de usuarios | `usuario_id`, `tabla`, `accion` |
| `historial_notificaciones` | Notificaciones push enviadas | `padrino_id` |
| `cartas` | Cartas del niño al padrino (texto libre) | `nino_id`, `apadrinamiento_id` |

**Ejemplo de documento `evidencias`:**
```json
{
  "_id": "ObjectId('6650a1b2c3d4e5f6a7b8c9d0')",
  "entrega_id": 42,
  "apadrinamiento_id": 15,
  "nino_id": 7,
  "tipo": "foto",
  "descripcion_cifrada": "<bytes Fernet>",
  "url_archivo": "media/evidencias/E42_20251224.jpg",
  "metadatos": {
    "tamaño_bytes": 204800,
    "formato": "JPEG",
    "resolucion": "1920x1080"
  },
  "subido_por": "padrino@email.com",
  "timestamp": "2025-12-24T15:30:00Z"
}
```

### 5.5 Reconstrucción de Datos — Consulta Distribuida

Cuando la app consulta el detalle de una entrega, Django combina MySQL + MongoDB:

```python
# api/views.py — endpoint de detalle de entrega con datos combinados

from pymongo import MongoClient
from django.conf import settings

def get_mongo_client():
    return MongoClient(settings.MONGODB_HOST, settings.MONGODB_PORT)

class EntregaDetalleView(APIView):
    """
    GET /api/entregas/{id}/detalle/
    Reconstruye datos de MySQL + MongoDB
    """
    def get(self, request, pk):
        # 1. Datos relacionales desde MySQL
        try:
            entrega = Entrega.objects.select_related(
                'id_apadrinamiento',
                'id_punto_entrega',
                'id_apadrinamiento__id_padrino',
                'id_apadrinamiento__id_nino'
            ).get(pk=pk)
        except Entrega.DoesNotExist:
            return Response({'error': 'Entrega no encontrada'}, status=404)

        # 2. Datos semiestructurados desde MongoDB
        client = get_mongo_client()
        db = client[settings.MONGODB_DB]
        evidencias = list(db.evidencias.find(
            {'entrega_id': pk},
            {'_id': 1, 'tipo': 1, 'url_archivo': 1, 'timestamp': 1}
        ))
        # Convertir ObjectId a string
        for ev in evidencias:
            ev['_id'] = str(ev['_id'])

        # 3. Reconstrucción en la respuesta
        data = EntregaSerializer(entrega).data
        data['evidencias_nosql'] = evidencias
        return Response(data)
```

---

## 6. Nodo NoSQL — Docker en Nodo Secundario

### 6.1 `docker-compose.yml`

Colocar en `/home/ubuntu/smilelink-nosql/docker-compose.yml` en el **nodo secundario (192.168.1.100)**:

```yaml
version: "3.9"

services:
  mongodb:
    image: mongo:7.0
    container_name: smilelink_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: smilelink_admin
      MONGO_INITDB_ROOT_PASSWORD: MongoPass2025!
      MONGO_INITDB_DATABASE: smilelink_nosql
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - smilelink_net

  mongo-express:
    image: mongo-express:1.0.2
    container_name: smilelink_mongo_express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: smilelink_admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: MongoPass2025!
      ME_CONFIG_MONGODB_URL: mongodb://smilelink_admin:MongoPass2025!@mongodb:27017/
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: Admin2025!
    depends_on:
      - mongodb
    networks:
      - smilelink_net

volumes:
  mongo_data:
    driver: local
  mongo_config:
    driver: local

networks:
  smilelink_net:
    driver: bridge
```

### 6.2 Script de inicialización MongoDB (`init-mongo.js`)

```javascript
// init-mongo.js — crea colecciones con validación de esquema
db = db.getSiblingDB('smilelink_nosql');

db.createCollection('evidencias', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['entrega_id', 'tipo', 'timestamp'],
      properties: {
        entrega_id:    { bsonType: 'int',    description: 'ID de entrega en MySQL' },
        tipo:          { enum: ['foto', 'video', 'documento'], description: 'Tipo de evidencia' },
        url_archivo:   { bsonType: 'string' },
        timestamp:     { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('bitacora_eventos');
db.createCollection('historial_notificaciones');
db.createCollection('cartas');

// Índices
db.evidencias.createIndex({ entrega_id: 1 });
db.evidencias.createIndex({ apadrinamiento_id: 1 });
db.bitacora_eventos.createIndex({ timestamp: -1 });
db.bitacora_eventos.createIndex({ usuario_id: 1 });
db.historial_notificaciones.createIndex({ padrino_id: 1 });
db.cartas.createIndex({ nino_id: 1, apadrinamiento_id: 1 });

print('SmileLink NoSQL collections initialized');
```

### 6.3 Comandos de Operación

```bash
# Levantar contenedores
cd /home/ubuntu/smilelink-nosql
docker compose up -d

# Verificar contenedores corriendo
docker ps

# Ver logs de MongoDB
docker logs smilelink_mongodb -f

# Ver logs de Mongo Express
docker logs smilelink_mongo_express -f

# Entrar al shell de MongoDB
docker exec -it smilelink_mongodb mongosh \
  -u smilelink_admin -p MongoPass2025! --authenticationDatabase admin

# Acceder al dashboard web
# Navegar a: http://192.168.1.100:8081
# Usuario: admin  |  Contraseña: Admin2025!
```

### 6.4 Validar que MongoDB Guarda Documentos

```bash
# Dentro de mongosh
use smilelink_nosql

db.evidencias.insertOne({
  entrega_id: 1,
  apadrinamiento_id: 1,
  nino_id: 1,
  tipo: "foto",
  descripcion_cifrada: "ENCRYPTED_BYTES",
  url_archivo: "media/evidencias/test.jpg",
  metadatos: { tamaño_bytes: 512, formato: "JPEG" },
  subido_por: "admin@smilelink.mx",
  timestamp: new Date()
})

db.evidencias.find({ entrega_id: 1 }).pretty()
# Debe retornar el documento insertado

db.evidencias.countDocuments()
# Debe retornar 1
```

---

## 7. Integración Django + MySQL + MongoDB

### 7.1 `requirements.txt` actualizado

```text
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.0
mysqlclient==2.2.4
pymongo==4.6.1
cryptography==41.0.7
PyJWT==2.8.0
google-auth==2.25.2
google-auth-oauthlib==1.2.0
google-auth-httplib2==0.2.0
python-dotenv==1.0.0
gunicorn==21.2.0
whitenoise==6.6.0
Pillow==10.2.0
```

### 7.2 `smilelink/settings.py` — sección actualizada

```python
# ── MySQL como base principal
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME':     os.getenv('MYSQL_DB',       'smilelink'),
        'USER':     os.getenv('MYSQL_USER',     'smilelink_user'),
        'PASSWORD': os.getenv('MYSQL_PASSWORD',  ''),
        'HOST':     os.getenv('MYSQL_HOST',     '127.0.0.1'),
        'PORT':     os.getenv('MYSQL_PORT',     '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'sql_mode': 'STRICT_TRANS_TABLES',
        },
    }
}

# ── MongoDB (NoSQL)
MONGODB_HOST = os.getenv('MONGODB_HOST', '192.168.1.100')
MONGODB_PORT = int(os.getenv('MONGODB_PORT', '27017'))
MONGODB_DB   = os.getenv('MONGODB_DB',   'smilelink_nosql')
MONGODB_USER = os.getenv('MONGODB_USER', 'smilelink_admin')
MONGODB_PASS = os.getenv('MONGODB_PASS', '')

# ── Cifrado Fernet
FERNET_KEY = os.getenv('FERNET_KEY', '')  # Generar con: Fernet.generate_key()

# ── Eliminar configuración NFS/HDFS (ya no aplica)
# USE_NFS, USE_HDFS_REPLICATION, NFS_*, HDFS_* → ELIMINAR del .env y settings
```

### 7.3 `api/models.py` — Modelos Django completos

```python
"""
SmileLink API — Models
Modelos Django para MySQL. Usar SOLO makemigrations para crear tablas.
"""
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class Administrador(models.Model):
    nombre  = models.CharField(max_length=200)
    email   = models.EmailField(unique=True)
    rol     = models.CharField(
        max_length=20,
        choices=[('Gestor', 'Gestor'), ('Superadmin', 'Superadmin')],
        default='Gestor'
    )
    activo     = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # La contraseña se maneja con el sistema de auth de Django (no SHA-256 manual)
    # Usar AbstractUser o relacionar con User de Django en producción

    class Meta:
        db_table = 'api_administrador'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.rol})"


class Padrino(models.Model):
    nombre_cifrado   = models.BinaryField()        # Fernet
    email            = models.EmailField(unique=True)
    telefono_cifrado = models.BinaryField(null=True, blank=True)  # Fernet
    direccion_cifrada = models.BinaryField(null=True, blank=True) # Fernet
    id_google_auth   = models.CharField(max_length=255, null=True, blank=True)
    fecha_registro   = models.DateField(auto_now_add=True)
    activo           = models.BooleanField(default=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_padrino'

    def __str__(self):
        return self.email


class Nino(models.Model):
    ESTADO_CHOICES = [('Disponible', 'Disponible'), ('Apadrinado', 'Apadrinado')]
    GENERO_CHOICES = [('Masculino', 'Masculino'), ('Femenino', 'Femenino')]

    nombre_cifrado              = models.BinaryField()   # Fernet
    edad                        = models.PositiveSmallIntegerField()
    genero                      = models.CharField(max_length=10, choices=GENERO_CHOICES)
    descripcion                 = models.TextField()
    necesidades                 = models.JSONField(default=list)
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


class PuntoEntrega(models.Model):
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


class Evento(models.Model):
    TIPO_CHOICES   = [('Navidad','Navidad'), ('Día del Niño','Día del Niño'), ('Otro','Otro')]
    ESTADO_CHOICES = [('Planeado','Planeado'), ('Activo','Activo'), ('Cerrado','Cerrado')]

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


class Apadrinamiento(models.Model):
    TIPO_CHOICES   = [
        ('Elección Padrino','Elección Padrino'),
        ('Asignación Automática','Asignación Automática'),
        ('Solicitud Niño','Solicitud Niño'),
    ]
    ESTADO_CHOICES = [('Activo','Activo'), ('Finalizado','Finalizado')]

    id_padrino   = models.ForeignKey(Padrino, on_delete=models.CASCADE, related_name='apadrinamientos')
    id_nino      = models.ForeignKey(Nino, on_delete=models.CASCADE, related_name='apadrinamientos')
    id_evento    = models.ForeignKey(Evento, null=True, blank=True, on_delete=models.SET_NULL)
    fecha_inicio = models.DateField(auto_now_add=True)
    fecha_fin    = models.DateField(null=True, blank=True)
    tipo_apadrinamiento = models.CharField(max_length=30, choices=TIPO_CHOICES, default='Elección Padrino')
    estado_apadrinamiento_registro = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='Activo')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_apadrinamiento'


class Entrega(models.Model):
    ESTADO_CHOICES = [('Pendiente','Pendiente'), ('En Proceso','En Proceso'), ('Entregado','Entregado')]

    id_apadrinamiento  = models.ForeignKey(Apadrinamiento, on_delete=models.CASCADE, related_name='entregas')
    id_punto_entrega   = models.ForeignKey(PuntoEntrega, on_delete=models.RESTRICT, related_name='entregas')
    descripcion_regalo = models.TextField()
    fecha_programada   = models.DateField()
    fecha_entrega_real = models.DateField(null=True, blank=True)
    estado_entrega     = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='Pendiente')
    observaciones_cifradas = models.BinaryField(null=True, blank=True)  # Fernet
    mongo_evidencia_id = models.CharField(max_length=50, blank=True)    # ObjectId MongoDB
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_entrega'
        indexes  = [models.Index(fields=['estado_entrega'])]


class Solicitud(models.Model):
    ESTADO_CHOICES = [('Abierta','Abierta'), ('En Proceso','En Proceso'), ('Cumplida','Cumplida')]

    id_nino                 = models.ForeignKey(Nino, on_delete=models.CASCADE)
    id_padrino_interesado   = models.ForeignKey(
        Padrino, null=True, blank=True, on_delete=models.SET_NULL
    )
    id_entrega_asociada     = models.ForeignKey(
        Entrega, null=True, blank=True, on_delete=models.SET_NULL
    )
    descripcion_solicitud   = models.TextField()
    fecha_solicitud         = models.DateField(auto_now_add=True)
    fecha_cierre            = models.DateField(null=True, blank=True)
    estado_solicitud        = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='Abierta')
    mongo_log_id            = models.CharField(max_length=50, blank=True)  # ObjectId MongoDB

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_solicitud'
```

### 7.4 Ejecutar migraciones

```bash
cd backend_django

# Instalar dependencias
pip install -r requirements.txt

# Generar migraciones desde los modelos
python manage.py makemigrations api

# Aplicar migraciones (crea las tablas en MySQL)
python manage.py migrate

# Verificar tablas creadas
python manage.py dbshell
# Dentro de MySQL:
SHOW TABLES;
```

### 7.5 Acceso a MongoDB desde Django (`api/mongo_client.py`)

```python
"""
SmileLink — MongoDB Client
Módulo centralizado para conexión a MongoDB (nodo secundario).
"""
from pymongo import MongoClient
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

_client = None

def get_mongo_db():
    """Retorna la base de datos MongoDB (singleton)."""
    global _client
    if _client is None:
        uri = (
            f"mongodb://{settings.MONGODB_USER}:{settings.MONGODB_PASS}"
            f"@{settings.MONGODB_HOST}:{settings.MONGODB_PORT}/"
            f"?authSource=admin"
        )
        _client = MongoClient(uri, serverSelectionTimeoutMS=3000)
    return _client[settings.MONGODB_DB]


def guardar_evidencia(entrega_id: int, apadrinamiento_id: int, nino_id: int,
                       tipo: str, url_archivo: str, metadatos: dict,
                       subido_por: str, descripcion_cifrada: bytes = None) -> str:
    """
    Guarda evidencia de entrega en MongoDB.
    Retorna el ObjectId del documento insertado como string.
    """
    from datetime import datetime, timezone
    db = get_mongo_db()
    doc = {
        'entrega_id':          entrega_id,
        'apadrinamiento_id':   apadrinamiento_id,
        'nino_id':             nino_id,
        'tipo':                tipo,
        'url_archivo':         url_archivo,
        'descripcion_cifrada': descripcion_cifrada,
        'metadatos':           metadatos,
        'subido_por':          subido_por,
        'timestamp':           datetime.now(timezone.utc),
    }
    result = db.evidencias.insert_one(doc)
    logger.info(f"Evidencia guardada en MongoDB: {result.inserted_id}")
    return str(result.inserted_id)


def registrar_bitacora(usuario_id, tabla: str, accion: str, detalle: dict = None):
    """Registra una acción en la bitácora de MongoDB."""
    from datetime import datetime, timezone
    db = get_mongo_db()
    db.bitacora_eventos.insert_one({
        'usuario_id': usuario_id,
        'tabla':      tabla,
        'accion':     accion,
        'detalle':    detalle or {},
        'timestamp':  datetime.now(timezone.utc),
    })


def guardar_carta(nino_id: int, apadrinamiento_id: int, contenido_cifrado: bytes,
                   remitente: str) -> str:
    """Guarda carta del niño al padrino en MongoDB."""
    from datetime import datetime, timezone
    db = get_mongo_db()
    result = db.cartas.insert_one({
        'nino_id':             nino_id,
        'apadrinamiento_id':   apadrinamiento_id,
        'contenido_cifrado':   contenido_cifrado,
        'remitente':           remitente,
        'timestamp':           datetime.now(timezone.utc),
    })
    return str(result.inserted_id)
```
