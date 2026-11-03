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

## 3. Eventos utilizados por el pipeline

El pipeline utiliza dos eventos de GitHub Actions:

### `push`

```yaml
push:
  branches: ["**"]
```

Se dispara cada vez que se suben commits a cualquier rama del repositorio.
Por ejemplo:

```powershell
git add .
git commit -m "Actualizar documentación"
git push
```

Cuando GitHub recibe ese `push`, ejecuta los jobs de backend y frontend. En
este evento también se intenta publicar en GHCR las imágenes Docker:

```text
ghcr.io/<propietario>/<repositorio>/backend:latest
ghcr.io/<propietario>/<repositorio>/frontend:latest
```

La publicación solo está habilitada para `push`, no para Pull Requests.

### `pull_request`

```yaml
pull_request:
  branches: ["**"]
```

Se dispara cuando se crea o actualiza un Pull Request dirigido a cualquier
rama. También puede ejecutarse cuando se realizan acciones relacionadas con el
Pull Request, como nuevos commits, según la configuración predeterminada del
evento.

En un Pull Request el pipeline:

- Descarga el código del cambio.
- Ejecuta las pruebas del backend y frontend.
- Ejecuta linting y auditorías.
- Compila el frontend.
- Construye las imágenes Docker.
- Guarda el artefacto `frontend-production-dist`.
- No publica imágenes en GHCR.

La condición que evita publicar desde Pull Requests es:

```yaml
if: github.event_name == 'push'
```

### Diferencia entre ambos eventos

| Evento | ¿Cuándo ocurre? | ¿Ejecuta validaciones? | ¿Publica Docker en GHCR? |
|---|---|---:|---:|
| `push` | Al subir commits a cualquier rama | Sí | Sí, se intenta publicar |
| `pull_request` | Al crear o actualizar un Pull Request | Sí | No |

Por ejemplo, si haces `push` a `identificacionP`, se ejecuta el pipeline para
esa rama. Si después abres un Pull Request de `identificacionP` hacia `main`,
el pipeline vuelve a ejecutarse para validar el Pull Request antes de
integrarlo.

## 4. ¿Cuántos eventos y comprobaciones existen?

Es importante separar dos conceptos:

### Eventos que activan el pipeline: 2

El workflow tiene únicamente **dos eventos de activación**:

1. `push`: alguien sube uno o más commits a cualquier rama.
2. `pull_request`: se crea o actualiza un Pull Request.

Estos eventos solo indican **cuándo** debe iniciar el pipeline. No son las
comprobaciones mismas.

### Comprobaciones que realiza el pipeline: varias

Después de activarse, GitHub ejecuta dos jobs independientes:

1. `backend`: comprueba el código Django/Python.
2. `frontend`: comprueba el código React/Node.js.

Cada job contiene varios pasos. En conjunto, el pipeline comprueba instalación,
pruebas, calidad, seguridad, compilación y empaquetado.

## 5. ¿Qué comprueba exactamente?

### 5.1 Descarga correcta del código

El primer paso de cada job usa:

```yaml
uses: actions/checkout@v4
```

Comprueba que GitHub pueda obtener el commit asociado al evento. Si el código
no se puede descargar, el job no puede continuar.

En un Pull Request, GitHub normalmente prepara una referencia del cambio
propuesto para que las validaciones se ejecuten sobre el estado que se quiere
integrar, no solamente sobre una copia vieja de la rama.

### 5.2 Instalación reproducible de herramientas y dependencias

El backend configura Python 3.11 y ejecuta:

```bash
pip install -r requirements.txt
```

El frontend configura Node.js 20 y ejecuta:

```bash
npm ci
```

Esto comprueba que las dependencias declaradas se puedan instalar desde cero.
En el frontend, `npm ci` también verifica que `package-lock.json` sea
compatible con `package.json`.

Si una dependencia falta, está mal declarada o no puede instalarse, el job
falla antes de ejecutar las pruebas.

### 5.3 Pruebas unitarias

Las pruebas unitarias revisan funciones o componentes pequeños de forma
aislada:

```bash
python manage.py test api.tests --verbosity=2
npm run test:unit
```

Sirven para detectar regresiones, errores de lógica y cambios que rompen
comportamientos ya existentes.

### 5.4 Pruebas de integración

Las pruebas de integración revisan que varias partes trabajen juntas:

```bash
python manage.py test api.test_integration --verbosity=2
npm run test:integration
```

En el backend pueden comprobar endpoints, autenticación, serializadores y
respuestas HTTP. En el frontend comprueban flujos que involucran más de una
pieza de la aplicación.

Estas pruebas responden a la pregunta: **¿las partes principales funcionan
juntas y no solo de manera aislada?**

### 5.5 Errores de sintaxis y referencias inválidas

El backend ejecuta:

```bash
flake8 . --count --select=E9,F63,F7,F82 \
  --show-source --statistics --exclude=venv
```

Este paso bloquea el job cuando encuentra errores graves, como sintaxis
inválida o nombres no definidos.

### 5.6 Calidad y mantenibilidad del código

El análisis adicional de Flake8 revisa:

```bash
flake8 . --count --exit-zero \
  --max-complexity=10 \
  --max-line-length=127 \
  --statistics \
  --exclude=venv
```

Ayuda a encontrar funciones demasiado complejas y líneas demasiado largas.
Como usa `--exit-zero`, reporta problemas, pero actualmente no bloquea la
ejecución.

En el frontend, ESLint realiza una función equivalente:

```bash
npm run lint
```

### 5.7 Vulnerabilidades conocidas en dependencias

El pipeline revisa dependencias con:

```bash
pip-audit -r requirements.txt --desc
npm audit --audit-level=critical
```

Busca versiones con vulnerabilidades publicadas en bases de datos conocidas.
Actualmente estos dos comandos llevan `|| true` dentro del workflow, por lo
que muestran hallazgos pero no detienen el pipeline automáticamente.

### 5.8 Vulnerabilidades potenciales en el código Python

Bandit analiza patrones inseguros en el backend:

```bash
bandit -r . -x ./venv,./api/migrations -ll -ii
```

Puede señalar posibles secretos escritos en el código, uso inseguro de
funciones, problemas de inyección o criptografía débil. También usa `|| true`
en el workflow y por eso funciona actualmente como reporte no bloqueante.

### 5.9 Compilación del frontend

El frontend debe poder convertirse en archivos de producción:

```bash
npm run build
```

Este comando ejecuta `vite build`. Comprueba que React, TypeScript, Vite,
imports y configuración de producción sean compatibles. Si existe un error de
compilación, el job falla.

### 5.10 Archivos estáticos del backend

Django ejecuta:

```bash
python manage.py collectstatic --noinput
```

Comprueba que el backend pueda preparar sus archivos estáticos para
despliegue. Un error en esta etapa bloquea el job.

### 5.11 Construcción de imágenes Docker

Se construyen dos imágenes:

```bash
docker build -t ghcr.io/${REPO_LOWER}/backend:latest ./backend_django
docker build -t ghcr.io/${REPO_LOWER}/frontend:latest ./frontend_react
```

Esto comprueba que los Dockerfiles sean válidos, que las dependencias puedan
instalarse dentro de las imágenes y que el proyecto pueda empaquetarse para
ejecutarse fuera del entorno de desarrollo.

### 5.12 Artefacto de producción del frontend

GitHub guarda `frontend_react/dist/` como el artefacto
`frontend-production-dist`. Esto permite descargar y revisar el resultado de
la compilación aunque no se publique todavía.

### 5.13 Publicación en GHCR

Solo después de un `push` se intenta ejecutar:

```bash
docker login ghcr.io
docker push ghcr.io/${REPO_LOWER}/backend:latest
docker push ghcr.io/${REPO_LOWER}/frontend:latest
```

Esto comprueba el paso de entrega de imágenes al registro de GitHub. La
publicación tiene `|| true`, así que un error al subir la imagen puede no
marcar el job como fallido.

## 6. ¿Cómo se revisan los conflictos?

### Conflictos de Git en un Pull Request

Los conflictos de Git no son uno de los eventos del workflow. GitHub analiza
la posibilidad de combinar la rama del Pull Request con su rama destino y
muestra si el Pull Request es combinable o si necesita resolver conflictos.

Si GitHub detecta conflictos, normalmente aparece un mensaje como **This
branch has conflicts that must be resolved**. En ese caso se deben resolver
los archivos localmente, hacer un nuevo commit y volver a subirlo:

```powershell
git switch identificacionP
git fetch origin
git merge origin/main

# Resolver manualmente los archivos marcados por Git
git status
git add .
git commit -m "Resolver conflictos con main"
git push
```

Después del nuevo `push`, el evento `push` vuelve a activar el pipeline y el
evento `pull_request` vuelve a validar el Pull Request.

### Qué sí y qué no garantiza el pipeline

El pipeline comprueba que el código del commit validado instala, prueba,
analiza y compila correctamente. No reemplaza la revisión de GitHub sobre si
dos ramas tienen conflictos de merge.

Además, que el pipeline esté verde no garantiza por sí solo que:

- Los hallazgos de seguridad sean cero, porque las auditorías usan `|| true`.
- La imagen Docker se haya publicado, porque el `docker push` también usa
  `|| true`.
- El código cumpla requisitos funcionales que no tengan pruebas automatizadas.
- El cambio sea correcto desde el punto de vista de negocio.

## 7. Resumen de validaciones y bloqueo

| Validación | Backend | Frontend | ¿Bloquea si falla? |
|---|---:|---:|---:|
| Descargar código | Sí | Sí | Sí |
| Instalar dependencias | Sí | Sí | Sí |
| Pruebas unitarias | Sí | Sí | Sí |
| Pruebas de integración | Sí | Sí | Sí |
| Errores graves de sintaxis/referencias | Flake8 | Incluido en lint/build | Sí |
| Calidad de código | Flake8 | ESLint | Sí en ESLint; no en el segundo Flake8 |
| Auditoría de dependencias | pip-audit | npm audit | No |
| Auditoría de código | Bandit | No configurada | No |
| Compilación | collectstatic | Vite build | Sí |
| Construcción Docker | Sí | Sí | Sí |
| Guardar artefacto | No | `dist` | Sí |
| Publicar imagen GHCR | Sí | Sí | No |
| Conflictos de merge | Lo gestiona GitHub | Lo gestiona GitHub | Requiere resolverlo |

## 8. ¿Cuántas acciones y pruebas tiene el pipeline?

### Acciones configuradas en el workflow

El archivo `ci.yml` tiene:

- **2 jobs principales**: `backend` y `frontend`.
- **24 pasos nombrados en total**:
  - 13 pasos para el backend.
  - 11 pasos para el frontend.
- **10 pruebas unitarias**:
  - 7 del backend.
  - 3 del frontend.
- **7 pruebas de integración**:
  - 5 del backend.
  - 2 del frontend.

Los pasos de cada job hacen lo siguiente:

| Job | Pasos | Qué hacen |
|---|---:|---|
| Backend | 1 | Descarga el código |
| Backend | 3 | Configura Python, instala librerías del sistema y dependencias |
| Backend | 2 | Ejecuta pruebas unitarias y de integración |
| Backend | 1 | Ejecuta Flake8 |
| Backend | 3 | Instala y ejecuta auditorías de seguridad |
| Backend | 3 | Recopila estáticos, construye Docker y publica en GHCR |
| Frontend | 1 | Descarga el código |
| Frontend | 2 | Configura Node.js e instala dependencias |
| Frontend | 2 | Ejecuta pruebas unitarias y de integración |
| Frontend | 1 | Ejecuta ESLint |
| Frontend | 1 | Ejecuta `npm audit` |
| Frontend | 4 | Compila, guarda artefacto, construye Docker y publica en GHCR |

El número de pasos no es igual al número de pruebas. Por ejemplo, el paso
`npm run test:unit` es una acción del pipeline que ejecuta tres casos de
prueba del frontend.

## 9. Pruebas unitarias existentes

### Backend: 7 pruebas unitarias

Archivo:
[backend_django/api/tests.py](backend_django/api/tests.py)

| # | Prueba | Qué comprueba |
|---:|---|---|
| 1 | `test_cifrado_y_descifrado_exitoso` | Que Fernet cifre un texto y después lo recupere correctamente |
| 2 | `test_cifrar_campo_vacio_o_nulo` | Que valores vacíos o `None` tengan un comportamiento seguro |
| 3 | `test_descifrado_corrupto_retorna_fallback` | Que datos cifrados corruptos devuelvan `[CIFRADO]` sin romper la aplicación |
| 4 | `test_creacion_administrador_por_defecto` | Que un administrador tenga rol `Gestor`, esté activo y tenga una representación correcta |
| 5 | `test_creacion_padrino_reglas_por_defecto` | Que un padrino nuevo quede pendiente de verificación y no pueda apadrinar todavía |
| 6 | `test_punto_entrega_str_representacion` | Que `PuntoEntrega` se convierta al texto esperado |
| 7 | `test_administrador_serializer_campos_requeridos` | Que el serializador rechace un email inválido |

Estas pruebas son unitarias porque verifican utilidades, modelos y
serializadores de forma aislada, sin recorrer el flujo completo de HTTP.

### Frontend: 3 pruebas unitarias

Archivo:
[frontend_react/tests/utils.test.mjs](frontend_react/tests/utils.test.mjs)

Las tres pruebas revisan la función `cn`, utilizada para combinar clases CSS:

| # | Prueba | Qué comprueba |
|---:|---|---|
| 1 | `cn combina clases css correctamente` | Que combine clases normales |
| 2 | `cn resuelve conflictos de Tailwind` | Que una clase posterior como `px-4` reemplace a `px-2` |
| 3 | `cn ignora valores booleanos o falsy` | Que ignore `false`, `null` y `undefined` |

## 10. Pruebas de integración existentes

### Backend: 5 pruebas de integración

Archivo:
[backend_django/api/test_integration.py](backend_django/api/test_integration.py)

| # | Prueba | Qué comprueba |
|---:|---|---|
| 1 | `test_flujo_completo_registro_login_y_perfil` | Registro, persistencia, cifrado de datos, hash PBKDF2, login, JWT y consulta de perfil autenticado |
| 2 | `test_registro_rechaza_campos_incompletos_o_invalidos` | Que la API rechace nombre, email y contraseña inválidos |
| 3 | `test_login_rechaza_credenciales_incorrectas` | Que un login con contraseña incorrecta devuelva `401 Unauthorized` |
| 4 | `test_creacion_y_listado_punto_entrega` | Que un punto de entrega se cree por `POST` y aparezca en un `GET` posterior |
| 5 | `test_endpoint_diagnostico_responde` | Que el endpoint de diagnósticos responda `200` e incluya el estado y la información de cifrado |

Estas pruebas usan `APITestCase` y recorren varias capas juntas: URL, vista,
serializador, autenticación, ORM, base de datos y respuesta HTTP.

### Frontend: 2 pruebas de integración

Archivo:
[frontend_react/tests/integration.test.mjs](frontend_react/tests/integration.test.mjs)

| # | Prueba | Qué comprueba |
|---:|---|---|
| 1 | `Validación de contrato de autenticación y sesión` | Que el frontend interprete el login, guarde el usuario/token y envíe la cabecera de autorización esperada |
| 2 | `Adaptador de datos de niños y estado de apadrinamiento` | Que convierta el registro del backend y calcule correctamente si puede solicitar un apadrinamiento |

Estas pruebas simulan el contrato entre el frontend y el backend. No levantan
un servidor real ni hacen una petición HTTP real; validan que los datos y
reglas esperadas se adapten correctamente.

### Archivos de pruebas que actualmente no agregan casos

También existen:

- [backend_django/storage/tests.py](backend_django/storage/tests.py)
- [backend_django/authentication/tests.py](backend_django/authentication/tests.py)

Ambos archivos solo contienen la plantilla vacía de Django y no tienen
métodos `test_`. Además, el workflow actual ejecuta explícitamente
`api.tests` y `api.test_integration`, por lo que esos archivos no agregan
pruebas al conteo actual.

## 11. Ejecutar las pruebas manualmente en PowerShell

Sí. Las pruebas se pueden ejecutar desde la consola sin esperar a GitHub
Actions.

### Ejecutar todas las pruebas del backend

Desde la raíz del repositorio:

```powershell
Set-Location .\backend_django

$env:USE_SQLITE = "True"
python manage.py test api.tests api.test_integration --verbosity=2
```

Este comando ejecuta las **12 pruebas del backend**: 7 unitarias y 5 de
integración.

### Ejecutar solo las pruebas unitarias del backend

```powershell
Set-Location .\backend_django
$env:USE_SQLITE = "True"
python manage.py test api.tests --verbosity=2
```

### Ejecutar solo las pruebas de integración del backend

```powershell
Set-Location .\backend_django
$env:USE_SQLITE = "True"
python manage.py test api.test_integration --verbosity=2
```

### Ejecutar una clase o prueba específica del backend

```powershell
python manage.py test api.tests.TestFernetEncryptionUnit --verbosity=2
python manage.py test api.test_integration.TestAuthIntegration --verbosity=2
python manage.py test api.tests.TestFernetEncryptionUnit.test_cifrado_y_descifrado_exitoso --verbosity=2
```

### Ejecutar todas las pruebas del frontend

Desde la raíz del repositorio:

```powershell
Set-Location .\frontend_react
npm ci
npm test
```

El script `npm test` ejecuta primero las 3 pruebas unitarias y después las 2
pruebas de integración.

### Ejecutar solo las pruebas unitarias del frontend

```powershell
Set-Location .\frontend_react
npm run test:unit
```

### Ejecutar solo las pruebas de integración del frontend

```powershell
Set-Location .\frontend_react
npm run test:integration
```

### Ejecutar una prueba específica del frontend

Node permite filtrar por nombre usando `--test-name-pattern`:

```powershell
node --test --test-name-pattern="Tailwind" tests/utils.test.mjs
node --test --test-name-pattern="autenticación" tests/integration.test.mjs
```

## 12. Ejecutar manualmente todas las comprobaciones del pipeline

El pipeline completo se puede reproducir manualmente por partes. Desde una
terminal PowerShell abierta en la raíz:

```powershell
# Backend
Set-Location .\backend_django
$env:USE_SQLITE = "True"
python manage.py test api.tests api.test_integration --verbosity=2
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics --exclude=venv
flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics --exclude=venv
pip-audit -r requirements.txt --desc
bandit -r . -x .\venv,.\api\migrations -ll -ii
python manage.py collectstatic --noinput

# Frontend
Set-Location ..\frontend_react
npm ci
npm test
npm run lint
npm audit --audit-level=critical
npm run build

# Regresar a la raíz
Set-Location ..
```

La construcción de Docker es opcional localmente:

```powershell
docker build -t smilelink-backend:local .\backend_django
docker build -t smilelink-frontend:local .\frontend_react
```

No se debe ejecutar `docker push` localmente para una validación normal. La
publicación en GHCR requiere autenticación y actualmente el workflow la
realiza automáticamente solo en eventos `push`.

## 13. ¿Se puede ejecutar manualmente el workflow completo?

Actualmente no desde el botón **Run workflow** de GitHub Actions, porque
[ci.yml](.github/workflows/ci.yml) no incluye el evento:

```yaml
workflow_dispatch:
```

Por lo tanto, las opciones actuales son:

1. Hacer un `git push`; el workflow se inicia automáticamente.
2. Crear o actualizar un Pull Request; el workflow se inicia automáticamente.
3. Ejecutar manualmente las pruebas y comprobaciones con los comandos
   anteriores.

Para permitir una ejecución manual desde GitHub habría que agregar:

```yaml
on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]
  workflow_dispatch:
```

Después de subir ese cambio, aparecería el botón **Run workflow** en la
sección **Actions**. No se recomienda ejecutar manualmente los pasos de
publicación GHCR sin definir antes qué rama y qué etiqueta deben utilizarse.

GitHub ejecuta los trabajos en máquinas virtuales nuevas con Ubuntu:

```yaml
runs-on: ubuntu-latest
```

Por eso el pipeline no depende de las instalaciones locales de los
desarrolladores.

## 14. Estructura general

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

## 15. Job del backend Django

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

## 16. Job del frontend React

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

## 17. ¿Qué ocurre si un comando falla?

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

## 18. Equivalente para ejecutar localmente en Windows PowerShell

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

## 19. Flujo típico de un desarrollador

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

## 20. ¿Tengo que instalar algo para ejecutar el pipeline?

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

## 21. Comandos exactos para subir cambios y ejecutar el pipeline

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

## 22. ¿Qué ocurre después de ejecutar `git push`?

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

## 23. Opcional: validar localmente antes del `push`

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

## 24. ¿Qué debo instalar exactamente?

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

## 25. Imágenes generadas

Cuando un `push` construye correctamente las imágenes, las etiquetas siguen
este formato:

```text
ghcr.io/<propietario>/<repositorio>/backend:latest
ghcr.io/<propietario>/<repositorio>/frontend:latest
```

El workflow convierte el nombre del repositorio a minúsculas antes de crear
las etiquetas.

## 26. Resumen

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
