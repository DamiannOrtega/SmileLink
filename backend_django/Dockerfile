# ==============================================================================
# Dockerfile - SmileLink Backend (Django REST Framework)
# ==============================================================================
FROM python:3.11-slim

# Evitar escritura de archivos .pyc y activar salida sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema requeridas para mysqlclient
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente
COPY . .

# Recopilar archivos estáticos para producción
RUN USE_SQLITE=True python manage.py collectstatic --noinput || true

# Puerto expuesto
EXPOSE 8000

# Comando de arranque con servidor WSGI Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "smilelink.wsgi:application"]
