import axios from "axios";
import type { Escuela, Curso, Materia, Alumno, HistorialCambio, EscuelaFormData, CursoFormData, MateriaFormData } from "./types";

const api = axios.create({ baseURL: "/api" });

/* Escuelas */
export async function getEscuelas(): Promise<Escuela[]> { const { data } = await api.get("/escuelas"); return data; }
export async function createEscuela(d: EscuelaFormData): Promise<Escuela> { const { data } = await api.post("/escuelas", d); return data; }
export async function updateEscuela(id: number, d: EscuelaFormData): Promise<Escuela> { const { data } = await api.put(`/escuelas/${id}`, d); return data; }
export async function deleteEscuela(id: number): Promise<void> { await api.delete(`/escuelas/${id}`); }

/* Cursos */
export async function getCursos(escuelaId: number): Promise<Curso[]> { const { data } = await api.get("/cursos", { params: { escuelaId } }); return data; }
export async function createCurso(d: CursoFormData): Promise<Curso> { const { data } = await api.post("/cursos", d); return data; }
export async function updateCurso(id: number, d: CursoFormData): Promise<Curso> { const { data } = await api.put(`/cursos/${id}`, d); return data; }
export async function deleteCurso(id: number): Promise<void> { await api.delete(`/cursos/${id}`); }

/* Materias */
export async function getMaterias(cursoId: number): Promise<Materia[]> { const { data } = await api.get("/materias", { params: { cursoId } }); return data; }
export async function createMateria(d: MateriaFormData): Promise<Materia> { const { data } = await api.post("/materias", d); return data; }
export async function updateMateria(id: number, d: MateriaFormData): Promise<Materia> { const { data } = await api.put(`/materias/${id}`, d); return data; }
export async function deleteMateria(id: number): Promise<void> { await api.delete(`/materias/${id}`); }

/* Alumnos */
export async function getAlumnos(params: { escuelaId: number; cursoId: number; materiaId: number; anioLectivo?: number; search?: string; filtro?: string }): Promise<Alumno[]> {
  const { data } = await api.get("/alumnos", { params: { ...params, search: params.search || undefined } });
  return data;
}
export async function createAlumno(alumno: any): Promise<Alumno> { const { data } = await api.post("/alumnos", alumno); return data; }
export async function updateAlumno(id: number, alumno: any): Promise<Alumno> { const { data } = await api.put(`/alumnos/${id}`, alumno); return data; }
export async function batchUpdateAlumno(id: number, updates: any): Promise<Alumno> { const { data } = await api.put(`/alumnos/${id}/batch`, updates); return data; }
export async function deleteAlumno(id: number): Promise<void> { await api.delete(`/alumnos/${id}`); }
export async function deleteAlumnosBulk(ids: number[]): Promise<{ deleted: number }> {
  const { data } = await api.delete("/alumnos", { params: { ids: ids.join(",") } });
  return data;
}
export async function deleteAllAlumnos(escuelaId: number, cursoId: number, materiaId: number): Promise<{ deleted: number }> {
  const { data } = await api.delete("/alumnos", { params: { escuelaId, cursoId, materiaId } });
  return data;
}
export async function getHistorial(alumnoId: number): Promise<HistorialCambio[]> {
  const { data } = await api.get(`/alumnos/${alumnoId}/historial`);
  return data;
}

/* Settings */
export async function getSettings(): Promise<Record<string, string>> { const { data } = await api.get("/settings"); return data; }
export async function saveSettings(s: Record<string, string>): Promise<void> { await api.put("/settings", s); }

/* Backup */
export function getBackupUrl(): string { return "/api/backup/export-db"; }
export async function importBackup(file: File): Promise<any> {
  const fd = new FormData(); fd.append("file", file);
  const { data } = await api.post("/api/backup/import-db", fd);
  return data;
}

/* Import / Export */
export async function importExcel(file: File, escuelaId: number, cursoId: number, materiaId: number): Promise<any> {
  const fd = new FormData(); fd.append("file", file);
  fd.append("escuelaId", String(escuelaId)); fd.append("cursoId", String(cursoId)); fd.append("materiaId", String(materiaId));
  const { data } = await api.post("/import-excel", fd); return data;
}
export function getExportExcelUrl(escuelaId: number, cursoId: number, materiaId: number): string {
  return `/api/export-excel/${cursoId}/${materiaId}/${escuelaId}`;
}
export function getExportPdfUrl(escuelaId: number, cursoId: number, materiaId: number): string {
  return `/api/export-pdf/${cursoId}/${materiaId}/${escuelaId}`;
}
