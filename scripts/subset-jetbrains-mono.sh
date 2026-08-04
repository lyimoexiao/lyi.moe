#!/usr/bin/env bash
# Regenerate the JetBrains Mono subset used by the site's code blocks.
#
#   scripts/subset-jetbrains-mono.sh /path/to/JetBrainsMono[wght].ttf
#
# Splits the original variable font into a single latin slice (global.css has
# the matching @font-face + unicode-range declaration):
#   - latin.woff2: ASCII + Latin-1 + punctuation + common code symbols
#     (U+0020-00FF, U+2000-206F, U+2190-21FF, U+2300-23FF, U+25A0-25FF,
#      U+27F0-27FF, U+2B00-2BFF)
#
# Requires `uv` (fontTools + brotli run in an isolated env, nothing is
# installed into the project). The variable wght axis (100-800) survives
# subsetting, so code blocks keep their weight range.
#
# JetBrains Mono is licensed under the SIL Open Font License; the subset is
# generated for this site's own use.
#
# Download source (variable weight):
#   https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/variable/JetBrainsMono%5Bwght%5D.ttf

set -euo pipefail

SRC="${1:?usage: subset-jetbrains-mono.sh <source font file (ttf)>}"
OUT="public/fonts/jetbrains-mono"
NAME="JetBrainsMono"

LATIN_UNICODES='U+0020-00FF,U+2000-206F,U+2190-21FF,U+2300-23FF,U+25A0-25FF,U+27F0-27FF,U+2B00-2BFF'

mkdir -p "$OUT"

# --drop-tables+=STAT: mirrors subset-alimama-font.sh; STAT only carries
# axis/UI naming and is safe to drop for a webfont, and dropping it avoids
# any "Axis index out of range" OTS rejection after subsetting.
uv run --with fonttools --with brotli pyftsubset "$SRC" \
  --flavor=woff2 \
  --output-file="$OUT/$NAME-latin.woff2" \
  --unicodes="$LATIN_UNICODES" \
  --layout-features='*' \
  --name-IDs='*' --name-languages='*' --name-legacy \
  --symbol-cmap --legacy-cmap --notdef-glyph --recommended-glyphs \
  --drop-tables+=STAT

ls -la "$OUT"
