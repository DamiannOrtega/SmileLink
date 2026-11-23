# Dependencias y seguridad del YAML para estudiar

Archivo revisado: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## 1. Dependencias del backend

Archivo: [`backend_django/requirements.txt`](backend_django/requirements.txt)

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
Faker>=24.0.0
piexif>=1.1.3
httpx>=0.27.0
```

El YAML instala Python 3.11 y estas dependencias:

```yaml
- name: 2a. Configurar entorno Python 3.11
  uses: actions/setup-python@v5
  with:
    python-version: '3.11'
    cache: 'pip'
    cache-dependency-path: 'backend_django/requirements.txt'

- name: 2b. Instalar librerías del sistema (MySQL client)
  run: |
    sudo apt-get update
    sudo apt-get install -y default-libmysqlclient-dev pkg-config build-essential

- name: 2c. Instalar dependencias de Python y Linter
  working-directory: backend_django
  run: |
    python -m pip install --upgrade pip
    pip install flake8
    pip install -r requirements.txt
```

## 2. Dependencias del frontend

Archivo: [`frontend_react/package.json`](frontend_react/package.json)

### Dependencias de ejecución

```json
"dependencies": {
  "@hookform/resolvers": "^3.10.0",
  "@radix-ui/react-accordion": "^1.2.11",
  "@radix-ui/react-alert-dialog": "^1.1.14",
  "@radix-ui/react-aspect-ratio": "^1.1.7",
  "@radix-ui/react-avatar": "^1.1.10",
  "@radix-ui/react-checkbox": "^1.3.2",
  "@radix-ui/react-collapsible": "^1.1.11",
  "@radix-ui/react-context-menu": "^1.1.11",
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-dropdown-menu": "^2.1.15",
  "@radix-ui/react-hover-card": "^1.1.7",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-menubar": "^1.1.15",
  "@radix-ui/react-navigation-menu": "^1.2.13",
  "@radix-ui/react-popover": "^1.1.14",
  "@radix-ui/react-progress": "^1.1.7",
  "@radix-ui/react-radio-group": "^1.3.7",
  "@radix-ui/react-scroll-area": "^1.2.9",
  "@radix-ui/react-select": "^2.2.5",
  "@radix-ui/react-separator": "^1.1.7",
  "@radix-ui/react-slider": "^1.3.5",
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-switch": "^1.2.5",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-toast": "^1.1.14",
  "@radix-ui/react-toggle": "^1.1.9",
  "@radix-ui/react-toggle-group": "^1.1.10",
  "@radix-ui/react-tooltip": "^1.2.7",
  "@react-google-maps/api": "^2.20.7",
  "@tanstack/react-query": "^5.83.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "cmdk": "^1.1.1",
  "date-fns": "^3.6.0",
  "embla-carousel-react": "^8.6.0",
  "input-otp": "^1.4.2",
  "leaflet": "^1.9.4",
  "lucide-react": "^0.462.0",
  "next-themes": "^0.3.0",
  "react": "^18.3.1",
  "react-day-picker": "^8.10.1",
  "react-dom": "^18.3.1",
  "react-hook-form": "^7.61.1",
  "react-leaflet": "^4.2.1",
  "react-resizable-panels": "^2.1.9",
  "react-router-dom": "^6.30.1",
  "recharts": "^2.15.4",
  "sonner": "^1.7.4",
  "tailwind-merge": "^2.6.0",
  "tailwindcss-animate": "^1.0.7",
  "vaul": "^0.9.9",
  "zod": "^3.25.76"
}
```

### Dependencias de desarrollo

```json
"devDependencies": {
  "@eslint/js": "^9.32.0",
  "@tailwindcss/typography": "^0.5.16",
  "@types/leaflet": "^1.9.21",
  "@types/node": "^22.16.5",
  "@types/react": "^18.3.23",
  "@types/react-dom": "^18.3.7",
  "@vitejs/plugin-react-swc": "^3.11.0",
  "autoprefixer": "^10.4.21",
  "eslint": "^9.32.0",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.20",
  "globals": "^15.15.0",
  "lovable-tagger": "^1.1.11",
  "postcss": "^8.5.6",
  "tailwindcss": "^3.4.17",
  "typescript": "^5.8.3",
  "typescript-eslint": "^8.38.0",
  "vite": "^5.4.19"
}
```

El YAML instala Node.js 20 y usa `npm ci`:

```yaml
- name: 2a. Configurar entorno Node.js 20
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: 'frontend_react/package-lock.json'

- name: 2b. Instalar dependencias de Node (npm ci)
  working-directory: frontend_react
  run: |
    npm ci
```

`npm ci` usa las versiones exactas de
[`frontend_react/package-lock.json`](frontend_react/package-lock.json).

## 3. Seguridad del backend

### `pip-audit`

Revisa las versiones de `requirements.txt` contra bases de datos públicas de
vulnerabilidades. Busca paquetes Python con vulnerabilidades conocidas y
muestra el paquete afectado, su versión, el identificador de la vulnerabilidad,
la descripción y, cuando existe, una versión corregida.

```yaml
- name: 6b. Análisis de vulnerabilidades en dependencias (pip-audit)
  working-directory: backend_django
  run: |
    pip-audit -r requirements.txt --desc
```

Si encuentra una vulnerabilidad, `pip-audit` termina con código de error y
muestra el hallazgo en los logs. El job falla para obligar a corregir la
dependencia en `requirements.txt`; la herramienta no modifica el repositorio
automáticamente.

### Bandit

Analiza estáticamente el código Python en busca de patrones inseguros, por
ejemplo secretos escritos en el código, uso peligroso de funciones, posibles
inyecciones, problemas con archivos o criptografía débil.

```yaml
- name: 6c. Análisis de vulnerabilidades en código fuente (Bandit SAST)
  working-directory: backend_django
  run: |
    bandit -r . -x ./venv,./api/migrations -ll -ii
```

- `-r .`: analiza todo el backend.
- `-x`: excluye `venv` y migraciones.
- `-ll`: muestra severidad media o superior.
- `-ii`: muestra confianza media o superior.

Si encuentra un posible problema, Bandit muestra el archivo, la línea, la
regla incumplida, la severidad y el nivel de confianza, y termina con código de
error. El job se detiene hasta que el código se corrija. Bandit solo reporta;
no modifica el código.

## 4. Seguridad del frontend

### `npm audit`

Revisa el árbol de dependencias instalado desde `package-lock.json` contra la
base de datos de avisos de seguridad de npm. Busca vulnerabilidades en
dependencias directas y transitivas. Reporta el paquete afectado, el rango de
versiones vulnerable, la severidad, la ruta de dependencia y una posible
versión corregida.

```yaml
- name: 6. Análisis de vulnerabilidades en dependencias (npm audit)
  working-directory: frontend_react
  run: |
    npm audit --audit-level=critical
```

`--audit-level=critical` establece el nivel crítico como umbral para el estado
del comando. Si se detectan vulnerabilidades críticas, `npm audit` muestra el
resultado y devuelve un código de error, por lo que el job se detiene. La
corrección debe hacerse actualizando la dependencia y regenerando el lockfile.

## 5. Qué ocurre ante un fallo

El comportamiento actual es:

| Herramienta | Qué revisa | Resultado si encuentra un problema |
|---|---|---|
| `pip-audit` | Vulnerabilidades conocidas en paquetes Python | Muestra el hallazgo y bloquea el job |
| Bandit | Patrones inseguros en código Python | Muestra archivo, línea y regla, y bloquea el job |
| `npm audit` | Vulnerabilidades críticas en paquetes npm | Muestra el hallazgo y bloquea el job |

Por lo tanto, estas auditorías actualmente funcionan como **reportes**. No
corrigen dependencias ni modifican archivos. Los comandos se ejecutan sin ignorar errores, por lo que un hallazgo detiene el
workflow:

```yaml
pip-audit -r requirements.txt --desc
bandit -r . -x ./venv,./api/migrations -ll -ii
npm audit --audit-level=critical
```

## 6. Otras revisiones del YAML

### Flake8

```yaml
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics --exclude=venv
flake8 . --count --max-complexity=10 --max-line-length=127 --statistics --exclude=venv
```

Revisa errores graves de Python, complejidad y líneas largas.

### ESLint

```yaml
- name: 5. Análisis estático de código (ESLint)
  working-directory: frontend_react
  run: |
    npm run lint
```

El script ejecutado está en `package.json`:

```json
"lint": "eslint ."
```

### Permisos

```yaml
permissions:
  contents: read
  packages: write
```

- `contents: read`: permite leer el repositorio.
- `packages: write`: permite publicar imágenes en GHCR.

### Publicación segura de imágenes

```yaml
if: github.event_name == 'push'

echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io \
  -u "${{ github.actor }}" --password-stdin
```

Las imágenes solo se publican en eventos `push`, no en `pull_request`.

## 7. Política de errores

Estas comprobaciones detienen el pipeline si encuentran problemas:

```yaml
pip-audit -r requirements.txt --desc
bandit -r . -x ./venv,./api/migrations -ll -ii
npm audit --audit-level=critical
docker push ...
```

Por lo tanto, el pipeline no aparece como exitoso mientras existan
vulnerabilidades o falle la publicación de una imagen Docker. El error debe
corregirse en el código o en la configuración y luego volver a ejecutar el
workflow.
