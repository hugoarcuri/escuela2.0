import { useState, useRef, useEffect, useCallback } from "react";
import type { Alumno } from "../types";
import { batchUpdateAlumno, deleteAlumnosBulk } from "../api";

interface Props {
  alumnos: Alumno[];
  onRefresh: () => void;
  onEdit: (a: Alumno) => void;
  onDelete: (id: number) => void;
}

type CampoNota = "nota1" | "nota2" | "nota3" | "nota4" | "nota5" | "nota6";

function colorNota(val: number | null): string {
  if (val === null) return "transparent";
  if (val >= 1 && val <= 3) return "var(--nota-baja)";
  if (val >= 4 && val <= 6) return "var(--nota-media)";
  if (val >= 7 && val <= 10) return "var(--nota-alta)";
  return "transparent";
}

function parseVal(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

export default function StudentTable({ alumnos, onRefresh, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState<{ alumnoId: number; campo: CampoNota | "observaciones" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [savedMsg, setSavedMsg] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

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

  const totalAlumnos = filtered.length;
  const cantTEA = filtered.filter(a => a.informe1 === "TEA" || a.informe2 === "TEA").length;
  const cantTEP = filtered.filter(a => a.informe1 === "TEP" || a.informe2 === "TEP").length;
  const aprobados = filtered.filter(a => a.situacionFinal === "Aprobado").length;
  const desaprobados = filtered.filter(a => a.situacionFinal === "Desaprobado").length;
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

  function promedioParaExcel(campo: CampoNota): string {
    const p = promedioCol(campo);
    return p !== null ? String(p) : "";
  }

  const cs: React.CSSProperties = { borderColor: "var(--border-color)", color: "var(--text-primary)" };
  const hs: React.CSSProperties = { backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" };

  if (filtered.length === 0) return <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>No hay alumnos</div>;

  const CAMPOS: CampoNota[] = ["nota1", "nota2", "nota3", "nota4", "nota5", "nota6"];
  const HEADERS = ["", "Apellido y Nombre", "Nota 1", "Nota 2", "Nota 3", "Informe 1", "1° Cuat.", "Nota 4", "Nota 5", "Nota 6", "Informe 2", "2° Cuat.", "Nota Final", "Situación", "Obs.", "Acciones"];

  return (
    <div>
      {savedMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{ backgroundColor: savedMsg.includes("✓") ? "var(--success)" : "var(--danger)", color: "#fff" }}>
          {savedMsg}
        </div>
      )}

      {/* Summary + Filters bar */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <span className="text-sm font-medium">Alumnos: <strong>{totalAlumnos}</strong></span>
        <span className="text-sm" style={{ color: "var(--success)" }}>TEA: <strong>{cantTEA}</strong></span>
        <span className="text-sm" style={{ color: "var(--danger)" }}>TEP: <strong>{cantTEP}</strong></span>
        <span className="text-sm" style={{ color: "var(--success)" }}>Aprobados: <strong>{aprobados}</strong></span>
        <span className="text-sm" style={{ color: "var(--danger)" }}>Desaprobados: <strong>{desaprobados}</strong></span>
        <span className="text-sm">Prom. Gral: <strong>{promedioGeneral ?? "—"}</strong></span>
        <div className="flex-1" />
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
          <option value="todos">Todos</option>
          <option value="TEA">Solo TEA</option>
          <option value="TEP">Solo TEP</option>
          <option value="aprobados">Aprobados</option>
          <option value="desaprobados">Desaprobados</option>
        </select>
        {selected.size > 0 && (
          <button onClick={deleteSelected} className="btn-danger text-xs px-3 py-1.5">Eliminar {selected.size}</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border" style={{ borderColor: "var(--border-color)", maxHeight: "calc(100vh - 320px)" }} ref={tableRef}>
        <table className="w-full text-sm" style={{ minWidth: 1000 }}>
          <thead><tr>
            {HEADERS.map(h => (
              <th key={h} className="px-3 py-3 text-left font-medium text-xs uppercase tracking-wider border-b whitespace-nowrap sticky top-0 z-10"
                style={{ ...hs, backgroundColor: "var(--bg-card)", position: "sticky", top: 0, left: h === "Apellido y Nombre" ? 0 : undefined, zIndex: h === "Apellido y Nombre" ? 20 : 10 }}>
                {h === "" ? <input type="checkbox" onChange={toggleAll} checked={selected.size === filtered.length && filtered.length > 0} /> : h}
              </th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((a, idx) => {
              const isEditing = (campo: CampoNota | "observaciones") => editing?.alumnoId === a.id && editing?.campo === campo;
              const cellCls = "px-3 py-2 border-b transition-colors";
              const stickyStyle: React.CSSProperties = {
                position: "sticky", left: 0, zIndex: 2,
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              };

              function renderNotaCell(campo: CampoNota) {
                const val = a[campo];
                if (isEditing(campo)) {
                  return (
                    <td className={`${cellCls} p-0`} style={cs}>
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
                  <td className={`${cellCls} text-center cursor-pointer`}
                    style={{ ...cs, backgroundColor: colorNota(val) }}
                    onClick={() => startEdit(a.id, campo, String(val ?? ""))}
                    title="Clic para editar">
                    {val ?? ""}
                  </td>
                );
              }

              return (
                <tr key={a.id} className="transition-colors"
                  style={{ borderColor: "var(--border-color)" }}
                  onMouseOver={e => { if (!isEditing("nota1")) e.currentTarget.style.backgroundColor = "var(--hover-bg)"; }}
                  onMouseOut={e => { if (!isEditing("nota1")) e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <td className={`${cellCls} text-center`} style={cs}>
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} />
                  </td>
                  <td className={`${cellCls} font-medium cursor-pointer`}
                    style={stickyStyle}
                    onClick={() => onEdit(a)}>
                    {a.apellidoNombre}
                  </td>
                  {renderNotaCell("nota1")}
                  {renderNotaCell("nota2")}
                  {renderNotaCell("nota3")}
                  <td className={`${cellCls} text-center`} style={cs}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.informe1 === "TEA" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : a.informe1 === "TEP" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : ""}`}>
                      {a.informe1 ?? ""}
                    </span>
                  </td>
                  <td className={`${cellCls} text-center font-semibold`} style={cs}>{a.nota1C ?? ""}</td>
                  {renderNotaCell("nota4")}
                  {renderNotaCell("nota5")}
                  {renderNotaCell("nota6")}
                  <td className={`${cellCls} text-center`} style={cs}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.informe2 === "TEA" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : a.informe2 === "TEP" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : ""}`}>
                      {a.informe2 ?? ""}
                    </span>
                  </td>
                  <td className={`${cellCls} text-center font-semibold`} style={cs}>{a.nota2C ?? ""}</td>
                  <td className={`${cellCls} text-center font-bold`} style={cs}>{a.notaFinal ?? ""}</td>
                  <td className={`${cellCls} text-center`} style={cs}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.situacionFinal === "Aprobado" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : a.situacionFinal === "Desaprobado" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : ""}`}>
                      {a.situacionFinal}
                    </span>
                  </td>
                  <td className={`${cellCls} max-w-[120px] cursor-pointer`} style={cs}
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
                  <td className={`${cellCls} text-center whitespace-nowrap`} style={cs}>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(a); }}
                      className="text-xs font-semibold px-2 py-1 rounded border"
                      style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = "var(--accent)"; e.currentTarget.style.color = "#fff"; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}>Editar</button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(a.id); }}
                      className="text-xs font-semibold px-2 py-1 rounded border ml-1"
                      style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = "var(--danger)"; e.currentTarget.style.color = "#fff"; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--danger)"; }}>Eliminar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Averages row */}
          <tfoot>
            <tr style={{ backgroundColor: "var(--bg-secondary)" }}>
              <td className="px-3 py-2 border-t font-semibold text-xs" style={cs}></td>
              <td className="px-3 py-2 border-t font-semibold text-xs" style={cs}>Promedio</td>
              {CAMPOS.map(c => {
                const p = promedioCol(c);
                return <td key={c} className="px-3 py-2 border-t text-center font-semibold text-xs" style={{ ...cs, backgroundColor: p !== null ? colorNota(p) : "transparent" }}>{p ?? ""}</td>;
              })}
              <td className="px-3 py-2 border-t" style={cs}></td>
              <td className="px-3 py-2 border-t text-center font-semibold text-xs" style={cs}>{promedioParaExcel("nota1") ? "" : ""}</td>
              <td colSpan={3} className="px-3 py-2 border-t" style={cs}></td>
              <td className="px-3 py-2 border-t" style={cs}></td>
              <td className="px-3 py-2 border-t" style={cs}></td>
              <td className="px-3 py-2 border-t text-center font-bold text-xs" style={cs}>{promedioGeneral ?? ""}</td>
              <td className="px-3 py-2 border-t" style={cs}></td>
              <td className="px-3 py-2 border-t" style={cs}></td>
              <td className="px-3 py-2 border-t" style={cs}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-3 py-2 text-xs" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card)", borderLeft: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        {filtered.length} alumno{filtered.length !== 1 ? "s" : ""} · Clic en celda para editar · Enter/Tab siguiente · Esc cancelar
      </div>
    </div>
  );
}
