import { Router, Request, Response } from "express";
import { prisma } from "../index";

export const alumnosRouter = Router();

function promedio(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null);
  return nums.length > 0 ? Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 100) / 100 : null;
}

function calcularNota1C(a: { nota1: number | null; nota2: number | null; nota3: number | null }) {
  return promedio([a.nota1, a.nota2, a.nota3]);
}
function calcularNota2C(a: { nota4: number | null; nota5: number | null; nota6: number | null }) {
  return promedio([a.nota4, a.nota5, a.nota6]);
}
function calcularNotaFinal(n1c: number | null, n2c: number | null, notaFinalManual: number | null, modoManual: boolean) {
  if (modoManual && notaFinalManual !== null) return notaFinalManual;
  return promedio([n1c, n2c]);
}
function calcularSituacion(notaFinal: number | null) {
  if (notaFinal === null) return "";
  return notaFinal >= 7 ? "Aprobado" : "Desaprobado";
}
function calcularInforme(notaC: number | null): string | null {
  if (notaC === null) return null;
  return notaC >= 7 ? "TEA" : "TEP";
}

let notaFinalManualMode = false;
export async function loadSettings() {
  try {
    const s = await prisma.setting.findUnique({ where: { clave: "notaFinalMode" } });
    notaFinalManualMode = s?.valor === "manual";
  } catch {}
}

export async function mapAlumno(a: any) {
  const nota1C = calcularNota1C(a);
  const nota2C = calcularNota2C(a);
  const notaFinal = calcularNotaFinal(nota1C, nota2C, a.notaFinalManual, notaFinalManualMode);
  const situacionFinal = calcularSituacion(notaFinal);
  const informe1 = calcularInforme(nota1C);
  const informe2 = calcularInforme(nota2C);
  return { ...a, nota1C, nota2C, notaFinal, situacionFinal, informe1, informe2 };
}

function parseNota(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function calcularInformesDesdeNotas(n1: number | null, n2: number | null, n3: number | null, n4: number | null, n5: number | null, n6: number | null) {
  const n1c = promedio([n1, n2, n3]);
  const n2c = promedio([n4, n5, n6]);
  return { informe1: calcularInforme(n1c), informe2: calcularInforme(n2c) };
}

const CAMPOS_NOTA = ["nota1", "nota2", "nota3", "nota4", "nota5", "nota6"] as const;

async function registrarHistorial(alumnoId: number, campo: string, valorAnterior: string | null, valorNuevo: string | null) {
  if (valorAnterior === valorNuevo) return;
  await prisma.historialCambio.create({
    data: { alumnoId, campo, valorAnterior, valorNuevo },
  });
}

alumnosRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { escuelaId, cursoId, materiaId, search, anioLectivo, filtro } = req.query;
    const where: any = {};
    if (escuelaId) where.escuelaId = parseInt(escuelaId as string);
    if (cursoId) where.cursoId = parseInt(cursoId as string);
    if (materiaId) where.materiaId = parseInt(materiaId as string);
    if (anioLectivo) where.anioLectivo = parseInt(anioLectivo as string);
    if (search) where.apellidoNombre = { contains: search as string };
    const alumnos = await prisma.alumno.findMany({ where, orderBy: { apellidoNombre: "asc" } });
    let mapped = await Promise.all(alumnos.map(mapAlumno));
    if (filtro === "TEA") mapped = mapped.filter(a => a.informe1 === "TEA" || a.informe2 === "TEA");
    else if (filtro === "TEP") mapped = mapped.filter(a => a.informe1 === "TEP" || a.informe2 === "TEP");
    else if (filtro === "aprobados") mapped = mapped.filter(a => a.situacionFinal === "Aprobado");
    else if (filtro === "desaprobados") mapped = mapped.filter(a => a.situacionFinal === "Desaprobado");
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener alumnos" });
  }
});

alumnosRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const alumno = await prisma.alumno.findUnique({ where: { id } });
    if (!alumno) { res.status(404).json({ error: "Alumno no encontrado" }); return; }
    res.json(await mapAlumno(alumno));
  } catch (error) {
    res.status(500).json({ error: "Error al obtener alumno" });
  }
});

alumnosRouter.get("/:id/historial", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const h = await prisma.historialCambio.findMany({ where: { alumnoId: id }, orderBy: { createdAt: "desc" }, take: 50 });
    res.json(h);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

alumnosRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { apellidoNombre, nota1, nota2, nota3, nota4, nota5, nota6, escuelaId, cursoId, materiaId, observaciones, anioLectivo } = req.body;
    if (!apellidoNombre || !escuelaId || !cursoId || !materiaId) {
      res.status(400).json({ error: "Apellido y Nombre, escuelaId, cursoId y materiaId son obligatorios" });
      return;
    }
    const n1 = parseNota(nota1); const n2 = parseNota(nota2); const n3 = parseNota(nota3);
    const n4 = parseNota(nota4); const n5 = parseNota(nota5); const n6 = parseNota(nota6);
    const { informe1, informe2 } = calcularInformesDesdeNotas(n1, n2, n3, n4, n5, n6);
    const alumno = await prisma.alumno.create({
      data: {
        apellidoNombre: apellidoNombre.trim(),
        nota1: n1, nota2: n2, nota3: n3,
        nota4: n4, nota5: n5, nota6: n6,
        observaciones: observaciones || "",
        anioLectivo: anioLectivo ? parseInt(anioLectivo) : new Date().getFullYear(),
        escuelaId: parseInt(escuelaId), cursoId: parseInt(cursoId), materiaId: parseInt(materiaId),
      },
    });
    res.json(await mapAlumno(alumno));
  } catch (error) {
    res.status(500).json({ error: "Error al crear alumno" });
  }
});
                            
alumnosRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    console.log("[PUT] ID recibido:", id);
    console.log("[PUT] Datos enviados:", JSON.stringify(req.body));

    const { apellidoNombre, nota1, nota2, nota3, nota4, nota5, nota6, escuelaId, cursoId, materiaId, observaciones, anioLectivo, notaFinalManual } = req.body;
    const current = await prisma.alumno.findUnique({ where: { id } });
    if (!current) {
      console.log("[PUT] Error: registro no encontrado ID:", id);
      res.status(404).json({ error: "No se pudo actualizar el alumno porque el registro no existe." });
      return;
    }

    const data: any = {};
    if (apellidoNombre !== undefined) data.apellidoNombre = apellidoNombre.trim();
    if (nota1 !== undefined) data.nota1 = parseNota(nota1);
    if (nota2 !== undefined) data.nota2 = parseNota(nota2);
    if (nota3 !== undefined) data.nota3 = parseNota(nota3);
    if (nota4 !== undefined) data.nota4 = parseNota(nota4);
    if (nota5 !== undefined) data.nota5 = parseNota(nota5);
    if (nota6 !== undefined) data.nota6 = parseNota(nota6);
    if (observaciones !== undefined) data.observaciones = observaciones;
    if (anioLectivo !== undefined) data.anioLectivo = parseInt(anioLectivo);
    if (notaFinalManual !== undefined) data.notaFinalManual = parseNota(notaFinalManual);
    if (escuelaId !== undefined) data.escuelaId = parseInt(escuelaId);
    if (cursoId !== undefined) data.cursoId = parseInt(cursoId);
    if (materiaId !== undefined) data.materiaId = parseInt(materiaId);

    for (const campo of CAMPOS_NOTA) {
      if (req.body[campo] !== undefined) {
        await registrarHistorial(id, campo, String(current[campo] ?? ""), String(req.body[campo]));
      }
    }
    if (observaciones !== undefined) {
      await registrarHistorial(id, "observaciones", current.observaciones, observaciones);
    }

    console.log("[PUT] Consulta SQL ejecutada (data):", JSON.stringify(data));
    const alumno = await prisma.alumno.update({ where: { id }, data });
    console.log("[PUT] Respuesta DB:", JSON.stringify(alumno));
    res.json(await mapAlumno(alumno));
  } catch (error: any) {
    console.log("[PUT] Error completo:", error);
    const msg = error?.message || "";
    if (msg.includes("RecordNotFound") || msg.includes("not found")) {
      res.status(404).json({ error: "No se pudo actualizar el alumno porque el registro no existe." });
    } else if (msg.includes("unique") || msg.includes("Unique constraint")) {
      res.status(400).json({ error: "No se pudo actualizar el alumno porque ya existe otro con ese nombre." });
    } else if (msg.includes("foreign key") || msg.includes("Foreign key")) {
      res.status(400).json({ error: "No se pudo actualizar el alumno debido a una restricción de base de datos." });
    } else {
      res.status(500).json({ error: "No se pudo actualizar el alumno debido a un error de base de datos." });
    }
  }
});

alumnosRouter.put("/:id/batch", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const updates = req.body;
    const current = await prisma.alumno.findUnique({ where: { id } });
    if (!current) {
      res.status(404).json({ error: "No se pudo actualizar el alumno porque el registro no existe." });
      return;
    }

    const data: any = {};
    for (const campo of CAMPOS_NOTA) {
      if (updates[campo] !== undefined) {
        data[campo] = parseNota(updates[campo]);
        await registrarHistorial(id, campo, String(current[campo] ?? ""), String(updates[campo]));
      }
    }
    if (updates.observaciones !== undefined) {
      data.observaciones = updates.observaciones;
      await registrarHistorial(id, "observaciones", current.observaciones, updates.observaciones);
    }

    const alumno = await prisma.alumno.update({ where: { id }, data });
    res.json(await mapAlumno(alumno));
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("RecordNotFound") || msg.includes("not found")) {
      res.status(404).json({ error: "No se pudo actualizar el alumno porque el registro no existe." });
    } else {
      res.status(500).json({ error: "No se pudo actualizar el alumno debido a un error de base de datos." });
    }
  }
});

alumnosRouter.delete("/", async (req: Request, res: Response) => {
  try {
    const { ids, escuelaId, cursoId, materiaId } = req.query;
    const where: any = {};
    if (ids) {
      const idArr = (ids as string).split(",").map(Number);
      where.id = { in: idArr };
    }
    if (escuelaId) where.escuelaId = parseInt(escuelaId as string);
    if (cursoId) where.cursoId = parseInt(cursoId as string);
    if (materiaId) where.materiaId = parseInt(materiaId as string);
    const result = await prisma.alumno.deleteMany({ where });
    res.json({ deleted: result.count });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar alumnos" });
  }
});

alumnosRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.alumno.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar alumno" });
  }
});
