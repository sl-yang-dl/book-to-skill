<script setup>
import { ref, computed, watch } from 'vue'
import { withBase } from 'vitepress'
import books from '../books.json'

const PAGE = 60 // 每批渲染数量,避免千本时一次性渲染全部 DOM
const query = ref('')
const activeTag = ref('')
const shelfExpanded = ref(false)
const visible = ref(PAGE)

const CATS = [
  { key: 'theme', label: '主题' },
  { key: 'genre', label: '文体' },
  { key: 'author', label: '作者' }
]
const CAT_LABEL = { author: '作者', genre: '文体', theme: '主题' }

function bookHasTag(b, active) {
  if (!active) return true
  const idx = active.indexOf(':')
  const cat = active.slice(0, idx)
  const val = active.slice(idx + 1)
  return (b.tags?.[cat] || []).includes(val)
}

// 按分类收集去重标签,用于筛选栏
const tagGroups = computed(() => {
  const g = { author: new Set(), genre: new Set(), theme: new Set() }
  books.forEach((b) => {
    CATS.forEach(({ key }) => (b.tags?.[key] || []).forEach((t) => g[key].add(t)))
  })
  return CATS.map(({ key, label }) => ({
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
      (b.desc || '').toLowerCase().includes(q)
    return tagOk && qOk
  })
})

// 只渲染当前批次,千本时分批显示
const shown = computed(() => filtered.value.slice(0, visible.value))
const hasMore = computed(() => visible.value < filtered.value.length)

function loadMore() {
  visible.value = Math.min(visible.value + PAGE, filtered.value.length)
}

// 搜索 / 切换标签时回到第一批
watch([query, activeTag], () => {
  visible.value = PAGE
})

function setTag(cat, val) {
  const id = cat + ':' + val
  activeTag.value = activeTag.value === id ? '' : id
}
</script>

<template>
  <div class='shelf-filter'>
    <span class='shelf-filter-ico' aria-hidden='true'>🔍</span>
    <input
      v-model='query'
      class='shelf-filter-input'
      type='search'
      placeholder='按书名 / 关键词 / 作者筛选笔记…'
      aria-label='按书名筛选笔记'
    />
  </div>

  <div class='shelf-tags' :class='{ expanded: shelfExpanded }'>
    <div v-for='grp in tagGroups' :key='grp.key' class='shelf-tag-group'>
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
  </div>
  <button
    v-if='tagGroups.some((g) => g.items.length)'
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
      :href='withBase(b.link)'
    >
      <img
        :src='b.cover ? withBase(b.cover) : withBase("/placeholder.svg")'
        :alt='b.title'
        class='book-card-cover'
        loading='lazy'
      />
      <div class='book-card-body'>
        <div class='book-card-title'>{{ b.title }}<span class='book-card-arrow' aria-hidden='true'>→</span></div>
        <div v-if='b.desc' class='book-card-desc'>{{ b.desc }}</div>
        <div v-if='b.tags' class='book-card-tags'>
          <template v-for='cat in CATS' :key='cat.key'>
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

  <div v-if='hasMore' class='shelf-loadmore-wrap'>
    <button class='shelf-loadmore' @click='loadMore'>
      加载更多 · 还剩 {{ filtered.length - visible }} 本
    </button>
  </div>
</template>
