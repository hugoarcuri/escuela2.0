import { useState, useEffect, useCallback } from "react";
import type { Alumno, Asistencia } from "../types";
import { getAsistenciasPorFecha, saveAsistenciasBatch } from "../api";
import { useAlert } from "./Modals";

interface Props {
  alumnos: Alumno[];
  escuelaId: number;
  cursoId: number;
  materiaId: number;
}

const ESTADOS = [
  { key: "P", label: "P", title: "Presente", color: "var(--success)" },
  { key: "A", label: "A", title: "Ausente", color: "var(--danger)" },
  { key: "T", label: "T", title: "Tarde", color: "#f59e0b" },
  { key: "J", label: "J", title: "Justificado", color: "var(--accent)" },
];

export default function Asistencias({ alumnos, escuelaId, cursoId, materiaId }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(today);
  const [asistencias, setAsistencias] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const { alert, modal: alertModal } = useAlert();

  const load = useCallback(async () => {
    const records = await getAsistenciasPorFecha(escuelaId, cursoId, materiaId, fecha);
    const map: Record<number, string> = {};
    for (const r of records) map[r.alumnoId] = r.estado;
    setAsistencias(map);
  }, [escuelaId, cursoId, materiaId, fecha]);

  useEffect(() => { load(); }, [load]);

  function setEstado(alumnoId: number) {
    setAsistencias(prev => {
      const current = prev[alumnoId] || "P";
      const idx = ESTADOS.findIndex(e => e.key === current);
      const next = ESTADOS[(idx + 1) % ESTADOS.length].key;
      return { ...prev, [alumnoId]: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const records = alumnos.map(a => ({
        alumnoId: a.id,
        escuelaId,
        cursoId,
        materiaId,
        fecha,
        estado: asistencias[a.id] || "P",
      }));
      await saveAsistenciasBatch(records);
      await alert("Asistencias guardadas");
    } catch { await alert("Error al guardar"); }
    setSaving(false);
  }

  function marcarTodos(estado: string) {
    const map: Record<number, string> = {};
    for (const a of alumnos) map[a.id] = estado;
    setAsistencias(map);
  }

  const btnStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" };

  const presentes = alumnos.filter(a => (asistencias[a.id] || "P") === "P").length;
  const ausentes = alumnos.filter(a => asistencias[a.id] === "A").length;
  const tardes = alumnos.filter(a => asistencias[a.id] === "T").length;
  const justificados = alumnos.filter(a => asistencias[a.id] === "J").length;

  if (!alumnos.length) return <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>No hay alumnos</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <label className="text-sm font-medium">Fecha:</label>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
        <span className="text-sm" style={{ color: "var(--success)" }}>P: <strong>{presentes}</strong></span>
        <span className="text-sm" style={{ color: "var(--danger)" }}>A: <strong>{ausentes}</strong></span>
        <span className="text-sm" style={{ color: "#f59e0b" }}>T: <strong>{tardes}</strong></span>
        <span className="text-sm" style={{ color: "var(--accent)" }}>J: <strong>{justificados}</strong></span>
        <div className="flex-1" />
        <button onClick={() => marcarTodos("P")} className="btn-ghost text-xs px-2 py-1" style={btnStyle}>Todos P</button>
        <button onClick={() => marcarTodos("A")} className="btn-ghost text-xs px-2 py-1" style={btnStyle}>Todos A</button>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div className="overflow-y-auto rounded-xl border" style={{ borderColor: "var(--border-color)", maxHeight: "calc(100vh - 320px)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>Apellido y Nombre</th>
              <th className="px-3 py-2 text-center font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map(a => {
              const estado = asistencias[a.id] || "P";
              const est = ESTADOS.find(e => e.key === estado)!;
              return (
                <tr key={a.id} className="transition-colors" style={{ borderColor: "var(--border-color)" }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = "var(--hover-bg)"; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <td className="px-3 py-2 font-medium border-b" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                    {a.apellidoNombre}
                  </td>
                  <td className="px-3 py-2 text-center border-b" style={{ borderColor: "var(--border-color)" }}>
                    <button onClick={() => setEstado(a.id)}
                      className="w-10 h-10 rounded-full text-sm font-bold border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: estado === "P" ? "transparent" : est.color + "20", color: est.color, borderColor: est.color }}
                      title={est.title}>
                      {est.label}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 text-xs" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card)", borderLeft: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        {alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""} · Clic en el círculo para cambiar: P → A → T → J
      </div>
      {alertModal}
    </div>
  );
}
