# Operasional ATLAS, Identity, dan Nextcloud

Status tervalidasi: 28 Agustus 2026 (Asia/Jakarta).

## Endpoint

- ATLAS: `https://<IP-LAN>` (port 80 otomatis dialihkan ke HTTPS)
- Keycloak: `http://<IP-LAN>:8080`
- Nextcloud: `http://<IP-LAN>:8081`
- Health ATLAS internal: `http://127.0.0.1:3000/api/health`
- WebSocket ATLAS: `wss://<IP-LAN>/ws`

Sertifikat `deploy/tls/atlas.crt` dibuat lokal dan self-signed. Impor sertifikat ini sebagai CA/sertifikat tepercaya pada perangkat internal, atau ganti dengan sertifikat dari PKI organisasi sebelum produksi luas.

## Menjalankan dan memeriksa layanan

```bash
cd /home/localhost/atlas
./scripts/start-all.sh
docker compose ps
curl -k https://127.0.0.1/api/health
```

`start-all.sh` mendeteksi IP LAN aktif, menyinkronkan URL dan trusted domain,
me-recreate Keycloak bila hostname aktif sudah usang, memperbarui konfigurasi
OIDC, membangun ulang ATLAS, serta memuat ulang sertifikat Nginx. Semua service
memakai `restart: unless-stopped`. ATLAS terdiri dari `app`, `postgres`,
`realtime`, dan `proxy`.

## Kredensial dan rotasi

Kredensial development interaktif berada di `/home/localhost/atlas/CREDENTIALS.local.txt`, permission `0600`, dan tidak masuk Git. Jangan menyalin password ke README, tiket, atau chat.

Rotasi ulang seluruh secret development:

```bash
cd /home/localhost/identity
./scripts/rotate-development-secrets.sh
cd /home/localhost/atlas
docker compose up -d --build
```

Rotasi mencakup akun uji SSO, admin Keycloak, secret client OIDC ATLAS/Nextcloud, `AUTH_SECRET`, password login development, dan app password WebDAV.

## Perubahan alamat DHCP

Alamat LAN saat ini dideteksi otomatis. Jika DHCP memberikan IP baru:

```bash
cd /home/localhost/atlas
./scripts/sync-lan-address.sh
```

Skrip menyinkronkan URL kanonis ATLAS, issuer Keycloak, trusted domain Nextcloud, redirect URI kedua client OIDC, sertifikat TLS, lalu membangun ulang ATLAS dan memuat ulang proxy. Untuk operasi stabil, tetap gunakan reservasi DHCP atau DNS internal untuk host ini.

## Database

```bash
cd /home/localhost/atlas
npx prisma migrate status
npx prisma migrate deploy
npm run db:seed
```

Seed bersifat idempoten. Dashboard, Reports, Resources, user directory, alert, kejadian, titik peta, dan layout annotation sudah memakai PostgreSQL.

## Folder Kodam Nextcloud

Provisioning aman dijalankan ulang:

```bash
cd /home/localhost/nexops
./scripts/provision-kodam-folders.sh
```

Untuk setiap dari 21 Kodam, skrip membuat child group Keycloak, group Nextcloud, folder `PUSDALOPS/KODAM_<KODE>`, dan group share permission 15. Skrip membaca share yang ada dari database untuk menghindari POST duplikat dan menangani throttle HTTP 429.

## Verifikasi sebelum serah terima

```bash
cd /home/localhost/atlas
npx tsc --noEmit
npm test
npm run lint
npm run format:check
npm audit --omit=dev
npm run build
npm run test:e2e
```

E2E membaca akun admin dari `CREDENTIALS.local.txt`; secret tidak ditulis ke source atau output tes.
