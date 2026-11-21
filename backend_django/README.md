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

## 🔄 Pipeline CI/CD

El pipeline de GitHub Actions ejecuta las pruebas, el linting, las auditorías de
seguridad y la compilación del backend y frontend. Los errores no se ignoran ni
se convierten en resultados exitosos: si una comprobación falla, el job se
detiene y muestra en los logs qué debe corregirse.

Para corregir un fallo localmente antes de subir cambios:

```bash
# Backend
python -m pip install -r requirements-dev.txt
python manage.py test api.tests api.test_integration --verbosity=2
python -m flake8 . --count --max-complexity=10 --max-line-length=127 --statistics --exclude=venv
python -m pip_audit -r requirements.txt --desc
python -m bandit -r . -x ./venv,./api/migrations -ll -ii

# Frontend
cd ../frontend_react
npm ci
npm run test:unit
npm run test:integration
npm run lint
npm audit --audit-level=critical
npm run build
```

Correcciones automáticas seguras:

```powershell
# Frontend: corrige reglas que ESLint puede resolver sin cambiar la lógica
cd ..\frontend_react
npm run lint:fix

# Backend: corrige formato Python; después revisa el diff
cd ..\backend_django
python -m autopep8 --in-place --recursive api authentication storage smilelink utils
```

Estas herramientas no resuelven automáticamente errores de lógica,
vulnerabilidades, pruebas fallidas ni funciones demasiado complejas. Esos
problemas se muestran en los logs y deben corregirse manualmente. Para
dependencias npm, `npm audit fix` puede actualizar versiones compatibles, pero
se debe revisar el diff y repetir las pruebas; evita `npm audit fix --force`
sin revisar cambios mayores.

La corrección debe hacerse en el código o en los archivos de dependencias y
subirse mediante un commit; el runner no oculta ni guarda cambios temporales.

### Probar el flujo completo

1. Guarda los cambios y ejecuta localmente las comprobaciones anteriores.
2. Si todo termina con código `0`, crea un commit y súbelo:

   ```powershell
   git add .
   git commit -m "Validar pipeline"
   git push origin TU-RAMA
   ```

3. En GitHub abre **Actions**, selecciona **CI/CD Pipeline - SmileLink** y
   revisa los jobs `Backend CI (Django)` y `Frontend CI (React)`.
4. También puedes ejecutarlo sin hacer un commit desde **Run workflow**, porque
   el workflow admite `workflow_dispatch`.

El pipeline avanza en orden: instalación, pruebas, linting, auditorías,
compilación, Docker y publicación. Si un comando devuelve un código distinto de
`0`, el paso aparece en rojo y los logs muestran el archivo, la línea y el
comando que deben corregirse. Después de corregirlo localmente, sube otro commit
para que GitHub vuelva a ejecutar todo el flujo.

El pipeline no modifica automáticamente el código del repositorio. ESLint puede
proponer correcciones locales con `npm run lint -- --fix`, pero las pruebas,
Flake8, Bandit, `pip-audit`, `npm audit`, Docker y los errores de lógica deben
analizarse y corregirse explícitamente; ocultarlos haría que el pipeline fuera
falsamente exitoso.

Resultado de la última prueba local:

- Frontend: pruebas, lint y build correctos; el lint reportó warnings, no errores.
- Backend: 12 pruebas correctas.
- Backend Flake8: encontró errores de formato/calidad y detuvo el flujo. Cada
  línea aparece en los logs con archivo, número y regla; hay que corregirla y
  volver a ejecutar `python -m flake8`.
- `npm audit --audit-level=critical`: no encontró vulnerabilidades críticas,
  aunque sí reportó vulnerabilidades de severidad menor. Para corregirlas de
  forma controlada se puede ejecutar `npm audit fix`, revisar el diff y repetir
  las pruebas. No se debe usar `--force` sin revisar posibles cambios mayores.

## 📝 Notas

- Por defecto usa almacenamiento local (`./local_data`)
- Para activar NFS: `USE_NFS=True` en `.env`
- Para activar replicación HDFS: `USE_HDFS_REPLICATION=True`
- Google OAuth se configurará después
