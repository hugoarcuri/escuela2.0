import { useState, useEffect, useRef, useMemo } from "react";
import type { AgendaItem } from "../types";
import { getAgenda, saveAgendaItem, updateAgendaItem, deleteAgendaItem, toggleAgendaDone } from "../api";
import {
  VIEW_OPTIONS, type ViewType, DISPLAY_TIPOS, PRIORIDADES,
  decodeMeta, encodeMeta, formatDate, formatWeekday
} from "./agenda/types";
import AgendaListView from "./agenda/views/AgendaListView";
import AgendaCalendarView from "./agenda/views/AgendaCalendarView";

interface Props { materiaId: number; }

const STORAGE_KEY = "agenda_view";

function getSavedView(): ViewType {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && VIEW_OPTIONS.some(v => v.key === saved)) return saved as ViewType;
  return "lista";
}

const VIEW_MAP: Record<ViewType, React.FC<{
  items: AgendaItem[];
  onToggleDone: (id: number, done: boolean) => void;
  onEdit: (item: AgendaItem) => void;
  onDuplicate: (item: AgendaItem) => void;
  onDelete: (id: number, titulo: string) => void;
}>> = {
  lista: AgendaListView,
  calendar: AgendaCalendarView,
};

export default function Agenda({ materiaId }: Props) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [view, setView] = useState<ViewType>(getSavedView);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState("evaluacion");
  const [prioridad, setPrioridad] = useState("media");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroSearch, setFiltroSearch] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }

  function load() { getAgenda(materiaId).then(setItems); }
  useEffect(() => { load(); }, [materiaId]);

  useEffect(() => {
    if (!formOpen) return;
    function handler(e: KeyboardEvent) { if (e.key === "Escape") setFormOpen(false); }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [formOpen]);

  function changeView(v: ViewType) { setView(v); localStorage.setItem(STORAGE_KEY, v); }

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filtroTipo && item.tipo !== filtroTipo) return false;
      if (filtroEstado === "pendiente" && item.done) return false;
      if (filtroEstado === "completado" && !item.done) return false;
      if (filtroMes && item.fecha.slice(0, 7) !== filtroMes) return false;
      if (filtroSearch) {
        const q = filtroSearch.toLowerCase();
        if (!item.titulo.toLowerCase().includes(q) && !item.descripcion.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, filtroTipo, filtroEstado, filtroMes, filtroSearch]);

  const upcomingItems = useMemo(() => {
    const end = new Date(today); end.setDate(end.getDate() + 7);
    const endStr = end.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);
    return items
      .filter(item => !item.done && item.fecha >= todayStr && item.fecha <= endStr)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [items, today]);

  const monthSet = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) set.add(item.fecha.slice(0, 7));
    return [...set].sort();
  }, [items]);

  const stats = useMemo(() => {
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const monthItems = items.filter(i => i.fecha.slice(0, 7) === currentMonth);
    const pending = monthItems.filter(i => !i.done).length;
    const completed = monthItems.filter(i => i.done).length;
    const overdue = items.filter(i => !i.done && i.fecha < today.toISOString().slice(0, 10)).length;
    return { total: monthItems.length, pending, completed, overdue };
  }, [items, today]);

  function openForm(item?: AgendaItem) {
    if (item) {
      const { description, priority } = decodeMeta(item);
      setEditId(item.id);
      setTitulo(item.titulo);
      setDescripcion(description);
      setFecha(item.fecha);
      setTipo(item.tipo);
      setPrioridad(priority);
    } else {
      setEditId(null);
      setTitulo("");
      setDescripcion("");
      setFecha(new Date().toISOString().slice(0, 10));
      setTipo("evaluacion");
      setPrioridad("media");
    }
    setFormOpen(true);
  }

  async function handleSave() {
    if (!titulo.trim()) { showToast("✗ Escribí un título"); return; }
    const dbTipo = DISPLAY_TIPOS.find(t => t.key === tipo)?.dbValue || "evaluacion";
    const encodedDesc = encodeMeta(descripcion, prioridad, tipo);
    try {
      if (editId) {
        await updateAgendaItem(editId, { titulo: titulo.trim(), descripcion: encodedDesc, fecha, tipo: dbTipo });
      } else {
        await saveAgendaItem({ materiaId, titulo: titulo.trim(), descripcion: encodedDesc, fecha, tipo: dbTipo });
      }
      setFormOpen(false);
      load();
      showToast("✓ Guardado");
    } catch (e: any) {
      showToast("✗ Error: " + (e.message || "desconocido"));
    }
  }

  async function handleDelete(id: number, titulo: string) {
    if (!confirm(`¿Eliminar "${titulo}"?`)) return;
    try { await deleteAgendaItem(id); load(); showToast("✓ Eliminado"); } catch {}
  }

  async function handleToggleDone(id: number, done: boolean) {
    try { await toggleAgendaDone(id, done); load(); } catch {}
  }

  async function handleDuplicate(item: AgendaItem) {
    const encodedDesc = encodeMeta(item.descripcion || "", "media", item.tipo);
    try {
      await saveAgendaItem({
        materiaId, titulo: item.titulo, descripcion: encodedDesc, fecha: item.fecha, tipo: item.tipo,
      });
      load();
      showToast("✓ Duplicado");
    } catch { showToast("✗ Error al duplicar"); }
  }

  const ActiveView = VIEW_MAP[view];

  return (
    <div className="flex flex-col gap-2" style={{ height: "100%" }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.includes("✗") ? "var(--danger)" : "var(--success)", color: "#fff" }}>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => openForm()} className="btn btn-primary btn-sm">+ Agregar</button>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{filteredItems.length} de {items.length} evento{items.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <select value={view} onChange={e => changeView(e.target.value as ViewType)}
            className="text-xs rounded-lg border px-2 py-1.5 outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
            {VIEW_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.icon} {opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {upcomingItems.length > 0 && (
        <div className="rounded-lg border p-2.5 shrink-0" style={{ borderColor: "var(--border-color)", backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--bg-card))" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>⏰ Próximos 7 días</span>
            <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{upcomingItems.length} evento{upcomingItems.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {upcomingItems.slice(0, 5).map(item => {
              const tipoInfo = DISPLAY_TIPOS.find(t => t.key === item.tipo);
              return (
                <div key={item.id} className="flex items-center gap-1.5 text-xs cursor-pointer" onClick={() => openForm(item)}>
                  <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: tipoInfo?.color || "#888" }} />
                  <span style={{ color: "var(--text-primary)" }}><b>{formatWeekday(item.fecha)}</b> {formatDate(item.fecha)}</span>
                  <span style={{ color: tipoInfo?.color }}>{tipoInfo?.label}</span>
                  <span style={{ color: "var(--text-primary)" }}>{item.titulo}</span>
                </div>
              );
            })}
            {upcomingItems.length > 5 && (
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>+{upcomingItems.length - 5} más</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="text-xs rounded-lg border px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
          <option value="">Todos</option>
          {DISPLAY_TIPOS.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="text-xs rounded-lg border px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
          <option value="">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="completado">Completados</option>
        </select>
        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
          className="text-xs rounded-lg border px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
          <option value="">Todos los meses</option>
          {monthSet.map(m => {
            const [y, monthNum] = m.split("-");
            const name = new Date(Number(y), Number(monthNum) - 1).toLocaleString("es-AR", { month: "long", year: "numeric" });
            return <option key={m} value={m}>{name}</option>;
          })}
        </select>
        <input value={filtroSearch} onChange={e => setFiltroSearch(e.target.value)}
          placeholder="🔍 Buscar..."
          className="text-xs rounded-lg border px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--accent)] flex-1 min-w-[120px]"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
      </div>

      <div className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg shrink-0 text-xs"
        style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
        <span>📅 <b style={{ color: "var(--text-primary)" }}>{stats.total}</b> este mes</span>
        <span>⏳ <b style={{ color: "#f59e0b" }}>{stats.pending}</b> pend.</span>
        <span>✅ <b style={{ color: "var(--success)" }}>{stats.completed}</b> compl.</span>
        {stats.overdue > 0 && <span>⚠️ <b style={{ color: "var(--danger)" }}>{stats.overdue}</b> venc.</span>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl shadow-xl w-full max-w-md p-5" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{editId ? "Editar" : "Nuevo"} evento</h2>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Título</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tipo</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                    {DISPLAY_TIPOS.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Prioridad</label>
                  <select value={prioridad} onChange={e => setPrioridad(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                    {PRIORIDADES.map(p => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Fecha</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="btn btn-primary flex-1">Guardar</button>
                <button onClick={() => setFormOpen(false)} className="btn btn-secondary text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", borderRadius: 8, border: "1px solid var(--border-color)" }}>
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ padding: "3rem 1rem", color: "var(--text-secondary)" }}>
            <span style={{ fontSize: "2rem", marginBottom: 8 }}>{items.length === 0 ? "📋" : "🔍"}</span>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {items.length === 0 ? "No hay eventos" : "Sin resultados"}
            </p>
            <p className="text-xs mt-1">
              {items.length === 0
                ? "Agregá evaluaciones, entregas y actividades"
                : "Probá cambiar los filtros"}
            </p>
          </div>
        ) : (
          <div style={{ animation: "fadeIn 0.2s ease", padding: 8 }}>
            <ActiveView
              items={filteredItems}
              onToggleDone={handleToggleDone}
              onEdit={openForm}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
