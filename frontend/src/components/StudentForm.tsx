import { useState, useEffect } from "react";
import type { Alumno, AlumnoFormData } from "../types";
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

function promedio(vals: number[]): number | null {
  return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100 : null;
}
function getNum(val: string): number | null { const n = parseFloat(val); return isNaN(n) ? null : n; }
function calcularInforme(notaC: number | null): string | null {
  if (notaC === null) return null;
  return notaC >= 7 ? "TEA" : "TEP";
}

export default function StudentForm({ alumno, escuelaId, cursoId, materiaId, anioLectivo, onClose, onSaved }: Props) {
  const [form, setForm] = useState<AlumnoFormData>({
    apellidoNombre: "", nota1: "", nota2: "", nota3: "", nota4: "", nota5: "", nota6: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (alumno) {
      setForm({
        apellidoNombre: alumno.apellidoNombre,
        nota1: alumno.nota1?.toString() ?? "",
        nota2: alumno.nota2?.toString() ?? "",
        nota3: alumno.nota3?.toString() ?? "",
        nota4: alumno.nota4?.toString() ?? "",
        nota5: alumno.nota5?.toString() ?? "",
        nota6: alumno.nota6?.toString() ?? "",
      });
    }
  }, [alumno]);

  const nota1C = promedio([getNum(form.nota1), getNum(form.nota2), getNum(form.nota3)].filter((v): v is number => v !== null));
  const nota2C = promedio([getNum(form.nota4), getNum(form.nota5), getNum(form.nota6)].filter((v): v is number => v !== null));
  const notaFinal = promedio([nota1C, nota2C].filter((v): v is number => v !== null));
  const situacion = notaFinal !== null ? (notaFinal >= 7 ? "Aprobado" : "Desaprobado") : "";
  const informe1 = calcularInforme(nota1C);
  const informe2 = calcularInforme(nota2C);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.apellidoNombre.trim()) { setError("Apellido y Nombre son obligatorios"); return; }
    setSaving(true); setError("");
    try {
      const data = { ...form, escuelaId, cursoId, materiaId, anioLectivo };
      if (alumno) {
        await updateAlumno(alumno.id, data);
      } else {
        await createAlumno(data);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al guardar");
    } finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h2 className="text-lg font-semibold">{alumno ? "Editar Alumno" : "Agregar Alumno"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Apellido y Nombre *</label>
              <input type="text" value={form.apellidoNombre} onChange={e => setForm(f => ({ ...f, apellidoNombre: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={inputStyle} />
            </div>
            <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nota 1</label>
              <input type="number" step="0.01" min="0" max="10" value={form.nota1} onChange={e => setForm(f => ({ ...f, nota1: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={inputStyle} /></div>
            <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nota 2</label>
              <input type="number" step="0.01" min="0" max="10" value={form.nota2} onChange={e => setForm(f => ({ ...f, nota2: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={inputStyle} /></div>
            <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nota 3</label>
              <input type="number" step="0.01" min="0" max="10" value={form.nota3} onChange={e => setForm(f => ({ ...f, nota3: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={inputStyle} /></div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Nota 1° Cuatrimestre: </span>
              <span className="font-bold">{nota1C ?? "—"}</span>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Informe 1 <span className="text-[10px]">(automático)</span></label>
              <div className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold ${informe1 === "TEA" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : informe1 === "TEP" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                {informe1 ?? "—"}
              </div>
            </div>
            <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nota 4</label>
              <input type="number" step="0.01" min="0" max="10" value={form.nota4} onChange={e => setForm(f => ({ ...f, nota4: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={inputStyle} /></div>
            <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nota 5</label>
              <input type="number" step="0.01" min="0" max="10" value={form.nota5} onChange={e => setForm(f => ({ ...f, nota5: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={inputStyle} /></div>
            <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nota 6</label>
              <input type="number" step="0.01" min="0" max="10" value={form.nota6} onChange={e => setForm(f => ({ ...f, nota6: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" style={inputStyle} /></div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Informe 2 <span className="text-[10px]">(automático)</span></label>
              <div className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold ${informe2 === "TEA" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : informe2 === "TEP" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                {informe2 ?? "—"}
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Nota Final: </span>
              <span className="font-bold">{notaFinal ?? "—"}</span>
              {situacion && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${situacion === "Aprobado" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>{situacion}</span>}
            </div>
          </div>
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
