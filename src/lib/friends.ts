export interface Friend {
  author: string
  desc: string
  link: string
  icon: string
  avatar: string
  date: string
  feed?: string
}

export const friends: Friend[] = [
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
    icon: 'https://www.pandadatech.cn/wp-content/uploads/2022/10/1667038744-llEH1.jpg',
    avatar: 'https://www.pandadatech.cn/wp-content/uploads/2022/10/1667038744-llEH1.jpg',
    date: '2023-04-04',
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
    author: `Dokiu's Blog`,
    desc: '不知道干什么就只有摆烂了',
    link: 'https://blog.yaooa.cn',
    icon: 'https://blog.adokiu.com/avatar.png',
    avatar: 'https://blog.adokiu.com/avatar.png',
    date: '2026-01-25',
    feed: 'https://blog.yaooa.cn/rss.xml',
  },
]
