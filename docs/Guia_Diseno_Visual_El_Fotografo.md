# Guía de Diseño Visual
## Sistema de Pedidos y Control de Ventas — "El Fotógrafo"

**Versión:** 1.0
**Fecha:** 2 de septiembre de 2026
**Destinado a:** Agente de código autónomo (opencode)

---

## 1. Identidad de marca

- **Nombre:** El Fotógrafo — Pisco Puro de Ica · Desde 1991
- **Logo:** ícono lineal minimalista que combina una cámara fotográfica con una copa de pisco, en trazo monocromático (sin relleno de color). Este estilo de trazo simple es una ventaja: se adapta bien tanto a fondo claro como oscuro con un solo color (técnica de "currentColor" en SVG).
- **Tono de marca:** artesanal, con historia (más de 30 años), cálido — no debe verse como una app genérica de punto de venta; debe sentirse propia del negocio.

**Nota de implementación:** ya se cuenta con una versión **SVG vectorial** del logo (`logo_blanco.svg`). Debe usarse inline en el HTML (no como `<img>`) con `fill="currentColor"` en el `<g>` principal, para que herede el color del tema automáticamente vía CSS (`color: var(--foreground)`), sin necesidad de mantener versiones separadas para modo claro/oscuro. El SVG es el lockup completo (ícono + texto + tagline) en un solo trazo — para espacios reducidos (ej. barra superior), usar solo el texto "El Fotógrafo" en su lugar; reservar el logo completo para pantallas con más espacio (login, recibo).

## 2. Paleta de colores

Inspirada en el pisco (destilado de uva) y el desierto de Ica: tonos cálidos, terrosos, con un acento cobrizo/ámbar que evoca el color del pisco añejado y la calidez del desierto, sobre una base neutra que funciona tanto en modo claro como oscuro.

### Modo oscuro (por defecto recomendado — uso nocturno típico de un bar)

| Variable (shadcn) | Uso | Valor aprox. |
|---|---|---|
| `background` | Fondo general | `#141210` (carbón cálido, casi negro) |
| `foreground` | Texto principal | `#F2EBE3` (blanco hueso cálido) |
| `primary` | Acciones principales, botones clave | `#C17817` (cobre/ámbar, tono pisco) |
| `primary-foreground` | Texto sobre `primary` | `#141210` |
| `muted` | Fondos secundarios, tarjetas | `#211D19` |
| `border` | Bordes, separadores | `#332C25` |
| `destructive` | Acciones de eliminar/cancelar | `#B94A3D` (rojo terracota, no rojo puro) |

### Modo claro

| Variable (shadcn) | Uso | Valor aprox. |
|---|---|---|
| `background` | Fondo general | `#FAF6F0` (crema/arena) |
| `foreground` | Texto principal | `#211D19` |
| `primary` | Acciones principales | `#A8630F` (cobre, ligeramente más oscuro para contraste en fondo claro) |
| `primary-foreground` | Texto sobre `primary` | `#FAF6F0` |
| `muted` | Fondos secundarios, tarjetas | `#F0E8DC` |
| `border` | Bordes, separadores | `#DDD2C2` |
| `destructive` | Acciones de eliminar/cancelar | `#A8402F` |

### Colores de estado (iguales en ambos temas, para consistencia funcional)

| Estado | Color | Uso |
|---|---|---|
| Mesa libre | Verde suave `#5B9279` | Indicador visual en grid de mesas |
| Mesa ocupada | Ámbar `#C17817` (= `primary`) | Indicador visual en grid de mesas |
| Cuenta cerrada / confirmación exitosa | Verde `#5B9279` | Mensajes de éxito |
| Alerta / cancelación | Terracota `#B94A3D` (= `destructive`) | Confirmaciones destructivas |

## 3. Tipografía

- Fuente sans-serif geométrica y legible (ej. **Inter**, ya compatible por defecto con shadcn/ui), para máxima legibilidad en pantallas pequeñas y con poca luz.
- Los títulos de sección pueden usar mayor peso (semibold/bold) para reforzar el carácter robusto del logo (que usa letras condensadas en mayúsculas).

## 4. Selector de tema (claro / oscuro / sistema)

- Implementar con `next-themes`, con tres opciones: **Claro**, **Oscuro**, **Sistema** (sigue la preferencia del dispositivo).
- Debe representarse como un **ícono** (no un texto ni switch tradicional) ubicado en un lugar consistente de la interfaz (ej. barra superior), usando iconografía de `lucide-react`:
  - Ícono de sol (`Sun`) para modo claro
  - Ícono de luna (`Moon`) para modo oscuro
  - Ícono de monitor (`Monitor`) para modo sistema
- Al hacer clic, debe desplegar las 3 opciones (ej. mediante un `DropdownMenu` de shadcn/ui) en lugar de solo alternar entre 2 estados.
- La preferencia de tema debe persistir entre sesiones (guardada en `localStorage`, comportamiento por defecto de `next-themes`).
- **Por defecto:** modo Sistema, dado que el negocio puede usarse en distintos momentos del día y con distintos dispositivos.

## 5. Componentes (shadcn/ui)

Usar los componentes de shadcn/ui como base para toda la interfaz, evitando construir componentes desde cero cuando exista un equivalente en la librería. Componentes clave esperados para este sistema:

- `Button`, `Card`, `Dialog` (confirmaciones, ej. cerrar cuenta), `DropdownMenu` (selector de tema, menú de usuario), `Input` / `NumberInput` (cantidades), `Badge` (estado de mesas), `Table` (reportes), `Toast`/`Sonner` (confirmaciones de acciones como "producto agregado").

## 6. Aplicación del logo en la interfaz

- Header/barra superior: logo en tamaño reducido (solo el ícono cámara+copa, sin el texto completo) junto al nombre del sistema, adaptado al color de `foreground` según el tema activo.
- Pantalla de login: logo completo (ícono + texto + tagline), centrado, como elemento principal de bienvenida.
- Recibos (PDF): logo completo en la parte superior del recibo, en su versión clara u oscura según corresponda a un documento imprimible (usualmente fondo claro).

---

*Esta guía debe usarse junto con las especificaciones funcionales y técnicas. Cualquier color o componente no cubierto aquí debe resolverse manteniendo la coherencia con esta paleta y el uso de shadcn/ui como sistema de diseño base.*
