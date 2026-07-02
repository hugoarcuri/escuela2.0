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
  { key: "-", label: "-", title: "Sin registro", color: "var(--text-secondary)" },
  { key: "P", label: "P", title: "Presente", color: "var(--success)" },
  { key: "A", label: "A", title: "Ausente", color: "var(--danger)" },
  { key: "T", label: "T", title: "Tarde", color: "#f59e0b" },
  { key: "Lic", label: "Lic", title: "Licencia", color: "var(--accent)" },
  { key: "F", label: "F", title: "Feriado", color: "#94a3b8" },
  { key: "Paro", label: "Paro", title: "Paro", color: "#e91e63" },
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

function getEstadoBg(key: string): string {
  switch (key) {
    case "P": return "color-mix(in srgb, var(--success) 12%, transparent)";
    case "A": return "color-mix(in srgb, var(--danger) 12%, transparent)";
    case "T": return "color-mix(in srgb, #f59e0b 12%, transparent)";
    case "Lic": return "color-mix(in srgb, var(--accent) 12%, transparent)";
    case "F": return "color-mix(in srgb, #94a3b8 12%, transparent)";
    case "Paro": return "color-mix(in srgb, #e91e63 12%, transparent)";
    default: return "transparent";
  }
}

const btnTab: React.CSSProperties = {
  padding: "4px 10px", fontSize: 12, fontWeight: 600, borderRadius: 6, border: "none", cursor: "pointer", transition: "background .15s",
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
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; alumnoId: number; fecha: string } | null>(null);
  const [detailModal, setDetailModal] = useState<{ alumnoId: number; fecha: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }

  const fechas = obtenerFechasDeCursada(anio, mes, dia);
  const feriadosMap = new Map(feriados.map(f => [f.fecha, f]));

  useEffect(() => { fetchFeriados(anio).then(setFeriados); }, [anio]);

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
      const current = prev[key] || "-";
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

  async function limpiarDia(fecha: string) {
    try {
      const { error } = await supabase.from("asistencias").delete()
        .eq("materiaId", materiaId).eq("fecha", fecha);
      if (error) throw error;
      setAsistencias(prev => {
        const next = { ...prev };
        for (const a of alumnos) delete next[`${a.id}:${fecha}`];
        return next;
      });
      showToast("✓ Día limpiado");
    } catch { showToast("✗ Error al limpiar"); }
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

  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleCellClick(alumnoId: number, fecha: string) {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setDetailModal({ alumnoId, fecha });
      return;
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      toggleEstado(alumnoId, fecha);
    }, 180);
  }

  function handleContextMenu(e: React.MouseEvent, alumnoId: number, fecha: string) {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, alumnoId, fecha });
  }

  function ctxSetEstado(estado: string) {
    if (!ctxMenu) return;
    const { alumnoId, fecha } = ctxMenu;
    setAsistencias(prev => {
      const key = `${alumnoId}:${fecha}`;
      autoSave(fecha, alumnoId, estado);
      return { ...prev, [key]: estado };
    });
    setCtxMenu(null);
  }

  useEffect(() => {
    function close() { setCtxMenu(null); }
    if (ctxMenu) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [ctxMenu]);

  useEffect(() => {
    function close(e: KeyboardEvent) { if (e.key === "Escape") setDetailModal(null); }
    if (detailModal) {
      document.addEventListener("keydown", close);
      return () => document.removeEventListener("keydown", close);
    }
  }, [detailModal]);

  const thStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" };

  if (!alumnos.length) return <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>No hay alumnos</div>;

  const totalClasesMes = fechas.length;

  let summaryClases = 0;
  let summaryPresentes = 0;
  let summaryAusencias = 0;
  let summaryLicencias = 0;
  let summaryParos = 0;
  if (vista === "mes") {
    for (const a of alumnos) {
      for (const fecha of fechas) {
        if (feriadosMap.has(fecha)) continue;
        const estado = asistencias[`${a.id}:${fecha}`] || "-";
        summaryClases++;
        if (estado === "P" || estado === "Lic" || estado === "F" || estado === "Paro") summaryPresentes++;
        if (estado === "A") summaryAusencias++;
        if (estado === "Lic") summaryLicencias++;
        if (estado === "Paro") summaryParos++;
      }
    }
  }
  if (vista === "dia") {
    for (const a of alumnos) {
      const estado = asistencias[`${a.id}`] || "-";
      summaryClases++;
      if (estado === "P" || estado === "Lic" || estado === "F" || estado === "Paro") summaryPresentes++;
      if (estado === "A") summaryAusencias++;
      if (estado === "Lic") summaryLicencias++;
      if (estado === "Paro") summaryParos++;
    }
  }
  const pctGeneral = summaryClases > 0 ? Math.round((summaryPresentes / summaryClases) * 100) : 0;

  function renderProgressBar(pct: number) {
    const barColor = pct >= 75 ? "var(--success)" : pct >= 50 ? "#f59e0b" : "var(--danger)";
    return (
      <div className="flex items-center gap-1" style={{ minWidth: 80 }}>
        <div style={{ flex: 1, height: 5, backgroundColor: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", backgroundColor: barColor, borderRadius: 3, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: pct >= 75 ? "var(--success)" : pct >= 50 ? "#f59e0b" : "var(--danger)", minWidth: 30, textAlign: "right" }}>{pct}%</span>
      </div>
    );
  }

  function mesAnterior() {
    let m = mes - 1, a = anio;
    if (m < 3) { m = 12; a--; }
    setMes(m); setAnio(a);
  }

  function mesSiguiente() {
    let m = mes + 1, a = anio;
    if (m > 12) { m = 3; a++; }
    setMes(m); setAnio(a);
  }

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.includes("✗") ? "var(--danger)" : "var(--success)", color: "#fff" }}>
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 p-2 rounded-lg mb-1" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="flex gap-0.5">
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
              className="rounded-lg border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ backgroundColor: feriadosMap.has(diaActual) ? "color-mix(in srgb, #f59e0b 10%, transparent)" : "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
            {feriadosMap.has(diaActual) && <span className="text-xs" style={{ color: "#94a3b8" }}>🗓 {feriadosMap.get(diaActual)!.nombre}</span>}
          </>
        )}
        {vista !== "dia" && (
          <>
            {vista === "mes" && (
              <div className="flex items-center gap-0.5">
                <button onClick={mesAnterior}
                  style={{ ...btnTab, backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", padding: "2px 6px", fontSize: 13, lineHeight: "16px" }}
                  title="Mes anterior">◀</button>
                <select value={mes} onChange={e => setMes(Number(e.target.value))}
                  className="rounded-lg border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                  {MESES.map((m, i) => <option key={MES_NUM(i)} value={MES_NUM(i)}>{m}</option>)}
                </select>
                <button onClick={mesSiguiente}
                  style={{ ...btnTab, backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", padding: "2px 6px", fontSize: 13, lineHeight: "16px" }}
                  title="Mes siguiente">▶</button>
              </div>
            )}
            <select value={anio} onChange={e => setAnio(Number(e.target.value))}
              className="rounded-lg border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
              {[2026, 2027, 2028].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </>
        )}
        {vista !== "anio" && (
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{vista === "dia" ? 1 : totalClasesMes} clase{vista === "mes" && totalClasesMes !== 1 ? "s" : ""}</span>
        )}
        {vista === "mes" && !dia && (
          <span className="text-xs" style={{ color: "var(--danger)" }}>⚠ Configurá el día de cursada</span>
        )}
      </div>

      {vista !== "anio" && (
        <div className="flex items-center gap-3 px-2 py-0.5 mb-1 rounded text-xs" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
          <span>🗓️ <b style={{ color: "var(--text-primary)" }}>{vista === "dia" ? 1 : totalClasesMes}</b> clases</span>
          {summaryClases > 0 && (
            <>
              <span>📊 <b style={{ color: pctGeneral >= 75 ? "var(--success)" : pctGeneral >= 50 ? "#f59e0b" : "var(--danger)" }}>{pctGeneral}%</b> prom.</span>
              <span>❌ <b style={{ color: "var(--danger)" }}>{summaryAusencias}</b> aus.</span>
              <span>🔵 <b style={{ color: "var(--accent)" }}>{summaryLicencias}</b> lic.</span>
              <span>⬜ <b style={{ color: "#e91e63" }}>{summaryParos}</b> paro</span>
            </>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", borderRadius: 8, border: "1px solid var(--border-color)" }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left font-medium uppercase tracking-wider border-b sticky top-0 z-10"
                style={{ ...thStyle, minWidth: 180 }}>Alumno</th>
              {vista === "dia" && (
                <th className="px-2 py-1.5 text-center font-medium uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 90 }}>
                  <div className="flex flex-col items-center gap-0.5">
                    <span>Asistencia</span>
                    <div className="flex justify-center gap-0.5">
                      <button onClick={() => marcarTodos(diaActual, "P")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "var(--success)" }}>P</button>
                      <button onClick={() => marcarTodos(diaActual, "A")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "var(--danger)" }}>A</button>
                      <button onClick={() => marcarTodos(diaActual, "Lic")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "var(--accent)" }}>Lic</button>
                      <button onClick={() => marcarTodos(diaActual, "F")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "#94a3b8" }}>F</button>
                      <button onClick={() => marcarTodos(diaActual, "Paro")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "#e91e63" }}>Paro</button>
                      <button onClick={() => limpiarDia(diaActual)}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "var(--text-secondary)" }} title="Limpiar asistencias del día">✕</button>
                    </div>
                  </div>
                </th>
              )}
              {vista === "mes" && fechas.map(fecha => {
                const feriado = feriadosMap.get(fecha);
                const d = new Date(fecha + "T12:00:00");
                const diaNum = d.getDate();
                const esHoy = fecha === hoy.toISOString().slice(0, 10);
                return (
                <th key={fecha} className="px-1 py-1.5 text-center font-medium uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 90, backgroundColor: feriado ? "color-mix(in srgb, #f59e0b 8%, var(--bg-card))" : esHoy ? "color-mix(in srgb, var(--accent) 8%, var(--bg-card))" : "var(--bg-card)" }}>
                  <div className="whitespace-nowrap">{diaNum} {MESES[mes - 3]?.slice(0, 3)}</div>
                  {feriado && <div className="text-[8px] mt-0.5 truncate" style={{ color: "#94a3b8" }}>{feriado.nombre}</div>}
                  {!feriado && (
                    <div className="flex justify-center gap-0.5 mt-0.5">
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
                        style={{ color: "#94a3b8" }}>F</button>
                      <button onClick={() => marcarTodos(fecha, "Paro")}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "#e91e63" }}>Paro</button>
                      <button onClick={() => limpiarDia(fecha)}
                        className="text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                        style={{ color: "var(--text-secondary)" }} title="Limpiar asistencias del día">✕</button>
                    </div>
                  )}
                </th>
                );
              })}
              {vista === "anio" && MESES.map((m, i) => (
                <th key={i} className="px-1 py-1.5 text-center font-medium uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 60 }}>{m.slice(0, 3)}</th>
              ))}
              {vista !== "dia" && (
                <th className="px-2 py-1.5 text-center font-medium uppercase tracking-wider border-b sticky top-0 z-10"
                  style={{ ...thStyle, minWidth: 100 }}>Total</th>
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
                  <td className="px-2 py-1 font-medium border-b text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                    {a.apellidoNombre}
                  </td>
                  {vista === "dia" && (
                    <td className="px-2 py-1 text-center border-b" style={{ borderColor: "var(--border-color)" }}>
                      <button onClick={() => handleCellClick(a.id, diaActual)}
                        onDoubleClick={() => setDetailModal({ alumnoId: a.id, fecha: diaActual })}
                        onContextMenu={e => handleContextMenu(e, a.id, diaActual)}
                        className="w-8 h-8 rounded-full text-xs font-bold border-2 transition-all hover:scale-110"
                        style={(() => {
                          const estado = asistencias[`${a.id}`] || "-";
                          const est = ESTADOS.find(e => e.key === estado)!;
                          return {
                            backgroundColor: getEstadoBg(estado),
                            color: estado === "-" ? "var(--text-secondary)" : est.color,
                            borderColor: estado === "-" ? "var(--border-color)" : est.color,
                            opacity: estado === "-" ? 0.35 : 1,
                          };
                        })()}
                        title={ESTADOS.find(e => e.key === (asistencias[`${a.id}`] || "-"))?.title}>
                        {asistencias[`${a.id}`] || "-"}
                      </button>
                    </td>
                  )}
                  {vista === "mes" && fechas.map(fecha => {
                    const esFeriado = feriadosMap.has(fecha);
                    const estado = asistencias[`${a.id}:${fecha}`] || "-";
                    const est = ESTADOS.find(e => e.key === estado)!;
                    if (!esFeriado) { total++; if (estado === "P" || estado === "Lic" || estado === "F" || estado === "Paro") presente++; }
                    return (
                      <td key={fecha} className="px-1 py-1 text-center border-b" style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: esFeriado ? "color-mix(in srgb, #f59e0b 8%, transparent)" : getEstadoBg(estado),
                      }}>
                        {esFeriado ? (
                          <span className="text-xs" style={{ color: "#94a3b8" }}>☕</span>
                        ) : (
                        <button onClick={() => handleCellClick(a.id, fecha)}
                          onDoubleClick={() => setDetailModal({ alumnoId: a.id, fecha })}
                          onContextMenu={e => handleContextMenu(e, a.id, fecha)}
                          className="w-7 h-7 rounded-full text-xs font-bold border transition-all hover:scale-110"
                          style={{
                            backgroundColor: estado === "-" ? "transparent" : getEstadoBg(estado),
                            color: estado === "-" ? "var(--text-secondary)" : est.color,
                            borderColor: estado === "-" ? "var(--border-color)" : est.color,
                            opacity: estado === "-" ? 0.35 : 1,
                          }}
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
                      <td key={i} className="px-1 py-1 text-center border-b text-xs" style={{ borderColor: "var(--border-color)", color: cell && cell !== "—" ? (parseInt(cell) >= 75 ? "var(--success)" : parseInt(cell) >= 50 ? "#f59e0b" : "var(--danger)") : "var(--text-secondary)" }}>
                        {cell || "—"}
                      </td>
                    );
                  })}
                  {vista !== "dia" && (
                    <td className="px-2 py-1 text-center border-b" style={{ borderColor: "var(--border-color)" }}>
                      {total > 0 ? renderProgressBar(Math.round((presente / total) * 100)) : <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>—</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {vista === "mes" && (
            <tfoot>
              <tr style={{ backgroundColor: "var(--bg-secondary)" }}>
                <td className="px-2 py-1 border-t font-semibold text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
                  Total
                </td>
                {fechas.map(fecha => {
                  if (feriadosMap.has(fecha)) {
                    return <td key={fecha} className="px-1 py-1 border-t text-center" style={{ borderColor: "var(--border-color)", backgroundColor: "color-mix(in srgb, #f59e0b 8%, transparent)" }}></td>;
                  }
                  const c: Record<string, number> = { P: 0, A: 0, T: 0, Lic: 0, F: 0, Paro: 0 };
                  for (const a of alumnos) {
                    const estado = asistencias[`${a.id}:${fecha}`] || "-";
                    if (estado !== "-") c[estado] = (c[estado] || 0) + 1;
                  }
                  return (
                    <td key={fecha} className="px-1 py-1 border-t text-center" style={{ borderColor: "var(--border-color)" }}>
                      <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>{c.P}</span>
                      {c.A > 0 && <span className="text-xs ml-0.5" style={{ color: "var(--danger)" }}>/{c.A}</span>}
                      {c.T > 0 && <span className="text-[10px] ml-0.5" style={{ color: "#f59e0b" }}>T{c.T}</span>}
                      {c.Paro > 0 && <span className="text-[10px] ml-0.5" style={{ color: "#e91e63" }}>P{c.Paro}</span>}
                    </td>
                  );
                })}
                <td className="px-2 py-1 border-t text-center border-b-0" style={{ borderColor: "var(--border-color)" }}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex items-center gap-3 px-2 py-1 mt-1 text-xs rounded-lg" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {ESTADOS.filter(e => e.key !== "-").map(e => (
          <span key={e.key} className="flex items-center gap-1">
            <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, backgroundColor: e.color, opacity: 0.65 }} />
            <span style={{ color: e.color, fontWeight: 500, fontSize: 12 }}>{e.label}</span>
          </span>
        ))}
        <span className="ml-auto" style={{ opacity: 0.5, fontSize: 11 }}>Clic→alt · Doble→detalle · Der→menú</span>
      </div>

      {ctxMenu && (
        <div style={{
          position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 1000,
          backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          padding: "4px 0", minWidth: 140,
        }}>
          <div style={{ padding: "4px 12px 2px", fontSize: 10, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", marginBottom: 2 }}>Asignar estado</div>
          {ESTADOS.filter(e => e.key !== "-").map(e => (
            <button key={e.key} onClick={() => ctxSetEstado(e.key)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "5px 12px", fontSize: 12, border: "none", background: "transparent", color: e.color, cursor: "pointer" }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--hover-bg)"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
              {e.label} — {e.title}
            </button>
          ))}
        </div>
      )}

      {detailModal && (() => {
        const al = alumnos.find(a => a.id === detailModal.alumnoId);
        const key = vista === "dia" ? `${detailModal.alumnoId}` : `${detailModal.alumnoId}:${detailModal.fecha}`;
        const estado = asistencias[key] || "-";
        const est = ESTADOS.find(e => e.key === estado)!;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={() => setDetailModal(null)}>
            <div className="rounded-xl p-4 shadow-lg max-w-xs w-full mx-4"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{al?.apellidoNombre || "Alumno"}</span>
                <button onClick={() => setDetailModal(null)} className="text-sm p-1 rounded" style={{ color: "var(--text-secondary)" }}>✕</button>
              </div>
              <div className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                {detailModal.fecha} · <b style={{ color: est.color }}>{est.label} — {est.title}</b>
              </div>
              <div className="flex gap-1 flex-wrap">
                {ESTADOS.filter(e => e.key !== "-").map(e => (
                  <button key={e.key} onClick={() => {
                    setAsistencias(prev => {
                      const k = vista === "dia" ? `${detailModal.alumnoId}` : `${detailModal.alumnoId}:${detailModal.fecha}`;
                      autoSave(detailModal.fecha, detailModal.alumnoId, e.key);
                      return { ...prev, [k]: e.key };
                    });
                    setDetailModal(null);
                  }}
                    style={{ padding: "4px 10px", fontSize: 11, borderRadius: 6, border: `2px solid ${e.color}`, backgroundColor: estado === e.key ? getEstadoBg(e.key) : "transparent", color: e.color, cursor: "pointer", fontWeight: estado === e.key ? 700 : 400 }}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="px-2 py-1 mt-1 text-xs rounded-lg" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""}
        {vista === "mes" && ` · ${totalClasesMes} clase${totalClasesMes !== 1 ? "s" : ""} en el mes`}
        {vista === "dia" ? " · Clic: - → P → A → T" : " · Clic: - → P → A → T"} · Lic/F/Paro desde columnas
      </div>
    </div>
  );
}
