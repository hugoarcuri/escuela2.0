import type { Alumno } from "../../types";

interface Props {
  alumnos: Alumno[];
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl border px-4 py-3" style={{
      backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)",
    }}>
      <div className="text-2xl font-bold leading-none" style={{ color: accent ?? "var(--text-primary)" }}>
        {value}
      </div>
      <div className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
    </div>
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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <StatCard label="Alumnos" value={total} />
      <StatCard label="Aprobados" value={aprobados} accent="var(--success)" />
      <StatCard label="Desaprobados" value={desaprobados} accent="var(--danger)" />
      <StatCard label="TEA" value={tea} accent="var(--success)" />
      <StatCard label="TEP" value={tep} accent="var(--danger)" />
      <StatCard label="Promedio" value={prom ?? "—"} />
    </div>
  );
}
