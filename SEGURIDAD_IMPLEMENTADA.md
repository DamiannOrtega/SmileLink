# Seguridad implementada en SmileLink

## 1. Objetivo de seguridad

SmileLink administra información de padrinos, niños beneficiarios, entregas,
evidencias fotográficas y usuarios administrativos. Por ello, el proyecto
incorpora controles para:

- Proteger los datos personales almacenados.
- Evitar guardar contraseñas en texto plano.
- Controlar el acceso mediante autenticación.
- Separar las funciones de padrinos y administradores.
- Registrar acciones importantes del sistema.
- Validar la información recibida por la API.
- Mantener disponibles los servicios aunque una dependencia externa falle.

> **Alcance:** este documento describe las medidas que existen actualmente en
> el código. Las funcionalidades que aparecen en el backlog pero no están
> conectadas al código se consideran pendientes y no se presentan como
> implementadas.

---

## 2. Cifrado de información personal con Fernet

### ¿Qué se implementó?

El backend utiliza **Fernet**, mediante la biblioteca `cryptography`, para
cifrar algunos campos sensibles antes de almacenarlos en MySQL.

Los campos protegidos incluyen principalmente:

- Nombre del padrino.
- Teléfono.
- Dirección.
- Nombre del niño.
- Observaciones de entregas.
- Contenido de cartas y algunas descripciones de evidencias.

Estos datos se almacenan como bytes cifrados en campos `BinaryField`.

### ¿Por qué se aplicó?

El objetivo es que una persona que obtenga acceso directo a la base de datos
no pueda leer inmediatamente los datos personales. La información solo se
descifra dentro del backend cuando debe ser utilizada por la aplicación.

### ¿Cómo se aplicó?

El módulo [`backend_django/utils/encryption.py`](backend_django/utils/encryption.py)
centraliza las operaciones:

- `cifrar_campo()` cifra el texto antes de guardarlo.
- `descifrar_campo()` recupera el texto al consultarlo.
- La clave se obtiene mediante la variable de entorno `FERNET_KEY`.
- Si el contenido está corrupto, el sistema registra el error y no devuelve
  accidentalmente el valor cifrado como si fuera texto normal.

### ¿Por qué Fernet y no otra alternativa?

Fernet fue elegido porque:

- Es una solución estándar y disponible para Python.
- Proporciona confidencialidad.
- También verifica la integridad y autenticidad del contenido.
- Evita implementar manualmente el cifrado y su validación.
- Es apropiado cuando la aplicación necesita descifrar posteriormente los
  datos.

Fernet utiliza cifrado simétrico: la misma clave protege y recupera la
información. La clave debe mantenerse fuera del código y protegerse mediante
variables de entorno.

> **Aclaración técnica:** en algunos comentarios del proyecto se menciona
> “AES-256”; la implementación usada es Fernet, basado normalmente en
> AES-128-CBC con HMAC-SHA256. La denominación correcta para esta medida es
> cifrado autenticado mediante Fernet.

---

## 3. Protección de contraseñas mediante hash PBKDF2

### ¿Qué se implementó?

Las contraseñas de padrinos y administradores no se guardan en texto plano ni
se cifran de forma reversible. Se almacenan mediante el sistema de hash de
contraseñas de Django:

- `make_password()` al registrar o crear una contraseña.
- `check_password()` al iniciar sesión.

El resultado utiliza PBKDF2, una sal y múltiples iteraciones.

### ¿Por qué se aplicó?

Si la base de datos fuera expuesta, el atacante no tendría directamente las
contraseñas originales. El sistema compara el hash de la contraseña
introducida con el hash guardado.

### ¿Cómo se verificó?

Las pruebas de integración comprueban que:

- La contraseña almacenada es diferente a la original.
- El valor tiene formato de hash PBKDF2.
- Una contraseña correcta permite iniciar sesión.
- Una contraseña incorrecta es rechazada.

### Validaciones adicionales

Django tiene configurados validadores para:

- Evitar contraseñas parecidas a los datos del usuario.
- Requerir una longitud mínima.
- Rechazar contraseñas comunes.
- Rechazar contraseñas únicamente numéricas.

---

## 4. Autenticación de usuarios

## 4.1 Login de padrinos

Existe el endpoint:

```text
POST /api/auth/login/
```

El flujo es:

1. Recibir email y contraseña.
2. Validar que ambos campos existan.
3. Buscar el padrino por email.
4. Comprobar que la cuenta esté activa.
5. Verificar la contraseña con `check_password()`.
6. Registrar el inicio de sesión.
7. Generar un token JWT.
8. Devolver la sesión y la información básica del padrino.

## 4.2 Login de administradores

Existe un login separado:

```text
POST /api/auth/admin-login/
```

Este flujo autentica a los usuarios de administración y considera:

- Email.
- Contraseña con hash PBKDF2.
- Estado activo o inactivo.
- Rol del administrador.

La separación evita mezclar el acceso operativo de los padrinos con el acceso
al panel administrativo.

## 4.3 Login con Google

El backend contiene una integración para validar tokens de Google mediante
OAuth. Esta función está preparada en el código, pero requiere configurar las
credenciales de Google para considerarse activa en un entorno real.

---

## 5. Sesiones mediante JWT

### ¿Qué se implementó?

Después de un login correcto, el backend genera un JSON Web Token (JWT) con
información como:

- Identificador del usuario.
- Email.
- Rol del administrador, cuando corresponde.
- Fecha de emisión.
- Fecha de expiración.

El token se firma con una clave configurada mediante `JWT_SECRET_KEY` y se
utiliza el algoritmo `HS256`.

### ¿Para qué se aplicó?

JWT permite que el frontend se autentique en peticiones posteriores sin
enviar nuevamente la contraseña del usuario.

### ¿Cómo se utiliza?

El cliente envía el token en la cabecera:

```http
Authorization: Bearer <token>
```

El backend verifica la firma y la fecha de expiración antes de aceptar el
token en los flujos que lo validan.

### Alcance actual

El token tiene una expiración configurada por defecto de 24 horas. El logout
actual elimina la sesión del cliente, pero no mantiene una lista de revocación
en el servidor. Por ello, la revocación inmediata de tokens todavía es una
mejora pendiente.

---

## 6. Roles, estados y verificación de identidad

### Roles administrativos

Los administradores pueden tener los roles:

- `Gestor`.
- `Superadmin`.

También existe un estado `activo` para impedir el uso normal de cuentas
deshabilitadas.

### Estado de los padrinos

Un padrino nuevo comienza con:

```text
puede_apadrinar = False
estado_verificacion = Pendiente
```

El modelo contempla estados como:

- Pendiente.
- Aprobado.
- Rechazado.
- Requiere reintento.

### Verificación de identidad

El sistema contempla información relacionada con:

- Fotografía del INE.
- Fotografía del rostro.
- Fecha de verificación.
- Motivo de rechazo.
- Resultado o sospecha del análisis de identidad.

El backend verifica `puede_apadrinar` antes de permitir que un padrino
consulte determinadas funcionalidades relacionadas con los niños.

### ¿Para qué se aplicó?

Para evitar que cualquier cuenta recién registrada pueda acceder
automáticamente a información sensible de beneficiarios o participar en el
programa sin una validación previa.

---

## 7. Validación y protección básica de la API

La API utiliza Django REST Framework y el ORM de Django.

### Controles aplicados

- Validación de campos obligatorios.
- Validación del formato de email.
- Validación de longitud mínima de contraseña.
- Validación de estados de las entidades.
- Validación de relaciones entre padrinos, niños y entregas.
- Uso del ORM para realizar consultas a MySQL.
- Respuestas HTTP diferenciadas para errores de validación,
  autenticación y autorización.
- Paginación de respuestas de la API.
- Límite de tiempo para algunas operaciones con MongoDB.

### Uso del ORM

Las operaciones principales se realizan mediante modelos y consultas del ORM
de Django. Esto reduce el riesgo de inyección SQL asociado con construir
consultas concatenando directamente texto recibido del usuario.

---

## 8. CORS, CSRF y middleware de Django

El backend incorpora middleware de seguridad de Django:

- `SecurityMiddleware`.
- `CsrfViewMiddleware`.
- `XFrameOptionsMiddleware`.
- `WhiteNoiseMiddleware`.

### ¿Para qué sirven?

- **SecurityMiddleware:** activa mecanismos de seguridad integrados de
  Django.
- **CSRF:** ayuda a impedir solicitudes falsificadas en flujos que utilizan
  cookies o sesiones.
- **XFrameOptionsMiddleware:** evita que la aplicación sea cargada
  indebidamente dentro de un iframe.
- **WhiteNoise:** sirve archivos estáticos de forma controlada.

También se configuró CORS para controlar desde qué orígenes puede consumir la
aplicación web la API.

En desarrollo se permite cualquier origen para facilitar las pruebas. En un
entorno de producción debe utilizarse una lista cerrada de orígenes
confiables.

---

## 9. Protección y organización de las bases de datos

## 9.1 MySQL

MySQL almacena la información estructurada del sistema, como usuarios,
niños, padrinos, asignaciones y entregas.

La conexión utiliza:

- Usuario y contraseña configurables.
- Variables de entorno.
- Codificación `utf8mb4`.
- Modo SQL estricto `STRICT_TRANS_TABLES`.

El modo estricto ayuda a evitar conversiones silenciosas y ciertos datos
inconsistentes.

## 9.2 MongoDB

MongoDB se utiliza para información semiestructurada, evidencias,
bitácoras, cartas y notificaciones.

La conexión utiliza:

- Usuario.
- Contraseña.
- Base de datos.
- `authSource=admin`.
- Timeout para seleccionar servidor.
- Timeout para establecer conexión.
- Timeout para operaciones de socket.

Los timeouts evitan que la aplicación quede esperando indefinidamente si
MongoDB no está disponible o responde lentamente.

---

## 10. Bitácora de eventos y trazabilidad

El sistema registra acciones relevantes en la colección
`bitacora_eventos` de MongoDB.

Se registran eventos como:

- Registro de padrinos.
- Login correcto.
- Login fallido.
- Login de administradores.
- Creación de niños.
- Cambios en registros.
- Operaciones relacionadas con evidencias.
- Notificaciones.

Cada registro puede incluir:

- Usuario que realizó la acción.
- Tabla o módulo afectado.
- Tipo de acción.
- Detalle de la operación.
- Fecha y hora.

### ¿Para qué se aplicó?

Para tener trazabilidad, facilitar auditorías y ayudar a investigar
actividades sospechosas o errores del sistema.

### Alcance actual

La bitácora funciona como registro de mejor esfuerzo. Si MongoDB no está
disponible, la aplicación registra una advertencia y continúa con la
operación principal. Todavía no existe un sistema centralizado de alertas ni
un registro inmutable.

---

## 11. Protección de evidencias y datos semiestructurados

Las evidencias de las entregas se relacionan con:

- La entrega.
- El apadrinamiento.
- El niño.
- El usuario que subió la evidencia.
- La fecha y hora.
- El tipo de archivo.
- Sus metadatos.

Las descripciones de evidencias pueden almacenarse cifradas con Fernet.
MongoDB conserva la información semiestructurada y sus relaciones con los
registros principales de MySQL.

Esta separación permite mantener los datos operativos en MySQL y los
documentos o metadatos flexibles en MongoDB.

---

## 12. Seguridad del frontend web

El frontend React incorpora una guarda de rutas mediante
[`ProtectedRoute.tsx`](frontend_react/src/components/ProtectedRoute.tsx).

La guarda:

1. Busca el token de sesión en el navegador.
2. Si no encuentra un token, redirige al usuario al login.
3. Si existe un token, permite mostrar la ruta protegida.

El login:

- Envía las credenciales mediante una petición `POST`.
- No muestra la contraseña en pantalla salvo que el usuario active la opción
  visual.
- Deshabilita el botón mientras se procesa la petición.
- Muestra un mensaje controlado si el login falla.
- Guarda la sesión después de recibir una respuesta correcta.

La protección de rutas del frontend mejora la experiencia de usuario, pero la
autorización definitiva debe realizarse siempre en el backend.

---

## 13. Seguridad de la aplicación Android

La aplicación Android implementa controles para proteger la comunicación con
el backend, el intercambio de archivos y el ciclo de vida de la sesión del
usuario. Estos controles son los siguientes:

- Permiso explícito de Internet.
- `FileProvider` no exportado.
- Gestión centralizada de sesión.
- Eliminación de datos locales al cerrar sesión.
- Almacenamiento del token y datos de sesión para mantener la sesión del
  usuario.

### 13.1 Comunicación con el backend

El permiso de Internet permite que la aplicación realice las solicitudes
necesarias al backend para iniciar sesión, consultar información y registrar
operaciones. Después de autenticarse, la aplicación conserva el token de
sesión y lo utiliza en las solicitudes que requieren autenticación. De esta
forma, el usuario no tiene que enviar su contraseña en cada operación.

La autenticación definitiva no depende únicamente de la aplicación móvil. El
backend debe validar la firma, la expiración y los permisos asociados al JWT
antes de aceptar cada solicitud protegida.

### 13.2 Protección del intercambio de archivos

La aplicación utiliza `FileProvider` para compartir archivos mediante URI,
en lugar de exponer directamente rutas internas del sistema de archivos. La
configuración:

- Define `exported="false"`, por lo que otras aplicaciones no pueden acceder
  libremente al proveedor.
- Activa `grantUriPermissions="true"` para conceder acceso únicamente cuando
  una operación concreta lo necesita.
- Reduce el riesgo de que una aplicación externa consulte directamente los
  archivos privados de la aplicación.

Este mecanismo controla el acceso al proveedor, pero no sustituye la
validación del tipo, tamaño y origen de los archivos que se cargan al
backend.

### 13.3 Gestión del ciclo de vida de la sesión

La sesión se administra desde un punto central de la aplicación. Al iniciar
sesión correctamente, se guardan el token y los datos mínimos necesarios para
conservar el estado autenticado. Al cerrar sesión, se eliminan esos datos
locales para evitar que el siguiente usuario del dispositivo continúe usando
la sesión anterior.

La eliminación local no revoca por sí sola el JWT en el servidor. Si un token
fuera copiado antes del cierre de sesión, seguiría siendo válido hasta su
expiración, salvo que el backend implemente un mecanismo de revocación.

### 13.4 Datos que deben mantenerse protegidos

El token de sesión debe tratarse como una credencial temporal. No debe
mostrarse en pantalla, incluirse en mensajes de diagnóstico ni escribirse en
logs. Los datos almacenados localmente deben limitarse a lo necesario para
restaurar la sesión y mostrar el estado básico de la aplicación.

### 13.5 Limitaciones actuales y medidas para producción

Actualmente existen dos limitaciones relevantes:

- El token móvil se guarda en `SharedPreferences` convencional, sin cifrado
  específico del almacenamiento.
- La configuración actual permite tráfico HTTP, que puede exponer credenciales,
  tokens y datos personales si la red es interceptada.

Antes de utilizar la aplicación en producción se debe:

1. Forzar HTTPS para todas las comunicaciones con el backend y deshabilitar
   el tráfico HTTP innecesario.
2. Migrar el almacenamiento del token a `Android Keystore`,
   `EncryptedSharedPreferences` o una solución equivalente.
3. Evitar guardar información personal que no sea indispensable en el
   dispositivo.
4. Considerar la revocación de tokens en el servidor cuando el usuario cierre
   sesión, cambie su contraseña o sea desactivado.
5. Revisar la configuración de copias de seguridad y depuración para evitar
   que los datos de sesión se extraigan del dispositivo.

---

## 14. Gestión de secretos y configuración

El proyecto utiliza variables de entorno para configurar:

- `SECRET_KEY`.
- `FERNET_KEY`.
- `JWT_SECRET_KEY`.
- Credenciales de MySQL.
- Credenciales de MongoDB.
- Credenciales de Google.
- Configuración de Supabase.
- Hosts y puertos.

El archivo `.env` está excluido mediante `.gitignore`, evitando que la
configuración local se incluya accidentalmente en el repositorio.

### ¿Para qué se aplicó?

Para separar la configuración del código y evitar escribir las credenciales
directamente en los módulos de la aplicación.

### Recomendación de operación

En producción se deben utilizar claves únicas, suficientemente fuertes y
sin valores predeterminados en el código. También se deben rotar las
credenciales si fueron expuestas.

---

## 15. Pruebas de seguridad existentes

El proyecto contiene pruebas unitarias y de integración.

Se prueban principalmente:

- Cifrado y descifrado correcto con Fernet.
- Manejo de valores vacíos.
- Manejo de datos cifrados corruptos.
- Creación de modelos.
- Estados de seguridad iniciales.
- Validación de emails.
- Registro de usuarios.
- Login exitoso.
- Login fallido.
- Generación y uso de JWT.
- Persistencia de datos cifrados en la base de datos.

Estas pruebas ayudan a comprobar que los controles principales continúan
funcionando después de modificar el código.

---

## 16. Monitoreo y diagnóstico implementados

El backend utiliza el sistema `logging` de Python para registrar:

- Errores de aplicación.
- Errores de cifrado y descifrado.
- Conexiones a MongoDB.
- Problemas al guardar evidencias.
- Problemas al registrar bitácoras.
- Fallos de servicios externos.

También existe un endpoint de diagnóstico y una comprobación de disponibilidad
de MongoDB mediante `ping`.

Los timeouts de MongoDB y de algunas operaciones de consulta evitan bloqueos
prolongados de la interfaz cuando una dependencia no responde.

Actualmente no hay un sistema completo de monitoreo con métricas, alertas,
SIEM o respuesta automática a incidentes.

---

## 17. Medidas que no deben presentarse como implementadas

En el documento Scrum aparecen algunas medidas como historias o subtareas,
pero no se deben presentar como terminadas sin una implementación verificable:

- Bloqueo automático después de varios intentos fallidos.
- Revocación inmediata de JWT al desactivar un usuario.
- Rate limiting de la API.
- HTTPS obligatorio y certificados.
- Firewall o WAF.
- Monitoreo centralizado y alertas.
- Backups automáticos verificados.
- Rotación de claves.
- Replicación y failover completos.
- Cumplimiento formal de LFPDPPP, GDPR, ISO 27001 u otra normativa.

---

## 18. Conclusión para la presentación

SmileLink cuenta con una base de seguridad funcional para un prototipo:

- Protege varios datos personales con Fernet.
- Almacena contraseñas mediante PBKDF2 y sal.
- Implementa login para padrinos y administradores.
- Utiliza JWT para manejar sesiones.
- Diferencia roles y estados de usuarios.
- Registra actividades importantes.
- Valida datos de entrada.
- Utiliza middleware de seguridad de Django.
- Separa la información estructurada de la semiestructurada.
- Incluye pruebas unitarias y de integración.

La seguridad actual protege los principales componentes de la aplicación, pero
antes de llevar el sistema a producción se deben reforzar la autorización
global de la API, HTTPS, la protección de tokens, el control contra fuerza
bruta, la gestión de claves, el monitoreo y el cumplimiento de privacidad
para información de menores.
