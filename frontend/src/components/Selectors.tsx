import { useState, useRef, useEffect } from "react";
import type { Escuela, Curso, Materia } from "../types";
import { Search, Gear, Pencil } from "./Icons";

interface Props {
  escuelas: Escuela[];
  cursos: Curso[];
  materias: Materia[];
  escuelaId: number | "";
  cursoId: number | "";
  materiaId: number | "";
  search: string;
  onEscuelaChange: (id: number | "") => void;
  onCursoChange: (id: number | "") => void;
  onMateriaChange: (id: number | "") => void;
  onSearchChange: (s: string) => void;
  onAdminEscuela: () => void;
  onEditEscuela: (id: number) => void;
  onAdminCurso: () => void;
  onAdminMateria: () => void;
}

export default function Selectors({
  escuelas, cursos, materias,
  escuelaId, cursoId, materiaId, search,
  onEscuelaChange, onCursoChange, onMateriaChange, onSearchChange,
  onAdminEscuela, onEditEscuela, onAdminCurso, onAdminMateria,
}: Props) {
  const s: React.CSSProperties = {
    backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)",
  };

  const [escuelaOpen, setEscuelaOpen] = useState(false);
  const escuelaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (escuelaRef.current && !escuelaRef.current.contains(e.target as Node)) setEscuelaOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedEscuela = escuelas.find(e => e.id === escuelaId);

  const BLUE = { bg: "rgba(59,130,246,.12)", border: "rgba(59,130,246,.30)", text: "#93c5fd", name: "matanza" };
  const RED = { bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.30)", text: "#fca5a5", name: "moron" };

  function escuelaBadge(nombre: string): { bg: string; border: string; text: string; name: string } | undefined {
    const n = nombre.toLowerCase();
    if (n.includes("matanza")) return BLUE;
    if (n.includes("morón") || n.includes("moron")) return RED;
    return undefined;
  }

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 items-end">
      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>Escuela</label>
        <div className="flex gap-1">
          <div ref={escuelaRef} className="relative flex-1">
            <div role="button" tabIndex={0} onClick={() => setEscuelaOpen(!escuelaOpen)}
              className="rounded-lg border px-2.5 py-1.5 text-xs outline-none cursor-pointer flex items-center justify-between gap-2"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
              {selectedEscuela ? (
                <div className="flex items-center gap-2" style={(() => {
                  const b = escuelaBadge(selectedEscuela.nombre);
                  return b ? { backgroundColor: b.bg, border: `1px solid ${b.border}`, borderRadius: "var(--radius-sm)", padding: "2px 10px 2px 8px" } : {};
                })()}>
                  {(() => {
                    const b = escuelaBadge(selectedEscuela.nombre);
                    return b ? <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.text }} /> : null;
                  })()}
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{selectedEscuela.nombre}</span>
                    {selectedEscuela.distrito && <span className="text-[10px]" style={{ color: escuelaBadge(selectedEscuela.nombre)?.text ?? "var(--text-secondary)" }}>{selectedEscuela.distrito}</span>}
                  </div>
                </div>
              ) : <span className="opacity-60">Seleccionar escuela</span>}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${escuelaOpen ? "rotate-180" : ""}`}><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {escuelaOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border shadow-lg max-h-60 overflow-auto"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                <button onClick={() => { onEscuelaChange(""); setEscuelaOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] transition-colors"
                  style={{ color: "var(--text-secondary)" }}>Seleccionar escuela</button>
                {escuelas.map(e => {
                  const b = escuelaBadge(e.nombre);
                  const isSelected = e.id === escuelaId;
                  return (
                    <div key={e.id} className="flex items-center group px-3 py-2 transition-colors"
                      style={{
                        backgroundColor: b ? (b.bg) : isSelected ? "var(--hover-bg)" : "transparent",
                        borderBottom: b ? `1px solid ${b.border}` : undefined,
                      }}
                      onMouseEnter={e => { if (b) e.currentTarget.style.backgroundColor = b.name === "matanza" ? "rgba(59,130,246,.20)" : "rgba(239,68,68,.20)"; }}
                      onMouseLeave={e => { if (b) e.currentTarget.style.backgroundColor = b.bg; }}>
                      <button onClick={() => { onEscuelaChange(e.id); setEscuelaOpen(false); }}
                        className="flex-1 text-left transition-colors">
                        <div className="flex items-center gap-2">
                          {b ? <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.text }} /> : null}
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{e.nombre}</span>
                            {e.distrito && <span className="text-[10px]" style={{ color: b?.text ?? "var(--text-secondary)" }}>{e.distrito}</span>}
                          </div>
                        </div>
                      </button>
                      <button onClick={(ev) => { ev.stopPropagation(); onEditEscuela(e.id); setEscuelaOpen(false); }}
                        className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--hover-bg)] transition-all shrink-0"
                        title="Editar escuela" style={{ color: b?.text ?? "var(--accent)" }}>
                        <Pencil size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={onAdminEscuela} className="p-1.5 rounded-lg border hover:bg-[var(--hover-bg)] transition-colors" title="Administrar escuelas" style={s}>
            <Gear />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-[130px]">
        <label className="block text-[10px] font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>Curso</label>
        <div className="flex gap-1">
          <select value={cursoId} onChange={e => onCursoChange(e.target.value ? Number(e.target.value) : "")}
            disabled={!escuelaId}
            className="flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
            style={s}>
            <option value="">Seleccionar curso</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.turno ? `(${c.turno})` : ""}</option>)}
          </select>
          <button onClick={onAdminCurso} className="p-1.5 rounded-lg border hover:bg-[var(--hover-bg)] transition-colors" title="Administrar cursos" style={s}>
            <Gear />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-[130px]">
        <label className="block text-[10px] font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>Materia</label>
        <div className="flex gap-1">
          <select value={materiaId} onChange={e => onMateriaChange(e.target.value ? Number(e.target.value) : "")}
            disabled={!cursoId}
            className="flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
            style={s}>
            <option value="">Seleccionar materia</option>
            {materias.map(m => <option key={m.id} value={m.id}>
              {m.nombre}{m.dia ? ` — ${m.dia}` : ""}{m.turno ? ` (${m.turno})` : ""}
            </option>)}
          </select>
          <button onClick={onAdminMateria} className="p-1.5 rounded-lg border hover:bg-[var(--hover-bg)] transition-colors" title="Administrar materias" style={s}>
            <Gear />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>Buscar</label>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }}><Search /></span>
          <input type="text" value={search} onChange={e => onSearchChange(e.target.value)}
            placeholder="Apellido y nombre..."
            className="w-full rounded-lg border pl-8 pr-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
        </div>
      </div>
    </div>
  );
}
