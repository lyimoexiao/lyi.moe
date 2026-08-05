## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Code Quality Checks

Run both commands after every code change and make sure they pass:

- `pnpm check` — Astro type checking (`astro check`)
- `pnpm lint` — ESLint

A change is not complete until both report no errors **or warnings** —
warnings count as failures and must be fixed, not silenced.

## Commit Guidelines

Never commit article content (`src/content/blog/`, `src/assets/blog-hero*.png`)
unless the user explicitly asks. Even when asked, article content is committed
at most once per request: the next commit must exclude it unless the user
explicitly states again that it should be committed. Always stage article
files with explicit paths (`git add <file>`); never use `git add -A` or
`git add .`. Make one commit per feature or change point — never bundle
unrelated changes into a single commit.

## Markdown & Remark Plugins

All Markdown (blog posts, the friends apply section, MDX) runs through one
unified processor defined in `astro.config.mjs`
(`markdown.processor: unified({ remarkPlugins, rehypePlugins })`). The plugin
list lives in `src/remark/index.ts` — add plugins there to apply them
everywhere.

Custom syntax, used in `src/content/link/apply-zh.md` / `apply-en.md` and
available in any article:

- `` `code`{copy} `` — renders a copy button for inline code
  (e.g. `` `hi@zhilu.cyou`{copy} ``)
- `:tip[text]{tip="tooltip"}` — renders a CSS tooltip annotation

Code blocks are automatically wrapped by `rehypeCodeBlock` into the blog-v3
`figure.z-codeblock` structure (language header, pinned line numbers, copy
button); authors do not need to add anything in Markdown.

Note: the Astro content layer caches rendered Markdown. After changing
remark/rehype plugins, clear `.astro/data-store.json` and
`node_modules/.astro/data-store.json` (or restart the dev server) so existing
content re-renders.

## Frontend Conventions

- **Animations:** prefer [anime.js](https://animejs.com) (already a
  dependency) for non-trivial motion, as used by the homepage hero and nav
  transitions.
- **Minimize JavaScript:** prefer static server-rendered output and CSS-only
  effects. Add JS only as progressive enhancement (e.g., copy buttons,
  `astro:page-load` re-init), keep scripts small, and never depend on JS for
  core content.

## Styling

Prefer UnoCSS utility classes when they keep the markup cleaner
(`px-4 py-16 sm:px-6`, `border-base`, `op-fade`, `i-ph-*` icons, theme tokens
like `--c-*`). Create or extend CSS files (`src/styles/*.css`, imported by
`BaseHead`) or use scoped component `<style>` blocks only when utilities are
not enough — for example global tokens and keyframes, pseudo-elements, or
complex responsive rules that would be unreadable as utility classes.

- **Icons:** use UnoCSS `presetIcons` classes (`i-ph-*`, `i-ri-*`,
  `i-fa6-brands-*` from the installed Iconify sets) instead of inline SVG or
  image assets. If an icon class is only referenced from a script (invisible
  to the UnoCSS scanner), add it to the `safelist` in `uno.config.ts`.

## Fonts

All three webfont subsets regenerate automatically before `pnpm build` via
`scripts/subset-fonts.sh` (the `prebuild` hook), from the gitignored
`fonts-src/` directory. On deploy (Vercel) `fonts-src/` doesn't exist, so the
hook exits immediately and the committed woff2 are used as-is — never make a
deploy depend on subsetting. The Han character sets for Alimama/Douyin are
derived from the site's own copy (config title, ui.ts strings, feed group
names) — no hand-maintained character list. When `fonts-src/` is absent,
regenerate the subsets with `scripts/subset-<font>.sh <source.ttf>` (needs
`uv`).

- **Alimama FangYuanTi VF** (阿里妈妈方圆体可变字体) is used for the home
  title and all page main titles (`h1.font-title`), the header site title,
  and all nav links. Subsets
  live in `public/fonts/alimama-fangyuanti/` and are regenerated with
  `scripts/subset-alimama-font.sh` (needs `uv`).
- The font has two variable axes: `wght` 200–700 and `BEVL` 1–100 (bevel).
  Nav links sit at `wght 300`; hover ramps `BEVL` only, but the **active**
  link bolds via a real `wght` bump (600) plus `BEVL 55` — the bevel alone is
  too subtle to read as bold at nav size. A `@supports not` block falls the
  active state back to `font-weight: 600` on non-variable-font browsers.
- Missing characters fall back per-character to the system CJK fonts.
- **JetBrains Mono** is used for code blocks and inline code (`--font-mono`).
  The latin subset lives in `public/fonts/jetbrains-mono/` and is regenerated
  with `scripts/subset-jetbrains-mono.sh` (needs `uv`).
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
