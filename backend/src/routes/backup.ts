import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";

export const backupRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const DB_PATH = path.resolve(__dirname, "..", "..", "prisma", "escuela.db");

backupRouter.get("/export-db", async (_req: Request, res: Response) => {
  try {
    if (!fs.existsSync(DB_PATH)) { res.status(404).json({ error: "Base de datos no encontrada" }); return; }
    res.download(DB_PATH, `backup_${new Date().toISOString().slice(0, 10)}.db`);
  } catch (error) {
    res.status(500).json({ error: "Error al exportar base de datos" });
  }
});

backupRouter.post("/import-db", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No se subió ningún archivo" }); return; }
    fs.writeFileSync(DB_PATH, req.file.buffer as any);
    res.json({ success: true, message: "Base de datos restaurada. Reiniciá el servidor." });
  } catch (error) {
    res.status(500).json({ error: "Error al importar base de datos" });
  }
});
