import { useState, useEffect, useCallback, useRef } from "react";
import { getEscuelas, getCursos, getMaterias, getAlumnos, deleteAlumno, deleteAllAlumnos, getSettings, saveSettings, exportBackup, importBackup, setNotaFinalMode as setApiNotaMode } from "./api";
import type { Escuela, Curso, Materia, Alumno } from "./types";
import Header from "./components/Header";
import Selectors from "./components/Selectors";
import StudentTable from "./components/StudentTable";
import StudentForm from "./components/StudentForm";
import ImportExport from "./components/ImportExport";
import GoogleFormSync from "./components/GoogleFormSync";
import Asistencias from "./components/Asistencias";
import AdminEscuela from "./components/AdminEscuela";
import AdminCurso from "./components/AdminCurso";
import AdminMateria from "./components/AdminMateria";
import { useConfirm, usePrompt, useAlert } from "./components/Modals";

function loadSaved(key: string): Record<number, number> { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } }

export default function App() {
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [escuelaId, setEscuelaId] = useState<number | "">("");
  const [cursoId, setCursoId] = useState<number | "">("");
  const [materiaId, setMateriaId] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [anioLectivo, setAnioLectivo] = useState(() => {
    const saved = localStorage.getItem("anioLectivo");
    return saved ? Number(saved) : new Date().getFullYear();
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null);
  const [adminEscuelaOpen, setAdminEscuelaOpen] = useState(false);
  const [editEscuelaId, setEditEscuelaId] = useState<number | null>(null);
  const [adminCursoOpen, setAdminCursoOpen] = useState(false);
  const [adminMateriaOpen, setAdminMateriaOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notaFinalMode, setNotaFinalMode] = useState("auto");
  const [tab, setTab] = useState<"alumnos" | "asistencias">("alumnos");
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("theme") as "light" | "dark") || "light");
  const lastCurso = useRef<Record<number, number>>(loadSaved("lastCurso"));
  const lastMateria = useRef<Record<number, number>>(loadSaved("lastMateria"));

  const [restored, setRestored] = useState(false);

  const { confirm, modal: confirmModal } = useConfirm();
  const { prompt, modal: promptModal } = usePrompt();
  const { alert, modal: alertModal } = useAlert();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Save full session when all 3 selected
  useEffect(() => {
    if (escuelaId && cursoId && materiaId) {
      localStorage.setItem("lastSession", JSON.stringify({
        escuelaId: Number(escuelaId),
        cursoId: Number(cursoId),
        materiaId: Number(materiaId),
      }));
    }
  }, [escuelaId, cursoId, materiaId]);

  // Save escuela, curso, materia individual maps (for manual selection restore)
  useEffect(() => {
    if (escuelaId && cursoId) {
      lastCurso.current[Number(escuelaId)] = Number(cursoId);
      localStorage.setItem("lastCurso", JSON.stringify(lastCurso.current));
    }
  }, [escuelaId, cursoId]);
  useEffect(() => {
    if (cursoId && materiaId) {
      lastMateria.current[Number(cursoId)] = Number(materiaId);
      localStorage.setItem("lastMateria", JSON.stringify(lastMateria.current));
    }
  }, [cursoId, materiaId]);

  // Restore full state on initial load
  useEffect(() => {
    getEscuelas().then(list => {
      setEscuelas(list);
      if (!restored) {
        // Try full session first
        const raw = localStorage.getItem("lastSession");
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            if (list.some(e => e.id === saved.escuelaId)) {
              setEscuelaId(saved.escuelaId);
              getCursos(saved.escuelaId).then(cursosList => {
                setCursos(cursosList);
                if (cursosList.some(c => c.id === saved.cursoId)) {
                  setCursoId(saved.cursoId);
                  getMaterias(saved.cursoId).then(matsList => {
                    setMaterias(matsList);
                    if (matsList.some(m => m.id === saved.materiaId)) {
                      setMateriaId(saved.materiaId);
                    }
                  });
                }
              });
            }
          } catch {}
        }
        setRestored(true);
      } else {
        // Already restored: save current selections
        localStorage.setItem("lastStateEscuela", JSON.stringify({
          curso: lastCurso.current,
          materia: lastMateria.current,
        }));
      }
    });
  }, [restored]);

  // When escuela changes manually (not from restore), restore last curso
  useEffect(() => {
    if (escuelaId) {
      getCursos(Number(escuelaId)).then(list => {
        setCursos(list);
        const saved = lastCurso.current[Number(escuelaId)];
        if (saved && list.some(c => c.id === saved)) setCursoId(saved);
        else setCursoId("");
      });
    } else { setCursos([]); setCursoId(""); setMaterias([]); setMateriaId(""); setAlumnos([]); }
  }, [escuelaId]);

  // When curso changes manually, restore last materia
  useEffect(() => {
    if (cursoId) {
      getMaterias(Number(cursoId)).then(list => {
        setMaterias(list);
        const saved = lastMateria.current[Number(cursoId)];
        if (saved && list.some(m => m.id === saved)) setMateriaId(saved);
        else if (list.length === 1) setMateriaId(list[0].id);
        else setMateriaId("");
      });
    } else { setMaterias([]); setMateriaId(""); setAlumnos([]); }
  }, [cursoId]);

  const loadAlumnos = useCallback(() => {
    if (escuelaId && cursoId && materiaId) {
      getAlumnos({ escuelaId: Number(escuelaId), cursoId: Number(cursoId), materiaId: Number(materiaId), anioLectivo, search: search || undefined }).then(setAlumnos);
    } else setAlumnos([]);
  }, [escuelaId, cursoId, materiaId, anioLectivo, search]);

  useEffect(() => { loadAlumnos(); }, [loadAlumnos]);
  useEffect(() => { localStorage.setItem("anioLectivo", String(anioLectivo)); }, [anioLectivo]);

  useEffect(() => {
    getSettings().then(s => {
      if (s.notaFinalMode) { setNotaFinalMode(s.notaFinalMode); setApiNotaMode(s.notaFinalMode); }
    });
  }, []);

  function refreshAll() {
    getEscuelas().then(setEscuelas);
    if (escuelaId) getCursos(Number(escuelaId)).then(setCursos);
    if (cursoId) getMaterias(Number(cursoId)).then(setMaterias);
  }

  const ANIOS = [2025, 2026, 2027];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <Header theme={theme} onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Top bar: year + settings + backup */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Año:</label>
            <select value={anioLectivo} onChange={e => setAnioLectivo(Number(e.target.value))}
              className="rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
              {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={() => setSettingsOpen(true)} className="btn-ghost text-xs px-3 py-1.5">Ajustes</button>
          <button onClick={exportBackup} className="btn-ghost text-xs px-3 py-1.5">Exportar DB</button>
          <button onClick={async () => {
            const input = document.createElement("input");
            input.type = "file"; input.accept = ".json";
            input.onchange = async (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                await importBackup(file);
                await alert("Datos restaurados correctamente.");
              }
            };
            input.click();
          }} className="btn-ghost text-xs px-3 py-1.5">Importar DB</button>
          <div className="flex-1" />
        </div>

        <div className="mb-6 space-y-4">
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
        </div>

        {materiaId && (
          <>
            <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "var(--border-color)" }}>
              <button onClick={() => setTab("alumnos")}
                className="px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 -mb-px transition-colors"
                style={{
                  backgroundColor: tab === "alumnos" ? "var(--bg-card)" : "transparent",
                  color: tab === "alumnos" ? "var(--text-primary)" : "var(--text-secondary)",
                  borderColor: "var(--border-color)",
                }}>Alumnos</button>
              <button onClick={() => setTab("asistencias")}
                className="px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 -mb-px transition-colors"
                style={{
                  backgroundColor: tab === "asistencias" ? "var(--bg-card)" : "transparent",
                  color: tab === "asistencias" ? "var(--text-primary)" : "var(--text-secondary)",
                  borderColor: "var(--border-color)",
                }}>Asistencias</button>
            </div>
            {tab === "alumnos" && (
              <>
                <div className="flex flex-wrap gap-3 mb-4">
                  <button onClick={() => { setEditingAlumno(null); setFormOpen(true); }} className="btn-primary">+ Agregar</button>
                  <button onClick={async () => {
                    if (alumnos.length === 0) return;
                    const id = await prompt("Ingrese el ID del alumno a editar:");
                    if (id) {
                      const a = alumnos.find(x => x.id === parseInt(id));
                      if (a) { setEditingAlumno(a); setFormOpen(true); } else await alert("Alumno no encontrado");
                    }
                  }} className="btn-secondary" disabled={alumnos.length === 0}>Editar</button>
                  <button onClick={async () => {
                    const id = await prompt("Ingrese el ID del alumno a eliminar:");
                    if (id) { await deleteAlumno(parseInt(id)); loadAlumnos(); }
                  }} className="btn-danger" disabled={alumnos.length === 0}>Eliminar</button>
                  <button onClick={async () => {
                    const ok = await confirm("¿Eliminar TODOS los alumnos?");
                    if (!ok) return;
                    const r = await deleteAllAlumnos(Number(escuelaId), Number(cursoId), Number(materiaId));
                    await alert(`Se eliminaron ${r.deleted} alumno(s)`);
                    loadAlumnos();
                  }} className="btn-danger" disabled={alumnos.length === 0}>Eliminar Todos</button>
                  <ImportExport escuelaId={Number(escuelaId)} cursoId={Number(cursoId)} materiaId={Number(materiaId)} anioLectivo={anioLectivo} onImport={loadAlumnos} />
                </div>
                <div className="mb-4">
                  <GoogleFormSync escuelaId={Number(escuelaId)} cursoId={Number(cursoId)} materiaId={Number(materiaId)} anioLectivo={anioLectivo} onSync={loadAlumnos} />
                </div>
                <StudentTable alumnos={alumnos} onRefresh={loadAlumnos} onEdit={a => { setEditingAlumno(a); setFormOpen(true); }} onDelete={async (id) => { const ok = await confirm("¿Eliminar este alumno?"); if (ok) { await deleteAlumno(id); loadAlumnos(); } }} />
              </>
            )}
            {tab === "asistencias" && (
              <Asistencias alumnos={alumnos} escuelaId={Number(escuelaId)} cursoId={Number(cursoId)} materiaId={Number(materiaId)} />
            )}
          </>
        )}

        {!materiaId && (
          <div className="text-center py-20" style={{ color: "var(--text-secondary)" }}>
            <p className="text-xl">Seleccioná una escuela, curso y materia para comenzar</p>
          </div>
        )}
      </main>

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

      {adminEscuelaOpen && <AdminEscuela editId={editEscuelaId} onClose={() => { setAdminEscuelaOpen(false); setEditEscuelaId(null); }} onChanged={refreshAll} />}
      {adminCursoOpen && <AdminCurso onClose={() => setAdminCursoOpen(false)} onChanged={refreshAll} />}
      {adminMateriaOpen && <AdminMateria onClose={() => setAdminMateriaOpen(false)} onChanged={refreshAll} />}

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
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                  <option value="auto">Automático (promedio de cuatrimestres)</option>
                  <option value="manual">Manual (carga docente)</option>
                </select>
              </div>
              <button onClick={async () => {
                await saveSettings({ notaFinalMode });
                setApiNotaMode(notaFinalMode);
                await alert("Configuración guardada.");
                setSettingsOpen(false);
              }} className="btn-primary">Guardar</button>
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
