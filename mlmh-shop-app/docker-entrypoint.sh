#!/bin/sh
set -e

# Check if the secret file exists, then export the environment variable
if [ -f "/run/secrets/DATABASE_URL" ]; then
  export DATABASE_URL=$(cat /run/secrets/DATABASE_URL)
fi
if [ -f "/run/secrets/STRIPE_SECRET_KEY" ]; then
  export STRIPE_SECRET_KEY=$(cat /run/secrets/STRIPE_SECRET_KEY)
fi
if [ -f "/run/secrets/BREVO_API_KEY" ]; then
  export BREVO_API_KEY=$(cat /run/secrets/BREVO_API_KEY)
fi
if [ -f "/run/secrets/STRIPE_WEBHOOK_SECRET" ]; then
  export STRIPE_WEBHOOK_SECRET=$(cat /run/secrets/STRIPE_WEBHOOK_SECRET)
fi
if [ -f "/run/secrets/MLMH_CLERK_SECRET_KEY" ]; then
  export CLERK_SECRET_KEY=$(cat /run/secrets/MLMH_CLERK_SECRET_KEY)
fi
if [ -f "/run/secrets/MLMH_SCW_REGION" ]; then
  export SCW_REGION=$(cat /run/secrets/SCW_REGION)
fi
if [ -f "/run/secrets/MLMH_SCW_BUCKET_ENDPOINT" ]; then
  export SCW_BUCKET_ENDPOINT=$(cat /run/secrets/SCW_BUCKET_ENDPOINT)
fi
if [ -f "/run/secrets/MLMH_SCW_DEFAULT_ORGANIZATION_ID" ]; then
  export SCW_DEFAULT_ORGANIZATION_ID=$(cat /run/secrets/SCW_DEFAULT_ORGANIZATION_ID)
fi
if [ -f "/run/secrets/MLMH_SCW_DEFAULT_PROJECT_ID" ]; then
  export SCW_DEFAULT_PROJECT_ID=$(cat /run/secrets/SCW_DEFAULT_PROJECT_ID)
fi
if [ -f "/run/secrets/MLMH_SCW_ACCESS_KEY" ]; then
  export SCW_ACCESS_KEY=$(cat /run/secrets/SCW_ACCESS_KEY)
fi
if [ -f "/run/secrets/MLMH_SCW_SECRET_KEY" ]; then
  export SCW_SECRET_KEY=$(cat /run/secrets/SCW_SECRET_KEY)
fi
if [ -f "/run/secrets/MLMH_SCW_BUCKET_NAME" ]; then
  export SCW_BUCKET_NAME=$(cat /run/secrets/SCW_BUCKET_NAME)
fi

# Generate Prisma client with --accelerate at runtime when we have the real DATABASE_URL
npx prisma generate --accelerate

# Default to port 3000 if not specified
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}

# Run Prisma migrations
echo "Running migrations..."
DATABASE_URL=$DATABASE_URL npx prisma migrate deploy

# Start your app
exec "$@"