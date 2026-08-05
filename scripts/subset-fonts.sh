#!/usr/bin/env bash
# Regenerate all font subsets before a build. Runs automatically via the
# `prebuild` npm script (pnpm build); can also be run manually.
#
# Sources live in fonts-src/ (gitignored — Alimama's license forbids
# redistributing the source, so it must not be committed):
#   fonts-src/AlimamaFangYuanTiVF-Thin.ttf
#   fonts-src/DouyinSansBold.ttf
#   fonts-src/JetBrainsMono[wght].ttf
#
# Deployment (e.g. Vercel) never needs this: fonts-src/ isn't uploaded there,
# so the wrapper exits immediately and the committed woff2 are used as-is.
# Same when fonts-src/ exists but python3/uv are unavailable.
#
# The Han characters for the Alimama and Douyin CJK slices are extracted from
# the site's own copy (config title, ui.ts strings, feed group names), so
# changing group names / nav labels / titles regenerates the fonts
# automatically — no need to maintain a character list by hand.

set -euo pipefail

if [ ! -d fonts-src ]; then
  echo "subset-fonts: no fonts-src/ — keeping committed woff2"
  exit 0
fi

if ! command -v python3 >/dev/null || ! command -v uv >/dev/null; then
  echo "subset-fonts: python3/uv not available — keeping committed woff2"
  exit 0
fi

HAN_CHARS="$(python3 - <<'PY'
import re
text = open('src/i18n/ui.ts', encoding='utf-8').read()
title = re.search(r'^\s*title:.*', open('src/config.ts', encoding='utf-8').read(), re.M)
if title:
    text += '\n' + title.group(0)
names = [l for l in open('src/lib/feed.ts', encoding='utf-8') if re.match(r'\s*name:', l)]
text += '\n' + '\n'.join(names)
print(''.join(sorted({c for c in text if '\u4e00' <= c <= '\u9fff'})))
PY
)"

run() {
  local name="$1" src="$2"
  shift 2
  if [ -f "$src" ]; then
    echo "subset-fonts: $name"
    "$@"
  else
    echo "subset-fonts: skip $name (missing $src, keeping committed woff2)"
  fi
}

run "alimama" fonts-src/AlimamaFangYuanTiVF-Thin.ttf \
  env TEXT_CJK="$HAN_CHARS" bash scripts/subset-alimama-font.sh

run "douyin" fonts-src/DouyinSansBold.ttf \
  env TEXT_CJK="$HAN_CHARS" bash scripts/subset-douyin-font.sh

run "jetbrains-mono" "fonts-src/JetBrainsMono[wght].ttf" \
  bash scripts/subset-jetbrains-mono.sh
