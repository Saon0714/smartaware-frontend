#!/usr/bin/env bash
# Regenerate the typed API client from the backend's OpenAPI schema.
#
#   npm run gen:api                      # against a running backend
#   npm run gen:api -- ../smartaware-backend/openapi.json
#
# The generated file is committed so builds never require a live backend.
# CI regenerates and fails on a diff — that is the tripwire that keeps the
# frontend's types honest as backend endpoints evolve.
set -euo pipefail

SOURCE="${1:-${NEXT_PUBLIC_API_URL:-http://localhost:8000}/openapi.json}"
OUT="src/lib/api/schema.d.ts"

echo "Generating $OUT from $SOURCE"
npx openapi-typescript "$SOURCE" --output "$OUT"
echo "Done. Review the diff before committing."
