import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.optional(image()),
      // Displayed on the blog list; omit to hide it.
      category: z.string().optional(),
      // Show a CC license notice at the top of the post. Set `license: false` to hide it.
      license: z.boolean().default(true),
    }),
})

const link = defineCollection({
  // 友链页“申请友链”要求：src/content/link/apply-zh.md / apply-en.md
  loader: glob({ base: './src/content/link', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
  }),
})

export const collections = { blog, link }
