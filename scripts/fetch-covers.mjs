#!/usr/bin/env node
// scripts/fetch-covers.mjs
// 从豆瓣按书名自动抓取每本读书笔记的封面,保存到 samples/<书名>/cover.jpg
// 用法:
//   node scripts/fetch-covers.mjs          # 抓取并下载封面
//   node scripts/fetch-covers.mjs --dry    # 只搜索匹配,不下载(先核查命中质量)
//
// 匹配策略:书名 + 作者双重匹配,作者匹配权重不低于纯书名匹配,以正确处理同名书
//          (如《故事》《文心》《文章例话》)。若主搜结果作者都不匹配笔记作者,
//          再用「书名 + 作者」组合搜一次(如《怎样写作》豆瓣只返回任仲然版)。
//          书名直接搜不到时,回退用笔记里的《书名》再试(老书 / 合订本)。
//          笔记作者提取兼容多种来源格式,并只扫来源块(顶部)避免正文误匹配。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const samplesDir = path.join(repoRoot, 'samples')
const reportPath = path.resolve(repoRoot, 'covers-report.json')

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const REF = 'https://book.douban.com/'
const API = 'https://book.douban.com/j/subject_suggest'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const DRY = process.argv.includes('--dry')

// 归一化:去标点 / 空格 / 书名号,便于比较
const norm = (s) =>
  String(s || '').replace(/[《》\s·・:：.,，。!！?？、()（）\[\]【】]/g, '')

function listBooks() {
  if (!fs.existsSync(samplesDir)) return []
  return fs
    .readdirSync(samplesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) =>
      fs.existsSync(path.join(samplesDir, name, 'references', 'note.md'))
    )
}

// 从 note.md 顶部来源块解析作者,用于匹配加权 / 组合搜索 / 防错版
// 只扫来源块(顶部前 1500 字符),避免正文提及干扰
// 兼容格式:
//   格式1: 来源:作者《书名》
//   格式2: 《书名》,作者 著
//   格式3: 《书名》/ 作者 著 /(斜杠分隔,如《文心》/ 夏丏尊、叶圣陶 著 /)
//   格式4: - 作者:作者名(来源块里的「作者」字段,如 戴维·迈尔斯)
function extractAuthors(name) {
  const notePath = path.join(samplesDir, name, 'references', 'note.md')
  if (!fs.existsSync(notePath)) return []
  const txt = fs.readFileSync(notePath, 'utf8').slice(0, 1500)
  const found = new Set()
  const pushClean = (raw) => {
    const cleaned = String(raw)
      .replace(/[（(][^)）]*[)）]/g, '')
      .replace(/[\[\]【】]/g, '')
      .trim()
    cleaned
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((a) => found.add(a))
  }
  const m1 = txt.match(/来源[:：]\s*([^《\n]+?)\s*《/)
  if (m1) pushClean(m1[1])
  const m2 = txt.match(/《[^》]+》[^,，]*[,，]\s*([^;；。\n]+?)\s*著/)
  if (m2) pushClean(m2[1])
  const m3 = txt.match(/《[^》]+》\s*\/\s*([^/]+?)\s*著/)
  if (m3) pushClean(m3[1])
  const m4 = txt.match(/(?:^|\n)\s*-\s*作者[:：]\s*([^(\n（]+)/)
  if (m4) pushClean(m4[1])
  return [...found]
}

// 打分:书名相似度 + 作者匹配(作者匹配权重不低于纯书名完全匹配)
function score(cand, name, authors) {
  let s = 0
  const t = cand.title || ''
  if (norm(t) === norm(name)) s += 5
  else if (norm(t).includes(norm(name)) || norm(name).includes(norm(t))) s += 3
  else if (norm(name).length >= 2 && norm(t).includes(norm(name).slice(0, 2))) s += 1
  if (authors.length) {
    const an = norm(cand.author_name || '')
    for (const a of authors) {
      const na = norm(a)
      if (na && an.includes(na)) {
        s += 5
        break
      }
    }
  }
  return s
}

async function fetchCandidates(name, authors) {
  const tryQ = async (q) => {
    try {
      const r = await fetch(`${API}?q=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': UA, 'Referer': REF }
      })
      if (!r.ok) return []
      const j = await r.json()
      return Array.isArray(j) ? j : []
    } catch {
      return []
    }
  }
  let cands = await tryQ(name)
  // 主搜结果作者都不匹配笔记作者时,用「书名 + 作者」组合再搜一次
  if (authors.length) {
    const hit = cands.some((c) =>
      authors.some((a) => norm(c.author_name || '').includes(norm(a)))
    )
    if (!hit) {
      const more = await tryQ(`${name} ${authors[0]}`)
      cands = cands.concat(more)
    }
  }
  // 书名直接搜不到时,回退用笔记里的《书名》再试(老书 / 合订本常需拆词)
  if (!cands.length) {
    const notePath = path.join(samplesDir, name, 'references', 'note.md')
    if (fs.existsSync(notePath)) {
      const txt = fs.readFileSync(notePath, 'utf8')
      const bm = txt.match(/《([^》]+)》/)
      if (bm) {
        const inner = bm[1].split(/[·•\s]/)[0]
        cands = await tryQ(inner)
      }
    }
  }
  return cands
}

// 豆瓣封面默认给小图(/s/),依次尝试 大(l) → 中(m) → 小(s) 三级清晰度
async function downloadCover(name, pic) {
  for (const sz of ['l', 'm', 's']) {
    const url = pic.replace(
      '/view/subject/s/public/',
      `/view/subject/${sz}/public/`
    )
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Referer': REF }
      })
      if (!r.ok) continue
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length > 1500) {
        const out = path.join(samplesDir, name, 'cover.jpg')
        fs.writeFileSync(out, buf)
        return { ok: true, size: buf.length, used: sz }
      }
    } catch {
      /* 试下一级清晰度 */
    }
  }
  return { ok: false }
}

async function main() {
  const books = listBooks()
  const report = []
  console.log('')
  console.log(`开始${DRY ? '核查(不下载)' : '抓取'} ${books.length} 本笔记封面…`)
  console.log('')
  for (const name of books) {
    const authors = extractAuthors(name)
    const candidates = await fetchCandidates(name, authors)
    let best = null
    let bestScore = -1
    for (const c of candidates) {
      const s = score(c, name, authors)
      if (s > bestScore) {
        bestScore = s
        best = c
      }
    }
    let status = 'fail'
    let cover = null
    let used = null
    // 作者保护:笔记提取到作者时,最佳候选的作者必须匹配,否则宁可不下(防错版)
    const authorHit =
      !authors.length ||
      (best && authors.some((a) => norm(best.author_name || '').includes(norm(a))))
    if (best && bestScore >= 10) status = 'high'
    else if (best && bestScore >= 5) status = authorHit ? 'medium' : 'mismatch'
    else if (best) status = 'low'
    if (!DRY && best && bestScore >= 5 && authorHit) {
      const dl = await downloadCover(name, best.pic)
      if (dl.ok) {
        status = 'ok'
        cover = `samples/${name}/cover.jpg`
        used = dl.used
      } else status = 'download-failed'
    }
    const matched = best
      ? `${best.title} / ${best.author_name || ''} / ${best.year || ''}`
      : '(无候选)'
    console.log(
      `${status.padEnd(15)} ${name}  ←  ${matched}${used ? '  [' + used + ']' : ''}`
    )
    report.push({
      name,
      status,
      authors,
      matchedTitle: best?.title || null,
      author: best?.author_name || null,
      year: best?.year || null,
      score: bestScore,
      cover,
      candidates: candidates.map((c) => ({
        title: c.title,
        author: c.author_name,
        year: c.year
      }))
    })
    await sleep(DRY ? 150 : 400)
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')
  console.log('')
  console.log(`报告已写入 ${path.relative(repoRoot, reportPath)}`)
  const ok = report.filter((r) => r.status === 'ok').length
  const needCheck = report.filter((r) =>
    ['low', 'fail', 'download-failed', 'mismatch'].includes(r.status)
  ).length
  console.log(`成功下载:${ok}  需人工核查 / 补全:${needCheck}`)
}

main()
