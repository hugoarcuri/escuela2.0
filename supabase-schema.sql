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

CREATE TABLE IF NOT EXISTS materias (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  "cursoId" INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nombre, "cursoId")
);

CREATE TABLE IF NOT EXISTS alumnos (
  id SERIAL PRIMARY KEY,
  "apellidoNombre" TEXT NOT NULL,
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
