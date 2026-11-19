<script setup>
import { ref, computed, watch } from 'vue'
import { withBase } from 'vitepress'
import books from '../books.json'

const PAGE = 60
const query = ref('')
const activeTag = ref('')
const shelfExpanded = ref(false)
const page = ref(1)

// 作者维度特殊处理:统计热度 + 搜索,避免千本时作者按钮爆炸
const authorExpanded = ref(false)
const authorCounts = computed(() => {
  const m = {}
  books.forEach((b) => (b.tags?.author || []).forEach((a) => { m[a] = (m[a] || 0) + 1 }))
  return m
})
const allAuthors = computed(() =>
  Object.keys(authorCounts.value).sort(
    (a, b) => authorCounts.value[b] - authorCounts.value[a] || a.localeCompare(b, 'zh-Hans-CN')
  )
)
const authorList = computed(() =>
  !authorExpanded.value ? allAuthors.value.slice(0, 8) : allAuthors.value
)

// 卡片标签用三维;筛选栏只用主题/文体(作者单独渲染)
const CATS = [
  { key: 'theme', label: '主题' },
  { key: 'genre', label: '文体' },
  { key: 'author', label: '作者' },
  { key: 'series', label: '系列' }
]
const CAT_LABEL = { author: '作者', genre: '文体', theme: '主题', series: '系列' }

function bookHasTag(b, active) {
  if (!active) return true
  const idx = active.indexOf(':')
  const cat = active.slice(0, idx)
  const val = active.slice(idx + 1)
  return (b.tags?.[cat] || []).includes(val)
}

const catGroups = computed(() => {
  const g = { theme: new Set(), genre: new Set(), series: new Set() }
  books.forEach((b) => {
    ['theme', 'genre'].forEach((k) => (b.tags?.[k] || []).forEach((t) => g[k].add(t)))
    if (b.series) g.series.add(b.series)
  })
  return CATS.filter((c) => c.key !== 'author').map(({ key, label }) => ({
    key,
    label,
    items: [...g[key]].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
  }))
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return books.filter((b) => {
    const tagOk = bookHasTag(b, activeTag.value)
    const qOk =
      !q ||
      b.title.toLowerCase().includes(q) ||
      (b.desc || '').toLowerCase().includes(q) ||
      (b.tags?.author || []).some((a) => a.toLowerCase().includes(q))
    return tagOk && qOk
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE)))
const shown = computed(() =>
  filtered.value.slice((page.value - 1) * PAGE, page.value * PAGE)
)

// 页码(少于等于 7 页全显示,否则首尾 + 当前附近 + 省略号)
const pageItems = computed(() => {
  const t = totalPages.value
  const cur = page.value
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
  const items = [1]
  const start = Math.max(2, cur - 1)
  const end = Math.min(t - 1, cur + 1)
  if (start > 2) items.push('...')
  for (let i = start; i <= end; i++) items.push(i)
  if (end < t - 1) items.push('...')
  items.push(t)
  return items
})

function go(p) {
  page.value = Math.min(Math.max(1, p), totalPages.value)
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 搜索 / 切换标签 / 搜索作者 → 回到第 1 页
watch([query, activeTag], () => {
  page.value = 1
})

function setTag(cat, val) {
  const id = cat + ':' + val
  activeTag.value = activeTag.value === id ? '' : id
}
function seriesCount(s) {
  return books.filter((x) => x.series === s && !x.overview).length
}
</script>

<template>
  <div class='shelf-filter'>
    <span class='shelf-filter-ico' aria-hidden='true'>🔍</span>
    <input
      v-model='query'
      class='shelf-filter-input'
      type='search'
      placeholder='按书名 / 作者 / 关键词搜索笔记…'
      aria-label='按书名筛选笔记'
    />
  </div>

  <div class='shelf-tags' :class='{ expanded: shelfExpanded }'>
    <div v-for='grp in catGroups' :key='grp.key' class='shelf-tag-group'>
      <span class='shelf-tag-group-label'>{{ grp.label }}</span>
      <button
        v-for='t in grp.items'
        :key='t'
        class='shelf-tag'
        :class='{ active: activeTag === grp.key + ":" + t }'
        @click='setTag(grp.key, t)'
      >
        {{ t }}
      </button>
    </div>
    <div class='shelf-tag-group shelf-tag-group-author'>
      <span class='shelf-tag-group-label'>作者</span>
      <button
        v-for='a in authorList'
        :key='a'
        class='shelf-tag'
        :class='{ active: activeTag === "author:" + a }'
        @click='setTag("author", a)'
      >
        {{ a }}
      </button>
      <button
        v-if='!authorQuery && allAuthors.length > 8'
        class='shelf-tag-more-inline'
        @click='authorExpanded = !authorExpanded'
      >
        {{ authorExpanded ? '收起' : '更多作者' }}
      </button>
    </div>
  </div>
  <button
    v-if='catGroups.some((g) => g.items.length) || allAuthors.length'
    class='shelf-tag-more'
    @click='shelfExpanded = !shelfExpanded'
  >
    {{ shelfExpanded ? '收起 ▲' : '更多标签 ▾' }}
  </button>

  <div class='book-shelf'>
    <a
      v-for='b in shown'
      :key='b.name'
      class='book-card'
      :class='{ overview: b.overview }'
      :href='withBase(b.link)'
    >
      <img
        :src='b.cover ? withBase(b.cover) : withBase("/placeholder.svg")'
        :alt='b.title'
        class='book-card-cover'
        loading='lazy'
      />
      <div class='book-card-body'>
        <div class='book-card-title'>{{ b.title }}</div>
        <div v-if='b.series' class='book-card-series'>
          <template v-if='b.overview'>共 {{ seriesCount(b.series) }} 册</template>
          <template v-else>{{ b.series }}<span v-if='b.volume'> · 第 {{ b.volume }} 卷</span></template>
        </div>
        <div v-if='b.desc' class='book-card-desc'>{{ b.desc }}</div>
        <div v-if='b.tags' class='book-card-tags'>
          <template v-for='cat in CATS.filter((c) => c.key !== "series")' :key='cat.key'>
            <span
              v-for='t in (b.tags[cat.key] || [])'
              :key='cat.key + t'
              class='tag-chip'
              :class="'tag-' + cat.key"
            >
              <span class='tag-cat'>{{ CAT_LABEL[cat.key] }}</span>{{ t }}
            </span>
          </template>
        </div>
      </div>
    </a>
    <p v-if='!filtered.length' class='book-empty'>
      没有匹配的笔记,换个关键词或标签试试。
    </p>
  </div>

  <div v-if='totalPages > 1' class='shelf-pager'>
    <button class='pager-btn' :disabled='page <= 1' @click='go(page - 1)'>← 上一页</button>
    <div class='pager-pages'>
      <button
        v-for='p in pageItems'
        :key='p'
        class='pager-num'
        :class='{ active: p === page, gap: p === "..." }'
        :disabled='p === "..."'
        @click='typeof p === "number" && go(p)'
      >
        {{ p }}
      </button>
    </div>
    <button class='pager-btn' :disabled='page >= totalPages' @click='go(page + 1)'>下一页 →</button>
  </div>
  <div v-if='totalPages > 1' class='shelf-pager-info'>
    共 {{ filtered.length }} 本 · 第 {{ page }} / {{ totalPages }} 页
  </div>
</template>
