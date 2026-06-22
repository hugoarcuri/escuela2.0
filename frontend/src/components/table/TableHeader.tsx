const HEADERS = ["", "Apellido y Nombre", "N 1", "N 2", "N 3", "Inf 1", "1°C", "N 4", "N 5", "N 6", "Inf 2", "2°C", "N Final", "Sit.", "Obs."];

interface Props {
  allSelected: boolean;
  onToggleAll: () => void;
  hasRows: boolean;
}

export default function TableHeader({ allSelected, onToggleAll, hasRows }: Props) {
  return (
    <thead>
      <tr>
        {HEADERS.map(h => (
          <th key={h}
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
              color: "var(--text-secondary)",
              position: "sticky", top: 0,
              left: h === "Apellido y Nombre" ? 0 : undefined,
              zIndex: h === "Apellido y Nombre" ? 20 : 10,
              whiteSpace: h === "Apellido y Nombre" ? "nowrap" : undefined,
              minWidth: h === "Apellido y Nombre" ? 220 : h === "Obs." ? 120 : 50,
            }}>
            {h === "" ? <input type="checkbox" onChange={onToggleAll} checked={allSelected && hasRows} /> : h}
          </th>
        ))}
      </tr>
    </thead>
  );
}
