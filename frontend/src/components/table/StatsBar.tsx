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

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      <span className="text-sm font-medium">Alumnos: <strong>{total}</strong></span>
      <span className="text-sm" style={{ color: "var(--success)" }}>TEA: <strong>{tea}</strong></span>
      <span className="text-sm" style={{ color: "var(--danger)" }}>TEP: <strong>{tep}</strong></span>
      <span className="text-sm" style={{ color: "var(--success)" }}>Aprobados: <strong>{aprobados}</strong></span>
      <span className="text-sm" style={{ color: "var(--danger)" }}>Desaprobados: <strong>{desaprobados}</strong></span>
      <span className="text-sm">Prom. Gral: <strong>{prom ?? "—"}</strong></span>
    </div>
  );
}
