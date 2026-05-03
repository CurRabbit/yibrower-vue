<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0

class Particle {
  x: number; y: number; vx: number; vy: number; size: number; alpha: number
  constructor(canvas: HTMLCanvasElement) {
    this.x = Math.random() * (canvas.width ?? 1200)
    this.y = Math.random() * (canvas.height ?? 800)
    this.vx = (Math.random() - 0.5) * 0.2
    this.vy = -(Math.random() * 0.3 + 0.1)
    this.size = Math.random() * 1.5 + 0.5
    this.alpha = Math.random() * 0.25 + 0.05
  }
  update(canvas: HTMLCanvasElement) {
    this.x += this.vx
    this.y += this.vy
    if (this.y < -10 || this.x < -10 || this.x > (canvas.width ?? 1200) + 10) {
      this.y = canvas.height ?? 800
      this.x = Math.random() * (canvas.width ?? 1200)
    }
  }
  draw(ctx: CanvasRenderingContext2D, color: string) {
    const m = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
    const r = m ? parseInt(m[1], 16) : 200
    const g = m ? parseInt(m[2], 16) : 150
    const b = m ? parseInt(m[3], 16) : 30
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`
    ctx.fill()
  }
}

function resize(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  resize(canvas)
  window.addEventListener('resize', () => resize(canvas))

  const particles = Array.from({ length: 40 }, () => new Particle(canvas))
  const atmColor = (window as unknown as Record<string, string>).__atm_color ?? '#c8961e'

  function animate() {
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.update(canvas)
      p.draw(ctx, atmColor)
    }
    raf = requestAnimationFrame(animate)
  }
  raf = requestAnimationFrame(animate)
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {})
  cancelAnimationFrame(raf)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    style="position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.5"
  />
</template>
