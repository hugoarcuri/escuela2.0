import { Moon, Sun } from "./Icons";

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: Props) {
  return (
    <header
      className="border-b px-4 py-3 flex items-center justify-between"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}
    >
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Gestión de Calificaciones
      </h1>
      <button
        onClick={onToggleTheme}
        className="p-2 rounded-lg transition-colors"
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
