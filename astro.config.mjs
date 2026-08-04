// @ts-check

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import unoCSS from '@unocss/astro'
import { defineConfig, fontProviders } from 'astro/config'

// Syntax highlighting themes derived from the global palette in
// src/styles/theme.css: one neutral hue (220) plus the accent hue (201).
/** @param {'light' | 'dark'} mode */
function codeTheme(mode) {
  const light = mode === 'light'
  return {
    name: `lyi-${mode}`,
    type: mode,
    colors: {
      'editor.background': 'var(--c-bg-2)',
      'editor.foreground': 'var(--c-text-1)',
    },
    tokenColors: [
      { scope: ['keyword', 'storage.modifier', 'keyword.operator', 'keyword.control'], settings: { foreground: light ? 'hsl(201 85% 38%)' : 'hsl(201 100% 70%)' } },
      { scope: ['string', 'string.template', 'string.interpolated'], settings: { foreground: light ? 'hsl(145 55% 32%)' : 'hsl(145 60% 62%)' } },
      { scope: ['comment'], settings: { foreground: light ? 'hsl(220 12% 50%)' : 'hsl(220 8% 50%)' } },
      { scope: ['entity.name.function', 'support.function'], settings: { foreground: light ? 'hsl(270 50% 44%)' : 'hsl(270 65% 76%)' } },
      { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: light ? 'hsl(28 70% 38%)' : 'hsl(28 90% 70%)' } },
      { scope: ['variable', 'variable.other', 'variable.parameter', 'support.variable', 'entity.name.label', 'variable.other.constant'], settings: { foreground: light ? 'hsl(190 75% 30%)' : 'hsl(190 85% 68%)' } },
      { scope: ['punctuation', 'delimiter'], settings: { foreground: light ? 'hsl(220 14% 32%)' : 'hsl(220 10% 64%)' } },
      { scope: ['entity.name.type', 'support.type', 'storage.type'], settings: { foreground: light ? 'hsl(170 55% 30%)' : 'hsl(170 60% 64%)' } },
    ],
  }
}

// https://astro.build/config
export default defineConfig({
  site: 'https://lyi.moe',
  integrations: [unoCSS(), mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: codeTheme('light'),
        dark: codeTheme('dark'),
      },
      defaultColor: 'light',
    },
  },
  i18n: {
    locales: ['zh-cn', 'en'],
    defaultLocale: 'zh-cn',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Atkinson',
      cssVariable: '--font-atkinson',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/atkinson-regular.woff2'],
            weight: 400,
            style: 'normal',
            display: 'swap',
          },
          {
            src: ['./src/assets/fonts/atkinson-bold.woff2'],
            weight: 700,
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],
})
