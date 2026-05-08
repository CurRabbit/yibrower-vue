<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { GuaBase } from '@/types'
import { WX_COLOR, WX_MAP } from '@/data/wuxing-map'
import { fetchImageList } from '@/api'

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

onMounted(async () => {
  resize()
  window.addEventListener('resize', resize)
  animFrame = requestAnimationFrame(animate)

  // 从 DB 读取该卦最新一张图
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
    // fallback 保持 hardcode 路径
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  cancelAnimationFrame(animFrame)
})
</script>

<template>
  <div
    :class="props.class"
    class="fixed inset-0 z-50 flex items-center justify-center"
    style="background: color-mix(in oklab, var(--bg) 96%, transparent)"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0"
      style="pointer-events: none"
    />

    <div class="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl px-8">
      <div class="mb-8">
        <img
          v-if="imageSrc"
          :src="imageSrc"
          :alt="gua.name"
          class="w-64 h-64 object-contain"
          :style="{ filter: `drop-shadow(0 0 40px ${WX_COLOR[gua.wuxing]}40)` }"
          @error="imageSrc = ''"
        />
      </div>

      <div class="text-center mb-2">
        <h1
          class="text-6xl font-serif leading-none mb-1"
          style="color: var(--gold-bright); text-shadow: 0 0 40px #c8961e50"
        >
          {{ gua.name }}
        </h1>
        <p class="text-2xl" style="color: var(--ink-light)">
          {{ gua.pinyin }} · 第 {{ gua.num }} 卦
        </p>
        <span
          class="inline-block mt-2 px-3 py-1 rounded-full text-sm"
          :style="{
            background: `${WX_COLOR[gua.wuxing]}18`,
            color: WX_COLOR[gua.wuxing],
            border: `1px solid ${WX_COLOR[gua.wuxing]}35`,
          }"
        >
          {{ WX_MAP[gua.wuxing] }}
        </span>
      </div>

      <p
        class="text-center text-xl font-serif leading-relaxed mt-6 max-w-xl"
        style="color: var(--ink-light)"
      >
        {{ gua.guaci }}
      </p>

      <div class="flex items-center gap-8 mt-10">
        <button
          @click="onPrev"
          class="w-12 h-12 rounded-full flex items-center justify-center transition-all"
          style="background: var(--surface-2); border: 1px solid var(--border-mid); color: var(--ink-light)"
          aria-label="上一卦"
        >◀</button>
        <div class="text-center">
          <div class="text-xs text-ink-faint tracking-widest">易经</div>
          <div class="font-mono text-lg" style="color: var(--gold)">{{ gua.num }} / 64</div>
        </div>
        <button
          @click="onNext"
          class="w-12 h-12 rounded-full flex items-center justify-center transition-all"
          style="background: var(--surface-2); border: 1px solid var(--border-mid); color: var(--ink-light)"
          aria-label="下一卦"
        >▶</button>
      </div>
    </div>

    <button
      @click="onExit"
      class="absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all"
      style="background: var(--surface-2); border: 1px solid var(--border); color: var(--ink-faint)"
      aria-label="退出"
    >×</button>
  </div>
</template>
