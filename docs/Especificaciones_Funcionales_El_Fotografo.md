# Especificaciones Funcionales
## Sistema de Pedidos y Control de Ventas — "El Fotógrafo" (Bar y Licorería)

**Versión:** 1.0
**Fecha:** 2 de septiembre de 2026
**Estado:** Borrador para revisión

---

## 1. Objetivo del proyecto

Diseñar e implementar un sistema que permita al negocio familiar **El Fotógrafo** (bar y licorería) tomar pedidos, gestionar mesas, cobrar ventas y llevar un control claro de lo que se vende. Actualmente el negocio no cuenta con ningún sistema, por lo que este proyecto parte desde cero.

## 2. Alcance del negocio

El negocio opera bajo un **modelo híbrido**:

- **Licorería / tienda:** venta directa para llevar (licor, cervezas, snacks, etc.)
- **Bar:** consumo en mesas dentro del local

El sistema debe soportar ambos flujos de venta desde una misma plataforma.

## 3. Usuarios del sistema

| Rol | Descripción | Cantidad estimada de usuarios simultáneos |
|---|---|---|
| Dueño/a (padres) | Acceso completo: ventas, reportes, catálogo, configuración, alta de usuarios | 1-2 |
| Encargado de confianza | Mismo nivel que el dueño en cuanto a poder dar de alta nuevos usuarios/empleados; a definir si tiene acceso completo o limitado a otras secciones | 0-1 |
| Mesero/Empleado | Solo toma de pedidos y cobro | 1-2 |

**Total de usuarios concurrentes esperado:** 2 a 3 personas.

## 4. Dispositivos y plataforma

- El sistema debe funcionar tanto en **celular/tablet** como en **computadora**, de forma responsiva.
- El negocio cuenta con **internet estable**, por lo que se puede optar por una solución **basada en la nube** (los datos se sincronizan entre dispositivos en tiempo real).

## 5. Requerimientos funcionales

### 5.1 Toma de pedidos

- **Pedido por mesa:** el mesero abre una "cuenta" asociada a un número de mesa, agrega productos conforme se van pidiendo, y la cuenta permanece abierta hasta que el cliente pide la cuenta y se cierra/cobra.
- El número de mesas debe ser **configurable**: el dueño/encargado puede definir cuántas mesas hay y editarlas (agregar, quitar o renombrar) según cambie la distribución del local.
- **Pedido directo (mostrador/para llevar):** venta rápida sin asignar mesa, para clientes de la licorería que compran y se van.
- El sistema debe permitir alternar entre ambos flujos según el caso.
- Cada pedido debe permitir: agregar/quitar productos, modificar cantidades, y agregar notas simples (ej. "sin hielo").

### 5.2 Catálogo de productos

- Registro de productos con: nombre, categoría (licor, cerveza, snack, etc.), precio.
- Catálogo inicial pequeño (menos de 30 productos), por lo que la gestión debe ser simple, sin necesidad de funciones avanzadas de categorización.
- Debe permitir agregar, editar o desactivar productos fácilmente desde el rol de dueño.

### 5.3 Cobro y métodos de pago

- Registrar el cobro de cada pedido/cuenta.
- Debe soportar múltiples métodos de pago (efectivo, tarjeta, transferencia/digital), dejando el método registrado como flexible, ya que el negocio podría usar distintas combinaciones.
- Permitir cerrar una cuenta de mesa generando el cobro total (suma de todos los productos agregados).
- **No se contempla manejo de propinas** en esta versión.

### 5.4 Recibos / tickets

- Generar un ticket o recibo (digital o para imprimir) al cerrar una venta, con el detalle de productos, cantidades, total y forma de pago.
- No es indispensable una impresora física en esta primera versión; puede evaluarse un recibo digital o compatible con impresoras térmicas comunes en una fase posterior.

### 5.5 Reportes de ventas

- Reporte de ventas del **día**, **semana** y **mes**.
- Reporte de **productos más vendidos**.
- Los reportes deben ser visibles únicamente para el rol de dueño.

### 5.6 Roles y permisos

- **Dueño/a:** acceso completo (ventas, reportes, catálogo de productos, configuración del sistema, alta de usuarios).
- **Encargado de confianza:** también puede dar de alta nuevos usuarios/empleados. Se recomienda validar en la etapa de diseño si tendrá el mismo nivel de acceso que el dueño o uno intermedio (ej. sin ver reportes financieros completos).
- **Mesero/Empleado:** acceso limitado a tomar pedidos y procesar cobros; sin acceso a reportes ni configuración.
- El sistema debe tener un mecanismo simple de inicio de sesión por usuario/rol.

## 6. Requerimientos no funcionales

- **Conectividad:** solución basada en la nube, aprovechando que el local cuenta con internet estable.
- **Multiplataforma:** debe verse y funcionar bien tanto en dispositivos móviles como en computadora.
- **Multiusuario:** debe soportar 2-3 usuarios trabajando al mismo tiempo sin conflictos (ej. dos meseros tomando pedidos de mesas distintas simultáneamente).
- **Simplicidad de uso:** dado que lo usarán los padres y posiblemente empleados sin experiencia técnica, la interfaz debe ser clara e intuitiva.

## 7. Fuera de alcance en esta primera versión (posible fase 2)

- **Control de inventario detallado** (existencias por producto): se marcó como *importante pero no urgente*. Se recomienda dejarlo para una segunda fase, una vez que el sistema base de ventas esté funcionando y validado.
- Integración con pasarelas de pago electrónico.
- Impresión física automatizada de tickets (se puede evaluar más adelante).

## 8. Fases sugeridas

**Fase 1 — MVP (Producto Mínimo Viable)**
1. Catálogo básico de productos
2. Toma de pedidos por mesa y pedido directo
3. Cobro con métodos de pago flexibles
4. Generación de recibo/ticket
5. Roles: dueño vs. mesero
6. Reportes de ventas (día/semana/mes) y productos más vendidos

**Fase 2 — Mejoras futuras**
1. Control de inventario y alertas de stock bajo
2. Impresión física de tickets
3. Reportes más avanzados (ganancias, comparativas por periodo)
4. Posibles integraciones de pago digital
5. Corte de caja formal al cierre del día (cuadre de efectivo/métodos de pago vs. lo registrado en el sistema)

---

*Este documento es la base para el diseño técnico y desarrollo del sistema.*
