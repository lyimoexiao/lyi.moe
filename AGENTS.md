## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Fonts

- **Alimama FangYuanTi VF** (阿里妈妈方圆体可变字体) is used for the home
  title (`h1.font-title`), the header site title, and all nav links. Subsets
  live in `public/fonts/alimama-fangyuanti/` and are regenerated with
  `scripts/subset-alimama-font.sh <source.ttf>` (needs `uv`).
- The font has two variable axes: `wght` 200–700 and `BEVL` 1–100 (bevel).
  Nav hover/active ramp `BEVL` only — `wght` changes glyph advance widths
  and makes nav items shift horizontally.
- Changing copy that renders through the font means extending `TEXT_CJK` in
  the subset script and re-running it; missing characters fall back
  per-character to the system CJK fonts.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
