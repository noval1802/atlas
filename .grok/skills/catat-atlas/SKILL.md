---
name: catat-atlas
description: >
  Catat setiap perubahan, penambahan fitur, perbaikan, dan semua baris error
  ATLAS, Keycloak, serta database ke docs/MIGRASI.md di dalam folder ATLAS
  pada sesi yang sama. Use when mengerjakan ATLAS, Keycloak, Nexops, catatan
  migrasi, README Project, error layanan, atau perintah /catat-atlas.
---

# Catat sesi ATLAS

Catatan yang ditentukan adalah `docs/MIGRASI.md` di root repositori ATLAS. Di mesin ini path-nya `/home/localhost/Project/atlas/docs/MIGRASI.md`, bagian `## Riwayat sesi`. Jangan membuat file catatan lain. Jangan menimpa entri lama. Tambahkan entri baru di bawah entri terakhir.

Lakukan ini sebelum balasan akhir pada sesi yang mengubah kode atau konfigurasi, menambah fitur, memperbaiki error, atau menemukan baris error layanan. Pertanyaan yang tidak mengubah apa pun dan tidak menghasilkan baris error baru tidak perlu dicatat.

## Langkah

1. Jalankan `bash scripts/catat-sesi.sh` dari root repositori ATLAS. Di mesin ini: `bash /home/localhost/Project/atlas/scripts/catat-sesi.sh`.
2. Tulis satu entri dengan waktu lokal. Isi yang tidak ada ditulis `tidak ada`.
3. Tempel keluaran skrip apa adanya di bawah judul `Error layanan`. Jangan meringkas atau membuang baris error. Password, secret, dan token sudah disamarkan skrip. Jangan menulis ulang nilai aslinya.
4. Setelah entri tersimpan, jalankan skrip yang sama dengan argumen `mark`.

## Bentuk entri

```markdown
### YYYY-MM-DD HH:MM — judul singkat

- Perubahan: ...
- Fitur: ...
- Perbaikan: ...
- Error layanan:

(keluaran skrip)
```
