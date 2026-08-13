import { remarkCollectImages } from '@astrojs/markdown-remark'
import remarkDirective from 'remark-directive'
import { visit } from 'unist-util-visit'
import { remarkCopy } from './copy'
import { rehypeCodeBlock } from './rehype-codeblock'
import { remarkTip } from './tip'

interface HastElement {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastElement[]
  value?: string
}

/**
 * 全站统一的 Markdown 处理器配置（astro.config.mjs 的 markdown.processor）。
 * 内容集合（blog/link）、MDX 与任何 Markdown 渲染共用同一套插件：
 * - `code`{copy}：行内代码变复制按钮（对应 blog-v3 的 {copy} 语法）
 * - :tip[文字]{tip="说明"}：悬浮说明气泡（对应 blog-v3 的 :tip 指令）
 * - rehypeCodeBlock：代码块包装为 blog-v3 ProsePre 结构（头部 + 滚动区域）
 * - remarkCollectImages + rehypeImages：文章图片走 Astro Image 管线
 *   （sharp 压缩 + srcset），dev-toolbar Audit 不再提示换用 Image 组件
 * remarkDirective 必须先于 remarkTip 解析指令。
 */
export const remarkPlugins = [remarkDirective, remarkCopy, remarkTip, remarkCollectImages]

// @astrojs/markdown-remark 的内置 rehypeImages 未导出（exports map 仅开放
// "." 与 "./shiki"），本地复刻等价实现：把文章中的 <img> 标记为
// __ASTRO_IMAGE_ 属性，由 Astro 内容层的 updateImageReferencesInBody 后处理
// 为优化图片（getImage），并在 dev 下附带 data-image-component 供 Audit 豁免。
const HAST_PRESERVED_PROPERTIES = ['className', 'htmlFor']

function rehypeImages() {
  return (tree: unknown, file: { data: Record<string, unknown> }) => {
    const astroData = file.data.astro as { localImagePaths?: string[], remoteImagePaths?: string[] } | undefined
    const localImagePaths = astroData?.localImagePaths
    const remoteImagePaths = astroData?.remoteImagePaths
    if (!localImagePaths?.length && !remoteImagePaths?.length)
      return
    const imageOccurrenceMap = new Map<string, number>()
    visit(tree as HastElement, 'element', (node) => {
      const el = node as HastElement
      if (el.tagName !== 'img')
        return
      if (typeof el.properties?.src !== 'string')
        return
      const src = decodeURI(el.properties.src)
      let imageProperties: Record<string, unknown>
      if (localImagePaths?.includes(src)) {
        imageProperties = { ...el.properties, src }
      }
      else if (remoteImagePaths?.includes(src)) {
        imageProperties = {
          inferSize: 'width' in el.properties && 'height' in el.properties ? undefined : true,
          ...el.properties,
          src,
        }
      }
      else {
        return
      }
      const hastProperties: Record<string, unknown> = {}
      for (const key of HAST_PRESERVED_PROPERTIES) {
        if (key in imageProperties) {
          hastProperties[key] = imageProperties[key]
          delete imageProperties[key]
        }
      }
      const index = imageOccurrenceMap.get(el.properties.src) || 0
      imageOccurrenceMap.set(el.properties.src, index + 1)
      el.properties = {
        ...hastProperties,
        __ASTRO_IMAGE_: JSON.stringify({ ...imageProperties, index }),
      }
    })
  }
}

export const rehypePlugins = [rehypeCodeBlock, rehypeImages]
