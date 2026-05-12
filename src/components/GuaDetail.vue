<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GuaBase } from '@/types'
import { WX_COLOR, WX_MAP, WX_BG } from '@/data/wuxing-map'
import { getCuo, getZong, getHu, REL_LABELS } from '@/data/relations'
import { fetchImageList } from '@/api'
import HexBar from './HexBar.vue'
import Gallery from './Gallery.vue'
import AudioPlayer from './AudioPlayer.vue'
import { useShare } from '@/composables/useShare'
import { playYaoClickIfEnabled } from '@/composables/useSound'

const { shareGua } = useShare()

const props = defineProps<{
  gua: GuaBase
  guaData: GuaBase[]
  onClose: () => void
  onImmersion: () => void
  onNavigate: (gua: GuaBase) => void
}>()

// 变爻翻页动画 key
const flipKey = ref(0)
watch(() => props.gua.num, () => {
  flipKey.value++
})

// E3: 移动端滑动手势导航（上一卦/下一卦）
// Bug修复：按钮触摸时 touchend 也会触发 swipe 判断（点击时手指可能横向漂移 ≥60px）。
// 修复：touchstart 记录触达元素是否是按钮，touchend 检测到按钮则跳过 navigate。
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchStartEl = ref<EventTarget | null>(null)

function handleTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0]?.clientX ?? 0
  touchStartY.value = e.touches[0]?.clientY ?? 0
  touchStartEl.value = e.target as EventTarget | null
}

function handleTouchEnd(e: TouchEvent) {
  // 如果触达元素是按钮/交互元素，跳过 swipe 导航（避免按钮点击被误判为 swipe）
  const el = touchStartEl.value as HTMLElement | null
  if (el?.closest('button, [role="button"], a, input, select, textarea')) return
  const dx = e.changedTouches[0].clientX - touchStartX.value
  const dy = e.changedTouches[0].clientY - touchStartY.value
  // 滑动距离不足或纵向滑动为主 → 不是横向 swipe，忽略
  if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
  const direction = dx < 0 ? 1 : -1 // 左滑→下一卦，右滑→上一卦
  const target = props.guaData.find(g => g.num === props.gua.num + direction)
  if (target) navigateTo(target)
}

// B2: 爻位点击涟漪动画
const rippleIdx = ref<number | null>(null)
function handleYaoClick(idx: number) {
  playYaoClickIfEnabled()
  rippleIdx.value = idx
  setTimeout(() => { rippleIdx.value = null }, 600)
}

// 退场动画控制：关闭时先播动画再通知父组件
const isLeaving = ref(false)
function handleClose() {
  isLeaving.value = true
  setTimeout(() => {
    isLeaving.value = false
    props.onClose()
  }, 250)
}

type TabKey = 'guaci' | 'xiangci' | 'yaoci' | 'gallery' | 'music'
const activeTab = ref<TabKey>('guaci')
const galleryImages = ref<string[] | null>(null)

// History stack for back navigation
const historyStack = ref<GuaBase[]>([])

function getGuaKey(g: GuaBase): string {
  return `gua_${String(g.num).padStart(2, '0')}_${g.pinyin}`
}

const wuxingColor = computed(() => WX_COLOR[props.gua.wuxing])

const cuoGua = computed(() => props.guaData.find(g => g.num === getCuo(props.gua.num)))
const zongNum = computed(() => getZong(props.gua.num))
const zongGua = computed(() => zongNum.value != null ? props.guaData.find(g => g.num === zongNum.value) : null)
const huGua  = computed(() => props.guaData.find(g => g.num === getHu(props.gua.num)))

// 当前显示的卦象（可能是栈中的某一个）
const currentGua = computed(() => props.gua)

const yaoList = computed(() => currentGua.value.yaoci)
const yaoAll = computed(() => [
  { label: '初', text: yaoList.value[0], yang: currentGua.value.binary[5] === '1' },
  { label: '二', text: yaoList.value[1], yang: currentGua.value.binary[4] === '1' },
  { label: '三', text: yaoList.value[2], yang: currentGua.value.binary[3] === '1' },
  { label: '四', text: yaoList.value[3], yang: currentGua.value.binary[2] === '1' },
  { label: '五', text: yaoList.value[4], yang: currentGua.value.binary[1] === '1' },
  { label: '上', text: yaoList.value[5], yang: currentGua.value.binary[0] === '1' },
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
  { key: 'xiangci', label: '象彖' },
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

// Go back to a specific index in history stack
function goBackTo(index: number) {
  const removed = historyStack.value.splice(index)
  const target = removed[0]
  if (target) {
    props.onNavigate(target)
  }
}

// Jump to the gua resulting from flipping one yao (爻变)
// 爻变: yaoAll[0]=初爻→binary[5], yaoAll[5]=上爻→binary[0]
const YAO_BIT_IDX = [5, 4, 3, 2, 1, 0]

function navigateByYaoChange(yaoIdx: number) {
  const binary = currentGua.value.binary.split('')
  binary[YAO_BIT_IDX[yaoIdx]] = binary[YAO_BIT_IDX[yaoIdx]] === '1' ? '0' : '1'
  const newBinary = binary.join('')
  const target = props.guaData.find(g => g.binary === newBinary)
  if (target) {
    navigateTo(target)
  }
}
</script>

<template>
  <div
    :class="isLeaving ? 'gua-detail-leave' : 'gua-detail-enter'"
    class="relative w-full rounded-lg overflow-hidden flex flex-col"
    :style="{
      background: 'linear-gradient(160deg, #1e1915 0%, #161210 100%)',
      border: `1px solid ${wuxingColor}25`,
      boxShadow: `0 32px 100px rgba(0,0,0,0.85), 0 0 60px ${wuxingColor}08, inset 0 1px 0 ${wuxingColor}15`,
      maxHeight: '94vh',
    }"
    @touchstart.passive="handleTouchStart($event)"
    @touchend.passive="handleTouchEnd($event)"
  >
    <!-- Top history trail bar (floating above everything) -->
    <div
      v-if="historyStack.length > 0"
      class="flex-shrink-0 flex items-center justify-center gap-1 text-[11px] py-1.5 px-4"
      style="background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border)"
    >
      <template v-for="(g, i) in historyStack" :key="g.num">
        <button
          @click.stop="goBackTo(i)"
          class="flex-shrink-0 text-[11px] font-medium transition-all hover:brightness-125"
          :style="{
            width: '44px',
            color: `color-mix(in oklab, ${wuxingColor} 60%, var(--ink-light))`,
            borderBottom: `1px solid color-mix(in oklab, ${wuxingColor} 40%, transparent)`,
          }"
        >{{ g.name }}</button>
        <span
          class="font-light flex-shrink-0"
          style="color: var(--ink-faint); opacity: 0.5"
        >›</span>
      </template>
      <span class="mx-0.5 flex-shrink-0" style="color: var(--ink-faint); opacity: 0.3">›</span>
      <span
        class="flex-shrink-0 text-[11px] font-bold"
        :style="{
          width: '44px',
          color: wuxingColor,
          borderBottom: `2px solid ${wuxingColor}`,
        }"
      >{{ currentGua.name }}</span>
    </div>

    <!-- Top accent line -->
    <div
      class="flex-shrink-0 h-px"
      :style="{ background: `linear-gradient(90deg, transparent, ${wuxingColor}88, transparent)` }"
    />

    <!-- ── Header (always visible) ── -->
    <div class="flex-shrink-0 px-6 py-3 flex items-center gap-3" style="border-bottom: 1px solid var(--border)">
      <!-- Hex bar: small on mobile -->
      <HexBar :gua="currentGua" :key="flipKey" class="flex-shrink-0" />

      <!-- Title block -->
      <div :key="flipKey" class="flex-1 min-w-0 gua-symbol-flip">
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
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <!-- ⑥ 分享 -->
        <button
          @click.stop="shareGua(currentGua)"
          class="w-8 h-8 rounded flex items-center justify-center text-sm transition-all"
          style="background: var(--surface); color: var(--ink-faint); border: 1px solid var(--border)"
          title="分享"
        >↗</button>
        <button
          @click.stop="onImmersion"
          class="px-3 py-1.5 rounded text-xs font-medium transition-all hover:opacity-90"
          style="background: linear-gradient(135deg, #b83a28, #8c2a1a); color: #fff; box-shadow: 0 4px 16px rgba(184,58,40,0.3)"
        >沉浸</button>
        <button
          @click.stop="handleClose"
          class="w-8 h-8 rounded flex items-center justify-center text-lg transition-colors"
          style="background: var(--surface); color: var(--ink-faint); border: 1px solid var(--border)"
        >×</button>
      </div>
    </div>

    <!-- ── Tab nav ── -->
    <div class="flex-shrink-0 flex gap-1 px-6 py-2 flex-wrap" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
      <button
        v-for="tab in textTabs"
        :key="tab.key"
        @click.stop="activeTab = tab.key"
        class="px-3 py-1.5 rounded text-xs font-medium transition-all"
        :style="activeTab === tab.key
          ? { background: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}35` }
          : { background: 'var(--surface)', color: 'var(--ink-faint)', border: '1px solid var(--border)' }"
      >{{ tab.label }}</button>

      <!-- Divider -->
      <div class="w-px self-stretch mx-1" style="background: var(--border)" />

      <button
        v-for="tab in mediaTabs"
        :key="tab.key"
        @click.stop="activeTab = tab.key"
        class="px-3 py-1.5 rounded text-xs font-medium transition-all"
        :style="activeTab === tab.key
          ? { background: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}35` }
          : { background: 'var(--surface)', color: 'var(--ink-faint)', border: '1px solid var(--border)' }"
      >{{ tab.icon }} {{ tab.label }}</button>
    </div>

    <!-- ── Scrollable body ── -->
    <div class="flex-1 min-h-0 overflow-y-auto p-8">

      <Transition name="tab-content" mode="out-in">

        <!-- Guaci -->
        <div v-if="activeTab === 'guaci'" key="guaci" class="flex flex-col gap-6 items-center">
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
          <!-- Relations panel -->
          <div class="w-full max-w-sm rounded p-3" :style="{ background: `${wuxingColor}06`, border: `1px solid ${wuxingColor}18` }">
            <div class="text-[10px] uppercase tracking-widest mb-2" style="color: var(--ink-faint)">相关卦象 · 点击跳转</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="cuoGua"
                @click.stop="navigateTo(cuoGua)"
                class="flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-all hover:opacity-80"
                :style="{ background: `${wuxingColor}10`, border: `1px solid ${wuxingColor}25` }"
              >
                <span class="text-base leading-none" :style="{ color: wuxingColor, textShadow: `0 0 6px ${wuxingColor}40` }">{{ ['䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏','䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟','䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯','䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'][cuoGua.num - 1] }}</span>
                <span style="color: var(--ink-faint)">{{ REL_LABELS.cuo }}</span>
                <span class="font-medium" :style="{ color: wuxingColor }">{{ cuoGua.name }}</span>
              </button>
              <button
                v-if="zongGua"
                @click.stop="navigateTo(zongGua)"
                class="flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-all hover:opacity-80"
                :style="{ background: `${wuxingColor}10`, border: `1px solid ${wuxingColor}25` }"
              >
                <span class="text-base leading-none" :style="{ color: wuxingColor, textShadow: `0 0 6px ${wuxingColor}40` }">{{ ['䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏','䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟','䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯','䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'][zongGua.num - 1] }}</span>
                <span style="color: var(--ink-faint)">{{ REL_LABELS.zong }}</span>
                <span class="font-medium" :style="{ color: wuxingColor }">{{ zongGua.name }}</span>
              </button>
              <button
                v-if="huGua"
                @click.stop="navigateTo(huGua)"
                class="flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-all hover:opacity-80"
                :style="{ background: `${wuxingColor}10`, border: `1px solid ${wuxingColor}25` }"
              >
                <span class="text-base leading-none" :style="{ color: wuxingColor, textShadow: `0 0 6px ${wuxingColor}40` }">{{ ['䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏','䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟','䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯','䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'][huGua.num - 1] }}</span>
                <span style="color: var(--ink-faint)">{{ REL_LABELS.hu }}</span>
                <span class="font-medium" :style="{ color: wuxingColor }">{{ huGua.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Xiangci + Tuanc (象彖) -->
        <div v-else-if="activeTab === 'xiangci'" key="xiangci" class="flex flex-col gap-6 items-center"
          style="background: radial-gradient(ellipse at 50% 40%, rgba(200,150,30,0.04) 0%, transparent 70%)"
        >
          <div v-if="currentGua.xiangci" class="text-center max-w-sm">
            <div class="text-[10px] tracking-[0.4em] mb-3 uppercase" :style="{ color: wuxingColor, opacity: 1 }">象辞 · 大象</div>
            <p class="text-[0.95rem] font-serif leading-[2.4]" style="color: var(--gold-bright)">
              {{ currentGua.xiangci }}
            </p>
          </div>
          <div v-if="currentGua.xiangci && currentGua.tuanc" class="w-12 h-px" :style="{ background: `linear-gradient(to right, transparent, ${wuxingColor}60, transparent)` }" />
          <div v-if="currentGua.tuanc" class="text-center max-w-sm">
            <div class="text-[10px] tracking-[0.4em] mb-3 uppercase" :style="{ color: wuxingColor, opacity: 1 }">彖辞</div>
            <p class="text-[0.9rem] font-serif leading-[2.2]" style="color: var(--ink-light)">
              {{ currentGua.tuanc }}
            </p>
          </div>
          <div v-if="!currentGua.xiangci && !currentGua.tuanc" class="text-center" style="color: var(--ink-faint)">象彖待补充</div>
          <!-- Relations panel -->
          <div class="w-full max-w-sm rounded p-3" :style="{ background: `${wuxingColor}06`, border: `1px solid ${wuxingColor}18` }">
            <div class="text-[10px] uppercase tracking-widest mb-2" style="color: var(--ink-faint)">相关卦象 · 点击跳转</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="cuoGua"
                @click.stop="navigateTo(cuoGua)"
                class="flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-all hover:opacity-80"
                :style="{ background: `${wuxingColor}10`, border: `1px solid ${wuxingColor}25` }"
              >
                <span class="text-base leading-none" :style="{ color: wuxingColor, textShadow: `0 0 6px ${wuxingColor}40` }">{{ ['䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏','䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟','䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯','䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'][cuoGua.num - 1] }}</span>
                <span style="color: var(--ink-faint)">{{ REL_LABELS.cuo }}</span>
                <span class="font-medium" :style="{ color: wuxingColor }">{{ cuoGua.name }}</span>
              </button>
              <button
                v-if="zongGua"
                @click.stop="navigateTo(zongGua)"
                class="flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-all hover:opacity-80"
                :style="{ background: `${wuxingColor}10`, border: `1px solid ${wuxingColor}25` }"
              >
                <span class="text-base leading-none" :style="{ color: wuxingColor, textShadow: `0 0 6px ${wuxingColor}40` }">{{ ['䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏','䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟','䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯','䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'][zongGua.num - 1] }}</span>
                <span style="color: var(--ink-faint)">{{ REL_LABELS.zong }}</span>
                <span class="font-medium" :style="{ color: wuxingColor }">{{ zongGua.name }}</span>
              </button>
              <button
                v-if="huGua"
                @click.stop="navigateTo(huGua)"
                class="flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-all hover:opacity-80"
                :style="{ background: `${wuxingColor}10`, border: `1px solid ${wuxingColor}25` }"
              >
                <span class="text-base leading-none" :style="{ color: wuxingColor, textShadow: `0 0 6px ${wuxingColor}40` }">{{ ['䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏','䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟','䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯','䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'][huGua.num - 1] }}</span>
                <span style="color: var(--ink-faint)">{{ REL_LABELS.hu }}</span>
                <span class="font-medium" :style="{ color: wuxingColor }">{{ huGua.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Yaoci -->
        <div v-else-if="activeTab === 'yaoci'" key="yaoci" class="flex flex-col gap-2">
          <div class="flex items-center justify-center gap-2 py-1 mb-2">
            <span class="text-[10px] uppercase tracking-widest mr-1" style="color: var(--ink-faint)">爻变</span>
            <button
              v-for="(yao, idx) in yaoAll"
              :key="idx"
              @click.stop="handleYaoClick(idx); navigateByYaoChange(idx)"
              class="w-9 h-9 rounded text-[13px] font-bold transition-all hover:brightness-125 active:scale-95 relative overflow-hidden"
              :style="{
                background: yao.yang ? `${wuxingColor}18` : 'var(--surface)',
                border: `1px solid ${yao.yang ? wuxingColor + '50' : 'var(--border)'}`,
                color: yao.yang ? wuxingColor : 'var(--ink-faint)',
              }"
            >
              <span
                v-if="rippleIdx === idx"
                class="absolute inset-0 rounded yao-ripple"
                :style="{ background: `${wuxingColor}50` }"
              />
              {{ yao.label }}
            </button>
          </div>
          <div
            v-for="yao in yaoAll"
            :key="yao.label"
            class="flex items-start gap-3 p-3 rounded"
            :style="{
              borderLeft: `2px ${yao.yang ? 'solid' : 'dashed'} ${wuxingColor}50`,
              background: yao.yang ? `${wuxingColor}06` : 'var(--surface)',
            }"
          >
            <div
              class="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
              :style="{ background: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}30` }"
            >{{ yao.label }}</div>
            <p class="text-[13px] leading-[1.8] flex-1" style="color: var(--ink-light)">{{ yao.text }}</p>
          </div>
        </div>

        <!-- Gallery -->
        <div v-else-if="activeTab === 'gallery'" key="gallery">
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
        <div v-else-if="activeTab === 'music'" key="music">
          <AudioPlayer :gua="currentGua" class="w-full" />
        </div>

      </Transition>

    </div>
  </div>
</template>
