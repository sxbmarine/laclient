-- ============================================================================
-- SCRIPT COMPLETO DE TABLAS, RLS, FUNCIONES RPC Y SUPABASE REALTIME
-- Copia y ejecuta este script completo en el SQL Editor de tu proyecto Supabase
-- ============================================================================

-- 1. TABLAS PRINCIPALES
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT UNIQUE NOT NULL,
  roblox TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
  discord_id TEXT PRIMARY KEY,
  rol TEXT NOT NULL DEFAULT 'civil',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.personajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  numero TEXT,
  idnumber TEXT,
  nombre TEXT NOT NULL,
  fecha_nacimiento DATE,
  genero TEXT,
  domicilio TEXT,
  nacionalidad TEXT,
  usuario_roblox TEXT
);

CREATE TABLE IF NOT EXISTS public.carteras (
  id BIGSERIAL PRIMARY KEY,
  discord_id TEXT UNIQUE NOT NULL,
  efectivo NUMERIC(12,2) DEFAULT 0.00,
  ultima_nomina TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cuentas_bancarias (
  id BIGSERIAL PRIMARY KEY,
  discord_id TEXT NOT NULL,
  banco TEXT NOT NULL,
  numero_cuenta TEXT UNIQUE NOT NULL,
  saldo NUMERIC(12,2) DEFAULT 0.00,
  pin TEXT DEFAULT '1234',
  activa BOOLEAN DEFAULT TRUE,
  ultimo_interes TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transacciones (
  id BIGSERIAL PRIMARY KEY,
  cuenta_origen TEXT NOT NULL,
  cuenta_destino TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  concepto TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.multas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personaje_id UUID NOT NULL,
  cargos TEXT NOT NULL,
  dinero NUMERIC(12,2) NOT NULL,
  pagado BOOLEAN DEFAULT FALSE,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tipo TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contactos (
  id BIGSERIAL PRIMARY KEY,
  discord_id TEXT NOT NULL,
  numero_telefono TEXT NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mensajes (
  id BIGSERIAL PRIMARY KEY,
  emisor_discord_id TEXT NOT NULL,
  receptor_discord_id TEXT NOT NULL,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gps_compartido (
  id BIGSERIAL PRIMARY KEY,
  discord_id_emisor TEXT NOT NULL,
  discord_id_receptor TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ubicaciones (
  discord_id TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carteras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_compartido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ubicaciones ENABLE ROW LEVEL SECURITY;

-- 3. POLITICAS RLS COMPLETA (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Permitir todo acceso a usuarios" ON public.usuarios;
CREATE POLICY "Permitir todo acceso a usuarios" ON public.usuarios FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a roles" ON public.roles;
CREATE POLICY "Permitir todo acceso a roles" ON public.roles FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a personajes" ON public.personajes;
CREATE POLICY "Permitir todo acceso a personajes" ON public.personajes FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a carteras" ON public.carteras;
CREATE POLICY "Permitir todo acceso a carteras" ON public.carteras FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a cuentas_bancarias" ON public.cuentas_bancarias;
CREATE POLICY "Permitir todo acceso a cuentas_bancarias" ON public.cuentas_bancarias FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a transacciones" ON public.transacciones;
CREATE POLICY "Permitir todo acceso a transacciones" ON public.transacciones FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a multas" ON public.multas;
CREATE POLICY "Permitir todo acceso a multas" ON public.multas FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a contactos" ON public.contactos;
CREATE POLICY "Permitir todo acceso a contactos" ON public.contactos FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a mensajes" ON public.mensajes;
CREATE POLICY "Permitir todo acceso a mensajes" ON public.mensajes FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a gps_compartido" ON public.gps_compartido;
CREATE POLICY "Permitir todo acceso a gps_compartido" ON public.gps_compartido FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo acceso a ubicaciones" ON public.ubicaciones;
CREATE POLICY "Permitir todo acceso a ubicaciones" ON public.ubicaciones FOR ALL TO public, authenticated, anon USING (true) WITH CHECK (true);

-- 4. FUNCIÓN RPC PARA TRANSFERENCIAS BANCARIAS ATÓMICAS
CREATE OR REPLACE FUNCTION public.transferir(
  p_cuenta_origen TEXT,
  p_cuenta_destino TEXT,
  p_monto NUMERIC,
  p_concepto TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo_origen NUMERIC;
BEGIN
  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero';
  END IF;

  SELECT saldo INTO v_saldo_origen
  FROM public.cuentas_bancarias
  WHERE numero_cuenta = p_cuenta_origen AND activa = TRUE;

  IF v_saldo_origen IS NULL THEN
    RAISE EXCEPTION 'La cuenta origen no existe o no está activa';
  END IF;

  IF v_saldo_origen < p_monto THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cuentas_bancarias WHERE numero_cuenta = p_cuenta_destino AND activa = TRUE) THEN
    RAISE EXCEPTION 'La cuenta destino no existe o no está activa';
  END IF;

  UPDATE public.cuentas_bancarias
  SET saldo = saldo - p_monto
  WHERE numero_cuenta = p_cuenta_origen;

  UPDATE public.cuentas_bancarias
  SET saldo = saldo + p_monto
  WHERE numero_cuenta = p_cuenta_destino;

  INSERT INTO public.transacciones (cuenta_origen, cuenta_destino, monto, concepto, fecha, created_at)
  VALUES (p_cuenta_origen, p_cuenta_destino, p_monto, p_concepto, NOW(), NOW());
END;
$$;

-- 5. PUBLICACIÓN REALTIME SUPABASE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'mensajes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transacciones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transacciones;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'multas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.multas;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ubicaciones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ubicaciones;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'gps_compartido') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_compartido;
  END IF;
END $$;
