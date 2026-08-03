export const languages = {
  'zh-cn': '中文',
  'en': 'English',
}

export const defaultLang = 'zh-cn'

export const ui = {
  'zh-cn': {
    'nav.home': '首页',
    'nav.blog': '博客',
    'nav.friends': '友链',
    'nav.about': '关于',
    'nav.menu': '菜单',
    'theme.toggle': '切换主题',
    'lang.switch': 'English',
    'site.title': '依如初梦',
    'site.description': '个人博客与主页。',
    'home.latest': '最新文章',
    'home.empty': '还没有文章。',
    'blog.title': '博客',
    'blog.empty': '还没有文章。',
    'blog.back': '博客',
    'blog.updated': '更新于',
    'about.title': '关于',
    'about.body': '这里是关于页面，内容即将上线。',
    'rss.feed': 'RSS 订阅',
    'post.license': '本文采用 CC BY-NC-SA 4.0 许可协议',
    'footer.github': 'GitHub',
  },
  'en': {
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.friends': 'Friends',
    'nav.about': 'About',
    'nav.menu': 'Menu',
    'theme.toggle': 'Toggle color theme',
    'lang.switch': '中文',
    'site.title': 'Déjà Rêvé',
    'site.description': 'Personal blog and homepage.',
    'home.latest': 'Latest posts',
    'home.empty': 'No posts yet.',
    'blog.title': 'Blog',
    'blog.empty': 'No posts yet.',
    'blog.back': 'Blog',
    'blog.updated': 'updated',
    'about.title': 'About',
    'about.body': 'This is the about page. Content coming soon.',
    'rss.feed': 'RSS feed',
    'post.license': 'This article is licensed under CC BY-NC-SA 4.0',
    'footer.github': 'GitHub',
  },
} as const

export type UiKey = keyof typeof ui[typeof defaultLang]

export function getLocale(locale: string | undefined) {
  return locale ?? defaultLang
}

export function useTranslations(lang: string) {
  return (key: UiKey) => ui[lang as keyof typeof ui]?.[key] ?? ui[defaultLang][key]
}
