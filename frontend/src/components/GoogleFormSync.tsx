import { useState, useEffect, useRef } from "react";
import { generateFormLink, pollFormCount, getFormLink } from "../api";

interface Props {
  escuelaId: number;
  cursoId: number;
  materiaId: number;
  anioLectivo: number;
  onSync: () => void;
}

export default function GoogleFormSync({ escuelaId, cursoId, materiaId, anioLectivo, onSync }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [formUrl, setFormUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [lastCount, setLastCount] = useState<number | null>(null);
  const [newStudentMsg, setNewStudentMsg] = useState(false);
  const prevEscuelaRef = useRef(escuelaId);
  const prevCursoRef = useRef(cursoId);
  const prevMateriaRef = useRef(materiaId);

  useEffect(() => {
    if (escuelaId !== prevEscuelaRef.current || cursoId !== prevCursoRef.current || materiaId !== prevMateriaRef.current) {
      setToken(null); setFormUrl(null); setStudentCount(0); setLastCount(null); setNewStudentMsg(false);
      prevEscuelaRef.current = escuelaId; prevCursoRef.current = cursoId; prevMateriaRef.current = materiaId;
    }
  }, [escuelaId, cursoId, materiaId]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const link = await getFormLink(token!);
        if (!link) return;
        const count = await pollFormCount(link);
        if (lastCount !== null && count > lastCount) { setNewStudentMsg(true); onSync(); setTimeout(() => setNewStudentMsg(false), 4000); }
        setStudentCount(count); setLastCount(count);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [token, lastCount, onSync]);

  async function handleGenerate() {
    if (!escuelaId || !cursoId || !materiaId) return;
    setGenerating(true);
    try {
      const link = await generateFormLink(escuelaId, cursoId, materiaId, anioLectivo);
      setToken(link.token);
      setFormUrl(`${window.location.origin}/escuela2.0/#/form/${link.token}`);
      const count = await pollFormCount(link);
      setStudentCount(count); setLastCount(count);
    } catch (e: any) {
      console.error("Error al generar formulario", e);
    } finally { setGenerating(false); }
  }

  async function handleCopy() {
    if (!formUrl) return;
    try { await navigator.clipboard.writeText(formUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch {
      const ta = document.createElement("textarea"); ta.value = formUrl; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-sm font-medium">Formulario de Inscripción</span>
        {!token && (
          <button onClick={handleGenerate} disabled={generating || !escuelaId || !cursoId || !materiaId}
            className="btn-primary text-xs px-3 py-1.5">
            {generating ? "Generando..." : "Generar Formulario de Inscripción"}
          </button>
        )}
      </div>
      {formUrl && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input readOnly value={formUrl}
              className="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none"
              style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}
              onClick={e => (e.target as HTMLInputElement).select()} />
            <button onClick={handleCopy} className="btn-secondary text-xs px-3 py-1.5 whitespace-nowrap">{copied ? "¡Copiado!" : "Copiar enlace"}</button>
            <button onClick={() => { setToken(null); setFormUrl(null); setNewStudentMsg(false); }}
              className="text-xs px-2 py-1.5 rounded-lg border hover:bg-[var(--hover-bg)] transition-colors"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border-color)" }}>✕</button>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>Alumnos registrados: <strong>{studentCount}</strong></span>
            <span>•</span>
            <span>Sincronización automática cada 30s</span>
          </div>
          {newStudentMsg && (
            <div className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1.5 border border-green-200 dark:border-green-800">
              Alumno agregado correctamente
            </div>
          )}
        </div>
      )}
      {!token && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Generá un enlace para que los alumnos se inscriban solos con solo Apellido y Nombre.
        </p>
      )}
    </div>
  );
}
