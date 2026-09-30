import { CloudLightning, Flame, Landmark, Truck, Users, TriangleAlert, Waves } from "lucide-react";
export const moduleData = {
  bencana: {
    module: "bencana",
    eyebrow: "MONITORING BENCANA",
    title: "Bencana Alam",
    description: "Pemantauan kejadian dan respons bencana secara nasional",
    stats: [
      { label: "Total Kejadian", value: "24", icon: CloudLightning },
      { label: "Wilayah Terdampak", value: "17", icon: Landmark },
      { label: "Personel", value: "1.284", icon: Users },
      { label: "Status Siaga", value: "3", icon: TriangleAlert },
    ],
    rows: [
      ["Banjir", "Makassar", "3 kecamatan", "WASPADA"],
      ["Gempa M 4,2", "Jayapura", "Tidak ada kerusakan", "KONDUSIF"],
      ["Tanah Longsor", "Bogor", "2 akses jalan terdampak", "SIAGA"],
      ["Cuaca Ekstrem", "Semarang", "Angin kencang", "WASPADA"],
    ],
  },
  karhutla: {
    module: "karhutla",
    eyebrow: "MONITORING HOTSPOT",
    title: "Kebakaran Hutan & Lahan",
    description: "Analisis hotspot dan pengerahan sumber daya",
    stats: [
      { label: "Hotspot", value: "16", icon: Flame },
      { label: "Luas Wilayah", value: "21.499,8 Ha", icon: Landmark },
      { label: "Personel", value: "842", icon: Users },
      { label: "Alut", value: "74", icon: Truck },
    ],
    rows: [
      ["Riau", "7 hotspot", "340 personel", "SIAGA"],
      ["Kalimantan Timur", "4 hotspot", "190 personel", "WASPADA"],
      ["Jawa Barat", "3 hotspot", "172 personel", "WASPADA"],
      ["Sumatera Selatan", "2 hotspot", "140 personel", "KONDUSIF"],
    ],
  },
  unras: {
    module: "unras",
    eyebrow: "MONITORING KEGIATAN",
    title: "Unjuk Rasa",
    description: "Pemantauan kegiatan, massa, tuntutan, dan situasi lapangan",
    stats: [
      { label: "Total Kegiatan", value: "12", icon: Landmark },
      { label: "Estimasi Massa", value: "3.840", icon: Users },
      { label: "Lokasi Aktif", value: "8", icon: Waves },
      { label: "Personel", value: "1.120", icon: Users },
    ],
    rows: [
      ["Jakarta Pusat", "08:20", "Aliansi Pekerja", "WASPADA", "", "", "", "", "", "1200", "360"],
      ["Bandung", "10:00", "Forum Mahasiswa", "KONDUSIF", "", "", "", "", "", "840", "240"],
      ["Surabaya", "13:30", "Serikat Transportasi", "WASPADA", "", "", "", "", "", "1000", "300"],
      ["Makassar", "15:00", "Koalisi Masyarakat", "KONDUSIF", "", "", "", "", "", "800", "220"],
    ],
  },
  resources: {
    module: "resources",
    eyebrow: "KESIAPAN OPERASIONAL",
    title: "Personel & Alut",
    description: "Ketersediaan, pengerahan, dan status sumber daya",
    stats: [
      { label: "Personel Tersedia", value: "62.400", icon: Users },
      { label: "Dikerahkan", value: "8.920", icon: Users },
      { label: "Alut Tersedia", value: "1.284", icon: Truck },
      { label: "Dalam Operasi", value: "342", icon: Truck },
    ],
    rows: [
      ["Kodam Jaya", "4.120 personel", "680 dikerahkan", "SIAP"],
      ["Kodam III/SLW", "4.300 personel", "780 dikerahkan", "OPERASI"],
      ["Kodam VI/MLW", "2.950 personel", "610 dikerahkan", "OPERASI"],
      ["Kodam XIV/HSN", "3.350 personel", "560 dikerahkan", "SIAP"],
    ],
  },
};
