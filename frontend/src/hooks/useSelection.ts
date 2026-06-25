import { useState, useEffect, useRef, useCallback } from "react";
import { getEscuelas, getCursos, getMaterias, getAlumnos, getAttendanceGrades } from "../api";
import type { Escuela, Curso, Materia, Alumno } from "../types";

function loadSaved(key: string): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}

export function useSelection() {
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
  const [restored, setRestored] = useState(false);

  const lastCurso = useRef<Record<number, number>>(loadSaved("lastCurso"));
  const lastMateria = useRef<Record<number, number>>(loadSaved("lastMateria"));

  // Persist full session
  useEffect(() => {
    if (escuelaId && cursoId && materiaId) {
      localStorage.setItem("lastSession", JSON.stringify({
        escuelaId: Number(escuelaId), cursoId: Number(cursoId), materiaId: Number(materiaId),
      }));
    }
  }, [escuelaId, cursoId, materiaId]);

  // Save individual maps
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
                    if (matsList.some(m => m.id === saved.materiaId)) setMateriaId(saved.materiaId);
                  });
                }
              });
            }
          } catch {}
        }
        setRestored(true);
      }
    });
  }, [restored]);

  // When escuela changes
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

  // When curso changes
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

  // Load alumnos
  const loadAlumnos = useCallback(() => {
    if (escuelaId && cursoId && materiaId) {
      getAlumnos({ escuelaId: Number(escuelaId), cursoId: Number(cursoId), materiaId: Number(materiaId), anioLectivo, search: search || undefined }).then(async (raw) => {
        const grades = await getAttendanceGrades(Number(materiaId), anioLectivo);
        setAlumnos(raw.map(a => {
          const g = grades.get(a.id);
          return { ...a, notaAsistencia1: g?.na1 ?? null, notaAsistencia2: g?.na2 ?? null };
        }));
      });
    } else setAlumnos([]);
  }, [escuelaId, cursoId, materiaId, anioLectivo, search]);

  useEffect(() => { loadAlumnos(); }, [loadAlumnos]);
  useEffect(() => { localStorage.setItem("anioLectivo", String(anioLectivo)); }, [anioLectivo]);

  function refreshSelections() {
    getEscuelas().then(setEscuelas);
    if (escuelaId) getCursos(Number(escuelaId)).then(setCursos);
    if (cursoId) getMaterias(Number(cursoId)).then(setMaterias);
  }

  return {
    escuelas, setEscuelas, cursos, setCursos, materias, setMaterias,
    alumnos, setAlumnos,
    escuelaId, setEscuelaId, cursoId, setCursoId, materiaId, setMateriaId,
    search, setSearch, anioLectivo, setAnioLectivo,
    loadAlumnos, refreshSelections,
  };
}
