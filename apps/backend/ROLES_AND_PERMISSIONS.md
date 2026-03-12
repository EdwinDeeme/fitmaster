# Roles y Permisos - FitMaster

## Arquitectura de Roles

FitMaster es un sistema SaaS multi-tenant con dos niveles de usuarios:

### Nivel 1: Administración de Plataforma
- **SUPER_ADMIN**: Administradores de FitMaster (nosotros como dueños del sistema)

### Nivel 2: Usuarios de Gimnasio
- **GYM_ADMIN**: Dueño/Administrador del gimnasio
- **TRAINER**: Entrenador del gimnasio
- **RECEPTIONIST**: Recepcionista del gimnasio
- **CLIENT**: Cliente/miembro del gimnasio (futuro)

---

## SUPER_ADMIN (Administrador de Plataforma)

### Propósito
Gestionar la plataforma completa, todos los gimnasios, planes y facturación.

### Dashboard
- **Métricas Globales**:
  - Total de gimnasios registrados
  - Gimnasios activos vs inactivos
  - Total de usuarios en la plataforma
  - Ingresos totales (MRR - Monthly Recurring Revenue)
  - Tasa de crecimiento mensual

- **Gestión de Gimnasios**:
  - Lista de todos los gimnasios
  - Crear/editar/suspender gimnasios
  - Ver detalles de cada gimnasio
  - Cambiar planes de gimnasios

- **Gestión de Planes**:
  - Crear/editar planes de suscripción
  - Precios y características
  - Límites por plan (usuarios, clientes, etc.)

- **Facturación Global**:
  - Pagos de suscripciones de gimnasios
  - Facturas generadas
  - Pagos pendientes/vencidos

- **Soporte**:
  - Tickets de soporte
  - Acceso a cualquier gimnasio para ayuda

### Permisos
- ✅ Acceso a TODOS los gimnasios
- ✅ Crear/editar/eliminar gimnasios
- ✅ Gestionar planes de suscripción
- ✅ Ver facturación global
- ✅ Suspender/activar gimnasios
- ✅ Ver métricas de toda la plataforma
- ✅ Acceso a logs y auditoría

### Rutas Específicas
```
/admin/dashboard          - Dashboard de plataforma
/admin/gyms               - Gestión de gimnasios
/admin/gyms/:id           - Detalles de gimnasio
/admin/plans              - Gestión de planes
/admin/billing            - Facturación global
/admin/analytics          - Analíticas de plataforma
/admin/support            - Tickets de soporte
```

---

## GYM_ADMIN (Administrador de Gimnasio)

### Propósito
Gestionar completamente su gimnasio: clientes, staff, membresías, pagos, etc.

### Dashboard
- **Métricas del Gimnasio**:
  - Clientes activos
  - Membresías activas/por vencer
  - Ingresos del mes
  - Nuevos clientes del mes
  - Tasa de retención

- **Gestión Completa**:
  - Clientes
  - Membresías
  - Pagos
  - Rutinas
  - Equipamiento
  - Promociones
  - Staff (entrenadores, recepcionistas)

### Permisos
- ✅ Acceso completo a SU gimnasio
- ✅ Crear/editar/eliminar clientes
- ✅ Gestionar membresías
- ✅ Procesar pagos
- ✅ Crear/asignar rutinas
- ✅ Gestionar equipamiento
- ✅ Crear promociones
- ✅ Gestionar staff (crear usuarios TRAINER/RECEPTIONIST)
- ✅ Ver todas las estadísticas del gimnasio
- ✅ Configurar el gimnasio
- ❌ NO puede acceder a otros gimnasios
- ❌ NO puede cambiar su plan (debe contactar soporte)

### Rutas Específicas
```
/dashboard                - Dashboard del gimnasio
/clients                  - Gestión de clientes
/memberships              - Gestión de membresías
/payments                 - Gestión de pagos
/routines                 - Gestión de rutinas
/equipment                - Gestión de equipamiento
/promotions               - Gestión de promociones
/staff                    - Gestión de staff
/settings                 - Configuración del gimnasio
/analytics                - Analíticas del gimnasio
```

---

## TRAINER (Entrenador)

### Propósito
Gestionar clientes y rutinas de entrenamiento.

### Dashboard
- **Métricas Limitadas**:
  - Sus clientes asignados
  - Rutinas creadas
  - Progreso de clientes

### Permisos
- ✅ Ver clientes del gimnasio
- ✅ Ver/editar datos físicos de clientes
- ✅ Crear/editar/asignar rutinas
- ✅ Ver progreso de clientes
- ✅ Generar rutinas con IA
- ✅ Gestionar equipamiento (solo lectura)
- ❌ NO puede crear/eliminar clientes
- ❌ NO puede gestionar membresías
- ❌ NO puede procesar pagos
- ❌ NO puede crear promociones
- ❌ NO puede gestionar staff
- ❌ NO puede ver estadísticas financieras

### Rutas Específicas
```
/dashboard                - Dashboard del entrenador
/clients                  - Ver clientes (solo lectura)
/clients/:id              - Ver/editar datos físicos
/routines                 - Gestión de rutinas
/routines/generate        - Generar rutinas con IA
/equipment                - Ver equipamiento (solo lectura)
```

---

## RECEPTIONIST (Recepcionista)

### Propósito
Gestionar el día a día: registrar clientes, vender membresías, procesar pagos.

### Dashboard
- **Métricas Limitadas**:
  - Clientes activos
  - Membresías por vencer hoy
  - Pagos del día

### Permisos
- ✅ Crear/editar clientes
- ✅ Gestionar membresías (crear, renovar)
- ✅ Procesar pagos (efectivo, SINPE, tarjeta)
- ✅ Aplicar promociones
- ✅ Ver lista de clientes
- ❌ NO puede crear/editar rutinas
- ❌ NO puede gestionar equipamiento
- ❌ NO puede gestionar staff
- ❌ NO puede ver estadísticas completas
- ❌ NO puede configurar el gimnasio

### Rutas Específicas
```
/dashboard                - Dashboard de recepción
/clients                  - Gestión de clientes
/clients/new              - Registrar nuevo cliente
/memberships              - Gestión de membresías
/memberships/new          - Vender membresía
/payments                 - Procesar pagos
/promotions               - Ver/aplicar promociones (solo lectura)
```

---

## CLIENT (Cliente) - Futuro

### Propósito
Ver su información personal, progreso y rutina asignada.

### Dashboard (App Móvil)
- Su perfil
- Su membresía actual
- Su rutina asignada
- Su progreso físico
- Historial de pagos

### Permisos
- ✅ Ver su propia información
- ✅ Ver su rutina asignada
- ✅ Registrar su progreso físico
- ✅ Subir fotos de progreso
- ✅ Ver su membresía
- ✅ Ver su historial de pagos
- ❌ NO puede ver otros clientes
- ❌ NO puede modificar membresías
- ❌ NO puede acceder al dashboard web

---

## Matriz de Permisos

| Funcionalidad | SUPER_ADMIN | GYM_ADMIN | TRAINER | RECEPTIONIST | CLIENT |
|--------------|-------------|-----------|---------|--------------|--------|
| **Plataforma** |
| Gestionar gimnasios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestionar planes | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver todos los gimnasios | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Gimnasio** |
| Configurar gimnasio | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver estadísticas completas | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Clientes** |
| Crear clientes | ✅ | ✅ | ❌ | ✅ | ❌ |
| Editar clientes | ✅ | ✅ | ❌ | ✅ | ❌ |
| Eliminar clientes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver clientes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver progreso físico | ✅ | ✅ | ✅ | ❌ | ✅ (propio) |
| **Membresías** |
| Crear membresías | ✅ | ✅ | ❌ | ✅ | ❌ |
| Renovar membresías | ✅ | ✅ | ❌ | ✅ | ❌ |
| Cancelar membresías | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Pagos** |
| Procesar pagos | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver historial pagos | ✅ | ✅ | ❌ | ✅ | ✅ (propio) |
| Hacer reembolsos | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Rutinas** |
| Crear rutinas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Editar rutinas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Asignar rutinas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generar con IA | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver rutina asignada | ✅ | ✅ | ✅ | ❌ | ✅ (propia) |
| **Equipamiento** |
| Gestionar equipamiento | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver equipamiento | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Promociones** |
| Crear promociones | ✅ | ✅ | ❌ | ❌ | ❌ |
| Aplicar promociones | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver promociones | ✅ | ✅ | ❌ | ✅ | ❌ |

---

## Implementación Técnica

### Guards en NestJS
```typescript
// Ejemplo de uso de guards
@Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
@Get('clients')
getClients() {
  // Solo GYM_ADMIN y TRAINER pueden acceder
}

@Roles(UserRole.SUPER_ADMIN)
@Get('admin/gyms')
getAllGyms() {
  // Solo SUPER_ADMIN puede acceder
}
```

### Redirección en Frontend
```typescript
// En AuthContext después del login
if (user.role === UserRole.SUPER_ADMIN) {
  router.push('/admin/dashboard');
} else if (user.role === UserRole.CLIENT) {
  router.push('/profile');
} else {
  router.push('/dashboard'); // GYM_ADMIN, TRAINER, RECEPTIONIST
}
```

---

## Próximos Pasos

1. **Crear dashboard de SUPER_ADMIN** (`/admin/*`)
2. **Diferenciar dashboards** según rol
3. **Implementar gestión de gimnasios** (SUPER_ADMIN)
4. **Implementar gestión de planes** (SUPER_ADMIN)
5. **Agregar validaciones de permisos** en cada endpoint
6. **Crear vistas específicas** para cada rol
