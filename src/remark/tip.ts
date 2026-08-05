import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

interface DirectiveNode {
  type: string
  name?: string
  attributes?: Record<string, string | number | boolean | null | undefined>
  data?: Record<string, unknown>
}

/**
 * :tip[文字]{tip="说明"} 文本指令：渲染为带悬浮说明气泡的 span。
 * 由 remark-directive 先解析出 textDirective 节点，这里再转换成 HTML。
 */
export const remarkTip: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'textDirective', (node) => {
    const directive = node as unknown as DirectiveNode
    if (directive.name !== 'tip')
      return
    const tip = typeof directive.attributes?.tip === 'string' ? directive.attributes.tip : ''
    directive.data = {
      hName: 'span',
      hProperties: {
        'class': 'tip',
        'data-tip': tip,
        'tabindex': '0',
      },
    }
  })
}
