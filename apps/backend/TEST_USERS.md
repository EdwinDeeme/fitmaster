# Usuarios de Prueba - FitMaster

## Cómo crear los usuarios

Ejecuta el siguiente comando en el directorio `apps/backend`:

```bash
npm run prisma:seed:auth
```

## Usuarios Disponibles

### Super Admin (Administrador de Plataforma)
- **Email**: superadmin@fitmaster.com
- **Contraseña**: SecurePass123!
- **Rol**: SUPER_ADMIN
- **Gimnasio**: Ninguno (administra toda la plataforma)
- **Permisos**: Acceso completo a todos los gimnasios y configuración de plataforma

### Gym Admin (Administrador de Gimnasio)
- **Email**: admin@testgym.com
- **Contraseña**: SecurePass123!
- **Rol**: GYM_ADMIN
- **Gimnasio**: Test Gym
- **Permisos**: Acceso completo a su gimnasio (Test Gym)

### Entrenador
- **Email**: trainer@testgym.com
- **Contraseña**: SecurePass123!
- **Rol**: TRAINER
- **Gimnasio**: Test Gym
- **Permisos**: Gestión de clientes y rutinas

### Recepcionista
- **Email**: receptionist@testgym.com
- **Contraseña**: SecurePass123!
- **Rol**: RECEPTIONIST
- **Gimnasio**: Test Gym
- **Permisos**: Gestión de clientes, membresías y pagos

## Gimnasio de Prueba

- **Nombre**: Test Gym
- **Subdominio**: testgym
- **País**: CR (Costa Rica)
- **Zona Horaria**: America/Costa_Rica

## Estructura de Usuarios

```
PLATAFORMA FITMASTER
├── SUPER_ADMIN (superadmin@fitmaster.com) - Sin gimnasio asignado
└── Gimnasios
    └── Test Gym
        ├── GYM_ADMIN (admin@testgym.com)
        ├── TRAINER (trainer@testgym.com)
        └── RECEPTIONIST (receptionist@testgym.com)
```

## Notas Importantes

- **SUPER_ADMIN** NO pertenece a ningún gimnasio específico (gymId = null)
- Los usuarios de gimnasio (GYM_ADMIN, TRAINER, RECEPTIONIST) SÍ pertenecen a un gimnasio específico
- La contraseña es la misma para todos: `SecurePass123!`
- Los usuarios se crean con el script `prisma/seed-auth.ts`
- Si ejecutas el seed múltiples veces, no se duplicarán los usuarios (usa `upsert`)
- El conteo de usuarios en el dashboard del SUPER_ADMIN solo incluye usuarios de gimnasios (excluye SUPER_ADMIN)
