# Integrasi Dokumen Nextcloud

## Status Phase 4A–4B

ATLAS memiliki abstraksi `DocumentStorageService` dan implementasi `NextcloudStorageService` berbasis WebDAV. Browser tidak menerima credential Nextcloud; semua request melewati Route Handler ATLAS dan authorization server-side.

```text
Browser → ATLAS API → RBAC + Kodam scope → DocumentStorageService → Nextcloud WebDAV
```

Endpoint awal:

- `GET /api/incidents/{id}/documents` — daftar referensi setelah izin `document:read`.
- `POST /api/incidents/{id}/documents` — upload setelah izin `document:upload` dan scope Kodam.
- `GET /api/incidents/{id}/documents/{documentId}` — download proxy setelah authorization ulang.

Format upload saat ini dibatasi ke PDF, PNG, JPEG, dan PPTX dengan batas default 25 MiB. Nama/path dinormalisasi dan traversal `..` ditolak. File disimpan pada pola `PUSDALOPS/KODAM_{KODE_AMAN}/KEJADIAN/{INCIDENT_ID}/{FILENAME}`; contoh `XII/TPR` menjadi `KODAM_XII_TPR`.

Halaman `/kejadian/{id}` menyediakan panel **Dokumen Terkait**. Daftar dan download mengikuti permission `document:read`, sementara input upload hanya tampil bagi role dengan `document:upload`. Route Handler selalu mengulang pemeriksaan permission dan scope; menyembunyikan tombol pada UI bukan batas keamanan utama.

## Credential

Akun teknis `atlas-service` tidak berada pada grup operasional. ATLAS menyimpan app password yang dapat dicabut di `.env.local`, bukan password user/IdP. Secret tidak dikirim ke client atau dicatat ke log.

Untuk mencabut akses, hapus token milik `atlas-service` melalui `occ user:auth-tokens:list/delete`, lalu hapus atau ganti `NEXTCLOUD_SERVICE_APP_PASSWORD` di ATLAS.

## Hasil verifikasi Phase 4B

- Koneksi PROPFIND WebDAV telah lulus.
- Tabel `DocumentReference` sudah diterapkan secara non-destruktif.
- Upload `test.png` ke kejadian uji `INC-0822-07` berhasil dengan HTTP 201.
- Download proxy berhasil dengan HTTP 200 dan checksum SHA-256 identik dengan file sumber.
- Operator Kodam XII memperoleh HTTP 200 untuk scope `XII/TPR` dan HTTP 403 untuk kejadian Kodam III.

Share/folder permission langsung pada grup Nextcloud belum diaktifkan. Saat ini batas akses ditegakkan oleh ATLAS dan file dimiliki akun teknis. Provisioning grup harus mengikuti migrasi eksplisit agar grup serta file existing tidak berubah secara tidak sengaja.
