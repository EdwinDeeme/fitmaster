# FitMaster

SaaS multi-tenant para gestión integral de gimnasios con IA integrada.

## 🏗️ Arquitectura del Proyecto

Este es un monorepo que contiene:

- **Backend** (`apps/backend`): API REST con NestJS + PostgreSQL + Redis
- **Web Dashboard** (`apps/web`): Dashboard administrativo con Next.js + React
- **Mobile App** (`apps/mobile`): App móvil para clientes con React Native

## 🚀 Stack Tecnológico

### Backend
- NestJS + TypeScript
- PostgreSQL (multi-tenant)
- Redis (caching)
- JWT (autenticación)
- Stripe (pagos)
- OpenAI (generación de rutinas con IA)
- AWS S3 (almacenamiento de archivos)

### Web Dashboard
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form + Zod

### Mobile App
- React Native
- TypeScript
- React Navigation
- React Native Paper
- Axios

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env

# Iniciar base de datos (Docker)
docker-compose up -d

# Ejecutar migraciones
npm run migration:run --workspace=@fitmaster/backend
```

## 🛠️ Desarrollo

```bash
# Backend
npm run dev:backend

# Web Dashboard
npm run dev:web

# Mobile App
npm run dev:mobile
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:cov
```

## 📝 Estructura del Proyecto

```
fitmaster/
├── apps/
│   ├── backend/          # API NestJS
│   ├── web/              # Dashboard Next.js
│   └── mobile/           # App React Native
├── packages/
│   └── shared/           # Código compartido (tipos, utils)
├── .kiro/
│   └── specs/            # Especificaciones del proyecto
└── package.json
```

## 🔐 Variables de Entorno

Ver archivos `.env.example` en cada aplicación para configuración requerida.

## 📖 Documentación

- [Especificaciones del Proyecto](.kiro/specs/fitmaster/)
- [API Documentation](apps/backend/README.md)
- [Web Dashboard](apps/web/README.md)
- [Mobile App](apps/mobile/README.md)

## 🤝 Contribución

Este proyecto sigue la metodología de desarrollo basada en especificaciones. Ver `.kiro/specs/fitmaster/` para más detalles.

## 📄 Licencia

Propietario - Todos los derechos reservados
