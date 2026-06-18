import { useState, useEffect, useCallback } from "react";
import type { Alumno, Asistencia } from "../types";
import { getAsistenciasDelMes, saveAsistenciasBatch } from "../api";
import { useAlert } from "./Modals";

interface Props {
  alumnos: Alumno[];
  materiaId: number;
}

const ESTADOS = [
  { key: "P", label: "P", title: "Presente", color: "var(--success)" },
  { key: "A", label: "A", title: "Ausente", color: "var(--danger)" },
  { key: "T", label: "T", title: "Tarde", color: "#f59e0b" },
  { key: "J", label: "J", title: "Justificado", color: "var(--accent)" },
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function obtenerSemanas(anio: number, mes: number): { semana: number; fecha: string }[] {
  const semanas: { semana: number; fecha: string }[] = [];
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  let semana = 1;
  for (let d = new Date(primerDia); d <= ultimoDia; d.setDate(d.getDate() + 7)) {
    const fechaStr = d.toISOString().slice(0, 10);
    semanas.push({ semana: semana++, fecha: fechaStr });
  }
  return semanas;
}

export default function Asistencias({ alumnos, materiaId }: Props) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [classDates, setClassDates] = useState<Record<number, string>>({});
  const [asistencias, setAsistencias] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { alert, modal: alertModal } = useAlert();

  const semanas = obtenerSemanas(anio, mes);

  // Init class dates when month changes
  useEffect(() => {
    const init: Record<number, string> = {};
    for (const s of semanas) init[s.semana] = s.fecha;
    setClassDates(prev => {
      const merged = { ...init };
      for (const k of Object.keys(prev)) {
        const n = Number(k);
        if (init[n]) merged[n] = prev[n];
      }
      return merged;
    });
    setLoaded(false);
  }, [anio, mes]);

  const load = useCallback(async () => {
    const records = await getAsistenciasDelMes(materiaId, anio, mes);
    const map: Record<string, string> = {};
    for (const r of records) {
      const semana = semanas.find(s => s.fecha === r.fecha)?.semana;
      if (semana !== undefined) map[`${r.alumnoId}:${semana}`] = r.estado;
    }
    setAsistencias(map);
    setLoaded(true);
  }, [materiaId, anio, mes]);

  useEffect(() => { load(); }, [load]);

  function toggleEstado(alumnoId: number, semana: number) {
    setAsistencias(prev => {
      const key = `${alumnoId}:${semana}`;
      const current = prev[key] || "P";
      const idx = ESTADOS.findIndex(e => e.key === current);
      const next = ESTADOS[(idx + 1) % ESTADOS.length].key;
      return { ...prev, [key]: next };
    });
  }

  function marcarTodos(semana: number, estado: string) {
    setAsistencias(prev => {
      const next = { ...prev };
      for (const a of alumnos) next[`${a.id}:${semana}`] = estado;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const records: { alumnoId: number; materiaId: number; fecha: string; estado: string }[] = [];
      for (const a of alumnos) {
        for (const s of semanas) {
          const fecha = classDates[s.semana];
          if (!fecha) continue;
          records.push({
            alumnoId: a.id,
            materiaId,
            fecha,
            estado: asistencias[`${a.id}:${s.semana}`] || "P",
          });
        }
      }
      await saveAsistenciasBatch(records);
      await alert("Asistencias guardadas");
    } catch { await alert("Error al guardar"); }
    setSaving(false);
  }

  const btnStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" };
  const thStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" };

  if (!alumnos.length) return <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>No hay alumnos</div>;

  const totalClases = semanas.filter(s => classDates[s.semana]).length;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <select value={mes} onChange={e => setMes(Number(e.target.value))}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
          {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select value={anio} onChange={e => setAnio(Number(e.target.value))}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
          {[2025, 2026, 2027, 2028].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{totalClases} clase{totalClases !== 1 ? "s" : ""}</span>
        <div className="flex-1" />
        <button onClick={handleSave} disabled={saving || !loaded}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto overflow-y-auto rounded-xl border" style={{ borderColor: "var(--border-color)", maxHeight: "calc(100vh - 320px)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                style={{ ...thStyle, minWidth: 180 }}>Alumno</th>
              {semanas.map(s => (
                <th key={s.semana} className="px-1 py-2 text-center font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 90 }}>
                  <div>Sem {s.semana}</div>
                  <input type="date" value={classDates[s.semana] || ""}
                    onChange={e => setClassDates(prev => ({ ...prev, [s.semana]: e.target.value }))}
                    className="mt-1 rounded border px-1 py-0.5 text-[10px] w-full outline-none"
                    style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
                  <button onClick={() => marcarTodos(s.semana, "P")}
                    className="text-[10px] px-1 py-0.5 mt-1 rounded hover:opacity-80"
                    style={{ color: "var(--success)" }}>P</button>
                  <button onClick={() => marcarTodos(s.semana, "A")}
                    className="text-[10px] px-1 py-0.5 mt-1 rounded hover:opacity-80 ml-0.5"
                    style={{ color: "var(--danger)" }}>A</button>
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                style={{ ...thStyle, minWidth: 80 }}>% Asist</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map(a => {
              let presentes = 0;
              return (
                <tr key={a.id} className="transition-colors" style={{ borderColor: "var(--border-color)" }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = "var(--hover-bg)"; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <td className="px-2 py-1.5 font-medium border-b text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                    {a.apellidoNombre}
                  </td>
                  {semanas.map(s => {
                    const fecha = classDates[s.semana];
                    if (!fecha) return <td key={s.semana} className="px-1 py-1.5 border-b" style={{ borderColor: "var(--border-color)" }} />;
                    const estado = asistencias[`${a.id}:${s.semana}`] || "P";
                    const est = ESTADOS.find(e => e.key === estado)!;
                    if (estado === "P") presentes++;
                    return (
                      <td key={s.semana} className="px-1 py-1.5 text-center border-b" style={{ borderColor: "var(--border-color)" }}>
                        <button onClick={() => toggleEstado(a.id, s.semana)}
                          className="w-8 h-8 rounded-full text-xs font-bold border-2 transition-all hover:scale-110"
                          style={{ backgroundColor: estado === "P" ? "transparent" : est.color + "20", color: est.color, borderColor: est.color }}
                          title={est.title}>
                          {est.label}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-center border-b text-xs font-semibold" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                    {totalClases > 0 ? Math.round((presentes / totalClases) * 100) + "%" : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 text-xs" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card)", borderLeft: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        {alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""} · {totalClases} clase{totalClases !== 1 ? "s" : ""} en el mes · Clic en círculo: P → A → T → J
      </div>
      {alertModal}
    </div>
  );
}
