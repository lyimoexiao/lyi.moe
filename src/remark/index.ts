import remarkDirective from 'remark-directive'
import { remarkCopy } from './copy'
import { rehypeCodeBlock } from './rehype-codeblock'
import { remarkTip } from './tip'

/**
 * 全站统一的 Markdown 处理器配置（astro.config.mjs 的 markdown.processor）。
 * 内容集合（blog/link）、MDX 与任何 Markdown 渲染共用同一套插件：
 * - `code`{copy}：行内代码变复制按钮（对应 blog-v3 的 {copy} 语法）
 * - :tip[文字]{tip="说明"}：悬浮说明气泡（对应 blog-v3 的 :tip 指令）
 * - rehypeCodeBlock：代码块包装为 blog-v3 ProsePre 结构（头部 + 滚动区域）
 * remarkDirective 必须先于 remarkTip 解析指令。
 */
export const remarkPlugins = [remarkDirective, remarkCopy, remarkTip]
export const rehypePlugins = [rehypeCodeBlock]
