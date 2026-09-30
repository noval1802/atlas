# Role dan Group Mapping

## Role ATLAS

| Role                 | Lingkup utama                                     |
| -------------------- | ------------------------------------------------- |
| `SUPER_ADMIN`        | Seluruh konfigurasi dan data                      |
| `ADMIN`              | Seluruh fungsi operasional dan administrasi ATLAS |
| `OPERATOR_PUSDALOPS` | Operasi nasional, tanpa administrasi pengguna     |
| `OPERATOR_KODAM`     | Operasi hanya pada Kodam di `kodamScope`          |
| `ANALYST`            | Baca dan ekspor laporan                           |
| `PIMPINAN`           | Baca dashboard/data/laporan                       |

Pemetaan berada di `src/auth/group-mapping.ts`; matriks izin berada di `src/auth/permissions.ts`. Urutan grup menggunakan privilege tertinggi lebih dahulu.

## Grup IdP standar

| Grup IdP                    | Role ATLAS           |
| --------------------------- | -------------------- |
| `/atlas/super-admin`        | `SUPER_ADMIN`        |
| `/atlas/admin`              | `ADMIN`              |
| `/atlas/operator-pusdalops` | `OPERATOR_PUSDALOPS` |
| `/atlas/operator-kodam`     | `OPERATOR_KODAM`     |
| `/atlas/analyst`            | `ANALYST`            |
| `/atlas/pimpinan`           | `PIMPINAN`           |

Claim `kodam_scope` menerima string atau array kode Kodam. Alternatifnya, grup `/kodam/KODAM-XII` menghasilkan scope `KODAM-XII`. Penamaan harus disamakan dengan nilai `Kodam.code` di database.

Pengguna valid tanpa grup ATLAS mendapat fallback read-only `PIMPINAN`; kebijakan IdP production sebaiknya menolak assignment yang tidak eksplisit.

## Aturan backend

Permission dan scope diperiksa terpisah. `OPERATOR_KODAM` dengan izin tulis tetap menerima HTTP 403 ketika resource berada di luar scope. Filter daftar juga diterapkan di query database, bukan hanya disembunyikan pada UI.
