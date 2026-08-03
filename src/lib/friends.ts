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
]
