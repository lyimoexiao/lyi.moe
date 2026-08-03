import rss from '@astrojs/rss'
import { SITE_TITLE } from '../consts'
import { useTranslations } from '../i18n/ui'
import { getPosts } from '../lib/posts'

const locale = 'zh-cn'

export async function GET(context) {
  const t = useTranslations(locale)
  const posts = await getPosts(locale)
  return rss({
    title: `${SITE_TITLE} - ${t('blog.title')}`,
    description: t('site.description'),
    site: context.site,
    items: posts.map(post => ({
      ...post.data,
      link: `/blog/${post.id.slice(`${locale}/`.length)}/`,
    })),
  })
}
