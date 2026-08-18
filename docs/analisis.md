# Análisis del Sitio — Gestión de Calificaciones

## Visión General

Sistema web de gestión escolar para administrar alumnos, calificaciones, asistencias y agenda de múltiples escuelas técnicas. Consta de un **frontend React** desplegado en **GitHub Pages** y un **backend Supabase** (PostgreSQL + API REST).

---

## Stack Tecnológico

| Capa        | Tecnología                                                                 |
|-------------|----------------------------------------------------------------------------|
| Frontend    | React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4                         |
| Backend     | Supabase (PostgreSQL + API REST con anon key)                              |
| DB          | PostgreSQL 15 (Supabase)                                                   |
| Deployment  | GitHub Pages (`docs/` folder) + GitHub Actions                             |
| Librerías   | axios, xlsx (Excel), supabase-js, react-router-dom, gh-pages               |

---

## Estructura del Proyecto

```
Escuela_2.0/
├── frontend/                    # App React (Vite)
│   ├── src/
│   │   ├── api.ts              # Capa de acceso a Supabase (CRUD completo)
│   │   ├── App.tsx             # Componente raíz, layout principal
│   │   ├── main.tsx            # Entry point con HashRouter
│   │   ├── types.ts            # Interfaces de datos + funciones de cálculo
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── index.css           # Estilos globales + sistema de temas
│   │   ├── hooks/
│   │   │   ├── useSelection.ts # Estado global de selección (escuela/curso/materia)
│   │   │   ├── useTheme.ts     # Modo claro/oscuro
│   │   │   └── useSchoolTheme.ts # Temas por escuela (colores dinámicos)
│   │   ├── components/
│   │   │   ├── Header.tsx      # Header con logo y nombre de escuela
│   │   │   ├── Selectors.tsx   # Selectores anidados escuela→curso→materia
│   │   │   ├── StudentTable.tsx # Tabla de alumnos con notas
│   │   │   ├── StudentForm.tsx  # Formulario alta/edición de alumno
│   │   │   ├── Asistencias.tsx  # Registro de asistencias
│   │   │   ├── Agenda.tsx       # Agenda de evaluaciones/entregas
│   │   │   ├── AdminEscuela.tsx # CRUD de escuelas
│   │   │   ├── AdminCurso.tsx   # CRUD de cursos
│   │   │   ├── AdminMateria.tsx # CRUD de materias
│   │   │   ├── FormPage.tsx    # Formulario público de inscripción
│   │   │   ├── GoogleFormSync.tsx # Sincronización con Google Forms
│   │   │   ├── Icons.tsx       # Iconos SVG inline
│   │   │   ├── Modals.tsx      # Modales genéricos (confirm, prompt, alert)
│   │   │   ├── ui/             # Componentes UI reutilizables
│   │   │   │   ├── Card.tsx, SectionTitle.tsx, EmptyState.tsx
│   │   │   │   ├── DropdownActions.tsx, StatCard.tsx
│   │   │   └── table/          # Componentes de tabla
│   │   │       ├── StatsBar.tsx, TableHeader.tsx
│   │   │   └── agenda/         # Sub-componentes de agenda
│   │   └── data/
│   │       └── schoolThemes.ts # Temas visuales por escuela (colores + logo)
│   ├── vite.config.ts          # Build output → ../docs/
│   └── package.json
├── backend/
│   └── prisma/
│       └── escuela.db          # SQLite local (legacy, no usado en prod)
├── docs/                       # Build de producción (GitHub Pages)
├── .github/workflows/deploy.yml # CI/CD: build + push docs en cada push a main
├── supabase-schema.sql         # Schema PostgreSQL completo
├── iniciar.bat                 # Script local para dev
└── README.md
```

---

## Base de Datos (Supabase PostgreSQL)

8 tablas con Row Level Security (RLS) abierto (anon key):

| Tabla            | Propósito                                      |
|------------------|-------------------------------------------------|
| `escuelas`       | Escuelas (nombre, distrito, teléfono)           |
| `cursos`         | Cursos por escuela (año, división, turno)       |
| `materias`       | Materias por curso (nombre, día, turno)         |
| `alumnos`        | Alumnos con 6 notas, notaFinalManual, etc.      |
| `asistencias`    | Asistencias diarias (P/A/T/Lic/F)              |
| `agenda`         | Evaluaciones y entregas programadas             |
| `historialCambio`| Log de cambios en alumnos                       |
| `formLinks`      | Tokens para formulario público de inscripción   |
| `settings`       | Configuración clave-valor                       |

---

## Flujo de Datos

1. El usuario selecciona **Escuela → Curso → Materia** en los selectores
2. Se cargan los alumnos desde Supabase con filtros (escuelaId, cursoId, materiaId, anioLectivo)
3. Las notas se calculan en frontend: `nota1C` = promedio de notas 1-3, `nota2C` = promedio de notas 4-6, `notaFinal` = promedio de cuatrimestres (o manual)
4. Los cambios se persisten vía API REST de Supabase
5. El hook `useSchoolTheme` aplica colores dinámicos según la escuela seleccionada
6. El tema claro/oscuro se persiste en localStorage

---

## Sistema de Temas por Escuela

- **3 escuelas configuradas** en `schoolThemes.ts` con keywords para matching:
  - *Técnica 6 Casanova* → tema azul (La Matanza)
  - *Técnica 6 Chacabuco* → tema rojo (Morón)
  - *Escuela 21 José Hernández* → tema verde (Castelar)
- Cada tema define colores light/dark para CSS variables (`--accent`, `--bg-*`, etc.)
- `findSchoolTheme()` matchea por keywords contra el nombre de la escuela
- Badge visual en dropdown: puntito + fondo con color del acento

---

## Funcionalidades Clave

| Funcionalidad              | Implementación                                       |
|----------------------------|------------------------------------------------------|
| CRUD Escuelas/Cursos/Materias | Modales AdminEscuela, AdminCurso, AdminMateria     |
| Carga de Alumnos           | Manual (formulario), Excel, pegar lista, formulario público |
| Notas                      | 6 notas por alumno, 2 cuatrimestres, nota final auto/manual |
| Asistencias                | Registro diario con cálculo de nota de asistencia    |
| Agenda                     | Evaluaciones y entregas con check de completado      |
| Google Forms Sync          | Genera link para que alumnos se auto-registren       |
| Backup/restore             | Export/import JSON completo                          |
| Temas visuales             | Colores dinámicos por escuela + modo claro/oscuro    |
| Persistencia de sesión     | Restaura última escuela/curso/materia seleccionada   |

---

## Desarrollo Local

```bash
# Backend (no necesario con Supabase, legacy):
cd backend && npx tsx src/index.ts   # Puerto 3001

# Frontend:
cd frontend && npx vite --host 0.0.0.0   # Puerto 5173
```

Variables de entorno requeridas en `frontend/.env`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
```

---

## Deployment

- **CI/CD**: GitHub Actions (`deploy.yml`) — build automático en cada push a `main`
- **Build**: `npm run build` → output en `docs/`
- **Host**: GitHub Pages desde `docs/` en `https://hugoarcuri.github.io/escuela2.0`
- **Base**: `vite.config.ts` → `base: '/escuela2.0/'`

---

## Problemas Encontrados y Resueltos

### Bug: Keywords de escuela no matcheaban nombres reales
- **Síntoma**: "Tecnica 6 Casanova" no mostraba logo ni colores del tema
- **Causa**: `schoolThemes.ts` tenía keyword `"isidro casanova"` pero el nombre real es "Tecnica 6 Casanova"
- **Fix**: Agregar `"casanova"` a los keywords de la escuela de La Matanza

### Bug: escuelaBadge hardcodeado inconsistente
- **Síntoma**: Solo 2 escuelas tenían badge visual en dropdown/administración
- **Causa**: `Selectors.tsx` y `AdminEscuela.tsx` tenían `escuelaBadge()` hardcodeado con solo "matanza" y "morón"
- **Fix**: Reemplazar por `findSchoolTheme()` de `schoolThemes.ts` para mantener lógica unificada
