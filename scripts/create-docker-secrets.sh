#!/usr/bin/env bash
#
# Crée les secrets Docker Swarm sur le serveur de production.
# Lit les valeurs depuis .env.deploy (gitignored) et crée chaque secret via SSH.
#
# Les secrets Docker sont immuables : un secret existant est laissé tel quel.
# Utilise --rotate pour supprimer + recréer (puis redéploie la stack ensuite).
#
# Usage :
#   ./scripts/create-docker-secrets.sh           # crée les secrets manquants
#   ./scripts/create-docker-secrets.sh --rotate  # supprime + recrée tous
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.deploy"
ROTATE=false
[ "${1:-}" = "--rotate" ] && ROTATE=true

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found. Copy .env.deploy.example -> .env.deploy and fill it in." >&2
    exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${SERVER_HOST:?SERVER_HOST missing in .env.deploy}"
: "${SSH_USER:?SSH_USER missing in .env.deploy}"
SSH_PORT="${SSH_PORT:-22}"

# Liste de tous les secrets runtime Docker Swarm du projet.
SECRETS=(
    DATABASE_URL
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    BREVO_API_KEY
    MLMH_CLERK_SECRET_KEY
    MLMH_SCW_REGION
    MLMH_SCW_BUCKET_ENDPOINT
    MLMH_SCW_DEFAULT_ORGANIZATION_ID
    MLMH_SCW_DEFAULT_PROJECT_ID
    MLMH_SCW_ACCESS_KEY
    MLMH_SCW_SECRET_KEY
    MLMH_SCW_BUCKET_NAME
    MLMH_SCALEWAY_TABLATURES_BUCKET
)

# Valeur passée par stdin UNIQUEMENT — jamais dans argv.
remote_create() {
    printf '%s' "$1" | ssh -p "$SSH_PORT" "$SSH_USER@$SERVER_HOST" \
        "docker secret create '$2' - >/dev/null"
}

for name in "${SECRETS[@]}"; do
    value="${!name:-}"
    if [ -z "$value" ]; then
        echo "  ! skipping $name (empty in .env.deploy)"
        continue
    fi

    if ssh -p "$SSH_PORT" "$SSH_USER@$SERVER_HOST" "docker secret inspect '$name' >/dev/null 2>&1"; then
        if [ "$ROTATE" = "true" ]; then
            echo "  ~ rotating $name"
            ssh -p "$SSH_PORT" "$SSH_USER@$SERVER_HOST" "docker secret rm '$name' >/dev/null"
            remote_create "$value" "$name"
            echo "  ✓ recreated $name"
        else
            echo "  = $name already exists (use --rotate to replace)"
        fi
    else
        remote_create "$value" "$name"
        echo "  ✓ created $name"
    fi
done

echo
echo "Done. Vérification : ssh -p $SSH_PORT $SSH_USER@$SERVER_HOST docker secret ls"
if [ "$ROTATE" = "true" ]; then
    echo "Secrets recréés — redéploie la stack pour que les services les prennent en compte :"
    echo "  ssh -p $SSH_PORT $SSH_USER@$SERVER_HOST 'cd ~/mlmh-shop/mlmh-shop-app && docker stack deploy -c docker-compose.yml -c docker-compose.swarm.yml --with-registry-auth mlmh_shop-stack'"
fi
