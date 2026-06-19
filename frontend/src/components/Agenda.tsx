import { useState, useEffect, useRef } from "react";
import type { AgendaItem } from "../types";
import { getAgenda, saveAgendaItem, updateAgendaItem, deleteAgendaItem } from "../api";

interface Props {
  materiaId: number;
}

const TIPOS = [
  { key: "evaluacion", label: "Evaluación", color: "#8b5cf6" },
  { key: "entrega", label: "Entrega TP", color: "#f59e0b" },
];

export default function Agenda({ materiaId }: Props) {
  const [items, setItems] = useState<AgendaItem[]>([]);
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

  async function handleDelete(id: number) {
    try {
      await deleteAgendaItem(id);
      load();
    } catch {}
  }

  const grouped: Record<string, AgendaItem[]> = {};
  for (const item of items) {
    const m = item.fecha.slice(0, 7);
    if (!grouped[m]) grouped[m] = [];
    grouped[m].push(item);
  }

  const months = Object.keys(grouped).sort();

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.includes("✗") ? "var(--danger)" : "var(--success)", color: "#fff" }}>
          {toast}
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => openForm()} className="btn-primary text-sm">+ Agregar</button>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{items.length} evento{items.length !== 1 ? "s" : ""}</span>
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
                <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
                <button onClick={() => setFormOpen(false)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-y-auto rounded-xl border" style={{ borderColor: "var(--border-color)", maxHeight: "calc(100vh - 320px)" }}>
        {months.length === 0 ? (
          <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
            <p className="text-lg mb-1">No hay eventos</p>
            <p className="text-sm">Agregá evaluaciones y entregas de trabajos prácticos</p>
          </div>
        ) : months.map(month => {
          const [y, m] = month.split("-");
          const monthName = new Date(Number(y), Number(m) - 1).toLocaleString("es-AR", { month: "long", year: "numeric" });
          return (
            <div key={month}>
              <div className="px-4 py-2 text-sm font-semibold sticky top-0" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)" }}>
                {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
              </div>
              {grouped[month].map(item => {
                const tipoInfo = TIPOS.find(t => t.key === item.tipo);
                const dia = item.fecha.slice(8, 10);
                const diasSem = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                const diaSem = diasSem[new Date(item.fecha + "T12:00:00").getDay()];
                return (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3 border-b transition-colors"
                    style={{ borderColor: "var(--border-color)" }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--hover-bg)"}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <div className="flex flex-col items-center w-12 shrink-0">
                      <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{dia}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{diaSem}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: (tipoInfo?.color || "#888") + "20", color: tipoInfo?.color }}>
                          {tipoInfo?.label || item.tipo}
                        </span>
                        {item.hora && <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.hora}</span>}
                      </div>
                      <div className="text-sm font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>{item.titulo}</div>
                      {item.descripcion && <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{item.descripcion}</div>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openForm(item)} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--danger)" }} title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}