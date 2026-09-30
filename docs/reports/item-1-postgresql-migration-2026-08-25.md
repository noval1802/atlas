# Report Item 1 — Migrasi Data Monitoring ke PostgreSQL

Tanggal: 25 Agustus 2026

## Hasil

Item 1 selesai untuk Bencana Alam, Karhutla, Unras, Kejadian, dan Data Kodam. CRUD UI tidak lagi menggunakan `localStorage`; data dibaca dan ditulis melalui Route Handler terotorisasi ke PostgreSQL.

## Perubahan data

- Model baru `OperationalRecord` menyimpan tiga modul monitoring.
- Model `Kodam` diperluas dengan slug, lokasi, personel, jumlah kejadian, dan personel dikerahkan.
- Model `Incident` yang sudah ada menjadi sumber Incident Manager.
- Seed default dipindahkan ke PostgreSQL dengan ID stabil. `upsert.update` untuk record monitoring sengaja kosong, sehingga menjalankan seed tidak menimpa edit existing. Seed hanya dapat membuat kembali ID default yang sengaja dihapus bila administrator menjalankan `npm run db:seed`; refresh aplikasi tidak menjalankan seed.
- Key `localStorage` lama tidak diimpor otomatis karena browser pertama yang membuka aplikasi tidak boleh menimpa database bersama. Data lama tetap berada di browser tetapi tidak lagi digunakan.

## API baru

- `GET/POST /api/monitoring/{bencana|karhutla|unras}`
- `PUT/DELETE /api/monitoring/{module}/{id}`
- `POST /api/monitoring/{module}/reset`
- `GET /api/kodams`
- `PUT /api/kodams/{id}`
- `POST /api/kodams/reset`

Semua mutasi memakai authentication, permission, validasi Zod, origin check, rate limit, dan audit log. Operator Kodam tetap dibatasi oleh `kodamScope` untuk update Data Kodam.

## UI yang dialihkan

- Monitoring Bencana Alam
- Monitoring Karhutla
- Monitoring Unras
- Incident Manager
- Editor Data Kodam
- Detail Data Kodam
- Marker Kodam pada Dashboard dan Peta Situasi

## Pengujian runtime

| Modul    | Create | Update | Delete | GET setelah delete |
| -------- | -----: | -----: | -----: | -----------------: |
| Bencana  |    201 |    200 |    200 |   record tidak ada |
| Karhutla |    201 |    200 |    200 |   record tidak ada |
| Unras    |    201 |    200 |    200 |   record tidak ada |
| Kejadian |    201 |    200 |    200 |                404 |

Data Kodam XII diubah sementara, terbukti muncul pada GET berikutnya, lalu dikembalikan ke nilai awal. Record pengujian sementara telah dihapus.

Aturan koordinat Kejadian juga diverifikasi: request uji mengirim latitude/longitude `0,0` untuk Kodam XII, sedangkan backend menyimpan `-0.02,109.34` sesuai pusat koordinat Kodam. Record uji kemudian dihapus.

## Batas item 1

- Titik manual dan Map Annotation Store masih menggunakan penyimpanan browser; ini masuk item 2 sinkronisasi Dashboard/Peta.
- Modul Personel & Alut tidak termasuk tiga modul monitoring yang diminta dan tetap memakai penyimpanan lama.
- Dashboard KPI/tabel insiden masih menggunakan data mock; migrasinya masuk item 2.
