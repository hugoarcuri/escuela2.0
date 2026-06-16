export interface Escuela {
  id: number; nombre: string; distrito?: string | null; telefono?: string | null;
}
export interface Curso {
  id: number; nombre: string; anio: number; division: string; turno?: string | null; escuelaId: number;
}
export interface Materia {
  id: number; nombre: string; cursoId: number;
}
export interface Alumno {
  id: number; apellidoNombre: string;
  nota1: number | null; nota2: number | null; nota3: number | null;
  informe1: string | null; nota1C: number | null;
  nota4: number | null; nota5: number | null; nota6: number | null;
  informe2: string | null; nota2C: number | null;
  notaFinal: number | null; notaFinalManual: number | null;
  situacionFinal: string; observaciones: string;
  anioLectivo: number; escuelaId: number; cursoId: number; materiaId: number;
}
export interface AlumnoFormData {
  apellidoNombre: string;
  nota1: string; nota2: string; nota3: string;
  nota4: string; nota5: string; nota6: string;
}
export interface EscuelaFormData { nombre: string; distrito: string; telefono: string; }
export interface CursoFormData { anio: string; division: string; turno: string; escuelaId: number; }
export interface MateriaFormData { nombre: string; cursoId: number; }
export interface HistorialCambio {
  id: number; alumnoId: number; campo: string; valorAnterior: string | null; valorNuevo: string | null; createdAt: string;
}
