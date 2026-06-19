import { useState, useEffect, useCallback } from "react";
import type { Materia, Curso, MateriaFormData, Escuela } from "../types";
import { getMaterias, createMateria, updateMateria, deleteMateria, getCursos, getEscuelas } from "../api";
import { useConfirm, useAlert } from "./Modals";

interface Props { onClose: () => void; onChanged: () => void; }

const s: React.CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" };

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const TURNOS = ["Mañana", "Tarde", "Vespertino", "Noche"];

export default function AdminMateria({ onClose, onChanged }: Props) {
  const [list, setList] = useState<Materia[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [escuelaId, setEscuelaId] = useState<number>(0);
  const [form, setForm] = useState<MateriaFormData>({ nombre: "", dia: "", turno: "", cursoId: 0 });
  const [editing, setEditing] = useState<Materia | null>(null);
  const { confirm, modal: confirmModal } = useConfirm();
  const { alert, modal: alertModal } = useAlert();

  const load = useCallback(async () => { setEscuelas(await getEscuelas()); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (escuelaId) getCursos(escuelaId).then(setCursos); else setCursos([]); }, [escuelaId]);

  const loadMaterias = useCallback(async () => { if (form.cursoId) setList(await getMaterias(form.cursoId)); }, [form.cursoId]);
  useEffect(() => { loadMaterias(); }, [loadMaterias]);

  function resetForm() { setForm({ nombre: "", dia: "", turno: "", cursoId: 0 }); setEditing(null); }
  function editItem(m: Materia) { setEditing(m); setForm({ nombre: m.nombre, dia: m.dia || "", turno: m.turno || "", cursoId: m.cursoId }); }

  async function handleSave() {
    if (!form.nombre.trim() || !form.cursoId) { await alert("Completá nombre y curso"); return; }
    try {
      if (editing) await updateMateria(editing.id, form);
      else await createMateria(form);
      resetForm(); loadMaterias(); onChanged();
    } catch (err: any) { await alert(err?.message || err?.error?.message || "Error al guardar"); }
  }

  async function handleDelete(id: number) {
    const ok = await confirm("¿Eliminar esta materia? Se eliminarán también sus alumnos.");
    if (!ok) return;
    await deleteMateria(id); loadMaterias(); onChanged(); resetForm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h2 className="text-lg font-semibold">Administrar Materias</h2><button onClick={onClose} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <select value={escuelaId} onChange={e => { setEscuelaId(Number(e.target.value)); setForm(f => ({ ...f, cursoId: 0 })); setEditing(null); }}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s}>
              <option value={0}>Escuela</option>
              {escuelas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <select value={form.cursoId} onChange={e => { setForm(f => ({ ...f, cursoId: Number(e.target.value) })); setEditing(null); }}
              disabled={!escuelaId} className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50" style={s}>
              <option value={0}>Curso</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <select value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s}>
              <option value="">Materia</option>
              <option value="SISTEMAS">SISTEMAS</option>
              <option value="PROGRAMACIÓN">PROGRAMACIÓN</option>
              <option value="HARDWARE">HARDWARE</option>
              <option value="APLICACIONES">APLICACIONES</option>
            </select>
            <select value={form.dia} onChange={e => setForm(f => ({ ...f, dia: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s}>
              <option value="">Día</option>
              {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={form.turno} onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s}>
              <option value="">Turno</option>
              {TURNOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={handleSave} className="btn-primary text-sm px-3 py-2">{editing ? "Actualizar" : "Agregar"}</button>
            {editing && <button onClick={resetForm} className="btn-secondary text-sm px-3 py-2">Cancelar</button>}
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {list.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--hover-bg)]">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{m.nombre}</span>
                  {m.dia && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>{m.dia}</span>}
                  {m.turno && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>{m.turno}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => editItem(m)} className="text-xs px-2 py-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--accent)" }}>Editar</button>
                  <button onClick={() => handleDelete(m.id)} className="text-xs px-2 py-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--danger)" }}>Eliminar</button>
                </div>
              </div>
            ))}
            {list.length === 0 && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Sin materias en este curso</p>}
          </div>
        </div>
      </div>
      {confirmModal}{alertModal}
    </div>
  );
}
