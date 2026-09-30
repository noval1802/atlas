import { PrismaClient, OperationalStatus, RecordStatus, UserRole } from "@prisma/client";
import { kodams } from "../src/data/kodam";
import { alerts, incidents } from "../src/data/dashboard";
import { moduleData } from "../src/data/modules";
import { reports } from "../src/data/reports";
const prisma = new PrismaClient();
async function main() {
  for (const k of kodams)
    await prisma.kodam.upsert({
      where: { code: k.code },
      update: {
        slug: k.id,
        name: k.name,
        region: k.region,
        location: k.location,
        latitude: k.latitude,
        longitude: k.longitude,
        status: k.status as OperationalStatus,
        personnel: k.personnel,
        incidentCount: k.incidents,
        deployed: k.deployed,
      },
      create: {
        slug: k.id,
        code: k.code,
        name: k.name,
        region: k.region,
        location: k.location,
        latitude: k.latitude,
        longitude: k.longitude,
        status: k.status as OperationalStatus,
        personnel: k.personnel,
        incidentCount: k.incidents,
        deployed: k.deployed,
      },
    });
  for (const incident of incidents) {
    const kodam = await prisma.kodam.findFirstOrThrow({ where: { name: incident.kodam } });
    await prisma.incident.upsert({
      where: { id: incident.id },
      update: {
        kodamId: kodam.id,
        category: incident.category,
        title: `${incident.category} - ${incident.location}`,
        description: incident.description,
        location: incident.location,
        latitude: incident.latitude,
        longitude: incident.longitude,
        incidentTime: incident.time,
        status: incident.status as OperationalStatus,
        personnel: incident.personnel,
      },
      create: {
        id: incident.id,
        kodamId: kodam.id,
        category: incident.category,
        title: `${incident.category} - ${incident.location}`,
        description: incident.description,
        location: incident.location,
        latitude: incident.latitude,
        longitude: incident.longitude,
        incidentDate: new Date(`2026-08-22T${incident.time}:00+07:00`),
        incidentTime: incident.time,
        status: incident.status as OperationalStatus,
        personnel: incident.personnel,
      },
    });
  }
  for (const alert of alerts) {
    await prisma.alert.upsert({
      where: { id: alert.id },
      update: {
        level: alert.level,
        title: alert.title,
        message: alert.detail,
        kodam: alert.kodam,
        metric: alert.metric,
        status: alert.status,
      },
      create: {
        id: alert.id,
        level: alert.level,
        title: alert.title,
        message: alert.detail,
        kodam: alert.kodam,
        metric: alert.metric,
        status: alert.status,
        createdBy: "seed",
      },
    });
  }
  for (const [module, config] of Object.entries({
    bencana: moduleData.bencana,
    karhutla: moduleData.karhutla,
    unras: moduleData.unras,
  })) {
    for (const [sortOrder, row] of config.rows.entries()) {
      const id = `MON-${module.toUpperCase()}-${String(sortOrder + 1).padStart(2, "0")}`;
      await prisma.operationalRecord.upsert({
        where: { id },
        update: {},
        create: {
          id,
          module,
          primary: row[0],
          secondary: row[1],
          detail: row[2],
          status: row[3],
          sortOrder,
          createdBy: "seed",
        },
      });
    }
  }
  for (const [index, row] of moduleData.resources.rows.entries()) {
    const kodam = await prisma.kodam.findFirstOrThrow({ where: { name: row[0] } });
    const quantity = Number(row[1].replace(/\D/g, ""));
    const deployed = Number(row[2].replace(/\D/g, ""));
    await prisma.resource.upsert({
      where: { id: `RES-SEED-${String(index + 1).padStart(2, "0")}` },
      update: {},
      create: {
        id: `RES-SEED-${String(index + 1).padStart(2, "0")}`,
        kodamId: kodam.id,
        type: "PERSONEL",
        name: "Kekuatan Personel",
        quantity,
        deployed,
        status: row[3],
        createdBy: "seed",
      },
    });
  }
  for (const report of reports) {
    const kodam =
      report.kodam === "Nasional" ? null : await prisma.kodam.findFirst({ where: { name: report.kodam } });
    await prisma.report.upsert({
      where: { id: report.id },
      update: {},
      create: {
        id: report.id,
        kodamId: kodam?.id,
        type: report.type,
        title: report.title,
        reportDate: new Date("2026-08-22T08:00:00+07:00"),
        content: { summary: report.description ?? report.title, image: report.image },
        status: report.status as RecordStatus,
        createdBy: "seed",
        approvedBy: report.status === "PUBLISHED" ? "seed" : null,
        publishedAt: report.status === "PUBLISHED" ? new Date("2026-08-22T09:00:00+07:00") : null,
      },
    });
  }
  await prisma.user.upsert({
    where: { username: "admin.pusdalops" },
    update: { role: UserRole.ADMIN, password: null },
    create: { name: "Admin Pusdalops", username: "admin.pusdalops", password: null, role: UserRole.ADMIN },
  });
}
main().finally(() => prisma.$disconnect());
