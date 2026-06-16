import { Router, Request, Response } from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { prisma } from "../index";
import { mapAlumno } from "./alumnos";

export const importExportRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const EXPORTS_DIR = path.join(__dirname, "..", "..", "exports");
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

importExportRouter.post("/import-excel", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No se subió ningún archivo" }); return; }
    const { cursoId, materiaId, escuelaId } = req.body;
    if (!cursoId || !materiaId || !escuelaId) {
      res.status(400).json({ error: "cursoId, materiaId y escuelaId son obligatorios" });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);
    const worksheet = workbook.worksheets[0];
    const imported: any[] = [];
    const errors: string[] = [];

    function normalizarNombre(valor: string): string {
      const v = valor.trim();
      if (!v) return "";
      if (v.includes(",")) return v;
      const partes = v.split(/\s+/);
      if (partes.length < 2) return v;
      const apellido = partes.pop()!;
      return `${apellido}, ${partes.join(" ")}`;
    }

    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return;
      let raw = (row.getCell(1).value?.toString() || "").trim();
      if (!raw) { errors.push(`Fila ${rowNumber}: falta nombre`); return; }
      const apellidoNombre = normalizarNombre(raw);
      const n1 = parseFloat(row.getCell(2).value?.toString() || "");
      const n2 = parseFloat(row.getCell(3).value?.toString() || "");
      const n3 = parseFloat(row.getCell(4).value?.toString() || "");
      const n4 = parseFloat(row.getCell(5).value?.toString() || "");
      const n5 = parseFloat(row.getCell(6).value?.toString() || "");
      const n6 = parseFloat(row.getCell(7).value?.toString() || "");

      imported.push({
        apellidoNombre,
        nota1: isNaN(n1) ? null : n1,
        nota2: isNaN(n2) ? null : n2,
        nota3: isNaN(n3) ? null : n3,
        nota4: isNaN(n4) ? null : n4,
        nota5: isNaN(n5) ? null : n5,
        nota6: isNaN(n6) ? null : n6,
        escuelaId: parseInt(escuelaId),
        cursoId: parseInt(cursoId),
        materiaId: parseInt(materiaId),
      });
    });

    imported.sort((a, b) => a.apellidoNombre.localeCompare(b.apellidoNombre));
    for (const data of imported) {
      await prisma.alumno.create({ data });
    }

    res.json({ imported: imported.length, errors });
  } catch (error) {
    res.status(500).json({ error: "Error al importar Excel" });
  }
});

importExportRouter.get("/export-excel/:cursoId/:materiaId/:escuelaId", async (req: Request, res: Response) => {
  try {
    const cursoId = parseInt(req.params.cursoId as string);
    const materiaId = parseInt(req.params.materiaId as string);
    const escuelaId = parseInt(req.params.escuelaId as string);
    const alumnos = await prisma.alumno.findMany({ where: { cursoId, materiaId, escuelaId }, orderBy: { apellidoNombre: "asc" } });
    const mapped = await Promise.all(alumnos.map(mapAlumno));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Calificaciones");

    sheet.columns = [
      { header: "Apellido y Nombre", key: "apellidoNombre", width: 30 },
      { header: "Nota 1", key: "nota1", width: 10 },
      { header: "Nota 2", key: "nota2", width: 10 },
      { header: "Nota 3", key: "nota3", width: 10 },
      { header: "Informe 1", key: "informe1", width: 12 },
      { header: "Nota 1° Cuat", key: "nota1C", width: 14 },
      { header: "Nota 4", key: "nota4", width: 10 },
      { header: "Nota 5", key: "nota5", width: 10 },
      { header: "Nota 6", key: "nota6", width: 10 },
      { header: "Informe 2", key: "informe2", width: 12 },
      { header: "Nota 2° Cuat", key: "nota2C", width: 14 },
      { header: "Nota Final", key: "notaFinal", width: 12 },
      { header: "Situación", key: "situacionFinal", width: 15 },
      { header: "Observaciones", key: "observaciones", width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };

    for (const a of mapped) {
      sheet.addRow({
        apellidoNombre: a.apellidoNombre,
        nota1: a.nota1, nota2: a.nota2, nota3: a.nota3,
        informe1: a.informe1, nota1C: a.nota1C,
        nota4: a.nota4, nota5: a.nota5, nota6: a.nota6,
        informe2: a.informe2, nota2C: a.nota2C,
        notaFinal: a.notaFinal, situacionFinal: a.situacionFinal,
        observaciones: a.observaciones || "",
      });
    }

    const fileName = `calificaciones_${cursoId}_${Date.now()}.xlsx`;
    const filePath = path.join(EXPORTS_DIR, fileName);
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, `calificaciones.xlsx`);
  } catch (error) {
    res.status(500).json({ error: "Error al exportar Excel" });
  }
});

importExportRouter.get("/export-pdf/:cursoId/:materiaId/:escuelaId", async (req: Request, res: Response) => {
  try {
    const cursoId = parseInt(req.params.cursoId as string);
    const materiaId = parseInt(req.params.materiaId as string);
    const escuelaId = parseInt(req.params.escuelaId as string);
    const alumnos = await prisma.alumno.findMany({ where: { cursoId, materiaId, escuelaId }, orderBy: { apellidoNombre: "asc" } });
    const mapped = await Promise.all(alumnos.map(mapAlumno));

    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

    const fileName = `calificaciones_${cursoId}_${Date.now()}.pdf`;
    const filePath = path.join(EXPORTS_DIR, fileName);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(16).text("Planilla de Calificaciones", { align: "center" });
    doc.moveDown();

    const headers = ["Apellido y Nombre", "N1", "N2", "N3", "Inf1", "1°C", "N4", "N5", "N6", "Inf2", "2°C", "NF", "Sit."];
    const colWidths = [80, 25, 25, 25, 28, 28, 25, 25, 25, 28, 28, 28, 40];
    const tableTop = doc.y;
    let x = 30;

    doc.fontSize(8).font("Helvetica-Bold");
    headers.forEach((h, i) => {
      doc.text(h, x, tableTop, { width: colWidths[i], align: "center" });
      x += colWidths[i];
    });

    let y = tableTop + 15;
    doc.font("Helvetica").fontSize(8);

    for (const a of mapped) {
      x = 30;
      if (y > 500) {
        doc.addPage();
        y = 30;
        doc.font("Helvetica-Bold");
        x = 30;
        headers.forEach((h, i) => {
          doc.text(h, x, y, { width: colWidths[i], align: "center" });
          x += colWidths[i];
        });
        y += 15;
        doc.font("Helvetica");
      }
      x = 30;
      const row = [a.apellidoNombre, a.nota1 ?? "", a.nota2 ?? "", a.nota3 ?? "", a.informe1 ?? "", a.nota1C ?? "", a.nota4 ?? "", a.nota5 ?? "", a.nota6 ?? "", a.informe2 ?? "", a.nota2C ?? "", a.notaFinal ?? "", a.situacionFinal];
      row.forEach((val: any, i: number) => {
        doc.text(String(val), x, y, { width: colWidths[i], align: "center" });
        x += colWidths[i];
      });
      y += 14;
    }

    doc.end();

    stream.on("finish", () => {
      res.download(filePath, `calificaciones.pdf`);
    });
  } catch (error) {
    res.status(500).json({ error: "Error al exportar PDF" });
  }
});
