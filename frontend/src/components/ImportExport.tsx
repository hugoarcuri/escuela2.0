import { useState, useEffect, useRef } from "react";
import { getCursos, getMaterias, importExcel, getExportExcelUrl, getExportPdfUrl } from "../api";
import type { Curso, Materia } from "../types";
import { Download, Upload } from "./Icons";
import { useAlert } from "./Modals";

interface Props {
  escuelaId: number;
  cursoId: number;
  materiaId: number;
  onImport: () => void;
}

export default function ImportExport({ escuelaId, cursoId, materiaId, onImport }: Props) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCursoId, setImportCursoId] = useState<number | "">("");
  const [importMateriaId, setImportMateriaId] = useState<number | "">("");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { alert, modal: alertModal } = useAlert();

  useEffect(() => {
    if (showImportModal) getCursos(escuelaId).then(list => { setCursos(list); setImportCursoId(cursoId); });
  }, [showImportModal, escuelaId, cursoId]);

  useEffect(() => {
    if (importCursoId) getMaterias(Number(importCursoId)).then(list => { setMaterias(list); setImportMateriaId(list.some(m => m.id === materiaId) ? materiaId : ""); });
    else { setMaterias([]); setImportMateriaId(""); }
  }, [importCursoId, materiaId]);

  function openImport() {
    setShowImportModal(true);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !importCursoId || !importMateriaId) return;
    setImporting(true);
    try {
      const result = await importExcel(file, escuelaId, Number(importCursoId), Number(importMateriaId));
      await alert(`Importados ${result.imported} alumnos${result.errors.length ? `\nErrores: ${result.errors.join("\n")}` : ""}`);
      onImport();
    } catch { await alert("Error al importar"); }
    setImporting(false);
    setShowImportModal(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const s: React.CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" };
  const btnStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" };

  return (
    <>
      <button onClick={openImport} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Upload /> Importar Excel</button>
      <a href={getExportExcelUrl(escuelaId, cursoId, materiaId)} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Download /> Exportar Excel</a>
      <a href={getExportPdfUrl(escuelaId, cursoId, materiaId)} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Download /> Exportar PDF</a>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl shadow-xl w-full max-w-sm p-6" style={{ backgroundColor: "var(--bg-card)" }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Importar alumnos</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Curso</label>
                <select value={importCursoId} onChange={e => setImportCursoId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={s}>
                  <option value="">Seleccionar curso</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.turno ? `(${c.turno})` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Materia</label>
                <select value={importMateriaId} onChange={e => setImportMateriaId(e.target.value ? Number(e.target.value) : "")}
                  disabled={!importCursoId}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
                  style={s}>
                  <option value="">Seleccionar materia</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}>Cancelar</button>
              <button onClick={() => fileRef.current?.click()} disabled={!importCursoId || !importMateriaId || importing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
                {importing ? "Importando..." : "Seleccionar archivo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />
      {alertModal}
    </>
  );
}
