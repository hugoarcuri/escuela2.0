export interface Escuela {
  id: number; nombre: string; distrito?: string | null; telefono?: string | null;
}
export interface Curso {
  id: number; nombre: string; anio: number; division: string; grupo?: string | null; turno?: string | null; escuelaId: number;
}
export interface Materia {
  id: number; nombre: string; dia?: string; turno?: string; cursoId: number;
}
export interface AlumnoDB {
  id: number; apellidoNombre: string;
  nota1: number | null; nota2: number | null; nota3: number | null;
  nota4: number | null; nota5: number | null; nota6: number | null;
  notaFinalManual: number | null;
  observaciones: string;
  recursante: boolean;
  pc: string | null;
  anioLectivo: number; escuelaId: number; cursoId: number; materiaId: number;
}
export interface Alumno extends AlumnoDB {
  informe1: string | null; nota1C: number | null;
  informe2: string | null; nota2C: number | null;
  notaFinal: number | null;
  situacionFinal: string;
  notaAsistencia1: number | null;
  notaAsistencia2: number | null;
}
export interface AlumnoFormData {
  apellidoNombre: string;
  nota1: string; nota2: string; nota3: string;
  nota4: string; nota5: string; nota6: string;
}
export interface EscuelaFormData { nombre: string; distrito: string; telefono: string; }
export interface CursoFormData { anio: string; division: string; grupo: string; turno: string; escuelaId: number; }
export interface MateriaFormData { nombre: string; dia: string; turno: string; cursoId: number; }
export interface HistorialCambio {
  id: number; alumnoId: number; campo: string; valorAnterior: string | null; valorNuevo: string | null; createdAt: string;
}
export interface FormLink {
  id: number; token: string; escuelaId: number; cursoId: number; materiaId: number; anioLectivo: number;
}
export interface Asistencia {
  id: number; alumnoId: number; materiaId: number;
  fecha: string; estado: "P" | "A" | "T" | "Lic" | "F";
}

export function calcNota1C(a: { nota1: number | null; nota2: number | null; nota3: number | null }): number | null {
  const nums = [a.nota1, a.nota2, a.nota3].filter((v): v is number => v !== null);
  return nums.length > 0 ? Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 100) / 100 : null;
}
export function calcNota2C(a: { nota4: number | null; nota5: number | null; nota6: number | null }): number | null {
  const nums = [a.nota4, a.nota5, a.nota6].filter((v): v is number => v !== null);
  return nums.length > 0 ? Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 100) / 100 : null;
}
export function calcNotaFinal(n1c: number | null, n2c: number | null, notaFinalManual: number | null, modoManual: boolean): number | null {
  if (modoManual && notaFinalManual !== null) return notaFinalManual;
  return calcPromedio([n1c, n2c]);
}
export function calcPromedio(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null);
  return nums.length > 0 ? Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 100) / 100 : null;
}
export function calcSituacion(notaFinal: number | null): string {
  if (notaFinal === null) return "";
  return notaFinal >= 7 ? "Aprobado" : "Desaprobado";
}
export function calcInforme(notaC: number | null): string | null {
  if (notaC === null) return null;
  return notaC >= 7 ? "TEA" : "TEP";
}
export function mapAlumno(a: AlumnoDB, modoManual: boolean): Alumno {
  const nota1C = calcNota1C(a);
  const nota2C = calcNota2C(a);
  const notaFinal = calcNotaFinal(nota1C, nota2C, a.notaFinalManual, modoManual);
  return {
    ...a,
    nota1C,
    nota2C,
    notaFinal,
    situacionFinal: calcSituacion(notaFinal),
    informe1: calcInforme(nota1C),
    informe2: calcInforme(nota2C),
    notaAsistencia1: null,
    notaAsistencia2: null,
  };
}

export type CalificacionCualitativa = "M" | "R" | "B" | "MB";

export interface TrabajoColumn {
  key: string;
  notaKey: keyof Pick<AlumnoDB, "nota1" | "nota2" | "nota3" | "nota4" | "nota5" | "nota6">;
  label: string;
  semester: 1 | 2;
}

export const TRABAJOS_COLUMNS: TrabajoColumn[] = [
  { key: "T1", notaKey: "nota1", label: "T1", semester: 1 },
  { key: "T2", notaKey: "nota2", label: "T2", semester: 1 },
  { key: "E1", notaKey: "nota3", label: "E1", semester: 1 },
  { key: "T4", notaKey: "nota4", label: "T4", semester: 2 },
  { key: "T5", notaKey: "nota5", label: "T5", semester: 2 },
  { key: "E2", notaKey: "nota6", label: "E2", semester: 2 },
];

export const CALIFICACION_MAP: Record<CalificacionCualitativa, number> = { M: 2, R: 5, B: 8, MB: 10 };
export const CALIFICACION_CYCLE: (CalificacionCualitativa | null)[] = [null, "M", "R", "B", "MB"];

export function cualitativaToNumerica(c: CalificacionCualitativa): number {
  return CALIFICACION_MAP[c];
}
export function numericaToCualitativa(n: number | null): CalificacionCualitativa | null {
  if (n === null) return null;
  if (n < 4) return "M";
  if (n < 7) return "R";
  if (n < 9) return "B";
  return "MB";
}

export function calcTrabajoAverage(columns: TrabajoColumn[], getVal: (k: string) => number | null): number | null {
  const vals = columns.map(c => getVal(c.key)).filter((v): v is number => v !== null);
  return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100 : null;
}

export interface AgendaItem {
  id: number;
  materiaId: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  tipo: "evaluacion" | "entrega";
  done?: boolean;
  googleEventId: string;
}
