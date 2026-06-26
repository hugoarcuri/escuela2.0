import type { AgendaViewProps } from "../types";
import { getTipoInfo, formatDate } from "../types";

export default function AgendaHoyView({ items, onToggleDone, onEdit, onDelete }: AgendaViewProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const hoy = items.filter(item => {
    const d = new Date(item.fecha + "T12:00:00"); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  if (!hoy.length) {
    return (
      <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
        <p className="text-lg mb-1">No hay eventos para hoy</p>
        <p className="text-sm">Todo despejado 🎯</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
        Hoy ({hoy.length})
      </div>
      <div className="space-y-3">
        {hoy.map(item => {
          const tipo = getTipoInfo(item.tipo);
          return (
            <div key={item.id}
              className="rounded-xl border p-5 cursor-pointer transition-all hover:shadow-sm"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-card)",
                borderLeft: `4px solid ${tipo?.color || "#888"}`,
                opacity: item.done ? 0.5 : 1,
              }}
              onClick={() => onToggleDone(item.id, !item.done)}>
              <div className="flex items-start gap-3">
                <span style={{ fontSize: "1.5rem" }}>
                  {item.tipo === "evaluacion" ? "📝" : "📦"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ backgroundColor: (tipo?.color || "#888") + "20", color: tipo?.color }}>
                      {tipo?.label || item.tipo}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(item.fecha)}
                    </span>
                  </div>
                  <div className="text-base font-semibold mt-1"
                    style={{
                      color: "var(--text-primary)",
                      textDecoration: item.done ? "line-through" : undefined,
                    }}>{item.titulo}</div>
                  {item.descripcion && (
                    <div className="text-sm mt-1"
                      style={{
                        color: "var(--text-secondary)",
                        textDecoration: item.done ? "line-through" : undefined,
                      }}>{item.descripcion}</div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => onEdit(item)}
                    className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                    style={{ color: "var(--text-secondary)" }} title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => onDelete(item.id, item.titulo)}
                    className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                    style={{ color: "var(--danger)" }} title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
