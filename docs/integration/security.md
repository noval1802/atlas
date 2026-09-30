# Security Phase 5

## Kontrol aktif

- OIDC authorization-code flow menggunakan PKCE dan state melalui Auth.js.
- Session JWT server-side dengan masa aktif delapan jam; development login dipaksa nonaktif pada production.
- RBAC dan scope Kodam diperiksa ulang pada Route Handler, termasuk akses dokumen.
- Mutasi JSON wajib memakai `Content-Type: application/json` dan payload valid.
- Request mutasi dengan header `Origin` asing ditolak HTTP 403.
- Rate limit in-memory: 60 mutasi/menit per IP dan route; upload dokumen 20/menit.
- Security headers global: CSP, frame denial, MIME sniffing protection, referrer policy, permissions policy, dan COOP.
- Audit database mencatat action, entity, old/new value, actor, role, IP, user-agent, waktu, dan correlation ID.
- File Nextcloud hanya diambil melalui backend setelah pemeriksaan permission dan scope.

## Batas implementasi development

Rate limiter saat ini berada di memori proses. Deployment multi-instance harus menggantinya dengan penyimpanan bersama seperti Redis dan mempercayai `X-Forwarded-For` hanya dari reverse proxy yang dikelola. CSP development masih mengizinkan directive yang dibutuhkan runtime Next.js; production perlu nonce/hash yang lebih ketat.

Audit sengaja tidak menyimpan token, password, app password, atau isi file. Kegagalan penulisan audit pada operasi sensitif saat ini menggagalkan request agar perubahan tidak terjadi tanpa jejak.

## Verifikasi

```text
Security headers                  tersedia
Cross-origin mutation            403
Authorized scoped mutation       200
Audit correlation lookup         ditemukan
Upload request ke-21/menit       429
TypeScript                       lulus
ESLint                           lulus
Production build                 lulus
```

## Lanjutan production

1. Jalankan ATLAS, Keycloak, dan Nextcloud di HTTPS.
2. Tetapkan allowlist host dan trusted proxy pada reverse proxy.
3. Pindahkan rate limit ke Redis.
4. Gunakan CSP nonce/hash dan hilangkan `unsafe-eval` pada production.
5. Tambahkan retensi, ekspor, dan alert anomali audit log.
6. Tambahkan integration test otomatis untuk seluruh matriks role dan scope.
