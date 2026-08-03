import {
  defineConfig,
  presetIcons,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  // Icon classes referenced from scripts (copy button) are not visible to
  // the scanner, which only sees rendered template output.
  safelist: ['i-ph-copy', 'i-ph-check', 'i-ph-arrow-up-right'],
  theme: {
    font: {
      sans: ['var(--font-atkinson)', 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
    },
    text: {
      micro: ['0.625rem', '0.875rem'],
      mini: ['0.6875rem', '1rem'],
      compact: ['0.8125rem', '1.125rem'],
    },
    colors: {
      c: {
        'bg': 'var(--c-bg)',
        'bg-2': 'var(--c-bg-2)',
        'bg-3': 'var(--c-bg-3)',
        'nav': 'var(--c-nav)',
        'text-1': 'var(--c-text-1)',
        'text-2': 'var(--c-text-2)',
        'text-3': 'var(--c-text-3)',
        'border': 'var(--c-border)',
        'accent': 'var(--c-accent)',
        'accent-text': 'var(--c-accent-text)',
        'accent-soft': 'var(--c-accent-soft)',
      },
    },
  },
  shortcuts: [
    {
      'color-base': 'color-c-text-1',
      'bg-base': 'bg-c-bg',
      'bg-nav': 'bg-c-nav backdrop-blur-8',
      'bg-secondary': 'bg-c-bg-2',
      'border-base': 'border-c-border',

      'bg-active': 'bg-c-bg-3',
      'color-active': 'color-c-accent-text',
      'border-active': 'border-c-accent-text/25',

      'btn-action': 'inline-flex items-center gap-2 rounded border border-base px2 py1 op75 hover:op100 hover:bg-active disabled:pointer-events-none disabled:op30!',
      'btn-action-sm': 'btn-action text-sm',
      'btn-action-icon': 'inline-flex h-10 w-10 items-center justify-center rounded border border-base op-fade hover:op100 hover:bg-active transition-opacity disabled:pointer-events-none disabled:op30!',
      'btn-icon': 'inline-flex h-10 w-10 items-center justify-center rounded op-fade hover:op100 hover:bg-active transition-opacity disabled:pointer-events-none disabled:op30!',
      'btn-header': 'inline-flex items-center justify-center rounded op-fade hover:op100 transition-opacity disabled:pointer-events-none disabled:op30!',

      'op-fade': 'op65 dark:op55',
      'op-mute': 'op30 dark:op25',

      'link-inline': 'color-active hover:op75 transition-opacity',
      'nav-link': 'rounded px-2 py-1.5 text-sm transition-opacity',

      'img-outline': 'outline outline-1 outline-black/10 dark:outline-white/10 outline-offset-[-1px]',
      'tap-scale': 'transition-transform active:scale-[0.96]',

      'z-top-nav': 'z-60',
      'z-loading-bar': 'z-200',
    },
  ],
  presets: [
    presetWind4({
      preflights: {
        reset: true,
      },
    }),
    presetIcons({ scale: 1.2 }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
