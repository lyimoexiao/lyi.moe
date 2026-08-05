// Single site configuration. Edit this file to change the blog's identity,
// social links, and home-page quotes. Per-locale values fall back to zh-cn.

export type Locale = 'zh-cn' | 'en'

export interface SocialLink {
  /** Brand name, used for the button's aria-label and title. */
  name: string
  /** Absolute URL the icon button links to. */
  href: string
  /** UnoCSS presetIcons class, e.g. `i-ri-github-fill`. */
  icon: string
  /** Brand icon color on hover (UnoCSS class, includes the `hover:` variant). */
  hoverColor?: string
  /** Tinted button background on hover, from the brand color (UnoCSS class). */
  hoverBg?: string
}

export const siteConfig = {
  author: 'Lyi.',
  title: { 'zh-cn': '依如初梦', 'en': 'Déjà Rêvé' },
  description: { 'zh-cn': '在无限绝望中前行...', 'en': 'Into infinity darkness...' },
  keywords: { 'zh-cn': '博客, 个人网站, 前端, 分享, LyiMoeXiao, 凌梦晓, 个人博客, RSS, 计算机科学, 编程, 软件开发, 开源技术, 技术分享, 生活日常, VOCALOID, 中术, 虚拟歌姬', 'en': 'LyiMoeXiao, blog, personal site, frontend, computer science, programming, software development, open source, technology, personal blog' },

  socialStyle: {
    /** Icon fill in the default state. */
    color: 'color-c-text-2',
    /** Hover fallbacks used when a link defines no brand color. */
    hoverColor: 'hover:color-c-accent-text',
    hoverBg: 'hover:bg-c-accent-soft',
  },
  social: [
    {
      name: 'GitHub',
      href: 'https://github.com/lyimoexiao',
      icon: 'i-ri-github-fill',
      hoverColor: 'hover:color-[#181717] dark:hover:color-[#fff]',
      hoverBg: 'hover:bg-[#181717]/12 dark:hover:bg-[#fff]/12',
    },
    {
      name: 'Email',
      href: 'mailto:lyimoexiao@outlook.com',
      icon: 'i-ri-mail-line',
      hoverColor: 'hover:color-[#0078D4]',
      hoverBg: 'hover:bg-[#0078D4]/12',
    },
    {
      name: 'Bilibili',
      href: 'https://space.bilibili.com/29202562',
      icon: 'i-ri-bilibili-fill',
      hoverColor: 'hover:color-[#FB7299]',
      hoverBg: 'hover:bg-[#FB7299]/12',
    },
    {
      name: '网易云音乐',
      href: 'https://music.163.com/user/home?id=295726463',
      icon: 'i-ri-netease-cloud-music-line',
      hoverColor: 'hover:color-[#C20C0C]',
      hoverBg: 'hover:bg-[#C20C0C]/12',
    },
  ] satisfies SocialLink[],

  quotes: [
    '『心贴心 想这一刻 拥在你怀里』',
    '『幻想着命运 如果能让我们 再靠近』',
    '『就算多少痛苦 多少的委屈 都忘记』',
    '『像一场幻觉 让我无从躲避』',
    '『諦めたくても 諦めきれないや』',
  ],
} as const

// Twikoo 评论配置。留空 `envId` 时评论区不会渲染。
// 部署方式参考 https://twikoo.js.org/quick-start.html
export const twikooConfig = {
  /** Twikoo 环境 ID：腾讯云环境填 envId；Vercel/自建环境填完整地址（如 https://xxx.vercel.app）。 */
  envId: 'https://twikoo.66ccff.love',
  /** 环境地域：腾讯云环境填 ap-shanghai 或 ap-guangzhou；Vercel 环境留空。 */
  region: '',
  /** 评论区语言，如 zh-CN / en；留空时跟随当前页面语言。 */
  lang: '',
  /** 自定义评论路径，用于区分文章；留空时使用当前页面 URL。 */
  path: '',
} as const

export function forLocale<T>(map: Record<string, T>, locale: string): T {
  return map[locale] ?? map['zh-cn']
}

export const siteTitle = (locale: string) => forLocale(siteConfig.title, locale)
export const siteDescription = (locale: string) => forLocale(siteConfig.description, locale)
export const siteKeywords = (locale: string) => forLocale(siteConfig.keywords, locale)
