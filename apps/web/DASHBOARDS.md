# Dashboards por Rol - FitMaster

## Implementación Completada

Se han implementado dashboards diferenciados según el rol del usuario, siguiendo la arquitectura definida en `apps/backend/ROLES_AND_PERMISSIONS.md`.

---

## SUPER_ADMIN Dashboard

**Ruta**: `/admin/dashboard`

**Propósito**: Vista de administración de toda la plataforma FitMaster.

### Métricas Mostradas:
- Total de gimnasios registrados (activos/inactivos)
- Total de usuarios en la plataforma
- Ingresos mensuales recurrentes (MRR)
- Tasa de crecimiento mensual

### Secciones:
1. **Gimnasios Recientes**: Últimos gimnasios registrados
2. **Suscripciones por Vencer**: Próximos vencimientos de planes
3. **Analíticas de Plataforma**: 
   - Gimnasios activos/inactivos
   - Pagos pendientes
   - Tickets de soporte abiertos

### Redirección:
Cuando un SUPER_ADMIN inicia sesión, es redirigido automáticamente a `/admin/dashboard`.

---

## GYM_ADMIN Dashboard

**Ruta**: `/dashboard`

**Propósito**: Vista completa de gestión del gimnasio.

### Métricas Mostradas:
- Clientes activos del gimnasio
- Membresías activas
- Ingresos del mes
- Nuevos clientes del mes

### Secciones:
1. **Actividad Reciente**: Últimas acciones en el gimnasio
2. **Membresías por Vencer**: Próximos vencimientos
3. **Resumen del Gimnasio**:
   - Tasa de retención
   - Promedio de asistencia
   - Equipamiento activo
   - Staff activo

---

## TRAINER Dashboard

**Ruta**: `/dashboard`

**Propósito**: Vista enfocada en clientes y rutinas.

### Métricas Mostradas:
- Clientes activos del gimnasio
- Membresías activas
- Rutinas creadas este mes (en lugar de ingresos)

### Secciones:
1. **Actividad Reciente**: Últimas acciones
2. **Clientes Asignados**: Lista de clientes del entrenador

### Diferencias con GYM_ADMIN:
- NO muestra métricas de ingresos
- Muestra "Rutinas Creadas" en lugar de "Nuevos Clientes"
- Muestra "Clientes Asignados" en lugar de "Membresías por Vencer"
- NO muestra el resumen completo del gimnasio

---

## RECEPTIONIST Dashboard

**Ruta**: `/dashboard`

**Propósito**: Vista enfocada en operaciones diarias.

### Métricas Mostradas:
- Clientes activos
- Membresías activas
- Ingresos del mes
- Nuevos clientes del mes

### Secciones:
1. **Actividad Reciente**: Últimas acciones
2. **Membresías por Vencer**: Próximos vencimientos (importante para renovaciones)

### Diferencias con GYM_ADMIN:
- NO muestra el resumen completo del gimnasio
- Vista más simplificada enfocada en operaciones del día

---

## Implementación Técnica

### AuthContext
```typescript
// Redirección automática según rol después del login
if (response.user.role === 'SUPER_ADMIN') {
  router.push('/admin/dashboard');
} else if (response.user.role === 'CLIENT') {
  router.push('/profile');
} else {
  // GYM_ADMIN, TRAINER, RECEPTIONIST
  router.push('/dashboard');
}
```

### ProtectedRoute
Cada dashboard está protegido con el componente `ProtectedRoute` que valida los roles permitidos:

```typescript
// SUPER_ADMIN Dashboard
<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>

// Gym Users Dashboard
<ProtectedRoute allowedRoles={[
  UserRole.GYM_ADMIN, 
  UserRole.TRAINER, 
  UserRole.RECEPTIONIST
]}>
```

### Contenido Condicional
El dashboard de usuarios de gimnasio muestra contenido diferente según el rol:

```typescript
// Ocultar ingresos para TRAINER
{user?.role !== UserRole.TRAINER && (
  <Card>
    <CardDescription>Ingresos del Mes</CardDescription>
    ...
  </Card>
)}

// Mostrar resumen solo para GYM_ADMIN
{user?.role === UserRole.GYM_ADMIN && (
  <Card>
    <CardTitle>Resumen del Gimnasio</CardTitle>
    ...
  </Card>
)}
```

---

## Próximos Pasos

### Para SUPER_ADMIN:
1. Implementar gestión de gimnasios (`/admin/gyms`)
2. Implementar gestión de planes (`/admin/plans`)
3. Implementar facturación global (`/admin/billing`)
4. Implementar analíticas de plataforma (`/admin/analytics`)
5. Conectar con APIs reales para mostrar datos

### Para Usuarios de Gimnasio:
1. Implementar gestión de clientes (`/clients`)
2. Implementar gestión de membresías (`/memberships`)
3. Implementar gestión de pagos (`/payments`)
4. Implementar gestión de rutinas (`/routines`)
5. Conectar con APIs reales para mostrar datos del gimnasio

### Navegación:
- Actualizar `DashboardLayout` para mostrar menú diferente según rol
- SUPER_ADMIN debe ver: Gimnasios, Planes, Facturación, Analíticas, Soporte
- GYM_ADMIN debe ver: Dashboard, Clientes, Membresías, Pagos, Rutinas, Equipamiento, Staff, Configuración
- TRAINER debe ver: Dashboard, Clientes, Rutinas, Equipamiento
- RECEPTIONIST debe ver: Dashboard, Clientes, Membresías, Pagos, Promociones

---

## Archivos Modificados

1. `apps/web/src/contexts/auth.context.tsx` - Redirección según rol
2. `apps/web/src/app/dashboard/page.tsx` - Dashboard para usuarios de gimnasio
3. `apps/web/src/app/admin/dashboard/page.tsx` - Dashboard para SUPER_ADMIN (nuevo)
4. `apps/web/DASHBOARDS.md` - Esta documentación (nuevo)

---

## Testing

Para probar los diferentes dashboards, usar los usuarios de prueba definidos en `apps/backend/TEST_USERS.md`:

- SUPER_ADMIN: `superadmin@fitmaster.com`
- GYM_ADMIN: `admin@powerhouse.com`
- TRAINER: `trainer@powerhouse.com`
- RECEPTIONIST: `receptionist@powerhouse.com`

Todos con contraseña: `Password123!`
