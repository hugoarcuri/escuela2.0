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

  const headers: { key: string; label: string; campo?: Campo; minW?: number }[] = [
    { key: "", label: "" },
    { key: "Apellido y Nombre", label: "Apellido y Nombre", minW: 220 },
    { key: "N 1", label: labels["N 1"] || "N 1", campo: "N 1", minW: 50 },
    { key: "N 2", label: labels["N 2"] || "N 2", campo: "N 2", minW: 50 },
    { key: "N 3", label: labels["N 3"] || "N 3", campo: "N 3", minW: 50 },
    { key: "N.A 1", label: "N.A 1", minW: 50 },
    { key: "Inf 1", label: "Inf 1", minW: 50 },
    { key: "1°C", label: "1°C", minW: 50 },
    { key: "N 4", label: labels["N 4"] || "N 4", campo: "N 4", minW: 50 },
    { key: "N 5", label: labels["N 5"] || "N 5", campo: "N 5", minW: 50 },
    { key: "N 6", label: labels["N 6"] || "N 6", campo: "N 6", minW: 50 },
    { key: "N.A 2", label: "N.A 2", minW: 50 },
    { key: "Inf 2", label: "Inf 2", minW: 50 },
    { key: "2°C", label: "2°C", minW: 50 },
    { key: "N Final", label: "N Final", minW: 50 },
    { key: "Sit.", label: "Sit.", minW: 50 },
    { key: "Obs.", label: "Obs.", minW: 120 },
  ];

  const thBase: React.CSSProperties = {
    backgroundColor: "var(--bg-card)",
    borderBottom: "1px solid var(--border-color)",
    borderRight: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    position: "sticky", top: 0,
    zIndex: 10,
    whiteSpace: "nowrap",
  };

  const thLast: React.CSSProperties = {
    ...thBase,
    borderRight: "none",
  };

  return (
    <thead>
      <tr>
        {headers.map((h, i) => {
          const isLast = i === headers.length - 1;
          const isName = h.key === "Apellido y Nombre";
          return (
            <th key={h.key}
              style={{
                ...(isLast ? thLast : thBase),
                left: isName ? 0 : undefined,
                zIndex: isName ? 20 : 10,
                minWidth: h.minW || 50,
              }}>
              {h.key === "" ? (
                <input type="checkbox" onChange={onToggleAll} checked={allSelected && hasRows} />
              ) : h.campo && editing === h.campo ? (
                <input ref={inputRef} type="text" value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") { setEditing(null); } }}
                  className="w-16 px-1 py-0.5 text-xs outline-none border border-[var(--accent)] rounded"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
                  autoFocus />
              ) : (
                <span onClick={() => h.campo && startEdit(h.campo)}
                  style={{ cursor: h.campo ? "pointer" : "default" }}
                  title={h.campo ? "Clic para renombrar" : undefined}>
                  {h.label}
                </span>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
