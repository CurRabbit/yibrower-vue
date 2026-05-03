<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Wuxing, Position } from '@/types'
import type { GuaBase } from '@/types'
import { GUA_DATA } from '@/data/gua-data'
import { fetchGuaList, toGuaBase } from '@/api'
import ParticleCanvas from '@/components/ParticleCanvas.vue'
import Header from '@/components/Header.vue'
import HexGrid from '@/components/HexGrid.vue'
import GuaDetail from '@/components/GuaDetail.vue'
import ImmersionView from '@/components/ImmersionView.vue'

function getGuaKey(g: GuaBase): string {
  return `gua_${String(g.num).padStart(2, '0')}_${g.pinyin}`
}

const guaData = ref<GuaBase[] | null>(null)
const apiError = ref(false)

const search = ref('')
const wuxing = ref<Wuxing | 'all'>('all')
const position = ref<Position | 'all'>('all')
const trigram = ref('')
const selectedGua = ref<GuaBase | null>(null)
const immersedGua = ref<GuaBase | null>(null)
const theme = ref('default')

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
})

const sourceData = computed(() => guaData.value ?? GUA_DATA)

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
    document.body.setAttribute('data-wx', v === 'all' ? '' : v)
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
</script>

<template>
  <ParticleCanvas />
  <Header
    v-model:searchValue="search"
    v-model:wuxing="wuxing"
    v-model:position="position"
    v-model:trigram="trigram"
    v-model:theme="theme"
    :totalGuas="filtered.length"
  />

  <main
    style="position: relative; z-index: 1; padding: 32px max(24px, calc((100% - 1200px) / 2)) 64px"
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
    <HexGrid v-else :guas="filtered" :onSelect="handleSelect" />
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
