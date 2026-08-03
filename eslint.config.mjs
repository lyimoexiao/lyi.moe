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
    // Astro templates follow the official starter's tab indentation.
    files: ['**/*.astro'],
    rules: {
      'style/no-tabs': 'off',
      'style/indent': 'off',
    },
  },
)
