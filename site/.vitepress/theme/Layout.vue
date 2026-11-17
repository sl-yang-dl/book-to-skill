<script setup>
import DefaultTheme from 'vitepress/theme'
import { withBase } from 'vitepress'
import BookShelf from './BookShelf.vue'
import NoteNav from './NoteNav.vue'

const { Layout } = DefaultTheme
const home = withBase('/')
const shelf = withBase('/books/')
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

    <!-- 笔记页底部:上一篇 / 下一篇 -->
    <template #doc-after>
      <NoteNav />
    </template>
  </Layout>

  <!-- 移动端底部快捷栏(仅小屏显示) -->
  <nav class="mobile-tabbar" aria-label="移动端快捷导航">
    <a class="tab-item" :href="home">
      <span class="tab-ico" aria-hidden="true">🏠</span>
      <span>首页</span>
    </a>
    <a class="tab-item" :href="shelf">
      <span class="tab-ico" aria-hidden="true">📚</span>
      <span>书架</span>
    </a>
  </nav>
</template>
