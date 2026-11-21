# SmileLink — Migración Formal a DDBS Parte II
## MySQL Primario · MySQL Réplica · Fragmentación Híbrida · NoSQL Docker · Django · Cifrado

---

## 0. Contexto y Justificación

El proyecto SmileLink pasó de un almacenamiento basado en **archivos JSON cifrados + NFS + HDFS** a una infraestructura de **Bases de Datos Distribuidas** acorde con el PDF *Distributed Databases – Final Project Design Definition (Part II)*.

| Aspecto | Arquitectura anterior | Nueva arquitectura |
|---|---|---|
| Almacenamiento | Archivos `.json.enc` en disco | MySQL con ORM Django |
| Replicación | HDFS (Hadoop) | MySQL Primary → Replica |
| Semiestructurado | Archivos JSON en NFS | MongoDB en Docker |
| Cifrado | Archivos completos cifrados | Campos sensibles con Fernet |
| Integridad | Manual en código Python | Claves foráneas + transacciones |
| Búsquedas | Carga masiva en RAM | Índices SQL + queries optimizadas |

---

## 1. Diagrama de Infraestructura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RED LOCAL / VPN                               │
│                                                                     │
│  ┌──────────────────────────────────────┐                           │
│  │  NODO PRIMARIO  (VM Ubuntu)          │                           │
│  │  IP: 192.168.1.87                    │                           │
│  │  ─────────────────────────────────   │                           │
│  │  • Django (puerto 8000)              │                           │
│  │  • MySQL Primary (puerto 3306)       │                           │
│  │  • Servir web React + API Android    │                           │
│  └──────────────┬───────────────────────┘                           │
│                 │ MySQL Replication (binlog)                         │
│                 ▼                                                   │
│  ┌──────────────────────────────────────┐                           │
│  │  NODO SECUNDARIO  (VM Ubuntu)        │                           │
│  │  IP: 192.168.1.100                   │                           │
│  │  ─────────────────────────────────   │                           │
│  │  • MySQL Replica (puerto 3306)       │                           │
│  │  • MongoDB (Docker, puerto 27017)    │                           │
│  │  • Mongo Express (Docker, 8081)      │                           │
│  └──────────────────────────────────────┘                           │
│                                                                     │
│  Clientes:                                                          │
│  • Frontend React  → http://192.168.1.87:8000                       │
│  • Android App     → http://192.168.1.87:8000/api/                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Puertos y servicios**

| Servicio | Nodo | Puerto | Protocolo |
|---|---|---|---|
| Django / Gunicorn | Primario | 8000 | HTTP |
| MySQL Primary | Primario | 3306 | TCP |
| MySQL Replica | Secundario | 3306 | TCP |
| MongoDB | Secundario (Docker) | 27017 | TCP |
| Mongo Express | Secundario (Docker) | 8081 | HTTP |

---

## 2. Nodo Primario — MySQL + Django

### 2.1 Instalación de MySQL en Ubuntu Server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y mysql-server mysql-client

# Asegurar instalación
sudo mysql_secure_installation
# → Responder: Y, Y, 2 (STRONG), <password>, Y, Y, Y, Y

sudo systemctl enable mysql
sudo systemctl status mysql
```

### 2.2 Crear base de datos y usuario Django

```sql
sudo mysql -u root -p

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS smilelink
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Usuario para Django (acceso desde cualquier IP de la red)
CREATE USER 'smilelink_user'@'%' IDENTIFIED BY 'SmileLink2025!Secure';
GRANT ALL PRIVILEGES ON smilelink.* TO 'smilelink_user'@'%';
FLUSH PRIVILEGES;

-- Verificar
SHOW GRANTS FOR 'smilelink_user'@'%';
```

### 2.3 Configurar MySQL para replicación y acceso remoto

Editar `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# ── Identidad del nodo
server-id          = 1
bind-address       = 0.0.0.0

# ── Binary log para replicación
log_bin            = /var/log/mysql/mysql-bin.log
binlog_do_db       = smilelink
expire_logs_days   = 7
max_binlog_size    = 100M

# ── Performance
innodb_buffer_pool_size = 256M
innodb_log_file_size    = 64M

# ── Charset
character-set-server    = utf8mb4
collation-server        = utf8mb4_unicode_ci
```

```bash
sudo systemctl restart mysql
sudo ufw allow 3306/tcp
sudo ufw allow 8000/tcp
```

---

## 3. Esquema de Base de Datos MySQL

**Estrategia recomendada: usar modelos Django (ORM) como única fuente de verdad.**
No crear tablas con SQL manual y también con `migrate` — eso genera conflictos.
Se define todo en `models.py` y se ejecuta `python manage.py makemigrations && migrate`.

### 3.1 Script SQL de referencia (equivalente a los modelos Django)

```sql
USE smilelink;

-- ─────────────────────────────────────────────
-- Administradores
-- ─────────────────────────────────────────────
CREATE TABLE api_administrador (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(200)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    rol             ENUM('Gestor','Superadmin') NOT NULL DEFAULT 'Gestor',
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol   (rol)
);

-- ─────────────────────────────────────────────
-- Padrinos
-- ─────────────────────────────────────────────
CREATE TABLE api_padrino (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_cifrado      VARBINARY(512)  NOT NULL,   -- cifrado Fernet
    email               VARCHAR(255)    NOT NULL UNIQUE,
    telefono_cifrado    VARBINARY(256),              -- cifrado Fernet
    direccion_cifrada   VARBINARY(512),              -- cifrado Fernet
    id_google_auth      VARCHAR(255),
    fecha_registro      DATE            NOT NULL,
    activo              TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email     (email)
);

-- ─────────────────────────────────────────────
-- Niños
-- ─────────────────────────────────────────────
CREATE TABLE api_nino (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_cifrado              VARBINARY(512)  NOT NULL,   -- cifrado Fernet
    edad                        TINYINT UNSIGNED NOT NULL,
    genero                      ENUM('Masculino','Femenino') NOT NULL,
    descripcion                 TEXT            NOT NULL,
    necesidades                 JSON,
    estado_apadrinamiento       ENUM('Disponible','Apadrinado') NOT NULL DEFAULT 'Disponible',
    id_padrino_actual_id        BIGINT,
    fecha_apadrinamiento_actual DATE,
    activo                      TINYINT(1)      NOT NULL DEFAULT 1,
    created_at                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_padrino_actual_id) REFERENCES api_padrino(id) ON DELETE SET NULL,
    INDEX idx_estado  (estado_apadrinamiento),
    INDEX idx_activo  (activo)
);

-- ─────────────────────────────────────────────
-- Puntos de Entrega
-- ─────────────────────────────────────────────
CREATE TABLE api_puntoentrega (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_punto         VARCHAR(200)    NOT NULL,
    direccion_fisica     TEXT            NOT NULL,
    latitud              DECIMAL(10,7)   NOT NULL,
    longitud             DECIMAL(10,7)   NOT NULL,
    horario_atencion     VARCHAR(255),
    contacto_referencia  VARCHAR(255),
    estado_punto         ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
    created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado     (estado_punto),
    SPATIAL INDEX        (latitud, longitud)   -- para consultas de mapa
);

-- ─────────────────────────────────────────────
-- Eventos
-- ─────────────────────────────────────────────
CREATE TABLE api_evento (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_evento  VARCHAR(200)    NOT NULL,
    tipo_evento    ENUM('Navidad','Día del Niño','Otro') NOT NULL,
    fecha_inicio   DATE            NOT NULL,
    fecha_fin      DATE            NOT NULL,
    estado_evento  ENUM('Planeado','Activo','Cerrado') NOT NULL DEFAULT 'Planeado',
    descripcion    TEXT,
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_fechas CHECK (fecha_fin >= fecha_inicio),
    INDEX idx_estado (estado_evento)
);

-- ─────────────────────────────────────────────
-- Apadrinamientos
-- ─────────────────────────────────────────────
CREATE TABLE api_apadrinamiento (
    id                              BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_padrino_id                   BIGINT  NOT NULL,
    id_nino_id                      BIGINT  NOT NULL,
    id_evento_id                    BIGINT,
    fecha_inicio                    DATE    NOT NULL,
    fecha_fin                       DATE,
    tipo_apadrinamiento             ENUM('Elección Padrino','Asignación Automática','Solicitud Niño')
                                            NOT NULL DEFAULT 'Elección Padrino',
    estado_apadrinamiento_registro  ENUM('Activo','Finalizado') NOT NULL DEFAULT 'Activo',
    created_at                      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_padrino_id) REFERENCES api_padrino(id)  ON DELETE CASCADE,
    FOREIGN KEY (id_nino_id)    REFERENCES api_nino(id)     ON DELETE CASCADE,
    FOREIGN KEY (id_evento_id)  REFERENCES api_evento(id)   ON DELETE SET NULL,
    UNIQUE KEY unique_padrino_nino_activo (id_padrino_id, id_nino_id, estado_apadrinamiento_registro),
    INDEX idx_estado (estado_apadrinamiento_registro)
);

-- ─────────────────────────────────────────────
-- Entregas
-- ─────────────────────────────────────────────
CREATE TABLE api_entrega (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_apadrinamiento_id    BIGINT          NOT NULL,
    id_punto_entrega_id     BIGINT          NOT NULL,
    descripcion_regalo      TEXT            NOT NULL,
    fecha_programada        DATE            NOT NULL,
    fecha_entrega_real      DATE,
    estado_entrega          ENUM('Pendiente','En Proceso','Entregado') NOT NULL DEFAULT 'Pendiente',
    observaciones_cifradas  VARBINARY(1024),  -- cifrado Fernet
    mongo_evidencia_id      VARCHAR(50),      -- ObjectId de MongoDB
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_apadrinamiento_id) REFERENCES api_apadrinamiento(id) ON DELETE CASCADE,
    FOREIGN KEY (id_punto_entrega_id)  REFERENCES api_puntoentrega(id)   ON DELETE RESTRICT,
    INDEX idx_estado         (estado_entrega),
    INDEX idx_fecha_prog     (fecha_programada)
);

-- ─────────────────────────────────────────────
-- Solicitudes / Evidencias
-- ─────────────────────────────────────────────
CREATE TABLE api_solicitud (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_nino_id              BIGINT  NOT NULL,
    id_padrino_interesado_id BIGINT,
    id_entrega_asociada_id  BIGINT,
    descripcion_solicitud   TEXT    NOT NULL,
    fecha_solicitud         DATE    NOT NULL,
    fecha_cierre            DATE,
    estado_solicitud        ENUM('Abierta','En Proceso','Cumplida') NOT NULL DEFAULT 'Abierta',
    mongo_log_id            VARCHAR(50),  -- ObjectId de log en MongoDB
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_nino_id)                REFERENCES api_nino(id)     ON DELETE CASCADE,
    FOREIGN KEY (id_padrino_interesado_id)  REFERENCES api_padrino(id)  ON DELETE SET NULL,
    FOREIGN KEY (id_entrega_asociada_id)    REFERENCES api_entrega(id)  ON DELETE SET NULL,
    INDEX idx_estado (estado_solicitud)
);
```

> **Por qué usar modelos Django y no SQL manual:**
> Django `makemigrations` genera las mismas tablas anteriores de forma controlada y versionada.
> Crear tablas manualmente con SQL y también ejecutar `migrate` causa conflictos de `django_migrations`.
> **Regla:** todo se define en `models.py`, nunca se mezclan ambos enfoques.
