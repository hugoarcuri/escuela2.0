import { useRef } from "react";
import { importExcel, getExportExcelUrl, getExportPdfUrl } from "../api";
import { Download, Upload } from "./Icons";

interface Props {
  escuelaId: number;
  cursoId: number;
  materiaId: number;
  onImport: () => void;
}

export default function ImportExport({ escuelaId, cursoId, materiaId, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importExcel(file, escuelaId, cursoId, materiaId);
    alert(`Importados ${result.imported} alumnos${result.errors.length ? `\nErrores: ${result.errors.join("\n")}` : ""}`);
    onImport();
    if (fileRef.current) fileRef.current.value = "";
  }

  const btnStyle: React.CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" };

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />
      <button onClick={() => fileRef.current?.click()} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Upload /> Importar Excel</button>
      <a href={getExportExcelUrl(escuelaId, cursoId, materiaId)} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Download /> Exportar Excel</a>
      <a href={getExportPdfUrl(escuelaId, cursoId, materiaId)} className="btn-ghost inline-flex items-center gap-1.5" style={btnStyle}><Download /> Exportar PDF</a>
    </>
  );
}
