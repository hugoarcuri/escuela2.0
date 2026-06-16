import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const escuela1 = await prisma.escuela.create({
    data: { nombre: "ESCUELA TÉCNICA N° 6 - LA MATANZA" },
  });

  const escuela2 = await prisma.escuela.create({
    data: { nombre: "ESCUELA TÉCNICA N° 6 - MORÓN" },
  });

  const cursosData = [
    { anio: 4, division: "5", turno: "Mañana", escuelaId: escuela1.id },
    { anio: 4, division: "2", turno: "Mañana", escuelaId: escuela1.id },
    { anio: 4, division: "6", turno: "Mañana", escuelaId: escuela1.id },
    { anio: 5, division: "5", turno: "Mañana", escuelaId: escuela1.id },
    { anio: 6, division: "2", turno: "Mañana", escuelaId: escuela1.id },
    { anio: 6, division: "5", turno: "Mañana", escuelaId: escuela1.id },
    { anio: 5, division: "5", turno: "Mañana", escuelaId: escuela2.id },
  ];

  const cursos = [];
  for (const c of cursosData) {
    const curso = await prisma.curso.create({
      data: {
        nombre: `${c.anio}° ${c.division}`,
        anio: c.anio,
        division: c.division,
        turno: c.turno,
        escuelaId: c.escuelaId,
      },
    });
    cursos.push(curso);
  }

  const materiasData = [
    { nombre: "Laboratorio de Hardware", cursoId: cursos[0].id },
    { nombre: "Laboratorio de Sistemas Operativos", cursoId: cursos[1].id },
    { nombre: "Laboratorio de Hardware", cursoId: cursos[2].id },
    { nombre: "Laboratorio de Sistemas Operativos", cursoId: cursos[3].id },
    { nombre: "Laboratorio de Sistemas Operativos", cursoId: cursos[4].id },
    { nombre: "Laboratorio de Sistemas Operativos", cursoId: cursos[5].id },
    { nombre: "Laboratorio de Hardware", cursoId: cursos[6].id },
    { nombre: "Laboratorio de Sistemas Operativos", cursoId: cursos[6].id },
  ];

  for (const m of materiasData) {
    await prisma.materia.create({ data: m });
  }

  console.log("Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
