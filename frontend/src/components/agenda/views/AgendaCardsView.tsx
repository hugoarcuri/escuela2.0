import type { AgendaViewProps } from "../types";
import { getTipoInfo, formatDayMonth } from "../types";

export default function AgendaCardsView({ items, onToggleDone, onEdit, onDelete }: AgendaViewProps) {
  const sorted = [...items].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="grid gap-3" style={{
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    }}>
      {sorted.map(item => {
        const tipo = getTipoInfo(item.tipo);
        return (
          <div key={item.id}
            className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm flex flex-col"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-card)",
              opacity: item.done ? 0.5 : 1,
            }}
            onClick={() => onToggleDone(item.id, !item.done)}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ backgroundColor: (tipo?.color || "#888") + "20", color: tipo?.color }}>
                {tipo?.label || item.tipo}
              </span>
              <div className="flex-1" />
              <div className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                {formatDayMonth(item.fecha)}
              </div>
            </div>
            <div className="text-sm font-medium flex-1"
              style={{
                color: "var(--text-primary)",
                textDecoration: item.done ? "line-through" : undefined,
              }}>{item.titulo}</div>
            {item.descripcion && (
              <div className="text-xs mt-1"
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: item.done ? "line-through" : undefined,
                }}>{item.descripcion}</div>
            )}
            <div className="flex gap-2 mt-3 pt-2 border-t" style={{ borderColor: "var(--border-color)" }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(item)}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{ color: "var(--accent)", backgroundColor: "var(--hover-bg)" }}>
                Editar
              </button>
              <button onClick={() => onDelete(item.id, item.titulo)}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{ color: "var(--danger)", backgroundColor: "var(--hover-bg)" }}>
                Eliminar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
