/**
 * useKeyboard — 全局键盘快捷键
 * 必须在 App.vue 顶层注册一次
 */
import { onMounted, onUnmounted } from 'vue'

interface KeyboardOptions {
  onPrev?: () => void
  onNext?: () => void
  onClose?: () => void
  onSearch?: () => void
  enabled?: boolean
}

export function useKeyboard(opts: KeyboardOptions) {
  function handleKey(e: KeyboardEvent) {
    // 忽略输入框内的按键（搜索框等）
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      // 搜索框内按 Esc → 失焦
      if (e.key === 'Escape') {
        ;(e.target as HTMLInputElement).blur()
        opts.onClose?.()
      }
      return
    }

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        opts.onPrev?.()
        break
      case 'ArrowRight':
        e.preventDefault()
        opts.onNext?.()
        break
      case 'Escape':
        opts.onClose?.()
        break
      case '/':
      case 's':
        e.preventDefault()
        opts.onSearch?.()
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKey))
  onUnmounted(() => window.removeEventListener('keydown', handleKey))
}
