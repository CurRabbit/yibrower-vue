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
}>()

type TabKey = 'guaci' | 'yaoci' | 'gallery' | 'music'
const activeTab = ref<TabKey>('guaci')
const galleryImages = ref<string[] | null>(null)

function getGuaKey(g: GuaBase): string {
  return `gua_${String(g.num).padStart(2, '0')}_${g.pinyin}`
}

const key = computed(() => getGuaKey(props.gua))
const wuxingColor = computed(() => WX_COLOR[props.gua.wuxing])

const cuoGua = computed(() => props.guaData.find(g => g.num === getCuo(props.gua.num)))
const zongGua = computed(() => props.guaData.find(g => g.num === getZong(props.gua.num)))
const huGua = computed(() => props.guaData.find(g => g.wuxing === props.gua.wuxing && g.num !== props.gua.num))

const yaoList = computed(() => props.gua.yaoci)
const upperYao = computed(() => [
  { label: '五', text: yaoList.value[4], yang: props.gua.binary[4] === '1' },
  { label: '上', text: yaoList.value[5], yang: props.gua.binary[5] === '1' },
  { label: '四', text: yaoList.value[3], yang: props.gua.binary[3] === '1' },
])
const lowerYao = computed(() => [
  { label: '三', text: yaoList.value[2], yang: props.gua.binary[2] === '1' },
  { label: '二', text: yaoList.value[1], yang: props.gua.binary[1] === '1' },
  { label: '初', text: yaoList.value[0], yang: props.gua.binary[0] === '1' },
])

watch(activeTab, async (tab) => {
  if (tab !== 'gallery') return
  galleryImages.value = null
  try {
    const records: { status: number; storage_url?: string; storage_path: string }[] = await fetchImageList({ gua_num: props.gua.num, limit: 20 })
    const urls = records.filter(r => r.status === 0).map(r => r.storage_url ?? `/yi/assets/${r.storage_path}`)
    galleryImages.value = urls.length > 0 ? urls : []
  } catch {
    galleryImages.value = []
  }
})

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'guaci', label: '卦辞', icon: '✦' },
  { key: 'yaoci', label: '爻辞', icon: '☰' },
  { key: 'gallery', label: '图库', icon: '◈' },
  { key: 'music', label: '音乐', icon: '◉' },
]
</script>

<template>
  <div
    class="relative w-full max-w-5xl rounded-2xl overflow-hidden"
    :style="{
      background: 'linear-gradient(160deg, #1e1915 0%, #161210 100%)',
      border: `1px solid ${wuxingColor}25`,
      boxShadow: `0 32px 100px rgba(0,0,0,0.85), 0 0 60px ${wuxingColor}08, inset 0 1px 0 ${wuxingColor}15`,
      animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }"
    @click.stop
  >
    <!-- Top accent line -->
    <div class="absolute inset-x-0 top-0 h-0.5" :style="{ background: `linear-gradient(90deg, transparent, ${wuxingColor}88, transparent)` }" />

    <!-- Header -->
    <div class="flex items-center justify-between px-8 py-6" style="border-bottom: 1px solid rgba(180,150,80,0.08)">
      <div class="flex items-center gap-5">
        <div
          class="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden"
          :style="{ background: WX_BG[gua.wuxing], border: `1px solid ${WX_BG[gua.wuxing].replace('0.12', '0.3')}` }"
        >
          <img :src="`/yi/assets/${key}/images/${key}.png`" :alt="gua.name" class="w-full h-full object-contain p-1" />
        </div>
        <div>
          <div class="flex items-baseline gap-3">
            <h2 class="text-4xl font-serif leading-none" style="color: var(--gold-bright)">{{ gua.name }}</h2>
            <span class="text-xl font-serif" style="color: var(--ink-light)">{{ gua.pinyin }}</span>
            <span
              class="px-2.5 py-1 rounded-full text-xs font-medium"
              :style="{ backgroundColor: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}35` }"
            >{{ WX_MAP[gua.wuxing] }}</span>
          </div>
          <div class="flex items-center gap-4 mt-1.5 text-sm" style="color: var(--ink-faint)">
            <span>第 {{ gua.num }} 卦</span>
            <span class="font-mono tracking-widest" style="color: var(--gold-dim)">{{ gua.binary }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="onImmersion"
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          style="background: linear-gradient(135deg, #b83a28, #8c2a1a); color: #fff; box-shadow: 0 4px 16px rgba(184,58,40,0.3)"
        >
          <span>◈</span> 沉浸体验
        </button>
        <button
          @click="onClose"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors"
          style="background: rgba(255,255,255,0.05); color: var(--ink-faint); border: 1px solid rgba(180,150,80,0.1)"
          aria-label="关闭"
        >×</button>
      </div>
    </div>

    <!-- Body -->
    <div class="flex gap-5 p-6">
      <!-- Left -->
      <div class="w-44 flex-shrink-0 flex flex-col gap-4">
        <HexBar :gua="gua" class="w-full" />

        <!-- Relations -->
        <div>
          <div class="text-[11px] uppercase tracking-widest mb-2" style="color: var(--ink-faint)">关系卦</div>
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm"
              :style="{ background: `${wuxingColor}0a`, border: `1px solid ${wuxingColor}20` }">
              <span class="text-xs" style="color: var(--ink-faint)">{{ REL_LABELS.cuo }}</span>
              <span class="text-xs font-mono" style="color: var(--gold)">{{ cuoGua?.name ?? '—' }}</span>
            </div>
            <div class="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm"
              :style="{ background: `${wuxingColor}0a`, border: `1px solid ${wuxingColor}20` }">
              <span class="text-xs" style="color: var(--ink-faint)">{{ REL_LABELS.zong }}</span>
              <span class="text-xs font-mono" style="color: var(--gold)">{{ zongGua?.name ?? '—' }}</span>
            </div>
            <div v-if="huGua" class="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm"
              :style="{ background: `${wuxingColor}0a`, border: `1px solid ${wuxingColor}20` }">
              <span class="text-xs" style="color: var(--ink-faint)">{{ REL_LABELS.hu }}</span>
              <span class="text-xs font-mono" style="color: var(--gold)">{{ huGua.name }}</span>
            </div>
          </div>
        </div>

        <!-- Wuxing accent -->
        <div class="rounded-lg p-3 text-center"
          :style="{ background: `${wuxingColor}0a`, border: `1px solid ${wuxingColor}20` }">
          <div class="text-[10px] uppercase tracking-widest mb-1" style="color: var(--ink-faint)">五行</div>
          <div class="text-lg font-serif" :style="{ color: wuxingColor }">{{ WX_MAP[gua.wuxing] }}</div>
        </div>
      </div>

      <!-- Right -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Tab nav -->
        <div class="flex gap-1 mb-4">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all"
            :style="activeTab === tab.key
              ? { background: `linear-gradient(135deg, ${wuxingColor}20, ${wuxingColor}10)`, color: wuxingColor, border: `1px solid ${wuxingColor}35` }
              : { background: 'rgba(255,255,255,0.03)', color: 'var(--ink-faint)', border: '1px solid rgba(180,150,80,0.06)' }"
          >
            <span class="text-xs">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab content -->
        <div
          class="flex-1 rounded-xl overflow-hidden tab-content-enter"
          :style="{ background: 'rgba(10,8,6,0.7)', border: `1px solid ${wuxingColor}12`, backdropFilter: 'blur(12px)' }"
        >
          <!-- Guaci -->
          <div v-if="activeTab === 'guaci'" class="relative h-full flex items-center justify-center p-10">
            <span v-for="(char, i) in ['╔','╗','╚','╝']" :key="i"
              class="absolute text-2xl opacity-20"
              :style="{ color: wuxingColor, top: i < 2 ? 16 : undefined, bottom: i >= 2 ? 16 : undefined, left: i === 0 || i === 2 ? 16 : undefined, right: i === 1 || i === 3 ? 16 : undefined }">{{ char }}</span>
            <div class="absolute left-1/2 top-8 bottom-8 w-px" :style="{ background: `linear-gradient(to bottom, transparent, ${wuxingColor}30 20%, ${wuxingColor}30 80%, transparent)` }" />
            <div class="relative z-10 text-center max-w-xs">
              <div class="text-[10px] tracking-[0.4em] mb-6 uppercase opacity-40" :style="{ color: wuxingColor }">周易 · {{ gua.name }}</div>
              <p class="text-[1.35rem] font-serif leading-[2.2] indent-8" style="color: var(--gold-pale)">{{ gua.guaci }}</p>
              <div class="mt-8 mx-auto w-24 h-px" :style="{ background: `linear-gradient(to right, transparent, ${wuxingColor}60, transparent)` }" />
              <div class="mt-3 text-xs tracking-widest opacity-30" :style="{ color: wuxingColor }">{{ gua.pinyin }} · 第{{ gua.num }}卦</div>
            </div>
          </div>

          <!-- Yaoci -->
          <div v-if="activeTab === 'yaoci'" class="h-full flex flex-col">
            <div class="h-0.5 mx-6 mt-5 rounded-full"
              :style="{ background: `linear-gradient(to right, transparent, ${wuxingColor}60, ${wuxingColor}40, transparent)` }" />
            <div class="flex-1 flex gap-4 px-6 pb-5 pt-4">
              <div class="flex-1 flex flex-col gap-2">
                <div v-for="yao in upperYao" :key="yao.label"
                  class="flex items-start gap-2.5 p-3 rounded-lg"
                  :style="{ borderLeft: `2px ${yao.yang ? 'solid' : 'dashed'} ${wuxingColor}50`, background: yao.yang ? `${wuxingColor}06` : 'rgba(255,255,255,0.02)' }">
                  <div class="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                    :style="{ background: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}30` }">{{ yao.label }}</div>
                  <p class="text-[13px] leading-[1.8]" style="color: var(--ink-light)">{{ yao.text }}</p>
                </div>
              </div>
              <div class="w-px self-stretch rounded-full" :style="{ background: `${wuxingColor}12` }" />
              <div class="flex-1 flex flex-col gap-2">
                <div v-for="yao in lowerYao" :key="yao.label"
                  class="flex items-start gap-2.5 p-3 rounded-lg"
                  :style="{ borderLeft: `2px ${yao.yang ? 'solid' : 'dashed'} ${wuxingColor}50`, background: yao.yang ? `${wuxingColor}06` : 'rgba(255,255,255,0.02)' }">
                  <div class="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                    :style="{ background: `${wuxingColor}18`, color: wuxingColor, border: `1px solid ${wuxingColor}30` }">{{ yao.label }}</div>
                  <p class="text-[13px] leading-[1.8]" style="color: var(--ink-light)">{{ yao.text }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Gallery -->
          <div v-if="activeTab === 'gallery'" class="p-4">
            <div v-if="galleryImages === null" class="h-72 flex items-center justify-center">
              <div class="w-8 h-8 border-2 rounded-full animate-spin" style="border-color: var(--gold); border-top-color: transparent" />
            </div>
            <div v-else-if="galleryImages.length === 0" class="h-72 flex flex-col items-center justify-center gap-2" style="color: var(--ink-faint)">
              <span class="text-3xl opacity-30">◈</span>
              <p class="text-sm">暂无图片</p>
            </div>
            <Gallery v-else :gua="gua" :imageUrls="galleryImages" class="w-full h-72" />
          </div>

          <!-- Music -->
          <div v-if="activeTab === 'music'" class="p-5">
            <AudioPlayer :gua="gua" class="w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
