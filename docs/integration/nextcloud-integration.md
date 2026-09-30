# Rencana Integrasi Nextcloud

Phase 2 tidak mengubah NEXOPS. Phase 3B kemudian menambahkan OIDC sebagai login alternatif yang reversible.

## Hasil audit NEXOPS

- Nextcloud 31.0.14.1, Apache, MariaDB 11, Redis 7.
- Login lokal dan grup internal aktif.
- Tidak ada aplikasi/config OIDC client, LDAP aktif, Keycloak, atau reverse proxy.
- Aplikasi shipped `oauth2` adalah OAuth2 server Nextcloud, bukan bukti bahwa login OIDC client telah aktif.

## Implementasi development saat ini

- `user_oidc` 8.10.1 aktif dan provider bernama `atlas`.
- Discovery memakai realm Keycloak `atlas` pada `IDENTITY_HOST`.
- UID dipetakan dari `preferred_username`, display name dari `name`, email dari `email`, dan grup dari claim `groups`.
- UID unik aktif untuk mencegah akun OIDC mengambil alih akun lokal bernama sama.
- Group provisioning aktif dengan whitelist `^/nextcloud/.*$`; bearer validation dan bearer provisioning tidak aktif.
- Login lokal tetap aktif melalui `allow_multiple_user_backends=1` dan `?direct=1`.
- Karena masih HTTP/LAN development, `allow_insecure_http=true` dan `allow_local_remote_servers=true`. Keduanya dilarang untuk production.

## Tahap produksi berikutnya

1. Simpan salinan konfigurasi ringan, status health, provider, dan daftar aplikasi; backup data penuh tetap mengikuti kebijakan operator.
2. Ganti endpoint menjadi HTTPS dan nonaktifkan pengecualian insecure/local remote server.
3. Rotasi client secret dan batasi redirect URI ke hostname production yang tepat.
4. Petakan subject stabil sebagai identitas; petakan grup hanya untuk kebutuhan Nextcloud.
5. Uji akun biasa dan administrator melalui jendela privat.
6. Pertahankan `allow_multiple_user_backends` sehingga login lokal break-glass masih dapat dipakai; endpoint `?direct=1` juga harus diuji sebelum mewajibkan OIDC.
7. Baru aktifkan enforcement setelah backup restore dan rollback tervalidasi.

ATLAS tidak membaca tabel user/password Nextcloud. Tautan atau file Nextcloud pada Phase 4 menggunakan WebDAV/OCS API dan service account atau delegated token dengan hak minimum.
