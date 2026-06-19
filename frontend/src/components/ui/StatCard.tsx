interface Props {
  value: string | number;
  label: string;
  color?: string;
}

export default function StatCard({ value, label, color }: Props) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={color ? { color } : undefined}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
