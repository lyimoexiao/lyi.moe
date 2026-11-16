import type { Locale } from '../config'

/**
 * 友链数据（与 blog-v3 的 `~/feeds` 结构对齐）：
 * 单独放在这个文件里，方便与站点配置分开维护。
 * 分组名称/描述按语言提供，缺省回退到 zh-cn。
 */

export interface Friend {
  author: string
  desc: string
  link: string
  icon: string
  avatar: string
  date: string
  feed?: string
}

export interface FeedGroup {
  /** 分组名，按语言提供，缺省回退到 zh-cn。 */
  name: Partial<Record<Locale, string>>
  /** 分组描述，按语言提供，缺省回退到 zh-cn。 */
  desc?: Partial<Record<Locale, string>>
  /** 分组内的友链。 */
  entries: Friend[]
}

/** 解析分组名：优先当前语言，回退 zh-cn。 */
export function groupName(group: FeedGroup, locale: string): string {
  return group.name[locale as Locale] ?? group.name['zh-cn'] ?? ''
}

/** 解析分组描述：优先当前语言，回退 zh-cn；没有描述时返回空字符串。 */
export function groupDesc(group: FeedGroup, locale: string): string {
  return group.desc?.[locale as Locale] ?? group.desc?.['zh-cn'] ?? ''
}

export const feeds: FeedGroup[] = [
  {
    name: { 'zh-cn': '好友们', 'en': 'Friends' },
    entries: [
      {
        author: '狂犬主子 🐕',
        desc: '分享计算机技术 🔧💡',
        link: 'https://www.xrgzs.top/',
        icon: 'https://www.xrgzs.top/favicon.png',
        avatar: 'https://www.xrgzs.top/img/avatar.jpg',
        date: '2023-02-08',
        feed: 'https://www.xrgzs.top/atom.xml',
      },
      {
        author: 'Shiro',
        desc: '夙兴夜，勤不怠。',
        link: 'https://shiro.love/',
        icon: 'https://assets.moedev.cn/blog/photo/user/head.jpg!webp',
        avatar: 'https://assets.moedev.cn/blog/photo/user/head.jpg!webp',
        date: '2025-01-23',
        feed: '',
      },
      {
        author: 'PanDaTech\'s Blog',
        desc: '愿此行，终抵群星。',
        link: 'https://www.pandadatech.cn/',
        icon: 'https://www.pandadatech.cn/upload/avatar.png',
        avatar: 'https://www.pandadatech.cn/upload/avatar.png',
        date: '2023-04-04',
        feed: '',
      },
      {
        author: '林德熙',
        desc: '微软最具价值专家和 .NET 基金会成员',
        link: 'https://blog.lindexi.com/',
        icon: 'https://blog.lindexi.com/img/avatar.png',
        avatar: 'https://blog.lindexi.com/img/avatar.png',
        date: '2022-05-22',
        feed: '',
      },
      {
        author: '纸鹿摸鱼处',
        desc: '纸鹿至麓不知路，支炉制露不止漉',
        link: 'https://blog.zhilu.site',
        icon: 'https://www.zhilu.site/api/avatar.png',
        avatar: 'https://www.zhilu.site/api/avatar.png',
        date: '2025-12-15',
        feed: 'https://blog.zhilu.site/atom.xml',
      },
      {
        author: '桃江老凌的小破站',
        desc: '',
        link: 'https://www.steveling.cn',
        icon: 'https://www.steveling.cn/img/icon.jpg',
        avatar: 'https://www.steveling.cn/img/icon.jpg',
        date: '2022-05-13',
        feed: 'https://www.steveling.cn/rss.xml',
      },
      {
        author: '谭汐霏',
        desc: '去把这个并不完美的世界，变成你所期望的样子。',
        link: 'https://www.shirleytan.top/',
        icon: 'https://www.shirleytan.top/upload/IMG_20260715_191651%20(1).png',
        avatar: 'https://www.shirleytan.top/upload/IMG_20260715_191651%20(1).png',
        date: '2022-05-13',
        feed: 'https://www.shirleytan.top/rss.xml',
      },
    ],
  },

  // {
  //   name: { 'zh-cn': '邻居们', 'en': 'Neighbors' },
  //   entries: [
  //     {
  //       author: '纸鹿摸鱼处',
  //       desc: '纸鹿至麓不知路，支炉制露不止漉',
  //       link: 'https://blog.zhilu.site',
  //       icon: 'https://www.zhilu.site/api/avatar.png',
  //       avatar: 'https://www.zhilu.site/api/avatar.png',
  //       date: '2025-12-15',
  //       feed: 'https://blog.zhilu.site/atom.xml',
  //     }
  //   ],

  // },
]
