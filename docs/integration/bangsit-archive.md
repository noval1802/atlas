# Integrasi Arsip BANGSIT

## Alur aktif

```text
Form BANGSIT
  ├── Map Annotation Store → Peta Situasi
  └── POST /api/bangsit
        ├── authentication + permission + scope Kodam
        ├── validasi payload
        ├── generate PDF server-side
        ├── Nextcloud WebDAV
        ├── BangsitArchive PostgreSQL
        └── AuditLog
```

Pola folder:

```text
PUSDALOPS/KODAM_{KODE_AMAN}/BANGSIT/{TAHUN}/{BULAN}/{REPORT_ID}.pdf
```

Contoh:

```text
PUSDALOPS/KODAM_XII_TPR/BANGSIT/2026/08/BANGSIT-20260824-1030-XII-TPR.pdf
```

## Endpoint

- `GET /api/bangsit` — daftar arsip sesuai role dan scope.
- `POST /api/bangsit` — validasi, generate PDF, arsip Nextcloud, dan simpan referensi.
- `GET /api/bangsit/{id}/download` — download proxy setelah authorization ulang.

Permission yang digunakan adalah `bangsit:read`, `bangsit:create`, dan `bangsit:export`. Operator Kodam hanya dapat membuat, melihat, dan mengunduh arsip dalam scope sendiri. Mengetahui ID arsip tidak melewati pemeriksaan scope.

## Status format

- PDF: aktif dan terarsip ke Nextcloud.
- PNG: belum diimplementasikan; tombol UI dinonaktifkan.
- PPTX: belum diimplementasikan; tombol UI dinonaktifkan.

## Verifikasi 24 Agustus 2026

- Generate Kodam XII: HTTP 201.
- Generate di luar scope (Kodam III): HTTP 403.
- Download melalui ATLAS: HTTP 200, `application/pdf`, PDF 1 halaman.
- Audit `GENERATE_BANGSIT` dan `DOWNLOAD_BANGSIT`: tersimpan.
