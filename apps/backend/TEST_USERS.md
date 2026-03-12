# Usuarios de Prueba - FitMaster

## Cómo crear los usuarios

Ejecuta el siguiente comando en el directorio `apps/backend`:

```bash
npm run prisma:seed:auth
```

## Usuarios Disponibles

### Super Admin
- **Email**: superadmin@fitmaster.com
- **Contraseña**: SecurePass123!
- **Rol**: SUPER_ADMIN
- **Permisos**: Acceso completo a todos los gimnasios

### Gym Admin
- **Email**: admin@testgym.com
- **Contraseña**: SecurePass123!
- **Rol**: GYM_ADMIN
- **Permisos**: Acceso completo a su gimnasio (Test Gym)

### Entrenador
- **Email**: trainer@testgym.com
- **Contraseña**: SecurePass123!
- **Rol**: TRAINER
- **Permisos**: Gestión de clientes y rutinas

### Recepcionista
- **Email**: receptionist@testgym.com
- **Contraseña**: SecurePass123!
- **Rol**: RECEPTIONIST
- **Permisos**: Gestión de clientes, membresías y pagos

## Gimnasio de Prueba

- **Nombre**: Test Gym
- **Subdominio**: testgym
- **País**: CR (Costa Rica)
- **Zona Horaria**: America/Costa_Rica

## Notas

- Todos los usuarios pertenecen al mismo gimnasio (Test Gym)
- La contraseña es la misma para todos: `SecurePass123!`
- Los usuarios se crean con el script `prisma/seed-auth.ts`
- Si ejecutas el seed múltiples veces, no se duplicarán los usuarios (usa `upsert`)
