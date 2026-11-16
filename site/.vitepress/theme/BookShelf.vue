<script setup>
import { withBase } from 'vitepress'
import books from '../books.json'
</script>

<template>
  <div class="book-shelf">
    <a
      v-for="b in books"
      :key="b.name"
      class="book-card"
      :href="withBase(b.link)"
    >
      <div class="book-card-title">{{ b.title }}</div>
      <div v-if="b.desc" class="book-card-desc">{{ b.desc }}</div>
      <div class="book-card-meta">阅读笔记 →</div>
    </a>
    <p v-if="!books.length" class="book-empty">
      还没有笔记,在 <code>samples/</code> 下新增一本书试试。
    </p>
  </div>
</template>
