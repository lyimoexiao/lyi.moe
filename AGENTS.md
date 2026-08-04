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
  Nav links sit at `wght 300`; hover ramps `BEVL` only, but the **active**
  link bolds via a real `wght` bump (600) plus `BEVL 55` — the bevel alone is
  too subtle to read as bold at nav size. A `@supports not` block falls the
  active state back to `font-weight: 600` on non-variable-font browsers.
- Changing copy that renders through the font means extending `TEXT_CJK` in
  the subset script and re-running it; missing characters fall back
  per-character to the system CJK fonts.
- **JetBrains Mono** is used for code blocks and inline code (`--font-mono`).
  The latin subset lives in `public/fonts/jetbrains-mono/` and is regenerated
  with `scripts/subset-jetbrains-mono.sh <source.ttf>` (needs `uv`).
- **Article body** stays sans (Atkinson + system CJK sans); `.prose` in-article
  headings use the Alimama display font (weight 550) like blog-v3's
  `--font-creative` headings. `--font-serif` is a reserved token for a future
  story variant and is not applied to normal articles.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
