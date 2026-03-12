# FitMaster - Sistema de Diseño

## Paleta de Colores

### Colores Principales
- **Blanco**: `#FFFFFF` - Fondos principales, texto sobre fondos oscuros
- **Gris Hueso**: `#F1F2F6` - Fondos secundarios, áreas de contenido
- **Gris Oscuro**: `#212121` - Texto principal, elementos oscuros
- **Verde Neón**: `#C1EF00` - Acentos, CTAs, elementos interactivos

### Colores de Soporte
- **Gris Medio**: `#6B7280` - Texto secundario
- **Gris Claro**: `#E5E7EB` - Bordes, divisores
- **Verde Hover**: `#A8D600` - Estado hover del verde neón
- **Verde Oscuro**: `#8FB800` - Estado activo del verde neón

## Tipografía

### Fuente Principal
- **Inter** - Sans-serif moderna y legible
- Pesos: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Jerarquía de Texto
- **H1**: 2.5rem (40px) - Bold - Títulos principales
- **H2**: 2rem (32px) - Bold - Títulos de sección
- **H3**: 1.5rem (24px) - Semibold - Subtítulos
- **Body Large**: 1.125rem (18px) - Regular - Texto destacado
- **Body**: 1rem (16px) - Regular - Texto principal
- **Body Small**: 0.875rem (14px) - Regular - Texto secundario
- **Caption**: 0.75rem (12px) - Regular - Etiquetas, notas

## Componentes

### Botones

#### Botón Primario (Verde Neón)
- Fondo: `#C1EF00`
- Texto: `#212121`
- Hover: `#A8D600`
- Active: `#8FB800`
- Padding: 12px 24px
- Border-radius: 8px
- Font-weight: 600

#### Botón Secundario
- Fondo: Transparente
- Borde: 2px solid `#212121`
- Texto: `#212121`
- Hover: Fondo `#F1F2F6`
- Padding: 12px 24px
- Border-radius: 8px

#### Botón Ghost
- Fondo: Transparente
- Texto: `#6B7280`
- Hover: Fondo `#F1F2F6`
- Padding: 8px 16px

### Inputs

#### Input de Texto
- Fondo: `#FFFFFF`
- Borde: 1px solid `#E5E7EB`
- Texto: `#212121`
- Placeholder: `#6B7280`
- Focus: Borde `#C1EF00`, Shadow verde suave
- Padding: 12px 16px
- Border-radius: 8px
- Height: 48px

#### Input con Icono
- Icono a la izquierda o derecha
- Color icono: `#6B7280`
- Padding ajustado para el icono

### Cards

#### Card Principal
- Fondo: `#FFFFFF`
- Borde: 1px solid `#E5E7EB`
- Border-radius: 12px
- Padding: 24px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)

#### Card Hover
- Shadow: 0 4px 6px rgba(0,0,0,0.1)
- Transición suave

### Logo

#### Especificaciones
- Texto: "FitMaster"
- Color: `#212121`
- Acento: Punto verde neón `#C1EF00` después de "Fit"
- Font-weight: 700
- Font-size: 32px

## Páginas de Autenticación

### Login / Register

#### Estructura
1. **Logo** - Centrado arriba
2. **Título de Bienvenida** - "Bienvenido" o "Crear cuenta"
3. **Subtítulo** - "Inserte los detalles de su cuenta"
4. **Formulario**
   - Input de Email con icono
   - Input de Contraseña con icono de ojo
   - Checkbox "Recordarme" (opcional)
   - Link "¿Olvidaste tu contraseña?"
5. **Botón Principal** - "Iniciar sesión" / "Crear cuenta"
6. **Divider** - "o"
7. **Link Alternativo** - "¿No tienes cuenta? Regístrate"

#### Layout
- Fondo: `#F1F2F6`
- Card centrado: Max-width 440px
- Padding: 40px
- Espaciado entre elementos: 24px

## Espaciado

### Sistema de Espaciado (múltiplos de 4px)
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

## Iconos

### Librería
- **Lucide React** - Iconos modernos y consistentes
- Tamaño por defecto: 20px
- Color por defecto: `#6B7280`
- Stroke-width: 2

### Iconos Comunes
- Email: Mail
- Contraseña: Lock
- Ojo abierto: Eye
- Ojo cerrado: EyeOff
- Usuario: User
- Gimnasio: Dumbbell
- Dashboard: LayoutDashboard
- Clientes: Users
- Rutinas: ClipboardList
- Pagos: CreditCard

## Animaciones

### Transiciones
- Duración estándar: 200ms
- Easing: ease-in-out
- Hover: transform scale(1.02)
- Focus: outline con color verde neón

### Loading States
- Spinner: Verde neón `#C1EF00`
- Skeleton: Gris claro `#E5E7EB`

## Responsive

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Adaptaciones Mobile
- Padding reducido: 24px → 16px
- Font-size reducido: -2px en títulos
- Cards full-width con margin 16px

## Accesibilidad

### Contraste
- Texto principal sobre blanco: Ratio 7:1 ✓
- Verde neón sobre blanco: Ratio 4.5:1 ✓
- Texto sobre verde neón: Usar gris oscuro `#212121`

### Focus States
- Outline visible: 2px solid `#C1EF00`
- Offset: 2px

### ARIA Labels
- Todos los inputs con labels
- Botones con texto descriptivo
- Iconos decorativos con aria-hidden="true"

## Mejores Prácticas

1. **Consistencia**: Usar siempre los mismos espaciados y colores
2. **Jerarquía Visual**: Usar tamaños y pesos de fuente apropiados
3. **Feedback Visual**: Siempre mostrar estados (hover, active, disabled)
4. **Microinteracciones**: Transiciones suaves en todos los elementos interactivos
5. **Responsive First**: Diseñar primero para mobile
6. **Accesibilidad**: Cumplir con WCAG 2.1 AA mínimo
