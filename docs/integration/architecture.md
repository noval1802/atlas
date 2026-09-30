# Arsitektur Integrasi ATLAS dan Nextcloud

## Kondisi hasil audit

ATLAS adalah Next.js 16 App Router dengan Prisma/PostgreSQL. NEXOPS adalah Nextcloud 31 pada Docker Compose dengan MariaDB dan Redis. Keduanya belum memiliki IdP bersama, reverse proxy, atau konfigurasi OIDC client. Login ATLAS sebelumnya adalah cookie dummy; Nextcloud masih memakai akun lokal.

## Target

```text
Pengguna ──> Keycloak (IdP)
                ├── OIDC client: atlas
                │      └── ATLAS authorization + kodamScope
                └── OIDC client: nextcloud
                       └── Nextcloud groups/shares/permissions
```

Keycloak direkomendasikan karena audit tidak menemukan IdP organisasi yang tersedia. Fondasi development Keycloak 26.7.1 telah dibuat terpisah di `/home/localhost/identity`, menggunakan PostgreSQL tersendiri dan bind ke loopback. Jika kemudian tersedia IdP resmi, ATLAS tetap dapat menggunakannya melalui konfigurasi generic OIDC tanpa perubahan model izin.

Autentikasi terpusat hanya menjawab identitas pengguna. ATLAS tetap menjadi sumber keputusan authorization untuk route/API ATLAS, sedangkan Nextcloud tetap mengatur grup, share, kuota, dan hak file sendiri.

## Batas fase

Phase 1 mendokumentasikan desain. Phase 2 mengimplementasikan ATLAS. Phase 3A memprovisikan realm, client, group, dan akun uji Keycloak tanpa mengubah login Nextcloud. Konfigurasi login Nextcloud tidak diubah sampai callback login interaktif ATLAS tervalidasi.

Phase 3B mengaktifkan login alternatif OIDC Nextcloud. Phase 4A menambahkan jalur dokumen melalui backend ATLAS dan WebDAV; tidak ada credential Nextcloud pada browser dan tidak ada akses database internal Nextcloud.

## Keputusan deployment

- Jangan menggabungkan database ATLAS, database Nextcloud, dan IdP.
- Gunakan client OIDC terpisah dan secret berbeda.
- Production wajib HTTPS melalui reverse proxy.
- Nextcloud mempertahankan akun lokal break-glass yang disimpan dan diaudit secara aman.
