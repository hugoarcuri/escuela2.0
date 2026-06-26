import { useState } from "react";
import type { AgendaViewProps } from "../types";
import { getTipoInfo } from "../types";

export default function AgendaCompactView({ items, onToggleDone, onEdit, onDelete }: AgendaViewProps) {
  const [showAll, setShowAll] = useState(false);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayItems = items.filter(item => {
    const d = new Date(item.fecha + "T12:00:00"); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const display = showAll ? items : todayItems;
  const hidden = items.length - display.length;

  if (!items.length) return null;

  return (
    <div>
      {display.map(item => {
        const tipo = getTipoInfo(item.tipo);
        return (
          <div key={item.id}
            className="flex items-center gap-2 py-1.5 px-1 rounded cursor-pointer transition-colors"
            style={{ opacity: item.done ? 0.45 : 1 }}
            onClick={() => onToggleDone(item.id, !item.done)}>
            <span style={{ color: tipo?.color, fontSize: "0.6rem" }}>●</span>
            <span className="text-sm"
              style={{
                color: "var(--text-primary)",
                textDecoration: item.done ? "line-through" : undefined,
              }}>{item.titulo}</span>
            <div className="flex-1" />
            <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(item)}
                className="p-0.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
                style={{ color: "var(--text-secondary)" }} title="Editar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={() => onDelete(item.id, item.titulo)}
                className="p-0.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
                style={{ color: "var(--danger)" }} title="Eliminar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        );
      })}
      {hidden > 0 && (
        <button onClick={() => setShowAll(!showAll)}
          className="text-xs mt-1 px-1 py-0.5 rounded transition-colors"
          style={{ color: "var(--accent)" }}>
          {showAll ? `Mostrar solo hoy` : `Ver más... (${hidden} restantes)`}
        </button>
      )}
    </div>
  );
}
