#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sync_script="${script_dir}/sync-lan-address.sh"
state_file="${script_dir}/.lan-address"
while :; do
  current="$(ip route get 1.1.1.1 2>/dev/null | awk '{ for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')"
  if [[ "${current}" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    previous="$(cat "${state_file}" 2>/dev/null || true)"
    if [[ "${current}" != "${previous}" ]]; then
      if ATLAS_LAN_IP="${current}" "${sync_script}"; then
        printf '%s\n' "${current}" >"${state_file}"
      fi
    fi
  fi
  sleep 30
done
