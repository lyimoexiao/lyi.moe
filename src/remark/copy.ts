import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

/**
 * `code`{copy} 语法：把行内代码变成可点击复制的按钮。
 * 对应 blog-v3 在 link.md / 文章中使用的 `{copy}` 后缀；
 * 渲染为带 `data-copy` 的按钮，由全局脚本（BaseHead）处理点击复制。
 */
export const remarkCopy: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'inlineCode', (node, index, parent) => {
    if (!parent || index === undefined || index + 1 >= parent.children.length)
      return
    const next = parent.children[index + 1]
    if (next.type !== 'text' || !/^\{\s*copy\s*\}$/.test(next.value))
      return
    parent.children.splice(index + 1, 1)
    node.data = {
      hName: 'button',
      hProperties: {
        'type': 'button',
        'class': 'friend-copy',
        'data-copy': node.value,
      },
      hChildren: [{ type: 'text', value: node.value }],
    }
  })
}
