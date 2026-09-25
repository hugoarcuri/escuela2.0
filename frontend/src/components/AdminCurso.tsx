import { useEffect, useState } from "react";
import type { Curso, Escuela, CursoFormData } from "../types";
import { getCursos, createCurso, updateCurso, deleteCurso, getEscuelas } from "../api";
import { useConfirm } from "./Modals";

interface Props {
  initialEscuelaId?: number;
  initialCursoId?: number;
  onClose: () => void;
  onChanged: () => void;
}

const inputStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" };
const labelStyle: React.CSSProperties = { color: "var(--text-secondary)" };

function emptyForm(escuelaId = 0): CursoFormData {
  return { anio: "", division: "", grupo: "", turno: "", escuelaId };
}

function courseToForm(curso: Curso): CursoFormData {
  return { anio: String(curso.anio), division: curso.division, grupo: curso.grupo || "", turno: curso.turno || "", escuelaId: curso.escuelaId };
}

function courseLabel(curso: Curso): string {
  return `${curso.anio}° ${curso.division}${curso.grupo ? ` - ${curso.grupo}` : ""}`;
}

function getErrorMessage(error: unknown, fallback = "Error al guardar"): string {
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown };
    if (typeof value.message === "string" && value.message) return value.message;
  }
  return fallback;
}

export default function AdminCurso({ initialEscuelaId, initialCursoId, onClose, onChanged }: Props) {
  const [list, setList] = useState<Curso[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [form, setForm] = useState<CursoFormData>(() => emptyForm(initialEscuelaId));
  const [editing, setEditing] = useState<Curso | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const { confirm, modal: confirmModal } = useConfirm();

  useEffect(() => {
    let cancelled = false;
    void getEscuelas()
      .then(value => { if (!cancelled) setEscuelas(value); })
      .catch(reason => { if (!cancelled) setError(getErrorMessage(reason, "No se pudieron cargar las escuelas")); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!form.escuelaId) return;
    let cancelled = false;
    void getCursos(form.escuelaId)
      .then(value => { if (!cancelled) setList(value); })
      .catch(reason => { if (!cancelled) { setList([]); setError(getErrorMessage(reason, "No se pudieron cargar los cursos")); } });
    return () => { cancelled = true; };
  }, [form.escuelaId]);

  const selectedCourse = initialCursoId ? list.find(curso => curso.id === initialCursoId) : undefined;
  const selectedSchool = escuelas.find(escuela => escuela.id === form.escuelaId);

  function resetForm() {
    const escuelaId = form.escuelaId || escuelas[0]?.id || initialEscuelaId || 0;
    setForm(emptyForm(escuelaId));
    setEditing(null);
  }

  function cancelEdit() {
    resetForm();
    setError("");
    setStatus("");
  }

  function changeSchool(escuelaId: number) {
    setForm(emptyForm(escuelaId));
    setList([]);
    setEditing(null);
    setError("");
    setStatus("");
  }

  function editItem(curso: Curso) {
    setEditing(curso);
    setForm(courseToForm(curso));
    setError("");
    setStatus("");
  }

  async function handleSave() {
    const anio = Number(form.anio);
    const message = editing ? "Completá año y división" : "Completá año, división, grupo y turno";
    if (!form.anio.trim() || !form.division.trim() || !form.escuelaId || !Number.isInteger(anio) || (!editing && (!form.grupo.trim() || !form.turno.trim()))) {
      setError(message);
      return;
    }

    const escuelaId = form.escuelaId;
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const saved = editing ? await updateCurso(editing.id, form) : await createCurso(form);
      const refreshed = await getCursos(escuelaId);
      setList(refreshed);
      onChanged();
      if (editing) {
        const current = refreshed.find(curso => curso.id === editing.id) ?? saved;
        setEditing(current);
        setForm(courseToForm(current));
        setStatus("Curso actualizado correctamente.");
      } else {
        resetForm();
        setStatus("Curso agregado correctamente.");
      }
    } catch (reason: unknown) {
      setError(getErrorMessage(reason, "No se pudo guardar el curso"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const ok = await confirm("¿Eliminar este curso? Se eliminarán también sus materias y alumnos.");
    if (!ok) return;
    const escuelaId = form.escuelaId;
    try {
      await deleteCurso(id);
      if (escuelaId) setList(await getCursos(escuelaId));
      onChanged();
      if (editing?.id === id) resetForm();
    } catch (reason: unknown) {
      setError(getErrorMessage(reason, "No se pudo eliminar el curso"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 md:p-4">
      <div className="modal-mobile w-full max-w-2xl overflow-y-auto rounded-none shadow-xl md:rounded-2xl" style={{ backgroundColor: "var(--bg-card)", maxHeight: "90vh" }}>
        <div className="flex items-start justify-between gap-4 border-b p-4 sm:p-5" style={{ borderColor: "var(--border-color)" }}>
          <div>
            <h2 className="text-lg font-semibold">Administrar cursos</h2>
            <p className="mt-1 text-xs" style={labelStyle}>Editá los datos del curso o agregá uno nuevo.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="touch-target rounded-lg p-2 hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {error && (
            <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Cerrar mensaje" className="shrink-0 px-1">✕</button>
            </div>
          )}
          {status && (
            <div role="status" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--success)", color: "var(--success)" }}>{status}</div>
          )}

          {selectedCourse && editing?.id !== selectedCourse.id && (
            <div className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--accent)", backgroundColor: "color-mix(in srgb, var(--accent) 8%, transparent)" }}>
              <div className="min-w-0">
                <div className="text-xs" style={labelStyle}>Curso seleccionado en la página</div>
                <div className="truncate text-sm font-semibold">{courseLabel(selectedCourse)}</div>
              </div>
              <button type="button" onClick={() => editItem(selectedCourse)} className="btn-secondary btn-sm shrink-0">Editar curso</button>
            </div>
          )}

          <section className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)" }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{editing ? "Editando curso" : "Agregar curso"}</h3>
                <p className="mt-0.5 text-xs" style={labelStyle}>{editing ? "Modificá los datos y guardá los cambios." : "Completá los datos para crear un curso."}</p>
              </div>
              {editing && <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}>Modo edición</span>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block min-w-0 sm:col-span-2">
                <span className="mb-1 block text-xs font-medium" style={labelStyle}>Escuela</span>
                <select value={form.escuelaId} disabled={editing !== null || saving} onChange={event => changeSchool(Number(event.target.value))} className="input" style={inputStyle}>
                  <option value={0}>Seleccionar escuela</option>
                  {escuelas.map(escuela => <option key={escuela.id} value={escuela.id}>{escuela.nombre}</option>)}
                </select>
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium" style={labelStyle}>Año del curso *</span>
                <input type="number" inputMode="numeric" min={1} value={form.anio} onChange={event => setForm(current => ({ ...current, anio: event.target.value }))} className="input" style={inputStyle} />
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium" style={labelStyle}>División *</span>
                <input type="text" value={form.division} onChange={event => setForm(current => ({ ...current, division: event.target.value }))} className="input" style={inputStyle} />
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium" style={labelStyle}>Grupo {editing ? "" : "*"}</span>
                <input type="text" value={form.grupo} onChange={event => setForm(current => ({ ...current, grupo: event.target.value }))} className="input" style={inputStyle} />
              </label>
              {!editing && (
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-medium" style={labelStyle}>Turno *</span>
                  <input type="text" value={form.turno} onChange={event => setForm(current => ({ ...current, turno: event.target.value }))} className="input" style={inputStyle} />
                </label>
              )}
              {editing && (
                <div className="self-end rounded-lg px-3 py-2 text-xs sm:col-span-2" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                  Turno actual: {editing.turno || "sin turno"}. El turno no se modifica al editar.
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full sm:w-auto sm:min-w-40">
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Agregar curso"}
              </button>
              {editing && <button type="button" onClick={cancelEdit} disabled={saving} className="btn-secondary w-full sm:w-auto">Cancelar</button>}
            </div>
          </section>

          <section className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)" }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Cursos de {selectedSchool?.nombre || "la escuela"}</h3>
                <p className="mt-0.5 text-xs" style={labelStyle}>Usá “Editar” para cargar un curso en el formulario.</p>
              </div>
              <span className="shrink-0 rounded-full px-2 py-1 text-xs" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>{list.length}</span>
            </div>

            <div className="max-h-64 divide-y overflow-y-auto" style={{ borderColor: "var(--border-color)" }}>
              {list.map(curso => {
                const isEditing = editing?.id === curso.id;
                const isSelected = initialCursoId === curso.id;
                return (
                  <div key={curso.id} className="flex items-center gap-3 py-3" style={{ backgroundColor: isEditing ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent" }}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{courseLabel(curso)}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs" style={labelStyle}>
                        <span>{curso.turno ? `Turno: ${curso.turno}` : "Sin turno"}</span>
                        {isSelected && <span className="rounded-full px-1.5 py-0.5" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}>Seleccionado</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => editItem(curso)} aria-label={`Editar ${courseLabel(curso)}`} className="btn-secondary btn-sm">Editar</button>
                      <button type="button" onClick={() => handleDelete(curso.id)} aria-label={`Eliminar ${courseLabel(curso)}`} className="btn-danger btn-sm">Eliminar</button>
                    </div>
                  </div>
                );
              })}
              {list.length === 0 && <p className="py-4 text-center text-sm" style={labelStyle}>No hay cursos para esta escuela.</p>}
            </div>
          </section>
        </div>
      </div>
      {confirmModal}
    </div>
  );
}
