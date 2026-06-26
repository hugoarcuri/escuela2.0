import type { AgendaItem } from "../../types";

export interface AgendaViewProps {
  items: AgendaItem[];
  onToggleDone: (id: number, done: boolean) => void;
  onEdit: (item: AgendaItem) => void;
  onDelete: (id: number, titulo: string) => void;
}

export const VIEW_OPTIONS = [
  { key: "lista", label: "Lista", icon: "☰" },
  { key: "timeline", label: "Timeline", icon: "│" },
  { key: "cards", label: "Tarjetas", icon: "⊞" },
  { key: "compact", label: "Compacta", icon: "≡" },
  { key: "hoy", label: "Hoy", icon: "◎" },
  { key: "kanban", label: "Kanban", icon: "▦" },
] as const;

export type ViewType = (typeof VIEW_OPTIONS)[number]["key"];

export const TIPOS = [
  { key: "evaluacion", label: "Evaluación", color: "#8b5cf6" },
  { key: "entrega", label: "Entrega TP", color: "#f59e0b" },
];

export function getTipoInfo(tipo: string) {
  return TIPOS.find(t => t.key === tipo);
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
