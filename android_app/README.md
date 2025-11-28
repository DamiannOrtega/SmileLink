# SmileLink Android App 📱

Aplicación nativa Android para la plataforma de apadrinamiento SmileLink construida con Kotlin y Jetpack Compose.

## 🚀 Inicio Rápido

### Requisitos Previos
- Android Studio Hedgehog o superior
- Android SDK 29+
- JDK 11

### Ejecutar la Aplicación

1. **Abrir Proyecto**
   ```
   Abre la carpeta android_app en Android Studio
   ```

2. **Sincronizar Gradle**
   - Android Studio sincronizará automáticamente las dependencias
   - Espera a que se complete la sincronización

3. **Elegir Modo**
   
   Edita `app/src/main/java/com/example/smilelinkapp/config/AppConfig.kt`:
   
   **Para Datos Mock (Sin Servidor)**:
   ```kotlin
   const val USE_MOCK = true
   ```
   
   **Para Backend Real**:
   ```kotlin
   const val USE_MOCK = false
   const val BASE_URL = "http://TU_IP:8000/api/"
   ```

4. **Ejecutar**
   - Haz clic en el botón Run o presiona Shift+F10
   - Selecciona emulador o dispositivo físico

## 📂 Estructura del Proyecto

```
app/src/main/java/com/example/smilelinkapp/
├── config/          # Configuración de la app
├── data/            # Capa de datos (modelos, API, repositorio)
├── ui/              # Capa de UI (pantallas, componentes, tema)
├── navigation/      # Configuración de navegación
└── MainActivity.kt  # Punto de entrada
```

## 🎨 Características

✅ **Onboarding** - Pantalla de bienvenida inspiradora  
✅ **Descubrimiento** - Navega niños disponibles con búsqueda  
✅ **Detalles del Niño** - Ver perfiles y cartas de deseos  
✅ **Apadrinamiento** - Crear apadrinamientos  
🚧 **Dashboard** - Ver niños apadrinados (PENDIENTE)  
🚧 **Mapa** - Encontrar puntos de entrega (PENDIENTE)  

## 🔧 Configuración

### Modo Mock (Por Defecto)
- Usa datos de ejemplo de `MockDataProvider`
- No requiere backend
- Perfecto para pruebas de UI

### Modo API
1. Inicia el servidor Django backend
2. Establece `USE_MOCK = false` en AppConfig
3. Actualiza `BASE_URL`:
   - Emulador: `http://10.0.2.2:8000/api/`
   - Dispositivo físico: `http://IP_DE_TU_COMPUTADORA:8000/api/`

## 🎯 Stack Tecnológico

- **Lenguaje**: Kotlin
- **UI**: Jetpack Compose + Material 3
- **Arquitectura**: MVVM
- **Red**: Retrofit + Gson
- **Imágenes**: Coil
- **Navegación**: Compose Navigation
- **Mapas**: Google Maps Compose (listo)

## 🎨 Sistema de Diseño

- **Primario**: Azul Océano (#0077BE)
- **Secundario**: Verde Menta (#7FD8BE)
- **Acento**: Amarillo Cálido (#FFD166)
- **Formas**: Redondeadas (16dp+)
- **Tipografía**: Sans-serif limpia

## 📱 Pantallas

1. **Onboarding** - Bienvenida y características
2. **Inicio** - Descubrir niños
3. **Detalle del Niño** - Perfil con carta de deseos
4. **Mis Ahijados** - Dashboard (PENDIENTE)
5. **Mapa** - Puntos de entrega (PENDIENTE)

## 🔄 Integración con Backend

La app se sincroniza con el backend Django:
- Crear apadrinamientos desde la app → aparece en el panel admin
- Admin asigna niños → aparece en la app
- Subir evidencia de entrega → almacenada en backend

## 📝 Próximos Pasos

- [ ] Implementar pantalla "Mis Ahijados"
- [ ] Agregar Google Maps para puntos de entrega
- [ ] Integrar cámara para subir evidencia
- [ ] Agregar autenticación con Google Sign-In
- [ ] Implementar navegación inferior

## 🤝 Contribuir

Esto es parte del sistema distribuido SmileLink. Consulta la documentación principal del proyecto para las pautas de contribución.

---

Construido con ❤️ para SmileLink - Conectando corazones, cambiando vidas
