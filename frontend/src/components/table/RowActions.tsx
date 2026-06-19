import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "../Icons";

interface Props {
  onEdit: () => void;
  onDelete: () => void;
}

export default function RowActions({ onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="btn btn-xs btn-ghost !p-1" title="Acciones">
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] py-1 rounded-lg border shadow-md"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
            boxShadow: "var(--shadow-md)"
          }}
          onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { onEdit(); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-xs transition-colors"
            style={{ color: "var(--text-primary)" }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--hover-bg)"}
            onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
            Editar
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-xs transition-colors"
            style={{ color: "var(--danger)" }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--hover-bg)"}
            onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
