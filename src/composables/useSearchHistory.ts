// 搜索历史记录 — localStorage 存储最近 5 条，支持增/查/清
const KEY = 'yi-search-history'
const MAX = 5

export function useSearchHistory() {
  function load(): string[] {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  }

  function save(items: string[]) {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)))
  }

  function add(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return
    const items = load().filter(i => i !== trimmed)
    save([trimmed, ...items])
  }

  function clear() {
    localStorage.removeItem(KEY)
  }

  return { load, add, clear }
}
