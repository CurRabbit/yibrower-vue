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
      style="background: rgba(255,255,255,0.02); border: 1px solid rgba(180,150,80,0.08)"
    >
      <div
        class="absolute bottom-0 left-0 right-0 h-px"
        style="background: linear-gradient(90deg, transparent, rgba(212,168,67,0.18), transparent)"
      />
      <div class="flex gap-0.5">
        <button
          v-for="tab in POS_TABS"
          :key="tab.value"
          @click="emit('update:active', tab.value)"
          class="relative px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all duration-200"
          :style="props.active === tab.value
            ? {
                background: 'rgba(212,168,67,0.18)',
                color: 'var(--gold-bright)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                border: '1px solid rgba(212,168,67,0.65)',
                boxShadow: '0 0 20px rgba(212,168,67,0.35), 0 0 40px rgba(212,168,67,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                transform: 'scale(1.08)',
              }
            : {
                background: 'rgba(255,255,255,0.01)',
                color: 'rgba(180,150,80,0.25)',
                letterSpacing: '0.04em',
                border: '1px solid rgba(180,150,80,0.08)',
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
              color: 'var(--gold-bright)',
              border: '1px solid rgba(212,168,67,0.70)',
              boxShadow: '0 0 16px rgba(212,168,67,0.50), 0 0 30px rgba(212,168,67,0.25), 0 0 50px rgba(212,168,67,0.10)',
              fontSize: '14px',
              transform: 'scale(1.15)',
            }
          : {
              background: 'rgba(255,255,255,0.02)',
              color: 'rgba(180,150,80,0.25)',
              border: '1px solid rgba(180,150,80,0.08)',
              fontSize: '13px',
              transform: 'scale(1)',
            }"
        :title="tri.name"
      >{{ tri.symbol }}</button>

      <button
        v-if="props.trigram"
        @click="emit('update:trigram', '')"
        class="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 ml-0.5 transition-all duration-150"
        style="background: rgba(180,150,80,0.08); color: var(--ink-faint); font-size: 9px; border: 1px solid rgba(180,150,80,0.06)"
        title="清除筛选"
      >✕</button>
    </div>
  </div>
</template>
