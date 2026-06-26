-- Ejecutar esto en el SQL Editor de Supabase (https://supabase.com/dashboard/project/_/sql)

CREATE TABLE IF NOT EXISTS escuelas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  distrito TEXT,
  telefono TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cursos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  anio INTEGER NOT NULL,
  division TEXT NOT NULL,
  turno TEXT NOT NULL,
  "escuelaId" INTEGER NOT NULL REFERENCES escuelas(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nombre, "escuelaId")
);

-- Si ya tenés la tabla creada sin dia/turno, ejecutá:
-- ALTER TABLE materias ADD COLUMN IF NOT EXISTS dia TEXT DEFAULT '';
-- ALTER TABLE materias ADD COLUMN IF NOT EXISTS turno TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS materias (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  dia TEXT DEFAULT '',
  turno TEXT DEFAULT '',
  "cursoId" INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nombre, "cursoId")
);

CREATE TABLE IF NOT EXISTS alumnos (
  id SERIAL PRIMARY KEY,
  "apellidoNombre" TEXT NOT NULL,
  recursante BOOLEAN DEFAULT FALSE,
  nota1 DOUBLE PRECISION,
  nota2 DOUBLE PRECISION,
  nota3 DOUBLE PRECISION,
  nota4 DOUBLE PRECISION,
  nota5 DOUBLE PRECISION,
  nota6 DOUBLE PRECISION,
  "notaFinalManual" DOUBLE PRECISION,
  observaciones TEXT DEFAULT '',
  "anioLectivo" INTEGER DEFAULT 2025,
  "escuelaId" INTEGER NOT NULL REFERENCES escuelas(id) ON DELETE CASCADE,
  "cursoId" INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  "materiaId" INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "historialCambio" (
  id SERIAL PRIMARY KEY,
  "alumnoId" INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  campo TEXT NOT NULL,
  "valorAnterior" TEXT,
  "valorNuevo" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "formLinks" (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  "escuelaId" INTEGER NOT NULL,
  "cursoId" INTEGER NOT NULL,
  "materiaId" INTEGER NOT NULL,
  "anioLectivo" INTEGER DEFAULT 2025,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agenda (
  id SERIAL PRIMARY KEY,
  "materiaId" INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  fecha DATE NOT NULL,
  hora TEXT DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'evaluacion',
  done BOOLEAN DEFAULT FALSE,
  "googleEventId" TEXT DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS asistencias;
CREATE TABLE IF NOT EXISTS asistencias (
  id SERIAL PRIMARY KEY,
  "alumnoId" INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  "materiaId" INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'P',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("alumnoId", "materiaId", fecha)
);

-- RLS: permitir todo con la key anónima (seguro para uso escolar)
ALTER TABLE escuelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE "historialCambio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE "formLinks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- Funciones RPC para agenda (bypass RLS con SECURITY DEFINER)
DROP FUNCTION IF EXISTS public.insert_agenda(INTEGER, TEXT, TEXT, DATE, TEXT);
CREATE OR REPLACE FUNCTION public.insert_agenda(materia_id INTEGER, tit TEXT, descr TEXT, f TEXT, t TEXT)
RETURNS SETOF agenda AS $$
BEGIN
  RETURN QUERY INSERT INTO public.agenda ("materiaId", titulo, descripcion, fecha, tipo)
  VALUES (materia_id, tit, descr, f::DATE, t)
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.update_agenda(INTEGER, TEXT, TEXT, DATE, TEXT);
CREATE OR REPLACE FUNCTION public.update_agenda(item_id INTEGER, tit TEXT, descr TEXT, f TEXT, t TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.agenda SET titulo = tit, descripcion = descr, fecha = f::DATE, tipo = t, "updatedAt" = NOW()
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_agenda(item_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.agenda WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migración: agregar columna done a agenda (para apps existentes)
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.toggle_agenda_done(item_id INTEGER, val BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE public.agenda SET done = val, "updatedAt" = NOW()
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "allow_all" ON escuelas;
DROP POLICY IF EXISTS "allow_all" ON cursos;
DROP POLICY IF EXISTS "allow_all" ON materias;
DROP POLICY IF EXISTS "allow_all" ON alumnos;
DROP POLICY IF EXISTS "allow_all" ON "historialCambio";
DROP POLICY IF EXISTS "allow_all" ON settings;
DROP POLICY IF EXISTS "allow_all" ON "formLinks";
DROP POLICY IF EXISTS "allow_all" ON agenda;
DROP POLICY IF EXISTS "allow_all" ON asistencias;

CREATE POLICY "allow_all" ON escuelas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cursos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON materias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON alumnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "historialCambio" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "formLinks" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON agenda FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON asistencias FOR ALL USING (true) WITH CHECK (true);
