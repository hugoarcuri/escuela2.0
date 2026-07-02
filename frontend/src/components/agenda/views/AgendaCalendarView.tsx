import { useState, useMemo } from "react";
import type { AgendaViewProps } from "../types";
import { DISPLAY_TIPOS, decodeMeta } from "../types";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function AgendaCalendarView({ items, onToggleDone, onEdit, onDelete }: AgendaViewProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [baseDate, setBaseDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthName = baseDate.toLocaleString("es-AR", { month: "long", year: "numeric" });

  const itemsByDate = useMemo(() => {
    const map: Record<string, typeof items> = {};
    for (const item of items) {
      if (!map[item.fecha]) map[item.fecha] = [];
      map[item.fecha].push(item);
    }
    return map;
  }, [items]);

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push(dateStr);
  }

  const selectedItems = selectedDate ? itemsByDate[selectedDate] || [] : [];

  function prevMonth() {
    setBaseDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setBaseDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth}
          style={{ padding: "2px 8px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", cursor: "pointer" }}>◀</button>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</span>
        <button onClick={nextMonth}
          style={{ padding: "2px 8px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", cursor: "pointer" }}>▶</button>
      </div>

      <div className="grid grid-cols-7 gap-px mb-3" style={{ backgroundColor: "var(--border-color)", borderRadius: 8, overflow: "hidden" }}>
        {DAYS.map(d => (
          <div key={d} className="px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>{d}</div>
        ))}
        {days.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} style={{ backgroundColor: "var(--bg-card)" }} />;
          const dayItems = itemsByDate[dateStr] || [];
          const d = new Date(dateStr + "T12:00:00");
          const isToday = d.getTime() === today.getTime();
          const isSelected = dateStr === selectedDate;
          const isPast = d < today;
          return (
            <div key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              style={{
                backgroundColor: isSelected ? "var(--hover-bg)" : isToday ? "color-mix(in srgb, var(--accent) 10%, var(--bg-card))" : "var(--bg-card)",
                cursor: "pointer", minHeight: 52, padding: 2,
                border: isToday ? "1px solid var(--accent)" : "none",
              }}>
              <div className="text-[11px] font-medium mb-0.5" style={{
                color: isPast && !isToday ? "var(--text-secondary)" : "var(--text-primary)",
                opacity: isPast && !isToday ? 0.5 : 1,
              }}>{d.getDate()}</div>
              {dayItems.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {dayItems.slice(0, 3).map(item => {
                    const tipoInfo = DISPLAY_TIPOS.find(t => t.key === item.tipo);
                    return (
                      <div key={item.id} className="flex items-center gap-0.5" style={{ opacity: item.done ? 0.5 : 1 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: tipoInfo?.color || "#888", flexShrink: 0 }} />
                        <span className="text-[9px] truncate" style={{ color: "var(--text-primary)" }}>{item.titulo}</span>
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <span className="text-[9px]" style={{ color: "var(--text-secondary)" }}>+{dayItems.length - 3} más</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-card)" }}>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          {selectedItems.length === 0 ? (
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Sin eventos</div>
          ) : (
            <div className="space-y-1.5">
              {selectedItems.map(item => {
                const tipoInfo = DISPLAY_TIPOS.find(t => t.key === item.tipo);
                const { description } = decodeMeta(item);
                return (
                  <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded"
                    style={{ backgroundColor: "var(--bg-secondary)", opacity: item.done ? 0.5 : 1 }}
                    onClick={() => onToggleDone(item.id, !item.done)}>
                    <div style={{ width: 3, height: 24, borderRadius: 2, backgroundColor: tipoInfo?.color || "#888", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: "var(--text-primary)", textDecoration: item.done ? "line-through" : undefined }}>{item.titulo}</div>
                      {description && <div className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>{description}</div>}
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onEdit(item)} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--accent)" }} title="Editar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => onDelete(item.id, item.titulo)} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--danger)" }} title="Eliminar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
