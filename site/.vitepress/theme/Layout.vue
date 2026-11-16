<script setup>
import DefaultTheme from 'vitepress/theme'
import BookShelf from './BookShelf.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-features-after>
      <div class="shelf-wrap">
        <h2 class="shelf-title">笔记书架</h2>
        <p class="shelf-sub">每本都是按「七块骨架」抽取的读书笔记 skill。</p>
        <BookShelf />
      </div>
    </template>
  </Layout>
</template>
