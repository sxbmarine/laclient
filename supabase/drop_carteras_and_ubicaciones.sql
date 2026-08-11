-- ============================================================================
-- SCRIPT PARA ELIMINAR LAS TABLAS CARTERAS Y UBICACIONES DE SUPABASE
-- Copia y ejecuta este script en Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Eliminar publicaciones Realtime si existen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ubicaciones') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.ubicaciones;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'carteras') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.carteras;
  END IF;
END $$;

-- 2. Eliminar las políticas RLS
DROP POLICY IF EXISTS "Permitir todo acceso a carteras" ON public.carteras;
DROP POLICY IF EXISTS "Permitir todo acceso a ubicaciones" ON public.ubicaciones;

-- 3. Eliminar las tablas
DROP TABLE IF EXISTS public.carteras CASCADE;
DROP TABLE IF EXISTS public.ubicaciones CASCADE;
