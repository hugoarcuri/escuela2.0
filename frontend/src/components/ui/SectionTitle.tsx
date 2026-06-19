import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function SectionTitle({ children }: Props) {
  return (
    <h3 className="font-semibold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
      {children}
    </h3>
  );
}
