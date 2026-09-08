-- ============================================================
-- El Fotógrafo — Esquema inicial (Etapa 0)
-- Base: Especificaciones_Tecnicas_El_Fotografo.md, sección 3.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Es idempotente (se puede re-ejecutar sin romper nada).
-- ============================================================

-- ---------- Tipos enum ----------
do $$
begin
  create type user_role as enum ('owner', 'manager', 'waiter');
exception when duplicate_object then null; end $$;

do $$
begin
  create type product_category as enum ('licor', 'cerveza', 'snack', 'otro');
exception when duplicate_object then null; end $$;

do $$
begin
  create type order_type as enum ('mesa', 'directo');
exception when duplicate_object then null; end $$;

do $$
begin
  create type order_status as enum ('open', 'closed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$
begin
  create type payment_method as enum ('efectivo', 'tarjeta', 'transferencia', 'otro');
exception when duplicate_object then null; end $$;

-- ---------- users ----------
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        public.user_role not null,
  pin_hash    text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.users is
  'Usuarios del sistema. El PIN nunca se guarda en texto plano (bcrypt). Desactivar en vez de borrar.';

-- ---------- products ----------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    public.product_category not null,
  price       numeric(10,2) not null check (price >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.products is
  'Catálogo de productos. Desactivar (active = false) en vez de borrar para no romper el historial de ventas.';

-- ---------- tables ----------
create table if not exists public.tables (
  id      uuid primary key default gen_random_uuid(),
  label   text not null,
  active  boolean not null default true
);

comment on table public.tables is
  'Mesas del local. Cantidad y nombres configurables por el dueño/encargado.';

-- ---------- orders ----------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  type            public.order_type not null,
  table_id        uuid references public.tables (id) on delete restrict,
  status          public.order_status not null default 'open',
  opened_by       uuid not null references public.users (id) on delete restrict,
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  payment_method  public.payment_method,
  total           numeric(10,2)
);

comment on table public.orders is
  'Cuentas/pedidos. Una mesa solo puede tener una orden open a la vez (regla de negocio a nivel de app).';

-- ---------- order_items ----------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete restrict,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(10,2) not null check (unit_price >= 0),
  notes        text
);

comment on table public.order_items is
  'Líneas de cada pedido. unit_price es un snapshot del precio al agregar el producto.';

-- ---------- Índices ----------
create index if not exists idx_orders_table_id     on public.orders (table_id);
create index if not exists idx_orders_status       on public.orders (status);
create index if not exists idx_orders_opened_at    on public.orders (opened_at);
create index if not exists idx_order_items_order_id   on public.order_items (order_id);
create index if not exists idx_order_items_product_id on public.order_items (product_id);

-- ---------- Row Level Security (deny-all) ----------
-- Sin políticas creadas, RLS deniega toda lectura/escritura a roles anónimos/autenticados.
-- El servidor Next.js opera con la service_role key (bypassa RLS).
alter table public.users       enable row level security;
alter table public.products    enable row level security;
alter table public.tables      enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;