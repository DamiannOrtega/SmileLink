# SmileLink â€” PlaneaciÃ³n Scrum MVP (Parte 1: Ã‰picas)

---

## Ã‰PICAS DEL MVP

---

### EPIC-01 Â· AutenticaciÃ³n y Seguridad
- **DescripciÃ³n:** Implementar el sistema de autenticaciÃ³n federada (JWT + OAuth2) para todos los tipos de usuarios de la plataforma web y app mÃ³vil.
- **Objetivo de negocio:** Garantizar acceso seguro y diferenciado por rol (Admin, Padrino, Operador) como requisito previo a cualquier otra funcionalidad.
- **Prioridad:** CRÃTICA

---

### EPIC-02 Â· GestiÃ³n de NiÃ±os Beneficiarios
- **DescripciÃ³n:** CRUD completo de perfiles de niÃ±os registrados en la fundaciÃ³n, incluyendo datos personales, estado, documentos y asignaciones.
- **Objetivo de negocio:** Centralizar la informaciÃ³n de los beneficiarios para facilitar el seguimiento y la transparencia hacia los padrinos.
- **Prioridad:** CRÃTICA

---

### EPIC-03 Â· GestiÃ³n de Padrinos
- **DescripciÃ³n:** Registro, consulta y administraciÃ³n de padrinos (personas o empresas que aportan recursos a la fundaciÃ³n).
- **Objetivo de negocio:** Mantener una base de datos actualizada de donantes para gestionar relaciones y compromisos.
- **Prioridad:** CRÃTICA

---

### EPIC-04 Â· Asignaciones Padrinoâ€“NiÃ±o
- **DescripciÃ³n:** MÃ³dulo para vincular padrinos con niÃ±os beneficiarios, definir compromisos y gestionar el ciclo de vida de la asignaciÃ³n.
- **Objetivo de negocio:** Asegurar que cada niÃ±o tenga un padrino asignado y que las responsabilidades queden documentadas.
- **Prioridad:** ALTA

---

### EPIC-05 Â· GestiÃ³n de Entregas y Donaciones
- **DescripciÃ³n:** Registro y seguimiento de entregas fÃ­sicas o monetarias realizadas por padrinos a travÃ©s de puntos de entrega geolocalizados.
- **Objetivo de negocio:** Auditar el cumplimiento de compromisos y generar reportes de impacto social.
- **Prioridad:** ALTA

---

### EPIC-06 Â· Evidencias FotogrÃ¡ficas (MongoDB)
- **DescripciÃ³n:** Sistema de carga, almacenamiento y consulta de evidencias fotogrÃ¡ficas de entregas y actividades, usando MongoDB como store primario.
- **Objetivo de negocio:** Brindar transparencia a los padrinos mediante pruebas visuales del uso de sus donaciones.
- **Prioridad:** ALTA

---

### EPIC-07 Â· Notificaciones
- **DescripciÃ³n:** Motor de notificaciones in-app, push y email para alertar a padrinos y administradores sobre eventos relevantes.
- **Objetivo de negocio:** Mejorar el engagement y mantener a todos los actores informados en tiempo real.
- **Prioridad:** MEDIA

---

### EPIC-08 Â· Cartas y Solicitudes
- **DescripciÃ³n:** MÃ³dulo para que los niÃ±os (a travÃ©s de operadores) envÃ­en cartas a sus padrinos y gestionen solicitudes especiales.
- **Objetivo de negocio:** Humanizar el vÃ­nculo padrino-niÃ±o y aumentar la retenciÃ³n de padrinos.
- **Prioridad:** MEDIA

---

### EPIC-09 Â· GestiÃ³n de Eventos
- **DescripciÃ³n:** Crear, publicar y administrar eventos de la fundaciÃ³n (visitas, actividades, ceremonias) con inscripciÃ³n de participantes.
- **Objetivo de negocio:** Fortalecer la comunidad y visibilidad de la fundaciÃ³n.
- **Prioridad:** MEDIA

---

### EPIC-10 Â· Panel Administrativo y Dashboard
- **DescripciÃ³n:** Interfaz centralizada para administradores con mÃ©tricas clave, reportes, gestiÃ³n de usuarios y configuraciÃ³n del sistema.
- **Objetivo de negocio:** Facilitar la toma de decisiones y el control operativo de la fundaciÃ³n.
- **Prioridad:** ALTA

---

### EPIC-11 Â· App MÃ³vil (Flutter)
- **DescripciÃ³n:** VersiÃ³n mÃ³vil de las funcionalidades principales para padrinos: ver perfil del niÃ±o, consultar entregas, subir evidencias y recibir notificaciones.
- **Objetivo de negocio:** Aumentar la accesibilidad y la participaciÃ³n activa de los padrinos.
- **Prioridad:** ALTA

---

### EPIC-12 Â· Infraestructura Distribuida (MySQL ReplicaciÃ³n + MongoDB + Docker)
- **DescripciÃ³n:** Configurar la arquitectura de base de datos distribuida: MySQL primario-rÃ©plica, fragmentaciÃ³n de datos, MongoDB para semiestructurados, y despliegue en contenedores Docker.
- **Objetivo de negocio:** Garantizar alta disponibilidad, escalabilidad y cumplimiento de los requisitos acadÃ©micos de bases de datos distribuidas.
- **Prioridad:** CRÃTICA

---
# SmileLink â€” Historias de Usuario (EPIC-01 a EPIC-04)

---

## EPIC-01: AutenticaciÃ³n y Seguridad

### US-01-01
**Historia:** Como administrador, quiero iniciar sesiÃ³n con usuario y contraseÃ±a, para acceder al panel de gestiÃ³n de forma segura.
- **DescripciÃ³n:** Pantalla de login con JWT. Roles: Admin, Operador, Padrino.
- **Criterios de aceptaciÃ³n:**
  - El sistema valida credenciales y emite un JWT vÃ¡lido por 8h.
  - Roles incorrectos redirigen a vista de error.
  - ContraseÃ±a incorrecta 3 veces bloquea la cuenta por 15 min.
- **Story Points:** 8 | **Prioridad:** CRÃTICA | **Sprint:** 1
- **Dependencias:** Ninguna

**Subtareas:**
- [ ] Modelo `User` Django con roles (Admin/Operador/Padrino)
- [ ] Endpoint `POST /api/auth/login/` con JWT
- [ ] Middleware de autorizaciÃ³n por rol
- [ ] Vista React: formulario de login con validaciÃ³n
- [ ] Pantalla Flutter: login con manejo de token
- [ ] Tests unitarios: login exitoso, fallido, bloqueo
- [ ] Configurar variables de entorno Docker para SECRET_KEY

---

### US-01-02
**Historia:** Como padrino, quiero iniciar sesiÃ³n con mi cuenta Google, para no tener que recordar otra contraseÃ±a.
- **DescripciÃ³n:** AutenticaciÃ³n federada OAuth2 con Google.
- **Criterios de aceptaciÃ³n:**
  - BotÃ³n "Continuar con Google" disponible en login.
  - Si el email no existe, se crea cuenta con rol Padrino.
  - Token JWT emitido tras validaciÃ³n OAuth.
- **Story Points:** 8 | **Prioridad:** ALTA | **Sprint:** 1
- **Dependencias:** US-01-01

**Subtareas:**
- [ ] Configurar `django-allauth` con Google OAuth2
- [ ] Endpoint `GET /api/auth/google/` (callback)
- [ ] Crear usuario automÃ¡ticamente si no existe
- [ ] Vista React: botÃ³n Google OAuth
- [ ] Pantalla Flutter: Google Sign-In SDK
- [ ] Tests de integraciÃ³n OAuth

---

### US-01-03
**Historia:** Como administrador, quiero gestionar usuarios del sistema, para activar, desactivar y asignar roles.
- **DescripciÃ³n:** CRUD de usuarios desde el panel admin.
- **Criterios de aceptaciÃ³n:**
  - Lista paginada de usuarios con filtro por rol.
  - Cambio de rol en tiempo real.
  - Desactivar usuario revoca su JWT.
- **Story Points:** 5 | **Prioridad:** ALTA | **Sprint:** 1
- **Dependencias:** US-01-01

**Subtareas:**
- [ ] Endpoint `GET/POST/PATCH/DELETE /api/users/`
- [ ] Vista React: tabla de usuarios con acciones
- [ ] ValidaciÃ³n: no puede eliminarse el Ãºltimo Admin
- [ ] Tests: CRUD de usuarios

---

## EPIC-02: GestiÃ³n de NiÃ±os Beneficiarios

### US-02-01
**Historia:** Como operador, quiero registrar un nuevo niÃ±o beneficiario, para incorporarlo al programa de apadrinamiento.
- **DescripciÃ³n:** Formulario de registro con datos personales, fotografÃ­a y documentos.
- **Criterios de aceptaciÃ³n:**
  - Campos requeridos: nombre, fecha nacimiento, CURP, direcciÃ³n, tutor.
  - Foto de perfil obligatoria (almacenada en MongoDB).
  - Estado inicial: "Sin padrino".
- **Story Points:** 8 | **Prioridad:** CRÃTICA | **Sprint:** 1
- **Dependencias:** US-01-01

**Subtareas:**
- [ ] Modelo Django `Nino` (MySQL nodo primario)
- [ ] Endpoint `POST /api/ninos/`
- [ ] Endpoint `GET /api/ninos/{id}/`
- [ ] LÃ³gica de carga de foto â†’ MongoDB GridFS
- [ ] Vista React: formulario multi-paso de registro
- [ ] Validaciones: CURP Ãºnico, fecha vÃ¡lida
- [ ] Tests: creaciÃ³n, validaciones, foto

---

### US-02-02
**Historia:** Como administrador, quiero ver el listado de todos los niÃ±os registrados, para monitorear el estado del programa.
- **DescripciÃ³n:** Vista de listado con filtros, bÃºsqueda y paginaciÃ³n.
- **Criterios de aceptaciÃ³n:**
  - Filtros: estado (con/sin padrino), edad, zona.
  - Exportar a CSV.
  - PaginaciÃ³n de 20 registros por pÃ¡gina.
- **Story Points:** 5 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-02-01

**Subtareas:**
- [ ] Endpoint `GET /api/ninos/?estado=&zona=&page=`
- [ ] Vista React: tabla con filtros y exportaciÃ³n
- [ ] Query optimizada con Ã­ndices MySQL
- [ ] Tests: filtros, paginaciÃ³n

---

### US-02-03
**Historia:** Como operador, quiero editar los datos de un niÃ±o, para mantener su informaciÃ³n actualizada.
- **Criterios de aceptaciÃ³n:**
  - Historial de cambios registrado (audit log en MongoDB).
  - Solo Admin/Operador puede editar.
- **Story Points:** 3 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-02-01

**Subtareas:**
- [ ] Endpoint `PATCH /api/ninos/{id}/`
- [ ] Log de cambios â†’ MongoDB colecciÃ³n `audit_logs`
- [ ] Vista React: formulario de ediciÃ³n
- [ ] Tests: ediciÃ³n, log generado

---

### US-02-04
**Historia:** Como padrino, quiero ver el perfil de mi niÃ±o apadrinado, para conocer su situaciÃ³n y progreso.
- **Criterios de aceptaciÃ³n:**
  - Solo visible el niÃ±o asignado al padrino.
  - Muestra: foto, nombre, edad, cartas recibidas, entregas.
- **Story Points:** 5 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-04-01

**Subtareas:**
- [ ] Endpoint `GET /api/padrinos/{id}/nino/`
- [ ] Vista React: perfil de niÃ±o (solo lectura)
- [ ] Pantalla Flutter: perfil del niÃ±o apadrinado
- [ ] Tests: acceso restringido por rol

---

## EPIC-03: GestiÃ³n de Padrinos

### US-03-01
**Historia:** Como administrador, quiero registrar un nuevo padrino, para incorporarlo al programa.
- **Criterios de aceptaciÃ³n:**
  - Campos: nombre, email, telÃ©fono, tipo (persona/empresa), RFC.
  - Email Ãºnico en el sistema.
  - Estado inicial: "Activo".
- **Story Points:** 5 | **Prioridad:** CRÃTICA | **Sprint:** 1
- **Dependencias:** US-01-01

**Subtareas:**
- [ ] Modelo Django `Padrino` (MySQL)
- [ ] Endpoint `POST /api/padrinos/`
- [ ] ValidaciÃ³n: email Ãºnico, RFC formato
- [ ] Vista React: formulario de registro
- [ ] Tests: registro, duplicados

---

### US-03-02
**Historia:** Como administrador, quiero ver y filtrar el listado de padrinos, para gestionar el programa eficientemente.
- **Criterios de aceptaciÃ³n:**
  - Filtros: estado, tipo, zona.
  - Indicador de cumplimiento de entregas.
- **Story Points:** 5 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-03-01

**Subtareas:**
- [ ] Endpoint `GET /api/padrinos/?estado=&tipo=`
- [ ] Vista React: tabla con indicadores
- [ ] Tests: filtros

---

### US-03-03
**Historia:** Como padrino, quiero ver mi propio perfil y mis compromisos activos, para gestionar mis donaciones.
- **Criterios de aceptaciÃ³n:**
  - Vista de perfil propio con asignaciones y entregas pendientes.
  - Editable: telÃ©fono, direcciÃ³n.
- **Story Points:** 3 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-03-01, US-04-01

**Subtareas:**
- [ ] Endpoint `GET/PATCH /api/padrinos/me/`
- [ ] Vista React: mi perfil
- [ ] Pantalla Flutter: mi perfil
- [ ] Tests: acceso solo a datos propios

---

## EPIC-04: Asignaciones Padrinoâ€“NiÃ±o

### US-04-01
**Historia:** Como administrador, quiero asignar un padrino a un niÃ±o, para formalizar el compromiso de apadrinamiento.
- **Criterios de aceptaciÃ³n:**
  - Solo niÃ±os con estado "Sin padrino" aparecen disponibles.
  - Un padrino puede tener mÃ¡ximo 3 niÃ±os activos.
  - Al asignar, el estado del niÃ±o cambia a "Con padrino".
  - NotificaciÃ³n automÃ¡tica enviada al padrino.
- **Story Points:** 8 | **Prioridad:** CRÃTICA | **Sprint:** 2
- **Dependencias:** US-02-01, US-03-01

**Subtareas:**
- [ ] Modelo `Asignacion` (nino_id, padrino_id, fecha_inicio, estado)
- [ ] Endpoint `POST /api/asignaciones/`
- [ ] LÃ³gica: validar lÃ­mite 3 niÃ±os por padrino
- [ ] Trigger: cambio estado niÃ±o + notificaciÃ³n
- [ ] Vista React: modal de asignaciÃ³n
- [ ] Tests: asignaciÃ³n, lÃ­mites, cambio estado

---

### US-04-02
**Historia:** Como administrador, quiero terminar una asignaciÃ³n, para liberar al niÃ±o y al padrino cuando el compromiso concluye.
- **Criterios de aceptaciÃ³n:**
  - Motivo de terminaciÃ³n requerido.
  - Historial de asignaciones preservado.
  - Estado del niÃ±o vuelve a "Sin padrino".
- **Story Points:** 5 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-04-01

**Subtareas:**
- [ ] Endpoint `PATCH /api/asignaciones/{id}/terminar/`
- [ ] Campo `motivo_termino` y `fecha_fin`
- [ ] Vista React: formulario de terminaciÃ³n
- [ ] Tests: terminaciÃ³n, historial

---

### US-04-03
**Historia:** Como administrador, quiero ver el historial de asignaciones de un niÃ±o, para auditar el seguimiento del beneficiario.
- **Criterios de aceptaciÃ³n:**
  - Listado cronolÃ³gico de todos los padrinos que tuvo el niÃ±o.
  - Incluye fechas y motivos de terminaciÃ³n.
- **Story Points:** 3 | **Prioridad:** MEDIA | **Sprint:** 3
- **Dependencias:** US-04-02

**Subtareas:**
- [ ] Endpoint `GET /api/ninos/{id}/asignaciones/`
- [ ] Vista React: timeline de asignaciones
- [ ] Tests: historial completo

---
# SmileLink â€” Historias de Usuario (EPIC-05 a EPIC-08)

---

## EPIC-05: GestiÃ³n de Entregas y Donaciones

### US-05-01
**Historia:** Como operador, quiero registrar una entrega realizada por un padrino, para documentar el cumplimiento del compromiso.
- **Criterios de aceptaciÃ³n:**
  - Campos: padrino, niÃ±o, tipo entrega (monetaria/especie), monto/descripciÃ³n, punto de entrega, fecha.
  - Estado inicial: "Pendiente de evidencia".
  - Solo puede registrarse si existe asignaciÃ³n activa.
- **Story Points:** 8 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-04-01

**Subtareas:**
- [ ] Modelo `Entrega` (MySQL)
- [ ] Modelo `PuntoEntrega` con coordenadas (Google Maps)
- [ ] Endpoint `POST /api/entregas/`
- [ ] ValidaciÃ³n: asignaciÃ³n activa requerida
- [ ] Vista React: formulario de entrega con mapa
- [ ] IntegraciÃ³n Google Maps API (selector de punto)
- [ ] Tests: registro, validaciones

---

### US-05-02
**Historia:** Como administrador, quiero ver el mapa de puntos de entrega activos, para planificar la logÃ­stica.
- **Criterios de aceptaciÃ³n:**
  - Mapa interactivo con marcadores por zona.
  - Click en marcador muestra Ãºltimas entregas en ese punto.
  - Filtro por fecha y estado.
- **Story Points:** 8 | **Prioridad:** ALTA | **Sprint:** 3
- **Dependencias:** US-05-01

**Subtareas:**
- [ ] Endpoint `GET /api/puntos-entrega/` con coordenadas
- [ ] IntegraciÃ³n Google Maps JavaScript API en React
- [ ] Componente MapaEntregas con marcadores
- [ ] Tests: carga de puntos, filtros

---

### US-05-03
**Historia:** Como padrino, quiero ver el historial de mis entregas, para llevar control de mis compromisos cumplidos.
- **Criterios de aceptaciÃ³n:**
  - Listado con estado, fecha, tipo y evidencia adjunta.
  - Disponible en web y app mÃ³vil.
- **Story Points:** 5 | **Prioridad:** ALTA | **Sprint:** 3
- **Dependencias:** US-05-01

**Subtareas:**
- [ ] Endpoint `GET /api/padrinos/me/entregas/`
- [ ] Vista React: historial de entregas
- [ ] Pantalla Flutter: historial de entregas
- [ ] Tests: acceso solo a propias

---

### US-05-04
**Historia:** Como administrador, quiero generar un reporte de entregas por periodo, para auditar el programa.
- **Criterios de aceptaciÃ³n:**
  - Filtros: fecha, zona, tipo de entrega, padrino.
  - Exportar a PDF y CSV.
- **Story Points:** 5 | **Prioridad:** MEDIA | **Sprint:** 4
- **Dependencias:** US-05-01

**Subtareas:**
- [ ] Endpoint `GET /api/reportes/entregas/`
- [ ] GeneraciÃ³n PDF con `reportlab`
- [ ] Vista React: mÃ³dulo de reportes
- [ ] Tests: generaciÃ³n PDF/CSV

---

## EPIC-06: Evidencias FotogrÃ¡ficas (MongoDB)

### US-06-01
**Historia:** Como operador, quiero subir fotos de evidencia de una entrega, para certificar que se realizÃ³ correctamente.
- **Criterios de aceptaciÃ³n:**
  - MÃ¡ximo 5 fotos por entrega, formato JPG/PNG, mÃ¡x 5MB c/u.
  - Almacenadas en MongoDB GridFS.
  - La entrega cambia estado a "Completada" al subir al menos 1 foto.
  - Thumbnail generado automÃ¡ticamente.
- **Story Points:** 8 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-05-01

**Subtareas:**
- [ ] Configurar MongoDB + GridFS en Django
- [ ] Endpoint `POST /api/entregas/{id}/evidencias/`
- [ ] LÃ³gica de compresiÃ³n y thumbnail (Pillow)
- [ ] Cambio de estado automÃ¡tico de entrega
- [ ] Vista React: uploader con previsualizaciÃ³n
- [ ] Pantalla Flutter: cÃ¡mara + subida de fotos
- [ ] Tests: subida, validaciÃ³n tamaÃ±o/formato, GridFS

---

### US-06-02
**Historia:** Como padrino, quiero ver las fotos de evidencia de las entregas de mi niÃ±o, para confirmar que llegaron los recursos.
- **Criterios de aceptaciÃ³n:**
  - GalerÃ­a de evidencias por entrega.
  - Solo visible para el padrino asignado.
  - Disponible en web y mÃ³vil.
- **Story Points:** 5 | **Prioridad:** ALTA | **Sprint:** 3
- **Dependencias:** US-06-01

**Subtareas:**
- [ ] Endpoint `GET /api/entregas/{id}/evidencias/`
- [ ] Control de acceso: solo padrino asignado
- [ ] Vista React: galerÃ­a lightbox
- [ ] Pantalla Flutter: galerÃ­a de imÃ¡genes
- [ ] Tests: acceso restringido

---

### US-06-03
**Historia:** Como administrador, quiero consultar el log de actividades del sistema, para auditar operaciones crÃ­ticas.
- **Criterios de aceptaciÃ³n:**
  - Logs almacenados en MongoDB colecciÃ³n `activity_logs`.
  - Filtrable por usuario, acciÃ³n, fecha.
  - Exportable a JSON.
- **Story Points:** 5 | **Prioridad:** MEDIA | **Sprint:** 4
- **Dependencias:** US-01-01

**Subtareas:**
- [ ] Middleware Django para logging automÃ¡tico en MongoDB
- [ ] Esquema log: `{user_id, action, model, object_id, timestamp, ip}`
- [ ] Endpoint `GET /api/logs/`
- [ ] Vista React: tabla de logs con filtros
- [ ] Tests: generaciÃ³n automÃ¡tica de logs

---

## EPIC-07: Notificaciones

### US-07-01
**Historia:** Como padrino, quiero recibir una notificaciÃ³n cuando se registre una nueva entrega, para estar al tanto del estado de mi compromiso.
- **Criterios de aceptaciÃ³n:**
  - NotificaciÃ³n in-app y email al momento del registro.
  - Email usa plantilla HTML con logo de la fundaciÃ³n.
  - NotificaciÃ³n push en la app mÃ³vil.
- **Story Points:** 8 | **Prioridad:** ALTA | **Sprint:** 3
- **Dependencias:** US-05-01

**Subtareas:**
- [ ] Modelo `Notificacion` (MySQL)
- [ ] Servicio de email con `django-ses` o SMTP
- [ ] IntegraciÃ³n Firebase Cloud Messaging (FCM) para push
- [ ] Endpoint `GET /api/notificaciones/` (listado propio)
- [ ] Endpoint `PATCH /api/notificaciones/{id}/leer/`
- [ ] Vista React: campana de notificaciones con badge
- [ ] Pantalla Flutter: notificaciones push + in-app
- [ ] Tests: envÃ­o email, push, marcado leÃ­do

---

### US-07-02
**Historia:** Como administrador, quiero enviar notificaciones masivas a un grupo de padrinos, para comunicar eventos o recordatorios.
- **Criterios de aceptaciÃ³n:**
  - SelecciÃ³n de destinatarios por filtro (zona, estado, etc).
  - Mensaje personalizable con plantilla.
  - Registro del envÃ­o en historial.
- **Story Points:** 5 | **Prioridad:** MEDIA | **Sprint:** 4
- **Dependencias:** US-07-01

**Subtareas:**
- [ ] Endpoint `POST /api/notificaciones/masiva/`
- [ ] Tarea asÃ­ncrona Celery para envÃ­o masivo
- [ ] Vista React: formulario de notificaciÃ³n masiva
- [ ] Tests: envÃ­o masivo, registro historial

---

### US-07-03
**Historia:** Como administrador, quiero recibir alertas cuando un padrino no ha realizado entregas en mÃ¡s de 30 dÃ­as, para hacer seguimiento proactivo.
- **Criterios de aceptaciÃ³n:**
  - Tarea programada diaria (cron).
  - Alerta en dashboard y email al administrador.
- **Story Points:** 5 | **Prioridad:** MEDIA | **Sprint:** 4
- **Dependencias:** US-05-01, US-07-01

**Subtareas:**
- [ ] Tarea Celery Beat programada diariamente
- [ ] Query de padrinos con entregas > 30 dÃ­as
- [ ] Email de alerta al admin
- [ ] Widget de alertas en dashboard
- [ ] Tests: lÃ³gica de detecciÃ³n

---

## EPIC-08: Cartas y Solicitudes

### US-08-01
**Historia:** Como operador, quiero registrar una carta de un niÃ±o dirigida a su padrino, para fortalecer el vÃ­nculo afectivo.
- **Criterios de aceptaciÃ³n:**
  - Puede ser texto o imagen escaneada (PDF/JPG).
  - NotificaciÃ³n automÃ¡tica al padrino.
  - Estado: Enviada / LeÃ­da.
- **Story Points:** 5 | **Prioridad:** MEDIA | **Sprint:** 3
- **Dependencias:** US-04-01

**Subtareas:**
- [ ] Modelo `Carta` (MySQL) + archivo en MongoDB
- [ ] Endpoint `POST /api/cartas/`
- [ ] NotificaciÃ³n al padrino al crear
- [ ] Vista React: formulario de carta
- [ ] Tests: creaciÃ³n, notificaciÃ³n

---

### US-08-02
**Historia:** Como padrino, quiero leer las cartas de mi niÃ±o desde la app, para mantener conexiÃ³n emocional con Ã©l.
- **Criterios de aceptaciÃ³n:**
  - Listado de cartas ordenadas por fecha.
  - Marcar como leÃ­da al abrir.
  - Disponible en web y mÃ³vil.
- **Story Points:** 5 | **Prioridad:** MEDIA | **Sprint:** 3
- **Dependencias:** US-08-01

**Subtareas:**
- [ ] Endpoint `GET /api/padrinos/me/cartas/`
- [ ] Vista React: buzÃ³n de cartas
- [ ] Pantalla Flutter: buzÃ³n de cartas
- [ ] Tests: acceso solo a cartas propias

---

### US-08-03
**Historia:** Como padrino, quiero enviar una solicitud especial (Ãºtiles, ropa, medicina), para apoyar necesidades puntuales de mi niÃ±o.
- **Criterios de aceptaciÃ³n:**
  - Formulario con tipo de solicitud y descripciÃ³n.
  - Admin puede aprobar o rechazar con comentario.
  - NotificaciÃ³n al padrino de la resoluciÃ³n.
- **Story Points:** 5 | **Prioridad:** BAJA | **Sprint:** 4
- **Dependencias:** US-04-01

**Subtareas:**
- [ ] Modelo `Solicitud`
- [ ] Endpoints CRUD `POST/GET/PATCH /api/solicitudes/`
- [ ] Vista React: formulario + gestiÃ³n admin
- [ ] NotificaciÃ³n de resoluciÃ³n
- [ ] Tests: flujo completo

---
# SmileLink â€” Historias de Usuario (EPIC-09 a EPIC-12)

---

## EPIC-09: GestiÃ³n de Eventos

### US-09-01
**Historia:** Como administrador, quiero crear un evento de la fundaciÃ³n, para convocar a padrinos y comunidad.
- **Criterios de aceptaciÃ³n:**
  - Campos: nombre, fecha, lugar, descripciÃ³n, cupo mÃ¡ximo, imagen.
  - Estado: Borrador / Publicado / Cancelado.
  - Imagen almacenada en MongoDB.
- **Story Points:** 5 | **Prioridad:** MEDIA | **Sprint:** 3
- **Dependencias:** US-01-01

**Subtareas:**
- [ ] Modelo `Evento` (MySQL)
- [ ] Endpoint `POST /api/eventos/`
- [ ] Upload imagen â†’ MongoDB
- [ ] Vista React: formulario de creaciÃ³n de evento
- [ ] Tests: creaciÃ³n, estados

---

### US-09-02
**Historia:** Como padrino, quiero inscribirme a un evento, para participar en las actividades de la fundaciÃ³n.
- **Criterios de aceptaciÃ³n:**
  - Solo eventos publicados con cupo disponible.
  - ConfirmaciÃ³n por email.
  - CancelaciÃ³n disponible hasta 24h antes.
- **Story Points:** 5 | **Prioridad:** MEDIA | **Sprint:** 4
- **Dependencias:** US-09-01

**Subtareas:**
- [ ] Modelo `InscripcionEvento`
- [ ] Endpoint `POST /api/eventos/{id}/inscribir/`
- [ ] ValidaciÃ³n de cupo y fecha lÃ­mite
- [ ] Email de confirmaciÃ³n
- [ ] Vista React: lista de eventos + botÃ³n inscribir
- [ ] Pantalla Flutter: catÃ¡logo de eventos
- [ ] Tests: inscripciÃ³n, cancelaciÃ³n, lÃ­mite cupo

---

### US-09-03
**Historia:** Como administrador, quiero ver la lista de inscritos a un evento, para planificar la logÃ­stica.
- **Criterios de aceptaciÃ³n:**
  - Lista con nombre, contacto y fecha de inscripciÃ³n.
  - Exportar a CSV.
- **Story Points:** 3 | **Prioridad:** MEDIA | **Sprint:** 4
- **Dependencias:** US-09-02

**Subtareas:**
- [ ] Endpoint `GET /api/eventos/{id}/inscritos/`
- [ ] ExportaciÃ³n CSV
- [ ] Vista React: tabla de inscritos
- [ ] Tests: listado, exportaciÃ³n

---

## EPIC-10: Panel Administrativo y Dashboard

### US-10-01
**Historia:** Como administrador, quiero ver un dashboard con mÃ©tricas clave, para tomar decisiones informadas.
- **Criterios de aceptaciÃ³n:**
  - KPIs visibles: total niÃ±os, niÃ±os con padrino, entregas del mes, padrinos activos, alertas pendientes.
  - GrÃ¡fico de entregas por mes (Ãºltimos 6 meses).
  - Mapa de calor por zona.
- **Story Points:** 8 | **Prioridad:** ALTA | **Sprint:** 3
- **Dependencias:** US-02-01, US-03-01, US-05-01

**Subtareas:**
- [ ] Endpoint `GET /api/dashboard/stats/`
- [ ] Queries agregadas MySQL optimizadas
- [ ] Vista React: cards de KPIs + Chart.js
- [ ] Componente MapaCalor con Google Maps
- [ ] Tests: datos correctos en KPIs

---

### US-10-02
**Historia:** Como administrador, quiero gestionar los puntos de entrega desde el panel, para mantener actualizada la red logÃ­stica.
- **Criterios de aceptaciÃ³n:**
  - CRUD de puntos con nombre, direcciÃ³n y coordenadas.
  - Coordenadas seleccionables desde mapa.
  - Estado: Activo / Inactivo.
- **Story Points:** 5 | **Prioridad:** ALTA | **Sprint:** 3
- **Dependencias:** US-05-01

**Subtareas:**
- [ ] Modelo `PuntoEntrega`
- [ ] Endpoints CRUD `/api/puntos-entrega/`
- [ ] Selector de coordenadas Google Maps React
- [ ] Tests: CRUD, validaciÃ³n coordenadas

---

### US-10-03
**Historia:** Como administrador, quiero ver y gestionar todos los roles y permisos del sistema, para mantener el control de acceso.
- **Criterios de aceptaciÃ³n:**
  - Lista de todos los usuarios con rol y estado.
  - Cambio de rol con confirmaciÃ³n.
  - Registro de cambios de rol en log.
- **Story Points:** 3 | **Prioridad:** MEDIA | **Sprint:** 4
- **Dependencias:** US-01-03

**Subtareas:**
- [ ] Vista React: tabla usuarios + selector rol
- [ ] Endpoint `PATCH /api/users/{id}/rol/`
- [ ] Log de cambio en MongoDB
- [ ] Tests: cambio de rol, log generado

---

## EPIC-11: App MÃ³vil Flutter

### US-11-01
**Historia:** Como padrino, quiero usar la app mÃ³vil para ver el perfil de mi niÃ±o y mis entregas, para gestionar mi compromiso desde el celular.
- **DescripciÃ³n:** Funcionalidades principales del padrino disponibles en Flutter.
- **Criterios de aceptaciÃ³n:**
  - Login con JWT y Google Sign-In.
  - Pantallas: Inicio, Perfil niÃ±o, Mis entregas, Cartas, Notificaciones.
  - Persistencia de sesiÃ³n con SharedPreferences.
- **Story Points:** 13 | **Prioridad:** ALTA | **Sprint:** 3
- **Dependencias:** US-01-01, US-04-01, US-05-01

**Subtareas:**
- [ ] Configurar proyecto Flutter con arquitectura BLoC
- [ ] Servicio HTTP con Dio + JWT interceptor
- [ ] Pantalla Login (email/pass + Google)
- [ ] Pantalla Home con resumen
- [ ] Pantalla Perfil del niÃ±o
- [ ] Pantalla Mis entregas
- [ ] Pantalla Cartas
- [ ] Pantalla Notificaciones
- [ ] Tests de widgets principales

---

### US-11-02
**Historia:** Como padrino, quiero subir fotos de evidencia desde la app, para documentar una entrega directamente desde el campo.
- **Criterios de aceptaciÃ³n:**
  - Acceso a cÃ¡mara y galerÃ­a.
  - Subida de hasta 5 fotos por entrega.
  - Indicador de progreso durante la subida.
- **Story Points:** 8 | **Prioridad:** ALTA | **Sprint:** 4
- **Dependencias:** US-06-01, US-11-01

**Subtareas:**
- [ ] Paquete `image_picker` en Flutter
- [ ] Servicio de subida multipart a API Django
- [ ] Pantalla de cÃ¡mara/galerÃ­a con selecciÃ³n mÃºltiple
- [ ] Barra de progreso de subida
- [ ] Tests: selecciÃ³n y subida de imÃ¡genes

---

### US-11-03
**Historia:** Como padrino, quiero recibir notificaciones push en mi celular, para estar informado sin abrir la app.
- **Criterios de aceptaciÃ³n:**
  - Notificaciones push via Firebase Cloud Messaging.
  - Al tocar la notificaciÃ³n, navega a la pantalla relevante.
  - Registro de dispositivo token al login.
- **Story Points:** 5 | **Prioridad:** ALTA | **Sprint:** 4
- **Dependencias:** US-07-01, US-11-01

**Subtareas:**
- [ ] Configurar Firebase en Flutter
- [ ] Registrar FCM token al login (enviar al backend)
- [ ] Manejo de notificaciones en foreground/background
- [ ] Deep linking desde notificaciÃ³n
- [ ] Tests: recepciÃ³n de notificaciÃ³n

---

## EPIC-12: Infraestructura Distribuida

### US-12-01
**Historia:** Como equipo de desarrollo, quiero configurar MySQL con replicaciÃ³n primario-rÃ©plica, para garantizar alta disponibilidad de datos relacionales.
- **Criterios de aceptaciÃ³n:**
  - Nodo primario para escrituras, rÃ©plica para lecturas.
  - ReplicaciÃ³n asÃ­ncrona configurada y verificada.
  - Django usa primary para writes y replica para reads.
  - Failover documentado.
- **Story Points:** 13 | **Prioridad:** CRÃTICA | **Sprint:** 1
- **Dependencias:** Ninguna

**Subtareas:**
- [ ] Docker Compose: servicios `mysql-primary` y `mysql-replica`
- [ ] Configurar `my.cnf` binlog en primary
- [ ] Configurar `my.cnf` server-id en replica
- [ ] Script de inicializaciÃ³n de replicaciÃ³n
- [ ] Configurar Django `DATABASE_ROUTERS` (read/write split)
- [ ] Script de prueba de replicaciÃ³n
- [ ] Documentar failover manual

---

### US-12-02
**Historia:** Como equipo de desarrollo, quiero implementar fragmentaciÃ³n de datos por zona geogrÃ¡fica, para optimizar las consultas regionales.
- **Criterios de aceptaciÃ³n:**
  - NiÃ±os y entregas particionados por zona (Norte/Centro/Sur).
  - Queries de zona van al shard correspondiente.
  - Estrategia documentada en README.
- **Story Points:** 13 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-12-01

**Subtareas:**
- [ ] Definir estrategia de fragmentaciÃ³n horizontal
- [ ] Implementar lÃ³gica de routing en Django ORM
- [ ] Crear 3 schemas en MySQL por zona
- [ ] Script de migraciÃ³n de datos entre shards
- [ ] Tests: query routing por zona
- [ ] Documentar estrategia en `docs/fragmentacion.md`

---

### US-12-03
**Historia:** Como equipo de desarrollo, quiero integrar MongoDB para almacenamiento de documentos y logs, para separar datos semiestructurados de los relacionales.
- **Criterios de aceptaciÃ³n:**
  - MongoDB dockerizado con autenticaciÃ³n.
  - Colecciones: `evidencias`, `cartas_archivos`, `activity_logs`, `notificaciones_log`.
  - Django conecta via `djongo` o `pymongo`.
  - Respaldos automÃ¡ticos configurados.
- **Story Points:** 8 | **Prioridad:** ALTA | **Sprint:** 1
- **Dependencias:** Ninguna

**Subtareas:**
- [ ] Servicio `mongodb` en Docker Compose
- [ ] Configurar autenticaciÃ³n MongoDB
- [ ] Configurar conexiÃ³n en Django settings
- [ ] Definir esquemas de colecciones (sin schema estricto)
- [ ] Script de backup automÃ¡tico con mongodump
- [ ] Tests de conexiÃ³n y escritura

---

### US-12-04
**Historia:** Como equipo de desarrollo, quiero dockerizar todos los servicios del sistema, para garantizar portabilidad y facilitar el despliegue.
- **Criterios de aceptaciÃ³n:**
  - `docker-compose.yml` con todos los servicios.
  - Variables de entorno en `.env` (no hardcodeadas).
  - Servicios: django, react, flutter-web, mysql-primary, mysql-replica, mongodb, celery, redis, nginx.
  - `docker-compose up` levanta el sistema completo.
  - Health checks configurados.
- **Story Points:** 13 | **Prioridad:** CRÃTICA | **Sprint:** 1
- **Dependencias:** US-12-01, US-12-03

**Subtareas:**
- [ ] Dockerfile para Django backend
- [ ] Dockerfile para React frontend
- [ ] Dockerfile para Celery worker
- [ ] `docker-compose.yml` con todos los servicios
- [ ] Configurar Nginx como reverse proxy
- [ ] Configurar Redis para cache y Celery broker
- [ ] Archivo `.env.example` con todas las variables
- [ ] Script `./start.sh` de inicio rÃ¡pido
- [ ] Health checks para todos los servicios
- [ ] Documentar despliegue en `README.md`

---

### US-12-05
**Historia:** Como equipo de desarrollo, quiero implementar encriptaciÃ³n a nivel de aplicaciÃ³n para datos sensibles, para cumplir con estÃ¡ndares de seguridad.
- **Criterios de aceptaciÃ³n:**
  - Campos encriptados: CURP, RFC, datos bancarios, email de padrinos.
  - EncriptaciÃ³n AES-256 con llave en variables de entorno.
  - Datos encriptados en DB, desencriptados en API.
- **Story Points:** 8 | **Prioridad:** ALTA | **Sprint:** 2
- **Dependencias:** US-12-01

**Subtareas:**
- [ ] Implementar `EncryptedField` personalizado en Django
- [ ] Migrar campos sensibles a EncryptedField
- [ ] Configurar llave AES en `.env`
- [ ] Tests: encriptaciÃ³n/desencriptaciÃ³n correcta
- [ ] Auditar que los datos en DB estÃ©n encriptados

---
# SmileLink â€” Product Backlog + Sprint Planning

---

## PRODUCT BACKLOG (Priorizado)

| ID | Ã‰pica | Historia | Story Points | Prioridad | Sprint |
|---|---|---|---|---|---|
| US-01-01 | AutenticaciÃ³n | Login usuario/contraseÃ±a + JWT | 8 | CRÃTICA | Sprint 1 |
| US-01-02 | AutenticaciÃ³n | Login Google OAuth2 | 8 | ALTA | Sprint 1 |
| US-01-03 | AutenticaciÃ³n | GestiÃ³n de usuarios y roles | 5 | ALTA | Sprint 1 |
| US-12-01 | Infraestructura | MySQL replicaciÃ³n primario-rÃ©plica | 13 | CRÃTICA | Sprint 1 |
| US-12-03 | Infraestructura | MongoDB integraciÃ³n | 8 | ALTA | Sprint 1 |
| US-12-04 | Infraestructura | DockerizaciÃ³n completa | 13 | CRÃTICA | Sprint 1 |
| US-02-01 | NiÃ±os | Registro de niÃ±o beneficiario | 8 | CRÃTICA | Sprint 1 |
| US-03-01 | Padrinos | Registro de padrino | 5 | CRÃTICA | Sprint 1 |
| US-02-02 | NiÃ±os | Listado y filtros de niÃ±os | 5 | ALTA | Sprint 2 |
| US-02-03 | NiÃ±os | EdiciÃ³n de datos de niÃ±o | 3 | ALTA | Sprint 2 |
| US-03-02 | Padrinos | Listado y filtros de padrinos | 5 | ALTA | Sprint 2 |
| US-03-03 | Padrinos | Perfil propio del padrino | 3 | ALTA | Sprint 2 |
| US-04-01 | Asignaciones | Asignar padrino a niÃ±o | 8 | CRÃTICA | Sprint 2 |
| US-04-02 | Asignaciones | Terminar asignaciÃ³n | 5 | ALTA | Sprint 2 |
| US-05-01 | Entregas | Registrar entrega | 8 | ALTA | Sprint 2 |
| US-06-01 | Evidencias | Subir fotos de evidencia | 8 | ALTA | Sprint 2 |
| US-12-02 | Infraestructura | FragmentaciÃ³n por zona | 13 | ALTA | Sprint 2 |
| US-12-05 | Infraestructura | EncriptaciÃ³n campos sensibles | 8 | ALTA | Sprint 2 |
| US-02-04 | NiÃ±os | Ver perfil niÃ±o (padrino) | 5 | ALTA | Sprint 2 |
| US-05-02 | Entregas | Mapa de puntos de entrega | 8 | ALTA | Sprint 3 |
| US-05-03 | Entregas | Historial de entregas (padrino) | 5 | ALTA | Sprint 3 |
| US-06-02 | Evidencias | GalerÃ­a de evidencias (padrino) | 5 | ALTA | Sprint 3 |
| US-07-01 | Notificaciones | Notificaciones de entrega | 8 | ALTA | Sprint 3 |
| US-08-01 | Cartas | Registrar carta | 5 | MEDIA | Sprint 3 |
| US-08-02 | Cartas | Leer cartas (padrino) | 5 | MEDIA | Sprint 3 |
| US-09-01 | Eventos | Crear evento | 5 | MEDIA | Sprint 3 |
| US-10-01 | Dashboard | Dashboard con KPIs | 8 | ALTA | Sprint 3 |
| US-10-02 | Dashboard | GestiÃ³n puntos de entrega | 5 | ALTA | Sprint 3 |
| US-11-01 | App MÃ³vil | App Flutter padrino (core) | 13 | ALTA | Sprint 3 |
| US-04-03 | Asignaciones | Historial de asignaciones | 3 | MEDIA | Sprint 3 |
| US-06-03 | Evidencias | Log de actividades sistema | 5 | MEDIA | Sprint 4 |
| US-07-02 | Notificaciones | Notificaciones masivas | 5 | MEDIA | Sprint 4 |
| US-07-03 | Notificaciones | Alertas inactividad padrinos | 5 | MEDIA | Sprint 4 |
| US-08-03 | Cartas | Solicitudes especiales | 5 | BAJA | Sprint 4 |
| US-09-02 | Eventos | InscripciÃ³n a evento | 5 | MEDIA | Sprint 4 |
| US-09-03 | Eventos | Lista de inscritos | 3 | MEDIA | Sprint 4 |
| US-10-03 | Dashboard | GestiÃ³n roles y permisos | 3 | MEDIA | Sprint 4 |
| US-11-02 | App MÃ³vil | Subir fotos desde app | 8 | ALTA | Sprint 4 |
| US-11-03 | App MÃ³vil | Notificaciones push Flutter | 5 | ALTA | Sprint 4 |
| US-05-04 | Entregas | Reportes de entregas PDF/CSV | 5 | MEDIA | Sprint 4 |

**Total Story Points MVP: 249 SP**

---

## SPRINT 1 â€” Fundamentos e Infraestructura
**DuraciÃ³n:** 2 semanas | **Capacidad:** ~60 SP | **Total:** 60 SP

### Objetivo del Sprint
> Tener la base tÃ©cnica completa: infraestructura Docker levantada, autenticaciÃ³n funcional, y los primeros registros de niÃ±os y padrinos operativos.

| ID | Historia | SP |
|---|---|---|
| US-12-04 | DockerizaciÃ³n de todos los servicios | 13 |
| US-12-01 | MySQL replicaciÃ³n primario-rÃ©plica | 13 |
| US-12-03 | MongoDB integraciÃ³n y colecciones | 8 |
| US-01-01 | Login usuario/contraseÃ±a + JWT | 8 |
| US-01-02 | Login Google OAuth2 | 8 |
| US-01-03 | GestiÃ³n de usuarios y roles | 5 |
| US-02-01 | Registro de niÃ±o beneficiario | 8 |
| US-03-01 | Registro de padrino | 5 |

### Definition of Done â€” Sprint 1
- [ ] `docker-compose up` levanta todos los servicios sin errores
- [ ] ReplicaciÃ³n MySQL verificada con script de test
- [ ] MongoDB accesible y colecciones creadas
- [ ] Login JWT funcional (web + Flutter)
- [ ] Login Google OAuth2 funcional
- [ ] CRUD bÃ¡sico de niÃ±os y padrinos en API y React
- [ ] Tests unitarios con >70% cobertura en mÃ³dulos del sprint
- [ ] README con instrucciones de despliegue actualizado

---

## SPRINT 2 â€” NÃºcleo Operativo
**DuraciÃ³n:** 2 semanas | **Capacidad:** ~65 SP | **Total:** 65 SP

### Objetivo del Sprint
> Implementar el flujo completo de asignaciÃ³n padrino-niÃ±o y el registro de entregas con evidencias fotogrÃ¡ficas, incluyendo la fragmentaciÃ³n de datos y encriptaciÃ³n.

| ID | Historia | SP |
|---|---|---|
| US-12-02 | FragmentaciÃ³n de datos por zona | 13 |
| US-12-05 | EncriptaciÃ³n de campos sensibles | 8 |
| US-04-01 | Asignar padrino a niÃ±o | 8 |
| US-04-02 | Terminar asignaciÃ³n | 5 |
| US-05-01 | Registrar entrega | 8 |
| US-06-01 | Subir fotos de evidencia (MongoDB) | 8 |
| US-02-02 | Listado y filtros de niÃ±os | 5 |
| US-02-03 | EdiciÃ³n de datos de niÃ±o | 3 |
| US-02-04 | Ver perfil niÃ±o (padrino) | 5 |
| US-03-02 | Listado y filtros de padrinos | 5 |
| US-03-03 | Perfil propio del padrino | 3 |

### Definition of Done â€” Sprint 2
- [ ] Flujo asignaciÃ³n completo: asignar â†’ ver â†’ terminar
- [ ] Entrega registrada correctamente en MySQL con routing de zona
- [ ] Foto subida a MongoDB GridFS y recuperable
- [ ] Campos sensibles encriptados en DB verificados
- [ ] Listados con filtros y paginaciÃ³n funcionales
- [ ] Tests de integraciÃ³n del flujo asignaciÃ³n-entrega
- [ ] App Flutter: pantallas de perfil niÃ±o y entregas en progreso

---

## SPRINT 3 â€” Experiencia de Usuario y Visibilidad
**DuraciÃ³n:** 2 semanas | **Capacidad:** ~65 SP | **Total:** 67 SP

### Objetivo del Sprint
> Construir el dashboard administrativo, notificaciones, mÃ³dulo de cartas, mapa de entregas y el nÃºcleo de la app Flutter para padrinos.

| ID | Historia | SP |
|---|---|---|
| US-11-01 | App Flutter padrino (core) | 13 |
| US-10-01 | Dashboard con KPIs y grÃ¡ficas | 8 |
| US-07-01 | Notificaciones de entrega (push + email) | 8 |
| US-05-02 | Mapa de puntos de entrega | 8 |
| US-05-03 | Historial de entregas (padrino) | 5 |
| US-06-02 | GalerÃ­a de evidencias (padrino) | 5 |
| US-08-01 | Registrar carta de niÃ±o | 5 |
| US-08-02 | Leer cartas (padrino web + mÃ³vil) | 5 |
| US-09-01 | Crear evento | 5 |
| US-10-02 | GestiÃ³n puntos de entrega (admin) | 5 |
| US-04-03 | Historial de asignaciones | 3 |

### Definition of Done â€” Sprint 3
- [ ] Dashboard muestra KPIs reales con datos de DB
- [ ] Notificaciones push recibidas en Flutter y web
- [ ] Mapa de Google Maps con puntos de entrega activos
- [ ] Cartas: crear y leer funcional en web y Flutter
- [ ] App Flutter: todas las pantallas del padrino navegables
- [ ] Evento creado y visible en frontend
- [ ] Tests E2E del flujo de padrino en web

---

## SPRINT 4 â€” Completitud y Calidad MVP
**DuraciÃ³n:** 2 semanas | **Capacidad:** ~60 SP | **Total:** 57 SP

### Objetivo del Sprint
> Completar las funcionalidades complementarias, pulir la calidad del sistema y preparar el MVP para entrega/demo.

| ID | Historia | SP |
|---|---|---|
| US-11-02 | Subir fotos desde app Flutter | 8 |
| US-11-03 | Notificaciones push Flutter | 5 |
| US-07-02 | Notificaciones masivas | 5 |
| US-07-03 | Alertas inactividad padrinos (cron) | 5 |
| US-09-02 | InscripciÃ³n a eventos | 5 |
| US-09-03 | Lista de inscritos (admin) | 3 |
| US-08-03 | Solicitudes especiales | 5 |
| US-06-03 | Log de actividades en MongoDB | 5 |
| US-10-03 | GestiÃ³n roles y permisos | 3 |
| US-05-04 | Reportes PDF/CSV de entregas | 5 |
| US-04-03 | Historial asignaciones (refinamiento) | 3 |

### Definition of Done â€” Sprint 4
- [ ] App Flutter completa: cÃ¡mara, notificaciones push, eventos
- [ ] Notificaciones masivas funcionales con Celery
- [ ] Cron de alertas ejecutÃ¡ndose diariamente
- [ ] Log de actividades en MongoDB consultable desde admin
- [ ] Reportes exportables en PDF y CSV
- [ ] Cobertura total de tests > 75%
- [ ] DocumentaciÃ³n API (Swagger/OpenAPI) completa
- [ ] Deploy de demo en Docker funcionando end-to-end

---

## RESUMEN EJECUTIVO

| Sprint | Enfoque | Story Points |
|---|---|---|
| Sprint 1 | Infraestructura + AutenticaciÃ³n + Registros base | 60 SP |
| Sprint 2 | Asignaciones + Entregas + Evidencias + DistribuciÃ³n | 65 SP |
| Sprint 3 | Dashboard + Notificaciones + Cartas + App Flutter | 67 SP |
| Sprint 4 | Funcionalidades complementarias + Calidad | 57 SP |
| **TOTAL** | **MVP Completo** | **249 SP** |

---

## ROLES DEL EQUIPO SCRUM

| Rol | Responsabilidad |
|---|---|
| **Product Owner** | Priorizar backlog, validar criterios de aceptaciÃ³n, aceptar historias |
| **Scrum Master** | Facilitar ceremonias, remover impedimentos, velar por el proceso |
| **Dev Backend** | Django REST API, MySQL, MongoDB, Celery, Docker |
| **Dev Frontend** | React, Chart.js, Google Maps JS API |
| **Dev Mobile** | Flutter, BLoC, Firebase, integraciÃ³n API |
| **QA / DevOps** | Tests, CI/CD, Docker Compose, documentaciÃ³n |

---

## CEREMONIAS SCRUM (por Sprint de 2 semanas)

| Ceremonia | Frecuencia | DuraciÃ³n | Participantes |
|---|---|---|---|
| Sprint Planning | Inicio de sprint | 4 horas | Todo el equipo |
| Daily Standup | Cada dÃ­a | 15 min | Todo el equipo |
| Sprint Review | Fin de sprint | 2 horas | Equipo + Stakeholders |
| Sprint Retrospective | Fin de sprint | 1.5 horas | Equipo Scrum |
| Backlog Refinement | Mitad del sprint | 2 horas | PO + Dev Leads |

---

## DEFINICIÃ“N GLOBAL DE DONE (DoD)

- [ ] CÃ³digo revisado por al menos 1 compaÃ±ero (Pull Request)
- [ ] Tests unitarios escritos y pasando
- [ ] Sin errores de linting (flake8 / ESLint / dart analyze)
- [ ] Endpoint documentado en Swagger si aplica
- [ ] Integrado en `docker-compose` y funcional
- [ ] Criterios de aceptaciÃ³n de la historia verificados
- [ ] Desplegado en rama `develop` sin conflictos

---
