import type { Alumno } from "../../types";

interface Props {
  alumnos: Alumno[];
}

function Stat({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-sm font-semibold leading-none" style={color ? { color } : undefined}>{value}</span>
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
    </span>
  );
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

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-0.5">
      <Stat value={total} label="Alumnos" />
      <span className="text-xs" style={{ color: "var(--border-color)" }}>|</span>
      <Stat value={tea} label="TEA" color="var(--success)" />
      <span className="text-xs" style={{ color: "var(--border-color)" }}>|</span>
      <Stat value={tep} label="TEP" color="var(--danger)" />
      <span className="text-xs" style={{ color: "var(--border-color)" }}>|</span>
      <Stat value={aprobados} label="Aprob" color="var(--success)" />
      <span className="text-xs" style={{ color: "var(--border-color)" }}>|</span>
      <Stat value={desaprobados} label="Desaprob" color="var(--danger)" />
      <span className="text-xs" style={{ color: "var(--border-color)" }}>|</span>
      <Stat value={prom ?? "—"} label="Promedio" />
    </div>
  );
}
