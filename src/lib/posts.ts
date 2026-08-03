import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'

export type BlogPost = CollectionEntry<'blog'>

export async function getPosts(locale: string) {
  return (await getCollection('blog', ({ id }) => id.startsWith(`${locale}/`)))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
}

export async function getBlogStaticPaths(locale: string) {
  const posts = await getPosts(locale)
  return posts.map(post => ({
    params: { slug: post.id.slice(`${locale}/`.length) },
    props: post,
  }))
}
