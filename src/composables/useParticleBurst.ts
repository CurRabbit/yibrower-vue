import { ref } from 'vue'

export const bursts = ref<Array<{ x: number; y: number; strength: number; ttl: number }>>([])

export function addBurst(x: number, y: number, strength = 8) {
  bursts.value.push({ x, y, strength, ttl: 30 })
}

export function useParticleBurst() {
  return { bursts, addBurst }
}
