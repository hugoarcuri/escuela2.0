import type { AgendaViewProps } from "../types";
import { getTipoInfo, formatDate } from "../types";

export default function AgendaListView({ items, onToggleDone, onEdit, onDelete }: AgendaViewProps) {
  const sorted = [...items].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const grouped: Record<string, typeof items> = {};
  for (const item of sorted) {
    const m = item.fecha.slice(0, 7);
    if (!grouped[m]) grouped[m] = [];
    grouped[m].push(item);
  }
  const months = Object.keys(grouped).sort();

  if (!months.length) return null;

  return (
    <div>
      {months.map(month => {
        const [y, m] = month.split("-");
        const monthName = new Date(Number(y), Number(m) - 1).toLocaleString("es-AR", { month: "long", year: "numeric" });
        return (
          <div key={month}>
            <div className="text-xs font-semibold uppercase tracking-wider px-1 py-3"
              style={{ color: "var(--text-secondary)" }}>
              {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
            </div>
            {grouped[month].map(item => {
              const tipo = getTipoInfo(item.tipo);
              return (
                <div key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors cursor-pointer"
                  style={{ opacity: item.done ? 0.5 : 1 }}
                  onClick={() => onToggleDone(item.id, !item.done)}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--hover-bg)"}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <span style={{ color: tipo?.color, fontSize: "1.1rem" }}>
                    {item.tipo === "evaluacion" ? "📄" : "📦"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: (tipo?.color || "#888") + "20", color: tipo?.color }}>
                        {tipo?.label || item.tipo}
                      </span>
                    </div>
                    <div className="text-sm font-medium mt-0.5"
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
                    <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(item.fecha)}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onEdit(item)}
                      className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
                      style={{ color: "var(--text-secondary)" }} title="Editar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button onClick={() => onDelete(item.id, item.titulo)}
                      className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
                      style={{ color: "var(--danger)" }} title="Eliminar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
