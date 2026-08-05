import { SKIP, visit } from 'unist-util-visit'

interface HastElement {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastElement[]
  value?: string
}

/**
 * 把 shiki 的 `<pre class="astro-code">` 包装成 blog-v3 ProsePre 的结构：
 * `<figure class="z-codeblock"><figcaption>语言 + 操作区</figcaption><pre>…</pre></figure>`。
 * 语言标签与复制按钮因此位于代码块头部：不覆盖代码、不随代码横向滚动，
 * 行号则固定在左侧 gutter（样式见 prose.css）。
 */
export function rehypeCodeBlock() {
  return (tree: unknown) => {
    visit(tree as HastElement, 'element', (node, index, parent) => {
      const el = node as HastElement
      if (el.tagName !== 'pre' || index === undefined || !parent)
        return
      const cls = el.properties?.class ?? el.properties?.className
      const classes = typeof cls === 'string' ? cls.split(/\s+/) : Array.isArray(cls) ? cls : []
      if (!classes.includes('astro-code'))
        return
      const lang = typeof el.properties?.dataLanguage === 'string' ? el.properties.dataLanguage : ''
      const figcaption: HastElement = {
        type: 'element',
        tagName: 'figcaption',
        properties: {},
        children: [
          ...(lang
            ? [{
              type: 'element',
              tagName: 'span',
              properties: { className: ['code-language'] },
              children: [{ type: 'text', value: lang }],
            } satisfies HastElement]
            : []),
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-operations'] },
            children: [],
          },
        ],
      }
      const figure: HastElement = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['z-codeblock'] },
        children: [figcaption, el],
      }
      const parentEl = parent as HastElement
      parentEl.children?.splice(index, 1, figure)
      return SKIP
    })
  }
}
