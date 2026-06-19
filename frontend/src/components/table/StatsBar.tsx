import type { Alumno } from "../../types";
import StatCard from "../ui/StatCard";

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
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
      <StatCard value={total} label="Alumnos" />
      <StatCard value={tea} label="TEA" color="var(--success)" />
      <StatCard value={tep} label="TEP" color="var(--danger)" />
      <StatCard value={aprobados} label="Aprobados" color="var(--success)" />
      <StatCard value={desaprobados} label="Desaprobados" color="var(--danger)" />
      <StatCard value={prom ?? "—"} label="Promedio General" />
    </div>
  );
}
