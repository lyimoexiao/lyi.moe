import antfu from '@antfu/eslint-config'

export default antfu(
  {
    astro: true,
    unocss: true,
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
    },
  },
  {
    // Blog posts embed ArkTS/other languages that don't parse as TS;
    // skip code-block linting for article content only.
    name: 'blog/code-blocks',
    ignores: ['src/content/blog/**/*.md/**'],
  },
  {
    // Astro templates follow the official starter's tab indentation.
    files: ['**/*.astro'],
    rules: {
      'style/no-tabs': 'off',
      'style/indent': 'off',
    },
  },
)
