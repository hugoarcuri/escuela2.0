import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { escuelasRouter } from "./routes/escuelas";
import { materiasRouter } from "./routes/materias";
import { cursosRouter } from "./routes/cursos";
import { alumnosRouter, loadSettings as loadAlumnoSettings } from "./routes/alumnos";
import { importExportRouter } from "./routes/import-export";
import { settingsRouter } from "./routes/settings";
import { backupRouter } from "./routes/backup";
import { formRouter } from "./routes/form";
import { getFormPage } from "./form-page";

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/escuelas", escuelasRouter);
app.use("/api/cursos", cursosRouter);
app.use("/api/materias", materiasRouter);
app.use("/api/alumnos", alumnosRouter);
app.use("/api", importExportRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/backup", backupRouter);
app.use("/api/form", formRouter);

loadAlumnoSettings();

const exportsDir = path.join(__dirname, "..", "exports");
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });
app.use("/exports", express.static(exportsDir));

// Form pages (public)
app.use(express.urlencoded({ extended: true }));
app.get("/form/:token", async (req, res) => {
  try {
    const link = await prisma.formLink.findUnique({ where: { token: req.params.token } });
    if (!link) { res.status(404).send(getFormPage(req.params.token, "Formulario no encontrado")); return; }
    res.send(getFormPage(req.params.token));
  } catch { res.status(404).send(getFormPage(req.params.token, "Formulario no encontrado")); }
});
app.post("/form/:token", async (req, res) => {
  try {
    const link = await prisma.formLink.findUnique({ where: { token: req.params.token } });
    if (!link) { res.status(404).send(getFormPage(req.params.token, "Formulario no encontrado")); return; }
    const { apellido, nombre } = req.body;
    if (!apellido || !nombre) { res.send(getFormPage(req.params.token, "Completá todos los campos")); return; }
    const fullName = `${apellido.toUpperCase().trim()}, ${nombre.toUpperCase().trim()}`;
    const exists = await prisma.alumno.findFirst({
      where: { apellidoNombre: fullName, escuelaId: link.escuelaId, cursoId: link.cursoId, materiaId: link.materiaId, anioLectivo: link.anioLectivo },
    });
    if (exists) { res.send(getFormPage(req.params.token, undefined, "Ya estás registrado")); return; }
    await prisma.alumno.create({
      data: { apellidoNombre: fullName, escuelaId: link.escuelaId, cursoId: link.cursoId, materiaId: link.materiaId, anioLectivo: link.anioLectivo },
    });
    res.send(getFormPage(req.params.token, undefined, "Alumno agregado correctamente"));
  } catch { res.status(500).send(getFormPage(req.params.token, "Error al registrar")); }
});

const frontendDist = path.resolve(__dirname, "..", "..", "frontend", "dist");
const frontendIndex = path.join(frontendDist, "index.html");
if (fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/exports")) return next();
    res.sendFile(frontendIndex);
  });
  console.log(`[frontend] Serving from ${frontendDist}`);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
