#!/bin/sh
# Production start script (used by Render and Docker).
set -e

# NextAuth needs its public URL. Render provides RENDER_EXTERNAL_URL automatically,
# so NEXTAUTH_URL only has to be set manually if you use a custom domain.
if [ -z "$NEXTAUTH_URL" ] && [ -n "$RENDER_EXTERNAL_URL" ]; then
  export NEXTAUTH_URL="$RENDER_EXTERNAL_URL"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "ERROR: NEXTAUTH_SECRET is not set." >&2
  exit 1
fi
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

# Sync the database schema. Runs at start (not build) because Render's
# private network - and so the internal database URL - is not reachable during builds.
npx prisma db push --skip-generate

exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
