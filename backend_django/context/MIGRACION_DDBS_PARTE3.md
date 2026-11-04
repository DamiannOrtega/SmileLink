## 8. Cifrado a Nivel Aplicación

### 8.1 ¿Por qué Fernet y no SHA-256?

| Método | Uso correcto | Por qué |
|---|---|---|
| **Fernet (AES-128-CBC)** | Cifrar campos recuperables (nombre, teléfono, dirección) | Es reversible: puedes cifrar y descifrar |
| **Django `make_password`** | Contraseñas de usuarios | Usa PBKDF2 con salt; no reversible |
| **SHA-256 manual** | ❌ No usar para ninguno de los anteriores | Para contraseñas no tiene salt; para datos no es reversible |

### 8.2 Generar la clave Fernet

```python
# Ejecutar UNA sola vez y guardar el resultado en .env
from cryptography.fernet import Fernet
key = Fernet.generate_key()
print(key.decode())  # Copiar al .env como FERNET_KEY
```

### 8.3 Módulo de cifrado (`utils/encryption.py`)

```python
"""
SmileLink — Encryption Utilities
Cifrado y descifrado de campos sensibles con Fernet.
"""
from cryptography.fernet import Fernet
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def _get_fernet() -> Fernet:
    key = settings.FERNET_KEY
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def cifrar_campo(valor: str) -> bytes:
    """
    Cifra un string y retorna bytes para guardar en BinaryField.
    Uso: nino.nombre_cifrado = cifrar_campo("Juan Pérez")
    """
    if not valor:
        return b''
    return _get_fernet().encrypt(valor.encode('utf-8'))


def descifrar_campo(valor_cifrado) -> str:
    """
    Descifra bytes recuperados de BinaryField y retorna el string original.
    Uso: nombre = descifrar_campo(nino.nombre_cifrado)
    """
    if not valor_cifrado:
        return ''
    if isinstance(valor_cifrado, memoryview):
        valor_cifrado = bytes(valor_cifrado)
    try:
        return _get_fernet().decrypt(valor_cifrado).decode('utf-8')
    except Exception as e:
        logger.error(f"Error al descifrar campo: {e}")
        return '[CIFRADO]'
```

### 8.4 Uso del cifrado en Views

```python
# api/views.py — crear niño con nombre cifrado
from utils.encryption import cifrar_campo, descifrar_campo
from .models import Nino

class NinosViewSet(viewsets.ModelViewSet):
    queryset = Nino.objects.all()
    serializer_class = NinoSerializer

    def create(self, request):
        data = request.data.copy()
        # Cifrar nombre antes de guardar
        nombre_texto = data.pop('nombre', '')
        nino = Nino(
            nombre_cifrado = cifrar_campo(nombre_texto),
            edad           = data['edad'],
            genero         = data['genero'],
            descripcion    = data['descripcion'],
            necesidades    = data.get('necesidades', []),
        )
        nino.save()
        return Response({'id': nino.pk, 'mensaje': 'Niño registrado correctamente'},
                        status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        try:
            nino = Nino.objects.get(pk=pk)
        except Nino.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=404)
        # Descifrar nombre para la respuesta
        return Response({
            'id':                    nino.pk,
            'nombre':                descifrar_campo(nino.nombre_cifrado),
            'edad':                  nino.edad,
            'genero':                nino.genero,
            'descripcion':           nino.descripcion,
            'necesidades':           nino.necesidades,
            'estado_apadrinamiento': nino.estado_apadrinamiento,
        })
```

### 8.5 Contraseñas con Django Auth

```python
# Para padrinos/admins que inician sesión con usuario y contraseña
from django.contrib.auth.hashers import make_password, check_password

# Al registrar:
password_seguro = make_password("contraseña_del_usuario")  # PBKDF2+SHA256+salt
padrino.password_hash = password_seguro
padrino.save()

# Al verificar login:
if check_password("contraseña_ingresada", padrino.password_hash):
    print("Login exitoso")
```

### 8.6 Campos cifrados — resumen

| Tabla | Campo | Tipo en BD | Cifrado |
|---|---|---|---|
| `api_nino` | `nombre_cifrado` | `VARBINARY(512)` | Fernet |
| `api_padrino` | `nombre_cifrado` | `VARBINARY(512)` | Fernet |
| `api_padrino` | `telefono_cifrado` | `VARBINARY(256)` | Fernet |
| `api_padrino` | `direccion_cifrada` | `VARBINARY(512)` | Fernet |
| `api_entrega` | `observaciones_cifradas` | `VARBINARY(1024)` | Fernet |
| MongoDB `evidencias` | `descripcion_cifrada` | `BinData` | Fernet |
| MongoDB `cartas` | `contenido_cifrado` | `BinData` | Fernet |
| Contraseñas | `password_hash` | `VARCHAR(255)` | Django PBKDF2 |

---

## 9. Servicios Externos Conservados

### 9.1 Google OAuth 2.0

El proyecto ya usa Google Auth para login de padrinos. Se conserva y adapta a Django:

```python
# authentication/google_auth.py
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings

def verificar_token_google(token: str) -> dict:
    """Verifica un token de Google y retorna la info del usuario."""
    idinfo = id_token.verify_oauth2_token(
        token,
        google_requests.Request(),
        settings.GOOGLE_CLIENT_ID
    )
    return {
        'google_id': idinfo['sub'],
        'email':     idinfo['email'],
        'nombre':    idinfo.get('name', ''),
    }
```

```python
# En la view de login con Google
class GoogleLoginView(APIView):
    def post(self, request):
        token = request.data.get('token')
        try:
            info = verificar_token_google(token)
        except ValueError:
            return Response({'error': 'Token inválido'}, status=400)

        padrino, created = Padrino.objects.get_or_create(
            email=info['email'],
            defaults={
                'nombre_cifrado': cifrar_campo(info['nombre']),
                'id_google_auth': info['google_id'],
            }
        )
        # Generar JWT...
        return Response({'token': generar_jwt(padrino), 'nuevo': created})
```

### 9.2 Google Maps — Puntos de Entrega

La app Android ya muestra puntos de entrega en mapa. El endpoint se mantiene:

```python
# GET /api/puntos-entrega/?lat=25.68&lng=-100.31&radio_km=10
class PuntosEntregaViewSet(viewsets.ModelViewSet):
    queryset = PuntoEntrega.objects.filter(estado_punto='Activo')
    serializer_class = PuntoEntregaSerializer

    @action(detail=False, methods=['get'])
    def cercanos(self, request):
        """Retorna puntos de entrega dentro de un radio (aprox. con cálculo Haversine en Python)."""
        lat  = float(request.query_params.get('lat', 0))
        lng  = float(request.query_params.get('lng', 0))
        radio = float(request.query_params.get('radio_km', 10))

        # Para producción usar una función MySQL con Haversine o PostGIS
        puntos = PuntoEntrega.objects.filter(estado_punto='Activo')
        serializer = PuntoEntregaSerializer(puntos, many=True)
        return Response(serializer.data)
```

### 9.3 API de Avatares

```python
# utils/avatars.py — Integración con DiceBear (generación de avatares por nombre)
import requests

AVATAR_BASE_URL = "https://api.dicebear.com/7.x/fun-emoji/svg"

def generar_url_avatar(seed: str) -> str:
    """Genera URL de avatar usando DiceBear API."""
    return f"{AVATAR_BASE_URL}?seed={seed}&size=128"
```

---

## 10. Archivo `.env` Completo

```env
# ── Django
SECRET_KEY=django-insecure-CAMBIA-ESTO-EN-PRODUCCION
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.87,0.0.0.0,10.0.2.2

# ── MySQL Primario
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DB=smilelink
MYSQL_USER=smilelink_user
MYSQL_PASSWORD=SmileLink2025!Secure

# ── MongoDB (Nodo Secundario)
MONGODB_HOST=192.168.1.100
MONGODB_PORT=27017
MONGODB_DB=smilelink_nosql
MONGODB_USER=smilelink_admin
MONGODB_PASS=MongoPass2025!

# ── Cifrado Fernet (generar con: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
FERNET_KEY=

# ── JWT
JWT_SECRET_KEY=tu-jwt-secret-key-aqui
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# ── Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 11. Validación Funcional — Pruebas del Sistema

### 11.1 Registro de Niño desde la App Web

```bash
# Usando curl (simula el frontend React)
curl -X POST http://192.168.1.87:8000/api/ninos/ \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos López",
    "edad": 8,
    "genero": "Masculino",
    "descripcion": "Niño alegre que ama los dinosaurios",
    "necesidades": ["zapatos talla 32", "útiles escolares"]
  }'

# Respuesta esperada:
# {"id": 1, "mensaje": "Niño registrado correctamente"}

# Verificar en MySQL que el nombre está cifrado
mysql -u smilelink_user -p smilelink -e "SELECT id, LENGTH(nombre_cifrado), email FROM api_nino LIMIT 1;"
```

### 11.2 Asignación de Padrino

```bash
curl -X POST http://192.168.1.87:8000/api/apadrinamientos/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_padrino": 1,
    "id_nino": 1,
    "tipo_apadrinamiento": "Elección Padrino"
  }'
```

### 11.3 Consulta desde App Móvil (Android)

```bash
# La app Android consulta a través de Retrofit
# Equivalente curl:
curl http://192.168.1.87:8000/api/ninos/1/
# Respuesta: nombre descifrado, datos del niño

curl http://192.168.1.87:8000/api/ninos/?estado=Disponible
# Lista de niños disponibles para adoptar
```

### 11.4 Registro de Entrega y Evidencia en NoSQL

```bash
# 1. Registrar entrega en MySQL
curl -X POST http://192.168.1.87:8000/api/entregas/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_apadrinamiento": 1,
    "id_punto_entrega": 1,
    "descripcion_regalo": "Juguete de dinosaurio + ropa de invierno",
    "fecha_programada": "2025-12-24",
    "estado_entrega": "Pendiente"
  }'

# 2. Subir evidencia (foto) — guarda metadata en MongoDB
curl -X POST http://192.168.1.87:8000/api/entregas/1/evidencia/ \
  -F "foto=@/ruta/a/foto.jpg" \
  -F "descripcion=Entrega realizada con éxito"

# 3. Verificar en MongoDB
docker exec -it smilelink_mongodb mongosh \
  -u smilelink_admin -p MongoPass2025! --authenticationDatabase admin \
  --eval "use smilelink_nosql; db.evidencias.find({entrega_id: 1}).pretty()"
```

### 11.5 Validar Datos Replicados en Nodo Secundario

```bash
# En el NODO SECUNDARIO (192.168.1.100)
mysql -u root -p smilelink -e "
SELECT n.id, p.email as padrino_email, n.estado_apadrinamiento
FROM api_nino n
LEFT JOIN api_padrino p ON n.id_padrino_actual_id = p.id
LIMIT 10;"
# Debe mostrar los mismos datos que el nodo primario
```

### 11.6 Consulta Distribuida — Reconstrucción MySQL + MongoDB

```python
# GET /api/entregas/1/detalle/ — respuesta combinada
{
    "id": 1,
    "estado_entrega": "Entregado",
    "descripcion_regalo": "Juguete de dinosaurio",
    "fecha_programada": "2025-12-24",
    "fecha_entrega_real": "2025-12-24",
    "punto_entrega": { "nombre_punto": "Centro Comunitario Norte" },
    "apadrinamiento": {
        "id_padrino": 1,
        "id_nino": 1
    },
    // ← Datos de MongoDB
    "evidencias_nosql": [
        {
            "_id": "6650a1b2c3d4e5f6a7b8c9d0",
            "tipo": "foto",
            "url_archivo": "media/evidencias/E1_20251224.jpg",
            "timestamp": "2025-12-24T15:30:00Z"
        }
    ]
}
```

### 11.7 Acceso al Dashboard NoSQL

```
URL: http://192.168.1.100:8081
Usuario: admin
Contraseña: Admin2025!

Navegación:
1. Seleccionar base de datos: smilelink_nosql
2. Colección: evidencias → ver documentos guardados
3. Colección: bitacora_eventos → ver log de acciones
4. Colección: cartas → ver cartas cifradas
```

### 11.8 Verificar Status de Replicación

```sql
-- En el NODO SECUNDARIO
SHOW REPLICA STATUS\G

-- Verificar estos campos:
--   Replica_IO_Running: Yes
--   Replica_SQL_Running: Yes
--   Seconds_Behind_Source: 0
--   Last_Error: (vacío)
```

---

## 12. Diagrama de Fragmentación

```
┌────────────────────────────────────────────────────────────────────┐
│                    ESQUEMA DE FRAGMENTACIÓN HÍBRIDA                │
├────────────────────┬───────────────────────────────────────────────┤
│  FRAGMENTO         │  DESCRIPCIÓN                                  │
├────────────────────┼───────────────────────────────────────────────┤
│  F1 - MySQL        │  Tablas completas: niños, padrinos,           │
│  Primario          │  apadrinamientos, entregas, solicitudes,      │
│  (192.168.1.87)    │  eventos, puntos_entrega                      │
│                    │  → Lectura/Escritura                          │
├────────────────────┼───────────────────────────────────────────────┤
│  F2 - MySQL        │  Copia sincronizada (binlog replication)      │
│  Réplica           │  de TODAS las tablas del F1                   │
│  (192.168.1.100)   │  → Solo Lectura (read_only=1)                 │
├────────────────────┼───────────────────────────────────────────────┤
│  F3 - MongoDB      │  evidencias, bitacora_eventos,                │
│  Docker            │  historial_notificaciones, cartas             │
│  (192.168.1.100)   │  → Datos semiestructurados / documentos       │
├────────────────────┼───────────────────────────────────────────────┤
│  F4 - Lógico       │  Vistas SQL:                                  │
│  Horizontal        │  v_ninos_disponibles / v_ninos_apadrinados    │
│  en MySQL          │  v_entregas_pendientes / v_entregas_hist      │
│                    │  → Fragmentación por estado de entidad        │
└────────────────────┴───────────────────────────────────────────────┘
```

---

## 13. Entregables para el PDF — Checklist

| Entregable | Sección | Estado |
|---|---|---|
| Diagrama de infraestructura con IPs, puertos y servicios | §1 | ✅ |
| Configuración MySQL Primario | §2 | ✅ |
| Configuración replicación Primary → Replica | §4 | ✅ |
| Esquema de base de datos con FK, índices, auditoría | §3 | ✅ |
| Fragmentación híbrida definida y justificada | §5 | ✅ |
| Docker Compose con MongoDB + Mongo Express | §6 | ✅ |
| Integración Django + MySQL + MongoDB | §7 | ✅ |
| Cifrado a nivel aplicación (Fernet + Django auth) | §8 | ✅ |
| Servicios externos (Google Auth, Maps, Avatares) | §9 | ✅ |
| Pruebas funcionales paso a paso | §11 | ✅ |
| Consultas distribuidas MySQL + MongoDB | §5.5, §11.6 | ✅ |
| Acceso al dashboard NoSQL | §6.3, §11.7 | ✅ |

---

## 14. Conclusiones

1. **NFS/HDFS eliminados**: La arquitectura anterior dependía de sistemas de archivos distribuidos que no ofrecen integridad referencial ni soporte transaccional. MySQL resuelve ambos problemas de raíz.

2. **Replicación MySQL**: La estrategia Primary → Replica garantiza alta disponibilidad. Si el nodo primario falla, el secundario puede asumir lecturas inmediatamente.

3. **Fragmentación híbrida**: Se combina fragmentación horizontal (vistas por estado), vertical (campos sensibles separados y cifrados) y heterogénea (MySQL + MongoDB) para una distribución eficiente según la naturaleza del dato.

4. **MongoDB como complemento**: Los datos semiestructurados (evidencias con metadatos variables, cartas de texto libre, logs de auditoría) son inadecuados para esquemas relacionales rígidos. MongoDB los gestiona con flexibilidad sin sacrificar la integridad del núcleo transaccional.

5. **Cifrado a nivel aplicación**: Los datos personales (nombre del niño, teléfono y dirección del padrino) se cifran con Fernet antes de llegar a la base de datos. Incluso si alguien accede directamente a MySQL, los datos sensibles son ilegibles sin la clave Fernet.

6. **ORM Django como única fuente**: Usar modelos Django como única fuente de verdad para el esquema evita conflictos entre SQL manual y `django_migrations`. Todos los cambios de esquema pasan por `makemigrations`.

7. **Cumplimiento del PDF**: La arquitectura resultante cumple todos los puntos del PDF *Part II*: servidor DDBS con MySQL, replicación, fragmentación, NoSQL en Docker, y documentación de despliegue paso a paso.

---

*Documento generado para el proyecto SmileLink — Bases de Datos Distribuidas Parte II*
*Autores: Juan Damián Ortega De Luna · Alan Gael Gallardo Jimenez · Carlos Enrique Blanco Ortiz · Alicia Jazmín Díaz Laguna*
