import { supabase } from "./supabase";
import type { Escuela, Curso, Materia, Alumno, AlumnoDB, EscuelaFormData, CursoFormData, MateriaFormData, FormLink, Asistencia, AgendaItem } from "./types";
import { mapAlumno } from "./types";

/* Escuelas */
export async function getEscuelas(): Promise<Escuela[]> {
  const { data, error } = await supabase.from("escuelas").select("*").order("nombre");
  if (error) throw error;
  return data ?? [];
}
export async function createEscuela(d: EscuelaFormData): Promise<Escuela> {
  const { data, error } = await supabase.from("escuelas").insert({ nombre: d.nombre, distrito: d.distrito || null, telefono: d.telefono || null }).select().single();
  if (error) throw error;
  return data;
}
export async function updateEscuela(id: number, d: EscuelaFormData): Promise<Escuela> {
  const { data, error } = await supabase.from("escuelas").update({ nombre: d.nombre, distrito: d.distrito || null, telefono: d.telefono || null }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteEscuela(id: number): Promise<void> {
  const { error } = await supabase.from("escuelas").delete().eq("id", id);
  if (error) throw error;
}

/* Cursos */
export async function getCursos(escuelaId: number): Promise<Curso[]> {
  const { data, error } = await supabase.from("cursos").select("*").eq("escuelaId", escuelaId).order("anio").order("division");
  if (error) throw error;
  return data ?? [];
}
export async function createCurso(d: CursoFormData): Promise<Curso> {
  const { data, error } = await supabase.from("cursos").insert({ nombre: `${d.anio}° ${d.division}`, anio: parseInt(d.anio), division: d.division, turno: d.turno, escuelaId: d.escuelaId }).select().single();
  if (error) throw error;
  return data;
}
export async function updateCurso(id: number, d: CursoFormData): Promise<Curso> {
  const { data, error } = await supabase.from("cursos").update({ nombre: `${d.anio}° ${d.division}`, anio: parseInt(d.anio), division: d.division, turno: d.turno }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteCurso(id: number): Promise<void> {
  const { error } = await supabase.from("cursos").delete().eq("id", id);
  if (error) throw error;
}

/* Materias */
export async function getMaterias(cursoId: number): Promise<Materia[]> {
  const { data, error } = await supabase.from("materias").select("*").eq("cursoId", cursoId).order("nombre");
  if (error) throw error;
  return data ?? [];
}
export async function createMateria(d: MateriaFormData): Promise<Materia> {
  const { data, error } = await supabase.from("materias").insert({ nombre: d.nombre, dia: d.dia || null, turno: d.turno || null, cursoId: d.cursoId }).select().single();
  if (error) throw error;
  return data;
}
export async function updateMateria(id: number, d: MateriaFormData): Promise<Materia> {
  const { data, error } = await supabase.from("materias").update({ nombre: d.nombre, dia: d.dia || null, turno: d.turno || null }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteMateria(id: number): Promise<void> {
  const { error } = await supabase.from("materias").delete().eq("id", id);
  if (error) throw error;
}

/* Alumnos */
let _notaFinalMode = "auto";
export function setNotaFinalMode(m: string) { _notaFinalMode = m; }
export function getNotaFinalMode() { return _notaFinalMode; }

export async function getAlumnos(params: { escuelaId: number; cursoId: number; materiaId: number; anioLectivo?: number; search?: string; filtro?: string }): Promise<Alumno[]> {
  let q = supabase.from("alumnos").select("*").eq("escuelaId", params.escuelaId).eq("cursoId", params.cursoId).eq("materiaId", params.materiaId);
  if (params.anioLectivo) q = q.eq("anioLectivo", params.anioLectivo);
  if (params.search) q = q.ilike("apellidoNombre", `%${params.search}%`);
  if (params.filtro === "sin-nota") q = q.is("nota1", null).is("nota2", null).is("nota3", null);
  q = q.order("apellidoNombre");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((a: AlumnoDB) => mapAlumno(a, _notaFinalMode === "manual"));
}
export async function createAlumno(alumno: Partial<AlumnoDB>): Promise<Alumno> {
  const { data, error } = await supabase.from("alumnos").insert(alumno).select().single();
  if (error) throw error;
  return mapAlumno(data, _notaFinalMode === "manual");
}
export async function updateAlumno(id: number, alumno: Partial<AlumnoDB>): Promise<Alumno> {
  const { data, error } = await supabase.from("alumnos").update(alumno).eq("id", id).select().single();
  if (error) throw error;
  return mapAlumno(data, _notaFinalMode === "manual");
}
export async function batchUpdateAlumno(id: number, updates: any): Promise<Alumno> {
  const { data, error } = await supabase.from("alumnos").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return mapAlumno(data, _notaFinalMode === "manual");
}
export async function deleteAlumno(id: number): Promise<void> {
  const { error } = await supabase.from("alumnos").delete().eq("id", id);
  if (error) throw error;
}
export async function deleteAlumnosBulk(ids: number[]): Promise<{ deleted: number }> {
  const { error } = await supabase.from("alumnos").delete().in("id", ids);
  if (error) throw error;
  return { deleted: ids.length };
}
export async function deleteAllAlumnos(escuelaId: number, cursoId: number, materiaId: number): Promise<{ deleted: number }> {
  const { data } = await supabase.from("alumnos").select("id").eq("escuelaId", escuelaId).eq("cursoId", cursoId).eq("materiaId", materiaId);
  const ids = (data ?? []).map((a: any) => a.id);
  if (ids.length > 0) {
    const { error } = await supabase.from("alumnos").delete().in("id", ids);
    if (error) throw error;
  }
  return { deleted: ids.length };
}
export async function getHistorial(alumnoId: number): Promise<any[]> {
  const { data, error } = await supabase.from("historialCambio").select("*").eq("alumnoId", alumnoId).order("createdAt", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* Settings */
export async function getSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("settings").select("*");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const s of data ?? []) map[s.clave] = s.valor;
  return map;
}
export async function saveSettings(s: Record<string, string>): Promise<void> {
  for (const [clave, valor] of Object.entries(s)) {
    const { error } = await supabase.from("settings").upsert({ clave, valor }, { onConflict: "clave" });
    if (error) throw error;
  }
}

/* Backup */
export function getBackupUrl(): string { return ""; }
export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  const json = JSON.parse(text);
  for (const table of ["escuelas", "cursos", "materias", "alumnos", "historialCambio", "settings", "formLinks"] as const) {
    if (json[table]?.length) {
      const { data: existing } = await supabase.from(table).select("id");
      const ids = (existing ?? []).map((r: any) => r.id);
      if (ids.length > 0) { const { error } = await supabase.from(table).delete().in("id", ids); if (error) throw error; }
      const { error: insErr } = await supabase.from(table).insert(json[table]);
      if (insErr) throw insErr;
    }
  }
}
export async function exportBackup(): Promise<void> {
  const tables = ["escuelas", "cursos", "materias", "alumnos", "historialCambio", "settings", "formLinks"] as const;
  const data: any = {};
  for (const table of tables) {
    const { data: rows } = await supabase.from(table).select("*");
    data[table] = rows ?? [];
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* Form Links */
export async function generateFormLink(escuelaId: number, cursoId: number, materiaId: number, anioLectivo: number): Promise<FormLink> {
  const token = Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join("");
  const { data, error } = await supabase.from("formLinks").insert({ token, escuelaId, cursoId, materiaId, anioLectivo }).select().single();
  if (error) throw error;
  return data;
}
export async function getFormLink(token: string): Promise<FormLink | null> {
  const { data, error } = await supabase.from("formLinks").select("*").eq("token", token).single();
  if (error) return null;
  return data;
}
export async function submitForm(token: string, apellido: string, nombre: string): Promise<{ duplicado: boolean; message: string }> {
  const link = await getFormLink(token);
  if (!link) throw new Error("Formulario no encontrado");
  const fullName = `${apellido.toUpperCase().trim()}, ${nombre.toUpperCase().trim()}`;
  const { data: exists } = await supabase.from("alumnos").select("id").eq("apellidoNombre", fullName).eq("escuelaId", link.escuelaId).eq("cursoId", link.cursoId).eq("materiaId", link.materiaId).eq("anioLectivo", link.anioLectivo).maybeSingle();
  if (exists) return { duplicado: true, message: "Ya estás registrado" };
  const { error } = await supabase.from("alumnos").insert({ apellidoNombre: fullName, escuelaId: link.escuelaId, cursoId: link.cursoId, materiaId: link.materiaId, anioLectivo: link.anioLectivo });
  if (error) throw error;
  return { duplicado: false, message: "Alumno agregado correctamente" };
}
export async function pollFormCount(link: FormLink): Promise<number> {
  const { count, error } = await supabase.from("alumnos").select("id", { count: "exact", head: true }).eq("escuelaId", link.escuelaId).eq("cursoId", link.cursoId).eq("materiaId", link.materiaId).eq("anioLectivo", link.anioLectivo);
  if (error) throw error;
  return count ?? 0;
}

/* Import / Export */
import * as XLSX from "xlsx";

export async function importExcel(file: File, escuelaId: number, cursoId: number, materiaId: number, anioLectivo?: number): Promise<{ imported: number; errors: string[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const errors: string[] = [];
  let imported = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    const nombre = String(row[0] || "").trim().toUpperCase();
    if (!nombre) continue;
    try {
      const alumno: any = { apellidoNombre: nombre, escuelaId, cursoId, materiaId, anioLectivo: anioLectivo || new Date().getFullYear() };
      if (row[1]) alumno.nota1 = parseFloat(row[1]);
      if (row[2]) alumno.nota2 = parseFloat(row[2]);
      if (row[3]) alumno.nota3 = parseFloat(row[3]);
      if (row[4]) alumno.nota4 = parseFloat(row[4]);
      if (row[5]) alumno.nota5 = parseFloat(row[5]);
      if (row[6]) alumno.nota6 = parseFloat(row[6]);
      const { error } = await supabase.from("alumnos").insert(alumno);
      if (error) errors.push(`Fila ${i + 1}: ${error.message}`);
      else imported++;
    } catch (e: any) { errors.push(`Fila ${i + 1}: ${e.message}`); }
  }
  return { imported, errors };
}

export async function importList(list: string, escuelaId: number, cursoId: number, materiaId: number, anioLectivo: number): Promise<{ imported: number; errors: string[] }> {
  const lines = list.split("\n").map(l => l.trim()).filter(l => l);
  const errors: string[] = [];
  let imported = 0;
  for (const line of lines) {
    try {
      const apellidoNombre = line.toUpperCase().trim();
      const { error } = await supabase.from("alumnos").insert({ apellidoNombre, escuelaId, cursoId, materiaId, anioLectivo });
      if (error) errors.push(`${apellidoNombre}: ${error.message}`);
      else imported++;
    } catch (e: any) { errors.push(`${line}: ${e.message}`); }
  }
  return { imported, errors };
}

/* Asistencias */
export async function getAsistenciasDelAnio(materiaId: number, anio: number): Promise<Asistencia[]> {
  const start = `${anio}-01-01`;
  const end = `${anio}-12-31`;
  const { data, error } = await supabase.from("asistencias")
    .select("*").eq("materiaId", materiaId).gte("fecha", start).lte("fecha", end);
  if (error) throw error;
  return data ?? [];
}
export async function getAsistenciasDelMes(materiaId: number, anio: number, mes: number): Promise<Asistencia[]> {
  const start = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const endDate = new Date(anio, mes, 0);
  const end = `${anio}-${String(mes).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  const { data, error } = await supabase.from("asistencias")
    .select("*").eq("materiaId", materiaId).gte("fecha", start).lte("fecha", end);
  if (error) throw error;
  return data ?? [];
}
export async function saveAsistenciasBatch(records: { alumnoId: number; materiaId: number; fecha: string; estado: string }[]): Promise<void> {
  const { error } = await supabase.from("asistencias").upsert(records, { onConflict: "alumnoId,materiaId,fecha" });
  if (error) throw error;
}

/* Agenda */
export async function getAgenda(materiaId: number): Promise<AgendaItem[]> {
  const { data, error } = await supabase.from("agenda")
    .select("*").eq("materiaId", materiaId).order("fecha", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function saveAgendaItem(item: { materiaId: number; titulo: string; descripcion?: string; fecha: string; tipo: "evaluacion" | "entrega" }): Promise<AgendaItem> {
  const { data, error } = await supabase.rpc("insert_agenda", {
    materia_id: item.materiaId,
    tit: item.titulo,
    descr: item.descripcion || "",
    f: item.fecha,
    t: item.tipo,
  });
  if (error) throw error;
  return data as unknown as AgendaItem;
}

export async function updateAgendaItem(id: number, item: { titulo?: string; descripcion?: string; fecha?: string; tipo?: "evaluacion" | "entrega" }): Promise<void> {
  const { error } = await supabase.rpc("update_agenda", {
    item_id: id,
    tit: item.titulo || "",
    descr: item.descripcion || "",
    f: item.fecha || "",
    t: item.tipo || "evaluacion",
  });
  if (error) throw error;
}

export async function deleteAgendaItem(id: number): Promise<void> {
  const { error } = await supabase.rpc("delete_agenda", { item_id: id });
  if (error) throw error;
}

export function getExportExcelUrl(): string { return ""; }
export function getExportPdfUrl(): string { return ""; }
