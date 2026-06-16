import { Router, Request, Response } from "express";
import { prisma } from "../index";

export const materiasRouter = Router();

materiasRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { cursoId } = req.query;
    const where = cursoId ? { cursoId: parseInt(cursoId as string) } : {};
    const materias = await prisma.materia.findMany({ where, orderBy: { nombre: "asc" } });
    res.json(materias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener materias" });
  }
});

materiasRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const materia = await prisma.materia.findUnique({ where: { id } });
    if (!materia) { res.status(404).json({ error: "No encontrada" }); return; }
    res.json(materia);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener materia" });
  }
});

materiasRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { nombre, cursoId } = req.body;
    if (!nombre || !cursoId) {
      res.status(400).json({ error: "Nombre y cursoId son obligatorios" });
      return;
    }
    const materia = await prisma.materia.create({
      data: { nombre: nombre.trim(), cursoId: parseInt(cursoId) },
    });
    res.json(materia);
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(400).json({ error: "Ya existe una materia con ese nombre en el curso" });
      return;
    }
    res.status(500).json({ error: "Error al crear materia" });
  }
});

materiasRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { nombre } = req.body;
    const materia = await prisma.materia.update({ where: { id }, data: { nombre: nombre.trim() } });
    res.json(materia);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar materia" });
  }
});

materiasRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.materia.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar materia" });
  }
});
