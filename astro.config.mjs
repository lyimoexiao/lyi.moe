// @ts-check

import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, gzipSync, constants as zlibConstants } from 'node:zlib'
import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import unoCSS from '@unocss/astro'
import { defineConfig, fontProviders } from 'astro/config'
import { minify as minifyHtml } from 'html-minifier-terser'
import { rehypePlugins, remarkPlugins } from './src/remark/index.ts'

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

// Build-time compression: write .gz / .br sidecars next to every text asset
// in dist so static hosts can serve pre-compressed files (nginx:
// `gzip_static on; brotli_static on;`). Binary formats (images, woff2) are
// already compressed and skipped, as are files under the size threshold.
const COMPRESS_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.cjs', '.css', '.json', '.xml', '.svg', '.txt', '.webmanifest'])
const COMPRESS_MIN_BYTES = 1024

// HTML 压缩：移除注释；内联脚本用 terser 压缩（保留现代语法）；内联样式用 clean-css。
const HTML_MINIFY_OPTIONS = {
  removeComments: true,
  minifyJS: { ecma: 2020 },
  minifyCSS: true,
}

/** 清理一个 HTML 文件：移除注释并压缩内联脚本/样式。 */
/** @param {string} html */
async function cleanHtml(html) {
  return minifyHtml(html, HTML_MINIFY_OPTIONS)
}

function compressDist() {
  /** @param {{ dir: URL }} options */
  const onBuildDone = async ({ dir }) => {
    const root = fileURLToPath(dir)
    let files = 0
    let savedBytes = 0
    let cleanedHtml = 0
    /** @param {string} file */
    const compress = async (file) => {
      const ext = path.extname(file)
      if (!COMPRESS_EXTENSIONS.has(ext) || file.endsWith('.gz') || file.endsWith('.br'))
        return
      const buf = await fs.readFile(file)
      if (buf.length < COMPRESS_MIN_BYTES)
        return
      const gz = gzipSync(buf, { level: 9 })
      const br = brotliCompressSync(buf, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 } })
      await Promise.all([fs.writeFile(`${file}.gz`, gz), fs.writeFile(`${file}.br`, br)])
      files++
      savedBytes += buf.length - gz.length + (buf.length - br.length)
    }
    /** @param {string} current */
    const walk = async (current) => {
      for (const entry of await fs.readdir(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name)
        if (entry.isDirectory())
          await walk(full)
        else if (entry.isFile())
          await compress(full)
      }
    }
    // 先清理 HTML（压缩内联脚本、移除注释），再统一生成 .gz/.br。
    /** @param {string} current */
    const walkClean = async (current) => {
      for (const entry of await fs.readdir(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name)
        if (entry.isDirectory()) {
          await walkClean(full)
        }
        else if (entry.isFile() && entry.name.endsWith('.html')) {
          await fs.writeFile(full, await cleanHtml(await fs.readFile(full, 'utf8')))
          cleanedHtml++
        }
      }
    }
    await walkClean(root)
    await walk(root)
    process.stdout.write(`[compress-dist] ${cleanedHtml} html cleaned; ${files} files → .gz/.br (saved ${(savedBytes / 1024).toFixed(1)} KiB)\n`)
  }

  return {
    name: 'compress-dist',
    hooks: {
      'astro:build:done': onBuildDone,
    },
  }
}

// https://astro.build/config
export default defineConfig({
  site: 'https://lyi.moe',
  trailingSlash: 'never',
  integrations: [unoCSS(), mdx(), sitemap(), compressDist()],
  // Vite 8 (rolldown) prebundles Astro's dev-toolbar entrypoint (Astro force-
  // includes it in the client environment), so `exclude` cannot help. During
  // the first page load, dependency re-optimization can change the ?v= hash
  // mid-flight, and Vite answers such requests with 504
  // (ERR_OUTDATED_OPTIMIZED_DEP). Serving the request instead of throwing
  // eliminates the 504 white-screen without affecting the build.
  vite: {
    build: {
      // 字体不内联成 base64：unicode-range 分包靠独立文件按需加载
      assetsInlineLimit: 0,
    },
    environments: {
      client: {
        optimizeDeps: {
          ignoreOutdatedRequests: true,
        },
      },
    },
  },
  markdown: {
    // 全站统一的 Markdown 处理器（src/remark/index.ts）：
    // 内容集合、MDX 与友链申请内容共用同一套 remark/rehype 插件。
    processor: unified({
      remarkPlugins,
      rehypePlugins,
    }),
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
