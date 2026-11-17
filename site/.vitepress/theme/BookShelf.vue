<script setup>
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import books from '../books.json'

const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return books
  return books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      (b.desc || '').toLowerCase().includes(q)
  )
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
  <div class="book-shelf">
    <a
      v-for="b in filtered"
      :key="b.name"
      class="book-card"
      :href="withBase(b.link)"
    >
      <div class="book-card-title">{{ b.title }}</div>
      <div v-if="b.desc" class="book-card-desc">{{ b.desc }}</div>
      <div class="book-card-meta">阅读笔记 →</div>
    </a>
    <p v-if="!filtered.length" class="book-empty">
      没有匹配的笔记,换个关键词试试。
    </p>
  </div>
</template>
