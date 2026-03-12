# FitMaster Mobile App (Expo)

Aplicación móvil para clientes de gimnasios construida con Expo y React Native.

## Stack Tecnológico

- **Framework**: Expo SDK 50
- **Router**: Expo Router
- **State Management**: TanStack Query
- **HTTP Client**: Axios
- **Storage**: Expo SecureStore
- **Media**: Expo Image Picker, Expo AV

## Desarrollo

### Requisitos Previos

- Node.js >= 18
- Expo CLI: `npm install -g expo-cli`
- Expo Go app en tu dispositivo móvil (opcional)

### Instalación

```bash
# Instalar dependencias
npm install
```

### Ejecutar

```bash
# Iniciar Expo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS (solo macOS)
npm run ios

# Ejecutar en web
npm run web
```

## Variables de Entorno

Copia `.env.example` a `.env` y configura:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Nota**: 
- Para Android emulator usa `http://10.0.2.2:3000`
- Para dispositivo físico usa la IP de tu computadora: `http://192.168.x.x:3000`

## Escanear QR

Puedes escanear el código QR con la app Expo Go para probar en tu dispositivo físico sin necesidad de compilar.
