<script setup lang="ts">
import { ref, computed, onMounted, watch, provide } from 'vue'
import type { Wuxing, Position } from '@/types'
import type { GuaBase } from '@/types'
import { GUA_DATA } from '@/data/gua-data'
import { WX_COLOR, WX_BG, WX_MAP } from '@/data/wuxing-map'
import { fetchGuaList, toGuaBase, fetchLatestImages } from '@/api'
import { sortGuas, type GuaOrder } from '@/data/gua-data'
import ParticleCanvas from '@/components/ParticleCanvas.vue'
import Header from '@/components/Header.vue'
import HexGrid from '@/components/HexGrid.vue'
import GuaDetail from '@/components/GuaDetail.vue'
import ImmersionView from '@/components/ImmersionView.vue'
import { useTheme } from '@/composables/useTheme'
import { useKeyboard } from '@/composables/useKeyboard'

// Initialize theme system (applies CSS vars on mount)
const { theme } = useTheme()
const bannerRef = ref<HTMLElement | null>(null)
const headerRef = ref<{ focusSearch: () => void; toggleThemePanel: () => void } | null>(null)
const searchBarRef = ref<{ focus: () => void } | null>(null)

// ⑥ 移动端底部导航高度（用于避免内容被遮挡）
const MOBILE_NAV_HEIGHT = 56

// ① 键盘快捷键
useKeyboard({
  onPrev: () => {
    if (immersedGua.value) handlePrev()
    else if (selectedGua.value) navigateGua(-1)
  },
  onNext: () => {
    if (immersedGua.value) handleNext()
    else if (selectedGua.value) navigateGua(1)
  },
  onClose: () => {
    if (immersedGua.value) handleExitImmersion()
    else if (selectedGua.value) handleClose()
  },
  onSearch: () => headerRef.value?.focusSearch(),
})

// 主题切换时触发 Banner 的高亮动画
watch(() => theme.value.color, () => {
  if (!bannerRef.value) return
  bannerRef.value.classList.remove('theme-flash')
  void bannerRef.value.offsetWidth // force reflow to restart animation
  bannerRef.value.classList.add('theme-flash')
  bannerRef.value.addEventListener('animationend', () => {
    bannerRef.value?.classList.remove('theme-flash')
  }, { once: true })
})

function getGuaKey(g: GuaBase): string {
  return `gua_${String(g.num).padStart(2, '0')}_${g.pinyin}`
}

const guaData = ref<GuaBase[] | null>(null)
const guaImages = ref<Record<number, string>>({})
const apiError = ref(false)

const search = ref('')
const wuxing = ref<Wuxing | 'all'>('all')
const position = ref<Position | 'all'>('all')
const trigram = ref('')
const selectedGua = ref<GuaBase | null>(null)
const immersedGua = ref<GuaBase | null>(null)
const order = ref<GuaOrder>('number')
// 控制 GuaDetail 退场动画：backdrop 点击时为 true，动画播完再清 selectedGua
const isGuaDetailClosing = ref(false)

// A4: filter 变化 epoch，驱动 HexGrid 重播 staggered 动画
const gridEpoch = ref(0)
const gridKey = computed(() => `${wuxing.value}-${position.value}-${trigram.value}-${search.value}-${order.value}-${gridEpoch.value}`)

// 任何筛选变化 → epoch++ → HexGrid 重挂载 → 卡片重新 staggered 入场
// 不含 search（搜索是即时过滤，不需要重播动画）
watch([wuxing, position, trigram, order], () => gridEpoch.value++)

// Sync wuxing filter to body[data-wx] for CSS atmosphere variables
watch(wuxing, (v) => {
  if (typeof document !== 'undefined') {
    if (v === 'all') {
      document.body.removeAttribute('data-wx')
    } else {
      document.body.setAttribute('data-wx', v)
    }
    // Also update particle canvas color
    ;(window as unknown as Record<string, string>).__atm_color =
      v === 'all' ? '#c8961e' :
      v === 'jin' ? '#c8961e' :
      v === 'mu' ? '#5a8c5a' :
      v === 'shui' ? '#4a7c9b' :
      v === 'huo' ? '#b84a2d' : '#7a6c3a'
  }
})

// E2: selectedGua 变化 → 更新粒子颜色 + E4: 更新 URL
watch(selectedGua, (gua) => {
  if (gua) {
    ;(window as unknown as Record<string, string>).__atm_color = WX_COLOR[gua.wuxing]
    const url = new URL(location.href)
    url.searchParams.set('gua', String(gua.num))
    history.replaceState(null, '', url.toString())
  } else {
    const url = new URL(location.href)
    url.searchParams.delete('gua')
    history.replaceState(null, '', url.toString())
  }
})

onMounted(() => {
  fetchGuaList()
    .then(dtos => {
      const mapped = dtos.map(toGuaBase).sort((a, b) => a.num - b.num)
      guaData.value = mapped
      // E4: 页面加载时从 URL 恢复选中卦
      const params = new URLSearchParams(location.search)
      const guaNum = params.get('gua')
      if (guaNum) {
        const found = mapped.find(g => String(g.num) === guaNum)
        if (found) selectedGua.value = found
      }
    })
    .catch(err => {
      console.error('[HomePage] API fetch failed, using static data:', err)
      apiError.value = true
      guaData.value = null
    })

  fetchLatestImages()
    .then(records => {
      const map: Record<number, string> = {}
      for (const r of records) {
        if (r.status === 0 && r.storage_url) {
          map[r.gua_num] = r.storage_url
        }
      }
      guaImages.value = map
    })
    .catch(err => {
      console.warn('[HomePage] fetchLatestImages failed:', err)
    })
})

const sourceData = computed(() => {
  const raw = guaData.value ?? GUA_DATA
  return sortGuas(raw, order.value)
})

// 今日卦象排第一
const filteredWithTodayFirst = computed(() => {
  if (!filtered.value.length || !todayGua.value) return filtered.value
  const todayKey = getGuaKey(todayGua.value)
  const rest = filtered.value.filter(g => getGuaKey(g) !== todayKey)
  return [todayGua.value, ...rest]
})

const filtered = computed(() => {
  return sourceData.value.filter(g => {
    const matchWx = wuxing.value === 'all' || g.wuxing === wuxing.value
    const q = search.value.trim().toLowerCase()
    // ② 模糊拼音搜索：输入前2个及以上字母匹配所有声母组合
    let matchSearch = !q
    if (q) {
      const pinyin = g.pinyin.toLowerCase()
      const name = g.name
      const num = String(g.num).padStart(2, '0')
      matchSearch =
        name.includes(q) ||
        pinyin.includes(q) ||
        num.includes(q) ||
        g.num === parseInt(q) ||
        // 声母模糊：输入前2字符检查 pinyin 前缀或首字母
        (q.length >= 2 && (
          pinyin.startsWith(q) ||
          pinyin.replace(/[aeiou]/g, '').startsWith(q.replace(/[aeiou]/g, ''))
        ))
    }

    const innerTri = g.binary.slice(3)
    const outerTri = g.binary.slice(0, 3)
    let matchPos = true
    if (position.value !== 'all' && trigram.value) {
      matchPos = position.value === 'inner' ? innerTri === trigram.value : outerTri === trigram.value
    }
    return matchWx && matchSearch && matchPos
  })
})

function handleSelect(key: string) {
  const gua = sourceData.value.find(g => getGuaKey(g) === key)
  if (gua) selectedGua.value = gua
}

function handleWuxingChange(v: Wuxing | 'all') {
  wuxing.value = v
  if (typeof document !== 'undefined') {
    if (v === 'all') {
      document.body.removeAttribute('data-wx')
    } else {
      document.body.setAttribute('data-wx', v)
    }
    ;(window as unknown as Record<string, string>).__atm_color =
      v === 'all' ? '#c8961e' :
      v === 'jin' ? '#c8961e' :
      v === 'mu' ? '#5a8c5a' :
      v === 'shui' ? '#4a7c9b' :
      v === 'huo' ? '#b84a2d' : '#7a6c3a'
  }
}

function handlePositionChange(v: string) {
  position.value = v as Position | 'all'
  if (v === 'all') trigram.value = ''
}

function handleTrigramChange(b: string) {
  trigram.value = b
}

function handleOrderChange(v: GuaOrder) {
  order.value = v
}

function handleClose() {
  // 点击 GuaDetail 关闭按钮：触发退场动画，动画完再清 selectedGua
  isGuaDetailClosing.value = true
  setTimeout(() => {
    selectedGua.value = null
    isGuaDetailClosing.value = false
  }, 280)
}

function handleImmersion() {
  if (selectedGua.value) {
    immersedGua.value = selectedGua.value
    selectedGua.value = null
  }
}

function handleNavigate(g: GuaBase) {
  selectedGua.value = g
}

function handleExitImmersion() {
  immersedGua.value = null
}

// ① 键盘导航函数：在 GuaDetail 中切换上一卦/下一卦
function navigateGua(dir: -1 | 1) {
  if (!selectedGua.value) return
  const idx = sourceData.value.findIndex(g => g.num === selectedGua.value!.num)
  const next = sourceData.value[idx + dir]
  if (next) selectedGua.value = next
}

function handlePrev() {
  navigateGua(-1)
}

function handleNext() {
  navigateGua(1)
}

const isLoading = computed(() => guaData.value === null && !apiError.value)

// 今日卦象：根据月日从 64 卦中选一个
const todayGua = computed<GuaBase | null>(() => {
  if (!sourceData.value.length) return null
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const idx = dayOfYear % sourceData.value.length
  return sourceData.value[idx]
})

// ⑤ 移动端底部导航项
const mobileNavItems = [
  { icon: '☷', label: '首页', action: () => { selectedGua.value = null; immersedGua.value = null } },
  { icon: '◈', label: '主题', action: () => { headerRef.value?.toggleThemePanel() } },
]
</script>

<template>
  <ParticleCanvas />
  <Header
    ref="headerRef"
    v-model:searchValue="search"
    v-model:wuxing="wuxing"
    v-model:position="position"
    v-model:trigram="trigram"
    v-model:order="order"
    :totalGuas="filteredWithTodayFirst.length"
  />

  <!-- 今日卦象 Banner -->
  <div
    ref="bannerRef"
    v-if="todayGua"
    class="today-banner"
    @click="handleSelect(getGuaKey(todayGua))"
  >
    <div class="today-banner-inner" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
      <!-- 标签 -->
      <div
        class="text-[10px] sm:text-xs font-medium tracking-[0.18em] uppercase"
        style="color: color-mix(in oklab, var(--atm-color) 80%, var(--ink-light))"
      >今日卦象</div>

      <!-- 卦象：大字居中 -->
      <div
        class="leading-none"
        style="font-size: 48px; color: var(--atm-color); text-shadow: 0 0 16px var(--atm-color); line-height: 1;"
      >{{ ['䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏','䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟','䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯','䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'][todayGua.num - 1] }}</div>

      <!-- 卦名 -->
      <span
        class="font-bold"
        style="font-size: 18px; color: var(--atm-color);"
      >{{ todayGua.name }}</span>

      <!-- 卦辞 -->
      <div
        style="text-align: center; max-width: 300px; font-size: 12px; color: var(--ink-light); line-height: 1.6;"
      >{{ todayGua.guaci.slice(0, 36) }}{{ todayGua.guaci.length > 36 ? '…' : '' }}</div>

      <!-- 引导箭头 -->
      <div style="color: var(--ink-faint); font-size: 14px;">›</div>
    </div>
  </div>

  <main
    style="position: relative; z-index: 1; padding: 16px 16px 32px"
    class="md:!px-6 md:!py-8 lg:!px-[max(24px,calc((100%-1200px)/2))] lg:!py-10 lg:!pb-16"
  >
    <!-- Loading skeleton — matches HexGrid card shape -->
    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-3">
      <div
        v-for="i in 18"
        :key="i"
        class="rounded-lg overflow-hidden animate-pulse"
        :style="{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          aspectRatio: '3/2',
          animation: `pulse 1.8s ease-in-out ${i * 50}ms infinite`,
        }"
      >
        <div class="w-full aspect-video bg-current opacity-5" />
        <div class="px-2 pb-2 pt-1 flex items-center gap-1">
          <div class="h-3 w-8 rounded bg-current opacity-10" />
          <div class="h-3 w-4 rounded bg-current opacity-10" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center py-24 text-center gap-4">
      <!-- Animated empty gua -->
      <div class="relative">
        <div class="text-6xl opacity-15" style="animation: pulse 2s ease-in-out infinite">☷</div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-16 h-px opacity-20" style="background: linear-gradient(to right, transparent, var(--gold), transparent); animation: pulse 1.5s ease-in-out infinite" />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <p class="text-base" style="color: var(--ink-faint)">未找到匹配结果</p>
        <p class="text-xs" style="color: var(--ink-faint); opacity: 0.6">当前筛选条件过严，请尝试放宽</p>
      </div>
      <!-- Quick reset actions -->
      <div class="flex flex-wrap justify-center gap-2 mt-1">
        <button
          v-if="search"
          @click="search = ''"
          class="px-3 py-1.5 rounded text-xs cursor-pointer transition-all hover:brightness-110 active:scale-95"
          style="background: var(--surface); border: 1px solid var(--border); color: var(--ink-faint)"
        >清除搜索</button>
        <button
          v-if="wuxing !== 'all'"
          @click="wuxing = 'all'"
          class="px-3 py-1.5 rounded text-xs cursor-pointer transition-all hover:brightness-110 active:scale-95"
          style="background: var(--surface); border: 1px solid var(--border); color: var(--ink-faint)"
        >清除五行</button>
        <button
          v-if="position !== 'all' || trigram"
          @click="position = 'all'; trigram = ''"
          class="px-3 py-1.5 rounded text-xs cursor-pointer transition-all hover:brightness-110 active:scale-95"
          style="background: var(--surface); border: 1px solid var(--border); color: var(--ink-faint)"
        >清除位置</button>
      </div>
    </div>

    <!-- Grid -->
    <HexGrid v-else :key="gridKey" :guas="filteredWithTodayFirst" :onSelect="handleSelect" :imageMap="guaImages" />
  </main>

  <!-- ⑤ 移动端底部导航栏 -->
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around"
    style="
      background: color-mix(in oklab, var(--bg) 94%, transparent);
      backdrop-filter: blur(20px);
      border-top: 1px solid var(--border);
      padding: env(safe-area-inset-bottom, 0px) 0 0;
      height: calc(56px + env(safe-area-inset-bottom, 0px));
    "
  >
    <button
      v-for="item in mobileNavItems"
      :key="item.label"
      @click="item.action"
      class="flex flex-col items-center gap-0.5 py-2 px-4 transition-all"
      style="color: var(--ink-faint)"
    >
      <span class="text-lg">{{ item.icon }}</span>
      <span class="text-[10px] tracking-wide">{{ item.label }}</span>
    </button>
  </nav>

  <!-- GuaDetail modal -->
  <Teleport to="body">
    <div
      v-if="selectedGua"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(13,10,7,0.88); backdrop-filter: blur(8px); animation: fadeIn 0.2s ease-out"
      @click="handleClose"
    >
      <GuaDetail
        :gua="selectedGua"
        :guaData="sourceData"
        @close="handleClose"
        @immersion="handleImmersion"
        @navigate="handleNavigate"
        class="w-full max-w-5xl !my-0"
      />
    </div>
  </Teleport>

  <!-- Immersion view -->
  <ImmersionView
    v-if="immersedGua"
    :key="immersedGua.num"
    :gua="immersedGua"
    @exit="handleExitImmersion"
    @prev="handlePrev"
    @next="handleNext"
  />
</template>
