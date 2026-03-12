# FitMaster Web Dashboard

Dashboard web para administración de gimnasios construido con Next.js 14.

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **State Management**: TanStack Query
- **HTTP Client**: Axios
- **Charts**: Recharts

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

El dashboard estará disponible en `http://localhost:3001`

## Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```
