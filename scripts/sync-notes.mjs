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
const coversDir = path.join(repoRoot, 'site', 'public', 'covers')
const booksJsonPath = path.join(repoRoot, 'site', '.vitepress', 'books.json')

fs.mkdirSync(outDir, { recursive: true })
fs.mkdirSync(coversDir, { recursive: true })
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

// 把任意字符串安全地写成 YAML 双引号标量(转义反斜杠与双引号)
function yamlStr(s) {
  return '"' + String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
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
    const tags = parseTagsObject(skill) || { author: [], genre: [], theme: [] }
    // 全集/系列支持:series(系列名) + volume(卷次) + overview(是否为总览页)
    const series = normSeries(fm.series)
    const volume = fm.volume ? Number(fm.volume) : null
    const overview = String(fm.overview || '').toLowerCase() === 'true'
    // 封面:支持 samples/<书名>/cover.{jpg,png,webp},同步到 site/public/covers/
    let cover = ''
    for (const ext of ['jpg', 'png', 'webp']) {
      const src = path.join(samplesDir, name, `cover.${ext}`)
      if (fs.existsSync(src)) {
        const dest = path.join(coversDir, `${name}.${ext}`)
        fs.copyFileSync(src, dest)
        cover = `/covers/${name}.${ext}`
        break
      }
    }
    books.push({ name, title, desc, tags, link: `/books/${name}`, cover, series, volume, overview })
    notes[name] = note
  }
}

// 顺序稳定:同系列相邻、总览在前、册按卷次;无系列的单本仍按书名排序
books.sort((a, b) => {
  const sa = a.series || '￿'
  const sb = b.series || '￿'
  if (sa !== sb) return sa.localeCompare(sb, 'zh-Hans-CN')
  if (a.overview !== b.overview) return a.overview ? -1 : 1
  return (a.volume ?? 0) - (b.volume ?? 0) || a.title.localeCompare(b.title, 'zh-Hans-CN')
})

// 系列聚合:把同 series 的册归到总览笔记,自动注入「本全集各册」目录;总览卡无封面时借用首册封面
const seriesMap = {}
for (const b of books) {
  if (b.series && !b.overview) (seriesMap[b.series] ||= []).push(b)
}
for (const b of books) {
  if (b.overview && b.series) {
    const items = (seriesMap[b.series] || []).slice().sort(
      (a, c) => (a.volume ?? 999) - (c.volume ?? 999) || a.title.localeCompare(c.title, 'zh-Hans-CN')
    )
    if (items.length) {
      notes[b.name] = injectSeriesToc(notes[b.name], items)
      if (!b.cover && items[0].cover) b.cover = items[0].cover
    }
  }
}

// 写入各笔记页:frontmatter 附带 prevBook/nextBook(供 NoteNav 组件做上一篇/下一篇)
books.forEach((b, i) => {
  const prevBook = i > 0 ? books[i - 1].name : ''
  const nextBook = i < books.length - 1 ? books[i + 1].name : ''
  const coverLine = b.cover ? `cover: ${yamlStr(b.cover)}\n` : ''
  const fm = `---\ntitle: ${yamlStr(b.title)}\ndescription: ${yamlStr(b.desc)}\nprevBook: ${yamlStr(prevBook)}\nnextBook: ${yamlStr(nextBook)}\n${coverLine}---\n\n`
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

// 清理 covers/ 里已不存在书的封面(书被删除后,旧封面不应残留)
for (const f of fs.readdirSync(coversDir)) {
  const base = f.replace(/\.[^.]+$/, '')
  if (!liveNames.has(base)) {
    fs.rmSync(path.join(coversDir, f), { force: true })
    console.log(`  ✗ 清理残留封面:${f}`)
  }
}

// 解析结构化 tags 对象(tags: 后换行缩进的 author/genre/theme 列表),无正则依赖
function parseTagsObject(md) {
  const lines = md.split('\n')
  const tags = { author: [], genre: [], theme: [] }
  let inTags = false
  for (const line of lines) {
    if (line.startsWith('tags:')) {
      inTags = true
      continue
    }
    if (!inTags) continue
    if (line.startsWith('  ') || line.startsWith('\t')) {
      const idx = line.indexOf(':')
      if (idx === -1) {
        inTags = false
        continue
      }
      const key = line.slice(0, idx).trim()
      let val = line.slice(idx + 1).trim()
      if (val.startsWith('[') && val.endsWith(']')) val = val.slice(1, -1)
      const arr = val.split(',').map((s) => s.trim()).filter(Boolean)
      if (arr.length) tags[key] = arr
      continue
    }
    inTags = false
  }
  return tags
}

// 归一化 series:支持 `series: 鲁迅全集` 或 `series: [鲁迅全集]`(取首项)
function normSeries(v) {
  if (v === undefined || v === null || v === '') return ''
  let s = String(v).trim()
  if (s.startsWith('[') && s.endsWith(']')) {
    s = s.slice(1, -1).split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)[0] || ''
  }
  return s
}

// 把同系列各册注入总览笔记(锚点 `## 本全集各册`;已存在则刷新,否则追加到文末)
function injectSeriesToc(note, items) {
  const heading = '## 本全集各册'
  const list = items
    .map((it) => `- [《${it.title}》](/books/${it.name}) — ${it.desc || ''}`)
    .join('\n')
  const block = `${heading}\n\n${list}\n`
  if (note.includes(heading)) {
    return note.replace(/(## 本全集各册[\s\S]*?)(\n## |$)/m, (_m, _g1, tail) => block + (tail || ''))
  }
  return note.replace(/\s*$/, '') + '\n\n' + block
}
