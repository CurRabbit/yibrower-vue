<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useParticleBurst } from '@/composables/useParticleBurst'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0

const { bursts, addBurst } = useParticleBurst()

class Particle {
  x: number; y: number; vx: number; vy: number; size: number; alpha: number
  // Per-particle stable hue offset for color variety
  hueOff: number

  constructor(canvas: HTMLCanvasElement, hueOff = 0) {
    this.x = Math.random() * (canvas.width ?? 1200)
    this.y = Math.random() * (canvas.height ?? 800)
    this.vx = (Math.random() - 0.5) * 0.2
    this.vy = -(Math.random() * 0.3 + 0.1)
    this.size = Math.random() * 1.5 + 0.5
    this.alpha = Math.random() * 0.25 + 0.05
    this.hueOff = hueOff
  }
  update(canvas: HTMLCanvasElement) {
    this.x += this.vx
    this.y += this.vy
    if (this.y < -10 || this.x < -10 || this.x > (canvas.width ?? 1200) + 10) {
      this.y = canvas.height ?? 800
      this.x = Math.random() * (canvas.width ?? 1200)
    }
  }
  draw(ctx: CanvasRenderingContext2D, color: string, atmHue: number) {
    const m = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
    const r = m ? parseInt(m[1], 16) : 200
    const g = m ? parseInt(m[2], 16) : 150
    const b = m ? parseInt(m[3], 16) : 30
    const hue = atmHue + this.hueOff
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 55%, ${30 + this.hueOff * 0.5}%, ${this.alpha})`
    ctx.fill()
  }
  applyBurst(burst: { x: number; y: number; strength: number; ttl: number }) {
    const dx = this.x - burst.x
    const dy = this.y - burst.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 200) {
      const factor = (1 - dist / 200) * burst.strength
      this.vx += (dx / dist) * factor
      this.vy += (dy / dist) * factor
    }
  }
  // Cursor repulsion: particles gently flee from mouse
  applyCursor(cx: number, cy: number, strength: number) {
    const dx = this.x - cx
    const dy = this.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 120 && dist > 0) {
      const factor = (1 - dist / 120) * strength
      this.vx += (dx / dist) * factor
      this.vy += (dy / dist) * factor
    }
    // Gentle damping so particles don't fly off screen
    this.vx *= 0.98
    this.vy *= 0.98
  }
}

let cursorX = -999
let cursorY = -999

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

  const particles = Array.from({ length: 50 }, (_, i) => new Particle(canvas, (i % 10) * 3))

  // Track cursor position for repulsion effect
  const handleMouseMove = (e: MouseEvent) => {
    cursorX = e.clientX
    cursorY = e.clientY
  }
  const handleTouchMove = (e: TouchEvent) => {
    cursorX = e.touches[0]?.clientX ?? cursorX
    cursorY = e.touches[0]?.clientY ?? cursorY
  }
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  window.addEventListener('touchmove', handleTouchMove, { passive: true })

  function animate() {
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const atmColor = (window as unknown as Record<string, string>).__atm_color ?? '#c8961e'
    // Derive base hue from atmColor (gold=38, green=120, blue=200, red=10, brown=30)
    const atmHue = atmColor === '#c8961e' ? 38
      : atmColor === '#5a8c5a' ? 120
      : atmColor === '#4a7c9b' ? 200
      : atmColor === '#b84a2d' ? 10
      : 30

    for (const burst of bursts.value) {
      for (const p of particles) p.applyBurst(burst)
      burst.ttl--
    }
    bursts.value = bursts.value.filter(b => b.ttl > 0)

    for (const p of particles) {
      // Apply cursor repulsion
      p.applyCursor(cursorX, cursorY, 0.08)
      p.update(canvas)
      p.draw(ctx, atmColor, atmHue)
    }
    raf = requestAnimationFrame(animate)
  }
  raf = requestAnimationFrame(animate)

  onUnmounted(() => {
    window.removeEventListener('resize', () => resize(canvas))
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('touchmove', handleTouchMove)
    cancelAnimationFrame(raf)
  })
})
</script>

<template>
  <canvas
    ref="canvasRef"
    style="position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.5"
  />
</template>
