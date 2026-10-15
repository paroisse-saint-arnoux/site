#!/usr/bin/env bash
# Régénère public/og-image.jpg (image de partage Facebook, WhatsApp…) à partir
# de scripts/og-image.html. Nécessite Google Chrome (ou Chromium) et ImageMagick.
set -euo pipefail
cd "$(dirname "$0")/.."

chrome=$(command -v google-chrome || command -v chromium || command -v chromium-browser)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

"$chrome" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --window-size=1200,630 --screenshot="$tmp/og.png" "file://$PWD/scripts/og-image.html"
magick "$tmp/og.png" -strip -quality 85 public/og-image.jpg
echo "public/og-image.jpg mis à jour"
