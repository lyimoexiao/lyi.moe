// Social links, rendered as icon buttons on the home page below the
// typequote. Add or remove entries here to change the icon row.
//
// Default state: no background, icon in SOCIAL_LINK_STYLE.color. On hover the
// icon takes the link's brand color and the button gets a tinted background
// derived from that same brand color (see hoverBg).

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

/** Default button styling. Override per link or edit here. */
export const SOCIAL_LINK_STYLE = {
  /** Icon fill in the default state. */
  color: 'color-c-text-2',
  /** Hover fallbacks used when a link defines no brand color. */
  hoverColor: 'hover:color-c-accent-text',
  hoverBg: 'hover:bg-c-accent-soft',
}

export const SOCIAL_LINKS: SocialLink[] = [
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
    href: 'https://space.bilibili.com/<UID>', // TODO: 替换为你的 Bilibili UID
    icon: 'i-ri-bilibili-fill',
    hoverColor: 'hover:color-[#FB7299]', // Bilibili pink
    hoverBg: 'hover:bg-[#FB7299]/12',
  },
  {
    name: '网易云音乐',
    href: 'https://music.163.com/user/home?id=<ID>', // TODO: 替换为你的网易云音乐 ID
    icon: 'i-ri-netease-cloud-music-line',
    hoverColor: 'hover:color-[#C20C0C]', // NetEase Cloud Music red
    hoverBg: 'hover:bg-[#C20C0C]/12',
  },
]
