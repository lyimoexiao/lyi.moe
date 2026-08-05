declare module 'twikoo' {
  export interface TwikooInitOptions {
    /** 环境 ID（腾讯云）或完整地址（Vercel / 自建）。 */
    envId: string
    /** 评论容器：选择器或元素。 */
    el?: string | HTMLElement
    /** 环境地域，如 ap-shanghai。 */
    region?: string
    /** 评论路径，默认使用当前页面 pathname。 */
    path?: string
    /** 评论区语言，如 zh-CN / en。 */
    lang?: string
  }

  const twikoo: {
    init: (options: TwikooInitOptions) => Promise<void>
  }

  export default twikoo
}

declare module 'twikoo/dist/twikoo.min.js' {
  const twikoo: {
    init: (options: import('twikoo').TwikooInitOptions) => Promise<void>
  }

  export default twikoo
}
