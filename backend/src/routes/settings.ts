import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { loadSettings } from "./alumnos";

export const settingsRouter = Router();

settingsRouter.get("/", async (_req: Request, res: Response) => {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.clave] = s.valor;
  res.json(map);
});

settingsRouter.put("/", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    for (const [clave, valor] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { clave },
        update: { valor: String(valor) },
        create: { clave, valor: String(valor) },
      });
    }
    await loadSettings();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar configuración" });
  }
});
