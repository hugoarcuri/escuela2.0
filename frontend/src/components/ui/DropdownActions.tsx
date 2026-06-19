import { useState, useRef, useEffect } from "react";

interface Action {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
}

interface Props {
  label: string;
  actions: Action[];
}

export default function DropdownActions({ label, actions }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn btn-ghost btn-sm">
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-50 min-w-[180px] py-1 rounded-xl border" style={{
          backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", boxShadow: "var(--shadow-md)"
        }}>
          {actions.map((a, i) => (
            <button key={i} onClick={() => { a.onClick(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors"
              style={{ color: a.variant === "danger" ? "var(--danger)" : "var(--text-primary)" }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--hover-bg)"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
