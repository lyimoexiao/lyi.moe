#!/usr/bin/env bash
# Regenerate the Alimama FangYuanTi VF subsets used by the site.
#
#   scripts/subset-alimama-font.sh [source font file (ttf/woff2)]
#
# With no argument, looks for fonts-src/AlimamaFangYuanTiVF-Thin.ttf
# (the gitignored source dir, populated by scripts/subset-fonts.sh).
#
# Splits the original variable font into two slices (src/styles/fonts.css has
# the matching @font-face + unicode-range declarations):
#   - latin.woff2: ASCII + Latin-1 + common punctuation (U+0020-00FF, U+2000-206F)
#   - cjk.woff2:   nav link copy + CJK punctuation (U+3000-303F)
#
# Requires `uv` (fontTools + brotli run in an isolated env, nothing is
# installed into the project). The variable axes (wght 200-700, BEVL 1-100)
# survive subsetting, which the nav hover/active styles depend on.
#
# Characters rendered through this font but missing from a slice fall back
# per-character to the next family in the stack, so changing nav copy usually
# only means extending TEXT_CJK below and re-running this script.
#
# License note: the font's LICENSE.txt (copied into the output dir) permits
# free commercial/embedded use but restricts redistributing or modifying the
# font; the subsets are generated for this site's own use only.

set -euo pipefail

SRC="${1:-fonts-src/AlimamaFangYuanTiVF-Thin.ttf}"
OUT="src/assets/fonts/alimama-fangyuanti"
NAME="AlimamaFangYuanTiVF"

# Han characters used by the home title (依如初梦), the page main titles
# (博客 / 友链 / 关于), and the nav links (首页 / 博客 / 友链 / 关于 / 文章 / 中).
# Extend when copy changes. scripts/subset-fonts.sh overrides this with the
# Han characters extracted from the site's own config/copy at build time.
TEXT_CJK="${TEXT_CJK:-依如初梦首页博客友链关于文中}"

mkdir -p "$OUT"

# --drop-tables+=STAT: subsetting leaves the font's STAT (style attributes)
# table broken ("Axis index out of range"), which OTS (Chromium/Edge) rejects
# with "Unable to instantiate font face from data". STAT only carries axis/UI
# naming and is safe to drop for a webfont; the variable axes live in fvar/gvar.
SUBSET_COMMON=(--flavor=woff2 --layout-features='*' --name-IDs='*' --name-languages='*' --name-legacy --symbol-cmap --legacy-cmap --notdef-glyph --recommended-glyphs --drop-tables+=STAT)

uv run --with fonttools --with brotli pyftsubset "$SRC" \
  --output-file="$OUT/$NAME-latin.woff2" \
  --unicodes='U+0020-00FF,U+2000-206F' \
  "${SUBSET_COMMON[@]}"

uv run --with fonttools --with brotli pyftsubset "$SRC" \
  --output-file="$OUT/$NAME-cjk.woff2" \
  --text="$TEXT_CJK" \
  --unicodes='U+3000-303F' \
  "${SUBSET_COMMON[@]}"

ls -la "$OUT"
