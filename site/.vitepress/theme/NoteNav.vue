<script setup>
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import books from '../books.json'

// 当前笔记的上一篇/下一篇由 sync 脚本写入 frontmatter(prevBook/nextBook 为书名)
const { frontmatter } = useData()
const find = (name) => books.find((b) => b.name === name)

const prev = computed(() => find(frontmatter.value.prevBook) || null)
const next = computed(() => find(frontmatter.value.nextBook) || null)
</script>

<template>
  <nav v-if="prev || next" class="note-nav" aria-label="笔记导航">
    <a v-if="prev" class="note-nav-link prev" :href="withBase(prev.link)">
      <span class="note-nav-dir">← 上一篇</span>
      <span class="note-nav-title">{{ prev.title }}</span>
    </a>
    <span v-else class="note-nav-link placeholder" aria-hidden="true"></span>

    <a v-if="next" class="note-nav-link next" :href="withBase(next.link)">
      <span class="note-nav-dir">下一篇 →</span>
      <span class="note-nav-title">{{ next.title }}</span>
    </a>
    <span v-else class="note-nav-link placeholder" aria-hidden="true"></span>
  </nav>
</template>
