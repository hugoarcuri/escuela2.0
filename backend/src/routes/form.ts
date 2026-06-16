import { Router, Request, Response } from "express";
import crypto from "crypto";
import os from "os";
import { prisma } from "../index";

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}

export const formRouter = Router();

formRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const { escuelaId, cursoId, materiaId, anioLectivo } = req.body;
    if (!escuelaId || !cursoId || !materiaId) {
      res.status(400).json({ error: "Faltan campos requeridos" });
      return;
    }
    const token = crypto.randomBytes(12).toString("hex");
    const link = await prisma.formLink.create({
      data: { token, escuelaId, cursoId, materiaId, anioLectivo: anioLectivo || new Date().getFullYear() },
    });
    const host = req.get("host") || "";
    const publicIp = getLocalIp();
    const port = host.includes(":") ? host.split(":")[1] : "3001";
    const baseUrl = host.includes("localhost") || host.includes("127.0.0.1")
      ? `http://${publicIp}:${port}`
      : `${req.protocol}://${host}`;
    res.json({ token: link.token, url: `${baseUrl}/form/${link.token}` });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Error al generar formulario" });
  }
});

formRouter.post("/submit", async (req: Request, res: Response) => {
  try {
    const { token, apellido, nombre } = req.body;
    if (!token || !apellido || !nombre) {
      res.status(400).json({ error: "Faltan campos requeridos" });
      return;
    }
    const link = await prisma.formLink.findUnique({ where: { token } });
    if (!link) {
      res.status(404).json({ error: "Formulario no encontrado o expirado" });
      return;
    }
    const fullName = `${apellido.toUpperCase().trim()}, ${nombre.toUpperCase().trim()}`;
    const exists = await prisma.alumno.findFirst({
      where: {
        apellidoNombre: fullName,
        escuelaId: link.escuelaId,
        cursoId: link.cursoId,
        materiaId: link.materiaId,
        anioLectivo: link.anioLectivo,
      },
    });
    if (exists) {
      res.json({ success: true, duplicado: true, message: "Alumno ya registrado" });
      return;
    }
    await prisma.alumno.create({
      data: {
        apellidoNombre: fullName,
        escuelaId: link.escuelaId,
        cursoId: link.cursoId,
        materiaId: link.materiaId,
        anioLectivo: link.anioLectivo,
      },
    });
    res.json({ success: true, duplicado: false, message: "Alumno agregado correctamente" });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Error al registrar alumno" });
  }
});

formRouter.get("/poll/:token", async (req: Request, res: Response) => {
  try {
    const link = await prisma.formLink.findUnique({ where: { token: req.params.token } });
    if (!link) {
      res.status(404).json({ error: "Formulario no encontrado" });
      return;
    }
    const count = await prisma.alumno.count({
      where: {
        escuelaId: link.escuelaId,
        cursoId: link.cursoId,
        materiaId: link.materiaId,
        anioLectivo: link.anioLectivo,
      },
    });
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Error al obtener conteo" });
  }
});

formRouter.get("/exists/:token", async (req: Request, res: Response) => {
  try {
    const link = await prisma.formLink.findUnique({ where: { token: req.params.token } });
    res.json({ exists: !!link });
  } catch {
    res.json({ exists: false });
  }
});