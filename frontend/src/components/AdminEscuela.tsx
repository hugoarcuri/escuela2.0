import { useState, useEffect, useCallback } from "react";
import type { Escuela, EscuelaFormData } from "../types";
import { getEscuelas, createEscuela, updateEscuela, deleteEscuela } from "../api";
import { useConfirm, useAlert } from "./Modals";

interface Props {
  editId?: number | null;
  onClose: () => void;
  onChanged: () => void;
}

const s: React.CSSProperties = {
  backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)",
};

export default function AdminEscuela({ editId, onClose, onChanged }: Props) {
  const [list, setList] = useState<Escuela[]>([]);
  const [form, setForm] = useState<EscuelaFormData>({ nombre: "", distrito: "", telefono: "" });
  const [editing, setEditing] = useState<Escuela | null>(null);
  const { confirm, modal: confirmModal } = useConfirm();
  const { alert, modal: alertModal } = useAlert();

  const BLUE = { bg: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.30)", text: "#93c5fd" };
  const RED = { bg: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.30)", text: "#fca5a5" };

  function escuelaBadge(nombre: string): typeof BLUE | undefined {
    const n = nombre.toLowerCase();
    if (n.includes("matanza")) return BLUE;
    if (n.includes("morón") || n.includes("moron")) return RED;
    return undefined;
  }

  const load = useCallback(async () => {
    const schools = await getEscuelas();
    setList(schools);
    if (editId) {
      const found = schools.find(s => s.id === editId);
      if (found) editItem(found);
    }
  }, [editId]);
  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ nombre: "", distrito: "", telefono: "" }); setEditing(null); }

  function editItem(e: Escuela) {
    setEditing(e);
    setForm({ nombre: e.nombre, distrito: e.distrito || "", telefono: e.telefono || "" });
  }

  async function handleSave() {
    if (!form.nombre.trim()) { await alert("El nombre es obligatorio"); return; }
    try {
      if (editing) {
        await updateEscuela(editing.id, form);
      } else {
        await createEscuela(form);
      }
      resetForm();
      load();
      onChanged();
    } catch (err: any) {
      await alert(err?.response?.data?.error || "Error al guardar");
    }
  }

  async function handleDelete(id: number) {
    const ok = await confirm("¿Eliminar esta escuela? Se eliminarán también sus cursos y alumnos.");
    if (!ok) return;
    await deleteEscuela(id);
    load();
    onChanged();
    resetForm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h2 className="text-lg font-semibold">Administrar Escuelas</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder="Nombre de la escuela *" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="flex-1 min-w-[200px] rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s} />
            <input type="text" placeholder="Distrito" value={form.distrito}
              onChange={e => setForm(f => ({ ...f, distrito: e.target.value }))}
              className="flex-1 min-w-[120px] rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s} />
            <input type="text" placeholder="Teléfono" value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              className="w-28 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={s} />
            <button onClick={handleSave} className="btn-primary text-sm px-4 py-2">{editing ? "Actualizar" : "Agregar"}</button>
            {editing && <button onClick={resetForm} className="btn-secondary text-sm px-3 py-2">Cancelar</button>}
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {list.map(e => {
              const b = escuelaBadge(e.nombre);
              return (
              <div key={e.id} className="flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: b?.bg ?? "transparent", border: b?.border ?? "none" }}>
                <div className="flex items-center gap-2 min-w-0">
                  {b ? <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.text }} /> : null}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{e.nombre}</div>
                    <div className="text-xs truncate" style={{ color: b?.text ?? "var(--text-secondary)" }}>
                      {e.distrito || ""}{e.distrito && e.telefono ? " | " : ""}{e.telefono || ""}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => editItem(e)} className="text-xs px-2 py-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--accent)" }}>Editar</button>
                  <button onClick={() => handleDelete(e.id)} className="text-xs px-2 py-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--danger)" }}>Eliminar</button>
                </div>
              </div>
              );
            })}
            {list.length === 0 && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Sin escuelas</p>}
          </div>
        </div>
      </div>
      {confirmModal}
      {alertModal}
    </div>
  );
}
