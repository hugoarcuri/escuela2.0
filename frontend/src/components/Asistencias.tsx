import { useState, useEffect, useRef } from "react";
import type { Alumno, Asistencia } from "../types";
import { getAsistenciasDelMes, getAsistenciasDelAnio, saveAsistenciasBatch } from "../api";
import { supabase } from "../supabase";

interface Feriado { fecha: string; nombre: string; tipo: string; }
let feriadosCache: Record<string, Feriado[]> = {};

async function fetchFeriados(anio: number): Promise<Feriado[]> {
  if (feriadosCache[anio]) return feriadosCache[anio];
  try {
    const r = await fetch(`https://argentinadatos.com/v1/feriados/${anio}`);
    if (!r.ok) return [];
    const data: Feriado[] = await r.json();
    feriadosCache[anio] = data;
    return data;
  } catch { return []; }
}

interface Props {
  alumnos: Alumno[];
  materiaId: number;
  dia: string;
}

const ESTADOS = [
  { key: "P", label: "P", title: "Presente", color: "var(--success)" },
  { key: "A", label: "A", title: "Ausente", color: "var(--danger)" },
  { key: "T", label: "T", title: "Tarde", color: "#f59e0b" },
  { key: "Lic", label: "Lic", title: "Licencia (docente ausente)", color: "var(--accent)" },
  { key: "F", label: "F", title: "Feriado (no hubo clase)", color: "#888" },
];

const MESES = ["Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MES_NUM = (i: number) => i + 3;

const DIAS_MAP: Record<string, number> = {
  "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6,
};

function obtenerFechasDeCursada(anio: number, mes: number, diaSemana: string): string[] {
  const dayIndex = DIAS_MAP[diaSemana];
  if (dayIndex === undefined) return [];
  const fechas: string[] = [];
  const lastDay = new Date(anio, mes, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    if (new Date(anio, mes - 1, d).getDay() === dayIndex) {
      fechas.push(`${anio}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
  }
  return fechas;
}

const btnTab: React.CSSProperties = {
  padding: "6px 14px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", transition: "background .15s",
};

export default function Asistencias({ alumnos, materiaId, dia }: Props) {
  const hoy = new Date();
  const [vista, setVista] = useState<"dia" | "mes" | "anio">("mes");
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [diaActual, setDiaActual] = useState(hoy.toISOString().slice(0, 10));
  const [asistencias, setAsistencias] = useState<Record<string, string>>({});
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }

  const fechas = obtenerFechasDeCursada(anio, mes, dia);
  const feriadosMap = new Map(feriados.map(f => [f.fecha, f]));

  useEffect(() => { fetchFeriados(anio).then(setFeriados); }, [anio]);

  // --- Load data ---
  useEffect(() => {
    let cancelled = false;
    async function load() {
      let records: Asistencia[] = [];
      try {
        if (vista === "anio") records = await getAsistenciasDelAnio(materiaId, anio);
        else if (vista === "mes") records = await getAsistenciasDelMes(materiaId, anio, mes);
        else {
          records = await getAsistenciasDelMes(materiaId, anio, mes);
          records = records.filter(r => r.fecha === diaActual);
        }
      } catch {}
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const r of records) {
        if (vista === "dia") map[`${r.alumnoId}`] = r.estado;
        else if (vista === "mes") map[`${r.alumnoId}:${r.fecha}`] = r.estado;
        else {
          const m = r.fecha.slice(5, 7);
          map[`${r.alumnoId}:${m}`] = r.estado === "P" || r.estado === "Lic" || r.estado === "F"
            ? (map[`${r.alumnoId}:${m}`] || "0") + 1
            : map[`${r.alumnoId}:${m}`] || "0";
        }
      }
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
    }
    load();
    return () => { cancelled = true; };
  }, [vista, materiaId, anio, mes, diaActual]);

  function toggleEstado(alumnoId: number, fecha: string) {
    setAsistencias(prev => {
      const key = `${alumnoId}:${fecha}`;
      const current = prev[key] || "P";
      const ciclo = ["P", "A", "T"];
      const idx = ciclo.indexOf(current);
      const next = idx === -1 ? "P" : ciclo[(idx + 1) % ciclo.length];
      autoSave(fecha, alumnoId, next);
      return { ...prev, [key]: next };
    });
  }

  function marcarTodos(fecha: string, estado: string) {
    setAsistencias(prev => {
      const next = { ...prev };
      for (const a of alumnos) next[`${a.id}:${fecha}`] = estado;
      saveAsistenciasBatch(alumnos.map(a => ({ alumnoId: a.id, materiaId, fecha, estado })));
      showToast(`✓ Todos ${estado}`);
      return next;
    });
  }

  async function autoSave(fecha: string, alumnoId: number, estado: string) {
    try {
      const { error } = await supabase.from("asistencias").upsert(
        { alumnoId, materiaId, fecha, estado },
        { onConflict: "alumnoId,materiaId,fecha" }
      );
      if (error) throw error;
      showToast("✓ Guardado");
    } catch { showToast("✗ Error al guardar"); }
  }

  const thStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" };

  if (!alumnos.length) return <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>No hay alumnos</div>;

  const totalClasesMes = fechas.length;

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.includes("✗") ? "var(--danger)" : "var(--success)", color: "#fff" }}>
          {toast}
        </div>
      )}
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
          <>
            <input type="date" value={diaActual} onChange={e => setDiaActual(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ backgroundColor: feriadosMap.has(diaActual) ? "#555" : "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
            {feriadosMap.has(diaActual) && <span className="text-xs" style={{ color: "#888" }}>🗓 {feriadosMap.get(diaActual)!.nombre}</span>}
          </>
        )}
        {vista !== "dia" && (
          <>
            {vista === "mes" && (
              <select value={mes} onChange={e => setMes(Number(e.target.value))}
                className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                {MESES.map((m, i) => <option key={MES_NUM(i)} value={MES_NUM(i)}>{m}</option>)}
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
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{vista === "dia" ? 1 : totalClasesMes} clase{vista === "mes" && totalClasesMes !== 1 ? "s" : ""}</span>
        )}
        {vista === "mes" && !dia && (
          <span className="text-xs" style={{ color: "var(--danger)" }}>⚠ Configurá el día de cursada en Administrar Materias</span>
        )}
      </div>

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
              {vista === "mes" && fechas.map(fecha => {
                const feriado = feriadosMap.get(fecha);
                const d = new Date(fecha + "T12:00:00");
                const diaNum = d.getDate();
                return (
                <th key={fecha} className="px-1 py-2 text-center font-medium text-xs uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 90 }}>
                  <div className="whitespace-nowrap">{diaNum} {MESES[mes - 3]?.slice(0, 3)}</div>
                  {feriado && <div className="text-[8px] mt-0.5 truncate" style={{ color: "#888" }}>{feriado.nombre}</div>}
                  {!feriado && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      <button onClick={() => marcarTodos(fecha, "P")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "var(--success)" }}>P</button>
                      <button onClick={() => marcarTodos(fecha, "A")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "var(--danger)" }}>A</button>
                      <button onClick={() => marcarTodos(fecha, "Lic")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "var(--accent)" }}>Lic</button>
                      <button onClick={() => marcarTodos(fecha, "F")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "#888" }}>F</button>
                    </div>
                  )}
                </th>
                );
              })}
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
                      <button onClick={() => toggleEstado(a.id, diaActual)}
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
                  {vista === "mes" && fechas.map(fecha => {
                    const esFeriado = feriadosMap.has(fecha);
                    const estado = asistencias[`${a.id}:${fecha}`] || "P";
                    const est = ESTADOS.find(e => e.key === estado)!;
                    if (!esFeriado) { total++; if (estado === "P" || estado === "Lic" || estado === "F") presente++; }
                    return (
                      <td key={fecha} className="px-1 py-1.5 text-center border-b" style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: esFeriado ? "#444" : "transparent",
                      }}>
                        {esFeriado ? (
                          <span className="text-xs" style={{ color: "#888" }}>☕</span>
                        ) : (
                        <button onClick={() => toggleEstado(a.id, fecha)}
                          className="w-8 h-8 rounded-full text-xs font-bold border-2 transition-all hover:scale-110"
                          style={{ backgroundColor: estado === "P" ? "transparent" : est.color + "20", color: est.color, borderColor: est.color }}
                          title={est.title}>
                          {est.label}
                        </button>
                        )}
                      </td>
                    );
                  })}
                  {vista === "anio" && MESES.map((_, i) => {
                    const m = String(MES_NUM(i)).padStart(2, "0");
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
          {vista === "mes" && (
            <tfoot>
              <tr style={{ backgroundColor: "var(--bg-secondary)" }}>
                <td className="px-2 py-1.5 border-t font-semibold text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
                  Total
                </td>
                {fechas.map(fecha => {
                  if (feriadosMap.has(fecha)) {
                    return <td key={fecha} className="px-1 py-1.5 border-t text-center" style={{ borderColor: "var(--border-color)", backgroundColor: "#444" }}></td>;
                  }
                  const c = { P: 0, A: 0, T: 0, Lic: 0, F: 0 };
                  for (const a of alumnos) {
                    const estado = asistencias[`${a.id}:${fecha}`] || "P";
                    c[estado as keyof typeof c]++;
                  }
                  return (
                    <td key={fecha} className="px-1 py-1.5 border-t text-center" style={{ borderColor: "var(--border-color)" }}>
                      <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>{c.P}</span>
                      {c.A > 0 && <span className="text-xs ml-0.5" style={{ color: "var(--danger)" }}>/{c.A}</span>}
                      {c.T > 0 && <span className="text-[10px] ml-0.5" style={{ color: "#f59e0b" }}>T{c.T}</span>}
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 border-t text-center border-b-0" style={{ borderColor: "var(--border-color)" }}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="px-3 py-1.5 text-xs" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card)", borderLeft: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        {alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""}
        {vista === "mes" && ` · ${totalClasesMes} clase${totalClasesMes !== 1 ? "s" : ""} en el mes`}
        {vista === "dia" ? " · Clic en círculo: P → A → T → Lic → F" : " · Clic para cambiar: P → A → T → Lic → F"}
      </div>
    </div>
  );
}
