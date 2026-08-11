-- ============================================================
-- SCRIPT DE MIGRACIÓN: CREACIÓN DE TABLA DE LLAMADAS CAD (ERLC)
-- Execute este script en el Editor SQL de su proyecto en Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.llamadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INT8 UNIQUE NOT NULL,
    coordenadas JSONB DEFAULT '[]'::jsonb,
    estado BOOLEAN DEFAULT false, -- false = activa / en progreso, true = resuelta
    hora TEXT,
    descripcion TEXT,
    lugar TEXT,
    notas TEXT DEFAULT '',
    unidades TEXT[] DEFAULT '{}'::text[],
    equipo TEXT DEFAULT 'Police',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en la tabla llamadas
ALTER TABLE public.llamadas ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para RLS (Permitir lectura y modificación a usuarios autenticados y anon)
DROP POLICY IF EXISTS "Permitir lectura publica de llamadas" ON public.llamadas;
CREATE POLICY "Permitir lectura publica de llamadas" ON public.llamadas
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion y actualizacion publica de llamadas" ON public.llamadas;
CREATE POLICY "Permitir insercion y actualizacion publica de llamadas" ON public.llamadas
    FOR ALL USING (true) WITH CHECK (true);

-- Comentario explicativo
COMMENT ON TABLE public.llamadas IS 'Tabla de llamadas de emergencia sincronizadas con la API de ERLC y gestionadas por los agentes en el MDT';
