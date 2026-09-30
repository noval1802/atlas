# Migration Plan dan Rollback

## Phase 1 — Dokumentasi

- Catat topology, flow, mapping, risiko, dan rollback.
- Bekukan nama role dan claim sebelum konfigurasi IdP.

## Phase 2 — ATLAS

1. Tambahkan Auth.js generic OIDC.
2. Tambahkan role/permission/group mapping terpusat.
3. Tambahkan profile session dan `kodamScope`.
4. Lindungi route dengan `proxy.ts`; tegakkan kembali aturan pada Route Handler.
5. Migrasikan model user tanpa menyimpan password IdP.
6. Uji login/logout, semua role, scope Kodam, 401, dan 403.

Rollback ATLAS: hapus konfigurasi OIDC/proxy dan kembalikan versi aplikasi sebelumnya. Penambahan kolom/enum Prisma bersifat kompatibel; jangan hapus kolom atau nilai enum sebelum backup dan migrasi terencana.

## Phase 3A — IdP development

- Selesai: Keycloak 26.7.1 dan PostgreSQL identity terpisah.
- Selesai: realm `atlas`, client OIDC `atlas` dan `nextcloud`, role/group, serta akun uji.
- Selesai: discovery, readiness, import, dan authorization redirect ATLAS.
- Menunggu acceptance manual: login browser ATLAS menggunakan akun Keycloak sampai dashboard dan verifikasi role/scope.

Rollback Phase 3A: jalankan `docker compose down` dari `/home/localhost/identity`. Jangan memakai `-v` dan jangan menghapus `identity/data/postgres` jika konfigurasi perlu dipulihkan.

## Phase 3B — Nextcloud SSO (selesai untuk development)

- Aplikasi resmi `user_oidc` 8.10.1 aktif pada Nextcloud 31.
- Provider `atlas` memakai client OIDC `nextcloud`, PKCE, UID unik, dan tanpa bearer/group auto-provisioning.
- `allow_multiple_user_backends=1`; login lokal dan `?direct=1` tetap tersedia.
- Login `operator_xii` berhasil sampai dashboard Nextcloud dan memprovisikan metadata user OIDC.
- Session IdP yang sama berhasil membuka ATLAS tanpa password kedua; role/scope menjadi `OPERATOR_KODAM`/`KODAM-XII`.
- API ATLAS memberi 200 untuk scope sendiri dan 403 untuk Kodam lain.

Rollback cepat Nextcloud: nonaktifkan `user_oidc` melalui `occ app:disable user_oidc`. Jika perlu pemulihan konfigurasi, salinan pra-perubahan berada di `config/phase3-backup/config.php.before-user-oidc-20260824`. Jangan mengganti config aktif ketika container sedang melayani request tanpa prosedur maintenance yang disetujui.

Environment ini masih HTTP development. `allow_insecure_http` dan `allow_local_remote_servers` wajib dikembalikan ke `false` setelah tersedia reverse proxy HTTPS dan IdP dengan hostname internal yang valid.

## Checklist penerimaan Phase 2

- ADMIN dapat membaca dan mengubah data lintas Kodam.
- OPERATOR_KODAM XII melihat/mengubah XII dan mendapat 403 untuk Kodam lain.
- PIMPINAN dapat GET tetapi POST/PUT/DELETE mendapat 403.
- Request tanpa session mendapat 401 pada API dan redirect pada page.
- Logout menghapus session ATLAS.
- Build, lint, dan Prisma validation lulus.
