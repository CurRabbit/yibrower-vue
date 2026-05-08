<script setup lang="ts">
import { computed } from 'vue'
import { GUA_ORDER_LABELS } from '@/data/gua-data'
import type { GuaOrder } from '@/data/gua-data'

const props = defineProps<{ order: GuaOrder }>()
const emit = defineEmits<{ 'update:order': [v: GuaOrder] }>()

const orders = Object.entries(GUA_ORDER_LABELS) as [GuaOrder, string][]
const activeIndex = computed(() => orders.findIndex(([k]) => k === props.order))

const BTNS = orders

const indicatorStyle = computed(() => {
  const idx = activeIndex.value
  if (idx < 0) return {}
  // Each button: min-width 52px, gap 4px, padding 0 10px
  const offset = idx * 60
  return {
    width: '52px',
    transform: `translateX(${offset}px)`,
  }
})
</script>

<template>
  <div class="order-filter">
    <!-- Label -->
    <span class="order-label">序</span>

    <!-- Track -->
    <div class="track">
      <!-- Sliding indicator -->
      <div class="indicator" :style="indicatorStyle" />

      <!-- Buttons -->
      <button
        v-for="([key, label], i) in BTNS"
        :key="key"
        class="btn"
        :class="{ active: order === key }"
        @click="emit('update:order', key)"
      >{{ label }}</button>
    </div>
  </div>
</template>

<style scoped>
.order-filter {
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--ink-faint);
  opacity: 0.6;
  user-select: none;
}

.track {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  /* Subtle glass housing */
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
}

.indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  height: calc(100% - 6px);
  border-radius: 7px;
  background: linear-gradient(135deg, rgba(200, 150, 30, 0.35), rgba(200, 130, 20, 0.2));
  border: 1px solid rgba(200, 150, 30, 0.4);
  box-shadow: 0 0 10px rgba(200, 150, 30, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.28s ease;
  pointer-events: none;
}

.btn {
  position: relative;
  z-index: 1;
  min-width: 52px;
  padding: 4px 10px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-faint);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: color 0.22s ease, background 0.22s ease;
  white-space: nowrap;
  line-height: 1;
}

.btn:hover {
  color: rgba(200, 150, 30, 0.8);
}

.btn.active {
  color: #c8961e;
  text-shadow: 0 0 12px rgba(200, 150, 30, 0.5);
}
</style>
