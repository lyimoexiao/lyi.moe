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
  // Site identity
  author: 'Lyi.',
  title: { 'zh-cn': '依如初梦', 'en': 'Déjà Rêvé' },
  description: { 'zh-cn': '个人博客与主页。', 'en': 'Personal blog and homepage.' },

  // Social icon buttons below the typequote. Default state: no background,
  // icon in socialStyle.color. On hover the icon takes the link's brand color
  // and the button gets a tinted background derived from it (hoverBg).
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
      hoverColor: 'hover:color-[#181717] dark:hover:color-[#fff]', // GitHub brand black; white in dark mode
      hoverBg: 'hover:bg-[#181717]/12 dark:hover:bg-[#fff]/12',
    },
    {
      name: 'Email',
      href: 'mailto:lyimoexiao@outlook.com',
      icon: 'i-ri-mail-line',
      hoverColor: 'hover:color-[#0078D4]', // Outlook blue
      hoverBg: 'hover:bg-[#0078D4]/12',
    },
    {
      name: 'Bilibili',
      href: 'https://space.bilibili.com/29202562', // 替换为你的 Bilibili UID
      icon: 'i-ri-bilibili-fill',
      hoverColor: 'hover:color-[#FB7299]', // Bilibili pink
      hoverBg: 'hover:bg-[#FB7299]/12',
    },
    {
      name: '网易云音乐',
      href: 'https://music.163.com/user/home?id=295726463', // 替换为你的网易云音乐 ID
      icon: 'i-ri-netease-cloud-music-line',
      hoverColor: 'hover:color-[#C20C0C]', // NetEase Cloud Music red
      hoverBg: 'hover:bg-[#C20C0C]/12',
    },
  ] satisfies SocialLink[],

  // Random one-liner typed out on the home page.
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

/** Resolve a per-locale value, falling back to zh-cn. */
export function forLocale<T>(map: Record<string, T>, locale: string): T {
  return map[locale] ?? map['zh-cn']
}

export const siteTitle = (locale: string) => forLocale(siteConfig.title, locale)
export const siteDescription = (locale: string) => forLocale(siteConfig.description, locale)
