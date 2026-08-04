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
    'home.latest': '最新文章',
    'home.empty': '还没有文章。',
    'blog.title': '博客',
    'blog.empty': '还没有文章。',
    'blog.back': '博客',
    'blog.updated': '更新于',
    'toc.title': '目录',
    'toc.close': '关闭目录',
    'about.title': '关于',
    'about.body': '这里是关于页面，内容即将上线。',
    'rss.feed': 'RSS 订阅',
    'post.license': '本文采用 CC BY-NC-SA 4.0 许可协议',
    'post.words': '字',
    'error.404.title': '页面未找到',
    'error.404.description': '抱歉，您访问的页面不存在或已被移动。',
    'error.500.title': '服务器错误',
    'error.500.description': '抱歉，页面出错了，请稍后再试。',
    'error.backHome': '返回首页',
  },
  'en': {
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.friends': 'Friends',
    'nav.about': 'About',
    'nav.menu': 'Menu',
    'theme.toggle': 'Toggle color theme',
    'lang.switch': '中文',
    'home.latest': 'Latest posts',
    'home.empty': 'No posts yet.',
    'blog.title': 'Blog',
    'blog.empty': 'No posts yet.',
    'blog.back': 'Blog',
    'blog.updated': 'updated',
    'toc.title': 'Table of Contents',
    'toc.close': 'Close TOC',
    'about.title': 'About',
    'about.body': 'This is the about page. Content coming soon.',
    'rss.feed': 'RSS feed',
    'post.license': 'This article is licensed under CC BY-NC-SA 4.0',
    'post.words': 'words',
    'error.404.title': 'Page not found',
    'error.404.description': 'Sorry, the page you\'re looking for doesn\'t exist or has been moved.',
    'error.500.title': 'Server error',
    'error.500.description': 'Sorry, something went wrong. Please try again later.',
    'error.backHome': 'Back to home',
  },
} as const

export type UiKey = keyof typeof ui[typeof defaultLang]

export function getLocale(locale: string | undefined) {
  return locale ?? defaultLang
}

export function useTranslations(lang: string) {
  return (key: UiKey) => ui[lang as keyof typeof ui]?.[key] ?? ui[defaultLang][key]
}
