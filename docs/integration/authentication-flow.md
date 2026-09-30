# Alur Autentikasi

## Login ATLAS

1. Pengguna membuka route terlindungi ATLAS.
2. `proxy.ts` mengarahkan session yang tidak ada ke `/login` dengan `callbackUrl` lokal.
3. Tombol SSO memulai authorization-code flow ke discovery endpoint OIDC.
4. Auth.js memvalidasi state, PKCE, issuer, dan ID token melalui metadata provider.
5. Claim identitas, grup, dan cakupan Kodam dipetakan ke JWT session HTTP-only.
6. UI membaca profil session. API kembali memvalidasi permission dan scope di server.

Callback ATLAS adalah `http(s)://<atlas-host>/api/auth/callback/oidc`. Redirect URI harus didaftarkan secara tepat pada IdP; wildcard tidak direkomendasikan.

## Logout

Tombol keluar menghapus session ATLAS lalu kembali ke `/login`. Logout global IdP dapat ditambahkan setelah endpoint end-session IdP dan dampaknya terhadap Nextcloud disepakati.

## Development login

Credentials provider hanya dibuat jika `NODE_ENV` bukan `production` dan `ENABLE_DEV_LOGIN=true`. Username/password wajib berasal dari ENV, tidak dari source code atau database password IdP.

## Nextcloud (fase berikutnya)

Nextcloud akan menggunakan client OIDC sendiri terhadap issuer yang sama. Akun lokal break-glass tetap tersedia. Perubahan tersebut sengaja belum diterapkan pada Phase 2.
