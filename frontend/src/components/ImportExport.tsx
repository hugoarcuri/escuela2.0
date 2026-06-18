import { useState } from "react";
import { exportBackup, importBackup, importExcel, importList } from "../api";
import { Download, Upload } from "./Icons";
import { useAlert } from "./Modals";

interface Props {
  escuelaId: number;
  cursoId: number;
  materiaId: number;
  anioLectivo: number;
  onImport: () => void;
}

export default function ImportExport({ escuelaId, cursoId, materiaId, anioLectivo, onImport }: Props) {
  const [showModal, setShowModal] = useState<"excel" | "paste" | null>(null);
  const [importing, setImporting] = useState(false);
  const [list, setList] = useState("");
  const { alert, modal: alertModal } = useAlert();

  async function handleExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const r = await importExcel(file, escuelaId, cursoId, materiaId, anioLectivo);
      let msg = `Importados ${r.imported} alumnos`;
      if (r.errors.length) msg += `\nErrores (${r.errors.length}):\n${r.errors.slice(0, 10).join("\n")}${r.errors.length > 10 ? "\n..." : ""}`;
      await alert(msg);
      onImport();
    } catch { await alert("Error al importar"); }
    setImporting(false);
    setShowModal(null);
  }

  async function handlePaste() {
    if (!list.trim()) { await alert("Pegá una lista primero"); return; }
    setImporting(true);
    try {
      const r = await importList(list, escuelaId, cursoId, materiaId, anioLectivo);
      let msg = `Importados ${r.imported} alumnos`;
      if (r.errors.length) msg += `\nErrores (${r.errors.length}):\n${r.errors.slice(0, 10).join("\n")}${r.errors.length > 10 ? "\n..." : ""}`;
      await alert(msg);
      onImport();
    } catch { await alert("Error al importar"); }
    setImporting(false);
    setShowModal(null);
    setList("");
  }

  const btnStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" };

  return (
    <>
      <button onClick={() => setShowModal("excel")} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Upload /> Importar Excel</button>
      <button onClick={() => setShowModal("paste")} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Upload /> Pegar Lista</button>
      <button onClick={exportBackup} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Download /> Exportar Backup</button>
      <button onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".json"; i.onchange = async (e: any) => { const f = e.target.files?.[0]; if (f) { try { await importBackup(f); await alert("Datos restaurados"); onImport(); } catch { await alert("Error"); } } }; i.click(); }} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Upload /> Importar Backup</button>

      {showModal === "excel" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl shadow-xl w-full max-w-sm p-6" style={{ backgroundColor: "var(--bg-card)" }}>
            <h3 className="text-base font-semibold mb-2">Importar Excel</h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>Columnas: Apellido y Nombre | Nota1 | Nota2 | Nota3 | Nota4 | Nota5 | Nota6</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(null)} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}>Cancelar</button>
              <label className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer" style={{ backgroundColor: "var(--accent)", opacity: importing ? 0.5 : 1 }}>
                {importing ? "Importando..." : "Seleccionar archivo"}
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} disabled={importing} />
              </label>
            </div>
          </div>
        </div>
      )}

      {showModal === "paste" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl shadow-xl w-full max-w-md p-6" style={{ backgroundColor: "var(--bg-card)" }}>
            <h3 className="text-base font-semibold mb-2">Pegar Lista de Alumnos</h3>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Un alumno por línea: <strong>Apellido, Nombre</strong></p>
            <textarea value={list} onChange={e => setList(e.target.value)} rows={10}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] mb-3"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}
              placeholder={"GARCÍA, JUAN\nPÉREZ, MARÍA\nLÓPEZ, CARLOS"} />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowModal(null); setList(""); }} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}>Cancelar</button>
              <button onClick={handlePaste} disabled={importing || !list.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
                {importing ? "Importando..." : "Importar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {alertModal}
    </>
  );
}
