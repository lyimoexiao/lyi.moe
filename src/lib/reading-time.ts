// Rough word count for a post's body, used on the blog list.
// CJK characters count as one each; other text counts by whitespace token.

export function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1') // links → keep the label
    .replace(/^#{1,6}\s+/gm, '') // ATX headings
    .replace(/[*_~>#]/g, ' ') // emphasis, blockquotes, etc.
    .replace(/\s+/g, ' ')
    .trim()

  const cjk = (text.match(/[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/g) ?? []).length
  const latin = text
    .replace(/[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length

  return cjk + latin
}
