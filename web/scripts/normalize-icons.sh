#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ICONS_DIR="$ROOT_DIR/public/icons"
BACKUP_DIR="$ICONS_DIR/_original"

mkdir -p "$BACKUP_DIR"

get_dim() {
  local key="$1"
  local file="$2"
  # Output like: file|pixelWidth: 148|pixelHeight: 148|
  sips -g "$key" -1 "$file" 2>/dev/null | sed -E "s/.*${key}: ([0-9]+).*/\1/"
}

normalize_png() {
  local file="$1"
  local base
  base="$(basename "$file")"

  # Backup only once
  if [[ ! -f "$BACKUP_DIR/$base" ]]; then
    cp -p "$file" "$BACKUP_DIR/$base"
  fi

  local w h min offx offy
  w="$(get_dim pixelWidth "$file")"
  h="$(get_dim pixelHeight "$file")"

  if [[ -z "$w" || -z "$h" ]]; then
    echo "skip (no dims): $base" >&2
    return
  fi

  if (( w < h )); then
    min=$w
  else
    min=$h
  fi

  offx=$(( (w - min) / 2 ))
  offy=$(( (h - min) / 2 ))

  local tmp="$ICONS_DIR/.tmp_${base}"

  # Center-crop to square
  sips -c "$min" "$min" --cropOffset "$offy" "$offx" "$file" --out "$tmp" >/dev/null

  # Normalize size for consistent rendering
  sips -z 512 512 "$tmp" --out "$tmp" >/dev/null

  mv "$tmp" "$file"
  echo "normalized: $base (${w}x${h} -> 512x512)"
}

if [[ ! -d "$ICONS_DIR" ]]; then
  echo "Icons dir not found: $ICONS_DIR" >&2
  exit 1
fi

shopt -s nullglob

# Convert any .jpg to .png (same basename)
for jpg in "$ICONS_DIR"/*.jpg; do
  base="$(basename "$jpg" .jpg)"
  out="$ICONS_DIR/${base}.png"
  sips -s format png "$jpg" --out "$out" >/dev/null
  echo "converted: $(basename "$jpg") -> $(basename "$out")"
done

for png in "$ICONS_DIR"/*.png; do
  base="$(basename "$png")"
  case "$base" in
    .*) continue;;
  esac
  normalize_png "$png"
done

echo "done"
