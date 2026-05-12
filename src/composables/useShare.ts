/**
 * useShare — 分享卦象（URL + 剪贴板）
 */
import type { GuaBase } from '@/types'

export function useShare() {
  function shareGua(gua: GuaBase) {
    const url = `${location.origin}${location.pathname}?gua=${gua.num}`
    const text = `【${gua.name}】第${gua.num}卦 · ${gua.guaci.slice(0, 20)}…`

    if (navigator.share) {
      navigator.share({ title: `易经 · ${gua.name}`, text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        // 轻提示用 DOM 手动创建，避免引入 toast 库
        const el = document.createElement('div')
        el.textContent = '已复制链接'
        el.style.cssText = `
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          background: var(--surface-2); color: var(--ink); border: 1px solid var(--border-mid);
          padding: 8px 16px; border-radius: 8px; font-size: 13px; z-index: 9999;
          pointer-events: none; opacity: 1; transition: opacity 0.5s;
        `
        document.body.appendChild(el)
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 500) }, 1500)
      }).catch(() => {})
    }
  }

  return { shareGua }
}
