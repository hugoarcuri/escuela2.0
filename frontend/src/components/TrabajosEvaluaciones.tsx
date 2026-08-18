import { useState, useRef, useEffect } from "react";
import type { Alumno } from "../types";
import {
  TRABAJOS_COLUMNS, CALIFICACION_CYCLE, CALIFICACION_MAP,
  numericaToCualitativa, cualitativaToNumerica, calcTrabajoAverage,
} from "../types";
import { batchUpdateAlumno } from "../api";

interface Props {
  alumnos: Alumno[];
  materiaId: number;
  onRefresh: () => void;
}

function getDefaultNames(): Record<string, string> {
  const d: Record<string, string> = {};
  for (const c of TRABAJOS_COLUMNS) d[c.key] = c.label;
  return d;
}

function getStorageKey(materiaId: number): string {
  return `trabajosNames_${materiaId}`;
}

function loadNames(materiaId: number): Record<string, string> {
  try {
    const raw = localStorage.getItem(getStorageKey(materiaId));
    return raw ? JSON.parse(raw) : getDefaultNames();
  } catch { return getDefaultNames(); }
}

function saveNames(materiaId: number, names: Record<string, string>) {
  localStorage.setItem(getStorageKey(materiaId), JSON.stringify(names));
}

const CAL_BG: Record<string, string> = {
  M: "color-mix(in srgb, var(--danger) 14%, transparent)",
  R: "color-mix(in srgb, #f59e0b 14%, transparent)",
  B: "color-mix(in srgb, var(--accent) 14%, transparent)",
  MB: "color-mix(in srgb, var(--success) 14%, transparent)",
};
const CAL_COLOR: Record<string, string> = {
  M: "var(--danger)",
  R: "#f59e0b",
  B: "var(--accent)",
  MB: "var(--success)",
};

export default function TrabajosEvaluaciones({ alumnos, materiaId, onRefresh }: Props) {
  const [columnNames, setColumnNames] = useState<Record<string, string>>(() => loadNames(materiaId));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setColumnNames(loadNames(materiaId));
  }, [materiaId]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }

  function startEditName(key: string) {
    setEditingKey(key);
    setEditValue(columnNames[key] || key);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEditName(key: string) {
    const trimmed = editValue.trim() || key;
    const updated = { ...columnNames, [key]: trimmed };
    setColumnNames(updated);
    saveNames(materiaId, updated);
    setEditingKey(null);
  }

  function cycleValue(alumnoId: number, colKey: string) {
    const current = getQualitative(alumnoId, colKey);
    const idx = CALIFICACION_CYCLE.indexOf(current);
    const next = CALIFICACION_CYCLE[(idx + 1) % CALIFICACION_CYCLE.length];
    saveAndSet(alumnoId, colKey, next);
  }

  function getQualitative(alumnoId: number, colKey: string) {
    const col = TRABAJOS_COLUMNS.find(c => c.key === colKey)!;
    const al = alumnos.find(a => a.id === alumnoId);
    const val = al ? al[col.notaKey] ?? null : null;
    return numericaToCualitativa(val);
  }

  async function saveAndSet(alumnoId: number, colKey: string, qual: "M" | "R" | "B" | "MB" | null) {
    const col = TRABAJOS_COLUMNS.find(c => c.key === colKey)!;
    const numVal = qual !== null ? cualitativaToNumerica(qual) : null;
    try {
      await batchUpdateAlumno(alumnoId, { [col.notaKey]: numVal });
      onRefresh();
      showToast("✓ Guardado");
    } catch {
      showToast("✗ Error al guardar");
    }
  }

  const sem1Cols = TRABAJOS_COLUMNS.filter(c => c.semester === 1);
  const sem2Cols = TRABAJOS_COLUMNS.filter(c => c.semester === 2);

  function calcAvg(cols: typeof TRABAJOS_COLUMNS, alumno: Alumno): number | null {
    return calcTrabajoAverage(cols, key => {
      const col = TRABAJOS_COLUMNS.find(c => c.key === key)!;
      return alumno[col.notaKey];
    });
  }

  if (!alumnos.length) return <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>No hay alumnos</div>;

  return (
    <div className="flex flex-col">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.includes("✗") ? "var(--danger)" : "var(--success)", color: "#fff" }}>
          {toast}
        </div>
      )}

      <div className="mb-2 flex items-center gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Trabajos y Evaluaciones</h3>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Ciclo: − → M → R → B → MB → −
        </span>
      </div>

      <div style={{ borderRadius: 8, border: "1px solid var(--border-color)" }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left font-medium uppercase tracking-wider border-b sticky top-0 z-10"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)", minWidth: 180 }}>
                Alumno
              </th>
              {/* Semester 1 header */}
              <th colSpan={sem1Cols.length + 1}
                className="px-2 py-1.5 text-center font-semibold uppercase tracking-wider border-b border-l sticky top-0 z-10"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--accent)", fontSize: 11 }}>
                1er Cuatrimestre
              </th>
              {/* Semester 2 header */}
              <th colSpan={sem2Cols.length + 1}
                className="px-2 py-1.5 text-center font-semibold uppercase tracking-wider border-b border-l sticky top-0 z-10"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "#f59e0b", fontSize: 11 }}>
                2do Cuatrimestre
              </th>
            </tr>
            <tr>
              <th className="px-2 py-1 border-b sticky top-0 z-10" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }} />
              {sem1Cols.map(col => (
                <th key={col.key}
                  className="px-1 py-1.5 text-center font-medium border-b border-l sticky top-0 z-10 cursor-pointer group"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)", minWidth: 60 }}
                  onDoubleClick={() => startEditName(col.key)}
                  title="Doble clic para editar nombre">
                  {editingKey === col.key ? (
                    <input ref={inputRef} value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => commitEditName(col.key)}
                      onKeyDown={e => { if (e.key === "Enter") commitEditName(col.key); if (e.key === "Escape") setEditingKey(null); }}
                      className="w-full text-center text-xs rounded border px-1 py-0.5 outline-none"
                      style={{ borderColor: "var(--accent)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  ) : (
                    <span className="group-hover:underline decoration-dotted">{columnNames[col.key] || col.key}</span>
                  )}
                </th>
              ))}
              <th className="px-1 py-1.5 text-center font-semibold text-xs border-b border-l sticky top-0 z-10"
                style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)", color: "var(--accent)" }}>
                Prom
              </th>
              {sem2Cols.map(col => (
                <th key={col.key}
                  className="px-1 py-1.5 text-center font-medium border-b border-l sticky top-0 z-10 cursor-pointer group"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)", minWidth: 60 }}
                  onDoubleClick={() => startEditName(col.key)}
                  title="Doble clic para editar nombre">
                  {editingKey === col.key ? (
                    <input ref={inputRef} value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => commitEditName(col.key)}
                      onKeyDown={e => { if (e.key === "Enter") commitEditName(col.key); if (e.key === "Escape") setEditingKey(null); }}
                      className="w-full text-center text-xs rounded border px-1 py-0.5 outline-none"
                      style={{ borderColor: "var(--accent)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}
                    />
                  ) : (
                    <span className="group-hover:underline decoration-dotted">{columnNames[col.key] || col.key}</span>
                  )}
                </th>
              ))}
              <th className="px-1 py-1.5 text-center font-semibold text-xs border-b border-l sticky top-0 z-10"
                style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)", color: "#f59e0b" }}>
                Prom
              </th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map(a => {
              const avg1 = calcAvg(sem1Cols, a);
              const avg2 = calcAvg(sem2Cols, a);
              return (
                <tr key={a.id} className="transition-colors"
                  style={{ borderColor: "var(--border-color)" }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = "var(--hover-bg)"; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <td className="px-2 py-1 font-medium border-b text-sm"
                    style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                    {a.apellidoNombre}
                  </td>
                  {sem1Cols.map(col => {
                    const qual = getQualitative(a.id, col.key);
                    const bg = qual ? CAL_BG[qual] : "transparent";
                    const color = qual ? CAL_COLOR[qual] : "var(--text-secondary)";
                    return (
                      <td key={col.key} className="px-1 py-1 text-center border-b border-l"
                        style={{ borderColor: "var(--border-color)", backgroundColor: bg }}>
                        <button onClick={() => cycleValue(a.id, col.key)}
                          className="w-8 h-8 rounded-full text-xs font-bold border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: qual ? bg : "transparent",
                            color,
                            borderColor: qual ? color : "var(--border-color)",
                            opacity: qual ? 1 : 0.45,
                          }}
                          title={qual || "Sin calificación"}>
                          {qual || "−"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-1 py-1 text-center border-b border-l font-semibold text-xs"
                    style={{ borderColor: "var(--border-color)", color: avg1 !== null ? "var(--accent)" : "var(--text-secondary)" }}>
                    {avg1 !== null ? avg1.toFixed(1) : "—"}
                  </td>
                  {sem2Cols.map(col => {
                    const qual = getQualitative(a.id, col.key);
                    const bg = qual ? CAL_BG[qual] : "transparent";
                    const color = qual ? CAL_COLOR[qual] : "var(--text-secondary)";
                    return (
                      <td key={col.key} className="px-1 py-1 text-center border-b border-l"
                        style={{ borderColor: "var(--border-color)", backgroundColor: bg }}>
                        <button onClick={() => cycleValue(a.id, col.key)}
                          className="w-8 h-8 rounded-full text-xs font-bold border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: qual ? bg : "transparent",
                            color,
                            borderColor: qual ? color : "var(--border-color)",
                            opacity: qual ? 1 : 0.45,
                          }}
                          title={qual || "Sin calificación"}>
                          {qual || "−"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-1 py-1 text-center border-b border-l font-semibold text-xs"
                    style={{ borderColor: "var(--border-color)", color: avg2 !== null ? "#f59e0b" : "var(--text-secondary)" }}>
                    {avg2 !== null ? avg2.toFixed(1) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "var(--bg-secondary)" }}>
              <td className="px-2 py-1 border-t font-semibold text-xs"
                style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
                Promedio
              </td>
              {sem1Cols.map(col => {
                const vals = alumnos.map(a => a[col.notaKey]).filter((v): v is number => v !== null);
                const avg = vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null;
                return (
                  <td key={col.key} className="px-1 py-1 border-t border-l text-center font-bold text-xs"
                    style={{ borderColor: "var(--border-color)", color: avg !== null ? "var(--accent)" : "var(--text-secondary)" }}>
                    {avg !== null ? avg.toFixed(1) : "—"}
                  </td>
                );
              })}
              <td className="px-1 py-1 border-t border-l text-center font-bold text-xs"
                style={{ borderColor: "var(--border-color)", color: "var(--accent)" }}>
                {(() => {
                  const avgs = alumnos.map(a => calcAvg(sem1Cols, a)).filter((v): v is number => v !== null);
                  return avgs.length > 0 ? (avgs.reduce((s, v) => s + v, 0) / avgs.length).toFixed(1) : "—";
                })()}
              </td>
              {sem2Cols.map(col => {
                const vals = alumnos.map(a => a[col.notaKey]).filter((v): v is number => v !== null);
                const avg = vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null;
                return (
                  <td key={col.key} className="px-1 py-1 border-t border-l text-center font-bold text-xs"
                    style={{ borderColor: "var(--border-color)", color: avg !== null ? "#f59e0b" : "var(--text-secondary)" }}>
                    {avg !== null ? avg.toFixed(1) : "—"}
                  </td>
                );
              })}
              <td className="px-1 py-1 border-t border-l text-center font-bold text-xs"
                style={{ borderColor: "var(--border-color)", color: "#f59e0b" }}>
                {(() => {
                  const avgs = alumnos.map(a => calcAvg(sem2Cols, a)).filter((v): v is number => v !== null);
                  return avgs.length > 0 ? (avgs.reduce((s, v) => s + v, 0) / avgs.length).toFixed(1) : "—";
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center gap-3 px-2 py-1 mt-1 text-xs rounded-lg"
        style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {Object.entries(CALIFICACION_MAP).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, backgroundColor: CAL_COLOR[k], opacity: 0.65 }} />
            <span style={{ color: CAL_COLOR[k], fontWeight: 500, fontSize: 12 }}>{k}</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 10 }}>({v})</span>
          </span>
        ))}
        <span className="ml-auto" style={{ opacity: 0.5, fontSize: 11 }}>Clic: − → M → R → B → MB · Doble click en header: renombrar</span>
      </div>
    </div>
  );
}
