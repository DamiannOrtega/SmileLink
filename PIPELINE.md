# Pipeline CI/CD de SmileLink

## 1. ¿Qué es el pipeline?

El pipeline es un flujo automatizado que revisa el proyecto cada vez que se
suben cambios a GitHub o se crea/actualiza un Pull Request. Su objetivo es
comprobar que el código:

- Se puede instalar y ejecutar.
- Pasa las pruebas automatizadas.
- Cumple reglas básicas de calidad.
- No tiene vulnerabilidades conocidas en sus dependencias o código.
- Se puede compilar y empaquetar con Docker.
- Puede publicarse como imagen en GitHub Container Registry (GHCR).

La configuración real está en
[.github/workflows/ci.yml](.github/workflows/ci.yml).

## 2. ¿Cuándo se ejecuta?

El workflow se activa en dos situaciones:

```yaml
on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]
```

Esto significa que se ejecuta:

1. En cualquier `push` a cualquier rama.
2. En cualquier Pull Request dirigido a cualquier rama.

GitHub ejecuta los trabajos en máquinas virtuales nuevas con Ubuntu:

```yaml
runs-on: ubuntu-latest
```

Por eso el pipeline no depende de las instalaciones locales de los
desarrolladores.

## 3. Estructura general

El pipeline contiene dos trabajos independientes:

```text
Pipeline CI/CD
├── backend   Django / Python
│   ├── Descargar código
│   ├── Preparar Python y dependencias
│   ├── Pruebas unitarias
│   ├── Pruebas de integración
│   ├── Flake8
│   ├── pip-audit y Bandit
│   ├── collectstatic
│   ├── Construir imagen Docker
│   └── Publicar imagen en GHCR en push
│
└── frontend  React / Node.js
    ├── Descargar código
    ├── Preparar Node y dependencias
    ├── Pruebas unitarias
    ├── Pruebas de integración
    ├── ESLint
    ├── npm audit
    ├── Construir aplicación con Vite
    ├── Guardar dist como artefacto
    ├── Construir imagen Docker
    └── Publicar imagen en GHCR en push
```

Los dos trabajos pueden ejecutarse en paralelo. Si uno falla, el otro puede
terminar correctamente, pero el resultado general del workflow no queda
completamente aprobado.

La aplicación Android no tiene un job configurado en este workflow. Sus
archivos Gradle existen en [android_app/](android_app/), pero actualmente no
se compilan ni prueban automáticamente desde `ci.yml`.

## 4. Job del backend Django

### 4.1 Descargar el código

```yaml
uses: actions/checkout@v4
```

`actions/checkout` descarga el commit que activó el workflow dentro de la
máquina de GitHub Actions. Así los siguientes comandos trabajan con el mismo
código que se subió al repositorio.

### 4.2 Configurar Python

```yaml
uses: actions/setup-python@v5
with:
  python-version: "3.11"
  cache: "pip"
  cache-dependency-path: backend_django/requirements.txt
```

Se instala Python 3.11 y se habilita la caché de `pip`. La caché evita
descargar nuevamente todas las dependencias cuando
`backend_django/requirements.txt` no cambió.

### 4.3 Instalar librerías del sistema

```bash
sudo apt-get update
sudo apt-get install -y default-libmysqlclient-dev pkg-config build-essential
```

Estas herramientas se instalan en Ubuntu porque algunas dependencias de Python,
especialmente `mysqlclient`, necesitan librerías y compiladores del sistema.

### 4.4 Instalar dependencias de Python y Flake8

El directorio de trabajo es `backend_django`:

```bash
python -m pip install --upgrade pip
pip install flake8
pip install -r requirements.txt
```

`requirements.txt` instala las dependencias del backend. `flake8` se instala
por separado porque se usa como herramienta de calidad dentro del pipeline.

### 4.5 Pruebas unitarias

```bash
python manage.py test api.tests --verbosity=2
```

Se ejecutan las pruebas unitarias del módulo `api`. El pipeline define:

```bash
USE_SQLITE=True
```

Así las pruebas usan SQLite y no necesitan conectarse a una base de datos
MySQL externa.

Si una prueba falla, este paso falla y el job del backend se detiene.

### 4.6 Pruebas de integración

```bash
python manage.py test api.test_integration --verbosity=2
```

Estas pruebas verifican el comportamiento conjunto de partes del backend,
como endpoints, serializadores, autenticación y respuestas HTTP.

También se ejecutan con `USE_SQLITE=True` para que el job sea reproducible y
autónomo.

### 4.7 Análisis con Flake8

Primero se ejecuta el análisis de errores graves:

```bash
flake8 . --count --select=E9,F63,F7,F82 \
  --show-source --statistics --exclude=venv
```

Este comando detecta, entre otros problemas:

- Errores de sintaxis.
- Nombres no definidos.
- Errores de compilación o importación detectables por Flake8.

Si encuentra estos errores, el pipeline falla.

Después se ejecuta un análisis más amplio:

```bash
flake8 . --count --exit-zero \
  --max-complexity=10 \
  --max-line-length=127 \
  --statistics \
  --exclude=venv
```

Este segundo análisis revisa complejidad ciclomática y longitud de líneas,
pero utiliza `--exit-zero`. Por ello muestra los resultados sin bloquear el
pipeline.

### 4.8 Auditoría de seguridad

Se instalan dos herramientas:

```bash
python -m pip install pip-audit bandit
```

#### pip-audit

```bash
pip-audit -r requirements.txt --desc || true
```

Busca versiones vulnerables de las dependencias de Python usando bases de
datos públicas de vulnerabilidades.

El `|| true` hace que el comando termine con resultado exitoso aunque encuentre
vulnerabilidades. Por tanto, actualmente el resultado sirve como reporte,
pero no bloquea la ejecución del pipeline.

#### Bandit

```bash
bandit -r . -x ./venv,./api/migrations -ll -ii || true
```

Bandit realiza análisis estático de seguridad sobre el código Python. Busca
patrones potencialmente peligrosos, por ejemplo:

- Secretos escritos directamente en el código.
- Uso inseguro de funciones.
- Posibles problemas de inyección.
- Criptografía o configuraciones débiles.

Se excluyen `venv` y las migraciones. Las opciones `-ll` y `-ii` limitan el
reporte a problemas de severidad y confianza altas. Debido a `|| true`,
actualmente Bandit tampoco bloquea el pipeline.

### 4.9 Recopilar archivos estáticos

```bash
python manage.py collectstatic --noinput
```

`collectstatic` reúne los archivos estáticos de Django en el directorio
configurado para despliegue. `--noinput` evita preguntas interactivas, algo
necesario para una ejecución automática.

### 4.10 Construir la imagen Docker del backend

```bash
REPO_LOWER=$(echo "${{ github.repository }}" | tr '[:upper:]' '[:lower:]')
docker build -t ghcr.io/${REPO_LOWER}/backend:latest ./backend_django
```

El comando:

1. Obtiene el nombre del repositorio de GitHub.
2. Lo convierte a minúsculas, porque los nombres de imágenes de registries
   deben manejarse en minúsculas.
3. Usa el [Dockerfile del backend](backend_django/Dockerfile).
4. Crea la imagen con la etiqueta `backend:latest`.

El Dockerfile utiliza Python 3.11, instala las dependencias, copia el backend,
recopila estáticos y arranca Django con Gunicorn.

### 4.11 Publicar la imagen del backend

```bash
echo "${{ secrets.GITHUB_TOKEN }}" |
  docker login ghcr.io -u "${{ github.actor }}" --password-stdin
docker push ghcr.io/${REPO_LOWER}/backend:latest || true
```

Este paso solo se ejecuta en eventos `push`:

```yaml
if: github.event_name == "push"
```

En un Pull Request se construye la imagen, pero no se publica. El token
automático de GitHub permite autenticarse en GHCR sin escribir credenciales
personales en el repositorio.

El `|| true` también evita que un error del `docker push` marque el job como
fallido. La imagen puede quedar sin actualizar si ocurre un error de
publicación, por lo que este comportamiento debe tenerse presente.

## 5. Job del frontend React

### 5.1 Configurar Node.js

```yaml
uses: actions/setup-node@v4
with:
  node-version: "20"
  cache: "npm"
  cache-dependency-path: frontend_react/package-lock.json
```

Se configura Node.js 20 y se habilita la caché de npm basada en
`frontend_react/package-lock.json`.

### 5.2 Instalar dependencias

```bash
cd frontend_react
npm ci
```

`npm ci` instala exactamente las versiones del `package-lock.json`. Es
preferible a `npm install` en CI porque produce instalaciones reproducibles y
no modifica el lockfile.

### 5.3 Pruebas unitarias

```bash
npm run test:unit
```

Este script está definido en
[frontend_react/package.json](frontend_react/package.json) y ejecuta:

```bash
node --test tests/utils.test.mjs
```

### 5.4 Pruebas de integración

```bash
npm run test:integration
```

Este script ejecuta:

```bash
node --test tests/integration.test.mjs
```

Si cualquiera de los dos comandos de pruebas termina con código diferente de
cero, el job del frontend falla.

### 5.5 ESLint

```bash
npm run lint
```

El script ejecuta `eslint .` sobre el frontend. Revisa problemas de calidad,
errores comunes de JavaScript/TypeScript y reglas configuradas para React.

### 5.6 Auditoría de npm

```bash
npm audit --audit-level=critical || true
```

Busca vulnerabilidades conocidas en los paquetes npm instalados. Solo reporta
vulnerabilidades críticas o superiores según el nivel indicado.

El `|| true` significa que un hallazgo no bloquea el pipeline actualmente.

### 5.7 Compilar con Vite

```bash
npm run build
```

El script ejecuta `vite build` y genera la aplicación optimizada en:

```text
frontend_react/dist/
```

Si TypeScript, Vite o alguna dependencia impiden la compilación, este paso
falla.

### 5.8 Guardar el artefacto de compilación

```yaml
uses: actions/upload-artifact@v4
with:
  name: frontend-production-dist
  path: frontend_react/dist/
  retention-days: 7
```

GitHub guarda la carpeta `dist` como un artefacto descargable durante siete
días. Este artefacto no es lo mismo que una imagen Docker: es una copia de
los archivos compilados para inspección o descarga desde la ejecución del
workflow.

### 5.9 Construir y publicar Docker del frontend

```bash
REPO_LOWER=$(echo "${{ github.repository }}" | tr '[:upper:]' '[:lower:]')
docker build -t ghcr.io/${REPO_LOWER}/frontend:latest ./frontend_react
```

La imagen usa el [Dockerfile del frontend](frontend_react/Dockerfile), que
realiza dos etapas:

1. Usa Node 20 para instalar dependencias y ejecutar `npm run build`.
2. Copia `dist` a NGINX y sirve la aplicación por el puerto 80.

En eventos `push`, se autentica en GHCR y publica:

```bash
docker push ghcr.io/${REPO_LOWER}/frontend:latest || true
```

En Pull Requests la imagen solo se construye y no se publica.

## 6. ¿Qué ocurre si un comando falla?

Por defecto, GitHub Actions detiene el job cuando un comando devuelve un
código distinto de cero. En este pipeline:

| Componente | ¿Bloquea si falla? |
|---|---:|
| Instalación de dependencias | Sí |
| Pruebas Django | Sí |
| Pruebas Node | Sí |
| Flake8 de errores graves | Sí |
| Segundo Flake8 de calidad | No |
| `pip-audit` | No, usa `|| true` |
| Bandit | No, usa `|| true` |
| `npm audit` | No, usa `|| true` |
| `collectstatic` | Sí |
| Build Docker | Sí |
| Publicación GHCR | No, usa `|| true` |

Esta diferencia es importante: que el workflow aparezca como exitoso no
garantiza que las auditorías de seguridad estén libres de vulnerabilidades ni
que la publicación de la imagen haya sido exitosa.

## 7. Equivalente para ejecutar localmente en Windows PowerShell

Los siguientes comandos reproducen las validaciones principales sin esperar a
GitHub Actions.

### Backend

Desde la raíz del repositorio:

```powershell
Set-Location .\backend_django

python -m pip install --upgrade pip
python -m pip install flake8 pip-audit bandit
python -m pip install -r requirements.txt

$env:USE_SQLITE = "True"
python manage.py test api.tests --verbosity=2
python manage.py test api.test_integration --verbosity=2

flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics --exclude=venv
flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics --exclude=venv

pip-audit -r requirements.txt --desc
bandit -r . -x .\venv,.\api\migrations -ll -ii

python manage.py collectstatic --noinput
```

Para salir del entorno virtual al terminar:

```powershell
deactivate
```

### Frontend

Desde la raíz del repositorio:

```powershell
Set-Location .\frontend_react

npm ci
npm run test:unit
npm run test:integration
npm run lint
npm audit --audit-level=critical
npm run build
```

El resultado de compilación queda en `frontend_react\dist\`.

### Construcción local de Docker

Desde la raíz del repositorio:

```powershell
docker build -t smilelink-backend:local .\backend_django
docker build -t smilelink-frontend:local .\frontend_react
```

Para revisar las imágenes creadas:

```powershell
docker images smilelink-backend
docker images smilelink-frontend
```

## 8. Flujo típico de un desarrollador

```text
1. Modificar código
2. Ejecutar pruebas y lint localmente
3. Crear commit
4. Hacer push a una rama
5. GitHub Actions ejecuta backend y frontend
6. Abrir o actualizar Pull Request
7. Revisar checks y artefactos
8. Al hacer push, construir/publicar imágenes GHCR
```

Ejemplo:

```powershell
git status
git add .
git commit -m "Actualizar validación de usuarios"
git push origin nombre-de-la-rama
```

Después del `push`, el workflow aparece en la pestaña **Actions** del
repositorio de GitHub.

## 9. ¿Tengo que instalar algo para ejecutar el pipeline?

No necesitas instalar GitHub Actions, Ubuntu, Python, Node.js, Docker ni las
herramientas de seguridad para que el pipeline se ejecute en GitHub. GitHub
Actions instala y configura esas herramientas dentro de su propia máquina
virtual cada vez que recibe el `push`.

Para activar el pipeline solo necesitas:

- Tener una cuenta con acceso al repositorio.
- Tener Git instalado en tu computadora.
- Tener el repositorio descargado localmente.
- Tener configurado tu acceso a GitHub mediante HTTPS o SSH.

Las instalaciones de Python, Node.js y Docker solo son necesarias si quieres
probar el proyecto localmente antes de subir los cambios. No son necesarias
para activar el pipeline remoto.

## 10. Comandos exactos para subir cambios y ejecutar el pipeline

### 10.1 Descargar el proyecto por primera vez

Si todavía no tienes el repositorio en tu computadora:

```powershell
git clone https://github.com/DamiannOrtega/SmileLink.git
Set-Location .\SmileLink
```

Si usas SSH:

```powershell
git clone git@github.com:DamiannOrtega/SmileLink.git
Set-Location .\SmileLink
```

### 10.2 Revisar la rama actual

```powershell
git branch --show-current
git status
```

Es recomendable trabajar en una rama propia y no directamente en `main`:

```powershell
git switch -c feature/mi-cambio
```

Si la rama ya existe:

```powershell
git switch feature/mi-cambio
```

### 10.3 Guardar y subir un cambio

Después de modificar los archivos:

```powershell
git status
git add .
git commit -m "Describe brevemente el cambio"
git push -u origin feature/mi-cambio
```

El comando `git push` es el que envía el commit a GitHub. En cuanto GitHub lo
recibe, detecta el evento `push` y ejecuta automáticamente
[ci.yml](.github/workflows/ci.yml).

Si la rama ya estaba conectada al remoto, basta con:

```powershell
git add .
git commit -m "Describe brevemente el cambio"
git push
```

### 10.4 Trabajar mediante Pull Request

Después del primer `push` de una rama nueva:

1. Entra al repositorio en GitHub.
2. Selecciona **Compare & pull request**.
3. Crea el Pull Request hacia `main`.
4. GitHub ejecuta el pipeline para el `push` y también para el Pull Request.
5. Revisa los checks en la pestaña **Actions** o dentro del Pull Request.

El pipeline no se ejecuta en tu terminal. Tu terminal solo ejecuta `git push`;
GitHub ejecuta el workflow en sus servidores.

### 10.5 Subir directamente a `main`

Si tienes permiso y el repositorio permite trabajar directamente sobre `main`:

```powershell
git switch main
git pull origin main
git add .
git commit -m "Describe brevemente el cambio"
git push origin main
```

Esto también activa automáticamente el pipeline. Sin embargo, trabajar con
ramas y Pull Requests es más seguro porque permite revisar los checks antes de
integrar los cambios.

## 11. ¿Qué ocurre después de ejecutar `git push`?

El flujo automático es:

```text
git push
    ↓
GitHub recibe el commit
    ↓
GitHub Actions lee .github/workflows/ci.yml
    ↓
Ejecuta backend y frontend en Ubuntu
    ↓
Instala dependencias
    ↓
Ejecuta pruebas, linting y auditorías
    ↓
Compila el proyecto
    ↓
Construye imágenes Docker
    ↓
En un push: intenta publicarlas en GHCR
```

Para consultar el resultado:

1. Abre el repositorio en GitHub.
2. Entra a la pestaña **Actions**.
3. Selecciona **CI/CD Pipeline - SmileLink**.
4. Abre la ejecución asociada a tu commit.
5. Revisa los jobs `Backend CI (Django)` y `Frontend CI (React)`.

Una marca verde significa que el paso terminó correctamente. Una marca roja
indica que debes abrir el paso fallido y revisar sus logs.

## 12. Opcional: validar localmente antes del `push`

No es obligatorio instalar estas herramientas para que GitHub ejecute el
pipeline, pero sí ayuda a detectar errores antes de subirlos.

### Backend local

Requiere Python instalado:

```powershell
Set-Location .\backend_django
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install flake8 pip-audit bandit

$env:USE_SQLITE = "True"
python manage.py test api.tests --verbosity=2
python manage.py test api.test_integration --verbosity=2
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics --exclude=venv
python manage.py collectstatic --noinput
deactivate
```

Si PowerShell bloquea la activación del entorno virtual, puedes ejecutar los
comandos usando directamente el Python del entorno:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe manage.py test api.tests --verbosity=2
```

### Frontend local

Requiere Node.js 20 o una versión compatible:

```powershell
Set-Location .\frontend_react
npm ci
npm run test:unit
npm run test:integration
npm run lint
npm run build
```

### Docker local

Docker solo es necesario si quieres comprobar localmente que las imágenes se
construyen igual que en GitHub:

```powershell
Set-Location ..
docker build -t smilelink-backend:local .\backend_django
docker build -t smilelink-frontend:local .\frontend_react
```

## 13. ¿Qué debo instalar exactamente?

| Objetivo | ¿Qué necesitas instalar? |
|---|---|
| Hacer cambios y ejecutar `git push` | Git |
| Ejecutar el pipeline en GitHub | Nada adicional; GitHub Actions lo prepara |
| Probar el backend localmente | Python y, opcionalmente, un entorno virtual |
| Probar el frontend localmente | Node.js y npm |
| Construir imágenes localmente | Docker Desktop |
| Crear Pull Requests desde terminal | GitHub CLI (`gh`), opcional |

La opción mínima es instalar únicamente Git, editar el código, hacer commit y
ejecutar `git push`. El pipeline remoto se inicia automáticamente.

## 14. Imágenes generadas

Cuando un `push` construye correctamente las imágenes, las etiquetas siguen
este formato:

```text
ghcr.io/<propietario>/<repositorio>/backend:latest
ghcr.io/<propietario>/<repositorio>/frontend:latest
```

El workflow convierte el nombre del repositorio a minúsculas antes de crear
las etiquetas.

## 15. Resumen

El pipeline funciona como una puerta automática de calidad para SmileLink:

- Backend: Python 3.11, Django, pruebas, Flake8, auditorías y Docker.
- Frontend: Node 20, React, pruebas, ESLint, auditoría npm, Vite y Docker.
- Entrega: artefacto `dist` del frontend y publicaciones opcionales en GHCR.
- Seguridad: `pip-audit`, Bandit y `npm audit` están configurados, aunque sus
  resultados no bloquean actualmente por el uso de `|| true`.
- Android: todavía no está incluido en el workflow.

Para cambiar el comportamiento del pipeline se debe editar
[.github/workflows/ci.yml](.github/workflows/ci.yml) y posteriormente hacer
`git push` para que GitHub ejecute la nueva configuración.
