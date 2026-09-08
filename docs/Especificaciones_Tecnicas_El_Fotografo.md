# Especificaciones Técnicas
## Sistema de Pedidos y Control de Ventas — "El Fotógrafo"

**Versión:** 1.0
**Fecha:** 2 de septiembre de 2026
**Destinado a:** Implementación por agente de código autónomo (opencode)
**Documento base:** Especificaciones_Funcionales_El_Fotografo.md (v1.0)

> Este documento traduce las especificaciones funcionales en decisiones técnicas concretas. Toda decisión que en un proyecto normal quedaría a criterio del desarrollador está explicitada aquí para que el agente no tenga que inferir ni improvisar.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript |
| Estilos | Tailwind CSS + shadcn/ui (librería de componentes) |
| Iconos | lucide-react |
| Tema (claro/oscuro/sistema) | next-themes |
| Base de datos | PostgreSQL vía Supabase (capa gratuita) |
| Backend | API Routes / Server Actions de Next.js (sin servicio separado) |
| Autenticación | Sistema propio con PIN numérico (no se usa Supabase Auth) |
| Generación de PDF | `@react-pdf/renderer` |
| Hosting | Vercel (capa gratuita) |
| PWA / caché offline | `next-pwa` (o equivalente) con Service Worker |

**Costo mensual estimado:** $0, dentro de los límites gratuitos de Supabase y Vercel.

## 2. Arquitectura general

Aplicación web monolítica (Next.js) con las siguientes capas:

```
Cliente (navegador, PWA) 
   ↓ HTTPS
Next.js Server (API Routes / Server Actions) — corre en Vercel
   ↓ conexión con service role key (solo servidor, nunca expuesta al cliente)
Supabase (PostgreSQL)
```

**Decisión clave:** todas las escrituras y lecturas sensibles pasan por el servidor de Next.js, nunca directo del navegador a Supabase. Row Level Security (RLS) en Supabase se configura en modo restrictivo (deny-all a nivel público), y el servidor usa la `service_role key` para operar. Esto simplifica la seguridad: no hay que mantener políticas RLS complejas por rol, la lógica de permisos vive en el servidor Next.js.

## 3. Modelo de datos

### 3.1 `users`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| role | enum: `owner`, `manager`, `waiter` | `owner` y `manager` (encargado de confianza) tienen el mismo nivel de permisos funcionales; se separan como roles distintos solo para fines de auditoría (saber quién hizo qué) |
| pin_hash | text | PIN de 4-6 dígitos, hasheado con bcrypt, nunca almacenado en texto plano |
| active | boolean | default true; permite desactivar un usuario sin borrar su historial |
| created_at | timestamptz | |

### 3.2 `products`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| category | enum: `licor`, `cerveza`, `snack`, `otro` | |
| price | numeric(10,2) | |
| active | boolean | default true; "eliminar" un producto = desactivarlo, para no romper el historial de ventas pasadas |
| created_at | timestamptz | |

### 3.3 `tables` (mesas)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| label | text | ej. "Mesa 1"; configurable por el dueño/encargado |
| active | boolean | default true |

### 3.4 `orders` (cuentas / pedidos)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| type | enum: `mesa`, `directo` | |
| table_id | uuid, FK → tables, nullable | null si `type = directo` |
| status | enum: `open`, `closed`, `cancelled` | |
| opened_by | uuid, FK → users | |
| opened_at | timestamptz | |
| closed_at | timestamptz, nullable | |
| payment_method | enum: `efectivo`, `tarjeta`, `transferencia`, `otro`, nullable | se define al cerrar |
| total | numeric(10,2) | calculado al cerrar, a partir de `order_items` |

### 3.5 `order_items`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| order_id | uuid, FK → orders | |
| product_id | uuid, FK → products | |
| quantity | integer | |
| unit_price | numeric(10,2) | **snapshot** del precio al momento de agregarlo (si el precio del producto cambia después, no debe afectar ventas pasadas) |
| notes | text, nullable | ej. "sin hielo" |

**Regla de negocio:** una mesa (`table_id`) solo puede tener **una orden `open` a la vez**. Antes de abrir una nueva orden en una mesa, verificar que no exista otra abierta.

## 4. Autenticación y sesiones

- Login mediante **PIN numérico** (4-6 dígitos) en un teclado numérico en pantalla, sin usuario ni contraseña.
- Flujo: el usuario selecciona su nombre/avatar de una lista (o escribe el PIN directamente) → el servidor valida el PIN contra `pin_hash` → si es válido, se genera una sesión (cookie httpOnly firmada, ej. con `iron-session` o JWT propio) con `user_id` y `role`.
- Sesión con expiración razonable (ej. 12 horas) pensada para turnos de trabajo, no para sesiones persistentes de días.
- Todas las rutas protegidas del servidor deben validar la sesión y el rol antes de ejecutar la operación (no confiar en validaciones del cliente).

## 5. Roles y permisos (matriz de control de acceso)

| Acción | Owner / Manager | Waiter |
|---|---|---|
| Tomar pedidos (mesa y directo) | ✅ | ✅ |
| Cerrar/cobrar cuenta | ✅ | ✅ |
| Ver reportes de ventas | ✅ | ❌ |
| Gestionar catálogo de productos | ✅ | ❌ |
| Gestionar mesas | ✅ | ❌ |
| Dar de alta/baja usuarios | ✅ | ❌ |

## 6. Pantallas / rutas de la aplicación

| Ruta | Descripción | Acceso |
|---|---|---|
| `/login` | Ingreso por PIN | Todos |
| `/` (home) | Redirige según rol: mapa de mesas (waiter) o dashboard (owner/manager) | Autenticado |
| `/mesas` | Vista tipo grid de todas las mesas, con color según estado (libre/ocupada) | Todos |
| `/mesas/[id]` | Detalle de la cuenta de una mesa: agregar productos, ver acumulado, cerrar cuenta | Todos |
| `/venta-directa` | Pantalla de venta rápida (mostrador/para llevar) | Todos |
| `/cobro/[orderId]` | Selección de método de pago y confirmación de cierre | Todos |
| `/recibo/[orderId]` | Vista de recibo + botón de descarga en PDF | Todos |
| `/productos` | CRUD de catálogo de productos | Owner/Manager |
| `/mesas/configuracion` | CRUD de mesas (agregar, renombrar, desactivar) | Owner/Manager |
| `/usuarios` | CRUD de usuarios y asignación de PIN | Owner/Manager |
| `/reportes` | Reportes de ventas (día/semana/mes) y productos más vendidos | Owner/Manager |

## 7. Reportes

- **Ventas por período:** filtro rápido (hoy / esta semana / este mes) con suma de `total` de órdenes `closed` en el rango, agrupado por día.
- **Productos más vendidos:** suma de `quantity` por `product_id` en el rango seleccionado, ordenado descendente.
- Los reportes se calculan con consultas agregadas directas a la base de datos (no requieren un motor de analítica adicional dado el volumen bajo esperado).

## 8. Generación de recibo/ticket (PDF)

- Al cerrar una cuenta, se genera un recibo con: nombre del negocio, fecha/hora, número de mesa (si aplica), detalle de productos con cantidad y precio, total, método de pago.
- Se renderiza con `@react-pdf/renderer` en el servidor y se ofrece como descarga. No se requiere impresora térmica en esta fase (queda documentado como posible fase 2, según especificación funcional).

## 9. Estrategia offline (modo consulta)

Dado que la caída de internet es **rara** y solo se requiere **consultar** (no operar) sin conexión:

- La aplicación se implementa como **PWA** (Progressive Web App) con Service Worker.
- Se cachea localmente (IndexedDB o Cache API) la última vista conocida de: estado de mesas y sus cuentas abiertas (solo lectura).
- Si no hay conexión, la app muestra un banner indicando "Sin conexión — mostrando última información disponible" y deshabilita las acciones de escritura (agregar producto, cobrar, etc.) hasta recuperar la señal.
- **No se implementa** sincronización de escrituras offline ni resolución de conflictos, ya que no es un requerimiento (ver especificación funcional, sección de decisiones).

## 10. Estructura de proyecto sugerida

```
/app
  /login
  /(protected)
    /mesas
      /[id]
      /configuracion
    /venta-directa
    /cobro/[orderId]
    /recibo/[orderId]
    /productos
    /usuarios
    /reportes
  /api
    /auth
    /orders
    /products
    /tables
    /users
    /reports
/lib
  /supabase (cliente server-side con service role)
  /auth (validación de PIN, manejo de sesión)
  /pdf (generación de recibo)
/components
```

## 11. Requerimientos no funcionales

- **Responsive:** todas las pantallas deben verse y usarse correctamente en celular, tablet y computadora.
- **Concurrencia:** el estado de mesas y cuentas debe reflejarse casi en tiempo real entre dispositivos (usar Supabase Realtime o polling corto, ej. cada 5-10 segundos, como alternativa más simple si el agente lo considera suficiente).
- **Seguridad:** ningún PIN se almacena ni se transmite en texto plano; toda comunicación vía HTTPS (garantizado por Vercel).
- **Costo:** la solución debe mantenerse dentro de las capas gratuitas de Supabase y Vercel para el volumen de uso descrito (negocio pequeño, menos de 30 productos, pocas mesas).

## 12. Fuera de alcance (recordatorio, ver especificación funcional)

- Control de inventario
- Impresión física automatizada
- Propinas
- Corte de caja formal
- Sincronización offline de escrituras

---

*Este documento debe leerse junto con Especificaciones_Funcionales_El_Fotografo.md. Ante cualquier ambigüedad no cubierta aquí, el agente debe priorizar la opción más simple que cumpla el requerimiento funcional, evitando dependencias o costos adicionales.*
