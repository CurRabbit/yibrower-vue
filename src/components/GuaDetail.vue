<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GuaBase } from '@/types'
import { WX_COLOR, WX_MAP, WX_BG } from '@/data/wuxing-map'
import { getCuo, getZong, REL_LABELS } from '@/data/relations'
import { fetchImageList } from '@/api'
import HexBar from './HexBar.vue'
import Gallery from './Gallery.vue'
import AudioPlayer from './AudioPlayer.vue'

const props = defineProps<{
  gua: GuaBase
  guaData: GuaBase[]
  onClose: () => void
  onImmersion: () => void
  onNavigate: (gua: GuaBase) => void
}>()

type TabKey = 'guaci' | 'xiangci' | 'tuanc' | 'yaoci' | 'gallery' | 'music'
const activeTab = ref<TabKey>('guaci')
const galleryImages = ref<string[] | null>(null)

// History stack for back navigation
const historyStack = ref<GuaBase[]>([])

function getGuaKey(g: GuaBase): string {
  return `gua_${String(g.num).padStart(2, '0')}_${g.pinyin}`
}

const wuxingColor = computed(() => WX_COLOR[props.gua.wuxing])

const cuoGua = computed(() => props.guaData.find(g => g.num === getCuo(props.gua.num)))
const zongGua = computed(() => props.guaData.find(g => g.num === getZong(props.gua.num)))
const huGua  = computed(() => props.guaData.find(g => g.wuxing === props.gua.wuxing && g.num !== props.gua.num))

// 当前显示的卦象（可能是栈中的某一个）
const currentGua = computed(() => props.gua)

const yaoList = computed(() => currentGua.value.yaoci)
const yaoAll = computed(() => [
  { label: '上', text: yaoList.value[5], yang: currentGua.value.binary[5] === '1' },
  { label: '四', text: yaoList.value[3], yang: currentGua.value.binary[3] === '1' },
  { label: '五', text: yaoList.value[4], yang: currentGua.value.binary[4] === '1' },
  { label: '三', text: yaoList.value[2], yang: currentGua.value.binary[2] === '1' },
  { label: '二', text: yaoList.value[1], yang: currentGua.value.binary[1] === '1' },
  { label: '初', text: yaoList.value[0], yang: currentGua.value.binary[0] === '1' },
])

watch(activeTab, async (tab) => {
  if (tab !== 'gallery') return
  galleryImages.value = null
  try {
    const records: { status: number; storage_url?: string; storage_path: string }[] =
      await fetchImageList({ gua_num: currentGua.value.num, limit: 20 })
    const urls = records
      .filter(r => r.status === 0)
      .map(r => r.storage_url ?? `/yi/assets_physical/${r.storage_path}`)
    galleryImages.value = urls.length > 0 ? urls : []
  } catch {
    galleryImages.value = []
  }
})

// All text tabs: guaci is the default/first
const textTabs: { key: TabKey; label: string }[] = [
  { key: 'guaci',   label: '卦辞' },
  { key: 'xiangci', label: '象辞' },
  { key: 'tuanc',   label: '彖辞' },
  { key: 'yaoci',   label: '爻辞' },
]

const mediaTabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'gallery', label: '图库', icon: '◈' },
  { key: 'music',   label: '音乐', icon: '◉' },
]

const allTabs = computed(() => [...textTabs, ...mediaTabs])

// Navigate to a related gua (push current to history, emit navigate)
function navigateTo(g: GuaBase) {
  historyStack.value.push(currentGua.value)
  props.onNavigate(g)
}

function goBack() {
  const prev = historyStack.value.pop()
  if (prev) {
    props.onNavigate(prev)
  }
}
</script>

<template>
  <div
    class="relative w-full rounded-xl overflow-hidden flex flex-col px-4 sm:px-0"
    :style="{
      background: 'linear-gradient(160deg, #1e1915 0%, #161210 100%)',
      border: `1px solid ${wuxingColor}25`,
      boxShadow: `0 32px 100px rgba(0,0,0,0.85), 0 0 60px ${wuxingColor}08, inset 0 1px 0 ${wuxingColor}15`,
      animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      maxHeight: '94vh',
      paddingTop: 'env(safe-area-inset-top)',
    }"
    @click.stop
  >
    <!-- Top accent line -->
    <div
      class="flex-shrink-0 h-px"
      :style="{ background: `linear-gradient(90deg, transparent, ${wuxingColor}88, transparent)` }"
    />

    <!-- ── Header (always visible) ── -->
    <div class="flex-shrink-0 px-4 py-3 flex items-center gap-3" style="border-bottom: 1px solid var(--border)">
      <!-- Back button (only when history exists) -->
      <button
        v-if="historyStack.length > 0"
        @click="goBack"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors flex-shrink-0"
        style="background: var(--surface); color: var(--ink-faint); border: 1px solid var(--border)"
      >‹</button>

      <!-- Hex bar: small on mobile -->
      <HexBar :gua="currentGua" class="flex-shrink-0" style="width: 56px;" />

      <!-- Title block -->
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2">
          <h2 class="text-2xl font-serif leading-none" style="color: var(--gold-bright)">{{ currentGua.name }}</h2>
          <span class="text-sm font-serif" style="color: var(--ink-light)">{{ currentGua.pinyin }}</span>
          <span
            class="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
            :style="{ backgroundColor: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}35` }"
          >{{ WX_MAP[currentGua.wuxing] }}</span>
        </div>
        <div class="flex items-center gap-2 mt-0.5 text-[11px]" style="color: var(--ink-faint)">
          <span>第 {{ currentGua.num }} 卦</span>
          <span class="hidden sm:inline font-mono tracking-widest" style="color: var(--gold-dim)">{{ currentGua.binary }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          @click="onImmersion"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
          style="background: linear-gradient(135deg, #b83a28, #8c2a1a); color: #fff; box-shadow: 0 4px 16px rgba(184,58,40,0.3)"
        >沉浸</button>
        <button
          @click="onClose"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors"
          style="background: var(--surface); color: var(--ink-faint); border: 1px solid var(--border)"
        >×</button>
      </div>
    </div>

    <!-- ── Tab nav ── -->
    <div class="flex-shrink-0 flex gap-1 px-3 py-2 flex-wrap" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
      <button
        v-for="tab in textTabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        :style="activeTab === tab.key
          ? { background: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}35` }
          : { background: 'var(--surface)', color: 'var(--ink-faint)', border: '1px solid var(--border)' }"
      >{{ tab.label }}</button>

      <!-- Divider -->
      <div class="w-px self-stretch mx-1" style="background: var(--border)" />

      <button
        v-for="tab in mediaTabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        :style="activeTab === tab.key
          ? { background: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}35` }
          : { background: 'var(--surface)', color: 'var(--ink-faint)', border: '1px solid var(--border)' }"
      >{{ tab.icon }} {{ tab.label }}</button>
    </div>

    <!-- ── Scrollable body ── -->
    <div class="flex-1 min-h-0 overflow-y-auto">

      <!-- Guaci -->
      <div v-if="activeTab === 'guaci'" class="flex items-center justify-center min-h-full px-6 py-8">
        <div class="text-center max-w-sm mx-auto">
          <div class="text-[10px] tracking-[0.4em] mb-4 uppercase opacity-30" :style="{ color: wuxingColor }">
            周易 · {{ currentGua.name }}
          </div>
          <p class="text-[1.1rem] font-serif leading-[2.2] indent-8" style="color: var(--gold-pale)">
            {{ currentGua.guaci }}
          </p>
          <div class="mt-6 mx-auto w-16 h-px" :style="{ background: `linear-gradient(to right, transparent, ${wuxingColor}60, transparent)` }" />
          <div class="mt-2 text-[10px] tracking-widest opacity-25" :style="{ color: wuxingColor }">
            {{ currentGua.pinyin }} · 第{{ currentGua.num }}卦
          </div>
        </div>
      </div>

      <!-- Xiangci (象辞 / 大象) -->
      <div v-else-if="activeTab === 'xiangci'" class="flex items-center justify-center min-h-full px-6 py-8">
        <div class="text-center max-w-sm mx-auto">
          <div class="text-[10px] tracking-[0.4em] mb-4 uppercase opacity-30" :style="{ color: wuxingColor }">
            大象传
          </div>
          <p class="text-[1.05rem] font-serif leading-[2.4]" style="color: var(--gold-pale)">
            {{ currentGua.xiangci || '象辞待补充' }}
          </p>
          <div class="mt-6 mx-auto w-16 h-px" :style="{ background: `linear-gradient(to right, transparent, ${wuxingColor}60, transparent)` }" />
        </div>
      </div>

      <!-- Tuanc (彖辞) -->
      <div v-else-if="activeTab === 'tuanc'" class="flex items-center justify-center min-h-full px-6 py-8">
        <div class="text-center max-w-sm mx-auto">
          <div class="text-[10px] tracking-[0.4em] mb-4 uppercase opacity-30" :style="{ color: wuxingColor }">
            彖传
          </div>
          <p class="text-[1rem] font-serif leading-[2.2]" style="color: var(--gold-pale)">
            {{ currentGua.tuanc || '彖辞待补充' }}
          </p>
          <div class="mt-6 mx-auto w-16 h-px" :style="{ background: `linear-gradient(to right, transparent, ${wuxingColor}60, transparent)` }" />
        </div>
      </div>

      <!-- Yaoci -->
      <div v-else-if="activeTab === 'yaoci'" class="flex flex-col gap-2 p-4">
        <div
          v-for="yao in yaoAll"
          :key="yao.label"
          class="flex items-start gap-3 p-3 rounded-lg"
          :style="{
            borderLeft: `2px ${yao.yang ? 'solid' : 'dashed'} ${wuxingColor}50`,
            background: yao.yang ? `${wuxingColor}06` : 'var(--surface)',
          }"
        >
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
            :style="{ background: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}30` }"
          >{{ yao.label }}</div>
          <p class="text-[13px] leading-[1.8] flex-1" style="color: var(--ink-light)">{{ yao.text }}</p>
        </div>
      </div>

      <!-- Relations panel (shown alongside text content, clickable) -->
      <div v-if="activeTab === 'guaci' || activeTab === 'xiangci' || activeTab === 'tuanc'" class="px-4 pb-4">
        <div class="rounded-lg p-3" :style="{ background: `${wuxingColor}06`, border: `1px solid ${wuxingColor}18` }">
          <div class="text-[10px] uppercase tracking-widest mb-2" style="color: var(--ink-faint)">相关卦象 · 点击跳转</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="cuoGua"
              @click="navigateTo(cuoGua)"
              class="flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-all hover:opacity-80"
              :style="{ background: `${wuxingColor}10`, border: `1px solid ${wuxingColor}25` }"
            >
              <span style="color: var(--ink-faint)">{{ REL_LABELS.cuo }}</span>
              <span class="font-medium" :style="{ color: wuxingColor }">{{ cuoGua.name }}</span>
            </button>
            <button
              v-if="zongGua"
              @click="navigateTo(zongGua)"
              class="flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-all hover:opacity-80"
              :style="{ background: `${wuxingColor}10`, border: `1px solid ${wuxingColor}25` }"
            >
              <span style="color: var(--ink-faint)">{{ REL_LABELS.zong }}</span>
              <span class="font-medium" :style="{ color: wuxingColor }">{{ zongGua.name }}</span>
            </button>
            <button
              v-if="huGua"
              @click="navigateTo(huGua)"
              class="flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-all hover:opacity-80"
              :style="{ background: `${wuxingColor}10`, border: `1px solid ${wuxingColor}25` }"
            >
              <span style="color: var(--ink-faint)">{{ REL_LABELS.hu }}</span>
              <span class="font-medium" :style="{ color: wuxingColor }">{{ huGua.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Gallery -->
      <div v-else-if="activeTab === 'gallery'" class="p-4">
        <div v-if="galleryImages === null" class="h-64 flex items-center justify-center">
          <div class="w-8 h-8 border-2 rounded-full animate-spin" style="border-color: var(--gold); border-top-color: transparent" />
        </div>
        <div v-else-if="galleryImages.length === 0" class="h-64 flex flex-col items-center justify-center gap-2" style="color: var(--ink-faint)">
          <span class="text-3xl opacity-30">◈</span>
          <p class="text-sm">暂无图片</p>
        </div>
        <Gallery v-else :gua="currentGua" :imageUrls="galleryImages" class="w-full h-64" />
      </div>

      <!-- Music -->
      <div v-else-if="activeTab === 'music'" class="p-4">
        <AudioPlayer :gua="currentGua" class="w-full" />
      </div>

    </div>
  </div>
</template>