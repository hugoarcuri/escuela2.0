import { useState, useEffect } from "react";
import type { Alumno } from "../types";
import { createAlumno, updateAlumno } from "../api";

interface Props {
  alumno: Alumno | null;
  escuelaId: number;
  cursoId: number;
  materiaId: number;
  anioLectivo: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function StudentForm({ alumno, escuelaId, cursoId, materiaId, anioLectivo, onClose, onSaved }: Props) {
  const [apellidoNombre, setApellidoNombre] = useState("");
  const [recursante, setRecursante] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (alumno) {
      setApellidoNombre(alumno.apellidoNombre);
      setRecursante(alumno.recursante);
    }
  }, [alumno]);

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apellidoNombre.trim()) { setError("Apellido y Nombre son obligatorios"); return; }
    setSaving(true); setError("");
    try {
      const db = { apellidoNombre: apellidoNombre.trim(), recursante, escuelaId, cursoId, materiaId, anioLectivo };
      if (alumno) { await updateAlumno(alumno.id, db); } else { await createAlumno(db); }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Error al guardar");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-md" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h2 className="text-lg font-semibold">{alumno ? "Editar Alumno" : "Agregar Alumno"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>{error}</div>}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Apellido y Nombre *</label>
            <input type="text" value={apellidoNombre} onChange={e => setApellidoNombre(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={inputStyle} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={recursante} onChange={e => setRecursante(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]" />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Recursante</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}>Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
              {saving ? "Guardando..." : alumno ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
