import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className = "", padding = true }: Props) {
  return (
    <div className={`card ${padding ? "p-3" : ""} ${className}`}>
      {children}
    </div>
  );
}
