#!/usr/bin/env bash
set -euo pipefail

REPO="mikolajrura/obsidian-molecule-viewer"
TAG="latest"
FILES="main.js manifest.json styles.css RDKit_minimal.js RDKit_minimal.wasm"

# ── Find vault path ──
VAULT="${1:-}"
if [ -z "$VAULT" ]; then
  echo "Usage:  bash install.sh /path/to/obsidian/vault"
  echo "   or:  bash <(curl -sL https://raw.githubusercontent.com/$REPO/master/install.sh) /path/to/vault"
  exit 1
fi

PLUGIN_DIR="$VAULT/.obsidian/plugins/obsidian-molecule-viewer"
mkdir -p "$PLUGIN_DIR"

# ── Download release assets ──
echo "Downloading plugin to $PLUGIN_DIR …"
BASE="https://github.com/$REPO/releases/$TAG/download"

for f in $FILES; do
  printf "  %-25s" "$f"
  curl -sL "$BASE/$f" -o "$PLUGIN_DIR/$f" && echo "✓" || echo "✗"
done

echo ""
echo "Done. Restart Obsidian → Settings → Community plugins → enable Molecule Viewer."
