#!/usr/bin/env bash
set -euo pipefail

# Scaffold standard 9-folder Angular feature architecture

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path-to-feature-root>" >&2
  echo "Example: $0 src/app/features/billing" >&2
  exit 1
fi

FEATURE_PATH="$1"

# Standard 9 feature directories
SUBDIRS=(
  "pages"
  "components"
  "store"
  "constants"
  "models"
  "pure-functions"
  "services"
  "directives"
  "pipes"
)

echo "Scaffolding feature structure at: $FEATURE_PATH"

mkdir -p "$FEATURE_PATH"

for dir in "${SUBDIRS[@]}"; do
  TARGET_DIR="$FEATURE_PATH/$dir"
  mkdir -p "$TARGET_DIR"
  INDEX_FILE="$TARGET_DIR/index.ts"
  if [ ! -f "$INDEX_FILE" ]; then
    echo "// Export $dir members here" > "$INDEX_FILE"
    echo "  Created: $dir/index.ts"
  fi
done

echo "Successfully scaffolded 9-folder structure for: $FEATURE_PATH"
