#!/usr/bin/env bash
# Regenerate the Douyin Sans subset before a build. Runs automatically via the
# `prebuild` npm script (pnpm build); can also be run manually.
#
# Source lives in fonts-src/ (gitignored): fonts-src/DouyinSansBold.ttf
#
# (Alimama FangYuanTi VF and JetBrains Mono are committed in full as single
# woff2 files, no subsetting.)
#
# Deployment (e.g. Vercel) never needs this: fonts-src/ isn't uploaded there,
# so the wrapper exits immediately and the committed woff2 are used as-is.
# Same when fonts-src/ exists but python3/uv are unavailable.
#
# The Han characters for the Douyin CJK slice are extracted from
# the site's own copy (config title, ui.ts strings, feed group names), so
# changing group names / nav labels / titles regenerates the font
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

if [ -f fonts-src/DouyinSansBold.ttf ]; then
  echo "subset-fonts: douyin"
  env TEXT_CJK="$HAN_CHARS" bash scripts/subset-douyin-font.sh
else
  echo "subset-fonts: skip douyin (missing fonts-src/DouyinSansBold.ttf, keeping committed woff2)"
fi
