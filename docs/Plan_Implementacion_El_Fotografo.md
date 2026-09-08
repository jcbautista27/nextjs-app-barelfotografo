# Plan de Implementación
## Sistema de Pedidos y Control de Ventas — "El Fotógrafo"

**Versión:** 1.0
**Fecha:** 2 de septiembre de 2026
**Destinado a:** Agente de código autónomo (opencode)
**Documentos base:** Especificaciones_Funcionales_El_Fotografo.md · Especificaciones_Tecnicas_El_Fotografo.md

> Este documento define el **orden** en que debe construirse el sistema. Cada etapa debe quedar funcional y verificable antes de pasar a la siguiente. No avanzar a una etapa nueva si la anterior tiene errores pendientes.

---

## Etapa 0 — Configuración base del proyecto

1. Crear proyecto Next.js 14+ (App Router) con TypeScript y Tailwind CSS.
2. Crear proyecto en Supabase y obtener credenciales (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Configurar variables de entorno (`.env.local`) y `.env.example` como plantilla.
4. Crear las tablas de la base de datos según el modelo de datos de la especificación técnica (sección 3): `users`, `products`, `tables`, `orders`, `order_items`.
5. Configurar RLS en modo restrictivo (deny-all público) en Supabase, según lo indicado en la especificación técnica.
6. Verificación de la etapa: el proyecto corre localmente (`npm run dev`) y puede leer/escribir de prueba en Supabase desde una API route simple.

**Criterios de aceptación:**
- Un cliente sin credenciales (ej. `curl` directo a Supabase con la `anon key`) no puede leer ni escribir ninguna tabla — confirma que el RLS deny-all está activo.
- Todas las tablas tienen sus foreign keys correctamente creadas (`table_id`, `product_id`, `order_id`, `opened_by` no deben permitir referencias a IDs inexistentes).

## Etapa 1 — Autenticación por PIN

1. Implementar pantalla `/login` con teclado numérico.
2. Implementar endpoint de validación de PIN (hash con bcrypt) y creación de sesión (cookie httpOnly).
3. Implementar middleware/protección de rutas: redirigir a `/login` si no hay sesión válida.
4. Crear un usuario `owner` inicial (seed) para poder probar el login.
5. Verificación de la etapa: se puede iniciar sesión con el PIN del usuario semilla y se es redirigido correctamente; rutas protegidas rechazan acceso sin sesión.

**Criterios de aceptación:**
- Un PIN incorrecto muestra un mensaje de error y NO revela si el usuario existe o no (evitar enumeración de usuarios).
- El `pin_hash` nunca se envía al cliente en ninguna respuesta de API (verificar el payload de red, no solo la pantalla).
- La sesión expira correctamente pasado el tiempo definido (12 horas) y obliga a volver a loguearse.

## Etapa 2 — Gestión de catálogo, mesas y usuarios (CRUD base)

1. Pantalla `/productos`: crear, editar, desactivar productos.
2. Pantalla `/mesas/configuracion`: crear, renombrar, desactivar mesas.
3. Pantalla `/usuarios`: crear usuarios, asignar rol y PIN, desactivar usuarios.
4. Todas estas pantallas restringidas a rol `owner`/`manager` (ver matriz de permisos en especificación técnica).
5. Verificación de la etapa: un usuario `owner` puede dar de alta al menos 3 productos, 2 mesas y 1 usuario `waiter`; un usuario `waiter` no puede acceder a estas pantallas.

**Criterios de aceptación:**
- Desactivar un producto (`active = false`) lo oculta de las pantallas de toma de pedidos, pero NO borra ni afecta ventas históricas donde ya se usó.
- Un usuario `waiter` que intenta acceder directamente a la URL `/productos`, `/usuarios` o `/mesas/configuracion` (sin pasar por un link) es redirigido o rechazado por el servidor, no solo ocultando el botón en la interfaz.
- No se puede crear dos usuarios con el mismo PIN (o, si se permite, el sistema debe advertirlo — definir explícitamente cuál de las dos reglas se implementa).

## Etapa 3 — Toma de pedidos (núcleo funcional)

1. Pantalla `/mesas`: grid de mesas con estado visual (libre / ocupada).
2. Pantalla `/mesas/[id]`: abrir cuenta, agregar/quitar productos, modificar cantidades, agregar notas.
3. Regla de negocio: no permitir dos órdenes `open` simultáneas en la misma mesa.
4. Pantalla `/venta-directa`: flujo de venta rápida sin mesa asignada.
5. Verificación de la etapa: se puede abrir una mesa, agregar 3 productos distintos, y el total se calcula correctamente; se puede hacer una venta directa de principio a fin.

**Criterios de aceptación:**
- Intentar abrir una segunda cuenta en una mesa que ya tiene una `open` debe bloquearse con un mensaje claro, no crear una segunda orden silenciosamente.
- Si el precio de un producto se edita en `/productos` DESPUÉS de haber sido agregado a una cuenta abierta, el item ya agregado conserva su `unit_price` original (snapshot), no el precio nuevo.
- El total mostrado en pantalla en todo momento debe ser exactamente la suma de `quantity × unit_price` de todos los `order_items` de esa orden — sin redondeos inconsistentes.

## Etapa 4 — Cobro y recibo

1. Pantalla `/cobro/[orderId]`: selección de método de pago y confirmación de cierre de cuenta.
2. Al cerrar, calcular y guardar `total` en la orden, cambiar `status` a `closed`.
3. Pantalla `/recibo/[orderId]`: vista del recibo y generación/descarga en PDF (`@react-pdf/renderer`).
4. Verificación de la etapa: se puede cerrar una cuenta abierta en la Etapa 3, seleccionar método de pago, y descargar un PDF con el detalle correcto.

**Criterios de aceptación:**
- Una orden `closed` no puede volver a editarse (no se pueden agregar/quitar productos ni reabrirla desde la interfaz).
- El `total` guardado en la orden al cerrarla debe coincidir exactamente (al centavo) con la suma de sus `order_items`.
- El PDF generado refleja los mismos datos que se muestran en pantalla (mismos productos, cantidades, precios y total) — no se regenera con datos distintos.
- Al cerrar una cuenta de mesa, la mesa vuelve a mostrarse como "libre" en la pantalla `/mesas`.

## Etapa 5 — Reportes

1. Pantalla `/reportes`: filtro por día / semana / mes.
2. Cálculo de ventas totales por período.
3. Cálculo de productos más vendidos por período.
4. Restringido a rol `owner`/`manager`.
5. Verificación de la etapa: con al menos 5 ventas cerradas de prueba, el reporte muestra totales y ranking de productos coherentes con los datos ingresados.

**Criterios de aceptación:**
- Los reportes solo consideran órdenes con `status = closed` (una orden `open` o `cancelled` no debe sumarse a las ventas).
- El filtro "hoy" respeta la zona horaria local del negocio, no UTC (una venta a las 11pm no debe aparecer en el día siguiente por error de zona horaria).
- El total del reporte de un período debe coincidir exactamente con la suma manual de los totales de las órdenes cerradas en ese rango (verificar con un cálculo de control).

## Etapa 6 — Responsividad y PWA (modo consulta offline)

1. Revisar y ajustar todas las pantallas para verse correctamente en celular, tablet y escritorio.
2. Configurar la app como PWA (manifest + Service Worker).
3. Implementar caché de solo lectura del estado de mesas/cuentas abiertas.
4. Implementar banner de "sin conexión" que deshabilite acciones de escritura.
5. Verificación de la etapa: al desconectar internet, la app muestra el último estado conocido de las mesas y bloquea intentos de escritura, sin errores no controlados.

## Etapa 7 — Pulido final

1. Revisión general de estados vacíos, mensajes de error y confirmaciones (ej. "¿Seguro que deseas cerrar esta cuenta?").
2. Revisión de que ningún dato sensible (PIN en texto plano, claves) quede expuesto en el cliente.
3. Despliegue a Vercel y conexión con el proyecto de Supabase de producción.
4. Verificación de la etapa: flujo completo de principio a fin (login → tomar pedido → cobrar → ver recibo → ver reporte) funcionando en el ambiente desplegado.

---

## Notas para el agente

- No se debe avanzar a la siguiente etapa si la actual no pasa su verificación.
- Ante cualquier ambigüedad no cubierta en los documentos base, priorizar la opción más simple que cumpla el requerimiento, evitando dependencias o costos adicionales (ver especificación técnica, sección 12 y nota final).
- Las etapas 0 a 5 constituyen el MVP funcional mínimo. Las etapas 6 y 7 son de robustez y pulido, pero igual de necesarias antes de considerar el proyecto listo para uso real en el negocio.
