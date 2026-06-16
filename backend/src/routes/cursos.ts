import { Router, Request, Response } from "express";
import { prisma } from "../index";

export const cursosRouter = Router();

cursosRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { escuelaId } = req.query;
    const where = escuelaId ? { escuelaId: parseInt(escuelaId as string) } : {};
    const cursos = await prisma.curso.findMany({
      where,
      orderBy: [{ anio: "asc" }, { division: "asc" }],
    });
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener cursos" });
  }
});

cursosRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const curso = await prisma.curso.findUnique({ where: { id } });
    if (!curso) { res.status(404).json({ error: "No encontrado" }); return; }
    res.json(curso);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener curso" });
  }
});

cursosRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { anio, division, turno, escuelaId } = req.body;
    if (!anio || !division || !turno || !escuelaId) {
      res.status(400).json({ error: "Año, división, turno y escuelaId son obligatorios" });
      return;
    }
    const nombre = `${anio}° ${division}`;
    const curso = await prisma.curso.create({
      data: {
        nombre,
        anio: parseInt(anio),
        division: division.trim().toUpperCase(),
        turno: turno.trim(),
        escuelaId: parseInt(escuelaId),
      },
    });
    res.json(curso);
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(400).json({ error: "Ya existe un curso con ese nombre en la escuela" });
      return;
    }
    res.status(500).json({ error: "Error al crear curso" });
  }
});

cursosRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { anio, division, turno } = req.body;
    const data: any = {};
    if (anio !== undefined) data.anio = parseInt(anio);
    if (division !== undefined) data.division = division.trim().toUpperCase();
    if (turno !== undefined) data.turno = turno.trim();
    if (anio !== undefined || division !== undefined) {
      const current = await prisma.curso.findUnique({ where: { id } });
      if (current) {
        data.nombre = `${data.anio ?? current.anio}° ${data.division ?? current.division}`;
      }
    }
    const curso = await prisma.curso.update({ where: { id }, data });
    res.json(curso);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar curso" });
  }
});

cursosRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.curso.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar curso" });
  }
});
