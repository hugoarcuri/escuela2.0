import { useState } from "react";
import type { AgendaViewProps } from "../types";
import { DISPLAY_TIPOS, PRIORIDADES, decodeMeta, formatDate, formatWeekday } from "../types";

export default function AgendaListView({ items, onToggleDone, onEdit, onDuplicate, onDelete }: AgendaViewProps) {
  const [hoverId, setHoverId] = useState<number | null>(null);
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
            <div className="text-xs font-semibold uppercase tracking-wider px-1 py-2"
              style={{ color: "var(--text-secondary)" }}>
              {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
            </div>
            {grouped[month].map(item => {
              const tipoInfo = DISPLAY_TIPOS.find(t => t.key === item.tipo);
              const { description, priority } = decodeMeta(item);
              const prioInfo = PRIORIDADES.find(p => p.key === priority);
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const eventDate = new Date(item.fecha + "T12:00:00");
              const isOverdue = !item.done && eventDate < today;
              return (
                <div key={item.id}
                  className="flex items-stretch gap-0 mb-1.5 rounded-lg overflow-hidden transition-all"
                  style={{ opacity: item.done ? 0.5 : 1 }}
                  onMouseEnter={() => setHoverId(item.id)}
                  onMouseLeave={() => setHoverId(null)}>
                  <div style={{ width: 4, backgroundColor: tipoInfo?.color || "#888", minHeight: "100%" }} />
                  <div
                    className="flex-1 flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    style={{ backgroundColor: "var(--bg-card)" }}
                    onClick={() => onToggleDone(item.id, !item.done)}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--hover-bg)"}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = "var(--bg-card)"}>
                    <span style={{ color: tipoInfo?.color, fontSize: "1.05rem" }}>
                      {item.tipo === "evaluacion" ? "📄" : "📦"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: (tipoInfo?.color || "#888") + "20", color: tipoInfo?.color }}>
                          {tipoInfo?.label || item.tipo}
                        </span>
                        {priority !== "media" && prioInfo && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: prioInfo.color + "20", color: prioInfo.color }}>
                            {prioInfo.label}
                          </span>
                        )}
                        {item.done && (
                          <span className="text-[10px]" style={{ color: "var(--success)" }}>✓ Hecho</span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px]" style={{ color: "var(--danger)" }}>Vencido</span>
                        )}
                      </div>
                      <div className="text-sm font-medium mt-0.5"
                        style={{
                          color: "var(--text-primary)",
                          textDecoration: item.done ? "line-through" : undefined,
                        }}>{item.titulo}</div>
                      {description && (
                        <div className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>
                          {description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          {formatWeekday(item.fecha)} {formatDate(item.fecha)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}
                      style={{ opacity: hoverId === item.id ? 1 : 0, transition: "opacity 0.15s" }}>
                      <button onClick={() => onToggleDone(item.id, !item.done)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
                        style={{ color: item.done ? "var(--text-secondary)" : "var(--success)" }} title={item.done ? "Desmarcar" : "Marcar hecho"}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button onClick={() => onEdit(item)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
                        style={{ color: "var(--accent)" }} title="Editar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => {
                        const d = new Date(item.fecha + "T12:00:00");
                        d.setDate(d.getDate() + 1);
                        onDuplicate({ ...item, fecha: d.toISOString().slice(0, 10), titulo: item.titulo + " (copia)" });
                      }}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
                        style={{ color: "var(--text-secondary)" }} title="Duplicar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                      <button onClick={() => onDelete(item.id, item.titulo)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors"
                        style={{ color: "var(--danger)" }} title="Eliminar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
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
