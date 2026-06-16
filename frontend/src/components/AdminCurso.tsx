import { useState, useEffect, useCallback } from "react";
import type { Curso, Escuela, CursoFormData } from "../types";
import { getCursos, createCurso, updateCurso, deleteCurso, getEscuelas } from "../api";
import { useConfirm, useAlert } from "./Modals";

interface Props { onClose: () => void; onChanged: () => void; }

const s: React.CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" };

export default function AdminCurso({ onClose, onChanged }: Props) {
  const [list, setList] = useState<Curso[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [form, setForm] = useState<CursoFormData>({ anio: "", division: "", turno: "", escuelaId: 0 });
  const [editing, setEditing] = useState<Curso | null>(null);
  const { confirm, modal: confirmModal } = useConfirm();
  const { alert, modal: alertModal } = useAlert();

  const load = useCallback(async () => { setEscuelas(await getEscuelas()); }, []);
  const loadCursos = useCallback(async () => { if (form.escuelaId) setList(await getCursos(form.escuelaId)); }, [form.escuelaId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCursos(); }, [loadCursos]);

  function resetForm() { setForm({ anio: "", division: "", turno: "", escuelaId: escuelas[0]?.id || 0 }); setEditing(null); }

  function editItem(c: Curso) { setEditing(c); setForm({ anio: String(c.anio), division: c.division, turno: c.turno || "", escuelaId: c.escuelaId }); }

  async function handleSave() {
    if (!form.anio || !form.division || !form.escuelaId) { await alert("Completá año, división y escuela"); return; }
    try {
      if (editing) await updateCurso(editing.id, form);
      else await createCurso(form);
      resetForm(); loadCursos(); onChanged();
    } catch (err: any) { await alert(err?.response?.data?.error || "Error al guardar"); }
  }

  async function handleDelete(id: number) {
    const ok = await confirm("¿Eliminar este curso? Se eliminarán también sus materias y alumnos.");
    if (!ok) return;
    await deleteCurso(id); loadCursos(); onChanged(); resetForm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h2 className="text-lg font-semibold">Administrar Cursos</h2><button onClick={onClose} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <select value={form.escuelaId} onChange={e => { setForm(f => ({ ...f, escuelaId: Number(e.target.value) })); setEditing(null); }}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s}>
              <option value={0}>Seleccionar escuela</option>
              {escuelas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <input type="number" placeholder="Año" value={form.anio} onChange={e => setForm(f => ({ ...f, anio: e.target.value }))}
              className="w-20 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s} />
            <input type="text" placeholder="División" value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))}
              className="w-24 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s} />
            <input type="text" placeholder="Turno" value={form.turno} onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}
              className="w-28 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s} />
            <button onClick={handleSave} className="btn-primary text-sm px-3 py-2">{editing ? "Actualizar" : "Agregar"}</button>
            {editing && <button onClick={resetForm} className="btn-secondary text-sm px-3 py-2">Cancelar</button>}
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {list.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--hover-bg)]">
                <div className="text-sm font-medium">{c.nombre} {c.turno ? `(${c.turno})` : ""}</div>
                <div className="flex gap-1">
                  <button onClick={() => editItem(c)} className="text-xs px-2 py-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--accent)" }}>Editar</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs px-2 py-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--danger)" }}>Eliminar</button>
                </div>
              </div>
            ))}
            {list.length === 0 && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Sin cursos en esta escuela</p>}
          </div>
        </div>
      </div>
      {confirmModal}{alertModal}
    </div>
  );
}
