import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { jsPDF } from "jspdf";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const image = readFileSync(resolve(root, "public/branding/report-test.png"));
const pdf = new jsPDF({ unit: "mm", format: "a4" });
pdf.setFillColor(6, 11, 22);
pdf.rect(0, 0, 210, 297, "F");
pdf.setTextColor(34, 211, 238);
pdf.setFont("helvetica", "bold");
pdf.setFontSize(22);
pdf.text("ATLAS", 18, 22);
pdf.setFontSize(8);
pdf.setTextColor(148, 163, 184);
pdf.text("ADVANCED TACTICAL LOCATION & ANALYTICS SYSTEM", 18, 28);
pdf.setDrawColor(30, 41, 59);
pdf.line(18, 34, 192, 34);
pdf.setTextColor(238, 244, 255);
pdf.setFontSize(17);
pdf.text("Laporan Uji Fitur Download", 18, 48);
pdf.setFont("helvetica", "normal");
pdf.setFontSize(9);
pdf.setTextColor(148, 163, 184);
pdf.text("ID: RPT-TEST-01  |  Tanggal: 22 Agu 2026  |  Wilayah: Nasional", 18, 58);
pdf.setTextColor(52, 211, 153);
pdf.text("STATUS: PUBLISHED", 18, 65);
pdf.setTextColor(203, 213, 225);
pdf.setFontSize(10);
pdf.text(
  pdf.splitTextToSize(
    "Laporan ini dibuat untuk memverifikasi fungsi download PDF ATLAS dengan dokumentasi gambar terlampir.",
    174,
  ),
  18,
  77,
);
pdf.setTextColor(34, 211, 238);
pdf.setFont("helvetica", "bold");
pdf.setFontSize(9);
pdf.text("DOKUMENTASI", 18, 94);
pdf.addImage(image, "PNG", 18, 100, 110, 106);
pdf.setDrawColor(30, 41, 59);
pdf.line(18, 278, 192, 278);
pdf.setTextColor(100, 116, 139);
pdf.setFontSize(7);
pdf.text("Dokumen dihasilkan secara digital oleh ATLAS Command Center", 18, 284);
const output = resolve(root, "public/downloads/ATLAS-laporan-uji.pdf");
mkdirSync(resolve(root, "public/downloads"), { recursive: true });
writeFileSync(output, Buffer.from(pdf.output("arraybuffer")));
console.log(output);
