<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  active: string
  trigram: string
}>()

const emit = defineEmits<{
  'update:active': [v: string]
  'update:trigram': [b: string]
}>()

const TRIGRAMS = [
  { value: '111', name: '乾', symbol: '☰', bg: 'rgba(200,150,30,0.15)' },
  { value: '110', name: '兑', symbol: '☱', bg: 'rgba(200,64,40,0.12)' },
  { value: '101', name: '离', symbol: '☲', bg: 'rgba(200,64,40,0.12)' },
  { value: '100', name: '震', symbol: '☳', bg: 'rgba(90,140,90,0.12)' },
  { value: '011', name: '艮', symbol: '☶', bg: 'rgba(122,108,58,0.12)' },
  { value: '010', name: '坎', symbol: '☵', bg: 'rgba(74,124,155,0.12)' },
  { value: '001', name: '巽', symbol: '☴', bg: 'rgba(90,140,90,0.12)' },
  { value: '000', name: '坤', symbol: '☷', bg: 'rgba(122,108,58,0.12)' },
]

const POS_TABS = [
  { value: 'all', label: '全' },
  { value: 'inner', label: '内' },
  { value: 'outer', label: '外' },
]

const showTrigrams = computed(() => props.active !== 'all')
const positionLabel = computed(() =>
  props.active === 'inner' ? '内卦' : props.active === 'outer' ? '外卦' : null
)
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Position tabs -->
    <div
      class="relative px-2 py-1 rounded"
      style="background: var(--surface-2); border: 1px solid var(--border)"
    >
      <div
        class="absolute bottom-0 left-0 right-0 h-px"
        style="background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--atm-color) 18%, transparent), transparent)"
      />
      <div class="flex gap-0.5">
        <button
          v-for="tab in POS_TABS"
          :key="tab.value"
          @click="emit('update:active', tab.value)"
          class="relative px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all duration-200"
          :style="props.active === tab.value
            ? {
                background: 'color-mix(in oklab, var(--atm-color) 18%, transparent)',
                color: 'var(--atm-color)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                border: '1px solid color-mix(in oklab, var(--atm-color) 65%, transparent)',
                boxShadow: '0 0 20px color-mix(in oklab, var(--atm-color) 35%, transparent), 0 0 40px color-mix(in oklab, var(--atm-color) 15%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)',
                transform: 'scale(1.08)',
              }
            : {
                background: 'var(--surface)',
                color: 'var(--ink-faint)',
                letterSpacing: '0.04em',
                border: '1px solid var(--border)',
                fontWeight: 500,
                transform: 'scale(1)',
              }"
        >{{ tab.label }}</button>
      </div>
    </div>

    <!-- Trigrams (shown when inner/outer active) -->
    <div v-if="showTrigrams" class="flex items-center gap-1">
      <span class="text-[10px] flex-shrink-0" style="color: var(--ink-faint); letter-spacing: 0.06em">{{ positionLabel }}：</span>
      <button
        v-for="tri in TRIGRAMS"
        :key="tri.value"
        @click="emit('update:trigram', tri.value)"
        class="relative w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-all duration-150"
        :style="props.trigram === tri.value
          ? {
              background: tri.bg,
              color: 'var(--atm-color)',
              border: '1px solid color-mix(in oklab, var(--atm-color) 70%, transparent)',
              boxShadow: '0 0 16px color-mix(in oklab, var(--atm-color) 50%, transparent), 0 0 30px color-mix(in oklab, var(--atm-color) 25%, transparent), 0 0 50px color-mix(in oklab, var(--atm-color) 10%, transparent)',
              fontSize: '14px',
              transform: 'scale(1.15)',
            }
          : {
              background: 'var(--surface)',
              color: 'var(--ink-faint)',
              border: '1px solid var(--border)',
              fontSize: '13px',
              transform: 'scale(1)',
            }"
        :title="tri.name"
      >{{ tri.symbol }}</button>

      <button
        v-if="props.trigram"
        @click="emit('update:trigram', '')"
        class="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 ml-0.5 transition-all duration-150"
        style="background: var(--surface-2); color: var(--ink-faint); font-size: 9px; border: 1px solid var(--border)"
        title="清除筛选"
      >✕</button>
    </div>
  </div>
</template>
