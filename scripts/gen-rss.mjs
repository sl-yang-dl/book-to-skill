// 生成 RSS 2.0 feed:读取 site/.vitepress/books.json,输出 site/public/feed.xml。
// 由 build 流程在 sync 之后调用(Pages 基路径由 VP_BASE 注入)。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const booksJson = path.join(repoRoot, 'site', '.vitepress', 'books.json')
const samplesDir = path.join(repoRoot, 'samples')
const out = path.join(repoRoot, 'site', 'public', 'feed.xml')

const base = (process.env.VP_BASE || '/').replace(/\/$/, '')
const siteUrl = `https://sl-yang-dl.github.io${base}`

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const books = JSON.parse(fs.readFileSync(booksJson, 'utf8'))

const items = books
  .map((b) => {
    const notePath = path.join(samplesDir, b.name, 'references', 'note.md')
    let pub = new Date()
    try {
      pub = new Date(fs.statSync(notePath).mtimeMs)
    } catch {}
    const link = `${siteUrl}/books/${encodeURIComponent(b.name)}`
    const desc = esc(b.desc || '')
    return `    <item>\n      <title>${esc(b.title)}</title>\n      <link>${link}</link>\n      <guid isPermaLink="true">${link}</guid>\n      <pubDate>${pub.toUTCString()}</pubDate>\n      <description>${desc}</description>\n    </item>`
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>读书笔记 · book-to-skill</title>\n    <link>${siteUrl}</link>\n    <description>把书变成你读得懂、还能复用的读书笔记</description>\n    <language>zh-CN</language>\n${items}\n  </channel>\n</rss>\n`

fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, xml, 'utf8')
console.log(`✓ 已生成 RSS:${siteUrl}/feed.xml(${books.length} 条)`)
