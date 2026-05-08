<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Wuxing, Position } from '@/types'
import type { GuaBase } from '@/types'
import { GUA_DATA } from '@/data/gua-data'
import { WX_COLOR, WX_BG } from '@/data/wuxing-map'
import { fetchGuaList, toGuaBase, fetchLatestImages } from '@/api'
import ParticleCanvas from '@/components/ParticleCanvas.vue'
import Header from '@/components/Header.vue'
import HexGrid from '@/components/HexGrid.vue'
import GuaDetail from '@/components/GuaDetail.vue'
import ImmersionView from '@/components/ImmersionView.vue'

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
const theme = ref('default')

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

onMounted(() => {
  fetchGuaList()
    .then(dtos => {
      const mapped = dtos.map(toGuaBase).sort((a, b) => a.num - b.num)
      guaData.value = mapped
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

const sourceData = computed(() => guaData.value ?? GUA_DATA)

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
    const matchSearch = !q ||
      g.name.includes(q) ||
      g.pinyin.toLowerCase().includes(q) ||
      String(g.num).padStart(2, '0').includes(q) ||
      g.num === parseInt(q)

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

function handleThemeChange(v: string) {
  theme.value = v
  if (typeof document !== 'undefined') {
    document.body.setAttribute('data-theme', v === 'default' ? '' : v)
  }
}

function handleClose() {
  selectedGua.value = null
}

function handleImmersion() {
  if (selectedGua.value) {
    immersedGua.value = selectedGua.value
    selectedGua.value = null
  }
}

function handleExitImmersion() {
  immersedGua.value = null
}

function handlePrev() {
  if (!immersedGua.value) return
  const idx = sourceData.value.findIndex(g => g.num === immersedGua.value!.num)
  if (idx > 0) immersedGua.value = sourceData.value[idx - 1]
}

function handleNext() {
  if (!immersedGua.value) return
  const idx = sourceData.value.findIndex(g => g.num === immersedGua.value!.num)
  if (idx < sourceData.value.length - 1) immersedGua.value = sourceData.value[idx + 1]
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
</script>

<template>
  <ParticleCanvas />
  <Header
    v-model:searchValue="search"
    v-model:wuxing="wuxing"
    v-model:position="position"
    v-model:trigram="trigram"
    v-model:theme="theme"
    :totalGuas="filteredWithTodayFirst.length"
  />

  <!-- 今日卦象 Banner -->
  <div
    v-if="todayGua"
    class="relative mx-4 my-3 px-5 py-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.01]"
    style="background: linear-gradient(135deg, rgba(22,18,14,0.95), rgba(28,22,16,0.92)); border: 1px solid rgba(200,150,30,0.25); max-width: 680px; margin-left: auto; margin-right: auto; box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(200,150,30,0.1);"
    @click="handleSelect(getGuaKey(todayGua))"
  >
    <!-- 左侧：卦象预览 -->
    <div
      class="flex-shrink-0 rounded-xl w-16 h-16 flex items-center justify-center text-3xl"
      :style="{
        background: `linear-gradient(135deg, ${WX_BG[todayGua.wuxing].replace('0.12','0.3')}, rgba(22,18,14,0.9))`,
        border: `1px solid ${WX_COLOR[todayGua.wuxing]}40`,
        boxShadow: `0 0 20px ${WX_COLOR[todayGua.wuxing]}20`,
      }"
    >
      {{ ['䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏','䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟','䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯','䷰','䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'][todayGua.num - 1] }}
    </div>

    <!-- 中间：卦名 + 卦辞 -->
    <div class="flex-1 min-w-0">
      <div class="text-xs font-medium mb-1" style="color: rgba(200,150,30,0.7); letter-spacing: 0.2em">今日卦象</div>
      <div class="text-xl font-bold mb-0.5" :style="{ color: WX_COLOR[todayGua.wuxing] }">{{ todayGua.name }}</div>
      <div class="text-xs truncate" style="color: var(--ink-faint)">{{ todayGua.guaci.slice(0, 30) }}{{ todayGua.guaci.length > 30 ? '…' : '' }}</div>
    </div>

    <!-- 右侧：爻符 + 箭头 -->
    <div class="flex-shrink-0 flex flex-col items-center gap-1">
      <div class="leading-none" style="font-size: 11px; color: var(--ink-faint)">
        <span
          v-for="(b, idx) in [...todayGua.binary].reverse()"
          :key="idx"
          :style="{
            color: b === '1' ? WX_COLOR[todayGua.wuxing] : `${WX_COLOR[todayGua.wuxing]}60`,
            display: 'block',
            textAlign: 'center',
            textShadow: b === '1' ? `0 0 8px ${WX_COLOR[todayGua.wuxing]}60` : 'none',
          }"
        >{{ b === '1' ? '—' : '‑‑' }}</span>
      </div>
      <div class="text-sm opacity-40 mt-1">›</div>
    </div>
  </div>

  <main
    style="position: relative; z-index: 1; padding: 16px 16px 32px"
    class="md:!px-6 md:!py-8 lg:!px-[max(24px,calc((100%-1200px)/2))] lg:!py-10 lg:!pb-16"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div class="text-4xl opacity-30 animate-pulse">☷</div>
      <p class="text-sm" style="color: var(--ink-faint)">加载中…</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="text-5xl mb-4 opacity-20">☷</div>
      <p class="text-lg" style="color: var(--ink-faint)">未找到匹配结果</p>
      <p class="text-sm mt-1" style="color: var(--ink-faint)">试试其他搜索词或筛选条件</p>
    </div>

    <!-- Grid -->
    <HexGrid v-else :guas="filteredWithTodayFirst" :onSelect="handleSelect" :imageMap="guaImages" />
  </main>

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
        class="w-full max-w-5xl !my-0"
      />
    </div>
  </Teleport>

  <!-- Immersion view -->
  <ImmersionView
    v-if="immersedGua"
    :gua="immersedGua"
    @exit="handleExitImmersion"
    @prev="handlePrev"
    @next="handleNext"
  />
</template>
