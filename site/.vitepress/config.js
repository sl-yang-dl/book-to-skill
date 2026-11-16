import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const samplesDir = path.resolve(__dirname, '../samples')

// 构建时动态扫描 samples/,自动生成侧边栏与导航,无需手动维护
function getBooks() {
  if (!fs.existsSync(samplesDir)) return []
  return fs
    .readdirSync(samplesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) =>
      fs.existsSync(path.join(samplesDir, name, 'references', 'note.md'))
    )
}

const books = getBooks()

// 本地开发 base 为 '/';GitHub Pages 项目页需设为 '/<仓库名>/'
// 由 CI 通过环境变量 VP_BASE 注入,本地无需设置。
const base = process.env.VP_BASE || '/'

const sidebar = [
  {
    text: '读书笔记',
    collapsed: false,
    items: [
      { text: '全部笔记', link: '/books/' },
      ...books.map((b) => ({ text: b, link: `/books/${b}` }))
    ]
  }
]

export default defineConfig({
  base,
  title: '读书笔记 · book-to-skill',
  description: '把书变成你读得懂、还能复用的读书笔记',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '全部笔记', link: '/books/' }
    ],
    sidebar,
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    docFooter: { prev: false, next: false },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lastUpdatedText: '最后更新'
  }
})
