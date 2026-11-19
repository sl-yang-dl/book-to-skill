<script setup>
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import books from '../books.json'

const query = ref('')
const activeTag = ref('')

const allTags = computed(() => {
  const set = new Set()
  books.forEach((b) => (b.tags || []).forEach((t) => set.add(t)))
  return [...set]
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return books.filter((b) => {
    const tagOk = !activeTag.value || (b.tags || []).includes(activeTag.value)
    const qOk =
      !q ||
      b.title.toLowerCase().includes(q) ||
      (b.desc || '').toLowerCase().includes(q)
    return tagOk && qOk
  })
})
</script>

<template>
  <div class="shelf-filter">
    <span class="shelf-filter-ico" aria-hidden="true">🔍</span>
    <input
      v-model="query"
      class="shelf-filter-input"
      type="search"
      placeholder="按书名 / 关键词筛选笔记…"
      aria-label="按书名筛选笔记"
    />
  </div>

  <div v-if="allTags.length" class="shelf-tags">
    <button
      class="shelf-tag"
      :class="{ active: !activeTag }"
      @click="activeTag = ''"
    >
      全部
    </button>
    <button
      v-for="t in allTags"
      :key="t"
      class="shelf-tag"
      :class="{ active: activeTag === t }"
      @click="activeTag = t"
    >
      {{ t }}
    </button>
  </div>

  <div class="book-shelf">
    <a
      v-for="b in filtered"
      :key="b.name"
      class="book-card"
      :href="withBase(b.link)"
    >
      <img
        v-if="b.cover"
        :src="withBase(b.cover)"
        :alt="b.title + ' 封面'"
        class="book-card-cover"
        loading="lazy"
      />
      <div class="book-card-title">{{ b.title }}</div>
      <div v-if="b.desc" class="book-card-desc">{{ b.desc }}</div>
      <div class="book-card-meta">阅读笔记 →</div>
    </a>
    <p v-if="!filtered.length" class="book-empty">
      没有匹配的笔记,换个关键词或标签试试。
    </p>
  </div>
</template>
