interface Props {
  message?: string;
  icon?: string;
}

export default function EmptyState({ message = "Sin datos", icon = "📭" }: Props) {
  return (
    <div className="empty-state">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
