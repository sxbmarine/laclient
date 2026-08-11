-- ==============================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE PARA EL SISTEMA MDT (CENTRO DE OPERACIONES POLICIAL)
-- ==============================================================================

-- 1. Tabla: codigopenal
CREATE TABLE IF NOT EXISTS codigopenal (
  id BIGINT PRIMARY KEY,
  nombre TEXT NOT NULL,
  dinero NUMERIC DEFAULT 0 NOT NULL,
  tiempo INT DEFAULT 0 NOT NULL,
  categoria TEXT DEFAULT 'Delitos Graves',
  descripcion TEXT,
  clase TEXT
);

-- Datos iniciales del Código Penal de San Andreas / Los Ángeles
INSERT INTO codigopenal (id, nombre, dinero, tiempo, categoria, descripcion) VALUES
  (101, 'Art. 101 — Atentado a la Autoridad', 2500, 30, 'Delitos Graves', 'Ataque físico o amenaza directa a un oficial de servicio.'),
  (102, 'Art. 102 — Conducción Bajo Efectos (DUI)', 1200, 15, 'Tráfico', 'Conducir con tasa de alcohol o sustancias estupefacientes.'),
  (103, 'Art. 103 — Exceso de Velocidad (>30 mph)', 600, 0, 'Tráfico', 'Circular superando holgadamente los límites urbanos.'),
  (104, 'Art. 104 — Posesión de Armas sin Licencia', 3500, 45, 'Armas', 'Portar armamento de fuego sin licencia regulada CCW.'),
  (105, 'Art. 105 — Robo a Mano Armada', 5000, 60, 'Delitos Graves', 'Atraco con empleo de violencia o intimidación con arma.'),
  (106, 'Art. 106 — Desobediencia a la Autoridad', 800, 10, 'Delitos Leves', 'Negarse a cumplir indicaciones legítimas de patrulla.')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla: antecedentes
CREATE TABLE IF NOT EXISTS antecedentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dni TEXT NOT NULL,
  cargos_aplicados JSONB DEFAULT '[]'::jsonb,
  fecha TIMESTAMPTZ DEFAULT now() NOT NULL,
  agente_dni TEXT NOT NULL,
  multa_total NUMERIC DEFAULT 0,
  tiempo_total INT DEFAULT 0,
  detalles TEXT
);

-- 3. Tabla: policias
CREATE TABLE IF NOT EXISTS policias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dni TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  placa TEXT NOT NULL,
  departamento TEXT DEFAULT 'LAPD',
  rango TEXT DEFAULT 'Police Officer II',
  permisos JSONB DEFAULT '["oficial"]'::jsonb,
  estado TEXT DEFAULT '10-8',
  llamada_activa TEXT
);

-- Datos iniciales de Oficiales Autorizados
INSERT INTO policias (dni, nombre_completo, placa, departamento, rango, permisos, estado) VALUES
  ('P1001', 'Kaya TASKIRAN', '#209', 'LAPD', 'Chief of Police', '["admin", "chief"]'::jsonb, '10-8'),
  ('P1002', 'David GARCIA', '#104', 'LASD', 'Sergeant I', '["oficial"]'::jsonb, '10-8'),
  ('P1003', 'Alex JOHNSON', '#312', 'CHP', 'Officer III', '["oficial"]'::jsonb, '10-97'),
  ('P1004', 'Marcus VANCE', '#088', 'LAPD', 'Police Officer II', '["oficial"]'::jsonb, '10-8')
ON CONFLICT (dni) DO NOTHING;

-- 4. Tabla: buscados
CREATE TABLE IF NOT EXISTS buscados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dni TEXT NOT NULL,
  nombre_sujeto TEXT NOT NULL,
  motivo TEXT NOT NULL,
  agente_dni TEXT NOT NULL,
  nivel_peligrosidad TEXT DEFAULT 'ALTA',
  foto_url TEXT,
  estado TEXT DEFAULT 'ACTIVO',
  fecha TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Tabla: informes
CREATE TABLE IF NOT EXISTS informes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  agente TEXT NOT NULL,
  implicados JSONB DEFAULT '[]'::jsonb,
  descripcion TEXT NOT NULL,
  pruebas_urls JSONB DEFAULT '[]'::jsonb,
  estado TEXT DEFAULT 'ABIERTO',
  fecha TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — PERMISOS COMPLETOS DE SELECT, INSERT, UPDATE, DELETE
-- ==============================================================================
ALTER TABLE codigopenal ENABLE ROW LEVEL SECURITY;
ALTER TABLE antecedentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE policias ENABLE ROW LEVEL SECURITY;
ALTER TABLE buscados ENABLE ROW LEVEL SECURITY;
ALTER TABLE informes ENABLE ROW LEVEL SECURITY;

-- Politicas para codigopenal
DROP POLICY IF EXISTS "Permitir todo codigopenal" ON codigopenal;
CREATE POLICY "Permitir todo codigopenal" ON codigopenal FOR ALL USING (true) WITH CHECK (true);

-- Politicas para antecedentes
DROP POLICY IF EXISTS "Permitir todo antecedentes" ON antecedentes;
CREATE POLICY "Permitir todo antecedentes" ON antecedentes FOR ALL USING (true) WITH CHECK (true);

-- Politicas para policias (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Permitir todo policias" ON policias;
CREATE POLICY "Permitir todo policias" ON policias FOR ALL USING (true) WITH CHECK (true);

-- Politicas para buscados
DROP POLICY IF EXISTS "Permitir todo buscados" ON buscados;
CREATE POLICY "Permitir todo buscados" ON buscados FOR ALL USING (true) WITH CHECK (true);

-- Politicas para informes
DROP POLICY IF EXISTS "Permitir todo informes" ON informes;
CREATE POLICY "Permitir todo informes" ON informes FOR ALL USING (true) WITH CHECK (true);
