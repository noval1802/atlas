"use client";
import { Download } from "lucide-react";
import { useState } from "react";
import type { ReportData } from "@/data/reports";
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
export function DownloadReportButton({ report }: { report: ReportData }) {
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      pdf.setFillColor(6, 11, 22);
      pdf.rect(0, 0, 210, 297, "F");
      pdf.setTextColor(34, 211, 238);
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.text("ATLAS", 18, 22);
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("ADVANCED TACTICAL LOCATION & ANALYTICS SYSTEM", 18, 28);
      pdf.setDrawColor(30, 41, 59);
      pdf.line(18, 34, 192, 34);
      pdf.setTextColor(238, 244, 255);
      pdf.setFontSize(17);
      pdf.setFont("helvetica", "bold");
      pdf.text(report.title, 18, 48, { maxWidth: 174 });
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(148, 163, 184);
      pdf.text(`ID: ${report.id}  |  Tanggal: ${report.date}  |  Wilayah: ${report.kodam}`, 18, 58);
      pdf.setTextColor(52, 211, 153);
      pdf.text(`STATUS: ${report.status}`, 18, 65);
      let y = 76;
      if (report.description) {
        pdf.setTextColor(203, 213, 225);
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(report.description, 174);
        pdf.text(lines, 18, y);
        y += lines.length * 5 + 7;
      }
      if (report.image) {
        const image = await loadImage(report.image);
        const maxW = 120,
          maxH = 125;
        const ratio = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight);
        const width = image.naturalWidth * ratio,
          height = image.naturalHeight * ratio;
        pdf.setTextColor(34, 211, 238);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("DOKUMENTASI", 18, y);
        y += 6;
        pdf.addImage(image, "PNG", 18, y, width, height);
        y += height + 7;
      }
      pdf.setDrawColor(30, 41, 59);
      pdf.line(18, 278, 192, 278);
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(7);
      pdf.text("Dokumen dihasilkan secara digital oleh ATLAS Command Center", 18, 284);
      pdf.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 192, 284, { align: "right" });
      pdf.save(`${report.id}-${report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={download}
      disabled={busy}
      className="p-2 text-slate-400 hover:text-cyan-300 disabled:opacity-50"
      title="Download PDF"
      aria-label={`Download ${report.title}`}
    >
      <Download size={14} className={busy ? "animate-bounce" : ""} />
    </button>
  );
}
