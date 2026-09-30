# ATLAS — catatan sistem dan panduan migrasi

Disusun: **30 September 2026**

Dokumen ini menggabungkan empat brief asli dan mencocokkannya dengan kode serta layanan yang benar-benar berjalan pada tanggal di atas. Empat brief itu tetap disimpan sebagai arsip permintaan, bukan sebagai status terkini:

| Brief asli | Isi |
|---|---|
| `ATLAS.txt` | Spesifikasi MVP command center: menu, dashboard, peta, BANGSIT, role, dan skema data. |
| `Atlas & NextCloud.txt` | Rencana satu identitas untuk ATLAS dan Nextcloud, RBAC, scope Kodam, dan arsip dokumen. |
| `Tambahkan fitur Dynamic.txt` | Peta situasi: marker, garis penghubung, kartu keterangan, drag, filter, dan ekspor. |
| `README-AUDIT-ATLAS.md` | Audit 29 Agustus 2026 yang membandingkan brief dengan kode pada saat itu. |

Audit 29 Agustus menyatakan integrasi Nextcloud selesai dan proxy sehat di IP LAN lama. Itu tidak lagi berlaku. Perubahan setelah audit dicatat di bagian [Riwayat yang wajib dibawa saat migrasi](#riwayat-yang-wajib-dibawa-saat-migrasi).

Nama sistem: **ATLAS — Advanced Tactical Location & Analytics System**. Tagline yang diminta di brief: *Integrated Situational Awareness & Operational Analytics Platform*.

## Keputusan yang sedang berlaku

ATLAS adalah aplikasi operasional. Nextcloud (folder dan layanan bernama Nexops) adalah aplikasi dokumen yang **berdiri sendiri**. Keduanya tidak lagi saling memanggil.

- Data kejadian, Kotamaops, laporan, pengguna, dan audit ada di PostgreSQL ATLAS.
- File kejadian dan PDF BANGSIT yang baru disimpan di disk ATLAS (`DOCUMENT_STORAGE_DIR`), bukan lewat WebDAV.
- Login ATLAS memakai Keycloak realm `atlas`. Password tidak dibaca dari database Nextcloud.
- Nextcloud boleh tetap hidup untuk arsipnya sendiri. Mematikan atau memindahkan Nextcloud tidak menghapus database ATLAS.

Kolom database `nextcloudFileId` masih ada. Nama itu warisan. Isinya sekarang hash berkas lokal, bukan ID file Nextcloud.

## Peta folder — ini yang paling mudah salah saat pindah server

Ada dua pohon folder. Jangan menganggap keduanya sama.

| Path | Peran pada 30 September 2026 |
|---|---|
| `/home/localhost/Project/atlas` | **Sumber kode ATLAS yang dipakai container.** Compose, Dockerfile, env, sertifikat, dan skrip ada di sini. |
| `/home/localhost/identity` | **Keycloak yang sedang berjalan.** Bukan di dalam `Project/`. Realm, `.env`, dan data PostgreSQL Keycloak ada di sini. |
| `/home/localhost/nexops` | **Data Nextcloud yang sedang di-mount container.** Hanya `data/` dan `db/`. Tidak ada `docker-compose.yml`. |
| `/home/localhost/Project/nexops` | Salinan lain: compose, skrip, branding, plus `data/` dan `db/` sendiri. Bukan folder yang sedang dilayani container. |
| `/home/localhost/atlas` | Sisa deploy lama. `deploy/nginx.conf` di sini berupa **folder kosong**, bukan file. Proxy yang dulu diikat ke path ini gagal start. Jangan dipakai lagi. |

Volume Docker yang menyimpan data ATLAS:

| Volume | Isi |
|---|---|
| `atlas_atlas_postgres_data` | Database PostgreSQL aplikasi ATLAS. |
| `atlas_atlas_kodam_uploads` | Logo Kotamaops dan arsip dokumen di `/app/uploads`. |

Data Nextcloud yang hidup ada di bind mount `/home/localhost/nexops/data` dan `/home/localhost/nexops/db`, bukan di volume bernama.

## Layanan yang hidup

Dicek 30 September 2026. Health aplikasi: `{"status":"ok","database":"connected"}`.

| Layanan | Container | Alamat | Catatan |
|---|---|---|---|
| ATLAS | `atlas-app` | `127.0.0.1:3000`, pintu publik `https://192.168.2.132` | Hanya jaringan `atlas_default`. |
| Proxy | `atlas-proxy` | `80` dan `443` | Nginx memakai `Project/atlas/deploy/nginx.conf` dan sertifikat untuk IP `192.168.2.132`. |
| Realtime | `atlas-realtime` | internal `3001` | WebSocket lewat proxy di path `/ws`. |
| PostgreSQL ATLAS | `atlas-postgres` | `127.0.0.1:5432` | Postgres 16. |
| Keycloak | `atlas-keycloak` | `http://192.168.2.132:8080` | Keycloak 26.7.1, perintah `start-dev`. Realm `atlas`. |
| Database Keycloak | `atlas-keycloak-db` | internal | Postgres 16, data di `/home/localhost/identity/data/postgres`. |
| Nextcloud | `nexops-app-1` | `http://127.0.0.1:8081` | Nextcloud 31.0.14. Tidak dipakai ATLAS. |
| MariaDB dan Redis | `nexops-db-1`, `nexops-redis-1` | internal | Hanya untuk Nextcloud. |

Membuka `http://127.0.0.1:3000/login` dialihkan ke `https://192.168.2.132/login`. Sertifikat ditandatangani sendiri. Browser menampilkan peringatan; itu diharapkan untuk sertifikat LAN ini.

Akun uji ada di `Project/atlas/CREDENTIALS.local.txt`. Jangan menyalin password ke dokumen lain. Username aplikasi: `atlas_admin`, `operator_xii` (scope Kodam XII/TPR), `pimpinan`. Login development dimatikan (`ENABLE_DEV_LOGIN=false`) karena `NODE_ENV=production`.

### Isi database saat catatan ini dibuat

| Data | Jumlah |
|---|---|
| Kotamaops | 22, termasuk Kodaeral V di luar 21 Kodam pada brief awal |
| Kejadian | 12 |
| Catatan operasional bencana / karhutla / unras | 4 / 6 / 6 |
| Early warning | 3 |
| Laporan | 5 |
| Arsip BANGSIT | 1 metadata |
| Titik peta (`MapPoint`) | 0 |
| Referensi dokumen | 0 |
| Offset layout anotasi | 0 |

Contoh data bencana yang masih ada: Gempa M 4,2 di Jayapura, banjir Makassar, longsor Bogor, cuaca ekstrem Semarang. Gempa bukan menu sendiri. Gempa masuk di Bencana Alam dan di daftar Kejadian.

PDF dari satu arsip BANGSIT lama (`PUSDALOPS/KODAM_XII_TPR/BANGSIT/2026/08/BANGSIT-20260824-1030-XII-TPR.pdf`) tidak ditemukan di data Nextcloud yang terpasang. Metadata-nya tetap di PostgreSQL. Unduhan arsip itu kosong sampai PDF dibuat ulang dari halaman BANGSIT.

## Stack yang terpasang

Brief meminta Next.js, React, TypeScript, Tailwind, shadcn/ui, Lucide, Recharts, MapLibre atau Leaflet, API Next.js, PostgreSQL, dan Prisma. Yang terpasang:

| Bagian | Kenyataan |
|---|---|
| Aplikasi | Next.js 16.3.2 App Router, React 19.2.8, TypeScript |
| Gaya | Tailwind. Komponen UI ditulis sendiri, bukan paket shadcn. |
| Ikon dan grafik | Lucide, Recharts |
| Peta | Leaflet 1.9.4 dan react-leaflet, bukan MapLibre |
| Auth | NextAuth 4.24 dengan provider OIDC ke Keycloak |
| Data | Prisma 6, PostgreSQL 16. Koordinat berupa `Float`. PostGIS tidak dipasang. |
| Validasi | Zod |
| PDF dan ekspor peta | jsPDF, html-to-image, PPTX dibuat di `src/lib/pptx-map-export.ts` |
| Realtime | Server `ws` di `realtime/server.mjs` |
| Backend terpisah FastAPI | Belum. Seluruh API masih route Next.js. |

Perintah di `Project/atlas`: `npm test`, `npm run lint`, `npm run format:check`, `npm run build`, `npm run db:generate`.

## Fungsi yang sudah ada

### Menu

Sidebar di `src/components/layout/sidebar.tsx`:

1. Dashboard Nasional `/dashboard`
2. Peta Situasi `/map`
3. BANGSIT `/bangsit`
4. Kejadian `/kejadian`
5. Bencana Alam `/bencana`
6. Karhutla `/karhutla`
7. Unras `/unras`
8. Gangguan Keamanan `/security`
9. Personel & Alut `/resources`
10. Early Warning `/alerts`
11. Laporan `/reports`
12. Data Kotamaops `/kodam` dan detail `/kodam/[id]`
13. Akses Saya `/my-access` (tambahan di luar brief awal)
14. Administration `/admin`

Tampilan dark, sidebar bisa dilipat, header punya jam dan status sistem. Halaman utama `/` mengarah ke dashboard.

### Dashboard

- Status situasi nasional dan kartu KPI yang membaca database.
- Peta dengan marker Kodam dan marker kejadian.
- Tabel kejadian terbaru: cari, filter status, urut kolom, halaman 10 baris.
- Panel early warning.
- Grafik kejadian.

Sebagian angka modul operasional masih lewat model generik `OperationalRecord`, bukan satu tabel khusus per jenis bencana.

### Data dan API

Model Prisma: `User`, `Kodam`, `OperationalRecord`, `Incident`, `DocumentReference`, `Alert`, `Resource`, `Report`, `BangsitArchive`, `AuditLog`, `MapAnnotationLayout`, `MapPoint`.

API mencakup kejadian, titik peta, sumber daya, Kotamaops (termasuk unggah logo), pengguna, laporan, alert, dan BANGSIT. Logo Kotamaops tersimpan di volume upload. Otorisasi dicek di server, bukan hanya dengan menyembunyikan tombol. Scope Kodam menolak permintaan lintas wilayah dengan 403.

Role: `SUPER_ADMIN`, `ADMIN`, `OPERATOR_PUSDALOPS`, `OPERATOR_KODAM`, `ANALYST`, `PIMPINAN`. Pemetaan grup Keycloak terpusat di `src/auth/group-mapping.ts`. Pengguna lokal menyimpan metadata aplikasi dan `externalIdentityId`. Password IdP tidak disimpan.

Audit log menyimpan aksi, entitas, nilai lama dan baru, IP, user agent, dan correlation id.

### Peta situasi dinamis

Ini jawaban brief `Tambahkan fitur Dynamic.txt`. Sebagian besar tahap 1 sampai 4 sudah ada di `src/components/map/` dan `src/lib/annotation-layout.ts`.

Yang sudah jalan:

- Marker, kartu keterangan, dan leader line SVG yang mengikuti geser serta zoom peta. Bukan gambar statis.
- Kategori Bencana, Karhutla, dan Unras, dengan warna status.
- Posisi otomatis dan posisi manual, termasuk diagonal.
- Geser kartu (offset disimpan), reset layout, dan auto-arrange dengan deteksi tabrakan sederhana.
- Toggle marker, anotasi, dan garis.
- Filter kategori, Kodam, status, dan tanggal.
- Mode presentasi.
- Cluster sederhana saat zoom jauh.
- Hover yang menonjolkan marker dan kartunya, serta klik untuk detail.
- Ekspor PNG dan PPTX dari halaman peta.
- Invalidasi realtime lewat WebSocket untuk titik peta dan anotasi.
- Tipe `MapAnnotation` di `src/types/map-annotation.ts`.

### BANGSIT dan dokumen

- Form BANGSIT menghasilkan PDF di server ATLAS.
- PDF baru ditulis ke folder `PUSDALOPS/KODAM_.../BANGSIT/tahun/bulan/` di disk ATLAS.
- Pratinjau menampilkan ringkasan dan dapat mengirim titik ke peta.
- Dokumen terkait pada detail kejadian diunggah lewat API ATLAS (PDF, PNG, JPEG, PPTX, batas 25 MB) dan diunduh hanya setelah cek hak akses.

### Keamanan yang sudah dipasang

- HTTPS di proxy, cookie sesi lewat NextAuth, validasi Zod, batas ukuran unggah, dan rate limit mutasi di `src/security/request-security.ts`.
- Path dokumen ditolak jika berisi `..` atau keluar dari root arsip.
- Health check `/api/health` tidak ikut dialihkan ke host kanonik. Halaman lain dialihkan jika header `Host` bukan host di `NEXTAUTH_URL`.

## Yang belum terpenuhi

Ini selisih antara brief dan kode pada 30 September 2026.

| Permintaan | Keadaan | Alasan ini menghambat lanjutan |
|---|---|---|
| Satu login untuk ATLAS dan Nextcloud | Tidak aktif di layanan yang hidup. Aplikasi `user_oidc` tidak terpasang pada Nextcloud yang di-mount. Akun layanan `atlas-service` tidak ada. | Brief menginginkan satu sesi IdP. ATLAS sudah SSO ke Keycloak. Nextcloud yang berjalan masih login lokal. |
| File tetap di Nextcloud, ATLAS hanya menyimpan referensi | Sengaja diubah 29 September 2026. Penyimpanan berpindah ke disk ATLAS. | Migrasi tidak boleh mengembalikan WebDAV kecuali keputusan ini dibatalkan. Dokumen di `docs/integration/document-storage.md` dan `nextcloud-integration.md` masih menggambarkan desain lama. |
| PostGIS | Belum. Koordinat adalah angka biasa. | Query spasial (radius, wilayah, irisan peta) tidak bisa diandalkan di SQL. |
| Backend FastAPI terpisah | Belum. | Seluruh domain masih di dalam proses Next.js. |
| shadcn/ui | Belum sebagai pustaka. | Komponen tidak memakai registry shadcn. Menggantinya sekarang hanya biaya visual. |
| MapLibre | Tidak dipilih. Leaflet yang dipakai. | Jangan menambah MapLibre paralel tanpa alasan. Leader line sudah dihitung untuk Leaflet. |
| Field “Remember me” | Belum. | Bukan penghambat operasi. |
| Search, lonceng notifikasi, dan menu profil di header | Belum menjadi alur lengkap. Logout dan jam ada. | Operator tidak punya pusat notifikasi di header. |
| Filter tanggal, Kodam, dan kategori di Laporan | Belum di UI laporan. | Brief `ATLAS.txt` bagian 18 meminta filter ini. Daftar laporan bisa diunduh, tetapi tidak bisa disaring seperti yang diminta. |
| Tombol Export PNG dan Export PowerPoint di halaman BANGSIT | Masih `disabled`. | Ekspor PNG dan PPTX sudah ada di Peta Situasi, belum di halaman BANGSIT. PDF BANGSIT yang jalan. |
| “Open in Nextcloud” pada dokumen kejadian | Tidak ada, dan tidak relevan setelah pemisahan. | Unduhan lewat ATLAS. |
| Kartu anotasi menampilkan seluruh field khusus | Sebagian masih field generik. | Brief meminta hotspot, luas hektare, organisasi, dan keluarga terdampak sebagai field sendiri. Sebagian nilai masih masuk kolom teks. |
| Cluster peta kelas pustaka | Cluster buatan sendiri berbasis jarak piksel. | Pada jumlah marker besar, kelompok dan pecahannya belum setara pustaka cluster. |
| Realtime ujung ke ujung untuk setiap kejadian | Kanal realtime ada. Tidak setiap perubahan incident mendorong isi kartu tanpa tarik data ulang. | Angka di kartu tidak dijamin berubah sendiri saat operator lain menyimpan. |
| Anotasi di layar sentuh | Belum diuji menyeluruh. | Command center desktop aman. Tablet belum bisa dianggap selesai. |
| Mode ekspor yang menyembunyikan seluruh chrome lalu memotret layout bersih untuk PDF laporan | Ekspor peta ada. Jalur BANGSIT belum memakai mode itu. | Produk laporan presentasi masih terbelah antara dua halaman. |
| Struktur folder nasional Nextcloud `PUSDALOPS/NASIONAL/...` | Tidak dipakai ATLAS lagi. Skrip `Project/nexops/scripts/provision-kodam-folders.sh` masih ada untuk salinan Nextcloud. | Jangan menjalankan skrip itu terhadap data hidup kalau tujuannya hanya meneruskan ATLAS. |
| `atlas-lan-watch.service` pada audit Agustus | Tidak menjadi bagian layanan yang diverifikasi hidup pada 30 September. | IP diganti manual. Jangan berharap IP mengikuti DHCP sendiri. |

## Yang harus dioptimalkan, dan alasannya

Urutan ini untuk server berikutnya. Kerjakan dari atas jika waktu terbatas.

1. **Satukan jalur deploy.** Container ATLAS sekarang dibangun dari `Project/atlas`, Keycloak dari `/home/localhost/identity`, Nextcloud dari `/home/localhost/nexops`, sementara `Project/nexops` dan `/home/localhost/atlas` adalah salinan atau sisa. Satu server baru mudah menjalankan compose yang salah dan membaca database yang salah. Sebelum pindah, putuskan satu direktori untuk tiap layanan dan tulis path itu di catatan instalasi server tujuan.

2. **Jangan jalankan `scripts/sync-lan-address.sh` apa adanya.** Skrip itu menganggap Keycloak ada di `../identity` dan Nextcloud di `../nexops` relatif terhadap folder ATLAS. Dari `Project/atlas` path itu salah: identity tidak ada di `Project/`, dan `Project/nexops` bukan data yang sedang dilayani. Skrip juga membuat ulang Keycloak, mengubah redirect, memanggil `user_oidc` yang tidak terpasang di instance hidup, lalu membangun ulang ATLAS. IP DHCP yang berubah memang memutus HTTPS, tetapi skrip lengkap lebih berbahaya daripada mengganti `NEXTAUTH_URL`, `OIDC_ISSUER`, `IDENTITY_HOST`, sertifikat, dan redirect client `atlas` secara terarah.

3. **Ganti Keycloak `start-dev` sebelum server operasi.** Mode ini memudahkan import realm, tetapi bukan mode yang disiapkan untuk paparan LAN jangka panjang. Hostname, proxy header, dan cadangan database Keycloak perlu dikunci di server tujuan. Realm dan pengguna ada di volume `/home/localhost/identity/data/postgres`. Kehilangan folder itu berarti kehilangan akun uji dan klien OIDC.

4. **Cadangkan dua data store ATLAS secara terpisah.** `pg_dump` dari `atlas-postgres` tidak berisi logo Kotamaops dan PDF. Volume `atlas_atlas_kodam_uploads` harus disalin juga. Sebaliknya, menyalin folder upload tidak membawa kejadian dan hak akses.

5. **Sertifikat dan IP adalah satu paket.** Sertifikat saat ini memuat `IP:192.168.2.132`, `DNS:atlas.local`, dan `DNS:localhost`. `NEXTAUTH_URL` adalah `https://192.168.2.132`. Keycloak menerbitkan issuer `http://192.168.2.132:8080/realms/atlas`. Redirect klien `atlas` hanya `https://192.168.2.132/api/auth/callback/oidc`. Ganti IP tanpa mengganti keempatnya dan browser kembali timeout atau login SSO ditolak.

6. **Proxy harus mem-mount file, bukan folder.** Kegagalan 25 September terjadi karena Docker membuat direktori saat file `nginx.conf` tidak ada, lalu Nginx gagal dengan kode 127. Di server baru, pastikan sumber mount adalah file `Project/atlas/deploy/nginx.conf`.

7. **Rapikan nama kolom `nextcloudFileId` hanya jika migrasi skema direncanakan.** Mengganti nama sekarang tidak mengubah fungsi. Membiarkannya membuat orang berikutnya menyambungkan WebDAV lagi. Tambahkan komentar skema atau rename saat ada migration yang memang diuji.

8. **Lengkapi field kategori di anotasi.** Kartu Karhutla dan Unras masih mencampur angka ke field umum. Operator yang membaca peta tidak melihat hotspot, luas, dan perkiraan massa sebagai data terstruktur, sehingga rekap di brief tidak bisa dihitung ulang dengan andal.

9. **Satukan ekspor.** PNG dan PPTX hidup di peta. PDF hidup di BANGSIT. Tombol di BANGSIT yang disabled membuat operator mengira ekspor rusak. Aktifkan tombol itu dengan memanggil ekspor yang sudah ada, atau hapus tombolnya supaya jalur yang didukung jelas.

10. **Filter laporan.** Tanpa filter tanggal dan Kodam, modul Laporan tidak memenuhi brief dan sulit dipakai saat data bertambah di server baru.

11. **Uji sentuh dan beban marker.** Collision detection dan cluster masih sederhana. Pada layar komando 1920×1080 ini cukup untuk data sekarang (12 kejadian, 0 titik `MapPoint`). Puluhan kartu yang digeser bersamaan belum diukur.

12. **Dokumentasi integrasi di `Project/atlas/docs/integration/` sudah ketinggalan.** Dokumen itu masih menyuruh menyimpan file di Nextcloud dan memakai `cd /home/localhost/atlas`. Pakai README ini sebagai status migrasi. Perbarui dokumen lama hanya setelah path server baru pasti.

## Cara menjalankan di server ini

Dari mesin yang sama dengan kode:

```bash
cd /home/localhost/Project/atlas
docker compose up -d
cd /home/localhost/identity
docker compose up -d
```

Nextcloud, jika masih diperlukan sebagai layanan terpisah, dijalankan dari compose yang mem-mount `/home/localhost/nexops/data` dan `/home/localhost/nexops/db`. Jangan mengganti mount itu ke `Project/nexops/data` tanpa rencana, karena itu database yang berbeda.

Pintu masuk: `https://192.168.2.132/login`.

## Cara memindahkan ke server lain

1. Pasang Docker dan Docker Compose di server tujuan. Salin kode `Project/atlas` tanpa `node_modules` dan tanpa `.next`. File yang wajib ikut: `.env`, `.env.local`, `deploy/nginx.conf`, `deploy/tls/`, `prisma/`, `Dockerfile`, `docker-compose.yml`.
2. Salin `/home/localhost/identity` termasuk `.env`, `realm/`, dan `data/postgres`, atau dump database Keycloak lalu import. Tanpa ini, akun `atlas_admin` tidak ada.
3. Dump PostgreSQL ATLAS dari container `atlas-postgres` database `atlas`, dan arsipkan volume upload (`/app/uploads` di dalam container, atau volume `atlas_atlas_kodam_uploads`).
4. Di server baru, pulihkan dump dan volume, lalu ubah IP di empat tempat pada bagian optimasi nomor 5. Buat ulang sertifikat dengan `ATLAS_LAN_IP=<ip-baru> Project/atlas/scripts/generate-local-tls.sh`.
5. Perbarui redirect klien OIDC `atlas` di Keycloak agar mengarah ke `https://<ip-baru>/api/auth/callback/oidc`.
6. `docker compose up -d` untuk identity, lalu untuk ATLAS. Jangan memakai `--build` yang sekaligus mengubah Nextcloud.
7. Cek `curl -fsS http://127.0.0.1:3000/api/health`, `curl -kfsS https://<ip-baru>/login`, dan issuer Keycloak. Login sekali dengan `atlas_admin`.
8. Nextcloud hanya disalin jika server baru memang membutuhkan arsip lama. Salin `/home/localhost/nexops/data` dan `/home/localhost/nexops/db`, bukan hanya `Project/nexops`, kalau yang diinginkan adalah instance yang sedang hidup.

Yang tidak perlu dibawa untuk ATLAS sendiri: jaringan Docker `nexops_default`, variabel `NEXTCLOUD_*`, dan folder `/home/localhost/atlas`.

## Riwayat yang wajib dibawa saat migrasi

- **Sampai 29 Agustus 2026.** Audit mencatat MVP, SSO, RBAC, peta dinamis, dan integrasi Nextcloud sebagai selesai atau sebagian. IP kanonik saat itu mengikuti LAN yang aktif. Proxy dianggap sehat.
- **25 September 2026.** `atlas-proxy` berhenti. Mount `nginx.conf` di `/home/localhost/atlas/deploy/` menjadi direktori. Port 80 dan 443 tidak mendengarkan.
- **29 September 2026, pemisahan Nextcloud.** Kode penyimpanan pindah dari `src/documents/nextcloud-storage.ts` ke `src/documents/local-storage.ts`. `atlas-app` dikeluarkan dari jaringan `nexops_default`. Env Nextcloud dihapus. Nextcloud 31.0.14 dibiarkan hidup di port 8081. Tes `tests/document-storage.test.ts` ditambah. Uji ujung-ke-ujung tidak lagi membuka Nextcloud.
- **29 September 2026, pintu web.** IP mesin `192.168.2.132` menggantikan `192.168.1.65` pada `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, `OIDC_ISSUER`, `IDENTITY_HOST`, sertifikat, dan redirect Keycloak. Proxy dibuat ulang dari `Project/atlas`. Halaman login HTTPS membalas 200. Nextcloud tidak diubah pada langkah ini.
- **30 September 2026.** Snapshot jumlah data dan daftar layanan di dokumen ini dicatat ulang. Health ATLAS masih `ok`.

## Verifikasi setelah server baru menyala

```bash
docker ps
curl -fsS http://127.0.0.1:3000/api/health
curl -kfsS -o /dev/null -w '%{http_code}\n' https://<ip-lan>/login
curl -fsS http://<ip-lan>:8080/realms/atlas/.well-known/openid-configuration
cd /home/localhost/Project/atlas && npm test
```

Login dianggap berhasil bila browser, setelah menerima peringatan sertifikat, membuka judul **ATLAS Command Center** dan SSO kembali ke dashboard tanpa timeout.

## Riwayat sesi

Bagian ini adalah catatan yang ditentukan. Setiap sesi yang mengubah sistem, menambah fitur, memperbaiki sesuatu, atau menemukan error layanan menambahkan entri baru di bawah entri terakhir. Entri lama tidak ditimpa. Baris error diambil dari `atlas-app`, `atlas-realtime`, `atlas-postgres`, `atlas-proxy`, `atlas-keycloak`, dan `atlas-keycloak-db` lewat `Project/scripts/catat-sesi.sh`. Tugas yang menjalankan aturan ini ada di `~/.grok/skills/catat-atlas/SKILL.md` (`/catat-atlas`).

### 2026-09-30 00:40 — tugas catatan sesi

- Perubahan: aturan catatan sesi dipasang. Skrip `Project/scripts/catat-sesi.sh` mengumpulkan baris error. Skill `catat-atlas` mewajibkan entri baru di bagian ini pada sesi yang sama.
- Fitur: tidak ada fitur aplikasi baru.
- Perbaikan: tidak ada.
- Error layanan:

```text
## atlas-app
tidak ada baris error

## atlas-realtime
tidak ada baris error

## atlas-postgres
tidak ada baris error

## atlas-proxy
tidak ada baris error

## atlas-keycloak
tidak ada baris error

## atlas-keycloak-db
2026-09-24 14:47:39.191 UTC [46] ERROR:  function aurora_version() does not exist at character 8
2026-09-24 14:54:49.735 UTC [253] ERROR:  function aurora_version() does not exist at character 8
2026-09-25 04:50:32.760 UTC [45] ERROR:  function aurora_version() does not exist at character 8
2026-09-29 11:39:52.342 UTC [52] ERROR:  function aurora_version() does not exist at character 8
2026-09-29 16:44:45.463 UTC [6880] ERROR:  function aurora_version() does not exist at character 8

RINGKAS ada baris error sejak 168h
```

### 2026-09-30 00:30 — repositori ATLAS disiapkan untuk GitHub

- Perubahan: `Project/atlas` menjadi repositori Git lokal, komit `34c6d6c`, 215 berkas. `.gitignore` mengizinkan `.env.example` dan mengabaikan log. Catatan migrasi disalin ke `Project/atlas/docs/MIGRASI.md`.
- Fitur: tidak ada fitur aplikasi baru.
- Perbaikan: tidak ada.
- Error layanan:

```text
## atlas-app
tidak ada baris error

## atlas-realtime
tidak ada baris error

## atlas-postgres
tidak ada baris error

## atlas-proxy
tidak ada baris error

## atlas-keycloak
tidak ada baris error

## atlas-keycloak-db
tidak ada baris error

RINGKAS tidak ada baris error baru sejak 2026-09-29T17:22:24Z
```
