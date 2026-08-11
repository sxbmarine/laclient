-- ============================================================================
-- SCRIPT COMPLETO DE POLITICAS RLS (ROW LEVEL SECURITY) Y REALTIME
-- Copia y ejecuta este script en Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS DEL PROYECTO
ALTER TABLE IF EXISTS public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.personajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.multas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gps_compartido ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLITICAS PREVIAS PARA EVITAR CONFLICTOS DE DUPLICACIÓN
DROP POLICY IF EXISTS "Permitir todo acceso a usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir todo acceso a roles" ON public.roles;
DROP POLICY IF EXISTS "Permitir todo acceso a personajes" ON public.personajes;
DROP POLICY IF EXISTS "Permitir todo acceso a cuentas_bancarias" ON public.cuentas_bancarias;
DROP POLICY IF EXISTS "Permitir todo acceso a transacciones" ON public.transacciones;
DROP POLICY IF EXISTS "Permitir todo acceso a multas" ON public.multas;
DROP POLICY IF EXISTS "Permitir todo acceso a contactos" ON public.contactos;
DROP POLICY IF EXISTS "Permitir todo acceso a mensajes" ON public.mensajes;
DROP POLICY IF EXISTS "Permitir todo acceso a gps_compartido" ON public.gps_compartido;

-- 3. CREAR POLÍTICAS DE ACCESO COMPLETO (SELECT, INSERT, UPDATE, DELETE)

-- Tabla: usuarios (Ver, Crear, Editar, Eliminar)
CREATE POLICY "Permitir todo acceso a usuarios"
ON public.usuarios
FOR ALL
TO public, authenticated, anon
USING (true)
WITH CHECK (true);

-- Tabla: roles (Ver, Crear, Editar, Eliminar)
CREATE POLICY "Permitir todo acceso a roles"
ON public.roles
FOR ALL
TO public, authenticated, anon
USING (true)
WITH CHECK (true);

-- Tabla: personajes (Ver, Crear, Editar, Eliminar)
CREATE POLICY "Permitir todo acceso a personajes"
ON public.personajes
FOR ALL
TO public, authenticated, anon
USING (true)
WITH CHECK (true);

-- Tabla: cuentas_bancarias (Ver, Crear, Editar, Eliminar)
CREATE POLICY "Permitir todo acceso a cuentas_bancarias"
ON public.cuentas_bancarias
FOR ALL
TO public, authenticated, anon
USING (true)
WITH CHECK (true);

-- Tabla: transacciones (Ver, Crear, Editar, Eliminar)
CREATE POLICY "Permitir todo acceso a transacciones"
ON public.transacciones
FOR ALL
TO public, authenticated, anon
USING (true)
WITH CHECK (true);

-- Tabla: multas (Ver, Crear, Editar, Eliminar)
CREATE POLICY "Permitir todo acceso a multas"
ON public.multas
FOR ALL
TO public, authenticated, anon
USING (true)
WITH CHECK (true);

-- Tabla: contactos (Ver, Crear, Editar, Eliminar)
CREATE POLICY "Permitir todo acceso a contactos"
ON public.contactos
FOR ALL
TO public, authenticated, anon
USING (true)
WITH CHECK (true);

-- Tabla: mensajes (Ver, Crear, Editar, Eliminar)
CREATE POLICY "Permitir todo acceso a mensajes"
ON public.mensajes
FOR ALL
TO public, authenticated, anon
USING (true)
WITH CHECK (true);

-- Tabla: gps_compartido (Ver, Crear, Editar, Eliminar)
CREATE POLICY "Permitir todo acceso a gps_compartido"
ON public.gps_compartido
FOR ALL
TO public, authenticated, anon
USING (true)
WITH CHECK (true);

-- 4. HABILITAR PUBLICACIÓN SUPABASE REALTIME PARA EVENTOS EN TIEMPO REAL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'mensajes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'transacciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transacciones;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'multas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.multas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'gps_compartido'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_compartido;
  END IF;
END $$;
