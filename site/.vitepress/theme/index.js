import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import BookShelf from './BookShelf.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('BookShelf', BookShelf)
  }
}
