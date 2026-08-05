#!/usr/bin/env bash
# Regenerate the Douyin Sans Bold subsets used by the feed group titles.
#
#   scripts/subset-douyin-font.sh [source font file (ttf/woff2)]
#
# With no argument, looks for fonts-src/DouyinSansBold.ttf
# (the gitignored source dir, populated by scripts/subset-fonts.sh).
#
# Splits the font into two slices (src/styles/fonts.css has the matching
# @font-face + unicode-range declarations):
#   - latin.woff2: ASCII + Latin-1 + common punctuation (U+0020-00FF, U+2000-206F)
#   - cjk.woff2:   group-name characters + CJK punctuation (U+3000-303F)
#
# Requires `uv` (fontTools + brotli run in an isolated env, nothing is
# installed into the project).
#
# Characters rendered through this font but missing from a slice fall back
# per-character to the next family in the stack, so changing group names
# usually only means extending TEXT_CJK below and re-running this script.
#
# License: SIL OFL 1.1 (src/assets/fonts/douyin-sans/OFL.txt), free for
# embedding/redistribution; subsets are generated for this site's own use.
# The font's PostScript name is DOUYINSANSBOLD-GB (same as blog-v3's
# --font-stroke-free), registered here as weight 800.

set -euo pipefail

SRC="${1:-fonts-src/DouyinSansBold.ttf}"
OUT="src/assets/fonts/douyin-sans"
NAME="DouyinSansBold"

# Han characters used by the feed group titles (好友们, 邻居们). Extend when
# copy changes. scripts/subset-fonts.sh overrides this with the Han characters
# extracted from the site's own config/copy at build time.
TEXT_CJK="${TEXT_CJK:-好友们邻居}"

mkdir -p "$OUT"

# --drop-tables+=STAT,  GSUB, GPOS: the font's STAT is broken for OTS, and
# its GSUB/GPOS subtable layout is malformed enough that fontTools crashes
# during subsetting. Layout features/kerning barely matter at 5rem title size.
SUBSET_COMMON=(--flavor=woff2 --name-IDs='*' --name-languages='*' --name-legacy --symbol-cmap --legacy-cmap --notdef-glyph --recommended-glyphs --drop-tables+=STAT,GSUB,GPOS)

# The font carries a Mac format-6 cmap (U+0020-0097 only) that fontTools picks
# over the full Windows Unicode cmaps, silently dropping every other glyph.
# Drop all non-Windows cmaps into a temp copy before subsetting.
FIXED="$(mktemp -t douyinsans-fixed.XXXXXX.ttf)"
trap 'rm -f "$FIXED"' EXIT
uv run --with fonttools python3 - "$SRC" "$FIXED" <<'PY'
import sys
from fontTools.ttLib import TTFont
src, dst = sys.argv[1], sys.argv[2]
font = TTFont(src)
font['cmap'].tables = [t for t in font['cmap'].tables if t.platformID == 3 and t.platEncID in (1, 10)]
font.save(dst)
PY

uv run --with fonttools --with brotli pyftsubset "$FIXED" \
  --output-file="$OUT/$NAME-latin.woff2" \
  --unicodes='U+0020-00FF,U+2000-206F' \
  "${SUBSET_COMMON[@]}"

uv run --with fonttools --with brotli pyftsubset "$FIXED" \
  --output-file="$OUT/$NAME-cjk.woff2" \
  --text="$TEXT_CJK" \
  --unicodes='U+3000-303F' \
  "${SUBSET_COMMON[@]}"

ls -la "$OUT"
