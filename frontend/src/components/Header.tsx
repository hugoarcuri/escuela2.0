import { Moon, Sun } from "./Icons";
import type { SchoolTheme } from "../data/schoolThemes";

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  schoolInfo?: { logoUrl?: string; schoolTheme?: SchoolTheme };
}

export default function Header({ theme, onToggleTheme, schoolInfo }: Props) {
  return (
    <header
      className="border-b px-4 py-3 flex items-center justify-between shrink-0"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {schoolInfo?.logoUrl && (
          <img
            src={schoolInfo.logoUrl}
            alt={schoolInfo.schoolTheme?.name || ""}
            className="w-9 h-9 rounded-lg object-cover shrink-0"
            style={{ border: "1px solid var(--border-color)" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            Gestión de Calificaciones
          </h1>
          {schoolInfo?.schoolTheme && (
            <p className="text-xs font-medium truncate" style={{ color: "var(--accent)" }}>
              {schoolInfo.schoolTheme.name}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onToggleTheme}
        className="p-2 md:p-2 rounded-lg transition-colors touch-target"
        style={{ color: "var(--text-secondary)" }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--hover-bg)"}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        title={theme === "light" ? "Modo oscuro" : "Modo claro"}
      >
        {theme === "light" ? <Moon /> : <Sun />}
      </button>
    </header>
  );
}
