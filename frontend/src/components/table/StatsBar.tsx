import type { Alumno } from "../../types";

interface Props {
  alumnos: Alumno[];
}

export default function StatsBar({ alumnos }: Props) {
  const total = alumnos.length;
  const tea = alumnos.filter(a => a.informe1 === "TEA" || a.informe2 === "TEA").length;
  const tep = alumnos.filter(a => a.informe1 === "TEP" || a.informe2 === "TEP").length;
  const aprobados = alumnos.filter(a => a.situacionFinal === "Aprobado").length;
  const desaprobados = alumnos.filter(a => a.situacionFinal === "Desaprobado").length;
  const notas = alumnos.map(a => a.notaFinal).filter((v): v is number => v !== null);
  const prom = notas.length ? Math.round((notas.reduce((s, v) => s + v, 0) / notas.length) * 100) / 100 : null;

  if (total === 0) return null;

  const items = [
    { label: "Alumnos", value: total, icon: "👥", color: undefined },
    { label: "Aprobados", value: aprobados, icon: "🔵", color: "#3b82f6" },
    { label: "Desaprobados", value: desaprobados, icon: "🟢", color: "var(--success)" },
    { label: "Promedio", value: prom ?? "—", icon: "📈", color: undefined },
    { label: "TEA", value: tea, icon: "🔵", color: "#3b82f6" },
    { label: "TEP", value: tep, icon: "🟠", color: "#f59e0b" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map(item => (
        <div key={item.label}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
          style={{ backgroundColor: "var(--bg-secondary)" }}>
          <span className="text-xs leading-none">{item.icon}</span>
          <span className="font-semibold leading-none" style={item.color ? { color: item.color } : { color: "var(--text-primary)" }}>{item.value}</span>
          <span className="leading-none" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
