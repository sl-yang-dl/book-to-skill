// 点击笔记页标题旁锚点(#)→ 复制带锚点的完整链接,并给出"已复制"反馈。
// 通过事件委托挂在 document 上,兼容 VitePress 的客户端路由(SPA 跳转后依然有效)。

function flashCopied(anchor) {
  const original = anchor.dataset.label || anchor.textContent
  anchor.dataset.label = original
  anchor.textContent = '✓ 已复制'
  anchor.classList.add('copied')
  setTimeout(() => {
    anchor.textContent = original
    anchor.classList.remove('copied')
  }, 1200)
}

function onClick(e) {
  const anchor = e.target.closest('.header-anchor')
  if (!anchor) return
  const href = anchor.getAttribute('href') || ''
  if (!href.startsWith('#')) return
  e.preventDefault()
  const url = location.origin + location.pathname + href
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(
      () => flashCopied(anchor),
      () => {}
    )
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', onClick)
}
