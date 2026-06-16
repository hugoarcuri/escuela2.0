import { useState } from "react";

interface ConfirmProps {
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function useConfirm() {
  const [state, setState] = useState<{ message: string; onConfirm: () => void; onCancel: () => void } | null>(null);

  function confirm(message: string): Promise<boolean> {
    return new Promise(resolve => {
      setState({
        message,
        onConfirm: () => { setState(null); resolve(true); },
        onCancel: () => { setState(null); resolve(false); },
      });
    });
  }

  const modal = state ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-md p-6" style={{ backgroundColor: "var(--bg-card)" }}>
        <p className="text-sm mb-6" style={{ color: "var(--text-primary)" }}>{state.message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={state.onCancel} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}>Cancelar</button>
          <button onClick={state.onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors" style={{ backgroundColor: "var(--danger)" }}>Confirmar</button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, modal };
}

interface PromptProps {
  title: string;
  message?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function usePrompt() {
  const [state, setState] = useState<PromptProps | null>(null);

  function prompt(title: string, defaultValue = ""): Promise<string | null> {
    return new Promise(resolve => {
      setState({
        title,
        defaultValue,
        onConfirm: (value: string) => { setState(null); resolve(value); },
        onCancel: () => { setState(null); resolve(null); },
      });
    });
  }

  const modal = state ? (
    <PromptModal
      title={state.title}
      message={state.message}
      defaultValue={state.defaultValue}
      onConfirm={state.onConfirm}
      onCancel={state.onCancel}
    />
  ) : null;

  return { prompt, modal };
}

function PromptModal({ title, message, defaultValue, onConfirm, onCancel }: PromptProps) {
  const [value, setValue] = useState(defaultValue || "");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-md p-6" style={{ backgroundColor: "var(--bg-card)" }}>
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
        {message && <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>{message}</p>}
        <input type="text" value={value} onChange={e => setValue(e.target.value)} autoFocus
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] mb-4"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}>Cancelar</button>
          <button onClick={() => onConfirm(value)} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors" style={{ backgroundColor: "var(--accent)" }}>Aceptar</button>
        </div>
      </div>
    </div>
  );
}

interface AlertProps {
  message: string;
  onClose: () => void;
}

export function useAlert() {
  const [state, setState] = useState<AlertProps | null>(null);

  function alert(message: string): Promise<void> {
    return new Promise(resolve => {
      setState({ message, onClose: () => { setState(null); resolve(); } });
    });
  }

  const modal = state ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-md p-6" style={{ backgroundColor: "var(--bg-card)" }}>
        <p className="text-sm mb-6" style={{ color: "var(--text-primary)" }}>{state.message}</p>
        <div className="flex justify-end">
          <button onClick={state.onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors" style={{ backgroundColor: "var(--accent)" }}>Aceptar</button>
        </div>
      </div>
    </div>
  ) : null;

  return { alert, modal };
}
