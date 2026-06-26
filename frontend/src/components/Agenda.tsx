import { useState, useEffect, useRef } from "react";
import type { AgendaItem } from "../types";
import { getAgenda, saveAgendaItem, updateAgendaItem, deleteAgendaItem, toggleAgendaDone } from "../api";
import { VIEW_OPTIONS, type ViewType, TIPOS } from "./agenda/types";
import AgendaListView from "./agenda/views/AgendaListView";
import AgendaTimelineView from "./agenda/views/AgendaTimelineView";
import AgendaCardsView from "./agenda/views/AgendaCardsView";
import AgendaCompactView from "./agenda/views/AgendaCompactView";
import AgendaKanbanView from "./agenda/views/AgendaKanbanView";
import AgendaHoyView from "./agenda/views/AgendaHoyView";

interface Props {
  materiaId: number;
}

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
  onDelete: (id: number, titulo: string) => void;
}>> = {
  lista: AgendaListView,
  timeline: AgendaTimelineView,
  cards: AgendaCardsView,
  compact: AgendaCompactView,
  kanban: AgendaKanbanView,
  hoy: AgendaHoyView,
};

export default function Agenda({ materiaId }: Props) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [view, setView] = useState<ViewType>(getSavedView);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }
  const [editId, setEditId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<"evaluacion" | "entrega">("evaluacion");

  function load() {
    getAgenda(materiaId).then(setItems);
  }

  useEffect(() => { load(); }, [materiaId]);

  useEffect(() => {
    if (!formOpen) return;
    function handler(e: KeyboardEvent) { if (e.key === "Escape") setFormOpen(false); }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [formOpen]);

  function changeView(v: ViewType) {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  function openForm(item?: AgendaItem) {
    if (item) {
      setEditId(item.id);
      setTitulo(item.titulo);
      setDescripcion(item.descripcion);
      setFecha(item.fecha);
      setTipo(item.tipo);
    } else {
      setEditId(null);
      setTitulo("");
      setDescripcion("");
      setFecha(new Date().toISOString().slice(0, 10));
      setTipo("evaluacion");
    }
    setFormOpen(true);
  }

  async function handleSave() {
    if (!titulo.trim()) { showToast("✗ Escribí un título"); return; }
    try {
      if (editId) {
        await updateAgendaItem(editId, { titulo: titulo.trim(), descripcion, fecha, tipo });
      } else {
        await saveAgendaItem({ materiaId, titulo: titulo.trim(), descripcion, fecha, tipo });
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
    try {
      await deleteAgendaItem(id);
      load();
      showToast("✓ Eliminado");
    } catch {}
  }

  async function handleToggleDone(id: number, done: boolean) {
    try {
      await toggleAgendaDone(id, done);
      load();
    } catch {}
  }

  const ActiveView = VIEW_MAP[view];

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.includes("✗") ? "var(--danger)" : "var(--success)", color: "#fff" }}>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => openForm()} className="btn btn-primary btn-sm">+ Agregar</button>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{items.length} evento{items.length !== 1 ? "s" : ""}</span>
        </div>
        <select value={view} onChange={e => changeView(e.target.value as ViewType)}
          className="text-xs rounded-lg border px-2 py-1.5 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
          {VIEW_OPTIONS.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.icon} {opt.label}</option>
          ))}
        </select>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl shadow-xl w-full max-w-md p-6" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? "Editar" : "Nuevo"} evento</h2>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as "evaluacion" | "entrega")}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                  {TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="btn btn-primary flex-1">Guardar</button>
                <button onClick={() => setFormOpen(false)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-y-auto rounded-xl border" style={{ borderColor: "var(--border-color)", maxHeight: "calc(100vh - 320px)" }}>
        {items.length === 0 ? (
          <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
            <p className="text-lg mb-1">No hay eventos</p>
            <p className="text-sm">Agregá evaluaciones y entregas de trabajos prácticos</p>
          </div>
        ) : (
          <div className="p-3" style={{ animation: "fadeIn 0.2s ease" }}>
            <ActiveView
              items={items}
              onToggleDone={handleToggleDone}
              onEdit={openForm}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
