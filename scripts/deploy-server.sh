#!/usr/bin/env bash
if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
  printf '%s\n' 'Run with bash scripts/deploy-server.sh; do not use source or dot.' >&2
  return 1
fi
set -euo pipefail
stage='preflight checks'
trap 'status=$?; printf "Deployment stopped during %s (exit %s).\n" "$stage" "$status" >&2; exit "$status"' ERR
cd "$(dirname "$0")/.."
dc=(docker compose -p observadoras -f compose.yaml -f compose.server.yaml)
docker network inspect referente_net >/dev/null
docker inspect referente_caddy >/dev/null
"${dc[@]}" config --quiet
# Refuse to substitute an unexpected existing database or volume.
db_image=$(docker inspect observadoras-db-1 --format '{{.Config.Image}}')
db_volume=$(docker inspect observadoras-db-1 --format '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}')
if [[ "$db_image" != postgres:17-bookworm || "$db_volume" != observadoras_postgres_data ]]; then
  echo 'Database differs from the existing-server configuration; stopped without changing it.' >&2
  exit 1
fi
stage='image build'
printf '%s\n' 'Stage: image build (existing services remain running)'
"${dc[@]}" build app
stage='PostgreSQL readiness'
docker start observadoras-db-1 >/dev/null
for attempt in {1..30}; do
  if docker exec observadoras-db-1 sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null; then break; fi
  if [[ "$attempt" == 30 ]]; then echo 'PostgreSQL is not ready; deployment stopped.' >&2; exit 1; fi
  sleep 2
done
stage='database migrations'
printf '%s\n' 'Stage: database migrations'
"${dc[@]}" run --rm --no-deps migrate
stage='administrator initialization'
"${dc[@]}" run --rm --no-deps app node --import tsx scripts/bootstrap-admin.ts
stage='application startup'
printf '%s\n' 'Stage: application startup'
"${dc[@]}" up -d --no-deps --wait --wait-timeout 120 app ai-worker
stage='proxy verification'
docker exec referente_caddy wget -q -O /dev/null http://observadoras-web:3000/api/health
# Preserve the other site's configuration. Add only this hostname if absent.
if ! docker exec referente_caddy grep -q 'observadoras.tecsify.com' /etc/caddy/Caddyfile; then
  caddy_file=$(docker inspect referente_caddy --format '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}')
  [[ -n "$caddy_file" && -f "$caddy_file" && -w "$caddy_file" ]] || { echo 'Caddyfile is not writable by this user.' >&2; exit 1; }
  backup=$(mktemp "${caddy_file}.observadoras.XXXXXX")
  cp -- "$caddy_file" "$backup"
  cat >> "$caddy_file" <<'CADDY'

observadoras.tecsify.com {
    reverse_proxy observadoras-web:3000 {
        header_up X-Real-IP {remote_host}
    }
}
CADDY
  if ! docker exec referente_caddy caddy validate --config /etc/caddy/Caddyfile; then
    cat "$backup" > "$caddy_file"
    echo "Caddy configuration restored. Backup: $backup" >&2
    exit 1
  fi
fi
docker exec referente_caddy caddy validate --config /etc/caddy/Caddyfile
docker exec referente_caddy caddy reload --config /etc/caddy/Caddyfile
curl --fail --silent --show-error --retry 6 --retry-delay 5 --max-time 15 https://observadoras.tecsify.com/api/health
echo
echo 'Deployment verified: https://observadoras.tecsify.com'
