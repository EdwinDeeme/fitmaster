# FitMaster Backend API

API REST con NestJS para el sistema FitMaster.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar base de datos con Docker
docker-compose up -d

# Ejecutar migraciones
npm run migration:run

# Modo desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
src/
├── auth/              # Módulo de autenticación
├── clients/           # Módulo de gestión de clientes
├── memberships/       # Módulo de membresías
├── routines/          # Módulo de rutinas
├── payments/          # Módulo de pagos
├── common/            # Código compartido
├── config/            # Configuraciones
└── main.ts            # Punto de entrada
```

## 🔐 Autenticación

La API usa JWT con access tokens (15 min) y refresh tokens (7 días).

## 📚 Documentación API

Swagger disponible en: `http://localhost:3000/api/docs`

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:cov

# Tests en modo watch
npm run test:watch
```

## 🗄️ Base de Datos

### Migraciones

```bash
# Generar migración
npm run migration:generate -- src/migrations/MigrationName

# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:revert
```

## 🔧 Variables de Entorno

Ver `.env.example` para todas las variables requeridas.
