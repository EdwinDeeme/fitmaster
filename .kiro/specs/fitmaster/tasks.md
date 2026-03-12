# Plan de Implementación: FitMaster

## Visión General

Este plan de implementación sigue una estrategia de desarrollo en 3 fases para el sistema FitMaster, un SaaS multi-tenant de gestión de gimnasios con IA integrada. Cada fase entrega valor incremental y construye sobre la anterior.

**Stack Tecnológico**: 
- Backend: NestJS + TypeScript + PostgreSQL + Redis
- Web: Next.js + React + TypeScript + Tailwind CSS
- Mobile: React Native + TypeScript
- Infraestructura: DigitalOcean + AWS S3 + Stripe + OpenAI

**Estimación Total**: 18-24 semanas

---

## FASE 1: MVP - Sistema Básico Funcional (8-10 semanas)

### Objetivo
Sistema funcional básico sin IA, con autenticación multi-tenant, gestión de clientes, membresías, rutinas manuales, dashboard web y app móvil básica.

## Tareas

- [ ] 1. Setup de Proyecto y Arquitectura Base
  - [ ] 1.1 Configurar monorepo con estructura backend/web/mobile
    - Crear estructura de carpetas con NestJS para backend
    - Configurar Next.js para dashboard web
    - Configurar React Native para app móvil
    - Setup de TypeScript en todos los proyectos
    - _Requisitos: Todos (infraestructura base)_

  - [ ] 1.2 Configurar PostgreSQL y esquema de base de datos multi-tenant
    - Crear tablas: gyms, users, clients, memberships, payments, routines, exercises
    - Implementar índices compuestos con gym_id como primera columna
    - Agregar constraints y validaciones a nivel de BD
    - _Requisitos: 2.3, 2.4_

  - [ ] 1.3 Configurar Redis para caching
    - Setup de conexión con ioredis
    - Configurar estrategia de cache con TTL
    - _Requisitos: 18.1_

  - [ ] 1.4 Setup de herramientas de desarrollo
    - Configurar ESLint, Prettier, Husky
    - Setup de Jest para testing
    - Configurar GitHub Actions para CI/CD
    - _Requisitos: Calidad de código_


- [ ] 2. Implementar Autenticación Multi-Tenant
  - [ ] 2.1 Crear módulo de autenticación con JWT
    - Implementar AuthService con registro, login, logout
    - Configurar JWT con access tokens (15 min) y refresh tokens (7 días)
    - Implementar bcrypt para hashing de contraseñas (12 salt rounds)
    - _Requisitos: 1.1, 1.4, 1.5, 1.6, 1.7_

  - [ ] 2.2 Implementar guards y middleware de autorización
    - Crear JwtAuthGuard para validar tokens
    - Crear RolesGuard para control de acceso basado en roles
    - Implementar middleware de validación de gym_id
    - _Requisitos: 2.1, 2.2, 15.1, 15.2, 15.3, 15.4_

  - [ ]* 2.3 Escribir tests de autenticación
    - Test de login exitoso y fallido
    - Test de validación de tokens expirados
    - Test de aislamiento multi-tenant en autenticación
    - _Requisitos: 1.1, 1.2, 1.3_

  - [ ] 2.4 Implementar rotación de refresh tokens
    - Lógica de rotación en cada uso
    - Invalidación de tokens en logout
    - _Requisitos: 27.4, 27.1_

- [ ] 3. Módulo de Gestión de Clientes
  - [ ] 3.1 Crear ClientService con operaciones CRUD
    - Implementar createClient con validación de email único por gym_id
    - Implementar updateClient, getClient, listClients con paginación
    - Implementar suspendClient y reactivateClient
    - _Requisitos: 3.1, 3.7, 3.8_

  - [ ] 3.2 Implementar cálculo automático de IMC
    - Función calculateBMI(weight, height)
    - Validación de rangos: peso (0-500kg), altura (0-300cm)
    - Recálculo automático en updates
    - _Requisitos: 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.3 Implementar validaciones de datos de cliente
    - Validación de edad >= 16 años
    - Validación de formato de email y teléfono
    - DTOs con class-validator
    - _Requisitos: 3.6, 16.1, 16.5_

  - [ ]* 3.4 Escribir property test para cálculo de IMC
    - **Property 3: BMI Calculation Correctness**
    - **Valida: Requisitos 3.2, 3.3**
    - Test con rangos válidos de peso y altura
    - Verificar que IMC esté en rango razonable (10-60)

  - [ ]* 3.5 Escribir tests unitarios de ClientService
    - Test de aislamiento por gym_id
    - Test de validación de email único
    - Test de suspensión de clientes

- [ ] 4. Módulo de Seguimiento de Progreso Físico
  - [ ] 4.1 Implementar registro de progreso físico
    - Crear PhysicalProgressService
    - Método addPhysicalProgress con validaciones
    - Método getProgressHistory con ordenamiento por fecha
    - _Requisitos: 4.1, 4.3_

  - [ ] 4.2 Integrar Amazon S3 para fotos de progreso
    - Configurar AWS SDK para S3
    - Implementar uploadProgressPhoto con compresión (max 2MB)
    - Generar signed URLs con expiración de 1 hora
    - Estructura de carpetas: {gym_id}/photos/{client_id}/{timestamp}
    - _Requisitos: 4.2, 4.4, 18.6, 20.4, 20.5_

  - [ ]* 4.3 Escribir tests de integración con S3
    - Test de upload exitoso
    - Test de compresión de imágenes
    - Test de generación de signed URLs

- [ ] 5. Checkpoint - Verificar Autenticación y Clientes
  - Asegurar que todos los tests pasen
  - Verificar aislamiento multi-tenant en queries
  - Preguntar al usuario si hay dudas o ajustes necesarios


- [ ] 6. Módulo de Control de Membresías
  - [ ] 6.1 Crear MembershipService con operaciones básicas
    - Implementar createMembership con validación de fechas
    - Implementar renewMembership y cancelMembership
    - Implementar getMembership, getClientMemberships
    - _Requisitos: 5.1, 5.6, 5.7_

  - [ ] 6.2 Implementar validación de superposición de membresías
    - Función validateNoOverlap para detectar membresías activas superpuestas
    - Retornar error 409 Conflict con detalles
    - _Requisitos: 5.2_

  - [ ] 6.3 Implementar queries de membresías por estado
    - getActiveMemberships: status='active' y end_date >= hoy
    - getExpiringMemberships: end_date dentro de rango de días
    - getExpiredMemberships: end_date < hoy
    - _Requisitos: 5.4, 5.5_

  - [ ] 6.4 Implementar actualización automática de estados
    - Lógica para cambiar status a 'expired' cuando end_date < hoy
    - Preparar para cron job (Fase 3)
    - _Requisitos: 5.3_

  - [ ]* 6.5 Escribir property test para consistencia de estados
    - **Property 2: Membership Status Consistency**
    - **Valida: Requisito 5.3**
    - Verificar que status sea consistente con end_date

  - [ ]* 6.6 Escribir tests unitarios de MembershipService
    - Test de detección de superposición
    - Test de cálculo de membresías por vencer
    - Test de renovación de membresías

- [ ] 7. Módulo de Pagos Básico (Solo Efectivo)
  - [ ] 7.1 Crear PaymentService con registro manual de pagos
    - Implementar recordCashPayment
    - Implementar getPayment, getClientPayments, getPaymentHistory
    - Validación de amount > 0
    - _Requisitos: 11.2, 11.3, 11.4, 11.5_

  - [ ] 7.2 Implementar activación de membresía al registrar pago
    - Transacción atómica: crear pago + activar membresía
    - Rollback si falla cualquier paso
    - _Requisitos: 23.1, 23.2, 23.4_

  - [ ]* 7.3 Escribir tests de transacciones atómicas
    - Test de rollback cuando falla activación
    - Test de consistencia de datos

- [ ] 8. Módulo de Rutinas Manuales
  - [ ] 8.1 Crear RoutineService con operaciones CRUD
    - Implementar createRoutine con validaciones
    - Implementar updateRoutine, deleteRoutine
    - Implementar getRoutine, listRoutines con filtros
    - _Requisitos: 7.1, 7.6_

  - [ ] 8.2 Implementar validaciones de rutinas
    - Validar al menos 1 día de entrenamiento
    - Validar sets > 0 y reps > 0 para cada ejercicio
    - Validar durationWeeks entre 1 y 52
    - _Requisitos: 7.2, 7.3_

  - [ ] 8.3 Implementar asignación de rutinas a clientes
    - Método assignRoutineToClient con validación de gym_id
    - Método unassignRoutine
    - Método getClientRoutine (retorna rutina activa o null)
    - _Requisitos: 7.4, 7.5_

  - [ ] 8.4 Integrar S3 para videos demostrativos
    - Upload de videos en formato MP4/MOV
    - Estructura: {gym_id}/videos/{exercise_id}
    - Validación de formato
    - _Requisitos: 7.7, 7.8_

  - [ ]* 8.5 Escribir tests unitarios de RoutineService
    - Test de validación de estructura de rutina
    - Test de asignación con gym_id correcto
    - Test de validación de ejercicios

- [ ] 9. Checkpoint - Verificar Membresías y Rutinas
  - Asegurar que todos los tests pasen
  - Verificar flujo completo: cliente → membresía → pago → rutina
  - Preguntar al usuario si hay dudas o ajustes necesarios


- [ ] 10. Dashboard Web - Setup y Autenticación
  - [ ] 10.1 Configurar Next.js con estructura de páginas
    - Setup de routing con App Router
    - Configurar Tailwind CSS y shadcn/ui
    - Crear layout base con navegación
    - _Requisitos: UI base_

  - [ ] 10.2 Implementar páginas de autenticación
    - Página de login con formulario
    - Manejo de tokens en httpOnly cookies
    - Redirección según rol de usuario
    - _Requisitos: 1.1, 27.2_

  - [ ] 10.3 Configurar cliente API con Axios/TanStack Query
    - Setup de interceptores para tokens
    - Manejo de refresh tokens automático
    - Manejo de errores global
    - _Requisitos: 1.4_

- [ ] 11. Dashboard Web - Módulo de Clientes
  - [ ] 11.1 Crear página de lista de clientes
    - Tabla con paginación
    - Búsqueda por nombre (case-insensitive)
    - Filtros por status
    - _Requisitos: 3.8, 28.1, 28.2_

  - [ ] 11.2 Crear formulario de registro de cliente
    - Validación con React Hook Form + Zod
    - Campos: datos personales, físicos, objetivos
    - Cálculo automático de IMC en UI
    - _Requisitos: 3.1, 3.2_

  - [ ] 11.3 Crear página de perfil de cliente
    - Visualización de datos completos
    - Edición de información
    - Historial de progreso físico
    - Galería de fotos de progreso
    - _Requisitos: 4.1, 4.2, 4.3_

- [ ] 12. Dashboard Web - Módulo de Membresías
  - [ ] 12.1 Crear página de gestión de membresías
    - Lista de membresías activas, por vencer, vencidas
    - Indicadores visuales de estado
    - Filtros por tipo y estado
    - _Requisitos: 5.4, 5.5_

  - [ ] 12.2 Crear formulario de creación de membresía
    - Selección de cliente
    - Selección de tipo (mensual, trimestral, anual)
    - Cálculo automático de end_date
    - Validación de superposición
    - _Requisitos: 5.1, 5.2_

  - [ ] 12.3 Implementar renovación rápida de membresía
    - Botón de renovación con un clic
    - Confirmación de datos
    - Registro de pago en efectivo
    - _Requisitos: 5.7_

- [ ] 13. Dashboard Web - Módulo de Rutinas
  - [ ] 13.1 Crear página de biblioteca de rutinas
    - Lista de rutinas con filtros
    - Búsqueda por nombre
    - Filtros por objetivo y dificultad
    - _Requisitos: 7.1_

  - [ ] 13.2 Crear formulario de creación de rutina manual
    - Editor de días de entrenamiento
    - Agregar/eliminar ejercicios
    - Configurar sets, reps, descanso
    - Upload de videos demostrativos
    - _Requisitos: 7.1, 7.2, 7.3, 7.7_

  - [ ] 13.3 Implementar asignación de rutinas a clientes
    - Selección de cliente
    - Preview de rutina
    - Confirmación de asignación
    - _Requisitos: 7.4_

- [ ] 14. Dashboard Web - Dashboard Principal
  - [ ] 14.1 Crear página de dashboard con estadísticas básicas
    - Tarjetas con métricas clave: clientes activos, membresías activas, ingresos del mes
    - Gráfica de nuevos clientes por mes
    - Lista de membresías por vencer
    - _Requisitos: 13.1, 13.2_

  - [ ] 14.2 Implementar cache de estadísticas
    - Usar TanStack Query con staleTime de 5 minutos
    - Invalidación manual al crear/actualizar datos
    - _Requisitos: 18.1_

- [ ] 15. Checkpoint - Verificar Dashboard Web
  - Asegurar que todas las páginas funcionen correctamente
  - Verificar flujos completos en UI
  - Preguntar al usuario si hay dudas o ajustes necesarios


- [ ] 16. App Móvil - Setup y Autenticación
  - [ ] 16.1 Configurar React Native con estructura base
    - Setup de React Navigation
    - Configurar React Native Paper o NativeBase
    - Setup de async-storage para tokens
    - _Requisitos: 27.3_

  - [ ] 16.2 Implementar pantallas de autenticación
    - Pantalla de login
    - Almacenamiento seguro de tokens
    - Navegación según autenticación
    - _Requisitos: 1.1_

  - [ ] 16.3 Configurar cliente API
    - Setup de Axios con interceptores
    - Manejo de refresh tokens
    - Manejo de errores
    - _Requisitos: 1.4_

- [ ] 17. App Móvil - Perfil de Cliente
  - [ ] 17.1 Crear pantalla de perfil
    - Visualización de datos personales
    - Visualización de datos físicos actuales
    - Visualización de objetivos
    - _Requisitos: 3.1_

  - [ ] 17.2 Crear pantalla de registro de progreso
    - Formulario para peso, medidas, % grasa
    - Selector de fecha
    - Botón para tomar/seleccionar foto
    - _Requisitos: 4.1, 4.2_

  - [ ] 17.3 Implementar captura y upload de fotos
    - Integración con react-native-image-picker
    - Compresión de imagen antes de upload
    - Upload a S3 con indicador de progreso
    - _Requisitos: 4.2, 4.4_

  - [ ] 17.4 Crear pantalla de historial de progreso
    - Lista de registros de progreso ordenados por fecha
    - Gráficas de evolución de peso
    - Galería de fotos de progreso
    - _Requisitos: 4.3_

- [ ] 18. App Móvil - Rutina de Entrenamiento
  - [ ] 18.1 Crear pantalla de visualización de rutina
    - Mostrar rutina asignada por días
    - Lista de ejercicios con sets, reps, descanso
    - Indicador si no hay rutina asignada
    - _Requisitos: 7.5_

  - [ ] 18.2 Implementar reproductor de videos demostrativos
    - Integración con react-native-video
    - Reproducción de videos desde S3
    - Controles de play/pause
    - _Requisitos: 7.7_

- [ ] 19. App Móvil - Membresía
  - [ ] 19.1 Crear pantalla de estado de membresía
    - Visualización de tipo de membresía
    - Fecha de inicio y vencimiento
    - Días restantes
    - Indicador visual de estado
    - _Requisitos: 5.4_

- [ ] 20. Integración y Testing de Fase 1
  - [ ] 20.1 Implementar validación de entrada en todos los endpoints
    - DTOs con class-validator
    - Sanitización de inputs
    - Manejo de errores 400 Bad Request
    - _Requisitos: 16.1, 16.2, 16.3_

  - [ ] 20.2 Implementar rate limiting
    - Configurar @nestjs/throttler
    - Límites: 1000 req/min para usuarios autenticados
    - Límites: 50 uploads/hora por usuario
    - _Requisitos: 21.1, 21.3, 21.4_

  - [ ] 20.3 Implementar logging y auditoría
    - Configurar Winston para logs estructurados
    - Registrar eventos de autenticación
    - Registrar cambios en membresías y pagos
    - Excluir información sensible
    - _Requisitos: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

  - [ ] 20.4 Implementar health checks y métricas
    - Endpoint /health con status de servicios
    - Endpoint /metrics para Prometheus
    - _Requisitos: 30.1, 30.2_

  - [ ]* 20.5 Escribir tests de integración end-to-end
    - Test de flujo completo: registro → membresía → pago → rutina
    - Test de aislamiento multi-tenant en flujos completos
    - Test de manejo de errores

  - [ ] 20.6 Configurar deployment en DigitalOcean
    - Setup de Droplet con Docker
    - Configurar PostgreSQL Managed Database
    - Configurar Redis Managed
    - Setup de Nginx como reverse proxy
    - Configurar SSL con Let's Encrypt
    - _Requisitos: Infraestructura_

- [ ] 21. Checkpoint Final de Fase 1
  - Asegurar que todos los tests pasen (cobertura >= 60%)
  - Verificar deployment exitoso
  - Realizar pruebas de usuario en staging
  - Documentar APIs con Swagger
  - Preguntar al usuario si está listo para Fase 2

---

## FASE 2: Integración de IA (4-6 semanas)

### Objetivo
Agregar generación inteligente de rutinas personalizadas usando OpenAI, con gestión de inventario de equipamiento para contexto de IA.

## Tareas

- [ ] 22. Módulo de Inventario de Equipamiento
  - [ ] 22.1 Crear EquipmentService con operaciones CRUD
    - Implementar addEquipment con validaciones
    - Implementar updateEquipment, deleteEquipment
    - Implementar getEquipment, listEquipment con filtros
    - _Requisitos: 9.1_

  - [ ] 22.2 Implementar gestión de estados de equipamiento
    - Estados: operational, maintenance, damaged, out_of_service
    - Filtro por status para obtener equipamiento operacional
    - _Requisitos: 9.1_

  - [ ] 22.3 Implementar registro básico de mantenimientos
    - Método recordMaintenance
    - Método getMaintenanceHistory
    - Almacenar fecha, tipo, descripción, costo
    - _Requisitos: 9.4_

  - [ ]* 22.4 Escribir tests unitarios de EquipmentService
    - Test de filtrado por status
    - Test de registro de mantenimientos

- [ ] 23. Servicio de Generación de Rutinas con IA
  - [ ] 23.1 Configurar integración con OpenAI API
    - Setup de OpenAI SDK
    - Configurar API key en variables de entorno
    - Implementar timeout de 30 segundos
    - _Requisitos: 8.5, 17.3_

  - [ ] 23.2 Diseñar y optimizar prompts para generación de rutinas
    - Prompt que incluya: datos del cliente, objetivo, nivel, equipamiento disponible
    - Prompt que considere lesiones y limitaciones
    - Formato de respuesta estructurado (JSON)
    - _Requisitos: 8.1, 8.2, 8.3, 8.4_

  - [ ] 23.3 Implementar AIRoutineGeneratorService
    - Método generateRoutine que obtiene datos del cliente
    - Obtener lista de equipamiento operacional del gimnasio
    - Construir prompt con contexto completo
    - Llamar a OpenAI API
    - _Requisitos: 8.1, 8.2_

  - [ ] 23.4 Implementar retry logic con exponential backoff
    - Reintentar hasta 3 veces si OpenAI falla
    - Exponential backoff: 1s, 2s, 4s
    - Retornar 503 Service Unavailable después de 3 intentos
    - _Requisitos: 8.5, 8.6_

  - [ ] 23.5 Implementar validación de rutinas generadas
    - Validar estructura JSON de respuesta
    - Validar que todos los ejercicios tengan sets y reps
    - Validar que equipamiento usado exista en inventario
    - Retornar error descriptivo si validación falla
    - _Requisitos: 8.7, 26.1, 26.2, 26.3, 26.4_

  - [ ] 23.6 Implementar ajuste de rutinas según feedback
    - Método adjustRoutine que recibe feedback del usuario
    - Regenerar rutina considerando preferencias
    - _Requisitos: 8.9_

  - [ ]* 23.7 Escribir property test para consistencia rutina-equipamiento
    - **Property 5: Routine-Equipment Consistency**
    - **Valida: Requisitos 8.4, 26.3**
    - Verificar que equipamiento usado esté disponible

  - [ ]* 23.8 Escribir tests de integración con OpenAI (mocked)
    - Test de generación exitosa
    - Test de manejo de errores de API
    - Test de retry logic
    - Test de validación de respuestas

- [ ] 24. Checkpoint - Verificar Generación de IA
  - Asegurar que todos los tests pasen
  - Probar generación de rutinas con diferentes perfiles
  - Verificar costos de API de OpenAI
  - Preguntar al usuario si hay dudas o ajustes necesarios


- [ ] 25. Integrar Generación de IA en RoutineService
  - [ ] 25.1 Agregar método generateRoutineWithAI a RoutineService
    - Recibir parámetros del cliente y preferencias
    - Llamar a AIRoutineGeneratorService
    - Guardar rutina generada con isAIGenerated=true
    - Incluir rationale en metadata
    - _Requisitos: 8.1, 8.8, 26.5_

  - [ ] 25.2 Implementar rate limiting específico para IA
    - Límite: 10 generaciones por hora por gimnasio
    - Retornar 429 Too Many Requests si se excede
    - _Requisitos: 21.2_

  - [ ]* 25.3 Escribir tests de integración de generación completa
    - Test de flujo: cliente → equipamiento → generación → guardado
    - Test de rate limiting

- [ ] 26. Dashboard Web - Módulo de Inventario
  - [ ] 26.1 Crear página de gestión de equipamiento
    - Lista de equipamiento con filtros por categoría y estado
    - Indicadores visuales de estado
    - Búsqueda por nombre
    - _Requisitos: 9.1_

  - [ ] 26.2 Crear formulario de registro de equipamiento
    - Campos: nombre, marca, categoría, fecha de compra, estado
    - Validaciones
    - _Requisitos: 9.1_

  - [ ] 26.3 Crear sección de historial de mantenimientos
    - Lista de mantenimientos por equipo
    - Formulario para registrar nuevo mantenimiento
    - _Requisitos: 9.4_

- [ ] 27. Dashboard Web - Generador de Rutinas con IA
  - [ ] 27.1 Crear página de generación de rutinas con IA
    - Formulario de selección de cliente
    - Configuración de preferencias: días por semana, nivel, objetivo
    - Indicación de lesiones o limitaciones
    - _Requisitos: 8.1, 8.3_

  - [ ] 27.2 Implementar UI de generación y preview
    - Botón de generar con indicador de carga
    - Preview de rutina generada
    - Mostrar rationale de IA
    - Opciones de ajustar o regenerar
    - _Requisitos: 8.9, 26.5_

  - [ ] 27.3 Implementar asignación de rutina generada
    - Botón de confirmar y asignar
    - Guardar rutina en biblioteca
    - Asignar a cliente
    - _Requisitos: 8.1_

- [ ] 28. App Móvil - Visualización de Rutinas IA
  - [ ] 28.1 Actualizar pantalla de rutina para mostrar origen
    - Indicador visual si rutina fue generada por IA
    - Mostrar rationale de IA (por qué se eligieron ejercicios)
    - _Requisitos: 8.8, 26.5_

- [ ] 29. Optimización y Monitoreo de IA
  - [ ] 29.1 Implementar logging de uso de OpenAI
    - Registrar cada llamada con tokens usados
    - Registrar tiempo de respuesta
    - Registrar errores
    - _Requisitos: 19.4_

  - [ ] 29.2 Implementar métricas de costos de IA
    - Contador de generaciones por gimnasio
    - Estimación de costos mensuales
    - Dashboard de uso de IA
    - _Requisitos: 30.4_

  - [ ] 29.3 Configurar alertas de errores de IA
    - Integrar con Sentry para errores de OpenAI
    - Alertas si tasa de error > 10%
    - _Requisitos: 30.3_

- [ ] 30. Testing y Documentación de Fase 2
  - [ ]* 30.1 Escribir tests end-to-end de generación de rutinas
    - Test de flujo completo con IA
    - Test de validación de rutinas generadas
    - Test de ajuste de rutinas

  - [ ] 30.2 Documentar uso de generador de IA
    - Guía de mejores prácticas para prompts
    - Documentación de parámetros
    - Ejemplos de rutinas generadas
    - _Requisitos: Documentación_

  - [ ] 30.3 Optimizar costos de OpenAI
    - Revisar y optimizar prompts para reducir tokens
    - Implementar cache de rutinas similares (opcional)
    - _Requisitos: Optimización_

- [ ] 31. Checkpoint Final de Fase 2
  - Asegurar que todos los tests pasen
  - Verificar generación de rutinas con diferentes perfiles
  - Revisar costos reales de OpenAI
  - Deployment de versión 2
  - Preguntar al usuario si está listo para Fase 3

---

## FASE 3: Funcionalidades Avanzadas (6-8 semanas)

### Objetivo
Completar el sistema con integración de pagos (Stripe + SINPE), promociones, alertas automáticas, notificaciones push, estadísticas avanzadas y gestión completa de inventario.

## Tareas

- [ ] 32. Integración Completa con Stripe
  - [ ] 32.1 Configurar Stripe SDK y webhooks
    - Setup de Stripe SDK en backend
    - Configurar webhook endpoint
    - Validar firma de webhooks
    - _Requisitos: 10.4_

  - [ ] 32.2 Implementar creación de PaymentIntent
    - Método createPaymentIntent en PaymentService
    - Crear PaymentIntent en Stripe con metadata
    - Almacenar payment con status='pending'
    - Retornar client_secret
    - _Requisitos: 10.1, 10.7_

  - [ ] 32.3 Implementar manejo de webhooks de Stripe
    - Escuchar evento payment_intent.succeeded
    - Actualizar payment status a 'completed'
    - Activar membresía asociada
    - Transacción atómica
    - _Requisitos: 10.2, 10.5, 23.1_

  - [ ] 32.4 Implementar manejo de pagos fallidos
    - Escuchar evento payment_intent.payment_failed
    - Actualizar payment status a 'failed'
    - Retornar mensaje descriptivo
    - _Requisitos: 10.3_

  - [ ] 32.5 Implementar procesamiento de reembolsos
    - Método refundPayment
    - Crear refund en Stripe
    - Actualizar payment status a 'refunded'
    - _Requisitos: 10.1_

  - [ ]* 32.6 Escribir property test para activación pago-membresía
    - **Property 4: Payment-Membership Activation**
    - **Valida: Requisitos 10.5, 23.1**
    - Verificar que membresía activa tenga pago completado

  - [ ]* 32.7 Escribir tests de integración con Stripe (mocked)
    - Test de flujo completo de pago
    - Test de webhooks
    - Test de reembolsos

- [ ] 33. Integración con SINPE Móvil
  - [ ] 33.1 Implementar registro de pagos SINPE
    - Método recordSINPEPayment en PaymentService
    - Almacenar número de referencia SINPE
    - Marcar como completado inmediatamente
    - Activar membresía
    - _Requisitos: 11.1, 11.5_

  - [ ] 33.2 Crear UI para registro de pagos SINPE en dashboard
    - Formulario con campos: monto, referencia SINPE, fecha
    - Validaciones
    - _Requisitos: 11.1_

- [ ] 34. Sistema de Promociones
  - [ ] 34.1 Crear PromotionsService con operaciones CRUD
    - Implementar createPromotion con validaciones
    - Implementar updatePromotion, deletePromotion
    - Implementar getPromotion, listActivePromotions
    - _Requisitos: 12.1, 12.2_

  - [ ] 34.2 Implementar validaciones de promociones
    - Validar código único por gym_id
    - Validar end_date > start_date
    - Validar discount_value según discount_type
    - _Requisitos: 12.1, 12.2, 12.3, 12.4_

  - [ ] 34.3 Implementar aplicación de promociones
    - Método applyPromotion que valida código
    - Validar fecha actual entre start_date y end_date
    - Validar current_uses < max_uses
    - Incrementar current_uses
    - _Requisitos: 12.5, 12.6, 12.7_

  - [ ] 34.4 Implementar cálculo de descuentos
    - Calcular descuento según tipo (percentage o fixed_amount)
    - Garantizar precio final >= 0
    - Retornar DiscountResult con detalles
    - _Requisitos: 12.8, 12.9_

  - [ ]* 34.5 Escribir property test para precios no negativos
    - **Property 6: Non-Negative Prices**
    - **Valida: Requisitos 5.6, 10.7, 12.8**
    - Verificar que descuentos nunca resulten en precio negativo

  - [ ]* 34.6 Escribir tests unitarios de PromotionsService
    - Test de validación de códigos
    - Test de cálculo de descuentos
    - Test de límites de uso

- [ ] 35. Checkpoint - Verificar Pagos y Promociones
  - Asegurar que todos los tests pasen
  - Probar flujos de pago con Stripe (modo test)
  - Verificar aplicación de promociones
  - Preguntar al usuario si hay dudas o ajustes necesarios


- [ ] 36. Sistema de Alertas Automáticas
  - [ ] 36.1 Implementar cron job de verificación de vencimientos
    - Configurar cron job que ejecuta diariamente a las 00:00
    - Considerar timezone del gimnasio
    - Iterar sobre todos los gimnasios
    - _Requisitos: 6.3, 25.2, 25.3_

  - [ ] 36.2 Implementar lógica de detección de vencimientos
    - Query de membresías con end_date en (hoy+3, hoy)
    - Calcular días restantes
    - _Requisitos: 6.1, 6.2_

  - [ ] 36.3 Integrar con NotificationService para envío de alertas
    - Enviar alerta 3 días antes: "Tu membresía vence en 3 días"
    - Enviar alerta el día de vencimiento: "Tu membresía vence HOY"
    - Actualizar status a 'expired' el día de vencimiento
    - _Requisitos: 6.1, 6.2, 5.3_

  - [ ] 36.4 Implementar registro de alertas enviadas
    - Evitar enviar alertas duplicadas
    - Registrar en historial de notificaciones
    - _Requisitos: 6.4_

  - [ ]* 36.5 Escribir property test para timing de alertas
    - **Property 8: Alert Timing Correctness**
    - **Valida: Requisitos 6.1, 6.2**
    - Verificar que alertas se envíen en fechas correctas

  - [ ]* 36.6 Escribir tests de cron jobs con fechas simuladas
    - Test de detección de vencimientos
    - Test de envío de alertas
    - Test de actualización de estados

- [ ] 37. Sistema de Notificaciones Push
  - [ ] 37.1 Configurar Firebase Cloud Messaging
    - Setup de Firebase en backend
    - Configurar credenciales de FCM
    - _Requisitos: 14.1_

  - [ ] 37.2 Implementar NotificationService
    - Método sendPushNotification con título, cuerpo, prioridad
    - Método sendBulkNotifications para envíos masivos
    - Procesamiento en lotes
    - _Requisitos: 14.1, 14.3_

  - [ ] 37.3 Implementar métodos de alertas específicas
    - sendMembershipExpirationAlert
    - sendWorkoutReminder
    - sendProgressMilestone
    - _Requisitos: 6.1, 6.2, 14.5, 4.5_

  - [ ] 37.4 Implementar gestión de preferencias de notificación
    - Método updateNotificationPreferences
    - Respetar preferencias al enviar
    - _Requisitos: 14.2, 6.5_

  - [ ] 37.5 Implementar historial de notificaciones
    - Registrar todas las notificaciones enviadas
    - Método getNotificationHistory
    - _Requisitos: 14.4_

  - [ ]* 37.6 Escribir tests de NotificationService
    - Test de envío de notificaciones
    - Test de respeto a preferencias
    - Test de procesamiento en lotes

- [ ] 38. Integrar Notificaciones en App Móvil
  - [ ] 38.1 Configurar FCM en React Native
    - Setup de @react-native-firebase/messaging
    - Solicitar permisos de notificaciones
    - Registrar device token
    - _Requisitos: 14.1_

  - [ ] 38.2 Implementar manejo de notificaciones
    - Listener de notificaciones en foreground
    - Listener de notificaciones en background
    - Navegación según tipo de notificación
    - _Requisitos: 14.1_

  - [ ] 38.3 Crear pantalla de configuración de notificaciones
    - Toggles para tipos de notificaciones
    - Guardar preferencias
    - _Requisitos: 14.2_

- [ ] 39. Dashboard de Estadísticas Avanzadas
  - [ ] 39.1 Implementar StatisticsService completo
    - Método getDashboardStats con métricas clave
    - Método getRevenueReport con ingresos por tipo y mes
    - Método getClientRetentionReport con tasa de retención
    - Método getMembershipTrends con tendencias mensuales
    - Método getClientGrowth con crecimiento neto
    - _Requisitos: 13.1, 13.2, 13.3, 13.8_

  - [ ] 39.2 Implementar cache de estadísticas en Redis
    - Cache con TTL de 5 minutos
    - Invalidación al crear/actualizar membresías o pagos
    - _Requisitos: 13.5, 13.6, 13.7, 18.1_

  - [ ]* 39.3 Escribir tests de cálculo de estadísticas
    - Test de cálculo de retención
    - Test de cálculo de ingresos
    - Test de invalidación de cache

- [ ] 40. Dashboard Web - Estadísticas Avanzadas
  - [ ] 40.1 Crear página de estadísticas completa
    - Tarjetas con métricas clave actualizadas
    - Gráfica de ingresos por mes (Recharts)
    - Gráfica de crecimiento de clientes
    - Gráfica de tendencias de membresías
    - _Requisitos: 13.1, 13.2, 13.3_

  - [ ] 40.2 Crear página de reportes de ingresos
    - Filtros por rango de fechas
    - Desglose por tipo de membresía
    - Proyección de ingresos
    - _Requisitos: 13.8_

  - [ ] 40.3 Implementar exportación de reportes
    - Exportar clientes a CSV
    - Exportar ingresos a PDF con gráficas
    - Validar permisos antes de exportar
    - _Requisitos: 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ] 41. Checkpoint - Verificar Alertas y Estadísticas
  - Asegurar que todos los tests pasen
  - Probar cron jobs en staging
  - Verificar notificaciones push en dispositivos reales
  - Preguntar al usuario si hay dudas o ajustes necesarios


- [ ] 42. Dashboard Web - Módulo de Promociones
  - [ ] 42.1 Crear página de gestión de promociones
    - Lista de promociones activas e inactivas
    - Indicadores de uso (current_uses / max_uses)
    - Filtros por tipo y estado
    - _Requisitos: 12.1_

  - [ ] 42.2 Crear formulario de creación de promoción
    - Campos: nombre, código, tipo, descuento, fechas, límites
    - Validaciones de fechas y valores
    - _Requisitos: 12.1, 12.2, 12.3, 12.4_

  - [ ] 42.3 Integrar aplicación de promociones en flujo de membresía
    - Campo de código promocional en formulario de membresía
    - Validación en tiempo real
    - Mostrar descuento aplicado
    - _Requisitos: 12.5, 12.9_

- [ ] 43. Dashboard Web - Integración de Pagos
  - [ ] 43.1 Integrar Stripe Elements en formulario de pago
    - Configurar Stripe Elements para captura de tarjeta
    - Implementar flujo de confirmación de pago
    - Mostrar estado de pago en tiempo real
    - _Requisitos: 10.1, 10.2, 20.3_

  - [ ] 43.2 Crear página de historial de pagos
    - Lista de pagos con filtros por método y estado
    - Búsqueda por cliente
    - Detalles de cada pago
    - _Requisitos: 10.1_

  - [ ] 43.3 Implementar procesamiento de reembolsos en UI
    - Botón de reembolso en detalles de pago
    - Confirmación de reembolso
    - Actualización de estado
    - _Requisitos: 10.1_

- [ ] 44. Gestión Completa de Inventario con Mantenimientos
  - [ ] 44.1 Implementar cálculo automático de mantenimientos
    - Calcular next_maintenance automáticamente
    - Actualizar status a 'maintenance' cuando next_maintenance <= hoy
    - _Requisitos: 9.2, 9.3, 9.7_

  - [ ] 44.2 Implementar query de equipamiento con mantenimiento pendiente
    - Método getEquipmentDueMaintenance
    - Retornar equipamiento con next_maintenance <= hoy
    - _Requisitos: 9.5_

  - [ ] 44.3 Implementar actualización de estado post-mantenimiento
    - Al registrar mantenimiento, actualizar last_maintenance
    - Cambiar status a 'operational'
    - Recalcular next_maintenance
    - _Requisitos: 9.7_

  - [ ]* 44.4 Escribir tests de lógica de mantenimientos
    - Test de cálculo de next_maintenance
    - Test de actualización de estados
    - Test de detección de mantenimientos pendientes

- [ ] 45. Dashboard Web - Gestión Avanzada de Inventario
  - [ ] 45.1 Agregar alertas de mantenimiento pendiente
    - Indicador en dashboard de equipamiento con mantenimiento pendiente
    - Notificación visual
    - _Requisitos: 9.5_

  - [ ] 45.2 Mejorar UI de historial de mantenimientos
    - Timeline de mantenimientos
    - Gráfica de costos de mantenimiento
    - Próxima fecha de mantenimiento
    - _Requisitos: 9.4_

- [ ] 46. Optimización de Rendimiento y Seguridad
  - [ ] 46.1 Implementar connection pooling optimizado
    - Configurar pool con max 20 conexiones
    - Idle timeout de 30 segundos
    - Connection timeout de 5 segundos
    - _Requisitos: 18.4, 22.1_

  - [ ] 46.2 Implementar circuit breaker para servicios externos
    - Circuit breaker para OpenAI
    - Circuit breaker para Stripe
    - Circuit breaker para S3
    - _Requisitos: 22.4_

  - [ ] 46.3 Configurar CloudFront CDN para videos
    - Setup de distribución de CloudFront
    - Configurar origen S3
    - Actualizar URLs de videos
    - _Requisitos: 18.5_

  - [ ] 46.4 Implementar compresión de imágenes optimizada
    - Usar sharp para compresión
    - Máximo 2MB por imagen
    - Generar thumbnails automáticamente
    - _Requisitos: 18.6_

  - [ ] 46.5 Configurar security headers con Helmet
    - Implementar todos los headers de seguridad
    - Configurar CSP
    - _Requisitos: 20.1_

  - [ ] 46.6 Configurar CORS con whitelist
    - Whitelist de dominios permitidos
    - Configurar credentials: true
    - _Requisitos: 20.7_

  - [ ]* 46.7 Escribir tests de seguridad
    - Test de validación de gym_id en todos los endpoints
    - Test de CORS
    - Test de rate limiting

- [ ] 47. Checkpoint - Verificar Optimizaciones
  - Asegurar que todos los tests pasen
  - Realizar pruebas de carga
  - Verificar tiempos de respuesta
  - Preguntar al usuario si hay dudas o ajustes necesarios


- [ ] 48. Implementar Búsqueda y Filtrado Avanzado
  - [ ] 48.1 Implementar búsqueda de clientes optimizada
    - Búsqueda parcial case-insensitive por nombre
    - Índices de base de datos para búsqueda
    - _Requisitos: 28.1, 28.4_

  - [ ] 48.2 Implementar filtros combinados
    - Combinar múltiples filtros con AND
    - Filtros por status, tipo, fechas
    - _Requisitos: 28.2, 28.3, 28.5_

  - [ ]* 48.3 Escribir tests de búsqueda y filtrado
    - Test de búsqueda case-insensitive
    - Test de filtros combinados

- [ ] 49. Implementar Versionado de API
  - [ ] 49.1 Configurar versionado en rutas
    - Prefijo /api/v1/ para todos los endpoints
    - Preparar estructura para v2
    - _Requisitos: 29.1_

  - [ ] 49.2 Documentar API con Swagger
    - Configurar @nestjs/swagger
    - Documentar todos los endpoints
    - Incluir ejemplos de requests/responses
    - _Requisitos: 29.5_

  - [ ] 49.3 Implementar headers de deprecación
    - Preparar para futuras deprecaciones
    - _Requisitos: 29.4_

- [ ] 50. Monitoreo y Observabilidad
  - [ ] 50.1 Configurar integración con Sentry
    - Setup de Sentry SDK
    - Captura de errores no manejados
    - Contexto de usuario en errores
    - _Requisitos: 30.3_

  - [ ] 50.2 Implementar métricas de Prometheus
    - Exponer endpoint /metrics
    - Métricas de tiempo de respuesta por endpoint
    - Métricas de tasa de errores
    - Métricas de uso de servicios externos
    - _Requisitos: 30.2, 30.4, 30.5, 30.6_

  - [ ] 50.3 Configurar dashboards de Grafana
    - Dashboard de salud del sistema
    - Dashboard de métricas de negocio
    - Dashboard de costos de servicios externos
    - _Requisitos: Monitoreo_

- [ ] 51. Testing Completo de Fase 3
  - [ ]* 51.1 Escribir property test para aislamiento multi-tenant
    - **Property 1: Multi-Tenant Data Isolation**
    - **Valida: Requisitos 2.1, 2.2, 2.3, 2.4**
    - Verificar que queries nunca retornen datos de otro gym_id

  - [ ]* 51.2 Escribir property test para expiración de tokens
    - **Property 7: Token Expiration Security**
    - **Valida: Requisitos 1.3, 27.5, 27.6**
    - Verificar que tokens expirados sean rechazados

  - [ ]* 51.3 Escribir tests end-to-end completos
    - Test de flujo completo con Stripe
    - Test de flujo completo con promociones
    - Test de alertas automáticas
    - Test de notificaciones push

  - [ ]* 51.4 Realizar pruebas de carga
    - Simular 100 usuarios concurrentes
    - Verificar tiempos de respuesta < 500ms
    - Verificar estabilidad del sistema

  - [ ] 51.5 Alcanzar cobertura de tests >= 80%
    - Revisar cobertura actual
    - Agregar tests faltantes
    - _Requisitos: Calidad_

- [ ] 52. Documentación Final
  - [ ] 52.1 Documentar arquitectura del sistema
    - Diagramas actualizados
    - Decisiones de diseño
    - Patrones utilizados
    - _Requisitos: Documentación_

  - [ ] 52.2 Crear guías de usuario
    - Guía para administradores de gimnasio
    - Guía para entrenadores
    - Guía para recepcionistas
    - _Requisitos: Documentación_

  - [ ] 52.3 Documentar APIs y webhooks
    - Documentación completa de Swagger
    - Guía de integración con webhooks de Stripe
    - Ejemplos de uso
    - _Requisitos: 29.5_

  - [ ] 52.4 Crear runbook de operaciones
    - Procedimientos de deployment
    - Procedimientos de rollback
    - Troubleshooting común
    - _Requisitos: Documentación_

- [ ] 53. Deployment Final y Go-Live
  - [ ] 53.1 Configurar ambiente de producción
    - Setup de servidores en DigitalOcean
    - Configurar bases de datos managed
    - Configurar backups automáticos
    - _Requisitos: Infraestructura_

  - [ ] 53.2 Configurar CI/CD completo
    - Pipeline de GitHub Actions
    - Tests automáticos en CI
    - Deployment automático a staging
    - Deployment manual a producción
    - _Requisitos: DevOps_

  - [ ] 53.3 Realizar pruebas de aceptación de usuario
    - Pruebas con usuarios reales en staging
    - Recopilar feedback
    - Ajustes finales
    - _Requisitos: QA_

  - [ ] 53.4 Configurar monitoreo de producción
    - Alertas de Sentry
    - Dashboards de Grafana
    - Alertas de uptime
    - _Requisitos: Monitoreo_

  - [ ] 53.5 Realizar deployment a producción
    - Deployment de backend
    - Deployment de dashboard web
    - Publicación de app móvil (App Store + Play Store)
    - _Requisitos: Deployment_

- [ ] 54. Checkpoint Final del Proyecto
  - Verificar que todos los requisitos estén implementados
  - Confirmar que todos los tests pasen (cobertura >= 80%)
  - Verificar que el sistema esté en producción
  - Realizar handoff al equipo de soporte
  - Celebrar el lanzamiento exitoso 🎉

---

## Notas Importantes

### Sobre Tareas Opcionales
- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Se recomienda implementar tests de property-based para garantizar correctness
- Los tests unitarios y de integración son altamente recomendados

### Sobre Estimaciones
- **Fase 1**: 8-10 semanas (MVP funcional)
- **Fase 2**: 4-6 semanas (Integración de IA)
- **Fase 3**: 6-8 semanas (Funcionalidades avanzadas)
- **Total**: 18-24 semanas

### Sobre Dependencias
- Cada fase construye sobre la anterior
- Los checkpoints permiten validar progreso antes de continuar
- Se recomienda no avanzar a la siguiente fase sin completar la anterior

### Sobre Requisitos
- Cada tarea referencia los requisitos específicos que implementa
- Usar los requisitos como guía para validación
- Todos los 30 requisitos están cubiertos en este plan

### Sobre Testing
- Cobertura objetivo: 60% en Fase 1, 80% en Fase 3
- Property-based tests validan propiedades universales
- Tests de integración validan flujos completos
- Tests end-to-end validan experiencia de usuario

### Sobre Deployment
- Fase 1 y 2 se despliegan en staging para pruebas
- Fase 3 incluye deployment a producción
- CI/CD automatiza testing y deployment

