#!/usr/bin/env bash
#
# Pousse tous les secrets CI/CD vers l'environnement `production` du repo GitHub.
# Lit les valeurs depuis .env.deploy (gitignored). Requiert la CLI `gh`, authentifiée.
#
# Usage :
#   ./scripts/setup-github-secrets.sh
#
set -euo pipefail

ENV_NAME="production"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.deploy"

if ! command -v gh >/dev/null 2>&1; then
    echo "Error: GitHub CLI (gh) is not installed. https://cli.github.com/" >&2
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found. Copy .env.deploy.example -> .env.deploy and fill it in." >&2
    exit 1
fi

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo "Repository: $REPO"
echo "Environment: $ENV_NAME"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# S'assure que l'environnement existe (idempotent).
echo "Ensuring environment '$ENV_NAME' exists..."
gh api -X PUT "repos/$REPO/environments/$ENV_NAME" >/dev/null

# Secrets dont le workflow GitHub Actions a besoin.
# SSH_PRIVATE_KEY_NOPW n'est PAS dans cette liste — upload séparé (voir fin du script).
GH_SECRETS=(
    DOCKER_USERNAME
    DOCKER_PASSWORD
    SERVER_HOST
    SSH_PORT
    SSH_USER
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    NEXT_PUBLIC_BASE_URL
    NEXT_PUBLIC_API_URL
    DATABASE_URL_BUILD
    STRIPE_SECRET_KEY_BUILD
)

for name in "${GH_SECRETS[@]}"; do
    value="${!name:-}"
    if [ -z "$value" ]; then
        echo "  ! skipping $name (empty in .env.deploy)"
        continue
    fi
    printf '%s' "$value" | gh secret set "$name" --env "$ENV_NAME" --repo "$REPO"
    echo "  ✓ set $name"
done

echo
if gh secret list --env "$ENV_NAME" --repo "$REPO" 2>/dev/null | grep -q '^SSH_PRIVATE_KEY_NOPW'; then
    echo "SSH_PRIVATE_KEY_NOPW est déjà défini. Pour le renouveler, relance la commande ci-dessous."
else
    echo "⚠️  SSH_PRIVATE_KEY_NOPW n'est PAS encore défini."
fi
echo "Upload la clé SSH séparément depuis son fichier (remplace le chemin) :"
echo "  gh secret set SSH_PRIVATE_KEY_NOPW --env $ENV_NAME --repo $REPO < ~/.ssh/your_deploy_key"
echo
echo "Done. Secrets GitHub Actions configurés sur l'environnement '$ENV_NAME'."
echo "Les secrets Docker Swarm sont créés sur le serveur avec :"
echo "  ./scripts/create-docker-secrets.sh"
