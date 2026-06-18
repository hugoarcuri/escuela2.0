import { useState, useEffect, useCallback } from "react";
import type { Alumno, Asistencia } from "../types";
import { getAsistenciasDelMes, getAsistenciasDelAnio, saveAsistenciasBatch } from "../api";
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
    semanas.push({ semana: semana++, fecha: d.toISOString().slice(0, 10) });
  }
  return semanas;
}

const btnTab: React.CSSProperties = {
  padding: "6px 14px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", transition: "background .15s",
};

export default function Asistencias({ alumnos, materiaId }: Props) {
  const hoy = new Date();
  const [vista, setVista] = useState<"dia" | "mes" | "anio">("mes");
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [dia, setDia] = useState(hoy.toISOString().slice(0, 10));

  // monthly state
  const [classDates, setClassDates] = useState<Record<number, string>>({});
  const [asistencias, setAsistencias] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { alert, modal: alertModal } = useAlert();

  const semanas = obtenerSemanas(anio, mes);

  // Init class dates when month changes
  useEffect(() => {
    const init: Record<number, string> = {};
    for (const s of semanas) init[s.semana] = s.fecha;
    setClassDates(prev => {
      const merged = { ...init };
      for (const k of Object.keys(prev)) { const n = Number(k); if (init[n]) merged[n] = prev[n]; }
      return merged;
    });
  }, [anio, mes]);

  // --- Load data ---
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let records: Asistencia[] = [];
      try {
        if (vista === "anio") records = await getAsistenciasDelAnio(materiaId, anio);
        else if (vista === "mes") records = await getAsistenciasDelMes(materiaId, anio, mes);
        else {
          records = await getAsistenciasDelMes(materiaId, anio, mes);
          records = records.filter(r => r.fecha === dia);
        }
      } catch {}
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const r of records) {
        if (vista === "dia") map[`${r.alumnoId}`] = r.estado;
        else if (vista === "mes") {
          const sem = semanas.find(s => s.fecha === r.fecha)?.semana;
          if (sem !== undefined) map[`${r.alumnoId}:${sem}`] = r.estado;
        } else {
          const m = r.fecha.slice(5, 7);
          map[`${r.alumnoId}:${m}`] = r.estado === "P"
            ? (map[`${r.alumnoId}:${m}`] || "0") + 1
            : map[`${r.alumnoId}:${m}`] || "0";
        }
      }
      // For annual: convert counts to percentage string
      if (vista === "anio") {
        for (const key of Object.keys(map)) {
          const parts = key.split(":");
          const alumnoId = parts[0];
          const m = parts[1];
          const totalClasesMes = records.filter(r => r.alumnoId === Number(alumnoId) && r.fecha.slice(5, 7) === m).length;
          const presentes = Number(map[key]);
          map[key] = totalClasesMes > 0 ? Math.round((presentes / totalClasesMes) * 100) + "%" : "—";
        }
      }
      setAsistencias(map);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [vista, materiaId, anio, mes, dia]);

  function toggleEstado(alumnoId: number, keySuffix: string) {
    setAsistencias(prev => {
      const key = `${alumnoId}:${keySuffix}`;
      const current = prev[key] || "P";
      const idx = ESTADOS.findIndex(e => e.key === current);
      const next = ESTADOS[(idx + 1) % ESTADOS.length].key;
      return { ...prev, [key]: next };
    });
  }

  function marcarTodos(keySuffix: string, estado: string) {
    setAsistencias(prev => {
      const next = { ...prev };
      for (const a of alumnos) next[`${a.id}:${keySuffix}`] = estado;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      let records: { alumnoId: number; materiaId: number; fecha: string; estado: string }[] = [];
      if (vista === "dia") {
        for (const a of alumnos) records.push({ alumnoId: a.id, materiaId, fecha: dia, estado: asistencias[`${a.id}`] || "P" });
      } else {
        for (const a of alumnos) {
          for (const s of semanas) {
            const fecha = classDates[s.semana];
            if (!fecha) continue;
            records.push({ alumnoId: a.id, materiaId, fecha, estado: asistencias[`${a.id}:${s.semana}`] || "P" });
          }
        }
      }
      await saveAsistenciasBatch(records);
      await alert("Asistencias guardadas");
    } catch { await alert("Error al guardar"); }
    setSaving(false);
  }

  const thStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" };

  if (!alumnos.length) return <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>No hay alumnos</div>;

  const totalClasesMes = semanas.filter(s => classDates[s.semana]).length;

  return (
    <div>
      {/* Vista switcher + controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="flex gap-1">
          {(["dia", "mes", "anio"] as const).map(v => (
            <button key={v} onClick={() => setVista(v)} style={{
              ...btnTab,
              backgroundColor: vista === v ? "var(--accent)" : "var(--bg-secondary)",
              color: vista === v ? "#fff" : "var(--text-primary)",
            }}>{v === "dia" ? "Día" : v === "mes" ? "Mes" : "Año"}</button>
          ))}
        </div>
        {vista === "dia" && (
          <input type="date" value={dia} onChange={e => setDia(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
        )}
        {vista !== "dia" && (
          <>
            {vista === "mes" && (
              <select value={mes} onChange={e => setMes(Number(e.target.value))}
                className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            )}
            <select value={anio} onChange={e => setAnio(Number(e.target.value))}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
              {[2025, 2026, 2027, 2028].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </>
        )}
        {vista !== "anio" && (
          <>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{vista === "dia" ? 1 : totalClasesMes} clase{vista === "mes" && totalClasesMes !== 1 ? "s" : ""}</span>
            <div className="flex-1" />
            <button onClick={handleSave} disabled={saving || loading}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto rounded-xl border" style={{ borderColor: "var(--border-color)", maxHeight: "calc(100vh - 320px)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                style={{ ...thStyle, minWidth: 180 }}>Alumno</th>
              {vista === "dia" && (
                <th className="px-2 py-2 text-center font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 90 }}>Asistencia</th>
              )}
              {vista === "mes" && semanas.map(s => (
                <th key={s.semana} className="px-1 py-2 text-center font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 90 }}>
                  <div>Sem {s.semana}</div>
                  <input type="date" value={classDates[s.semana] || ""}
                    onChange={e => setClassDates(prev => ({ ...prev, [s.semana]: e.target.value }))}
                    className="mt-1 rounded border px-1 py-0.5 text-[10px] w-full outline-none"
                    style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
                  <button onClick={() => marcarTodos(String(s.semana), "P")}
                    className="text-[10px] px-1 py-0.5 mt-1 rounded hover:opacity-80"
                    style={{ color: "var(--success)" }}>P</button>
                  <button onClick={() => marcarTodos(String(s.semana), "A")}
                    className="text-[10px] px-1 py-0.5 mt-1 rounded hover:opacity-80 ml-0.5"
                    style={{ color: "var(--danger)" }}>A</button>
                </th>
              ))}
              {vista === "anio" && MESES.map((m, i) => (
                <th key={i} className="px-1 py-2 text-center font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 60 }}>{m.slice(0, 3)}</th>
              ))}
              {vista !== "dia" && (
                <th className="px-2 py-2 text-center font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 72 }}>Total</th>
              )}
            </tr>
          </thead>
          <tbody>
            {alumnos.map(a => {
              let total = 0;
              let presente = 0;
              return (
                <tr key={a.id} className="transition-colors" style={{ borderColor: "var(--border-color)" }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = "var(--hover-bg)"; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <td className="px-2 py-1.5 font-medium border-b text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                    {a.apellidoNombre}
                  </td>
                  {vista === "dia" && (
                    <td className="px-2 py-1.5 text-center border-b" style={{ borderColor: "var(--border-color)" }}>
                      <button onClick={() => toggleEstado(a.id, "")}
                        className="w-9 h-9 rounded-full text-sm font-bold border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: (asistencias[`${a.id}`] || "P") === "P" ? "transparent" : (ESTADOS.find(e => e.key === (asistencias[`${a.id}`] || "P"))?.color || "var(--success)") + "20",
                          color: ESTADOS.find(e => e.key === (asistencias[`${a.id}`] || "P"))?.color || "var(--success)",
                          borderColor: ESTADOS.find(e => e.key === (asistencias[`${a.id}`] || "P"))?.color || "var(--success)",
                        }}
                        title={ESTADOS.find(e => e.key === (asistencias[`${a.id}`] || "P"))?.title}>
                        {asistencias[`${a.id}`] || "P"}
                      </button>
                    </td>
                  )}
                  {vista === "mes" && semanas.map(s => {
                    const fecha = classDates[s.semana];
                    if (!fecha) return <td key={s.semana} className="px-1 py-1.5 border-b" style={{ borderColor: "var(--border-color)" }} />;
                    const estado = asistencias[`${a.id}:${s.semana}`] || "P";
                    const est = ESTADOS.find(e => e.key === estado)!;
                    total++;
                    if (estado === "P") presente++;
                    return (
                      <td key={s.semana} className="px-1 py-1.5 text-center border-b" style={{ borderColor: "var(--border-color)" }}>
                        <button onClick={() => toggleEstado(a.id, String(s.semana))}
                          className="w-8 h-8 rounded-full text-xs font-bold border-2 transition-all hover:scale-110"
                          style={{ backgroundColor: estado === "P" ? "transparent" : est.color + "20", color: est.color, borderColor: est.color }}
                          title={est.title}>
                          {est.label}
                        </button>
                      </td>
                    );
                  })}
                  {vista === "anio" && MESES.map((_, i) => {
                    const m = String(i + 1).padStart(2, "0");
                    const cell = asistencias[`${a.id}:${m}`];
                    return (
                      <td key={i} className="px-1 py-1.5 text-center border-b text-xs" style={{ borderColor: "var(--border-color)", color: cell && cell !== "—" ? (parseInt(cell) >= 75 ? "var(--success)" : parseInt(cell) >= 50 ? "#f59e0b" : "var(--danger)") : "var(--text-secondary)" }}>
                        {cell || "—"}
                      </td>
                    );
                  })}
                  {vista !== "dia" && (
                    <td className="px-2 py-1.5 text-center border-b text-xs font-semibold" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                      {total > 0 ? Math.round((presente / total) * 100) + "%" : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 text-xs" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card)", borderLeft: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        {alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""}
        {vista === "mes" && ` · ${totalClasesMes} clase${totalClasesMes !== 1 ? "s" : ""} en el mes`}
        {vista === "dia" ? " · Clic en círculo: P → A → T → J" : " · Clic para cambiar estado"}
      </div>
      {alertModal}
    </div>
  );
}
