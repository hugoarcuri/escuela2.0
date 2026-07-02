import type { AgendaItem } from "../../types";

export interface AgendaViewProps {
  items: AgendaItem[];
  onToggleDone: (id: number, done: boolean) => void;
  onEdit: (item: AgendaItem) => void;
  onDuplicate: (item: AgendaItem) => void;
  onDelete: (id: number, titulo: string) => void;
}

export const VIEW_OPTIONS = [
  { key: "lista", label: "Lista", icon: "☰" },
  { key: "calendar", label: "Calendario", icon: "📅" },
] as const;

export type ViewType = (typeof VIEW_OPTIONS)[number]["key"];

export const PRIORIDADES = [
  { key: "baja", label: "Baja", color: "#6b7280" },
  { key: "media", label: "Media", color: "#f59e0b" },
  { key: "alta", label: "Alta", color: "#ef4444" },
];

export const DISPLAY_TIPOS = [
  { key: "evaluacion", label: "Evaluación", color: "#3b82f6", dbValue: "evaluacion" as const },
  { key: "entrega", label: "Entrega TP", color: "#f59e0b", dbValue: "entrega" as const },
  { key: "actividad", label: "Actividad", color: "#22c55e", dbValue: "evaluacion" as const },
  { key: "examen", label: "Examen", color: "#ef4444", dbValue: "evaluacion" as const },
  { key: "reunion", label: "Reunión", color: "#a855f7", dbValue: "entrega" as const },
  { key: "recordatorio", label: "Recordatorio", color: "#6b7280", dbValue: "entrega" as const },
];

export const TIPOS = DISPLAY_TIPOS;

export function encodeMeta(desc: string, priority?: string, displayTipo?: string): string {
  let meta = "";
  if (priority && priority !== "media") meta += `[P:${priority}]`;
  if (displayTipo) meta += `[T:${displayTipo}]`;
  return meta + desc;
}

export function decodeMeta(item: AgendaItem): { description: string; priority: string; displayTipo: string } {
  let raw = item.descripcion || "";
  let priority = "media";
  let displayTipo = "";
  const pMatch = raw.match(/^\[P:(alta|media|baja)\]/);
  if (pMatch) { priority = pMatch[1]; raw = raw.slice(pMatch[0].length); }
  const tMatch = raw.match(/^\[T:(\w+)\]/);
  if (tMatch) { displayTipo = tMatch[1]; raw = raw.slice(tMatch[0].length); }
  const tipoInfo = DISPLAY_TIPOS.find(t => t.key === displayTipo);
  return { description: raw, priority, displayTipo: tipoInfo?.label || getTipoLabel(item.tipo) };
}

export function getTipoInfo(tipo: string) {
  return DISPLAY_TIPOS.find(t => t.key === tipo);
}

export function getTipoLabel(tipo: string): string {
  return DISPLAY_TIPOS.find(t => t.key === tipo)?.label || tipo;
}

export function formatDate(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  const day = d.toLocaleString("es-AR", { day: "numeric" });
  const month = d.toLocaleString("es-AR", { month: "long" });
  return `${day} ${month}`;
}

export function formatDayMonth(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  const day = d.toLocaleString("es-AR", { day: "numeric" });
  const month = d.toLocaleString("es-AR", { month: "short" }).replace(".", "");
  return `${day} ${month}`;
}

export function formatWeekday(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  return d.toLocaleString("es-AR", { weekday: "short" });
}
