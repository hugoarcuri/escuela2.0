import { useEffect } from "react";
import { getSchoolTheme, type SchoolTheme } from "../data/schoolThemes";
import type { Escuela } from "../types";

const THEME_VARS = [
  "--accent", "--accent-hover",
  "--bg-primary", "--bg-secondary", "--bg-card",
  "--border-color", "--hover-bg",
] as const;

export function useSchoolTheme(escuelas: Escuela[], escuelaId: number | "", theme: "light" | "dark") {
  useEffect(() => {
    const schoolTheme = getSchoolTheme(escuelas, escuelaId);
    const root = document.documentElement;
    const vars = schoolTheme?.colors[theme];

    if (vars) {
      for (const v of THEME_VARS) {
        root.style.setProperty(v, vars[v]);
      }
    } else {
      for (const v of THEME_VARS) {
        root.style.removeProperty(v);
      }
    }
  }, [escuelas, escuelaId, theme]);
}

export function getSchoolLogo(escuelas: Escuela[], escuelaId: number | ""): string | undefined {
  if (!escuelaId) return undefined;
  const escuela = escuelas.find(e => e.id === escuelaId);
  if (!escuela) return undefined;
  const theme = getSchoolTheme(escuelas, escuelaId);
  return theme?.logoUrl;
}

export function getSchoolInfo(escuelas: Escuela[], escuelaId: number | ""): { logoUrl?: string; schoolTheme?: SchoolTheme } | undefined {
  if (!escuelaId) return undefined;
  const escuela = escuelas.find(e => e.id === escuelaId);
  if (!escuela) return undefined;
  return { logoUrl: getSchoolLogo(escuelas, escuelaId), schoolTheme: getSchoolTheme(escuelas, escuelaId) };
}
