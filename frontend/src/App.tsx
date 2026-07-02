import { useState, useEffect } from "react";
import { getSettings, saveSettings, deleteAlumno, deleteAllAlumnos, exportBackup, importBackup, importExcel, importList, setNotaFinalMode as setApiNotaMode } from "./api";
import { useTheme } from "./hooks/useTheme";
import { useSelection } from "./hooks/useSelection";
import Header from "./components/Header";
import Selectors from "./components/Selectors";
import StudentTable from "./components/StudentTable";
import StudentForm from "./components/StudentForm";
import GoogleFormSync from "./components/GoogleFormSync";
import Asistencias from "./components/Asistencias";
import Agenda from "./components/Agenda";
import AdminEscuela from "./components/AdminEscuela";
import AdminCurso from "./components/AdminCurso";
import AdminMateria from "./components/AdminMateria";
import Card from "./components/ui/Card";
import SectionTitle from "./components/ui/SectionTitle";
import EmptyState from "./components/ui/EmptyState";
import DropdownActions from "./components/ui/DropdownActions";
import StatsBar from "./components/table/StatsBar";
import { useConfirm, usePrompt, useAlert } from "./components/Modals";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const sel = useSelection();
  const {
    escuelas, cursos, materias, alumnos, loadAlumnos, refreshSelections,
    escuelaId, setEscuelaId, cursoId, setCursoId, materiaId, setMateriaId,
    search, setSearch, anioLectivo, setAnioLectivo,
  } = sel;

  const [formOpen, setFormOpen] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState<typeof alumnos[0] | null>(null);
  const [adminEscuelaOpen, setAdminEscuelaOpen] = useState(false);
  const [editEscuelaId, setEditEscuelaId] = useState<number | null>(null);
  const [adminCursoOpen, setAdminCursoOpen] = useState(false);
  const [adminMateriaOpen, setAdminMateriaOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notaFinalMode, setNotaFinalMode] = useState("auto");
  const [tab, setTab] = useState<"alumnos" | "asistencias" | "agenda">("alumnos");
  const [importModal, setImportModal] = useState<"excel" | "paste" | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importListText, setImportListText] = useState("");
  const [importing, setImporting] = useState(false);

  const { confirm, modal: confirmModal } = useConfirm();
  const { prompt, modal: promptModal } = usePrompt();
  const { alert, modal: alertModal } = useAlert();

  useEffect(() => {
    getSettings().then(s => {
      if (s.notaFinalMode) { setNotaFinalMode(s.notaFinalMode); setApiNotaMode(s.notaFinalMode); }
    });
  }, []);

  async function handleImportExcel() {
    if (!importFile) return;
    setImporting(true);
    try {
      const r = await importExcel(importFile, Number(escuelaId), Number(cursoId), Number(materiaId), anioLectivo);
      setImportModal(null); setImportFile(null);
      await alert(`Importados: ${r.imported}${r.errors.length ? `\nErrores: ${r.errors.join("\n")}` : ""}`);
      loadAlumnos();
    } catch (e: any) { await alert("Error: " + e.message); }
    setImporting(false);
  }

  async function handleImportList() {
    if (!importListText.trim()) return;
    setImporting(true);
    try {
      const r = await importList(importListText, Number(escuelaId), Number(cursoId), Number(materiaId), anioLectivo);
      setImportModal(null); setImportListText("");
      await alert(`Importados: ${r.imported}${r.errors.length ? `\nErrores: ${r.errors.join("\n")}` : ""}`);
      loadAlumnos();
    } catch (e: any) { await alert("Error: " + e.message); }
    setImporting(false);
  }

  const sm = typeof materiaId === "number" ? materias.find(m => m.id === materiaId) : undefined;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 py-4 space-y-3 flex flex-col overflow-hidden">

        {/* Top bar: year + settings + tools */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Año:</label>
            <select value={anioLectivo} onChange={e => setAnioLectivo(Number(e.target.value))}
              className="input !w-auto !py-1 !text-xs">
              {[2026, 2027, 2028].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={() => setSettingsOpen(true)} className="btn btn-ghost btn-sm">Ajustes</button>
          <DropdownActions label="Base de Datos" actions={[
            { label: "Exportar Backup", onClick: exportBackup },
            { label: "Importar Backup", onClick: () => { const i = document.createElement("input"); i.type = "file"; i.accept = ".json"; i.onchange = async (e: any) => { const f = e.target.files?.[0]; if (f) { try { await importBackup(f); await alert("Datos restaurados"); loadAlumnos(); } catch { await alert("Error"); } } }; i.click(); } },
          ]} />
        </div>

        {/* Card: Filtros */}
        <Card className="shrink-0">
          <Selectors
            escuelas={escuelas} cursos={cursos} materias={materias}
            escuelaId={escuelaId} cursoId={cursoId} materiaId={materiaId}
            search={search}
            onEscuelaChange={setEscuelaId}
            onCursoChange={setCursoId}
            onMateriaChange={setMateriaId}
            onSearchChange={setSearch}
            onAdminEscuela={() => { setEditEscuelaId(null); setAdminEscuelaOpen(true); }}
            onEditEscuela={(id) => { setEditEscuelaId(id); setAdminEscuelaOpen(true); }}
            onAdminCurso={() => setAdminCursoOpen(true)}
            onAdminMateria={() => setAdminMateriaOpen(true)}
          />
        </Card>

        {/* Main content when materia is selected */}
        {typeof materiaId === "number" && materiaId > 0 && (() => {
          return (<>
            {sm && (sm.dia || sm.turno) && (
              <div className="flex justify-center text-xs" style={{ color: "var(--text-secondary)" }}>
                {sm.dia && <span className="mr-2">{sm.dia}</span>}{sm.turno && <span>{sm.turno}</span>}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b" style={{ borderColor: "var(--border-color)" }}>
              {(["alumnos", "asistencias", "agenda"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 -mb-px transition-colors"
                  style={{
                    backgroundColor: tab === t ? "var(--bg-card)" : "transparent",
                    color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                    borderColor: "var(--border-color)",
                    borderTop: tab === t
                      ? `3px solid ${t === "alumnos" ? "var(--accent)" : t === "asistencias" ? "#f59e0b" : "#8b5cf6"}`
                      : "3px solid transparent",
                  }}>{t === "alumnos" ? "Alumnos" : t === "asistencias" ? "Asistencias" : "Agenda"}</button>
              ))}
            </div>

            {/* Alumnos tab */}
            {tab === "alumnos" && (
              <div className="flex-1 min-h-0 flex flex-col">
                <Card padding={false} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="p-3 space-y-1 shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <SectionTitle>Alumnos</SectionTitle>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditingAlumno(null); setFormOpen(true); }} className="btn btn-primary btn-sm">+ Agregar</button>
                        <button onClick={async () => {
                          if (alumnos.length === 0) return;
                          const id = await prompt("Ingrese el ID del alumno a editar:");
                          if (id) { const a = alumnos.find(x => x.id === parseInt(id)); if (a) { setEditingAlumno(a); setFormOpen(true); } else await alert("Alumno no encontrado"); }
                        }} className="btn btn-secondary btn-sm" disabled={alumnos.length === 0}>Editar</button>
                        <button onClick={async () => {
                          const id = await prompt("Ingrese el ID del alumno a eliminar:");
                          if (id) { await deleteAlumno(parseInt(id)); loadAlumnos(); }
                        }} className="btn btn-danger btn-sm" disabled={alumnos.length === 0}>Eliminar</button>
                        <DropdownActions label="Herramientas" actions={[
                          { label: "Eliminar Todos", onClick: async () => { const ok = await confirm("¿Eliminar TODOS los alumnos?"); if (!ok) return; const r = await deleteAllAlumnos(Number(escuelaId), Number(cursoId), Number(materiaId)); await alert(`Se eliminaron ${r.deleted} alumno(s)`); loadAlumnos(); }, variant: "danger" },
                          { label: "Importar Excel", onClick: () => setImportModal("excel") },
                          { label: "Pegar Lista", onClick: () => setImportModal("paste") },
                          { label: "Exportar Backup", onClick: exportBackup },
                          { label: "Importar Backup", onClick: () => { const i = document.createElement("input"); i.type = "file"; i.accept = ".json"; i.onchange = async (e: any) => { const f = e.target.files?.[0]; if (f) { try { await importBackup(f); await alert("Datos restaurados"); loadAlumnos(); } catch { await alert("Error"); } } }; i.click(); } },
                        ]} />
                      </div>
                    </div>

                    <StatsBar alumnos={alumnos} />

                    <GoogleFormSync escuelaId={Number(escuelaId)} cursoId={Number(cursoId)} materiaId={Number(materiaId)} anioLectivo={anioLectivo} onSync={loadAlumnos} />
                  </div>

                  <div className="border-t flex-1 min-h-0 scrollable" style={{ borderColor: "var(--border-color)" }}>
                    <StudentTable alumnos={alumnos} onRefresh={loadAlumnos} onEdit={a => { setEditingAlumno(a); setFormOpen(true); }} materiaId={Number(materiaId)} />
                  </div>
                </Card>
              </div>
            )}

            {/* Asistencias tab */}
            {tab === "asistencias" && (
              <div className="flex-1 min-h-0 flex flex-col">
                <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="flex-1 min-h-0 scrollable">
                    <Asistencias alumnos={alumnos} materiaId={Number(materiaId)} dia={sm?.dia || ""} />
                  </div>
                </Card>
              </div>
            )}

            {/* Agenda tab */}
            {tab === "agenda" && (
              <div className="flex-1 min-h-0 flex flex-col">
                <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="flex-1 min-h-0 scrollable">
                    <Agenda materiaId={Number(materiaId)} />
                  </div>
                </Card>
              </div>
            )}
          </>);
        })()}

        {/* No materia selected */}
        {(!materiaId || materiaId === 0) && (
          <EmptyState message="Seleccioná una escuela, curso y materia para comenzar" icon="📚" />
        )}
      </main>

      {/* StudentForm modal */}
      {formOpen && (
        <StudentForm
          alumno={editingAlumno}
          escuelaId={editingAlumno ? editingAlumno.escuelaId : Number(escuelaId)}
          cursoId={editingAlumno ? editingAlumno.cursoId : Number(cursoId)}
          materiaId={editingAlumno ? editingAlumno.materiaId : Number(materiaId)}
          anioLectivo={editingAlumno ? editingAlumno.anioLectivo : anioLectivo}
          onClose={() => { setFormOpen(false); setEditingAlumno(null); }}
          onSaved={() => { setFormOpen(false); setEditingAlumno(null); loadAlumnos(); }}
        />
      )}

      {/* Admin modals */}
      {adminEscuelaOpen && <AdminEscuela editId={editEscuelaId} onClose={() => { setAdminEscuelaOpen(false); setEditEscuelaId(null); }} onChanged={refreshSelections} />}
      {adminCursoOpen && <AdminCurso onClose={() => setAdminCursoOpen(false)} onChanged={refreshSelections} />}
      {adminMateriaOpen && <AdminMateria onClose={() => setAdminMateriaOpen(false)} onChanged={refreshSelections}
        initialEscuelaId={escuelaId ? Number(escuelaId) : undefined}
        initialCursoId={cursoId ? Number(cursoId) : undefined}
        initialMateriaId={materiaId ? Number(materiaId) : undefined} />}

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl shadow-xl w-full max-w-md p-6" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ajustes</h2>
              <button onClick={() => setSettingsOpen(false)} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cálculo de Nota Final</label>
                <select value={notaFinalMode} onChange={e => setNotaFinalMode(e.target.value)}
                  className="input">
                  <option value="auto">Automático (promedio de cuatrimestres)</option>
                  <option value="manual">Manual (carga docente)</option>
                </select>
              </div>
              <button onClick={async () => {
                await saveSettings({ notaFinalMode });
                setApiNotaMode(notaFinalMode);
                await alert("Configuración guardada.");
                setSettingsOpen(false);
              }} className="btn btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel modal */}
      {importModal === "excel" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl shadow-xl w-full max-w-md p-6" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Importar Excel</h2>
              <button onClick={() => { setImportModal(null); setImportFile(null); }} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Seleccioná un archivo de Excel (.xlsx) con los nombres de los alumnos.</p>
              <input type="file" accept=".xlsx,.xls" onChange={e => setImportFile(e.target.files?.[0] || null)}
                className="block w-full text-sm" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setImportModal(null); setImportFile(null); }} className="btn btn-secondary btn-sm">Cancelar</button>
                <button onClick={handleImportExcel} disabled={!importFile || importing} className="btn btn-primary btn-sm">{importing ? "Importando..." : "Importar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paste list modal */}
      {importModal === "paste" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl shadow-xl w-full max-w-md p-6" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Pegar Lista</h2>
              <button onClick={() => { setImportModal(null); setImportListText(""); }} className="p-1 rounded hover:bg-[var(--hover-bg)]" style={{ color: "var(--text-secondary)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Pegá los nombres, uno por línea.</p>
              <textarea value={importListText} onChange={e => setImportListText(e.target.value)} rows={8}
                className="input resize-none" placeholder="Apellido, Nombre&#10;Apellido, Nombre" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setImportModal(null); setImportListText(""); }} className="btn btn-secondary btn-sm">Cancelar</button>
                <button onClick={handleImportList} disabled={!importListText.trim() || importing} className="btn btn-primary btn-sm">{importing ? "Importando..." : "Importar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal}
      {promptModal}
      {alertModal}
    </div>
  );
}
