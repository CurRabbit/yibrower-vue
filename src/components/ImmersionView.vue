<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { GuaBase } from '@/types'
import { WX_COLOR, WX_MAP } from '@/data/wuxing-map'
import { fetchImageList } from '@/api'
import { addBurst } from '@/composables/useParticleBurst'

const props = defineProps<{
  gua: GuaBase
  onExit: () => void
  onPrev: () => void
  onNext: () => void
  class?: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageSrc = ref<string>('')
let animFrame = 0

// Interactive yao: which yao zone is currently highlighted (0-5, null = none)
const activeYaoIdx = ref<number | null>(null)

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; opacity: number
  hue: number
}

function initParticles(w: number, h: number): Particle[] {
  return Array.from({ length: 160 }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 0.6 + 0.2
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed * 0.3,
      vy: -Math.abs(Math.sin(angle) * speed),
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.05,
      hue: Math.random() * 30 + 35,
    }
  })
}

const particles = ref<Particle[]>([])

// Canvas click: detect which yao zone was tapped
function handleCanvasClick(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  // Divide canvas into 6 horizontal zones for the 6 yao lines
  const zoneH = canvas.height / 6
  const idx = Math.floor(y / zoneH)
  const clamped = Math.min(5, Math.max(0, idx))
  triggerYaoInteract(clamped)
}

// Trigger yao interaction: particle burst + highlight
function triggerYaoInteract(yaoIdx: number) {
  activeYaoIdx.value = yaoIdx
  // Particle burst at yao zone center
  const canvas = canvasRef.value
  if (canvas) {
    const zoneH = canvas.height / 6
    const cx = canvas.width / 2
    const cy = zoneH * yaoIdx + zoneH / 2
    addBurst(cx, cy, 1.5)
  }
  setTimeout(() => {
    if (activeYaoIdx.value === yaoIdx) activeYaoIdx.value = null
  }, 1200)
}

function animate() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width: w, height: h } = canvas

  ctx.fillStyle = 'rgba(13,10,7,0.18)'
  ctx.fillRect(0, 0, w, h)

  for (const p of particles.value) {
    p.x += p.vx
    p.y += p.vy
    p.vy -= 0.003

    if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
    if (p.x < -10) p.x = w + 10
    if (p.x > w + 10) p.x = -10

    const rgb = `hsla(${p.hue}, 70%, 65%, ${p.opacity})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = rgb
    ctx.fill()

    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5)
    glow.addColorStop(0, `hsla(${p.hue}, 70%, 65%, ${p.opacity * 0.25})`)
    glow.addColorStop(1, `hsla(${p.hue}, 70%, 65%, 0)`)
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2)
    ctx.fillStyle = glow
    ctx.fill()
  }

  animFrame = requestAnimationFrame(animate)
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  particles.value = initParticles(canvas.width, canvas.height)
}

// Swipe navigation
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
  if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx)) return
  if (dx < 0) props.onNext()
  else props.onPrev()
}

onMounted(async () => {
  resize()
  window.addEventListener('resize', resize)
  animFrame = requestAnimationFrame(animate)

  const key = `gua_${String(props.gua.num).padStart(2, '0')}_${props.gua.pinyin}`
  imageSrc.value = `/yi/assets/${key}/images/${key}.png`
  try {
    const records = await fetchImageList({ gua_num: props.gua.num, limit: 1 })
    const active = records.filter((r: any) => r.status === 0)
    if (active.length > 0) {
      const rec = active[0] as any
      imageSrc.value = rec.storage_url ?? `/yi/assets/${rec.storage_path}`
    }
  } catch {
    // fallback keeps hardcoded path
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  cancelAnimationFrame(animFrame)
})

const wuxingColor = computed(() => WX_COLOR[props.gua.wuxing])

const yaoList = computed(() => props.gua.yaoci)
const yaoAll = computed(() => [
  { label: '初', text: yaoList.value[0], yang: props.gua.binary[5] === '1', idx: 0 },
  { label: '二', text: yaoList.value[1], yang: props.gua.binary[4] === '1', idx: 1 },
  { label: '三', text: yaoList.value[2], yang: props.gua.binary[3] === '1', idx: 2 },
  { label: '四', text: yaoList.value[3], yang: props.gua.binary[2] === '1', idx: 3 },
  { label: '五', text: yaoList.value[4], yang: props.gua.binary[1] === '1', idx: 4 },
  { label: '上', text: yaoList.value[5], yang: props.gua.binary[0] === '1', idx: 5 },
])
</script>

<template>
  <div
    :class="props.class"
    class="fixed inset-0 z-50 flex items-center justify-center"
    style="background: color-mix(in oklab, var(--bg) 96%, transparent)"
    @touchstart.passive="handleTouchStart($event)"
    @touchend.passive="handleTouchEnd($event)"
  >
    <!-- Interactive particle canvas — clickable zones for yao interaction -->
    <canvas
      ref="canvasRef"
      class="absolute inset-0"
      style="pointer-events: none"
      @click="handleCanvasClick"
    />

    <!-- Yao zone overlay — invisible clickable bands that trigger yao highlights -->
    <div class="absolute inset-0 flex flex-col" style="pointer-events: none;">
      <div
        v-for="yao in yaoAll"
        :key="yao.idx"
        class="flex-1 cursor-pointer flex items-center justify-center transition-all duration-300"
        :style="{
          pointerEvents: 'auto',
          background: activeYaoIdx === yao.idx
            ? `${wuxingColor}18`
            : 'transparent',
          boxShadow: activeYaoIdx === yao.idx
            ? `inset 0 0 40px ${wuxingColor}30`
            : 'none',
        }"
        @click.stop="triggerYaoInteract(yao.idx)"
      >
        <!-- Active yao text overlay -->
        <transition name="yao-text">
          <div
            v-if="activeYaoIdx === yao.idx"
            class="absolute inset-x-0 flex items-center justify-center px-8 pointer-events-none"
          >
            <div
              class="rounded-xl px-6 py-4 max-w-sm text-center"
              :style="{
                background: `color-mix(in oklab, ${wuxingColor} 15%, rgba(13,10,7,0.92))`,
                border: `1px solid ${wuxingColor}50`,
                backdropFilter: 'blur(12px)',
                boxShadow: `0 0 40px ${wuxingColor}40`,
              }"
            >
              <div class="flex items-center justify-center gap-3 mb-2">
                <span
                  class="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
                  :style="{
                    background: `${wuxingColor}30`,
                    color: wuxingColor,
                    border: `1px solid ${wuxingColor}60`,
                  }"
                >{{ yao.label }}</span>
                <span class="text-xs font-medium uppercase tracking-widest" :style="{ color: `${wuxingColor}cc` }">
                  {{ yao.yang ? '阳爻' : '阴爻' }}
                </span>
              </div>
              <p class="text-sm font-serif leading-relaxed" style="color: var(--gold-pale)">
                {{ yao.text }}
              </p>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Bottom content: gua info + navigation -->
    <div class="absolute bottom-0 left-0 right-0 z-10">
      <div
        class="flex flex-col items-center px-8 pb-8 pt-16"
        style="
          background: linear-gradient(to top, rgba(13,10,7,0.95) 0%, rgba(13,10,7,0.7) 60%, transparent 100%);
        "
      >
        <!-- Gua name + meta -->
        <div class="text-center mb-2 imm-gua-name">
          <h1
            class="text-6xl font-serif leading-none mb-1"
            style="color: var(--gold-bright); text-shadow: 0 0 40px #c8961e50"
          >
            {{ gua.name }}
          </h1>
          <p class="text-2xl imm-gua-meta" style="color: var(--ink-light)">
            {{ gua.pinyin }} · 第 {{ gua.num }} 卦
          </p>
          <span
            class="inline-block mt-2 px-3 py-1 rounded-full text-sm imm-gua-tag"
            :style="{
              background: `${wuxingColor}18`,
              color: wuxingColor,
              border: `1px solid ${wuxingColor}35`,
            }"
          >
            {{ WX_MAP[gua.wuxing] }}
          </span>
        </div>

        <!-- Tap hint -->
        <p class="text-xs text-center mt-2 mb-4" style="color: var(--ink-faint); opacity: 0.6">
          ← 点击爻位查看爻辞 · 左右滑动切换卦象 →
        </p>

        <p
          class="text-center text-xl font-serif leading-relaxed max-w-xl imm-guaci"
          style="color: var(--ink-light)"
        >
          {{ gua.guaci }}
        </p>

        <!-- Navigation -->
        <div class="flex items-center gap-8 mt-8 imm-nav">
          <button
            @click.stop="props.onPrev"
            class="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style="background: var(--surface-2); border: 1px solid var(--border-mid); color: var(--ink-light)"
            aria-label="上一卦"
          >◀</button>
          <div class="text-center">
            <div class="text-xs text-ink-faint tracking-widest">易经</div>
            <div class="font-mono text-lg" style="color: var(--gold)">{{ gua.num }} / 64</div>
          </div>
          <button
            @click.stop="props.onNext"
            class="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style="background: var(--surface-2); border: 1px solid var(--border-mid); color: var(--ink-light)"
            aria-label="下一卦"
          >▶</button>
        </div>
      </div>
    </div>

    <!-- Exit button -->
    <button
      @click.stop="props.onExit"
      class="absolute top-8 right-8 z-20 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all active:scale-90"
      style="background: var(--surface-2); border: 1px solid var(--border); color: var(--ink-faint)"
      aria-label="退出"
    >×</button>

    <!-- Yao text transition -->
    <style scoped>
    .yao-text-enter-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
    .yao-text-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    .yao-text-enter-from, .yao-text-leave-to { opacity: 0; transform: translateY(8px) scale(0.95); }
    .yao-text-enter-to, .yao-text-leave-from { opacity: 1; transform: translateY(0) scale(1); }
    </style>
  </div>
</template>
