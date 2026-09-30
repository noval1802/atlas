export interface ReportData {
  id: string;
  type: string;
  title: string;
  date: string;
  kodam: string;
  status: string;
  description?: string;
  image?: string;
}
export const reports: ReportData[] = [
  {
    id: "RPT-TEST-01",
    type: "Laporan Dokumentasi",
    title: "Laporan Uji Fitur Download",
    date: "22 Agu 2026",
    kodam: "Nasional",
    status: "PUBLISHED",
    description:
      "Laporan ini dibuat untuk memverifikasi fungsi download PDF ATLAS dengan dokumentasi gambar terlampir.",
    image: "/branding/report-test.png",
  },
  {
    id: "RPT-0822-01",
    type: "Laporan Harian",
    title: "Situasi Nasional 22 Agustus 2026",
    date: "22 Agu 2026",
    kodam: "Nasional",
    status: "PUBLISHED",
  },
  {
    id: "RPT-0822-02",
    type: "BANGSIT",
    title: "Eskalasi Karhutla Jawa Barat",
    date: "22 Agu 2026",
    kodam: "Kodam III/SLW",
    status: "DRAFT",
  },
  {
    id: "RPT-0821-04",
    type: "Laporan Bencana",
    title: "Pembaruan Banjir Sulawesi Selatan",
    date: "21 Agu 2026",
    kodam: "Kodam XIV/HSN",
    status: "PUBLISHED",
  },
  {
    id: "RPT-0821-03",
    type: "Laporan Kejadian",
    title: "Monitoring Unras Jakarta Pusat",
    date: "21 Agu 2026",
    kodam: "Kodam Jaya",
    status: "ARCHIVED",
  },
];
