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
