# SmileLink 🎁

Sistema integral de gestión de apadrinamientos para niños, desarrollado con Django (Backend), React (Frontend Web) y Kotlin/Jetpack Compose (Android App).

## 📋 Descripción

SmileLink es una plataforma que conecta padrinos con niños necesitados, facilitando el proceso de apadrinamiento, gestión de entregas de regalos y seguimiento de eventos especiales.

## 🏗️ Arquitectura del Proyecto

```
SmileLink/
├── android_app/          # Aplicación móvil Android (Kotlin + Jetpack Compose)
├── backend_django/       # API REST Backend (Django + DRF)
├── frontend_react/       # Aplicación web (React + Vite)
└── _docs/               # Documentación del proyecto
```

## 🚀 Tecnologías

### Backend (Django)
- **Framework**: Django 4.2.7 + Django REST Framework
- **Storage**: Sistema de archivos encriptados (JSON)
- **Sincronización**: NFS + HDFS
- **Autenticación**: JWT + Session-based

### Frontend Web (React)
- **Framework**: React 18 + Vite
- **UI**: Material-UI / Tailwind CSS
- **Estado**: React Query / Context API
- **Routing**: React Router

### Android App
- **Lenguaje**: Kotlin
- **UI**: Jetpack Compose + Material Design 3
- **Arquitectura**: MVVM Clean Architecture
- **Networking**: Retrofit + OkHttp
- **Navegación**: Jetpack Navigation Compose

## 📱 Características

### Aplicación Android
- ✅ Autenticación (Registro, Login, Logout)
- ✅ Explorar niños disponibles para apadrinar
- ✅ Crear apadrinamientos
- ✅ Ver mis ahijados
- ✅ Mapa de puntos de entrega
- ✅ Perfil de usuario
- ✅ Sesión persistente

### Frontend Web
- ✅ Dashboard con KPIs
- ✅ Gestión de niños
- ✅ Gestión de padrinos
- ✅ Gestión de apadrinamientos
- ✅ Gestión de entregas
- ✅ Gestión de puntos de entrega
- ✅ Gestión de eventos

### Backend API
- ✅ RESTful API completa
- ✅ Sistema de almacenamiento encriptado
- ✅ Sincronización con NFS/HDFS
- ✅ Autenticación de usuarios
- ✅ CORS configurado

## 🛠️ Instalación y Configuración

### Backend Django

```bash
cd backend_django
pip install -r requirements.txt
python manage.py migrate
python manage.py init_sample_data  # Datos de prueba
python manage.py runserver 0.0.0.0:8000
```

### Frontend React

```bash
cd frontend_react
npm install
npm run dev
```

### Android App

1. Abrir `android_app` en Android Studio
2. Configurar IP del backend en `AppConfig.kt`
3. Sync Gradle
4. Run app

## 🔧 Configuración

### Backend (.env)
```env
USE_MOCK=False
LOCAL_STORAGE_PATH=./local_data
USE_NFS=False
NFS_DATA_PATH=/mnt/nfs/smilelink/data
HDFS_NAMENODE=http://192.168.1.73:9870
HDFS_BASE_PATH=/smilelink/data
```

### Android (AppConfig.kt)
```kotlin
object AppConfig {
    const val USE_MOCK = false
    const val BASE_URL = "http://192.168.1.87:8000/api/"
}
```

## 📊 Modelo de Datos

- **Niños**: Información de niños disponibles para apadrinamiento
- **Padrinos**: Usuarios que apadrinan niños
- **Apadrinamientos**: Relación entre padrino y niño
- **Entregas**: Regalos programados y entregados
- **Solicitudes**: Peticiones de regalos específicos
- **Puntos de Entrega**: Ubicaciones para entrega de regalos
- **Eventos**: Eventos especiales (Navidad, Día del Niño, etc.)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

- **Damián Ortega** - Desarrollo Full Stack

## 🙏 Agradecimientos

- A todos los que contribuyen a hacer sonreír a los niños
- Comunidad de código abierto
