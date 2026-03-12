# Documento de Requisitos: FitMaster

## Introducción

FitMaster es un sistema SaaS multi-tenant para gestión integral de gimnasios con IA integrada. El sistema permite a múltiples gimnasios gestionar clientes, membresías, rutinas de entrenamiento, inventario de equipamiento, pagos y estadísticas, manteniendo datos completamente aislados mediante identificadores de gimnasio (gym_id). El sistema consta de una plataforma web para administradores y entrenadores, y una aplicación móvil para clientes.

## Glosario

- **Sistema**: El sistema FitMaster completo (backend, web dashboard, app móvil)
- **Gimnasio**: Entidad tenant que representa un gimnasio físico usando el sistema
- **Cliente**: Usuario final que es miembro de un gimnasio
- **Administrador_Gimnasio**: Usuario con permisos completos sobre un gimnasio específico
- **Entrenador**: Usuario que gestiona clientes y rutinas dentro de un gimnasio
- **Recepcionista**: Usuario que gestiona clientes, membresías y pagos
- **Membresía**: Suscripción de un cliente a un gimnasio con fechas de inicio y fin
- **Rutina**: Plan de entrenamiento compuesto por ejercicios organizados por días
- **Equipamiento**: Máquinas y accesorios disponibles en un gimnasio
- **Servicio_IA**: Componente que genera rutinas personalizadas usando OpenAI
- **Servicio_Autenticación**: Componente que gestiona login, tokens JWT y autorización
- **Servicio_Clientes**: Componente que gestiona datos personales y físicos de clientes
- **Servicio_Membresías**: Componente que controla suscripciones y vencimientos
- **Servicio_Rutinas**: Componente que gestiona planes de entrenamiento
- **Servicio_Pagos**: Componente que procesa pagos con Stripe y SINPE
- **Servicio_Estadísticas**: Componente que calcula métricas del gimnasio
- **Servicio_Promociones**: Componente que gestiona descuentos y códigos promocionales
- **Servicio_Inventario**: Componente que gestiona equipamiento y mantenimientos
- **Servicio_Notificaciones**: Componente que envía alertas push a usuarios
- **IMC**: Índice de Masa Corporal (peso / altura²)
- **Token_Acceso**: JWT con expiración de 15 minutos para autenticación
- **Token_Refresco**: JWT con expiración de 7 días para renovar tokens de acceso

## Requisitos

### Requisito 1: Autenticación Multi-Tenant

**Historia de Usuario:** Como administrador de gimnasio, quiero que mi personal y clientes se autentiquen de forma segura, para que solo usuarios autorizados accedan a los datos de mi gimnasio.

#### Criterios de Aceptación

1. WHEN un usuario proporciona credenciales válidas (email y contraseña), THE Servicio_Autenticación SHALL retornar un Token_Acceso y un Token_Refresco
2. WHEN un usuario proporciona credenciales inválidas, THE Servicio_Autenticación SHALL rechazar el intento y registrar el evento
3. WHEN un Token_Acceso expira, THE Sistema SHALL rechazar requests con ese token
4. WHEN un usuario proporciona un Token_Refresco válido, THE Servicio_Autenticación SHALL generar un nuevo Token_Acceso
5. THE Servicio_Autenticación SHALL encriptar contraseñas usando bcrypt con 12 salt rounds
6. WHEN un usuario se registra, THE Servicio_Autenticación SHALL validar que el gym_id proporcionado existe
7. THE Token_Acceso SHALL incluir userId, gymId, role y timestamp de expiración

### Requisito 2: Aislamiento de Datos Multi-Tenant

**Historia de Usuario:** Como administrador de gimnasio, quiero que los datos de mi gimnasio estén completamente aislados de otros gimnasios, para garantizar privacidad y seguridad.

#### Criterios de Aceptación

1. WHEN el Sistema ejecuta una consulta de base de datos, THE Sistema SHALL incluir filtro por gym_id
2. WHEN un usuario intenta acceder a datos de otro gimnasio, THE Sistema SHALL retornar error 403 Forbidden
3. FOR ALL tablas principales, THE Sistema SHALL incluir columna gym_id como clave foránea
4. WHEN el Sistema crea índices de base de datos, THE Sistema SHALL incluir gym_id como primera columna en índices compuestos
5. THE Sistema SHALL registrar en logs de auditoría todos los intentos de acceso cross-tenant

### Requisito 3: Gestión de Clientes

**Historia de Usuario:** Como recepcionista, quiero registrar y gestionar información de clientes, para mantener datos actualizados y completos.

#### Criterios de Aceptación

1. WHEN se crea un cliente, THE Servicio_Clientes SHALL validar que email sea único dentro del gym_id
2. WHEN se registra peso y altura, THE Servicio_Clientes SHALL calcular IMC automáticamente usando la fórmula peso / (altura²)
3. WHEN se actualiza peso o altura, THE Servicio_Clientes SHALL recalcular IMC
4. THE Servicio_Clientes SHALL validar que peso sea mayor que 0 y menor que 500 kg
5. THE Servicio_Clientes SHALL validar que altura sea mayor que 0 y menor que 300 cm
6. THE Servicio_Clientes SHALL validar que edad del cliente sea mayor o igual a 16 años
7. WHEN se suspende un cliente, THE Servicio_Clientes SHALL cambiar status a suspended y registrar razón
8. WHEN se lista clientes, THE Servicio_Clientes SHALL implementar paginación con límite configurable

### Requisito 4: Seguimiento de Progreso Físico

**Historia de Usuario:** Como cliente, quiero registrar mi progreso físico con medidas y fotos, para visualizar mi evolución en el tiempo.

#### Criterios de Aceptación

1. WHEN un cliente registra progreso físico, THE Servicio_Clientes SHALL almacenar peso, porcentaje de grasa corporal, medidas y fecha
2. WHEN un cliente sube una foto de progreso, THE Servicio_Clientes SHALL almacenar la imagen en S3 con ruta {gym_id}/photos/{client_id}/{timestamp}
3. WHEN se consulta historial de progreso, THE Servicio_Clientes SHALL retornar registros ordenados por fecha descendente
4. THE Servicio_Clientes SHALL comprimir imágenes a máximo 2MB antes de subir a S3
5. WHEN un cliente alcanza un hito de progreso, THE Servicio_Notificaciones SHALL enviar notificación de felicitación


### Requisito 5: Control de Membresías

**Historia de Usuario:** Como recepcionista, quiero gestionar membresías de clientes con control de vencimientos, para mantener suscripciones activas y detectar vencimientos.

#### Criterios de Aceptación

1. WHEN se crea una membresía, THE Servicio_Membresías SHALL validar que end_date sea posterior a start_date
2. WHEN se crea una membresía, THE Servicio_Membresías SHALL validar que no exista superposición con membresías activas del mismo cliente
3. WHEN una membresía alcanza su fecha de vencimiento, THE Servicio_Membresías SHALL actualizar status a expired
4. WHEN se consultan membresías activas, THE Servicio_Membresías SHALL retornar solo membresías con status active y end_date mayor o igual a hoy
5. WHEN se consultan membresías por vencer, THE Servicio_Membresías SHALL retornar membresías con end_date dentro del rango de días especificado
6. THE Servicio_Membresías SHALL validar que precio sea mayor que 0
7. WHEN se renueva una membresía, THE Servicio_Membresías SHALL crear nueva membresía con start_date igual a end_date de la anterior más un día

### Requisito 6: Alertas Automáticas de Vencimiento

**Historia de Usuario:** Como administrador de gimnasio, quiero que el sistema envíe alertas automáticas de vencimiento de membresías, para mejorar la tasa de renovación.

#### Criterios de Aceptación

1. WHEN una membresía está a 3 días de vencer, THE Servicio_Notificaciones SHALL enviar alerta al cliente
2. WHEN una membresía vence el día actual, THE Servicio_Notificaciones SHALL enviar alerta al cliente
3. THE Sistema SHALL ejecutar verificación de vencimientos diariamente a las 00:00 hora del gimnasio
4. WHEN se envía una alerta, THE Servicio_Notificaciones SHALL registrar el envío en historial
5. THE Servicio_Notificaciones SHALL respetar preferencias de notificación del usuario

### Requisito 7: Gestión de Rutinas Manuales

**Historia de Usuario:** Como entrenador, quiero crear rutinas de entrenamiento personalizadas manualmente, para asignarlas a mis clientes.

#### Criterios de Aceptación

1. WHEN se crea una rutina, THE Servicio_Rutinas SHALL validar que contenga al menos un día de entrenamiento
2. WHEN se crea un ejercicio, THE Servicio_Rutinas SHALL validar que sets sea mayor que 0
3. WHEN se crea un ejercicio, THE Servicio_Rutinas SHALL validar que reps sea mayor que 0 o sea un rango válido
4. WHEN se asigna una rutina a un cliente, THE Servicio_Rutinas SHALL validar que el cliente pertenezca al mismo gym_id
5. WHEN se consulta la rutina de un cliente, THE Servicio_Rutinas SHALL retornar la rutina activa asignada o null
6. THE Servicio_Rutinas SHALL validar que durationWeeks esté entre 1 y 52
7. WHEN se sube un video demostrativo, THE Servicio_Rutinas SHALL almacenar en S3 con ruta {gym_id}/videos/{exercise_id}
8. THE Servicio_Rutinas SHALL validar que videos estén en formato MP4 o MOV

### Requisito 8: Generación de Rutinas con IA

**Historia de Usuario:** Como entrenador, quiero generar rutinas personalizadas usando IA, para ahorrar tiempo y crear planes optimizados basados en datos del cliente.

#### Criterios de Aceptación

1. WHEN se solicita generación de rutina con IA, THE Servicio_IA SHALL obtener datos físicos del cliente (edad, peso, altura, objetivo)
2. WHEN se solicita generación de rutina con IA, THE Servicio_IA SHALL obtener lista de equipamiento operacional del gimnasio
3. WHEN se genera una rutina, THE Servicio_IA SHALL considerar lesiones y limitaciones del cliente
4. WHEN se genera una rutina, THE Servicio_IA SHALL incluir solo ejercicios que usen equipamiento disponible en el gimnasio
5. WHEN OpenAI API falla, THE Servicio_IA SHALL reintentar hasta 3 veces con exponential backoff
6. IF OpenAI API falla después de 3 intentos, THEN THE Servicio_IA SHALL retornar error 503 Service Unavailable
7. WHEN se genera una rutina, THE Servicio_IA SHALL validar que la respuesta contenga estructura válida de rutina
8. THE Servicio_IA SHALL marcar rutinas generadas con isAIGenerated igual a true
9. WHEN se ajusta una rutina según feedback, THE Servicio_IA SHALL regenerar considerando preferencias del usuario

### Requisito 9: Gestión de Inventario de Equipamiento

**Historia de Usuario:** Como administrador de gimnasio, quiero gestionar el inventario de máquinas y equipamiento, para controlar disponibilidad y mantenimientos.

#### Criterios de Aceptación

1. WHEN se registra equipamiento, THE Servicio_Inventario SHALL almacenar nombre, marca, categoría, fecha de compra y estado
2. WHEN se programa mantenimiento, THE Servicio_Inventario SHALL calcular next_maintenance como last_maintenance más maintenance_frequency_days
3. WHEN next_maintenance es menor o igual a hoy, THE Servicio_Inventario SHALL actualizar status a maintenance
4. WHEN se registra un mantenimiento, THE Servicio_Inventario SHALL agregar registro al historial con fecha, tipo, descripción y costo
5. WHEN se consulta equipamiento con mantenimiento pendiente, THE Servicio_Inventario SHALL retornar equipamiento con next_maintenance menor o igual a hoy
6. THE Servicio_Inventario SHALL validar que maintenance_frequency_days sea mayor que 0
7. WHEN se actualiza estado a operational después de mantenimiento, THE Servicio_Inventario SHALL actualizar last_maintenance a fecha actual

### Requisito 10: Procesamiento de Pagos con Stripe

**Historia de Usuario:** Como recepcionista, quiero procesar pagos de membresías con tarjeta de crédito, para ofrecer opciones de pago convenientes.

#### Criterios de Aceptación

1. WHEN se crea un intento de pago, THE Servicio_Pagos SHALL crear PaymentIntent en Stripe con monto y metadata
2. WHEN Stripe confirma un pago exitoso, THE Servicio_Pagos SHALL actualizar status del pago a completed
3. WHEN Stripe rechaza un pago, THE Servicio_Pagos SHALL actualizar status del pago a failed y retornar mensaje descriptivo
4. WHEN se recibe webhook de Stripe, THE Servicio_Pagos SHALL validar firma del webhook
5. WHEN un pago se completa, THE Servicio_Membresías SHALL activar la membresía asociada
6. THE Servicio_Pagos SHALL almacenar stripe_payment_intent_id para referencia
7. THE Servicio_Pagos SHALL validar que amount sea mayor que 0

### Requisito 11: Registro de Pagos Alternativos

**Historia de Usuario:** Como recepcionista, quiero registrar pagos en efectivo y SINPE móvil, para soportar métodos de pago locales de Costa Rica.

#### Criterios de Aceptación

1. WHEN se registra un pago SINPE móvil, THE Servicio_Pagos SHALL almacenar número de referencia SINPE
2. WHEN se registra un pago en efectivo, THE Servicio_Pagos SHALL marcar método como cash y status como completed
3. WHEN se consulta historial de pagos, THE Servicio_Pagos SHALL incluir todos los métodos de pago
4. THE Servicio_Pagos SHALL validar que currency sea un código ISO válido
5. WHEN se registra un pago manual, THE Servicio_Pagos SHALL activar membresía inmediatamente

### Requisito 12: Sistema de Promociones

**Historia de Usuario:** Como administrador de gimnasio, quiero crear promociones y descuentos, para atraer nuevos clientes y fomentar renovaciones.

#### Criterios de Aceptación

1. WHEN se crea una promoción, THE Servicio_Promociones SHALL validar que código sea único dentro del gym_id
2. WHEN se crea una promoción, THE Servicio_Promociones SHALL validar que end_date sea posterior a start_date
3. WHEN discount_type es percentage, THE Servicio_Promociones SHALL validar que discount_value sea menor o igual a 100
4. WHEN discount_type es fixed_amount, THE Servicio_Promociones SHALL validar que discount_value sea mayor que 0
5. WHEN se aplica una promoción, THE Servicio_Promociones SHALL validar que la fecha actual esté entre start_date y end_date
6. WHEN se aplica una promoción, THE Servicio_Promociones SHALL validar que current_uses sea menor que max_uses
7. WHEN se aplica una promoción, THE Servicio_Promociones SHALL incrementar current_uses
8. WHEN se calcula precio final, THE Servicio_Promociones SHALL garantizar que el resultado sea mayor o igual a 0
9. WHEN se aplica descuento porcentual, THE Servicio_Promociones SHALL calcular descuento como original_price multiplicado por (discount_value / 100)

### Requisito 13: Dashboard de Estadísticas

**Historia de Usuario:** Como administrador de gimnasio, quiero visualizar estadísticas clave del negocio, para tomar decisiones informadas.

#### Criterios de Aceptación

1. WHEN se consultan estadísticas del dashboard, THE Servicio_Estadísticas SHALL calcular número de clientes activos
2. WHEN se consultan estadísticas del dashboard, THE Servicio_Estadísticas SHALL calcular ingresos del mes actual
3. WHEN se consultan estadísticas del dashboard, THE Servicio_Estadísticas SHALL calcular tasa de retención
4. WHEN se consultan estadísticas del dashboard, THE Servicio_Estadísticas SHALL calcular número de equipamiento operacional
5. THE Servicio_Estadísticas SHALL cachear resultados por 5 minutos en Redis
6. WHEN se crea o actualiza una membresía, THE Sistema SHALL invalidar cache de estadísticas
7. WHEN se crea o actualiza un pago, THE Sistema SHALL invalidar cache de estadísticas
8. WHEN se consulta reporte de ingresos, THE Servicio_Estadísticas SHALL agrupar por tipo de membresía y mes

### Requisito 14: Notificaciones Push

**Historia de Usuario:** Como cliente, quiero recibir notificaciones push en mi móvil, para estar informado sobre vencimientos y recordatorios.

#### Criterios de Aceptación

1. WHEN se envía una notificación push, THE Servicio_Notificaciones SHALL incluir título, cuerpo y prioridad
2. WHEN un usuario actualiza preferencias de notificación, THE Servicio_Notificaciones SHALL respetar esas preferencias
3. WHEN se envía notificación masiva, THE Servicio_Notificaciones SHALL procesar envíos en lotes
4. THE Servicio_Notificaciones SHALL registrar historial de notificaciones enviadas
5. WHEN se envía recordatorio de entrenamiento, THE Servicio_Notificaciones SHALL incluir datos de la rutina asignada

### Requisito 15: Control de Acceso Basado en Roles

**Historia de Usuario:** Como administrador de gimnasio, quiero controlar qué acciones puede realizar cada tipo de usuario, para mantener seguridad y organización.

#### Criterios de Aceptación

1. WHEN un usuario con rol CLIENT intenta acceder a datos de otro cliente, THE Sistema SHALL denegar acceso
2. WHEN un usuario con rol TRAINER intenta modificar configuración del gimnasio, THE Sistema SHALL denegar acceso
3. WHEN un usuario con rol RECEPTIONIST intenta generar rutinas con IA, THE Sistema SHALL denegar acceso
4. WHEN un usuario con rol GYM_ADMIN accede a recursos de su gimnasio, THE Sistema SHALL permitir acceso completo
5. WHEN un usuario con rol SUPER_ADMIN accede a cualquier gimnasio, THE Sistema SHALL permitir acceso
6. THE Sistema SHALL validar permisos en cada request usando información del Token_Acceso


### Requisito 16: Validación de Datos de Entrada

**Historia de Usuario:** Como desarrollador, quiero que el sistema valide todos los datos de entrada, para prevenir errores y ataques de seguridad.

#### Criterios de Aceptación

1. THE Sistema SHALL validar tipos de datos usando class-validator en todos los DTOs
2. THE Sistema SHALL sanitizar inputs para prevenir inyección SQL
3. WHEN se recibe un request con datos inválidos, THE Sistema SHALL retornar error 400 Bad Request con detalles de validación
4. THE Sistema SHALL validar rangos numéricos según reglas de negocio
5. THE Sistema SHALL validar formatos de email, teléfono y fechas
6. THE Sistema SHALL rechazar requests con campos requeridos faltantes

### Requisito 17: Manejo de Errores de Servicios Externos

**Historia de Usuario:** Como usuario del sistema, quiero que el sistema maneje errores de servicios externos de forma elegante, para tener una experiencia confiable.

#### Criterios de Aceptación

1. WHEN Stripe API falla, THE Servicio_Pagos SHALL retornar mensaje descriptivo al usuario
2. WHEN S3 falla al subir archivo, THE Sistema SHALL reintentar 2 veces antes de fallar
3. WHEN OpenAI API no responde en 30 segundos, THE Servicio_IA SHALL cancelar request y retornar timeout
4. WHEN un servicio externo falla, THE Sistema SHALL registrar error con detalles en logs
5. WHEN S3 falla, THE Sistema SHALL permitir re-upload posterior del archivo

### Requisito 18: Optimización de Rendimiento

**Historia de Usuario:** Como usuario del sistema, quiero que las operaciones sean rápidas, para tener una experiencia fluida.

#### Criterios de Aceptación

1. WHEN se consultan estadísticas, THE Sistema SHALL usar cache de Redis con TTL de 5 minutos
2. WHEN se consultan listas de datos, THE Sistema SHALL implementar paginación con límite máximo de 100 registros
3. WHEN se ejecutan queries de base de datos, THE Sistema SHALL usar índices compuestos con gym_id
4. THE Sistema SHALL usar connection pooling con máximo 20 conexiones a PostgreSQL
5. WHEN se sirven videos de ejercicios, THE Sistema SHALL usar CloudFront CDN
6. WHEN se suben imágenes, THE Sistema SHALL comprimir a máximo 2MB antes de almacenar

### Requisito 19: Auditoría y Logging

**Historia de Usuario:** Como administrador del sistema, quiero registrar eventos críticos, para auditoría y resolución de problemas.

#### Criterios de Aceptación

1. WHEN un usuario inicia sesión, THE Sistema SHALL registrar evento con userId, gymId, timestamp e IP
2. WHEN un usuario falla al autenticarse, THE Sistema SHALL registrar intento fallido
3. WHEN se crea o cancela una membresía, THE Sistema SHALL registrar evento en logs de auditoría
4. WHEN se procesa un pago, THE Sistema SHALL registrar transacción con monto y método
5. WHEN se detecta intento de acceso cross-tenant, THE Sistema SHALL registrar evento de seguridad
6. THE Sistema SHALL excluir información sensible (contraseñas, números de tarjeta) de logs

### Requisito 20: Seguridad de Datos Sensibles

**Historia de Usuario:** Como cliente, quiero que mis datos personales y financieros estén protegidos, para garantizar mi privacidad.

#### Criterios de Aceptación

1. THE Sistema SHALL usar HTTPS/TLS 1.3 para todas las comunicaciones
2. THE Sistema SHALL almacenar contraseñas usando bcrypt con 12 salt rounds
3. THE Sistema SHALL usar Stripe Elements para captura de tarjetas sin almacenar datos en base de datos propia
4. WHEN se almacenan archivos en S3, THE Sistema SHALL usar encriptación AES-256 en reposo
5. WHEN se generan URLs de S3, THE Sistema SHALL usar signed URLs con expiración de 1 hora
6. THE Sistema SHALL firmar tokens JWT usando algoritmo RS256 asimétrico
7. THE Sistema SHALL configurar CORS con whitelist de dominios permitidos

### Requisito 21: Rate Limiting

**Historia de Usuario:** Como administrador del sistema, quiero limitar la tasa de requests, para prevenir abuso y garantizar disponibilidad.

#### Criterios de Aceptación

1. WHEN un usuario autenticado hace requests, THE Sistema SHALL limitar a 1000 requests por minuto
2. WHEN se solicita generación de rutina con IA, THE Sistema SHALL limitar a 10 requests por hora por gimnasio
3. WHEN se suben archivos, THE Sistema SHALL limitar a 50 uploads por hora por usuario
4. WHEN se excede el límite, THE Sistema SHALL retornar error 429 Too Many Requests
5. THE Sistema SHALL usar Redis para tracking de rate limits

### Requisito 22: Recuperación ante Fallos

**Historia de Usuario:** Como usuario del sistema, quiero que el sistema se recupere automáticamente de fallos temporales, para minimizar interrupciones.

#### Criterios de Aceptación

1. WHEN el pool de conexiones de PostgreSQL se agota, THE Sistema SHALL encolar requests con timeout de 5 segundos
2. WHEN una conexión de base de datos falla, THE Sistema SHALL liberar la conexión automáticamente
3. IF timeout de conexión se excede, THEN THE Sistema SHALL retornar error 503 Service Unavailable
4. WHEN un servicio externo falla temporalmente, THE Sistema SHALL implementar circuit breaker
5. THE Sistema SHALL implementar health checks en endpoint /health

### Requisito 23: Consistencia de Datos en Transacciones

**Historia de Usuario:** Como administrador de gimnasio, quiero que las operaciones críticas sean atómicas, para evitar inconsistencias de datos.

#### Criterios de Aceptación

1. WHEN se procesa un pago y se activa membresía, THE Sistema SHALL usar transacción de base de datos atómica
2. IF un pago falla, THEN THE Sistema SHALL revertir cambios en membresía
3. WHEN se crea cliente y membresía juntos, THE Sistema SHALL usar transacción atómica
4. IF cualquier paso de transacción falla, THEN THE Sistema SHALL revertir todos los cambios
5. THE Sistema SHALL usar nivel de aislamiento READ COMMITTED en PostgreSQL

### Requisito 24: Exportación de Datos

**Historia de Usuario:** Como administrador de gimnasio, quiero exportar datos del sistema, para análisis externo y cumplimiento regulatorio.

#### Criterios de Aceptación

1. WHEN se solicita reporte de clientes, THE Sistema SHALL generar archivo CSV con datos solicitados
2. WHEN se solicita reporte de ingresos, THE Sistema SHALL generar PDF con gráficas y tablas
3. WHEN se exportan datos, THE Sistema SHALL incluir solo datos del gym_id del usuario
4. THE Sistema SHALL validar permisos antes de permitir exportación
5. WHEN se genera reporte, THE Sistema SHALL incluir timestamp de generación

### Requisito 25: Configuración Multi-Timezone

**Historia de Usuario:** Como administrador de gimnasio, quiero que el sistema respete mi zona horaria, para que fechas y alertas sean correctas.

#### Criterios de Aceptación

1. WHEN se registra un gimnasio, THE Sistema SHALL almacenar timezone del gimnasio
2. WHEN se ejecutan cron jobs de alertas, THE Sistema SHALL usar timezone del gimnasio para calcular "hoy"
3. WHEN se muestran fechas en interfaz, THE Sistema SHALL convertir a timezone del gimnasio
4. THE Sistema SHALL almacenar timestamps en UTC en base de datos
5. WHEN se calculan vencimientos, THE Sistema SHALL considerar timezone del gimnasio

### Requisito 26: Validación de Rutinas Generadas por IA

**Historia de Usuario:** Como entrenador, quiero que las rutinas generadas por IA sean validadas, para garantizar calidad y seguridad.

#### Criterios de Aceptación

1. WHEN se genera una rutina con IA, THE Servicio_IA SHALL validar que contenga estructura JSON válida
2. WHEN se genera una rutina con IA, THE Servicio_IA SHALL validar que todos los ejercicios tengan sets y reps
3. WHEN se genera una rutina con IA, THE Servicio_IA SHALL validar que equipamiento usado exista en inventario del gimnasio
4. IF validación falla, THEN THE Servicio_IA SHALL retornar error descriptivo
5. WHEN se genera una rutina, THE Servicio_IA SHALL incluir rationale explicando decisiones

### Requisito 27: Gestión de Sesiones

**Historia de Usuario:** Como usuario del sistema, quiero que mis sesiones sean seguras y manejadas correctamente, para proteger mi cuenta.

#### Criterios de Aceptación

1. WHEN un usuario hace logout, THE Servicio_Autenticación SHALL invalidar Token_Refresco
2. THE Sistema SHALL almacenar tokens en httpOnly cookies para web
3. THE Sistema SHALL almacenar tokens en secure storage para móvil
4. WHEN un Token_Refresco se usa, THE Servicio_Autenticación SHALL rotar el token
5. THE Token_Acceso SHALL expirar después de 15 minutos
6. THE Token_Refresco SHALL expirar después de 7 días

### Requisito 28: Búsqueda y Filtrado

**Historia de Usuario:** Como recepcionista, quiero buscar y filtrar clientes rápidamente, para encontrar información eficientemente.

#### Criterios de Aceptación

1. WHEN se buscan clientes por nombre, THE Servicio_Clientes SHALL soportar búsqueda parcial case-insensitive
2. WHEN se filtran clientes por status, THE Servicio_Clientes SHALL retornar solo clientes con ese status
3. WHEN se filtran membresías por tipo, THE Servicio_Membresías SHALL retornar solo membresías de ese tipo
4. THE Sistema SHALL implementar índices de base de datos para campos de búsqueda frecuente
5. WHEN se aplican múltiples filtros, THE Sistema SHALL combinar condiciones con operador AND

### Requisito 29: Versionado de API

**Historia de Usuario:** Como desarrollador de aplicaciones cliente, quiero que la API tenga versionado, para mantener compatibilidad.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir versión en rutas de API (ejemplo: /api/v1/clients)
2. WHEN se introduce cambio incompatible, THE Sistema SHALL incrementar versión mayor
3. THE Sistema SHALL mantener versión anterior por al menos 6 meses
4. WHEN se depreca un endpoint, THE Sistema SHALL incluir header de advertencia
5. THE Sistema SHALL documentar cambios entre versiones

### Requisito 30: Monitoreo y Métricas

**Historia de Usuario:** Como administrador del sistema, quiero monitorear salud y rendimiento, para detectar problemas proactivamente.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer endpoint /health con status de servicios críticos
2. THE Sistema SHALL exponer métricas de Prometheus en endpoint /metrics
3. WHEN ocurre un error no manejado, THE Sistema SHALL reportar a Sentry
4. THE Sistema SHALL registrar tiempo de respuesta de cada endpoint
5. THE Sistema SHALL registrar tasa de errores por endpoint
6. WHEN un servicio externo falla, THE Sistema SHALL incrementar contador de errores

## Resumen de Cobertura

Este documento de requisitos cubre los siguientes aspectos del sistema FitMaster:

- **Autenticación y Seguridad**: Requisitos 1, 2, 15, 16, 20, 21, 27
- **Gestión de Clientes**: Requisitos 3, 4, 28
- **Membresías y Pagos**: Requisitos 5, 6, 10, 11, 23
- **Rutinas y IA**: Requisitos 7, 8, 26
- **Inventario**: Requisito 9
- **Promociones**: Requisito 12
- **Estadísticas y Reportes**: Requisitos 13, 24
- **Notificaciones**: Requisitos 6, 14
- **Rendimiento y Escalabilidad**: Requisitos 18, 22
- **Operaciones y Monitoreo**: Requisitos 19, 29, 30
- **Servicios Externos**: Requisitos 17, 25

Todos los requisitos siguen el estándar EARS y las reglas de calidad INCOSE, garantizando claridad, testabilidad y trazabilidad.
