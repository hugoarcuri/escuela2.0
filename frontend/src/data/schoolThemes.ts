import type { Escuela } from "../types";

export interface SchoolTheme {
  id: string;
  name: string;
  keywords: string[];
  logoUrl?: string;
  logoDarkUrl?: string;
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export const SCHOOL_THEMES: SchoolTheme[] = [
  {
    id: "tecnica6-matanza",
    name: "E.E.T. N°6 – La Matanza",
    keywords: ["matanza", "isidro casanova", "casanova"],
    logoUrl: "/escuela2.0/logo-tec6-matanza.png",
    colors: {
      light: {
        "--accent": "#1565C0",
        "--accent-hover": "#0D47A1",
        "--bg-primary": "#e3edf5",
        "--bg-secondary": "#d5e0ea",
        "--bg-card": "#ecf2f8",
        "--border-color": "#b8c9d8",
        "--hover-bg": "#cedce8",
      },
      dark: {
        "--accent": "#42A5F5",
        "--accent-hover": "#64B5F6",
        "--bg-primary": "#0d1b2a",
        "--bg-secondary": "#1b2a3a",
        "--bg-card": "#1b2a3a",
        "--border-color": "#2a3f52",
        "--hover-bg": "#2a3f52",
      },
    },
  },
  {
    id: "tecnica6-moron",
    name: "E.E.S.T. N°6 Chacabuco – Morón",
    keywords: ["chacabuco", "morón", "moron"],
    logoUrl: "/escuela2.0/logo-tec6-moron.png",
    colors: {
      light: {
        "--accent": "#C62828",
        "--accent-hover": "#B71C1C",
        "--bg-primary": "#f5e8e8",
        "--bg-secondary": "#eadddd",
        "--bg-card": "#f5eeee",
        "--border-color": "#d4bfbf",
        "--hover-bg": "#e6d0d0",
      },
      dark: {
        "--accent": "#EF5350",
        "--accent-hover": "#E57373",
        "--bg-primary": "#1a0d0d",
        "--bg-secondary": "#2a1b1b",
        "--bg-card": "#2a1b1b",
        "--border-color": "#3d2a2a",
        "--hover-bg": "#3d2a2a",
      },
    },
  },
  {
    id: "escuela21-moron",
    name: "Escuela 21 José Hernández – Castelar",
    keywords: ["josé hernández", "jose hernandez", "el rancho", "castelar"],
    logoUrl: "https://www.castelar-digital.com.ar/img/fotos/Colegio_José_Hernández_Escuela_21_El_Rancho_1.jpeg",
    colors: {
      light: {
        "--accent": "#7CB342",
        "--accent-hover": "#689F38",
        "--bg-primary": "#eef5e8",
        "--bg-secondary": "#e0ead5",
        "--bg-card": "#f0f5ec",
        "--border-color": "#c4d4b8",
        "--hover-bg": "#dae6ce",
      },
      dark: {
        "--accent": "#9CCC65",
        "--accent-hover": "#AED581",
        "--bg-primary": "#121a0d",
        "--bg-secondary": "#1f2b1a",
        "--bg-card": "#1f2b1a",
        "--border-color": "#2e3d26",
        "--hover-bg": "#2e3d26",
      },
    },
  },
];

export function findSchoolTheme(nombre: string): SchoolTheme | undefined {
  const n = nombre.toLowerCase();
  for (const theme of SCHOOL_THEMES) {
    if (theme.keywords.some(k => n.includes(k))) return theme;
  }
  return undefined;
}

export function getSchoolTheme(escuelas: Escuela[], escuelaId: number | ""): SchoolTheme | undefined {
  if (!escuelaId) return undefined;
  const escuela = escuelas.find(e => e.id === escuelaId);
  if (!escuela) return undefined;
  return findSchoolTheme(escuela.nombre);
}
