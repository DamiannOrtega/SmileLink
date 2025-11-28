# SmileLink Backend Django

Backend REST API para SmileLink con almacenamiento basado en archivos JSON encriptados.

## 🚀 Quick Start

### 1. Instalar Dependencias

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. Generar Encryption Key

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Copiar el resultado a .env como ENCRYPTION_KEY
```

### 4. Iniciar Servidor

```bash
python manage.py runserver 0.0.0.0:8000
```

## 📁 Estructura del Proyecto

```
backend_django/
├── manage.py
├── requirements.txt
├── .env
├── smilelink/          # Configuración Django
├── api/                # REST API endpoints
├── storage/            # File storage + encryption
├── authentication/     # Google OAuth + JWT
└── utils/              # Helpers
```

## 🔌 API Endpoints

### Base URL: `http://192.168.1.60:8000/api/`

#### Niños
- `GET /api/ninos/` - Listar todos
- `POST /api/ninos/` - Crear
- `GET /api/ninos/{id}/` - Detalle
- `PATCH /api/ninos/{id}/` - Actualizar
- `DELETE /api/ninos/{id}/` - Eliminar

#### Padrinos
- `GET /api/padrinos/` - Listar
- `POST /api/padrinos/` - Crear
- `GET /api/padrinos/{id}/` - Detalle
- `GET /api/padrinos/me/` - Perfil propio

#### Apadrinamientos
- `GET /api/apadrinamientos/` - Listar
- `POST /api/apadrinamientos/` - Crear
- `GET /api/apadrinamientos/{id}/` - Detalle

#### Otros
- Entregas, Solicitudes, Puntos Entrega, Eventos, Administradores

### Autenticación
- `POST /api/auth/google/` - Login con Google
- `POST /api/auth/token/refresh/` - Refresh JWT

## 🔐 Configuración de Servidores

### NFS Server (192.168.1.107)

```bash
# Instalar NFS
sudo apt install nfs-kernel-server -y

# Crear directorio
sudo mkdir -p /eData/smilelink
sudo chmod 777 /eData/smilelink

# Configurar exports
echo "/eData 192.168.1.0/24(rw,sync,no_subtree_check)" | sudo tee -a /etc/exports
sudo exportfs -a
sudo systemctl restart nfs-kernel-server
```

### HDFS Server (192.168.1.73)

```bash
# Instalar Hadoop
wget https://downloads.apache.org/hadoop/common/hadoop-3.3.6/hadoop-3.3.6.tar.gz
tar -xzf hadoop-3.3.6.tar.gz
sudo mv hadoop-3.3.6 /opt/hadoop

# Configurar y arrancar
hdfs namenode -format
start-dfs.sh
```

### Cliente (Backend Django Server)

```bash
# Montar NFS
sudo mkdir -p /mnt/nfs
sudo mount -t nfs 192.168.1.107:/eData /mnt/nfs

# Verificar
df -h | grep nfs
```

## 🔒 Seguridad

- Todos los archivos se encriptan con AES-256 (Fernet)
- JWT tokens con expiración de 24h
- Google OAuth para padrinos
- Permisos granulares (Admin vs Padrino)

## 📦 Deployment

```bash
# Producción con Gunicorn
gunicorn smilelink.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

## 🧪 Testing

```bash
# Crear datos de prueba
python manage.py shell
>>> from storage.file_manager import FileStorageManager
>>> storage = FileStorageManager()
>>> storage.save('ninos', 'N001', {'nombre': 'Test', 'edad': 8})
```

## 📝 Notas

- Por defecto usa almacenamiento local (`./local_data`)
- Para activar NFS: `USE_NFS=True` en `.env`
- Para activar replicación HDFS: `USE_HDFS_REPLICATION=True`
- Google OAuth se configurará después
