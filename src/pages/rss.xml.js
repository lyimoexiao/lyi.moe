import rss from '@astrojs/rss'
import { siteDescription, siteTitle } from '../config'
import { useTranslations } from '../i18n/ui'
import { getPosts } from '../lib/posts'

const locale = 'zh-cn'

export async function GET(context) {
  const t = useTranslations(locale)
  const posts = await getPosts(locale)
  return rss({
    title: `${siteTitle(locale)} - ${t('blog.title')}`,
    description: siteDescription(locale),
    site: context.site,
    items: posts.map(post => ({
      ...post.data,
      link: `/blog/${post.id.slice(`${locale}/`.length)}/`,
    })),
  })
}
