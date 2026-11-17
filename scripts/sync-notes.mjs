// 同步脚本:扫描 samples/<书名>/references/note.md,生成 site/books/<书名>.md
// 同时产出 site/.vitepress/books.json(供首页"笔记书架"组件读取)与 site/books/index.md(全部笔记)。
// 新增一本书只需在 samples/ 下建目录,跑一次 sync(或 dev/build 自动跑)即可上线,无需改配置。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const samplesDir = path.join(repoRoot, 'samples')
const outDir = path.join(repoRoot, 'site', 'books')
const booksJsonPath = path.join(repoRoot, 'site', '.vitepress', 'books.json')

fs.mkdirSync(outDir, { recursive: true })
fs.mkdirSync(path.dirname(booksJsonPath), { recursive: true })

// 解析 tags:支持 `tags: [写作, 方法]` 或 `tags: 写作, 方法`
function parseTags(raw) {
  if (!raw) return []
  return String(raw)
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

// 极简 frontmatter 解析(支持顶层 key 与折叠标量 >- )
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  const lines = m[1].split('\n')
  const fm = {}
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if (['>-', '>', '|', '|-'].includes(val)) {
      const block = []
      let j = i + 1
      while (
        j < lines.length &&
        (lines[j].startsWith(' ') || lines[j].startsWith('\t')) &&
        lines[j].trim() !== ''
      ) {
        block.push(lines[j].trim())
        j++
      }
      i = j - 1
      fm[key] = block.join(' ').replace(/\s+/g, ' ').trim()
      continue
    }
    val = val.replace(/^['"]|['"]$/g, '').trim()
    if (val) fm[key] = val
  }
  return fm
}

const books = []
const notes = {}
if (fs.existsSync(samplesDir)) {
  for (const entry of fs.readdirSync(samplesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const name = entry.name
    const notePath = path.join(samplesDir, name, 'references', 'note.md')
    const skillPath = path.join(samplesDir, name, 'SKILL.md')
    if (!fs.existsSync(notePath)) continue
    const note = fs.readFileSync(notePath, 'utf8')
    const skill = fs.existsSync(skillPath) ? fs.readFileSync(skillPath, 'utf8') : ''
    const fm = parseFrontmatter(skill)
    const title = (fm.name || name).replace(/^note-/, '')
    const desc = fm.description || ''
    const tags = parseTags(fm.tags)
    books.push({ name, title, desc, tags, link: `/books/${name}` })
    notes[name] = note
  }
}

// 顺序稳定(按书名排序),保证书架、侧栏、上一篇/下一篇顺序在各机器一致
books.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))

// 写入各笔记页:frontmatter 附带 prevBook/nextBook(供 NoteNav 组件做上一篇/下一篇)
books.forEach((b, i) => {
  const prevBook = i > 0 ? books[i - 1].name : ''
  const nextBook = i < books.length - 1 ? books[i + 1].name : ''
  const fm = `---\ntitle: ${b.title}\ndescription: ${b.desc}\nprevBook: ${prevBook}\nnextBook: ${nextBook}\n---\n\n`
  fs.writeFileSync(path.join(outDir, `${b.name}.md`), fm + notes[b.name], 'utf8')
})

// 供组件读取的清单(链接不含 base,withBase 会在前端补)
fs.writeFileSync(booksJsonPath, JSON.stringify(books, null, 2), 'utf8')

// 全部笔记页:用 BookShelf 组件渲染(自带按书名筛选),数据来自 books.json
const indexMd = `# 全部读书笔记\n\n> 共 ${books.length} 本,由 book-to-skill 自动同步。\n\n<BookShelf />\n`
fs.writeFileSync(path.join(outDir, 'index.md'), indexMd, 'utf8')

// 清理残留:删除 samples/ 中已不存在的书对应的生成页(保留 index.md)。
// 否则删一本书后,它的旧生成页会永远留在 site/books/ 里成为脏文件。
const liveNames = new Set(books.map((b) => b.name))
for (const f of fs.readdirSync(outDir)) {
  if (f === 'index.md' || !f.endsWith('.md')) continue
  const name = f.slice(0, -3)
  if (!liveNames.has(name)) {
    fs.rmSync(path.join(outDir, f), { force: true })
    console.log(`  ✗ 清理残留笔记页:${f}`)
  }
}

console.log(`✓ 已同步 ${books.length} 本笔记到 site/books/`)
