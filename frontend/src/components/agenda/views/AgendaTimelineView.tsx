import type { AgendaViewProps } from "../types";
import { getTipoInfo, formatDate } from "../types";

export default function AgendaTimelineView({ items, onToggleDone, onEdit, onDelete }: AgendaViewProps) {
  const sorted = [...items].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);
  let lastDate = "";

  return (
    <div className="relative pl-6">
      <div className="absolute left-2.5 top-0 bottom-0 w-px" style={{ backgroundColor: "var(--border-color)" }} />
      {sorted.map(item => {
        const tipo = getTipoInfo(item.tipo);
        const showDate = item.fecha !== lastDate;
        lastDate = item.fecha;
        return (
          <div key={item.id}>
            {showDate && (
              <div className="relative flex items-center gap-2 py-2">
                <div className="absolute -left-4 w-3 h-3 rounded-full" style={{ backgroundColor: "var(--bg-card)", border: "2px solid var(--accent)" }} />
                <span className="text-xs font-semibold ml-4" style={{ color: "var(--accent)" }}>{formatDate(item.fecha)}</span>
              </div>
            )}
            <div className="relative pb-3">
              <div className={`absolute -left-4 w-3 h-3 rounded-full ${!showDate ? "" : ""}`}
                style={{
                  backgroundColor: item.done ? "var(--success)" : (tipo?.color || "#888"),
                  border: "2px solid var(--bg-card)",
                  top: 6,
                }} />
              <div
                className="ml-4 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
                style={{
                  borderColor: "var(--border-color)",
                  opacity: item.done ? 0.5 : 1,
                }}
                onClick={() => onToggleDone(item.id, !item.done)}>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: (tipo?.color || "#888") + "20", color: tipo?.color }}>
                    {tipo?.label || item.tipo}
                  </span>
                  <div className="flex-1" />
                  <button onClick={() => onEdit(item)}
                    className="p-1 rounded hover:bg-[var(--hover-bg)] transition-colors"
                    style={{ color: "var(--text-secondary)" }} title="Editar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => onDelete(item.id, item.titulo)}
                    className="p-1 rounded hover:bg-[var(--hover-bg)] transition-colors"
                    style={{ color: "var(--danger)" }} title="Eliminar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
                <div className="text-sm font-medium mt-1"
                  style={{
                    color: "var(--text-primary)",
                    textDecoration: item.done ? "line-through" : undefined,
                  }}>{item.titulo}</div>
                {item.descripcion && (
                  <div className="text-xs mt-0.5"
                    style={{
                      color: "var(--text-secondary)",
                      textDecoration: item.done ? "line-through" : undefined,
                    }}>{item.descripcion}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
