import type { AgendaViewProps } from "../types";
import { getTipoInfo } from "../types";

export default function AgendaKanbanView({ items, onToggleDone, onEdit, onDelete }: AgendaViewProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const hoy = items.filter(item => {
    const d = new Date(item.fecha + "T12:00:00"); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const proximos = items.filter(item => {
    const d = new Date(item.fecha + "T12:00:00"); d.setHours(0, 0, 0, 0);
    return d.getTime() > today.getTime();
  });
  const finalizados = items.filter(item => item.done);

  const columns = [
    { key: "hoy", label: "Hoy", data: hoy, color: "var(--accent)" },
    { key: "proximos", label: "Próximos", data: proximos, color: "#f59e0b" },
    { key: "finalizados", label: "Finalizados", data: finalizados, color: "var(--success)" },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
      {columns.map(col => (
        <div key={col.key} className="flex-1 min-w-[200px]">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: col.color }}>
            {col.label} <span className="opacity-60">({col.data.length})</span>
          </div>
          <div className="space-y-2">
            {col.data.map(item => {
              const tipo = getTipoInfo(item.tipo);
              return (
                <div key={item.id}
                  className="rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-card)",
                    opacity: col.key === "finalizados" ? 0.6 : 1,
                  }}
                  onClick={() => !item.done && onToggleDone(item.id, true)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: (tipo?.color || "#888") + "20", color: tipo?.color }}>
                      {tipo?.label || item.tipo}
                    </span>
                    <div className="flex-1" />
                    <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onEdit(item)}
                        className="p-0.5 rounded hover:bg-[var(--hover-bg)]"
                        style={{ color: "var(--text-secondary)" }} title="Editar">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-medium"
                    style={{
                      color: "var(--text-primary)",
                      textDecoration: item.done ? "line-through" : undefined,
                    }}>{item.titulo}</div>
                  <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                    {col.key !== "finalizados" && (
                      <button onClick={() => onToggleDone(item.id, true)}
                        className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                        style={{ color: "var(--success)", backgroundColor: "var(--hover-bg)" }}>
                        ✓ Hecho
                      </button>
                    )}
                    <button onClick={() => onDelete(item.id, item.titulo)}
                      className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                      style={{ color: "var(--danger)", backgroundColor: "var(--hover-bg)" }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
            {col.data.length === 0 && (
              <div className="text-xs py-4 text-center" style={{ color: "var(--text-secondary)" }}>
                Sin eventos
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
