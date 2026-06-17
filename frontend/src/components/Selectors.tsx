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

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Escuela</label>
        <div className="flex gap-1">
          <div ref={escuelaRef} className="relative flex-1">
            <div role="button" tabIndex={0} onClick={() => setEscuelaOpen(!escuelaOpen)}
              className="rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer flex items-center justify-between gap-2"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
              {selectedEscuela ? (
                <div className="flex flex-col leading-tight">
                  <span>{selectedEscuela.nombre}</span>
                  {selectedEscuela.distrito && <span className="text-[10px] opacity-60">{selectedEscuela.distrito}</span>}
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
                {escuelas.map(e => (
                  <div key={e.id} className="flex items-center group"
                    style={{ backgroundColor: e.id === escuelaId ? "var(--hover-bg)" : "transparent" }}>
                    <button onClick={() => { onEscuelaChange(e.id); setEscuelaOpen(false); }}
                      className="flex-1 text-left px-3 py-2 hover:bg-[var(--hover-bg)] transition-colors">
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm">{e.nombre}</span>
                        {e.distrito && <span className="text-[10px] opacity-60">{e.distrito}</span>}
                      </div>
                    </button>
                    <button onClick={(ev) => { ev.stopPropagation(); onEditEscuela(e.id); setEscuelaOpen(false); }}
                      className="p-1.5 mr-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--hover-bg)] transition-all"
                      title="Editar escuela" style={{ color: "var(--accent)" }}>
                      <Pencil size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onAdminEscuela} className="p-2 rounded-lg border hover:bg-[var(--hover-bg)] transition-colors" title="Administrar escuelas" style={s}>
            <Gear />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Curso</label>
        <div className="flex gap-1">
          <select value={cursoId} onChange={e => onCursoChange(e.target.value ? Number(e.target.value) : "")}
            disabled={!escuelaId}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
            style={s}>
            <option value="">Seleccionar curso</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.turno ? `(${c.turno})` : ""}</option>)}
          </select>
          <button onClick={onAdminCurso} className="p-2 rounded-lg border hover:bg-[var(--hover-bg)] transition-colors" title="Administrar cursos" style={s}>
            <Gear />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Materia</label>
        <div className="flex gap-1">
          <select value={materiaId} onChange={e => onMateriaChange(e.target.value ? Number(e.target.value) : "")}
            disabled={!cursoId}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
            style={s}>
            <option value="">Seleccionar materia</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <button onClick={onAdminMateria} className="p-2 rounded-lg border hover:bg-[var(--hover-bg)] transition-colors" title="Administrar materias" style={s}>
            <Gear />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Buscar alumno</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }}><Search /></span>
          <input type="text" value={search} onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar por apellido y nombre..."
            className="w-full rounded-lg border pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
        </div>
      </div>
    </div>
  );
}
