import { useState, useRef, useCallback, useMemo } from "react";
import type { Alumno } from "../types";
import { batchUpdateAlumno, deleteAlumnosBulk } from "../api";
import TableHeader from "./table/TableHeader";

interface Props {
  alumnos: Alumno[];
  onRefresh: () => void;
  onEdit: (a: Alumno) => void;
}

type CampoNota = "nota1" | "nota2" | "nota3" | "nota4" | "nota5" | "nota6";

function colorNota(val: number | null): string {
  if (val === null) return "transparent";
  if (val >= 1 && val <= 3) return "var(--nota-baja)";
  if (val >= 4 && val <= 6) return "var(--nota-media)";
  if (val >= 7 && val <= 10) return "var(--nota-alta)";
  return "transparent";
}

const CAMPOS: CampoNota[] = ["nota1", "nota2", "nota3", "nota4", "nota5", "nota6"];

function parseVal(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

export default function StudentTable({ alumnos, onRefresh, onEdit }: Props) {
  const [editing, setEditing] = useState<{ alumnoId: number; campo: CampoNota | "observaciones" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [savedMsg, setSavedMsg] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = alumnos.filter(a => {
    if (filtro === "TEA") return a.informe1 === "TEA" || a.informe2 === "TEA";
    if (filtro === "TEP") return a.informe1 === "TEP" || a.informe2 === "TEP";
    if (filtro === "aprobados") return a.situacionFinal === "Aprobado";
    if (filtro === "desaprobados") return a.situacionFinal === "Desaprobado";
    return true;
  });

  const promedioCol = (campo: CampoNota): number | null => {
    const vals = filtered.map(a => a[campo]).filter((v): v is number => v !== null);
    return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100 : null;
  };

  const promediosFinales = filtered.map(a => a.notaFinal).filter((v): v is number => v !== null);
  const promedioGeneral = promediosFinales.length ? Math.round((promediosFinales.reduce((s, v) => s + v, 0) / promediosFinales.length) * 100) / 100 : null;

  const mostrarMsg = useCallback((msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 2000);
  }, []);

  function startEdit(alumnoId: number, campo: CampoNota | "observaciones", valorActual: string) {
    setEditing({ alumnoId, campo });
    setEditValue(valorActual);
    setTimeout(() => inputRef.current?.focus(), 10);
  }

  async function saveEdit() {
    if (!editing) return;
    const { alumnoId, campo } = editing;
    const parsed = campo === "observaciones" ? editValue : parseVal(editValue);
    const sendVal = campo === "observaciones" ? editValue : (parsed !== null ? String(parsed) : "");
    try {
      await batchUpdateAlumno(alumnoId, { [campo]: sendVal || null });
      mostrarMsg("✓ Guardado");
      onRefresh();
    } catch { mostrarMsg("✗ Error"); }
    setEditing(null);
  }

  function cancelEdit() { setEditing(null); }

  function handleKeyDown(e: React.KeyboardEvent, idx: number, campo: CampoNota | "observaciones") {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      saveEdit();
      const campos: (CampoNota | "observaciones")[] = ["nota1", "nota2", "nota3", "observaciones", "nota4", "nota5", "nota6"];
      const ci = campos.indexOf(campo);
      const isShift = e.shiftKey;
      if (e.key === "Enter" || (!isShift && ci < campos.length - 1)) {
        const nextIdx = e.key === "Enter" ? Math.min(idx + 1, filtered.length - 1) : idx;
        const nextCampo = e.key === "Enter" ? campos[0] : campos[ci + 1];
        if (nextIdx < filtered.length) {
          const a = filtered[nextIdx];
          const val = nextCampo === "observaciones" ? (a.observaciones || "") : String(a[nextCampo] ?? "");
          startEdit(a.id, nextCampo, val);
        }
      } else if (isShift && ci > 0) {
        const a = filtered[idx];
        const prevCampo = campos[ci - 1];
        const val = prevCampo === "observaciones" ? (a.observaciones || "") : String(a[prevCampo] ?? "");
        startEdit(a.id, prevCampo, val);
      }
    } else if (e.key === "Escape") {
      cancelEdit();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      saveEdit();
      const nextIdx = e.key === "ArrowUp" ? Math.max(idx - 1, 0) : Math.min(idx + 1, filtered.length - 1);
      if (nextIdx < filtered.length) {
        const a = filtered[nextIdx];
        const val = campo === "observaciones" ? (a.observaciones || "") : String(a[campo] ?? "");
        startEdit(a.id, campo, val);
      }
    }
  }

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id)));
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    await deleteAlumnosBulk(Array.from(selected));
    setSelected(new Set());
    mostrarMsg(`✓ Eliminados ${selected.size}`);
    onRefresh();
  }

  async function toggleRecursante(id: number, val: boolean) {
    try {
      await batchUpdateAlumno(id, { recursante: val });
      mostrarMsg(val ? "✓ Marcado recursante" : "✓ Recursante quitado");
      onRefresh();
    } catch {
      mostrarMsg("✗ Ejecutá en Supabase: ALTER TABLE alumnos ADD COLUMN recursante BOOLEAN DEFAULT FALSE;");
    }
  }

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.recursante && !b.recursante) return 1;
      if (!a.recursante && b.recursante) return -1;
      return 0;
    });
  }, [filtered]);

  if (sorted.length === 0) return <div className="empty-state">No hay alumnos</div>;

  const cs: React.CSSProperties = { borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)", paddingTop: 10, paddingBottom: 10 };

  return (
    <div>
      {savedMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{ backgroundColor: savedMsg.includes("✓") ? "var(--success)" : "var(--danger)", color: "#fff" }}>
          {savedMsg}
        </div>
      )}

      {/* Filter + Bulk actions bar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--border-color)" }}>
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
          className="input !w-auto !py-1 !text-xs">
          <option value="todos">Todos</option>
          <option value="TEA">Solo TEA</option>
          <option value="TEP">Solo TEP</option>
          <option value="aprobados">Aprobados</option>
          <option value="desaprobados">Desaprobados</option>
        </select>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{filtered.length} de {alumnos.length}</span>
        <div className="flex-1" />
        {selected.size > 0 && (
          <button onClick={deleteSelected} className="btn btn-danger btn-xs">Eliminar {selected.size}</button>
        )}
      </div>

      {/* Table */}
      <div>
        <table className="w-full" style={{ fontSize: "0.75rem" }}>
          <TableHeader allSelected={selected.size === sorted.length} onToggleAll={toggleAll} hasRows={sorted.length > 0} />
            <tbody>
              {sorted.map((a, idx) => {
              const isEditing = (campo: CampoNota | "observaciones") => editing?.alumnoId === a.id && editing?.campo === campo;
  const stickyStyle: React.CSSProperties = {
    position: "sticky", left: 0, zIndex: 2,
    backgroundColor: "var(--bg-card)",
    borderBottom: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    fontSize: "0.8125rem",
    whiteSpace: "nowrap",
    paddingTop: 10, paddingBottom: 10,
  };

              function renderNotaCell(campo: CampoNota) {
                const val = a[campo];
                if (isEditing(campo)) {
                  return (
                    <td className="p-0" style={cs}>
                      <input ref={inputRef} type="number" step="0.01" min="0" max="10"
                        value={editValue} onChange={e => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={e => handleKeyDown(e, idx, campo)}
                        className="w-full h-full px-3 py-2 outline-none border-2 border-[var(--accent)] rounded"
                        style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", width: 70 }}
                        autoFocus />
                    </td>
                  );
                }
                return (
                  <td className="text-center cursor-pointer"
                    style={{ ...cs, color: val !== null ? colorNota(val) : undefined, fontSize: "0.875rem" }}
                    onClick={() => startEdit(a.id, campo, String(val ?? ""))}
                    title="Clic para editar">
                    {val ?? ""}
                  </td>
                );
              }

              return (
                <tr key={a.id}>
                  <td className="text-center" style={cs}>
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} />
                  </td>
                  <td className="font-medium" style={stickyStyle}
                    onClick={() => onEdit(a)}>
                    <button onClick={e => { e.stopPropagation(); toggleRecursante(a.id, !a.recursante); }}
                      className="inline-flex items-center justify-center w-5 h-5 mr-1.5 rounded text-[10px] font-bold transition-all duration-150 hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: a.recursante ? "var(--danger)" : "transparent",
                        color: a.recursante ? "#fff" : "var(--text-secondary)",
                        border: "1px solid",
                        borderColor: a.recursante ? "var(--danger)" : "var(--border-color)",
                        opacity: a.recursante ? 1 : 0.5,
                        cursor: "pointer",
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                      title={a.recursante ? "Quitar recursante" : "Marcar recursante"}>R</button>
                    <span className="cursor-pointer">{a.apellidoNombre}</span>
                  </td>
                  {renderNotaCell("nota1")}
                  {renderNotaCell("nota2")}
                  {renderNotaCell("nota3")}
                  <td className="text-center cursor-pointer"
                    style={{ ...cs, color: a.notaAsistencia1 !== null ? colorNota(a.notaAsistencia1) : undefined, fontSize: "0.875rem" }}
                    title="Nota de Asistencia 1°C">{a.notaAsistencia1 ?? ""}</td>
                  <td className="text-center" style={cs}>
                    {a.informe1 && <span className="badge" style={{
                      backgroundColor: a.informe1 === "TEA" ? "rgba(59,130,246,0.15)" : a.nota1C !== null && a.nota1C < 4 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                      color: a.informe1 === "TEA" ? "#3b82f6" : a.nota1C !== null && a.nota1C < 4 ? "var(--danger)" : "var(--success)",
                    }}>{a.informe1}</span>}
                  </td>
                  <td className="text-center font-semibold" style={{ ...cs, fontSize: "0.875rem" }}>{a.nota1C ?? ""}</td>
                  {renderNotaCell("nota4")}
                  {renderNotaCell("nota5")}
                  {renderNotaCell("nota6")}
                  <td className="text-center cursor-pointer"
                    style={{ ...cs, color: a.notaAsistencia2 !== null ? colorNota(a.notaAsistencia2) : undefined, fontSize: "0.875rem" }}
                    title="Nota de Asistencia 2°C">{a.notaAsistencia2 ?? ""}</td>
                  <td className="text-center" style={cs}>
                    {a.informe2 && <span className="badge" style={{
                      backgroundColor: a.informe2 === "TEA" ? "rgba(59,130,246,0.15)" : a.nota2C !== null && a.nota2C < 4 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                      color: a.informe2 === "TEA" ? "#3b82f6" : a.nota2C !== null && a.nota2C < 4 ? "var(--danger)" : "var(--success)",
                    }}>{a.informe2}</span>}
                  </td>
                  <td className="text-center font-semibold" style={{ ...cs, fontSize: "0.875rem" }}>{a.nota2C ?? ""}</td>
                  <td className="text-center font-bold" style={{
                    ...cs,
                    fontSize: "0.875rem",
                    color: a.notaFinal !== null ? (a.notaFinal >= 7 ? "#3b82f6" : a.notaFinal >= 4 ? "var(--success)" : "var(--danger)") : undefined,
                  }}>{a.notaFinal ?? ""}</td>
                  <td className="text-center" style={cs}>
                    {a.situacionFinal && <span className="badge" style={{
                      backgroundColor: a.situacionFinal === "Aprobado" ? "rgba(59,130,246,0.15)" : a.notaFinal !== null && a.notaFinal < 4 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                      color: a.situacionFinal === "Aprobado" ? "#3b82f6" : a.notaFinal !== null && a.notaFinal < 4 ? "var(--danger)" : "var(--success)",
                    }}>{a.situacionFinal}</span>}
                  </td>
                  <td className="max-w-[120px] cursor-pointer" style={cs}
                    onClick={() => startEdit(a.id, "observaciones", a.observaciones || "")}>
                    {isEditing("observaciones") ? (
                      <input ref={inputRef} type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                        onBlur={saveEdit} onKeyDown={e => handleKeyDown(e, idx, "observaciones")}
                        className="w-full outline-none border border-[var(--accent)] rounded px-1 py-0.5 text-xs"
                        style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }} autoFocus />
                    ) : (
                      <span className="text-xs truncate block">{a.observaciones || ""}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Averages row */}
            <tfoot>
              <tr style={{ backgroundColor: "var(--bg-secondary)" }}>
                <td className="px-1.5 py-1.5 border-t font-semibold text-xs" style={cs}></td>
                <td className="px-1.5 py-1.5 border-t font-semibold text-xs" style={cs}>Prom</td>
                {CAMPOS.map(c => {
                  const p = promedioCol(c);
                  return <td key={c} className="px-1.5 py-1.5 border-t text-center font-semibold text-xs" style={{ ...cs, color: p !== null ? colorNota(p) : "var(--text-secondary)" }}>{p ?? ""}</td>;
                })}
                {(() => {
                  const na1 = filtered.map(a => a.notaAsistencia1).filter((v): v is number => v !== null);
                  const p = na1.length ? Math.round((na1.reduce((s, v) => s + v, 0) / na1.length) * 100) / 100 : null;
                  return <td className="px-1.5 py-1.5 border-t text-center font-semibold text-xs" style={{ ...cs, color: p !== null ? colorNota(p) : "var(--text-secondary)" }}>{p ?? ""}</td>;
                })()}
                <td className="px-1.5 py-1.5 border-t" style={cs}></td>
                <td className="px-1.5 py-1.5 border-t text-center font-semibold text-xs" style={cs}></td>
                {(() => {
                  const p = promedioCol("nota4");
                  return <td className="px-1.5 py-1.5 border-t text-center font-semibold text-xs" style={{ ...cs, color: p !== null ? colorNota(p) : "var(--text-secondary)" }}>{p ?? ""}</td>;
                })()}
                {(() => {
                  const p = promedioCol("nota5");
                  return <td className="px-1.5 py-1.5 border-t text-center font-semibold text-xs" style={{ ...cs, color: p !== null ? colorNota(p) : "var(--text-secondary)" }}>{p ?? ""}</td>;
                })()}
                {(() => {
                  const p = promedioCol("nota6");
                  return <td className="px-1.5 py-1.5 border-t text-center font-semibold text-xs" style={{ ...cs, color: p !== null ? colorNota(p) : "var(--text-secondary)" }}>{p ?? ""}</td>;
                })()}
                <td className="px-1.5 py-1.5 border-t" style={cs}></td>
                {(() => {
                  const na2 = filtered.map(a => a.notaAsistencia2).filter((v): v is number => v !== null);
                  const p = na2.length ? Math.round((na2.reduce((s, v) => s + v, 0) / na2.length) * 100) / 100 : null;
                  return <td className="px-1.5 py-1.5 border-t text-center font-semibold text-xs" style={{ ...cs, color: p !== null ? colorNota(p) : "var(--text-secondary)" }}>{p ?? ""}</td>;
                })()}
                <td className="px-1.5 py-1.5 border-t text-center font-semibold text-xs" style={cs}></td>
                <td className="px-1.5 py-1.5 border-t text-center font-bold text-xs" style={{
                  ...cs,
                  color: promedioGeneral !== null ? (promedioGeneral >= 7 ? "var(--success)" : promedioGeneral >= 4 ? "var(--warning)" : "var(--danger)") : undefined,
                }}>{promedioGeneral ?? ""}</td>
                <td className="px-1.5 py-1.5 border-t" style={cs}></td>
                <td className="px-1.5 py-1.5 border-t" style={cs}></td>
              </tr>
            </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 text-xs border-t" style={{ color: "var(--text-secondary)", borderColor: "var(--border-color)" }}>
        {filtered.length} alumno{filtered.length !== 1 ? "s" : ""} · Clic en celda para editar · Enter/Tab siguiente · Esc cancelar
      </div>
    </div>
  );
}
