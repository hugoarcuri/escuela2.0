import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "notaLabels";

function loadLabels(materiaId: number): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${materiaId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveLabels(materiaId: number, labels: Record<string, string>) {
  localStorage.setItem(`${STORAGE_KEY}_${materiaId}`, JSON.stringify(labels));
}

interface Props {
  allSelected: boolean;
  onToggleAll: () => void;
  hasRows: boolean;
  materiaId: number;
}

type Campo = "N 1" | "N 2" | "N 3" | "N 4" | "N 5" | "N 6";

interface ColDef {
  key: string;
  label: string;
  tooltip: string;
  campo?: Campo;
  minW?: number;
  group?: "1C" | "2C" | "none";
}

const TOOLTIPS: Record<string, string> = {
  "N 1": "Nota 1",
  "N 2": "Nota 2",
  "N 3": "Nota 3",
  "N.A 1": "Nota de Acreditación 1°C",
  "Inf 1": "Informe 1°C",
  "1°C": "Promedio 1°C",
  "N 4": "Nota 4",
  "N 5": "Nota 5",
  "N 6": "Nota 6",
  "N.A 2": "Nota de Acreditación 2°C",
  "Inf 2": "Informe 2°C",
  "2°C": "Promedio 2°C",
  "N Final": "Nota Final",
  "Sit.": "Situación Final",
  "Obs.": "Observaciones",
};

const COL_DEFS: ColDef[] = [
  { key: "", label: "", tooltip: "", minW: 36 },
  { key: "Apellido y Nombre", label: "Apellido y Nombre", tooltip: "Apellido y Nombre del alumno", minW: 200 },
  { key: "N 1", label: "", tooltip: "", campo: "N 1", minW: 52, group: "1C" },
  { key: "N 2", label: "", tooltip: "", campo: "N 2", minW: 52, group: "1C" },
  { key: "N 3", label: "", tooltip: "", campo: "N 3", minW: 52, group: "1C" },
  { key: "N.A 1", label: "N.A 1", tooltip: "Nota de Acreditación 1°C", minW: 54, group: "1C" },
  { key: "Inf 1", label: "Inf 1", tooltip: "Informe 1°C", minW: 50, group: "1C" },
  { key: "1°C", label: "1°C", tooltip: "Promedio 1°C", minW: 50, group: "1C" },
  { key: "N 4", label: "", tooltip: "", campo: "N 4", minW: 52, group: "2C" },
  { key: "N 5", label: "", tooltip: "", campo: "N 5", minW: 52, group: "2C" },
  { key: "N 6", label: "", tooltip: "", campo: "N 6", minW: 52, group: "2C" },
  { key: "N.A 2", label: "N.A 2", tooltip: "Nota de Acreditación 2°C", minW: 54, group: "2C" },
  { key: "Inf 2", label: "Inf 2", tooltip: "Informe 2°C", minW: 50, group: "2C" },
  { key: "2°C", label: "2°C", tooltip: "Promedio 2°C", minW: 50, group: "2C" },
  { key: "N Final", label: "N Final", tooltip: "Nota Final", minW: 56 },
  { key: "Sit.", label: "Sit.", tooltip: "Situación Final", minW: 56 },
  { key: "Obs.", label: "Obs.", tooltip: "Observaciones", minW: 120 },
];

export default function TableHeader({ allSelected, onToggleAll, hasRows, materiaId }: Props) {
  const [labels, setLabels] = useState<Record<string, string>>(() => loadLabels(materiaId));
  const [editing, setEditing] = useState<Campo | null>(null);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveLabels(materiaId, labels); }, [labels, materiaId]);

  function startEdit(campo: Campo) {
    setEditing(campo);
    setEditVal(labels[campo] || "");
    setTimeout(() => inputRef.current?.focus(), 10);
  }

  function saveEdit() {
    if (editing) {
      setLabels(prev => {
        const next = { ...prev };
        if (editVal.trim()) next[editing] = editVal.trim();
        else delete next[editing];
        return next;
      });
    }
    setEditing(null);
  }

  const cols = COL_DEFS.map(c => ({
    ...c,
    label: c.campo ? (labels[c.campo] || c.campo) : c.label,
    tooltip: c.campo ? (labels[c.campo] ? labels[c.campo] : TOOLTIPS[c.key]) : (TOOLTIPS[c.key] || c.tooltip),
  }));

  const thBase: React.CSSProperties = {
    backgroundColor: "var(--bg-card)",
    borderBottom: "1px solid var(--border-color)",
    borderRight: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
    fontSize: "0.75rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    padding: "6px 4px",
    textAlign: "center",
  };
  const thLast: React.CSSProperties = { ...thBase, borderRight: "none" };
  const thGroup: React.CSSProperties = {
    backgroundColor: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border-color)",
    borderRight: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    padding: "5px 4px",
    textAlign: "center",
  };
  const thGroupLast: React.CSSProperties = { ...thGroup, borderRight: "none" };
  const thName: React.CSSProperties = { ...thBase, position: "sticky", left: 36, zIndex: 15, textAlign: "left", paddingLeft: 8 };
  const thCheck: React.CSSProperties = { ...thBase, position: "sticky", left: 0, zIndex: 15 };

  // Group header row: compute colSpan for each group
  const groups = [
    { label: "", colSpan: 2 },
    { label: "Primer Cuatrimestre", colSpan: 6 },
    { label: "Segundo Cuatrimestre", colSpan: 6 },
    { label: "", colSpan: 3 },
  ];

  return (
    <thead>
      {/* Group header row */}
      <tr>
        {groups.map((g, gi) => {
          const isLast = gi === groups.length - 1;
          return (
            <th key={gi} colSpan={g.colSpan}
              style={{
                ...(isLast ? thGroupLast : thGroup),
                position: "sticky", top: 0, zIndex: gi === 0 ? 16 : (gi === 1 || gi === 2 ? 12 : 11),
              }}>
              {g.label}
            </th>
          );
        })}
      </tr>
      {/* Column header row */}
      <tr>
        {cols.map((c, i) => {
          const isLast = i === cols.length - 1;
          const isName = c.key === "Apellido y Nombre";
          const isCheck = c.key === "";
          let style: React.CSSProperties;
          if (isCheck) style = thCheck;
          else if (isName) style = thName;
          else style = isLast ? thLast : thBase;

          return (
            <th key={c.key}
              style={{
                ...style,
                position: isCheck || isName ? style.position as any : "sticky",
                top: isCheck || isName ? style.top as any : 28,
                zIndex: isCheck ? 16 : isName ? 15 : 11,
                minWidth: c.minW || 50,
              }}
              title={c.tooltip || undefined}>
              {c.key === "" ? (
                <input type="checkbox" onChange={onToggleAll} checked={allSelected && hasRows} />
              ) : c.campo && editing === c.campo ? (
                <input ref={inputRef} type="text" value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") { setEditing(null); } }}
                  className="w-14 px-1 py-0.5 text-xs outline-none border border-[var(--accent)] rounded"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
                  autoFocus />
              ) : (
                <span onClick={() => c.campo && startEdit(c.campo)}
                  style={{ cursor: c.campo ? "pointer" : "default" }}>
                  {c.label}
                </span>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
