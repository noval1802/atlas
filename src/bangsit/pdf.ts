import { jsPDF } from "jspdf";
import type { BangsitArchiveInput } from "./schema";

export function generateBangsitPdf(reportId: string, input: BangsitArchiveInput): Uint8Array {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setFillColor(6, 11, 22);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setTextColor(34, 211, 238);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text("ATLAS", 18, 22);
  pdf.setTextColor(148, 163, 184);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("LAPORAN SITUASI DIGITAL / BANGSIT", 18, 28);
  pdf.setDrawColor(30, 41, 59);
  pdf.line(18, 34, 192, 34);
  pdf.setTextColor(238, 244, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(`${input.eventType.toUpperCase()} - ${input.location.toUpperCase()}`, 18, 47, { maxWidth: 174 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`ID: ${reportId}`, 18, 60);
  pdf.text(`Kodam: ${input.kodam}`, 18, 67);
  pdf.text(`Waktu: ${input.date} ${input.time} WIB`, 18, 74);
  pdf.setTextColor(52, 211, 153);
  pdf.text(`STATUS: ${input.status}`, 18, 82);
  pdf.setTextColor(203, 213, 225);
  pdf.setFont("helvetica", "bold");
  pdf.text("RINGKASAN OPERASIONAL", 18, 96);
  pdf.setFont("helvetica", "normal");
  const summary = [
    `Koordinat: ${input.latitude}, ${input.longitude}`,
    `Personel: ${input.personnel}`,
    `${input.eventType === "Karhutla" ? "Hotspot" : input.eventType === "Unras" ? "Estimasi massa" : "Terdampak"}: ${input.crowd}`,
    `${input.eventType === "Unras" ? "Organisasi" : "Alut"}: ${input.alut || "-"}`,
  ];
  pdf.text(summary, 18, 104, { lineHeightFactor: 1.6 });
  pdf.setFont("helvetica", "bold");
  pdf.text("KRONOLOGI", 18, 135);
  pdf.setFont("helvetica", "normal");
  pdf.text(pdf.splitTextToSize(input.chronology, 174), 18, 143, { lineHeightFactor: 1.5 });
  pdf.setDrawColor(30, 41, 59);
  pdf.line(18, 278, 192, 278);
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(7);
  pdf.text("Dokumen dihasilkan dan diarsipkan oleh ATLAS Command Center", 18, 284);
  return new Uint8Array(pdf.output("arraybuffer"));
}
