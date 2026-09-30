#!/usr/bin/env bash
# Cetak baris error layanan sejak catatan terakhir. Tidak menulis catatan.
# Setelah entri tersimpan, jalankan: catat-sesi.sh mark
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cursor="${root}/.catatan-terakhir"
containers=(atlas-app atlas-realtime atlas-postgres atlas-proxy atlas-keycloak atlas-keycloak-db)

redact() {
  sed -E \
    -e 's#(postgres(ql)?://[^:/@]+:)[^@]+@#\1***@#gI' \
    -e 's#((PASSWORD|SECRET|TOKEN|API_KEY)[=:]["[:space:]]*)[^"[:space:]]+#\1***#gI'
}

since="168h"
if [[ -f "${cursor}" ]]; then
  since="$(tr -d '[:space:]' < "${cursor}")"
fi

if [[ "${1:-errors}" == "mark" ]]; then
  date -u +%Y-%m-%dT%H:%M:%SZ > "${cursor}"
  printf 'cursor %s\n' "$(cat "${cursor}")"
  exit 0
fi

found=0
for name in "${containers[@]}"; do
  if ! docker inspect "${name}" >/dev/null 2>&1; then
    printf '## %s\ncontainer tidak ada\n\n' "${name}"
    found=1
    continue
  fi
  lines="$(docker logs "${name}" --since "${since}" 2>&1 | grep -Ei 'error|exception|fatal|panic' | redact || true)"
  printf '## %s\n' "${name}"
  if [[ -z "${lines}" ]]; then
    printf 'tidak ada baris error\n\n'
  else
    printf '%s\n\n' "${lines}"
    found=1
  fi
done

if [[ "${found}" -eq 0 ]]; then
  printf 'RINGKAS tidak ada baris error baru sejak %s\n' "${since}"
else
  printf 'RINGKAS ada baris error sejak %s\n' "${since}"
fi
