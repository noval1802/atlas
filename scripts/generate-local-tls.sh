#!/usr/bin/env bash
set -euo pipefail
umask 077
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tls_dir="${project_dir}/deploy/tls"
lan_ip="${ATLAS_LAN_IP:-$(ip route get 1.1.1.1 | awk '{ for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')}"
mkdir -p "${tls_dir}"
if [[ -s "${tls_dir}/atlas.crt" && -s "${tls_dir}/atlas.key" ]] &&
  openssl x509 -in "${tls_dir}/atlas.crt" -noout -ext subjectAltName 2>/dev/null | grep -q "IP Address:${lan_ip}"; then
  printf 'TLS certificate already exists; leaving it unchanged.\n'
  exit 0
fi
openssl req -x509 -nodes -newkey rsa:3072 -sha256 -days 825 \
  -keyout "${tls_dir}/atlas.key" -out "${tls_dir}/atlas.crt" \
  -subj '/CN=ATLAS LAN' \
  -addext "subjectAltName=IP:${lan_ip},DNS:atlas.local,DNS:localhost" \
  -addext 'keyUsage=digitalSignature,keyEncipherment' \
  -addext 'extendedKeyUsage=serverAuth' >/dev/null 2>&1
chmod 600 "${tls_dir}/atlas.key"
chmod 644 "${tls_dir}/atlas.crt"
printf 'Local TLS certificate generated for %s.\n' "${lan_ip}"
