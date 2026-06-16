import { Router, Request, Response } from "express";
import { prisma } from "../index";

export const escuelasRouter = Router();

escuelasRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const escuelas = await prisma.escuela.findMany({ orderBy: { nombre: "asc" } });
    res.json(escuelas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener escuelas" });
  }
});

escuelasRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const escuela = await prisma.escuela.findUnique({ where: { id } });
    if (!escuela) { res.status(404).json({ error: "No encontrada" }); return; }
    res.json(escuela);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener escuela" });
  }
});

escuelasRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { nombre, distrito, telefono } = req.body;
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      res.status(400).json({ error: "El nombre es obligatorio" });
      return;
    }
    const escuela = await prisma.escuela.create({
      data: {
        nombre: nombre.trim(),
        distrito: distrito?.trim() || null,
        telefono: telefono?.trim() || null,
      },
    });
    res.json(escuela);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Error al crear escuela" });
  }
});

escuelasRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { nombre, distrito, telefono } = req.body;
    const data: any = {};
    if (nombre !== undefined) data.nombre = nombre.trim();
    if (distrito !== undefined) data.distrito = distrito?.trim() || null;
    if (telefono !== undefined) data.telefono = telefono?.trim() || null;
    const escuela = await prisma.escuela.update({ where: { id }, data });
    res.json(escuela);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar escuela" });
  }
});

escuelasRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.escuela.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar escuela" });
  }
});
