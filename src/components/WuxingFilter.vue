<script setup lang="ts">
import type { Wuxing } from '@/types'
import { WX_COLOR, WX_MAP, ALL_WUXING } from '@/data/wuxing-map'

const props = defineProps<{
  wuxing: Wuxing | 'all'
}>()
const emit = defineEmits<{ 'update:wuxing': [v: Wuxing | 'all'] }>()
</script>

<template>
  <div class="flex items-center gap-1.5">
    <button
      v-for="wx in ['all', ...ALL_WUXING] as const"
      :key="wx"
      class="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all"
      :style="{
        background: props.wuxing === wx
          ? `${wx === 'all' ? 'color-mix(in oklab, var(--atm-color) 18%, transparent)' : WX_COLOR[wx]}18`
          : 'var(--surface)',
        color: props.wuxing === wx
          ? (wx === 'all' ? 'var(--atm-color)' : WX_COLOR[wx])
          : 'var(--ink-faint)',
        border: `1px solid ${props.wuxing === wx
          ? (wx === 'all' ? 'color-mix(in oklab, var(--atm-color) 35%, transparent)' : `${WX_COLOR[wx]}35`)
          : 'var(--border)'}`,
      }"
      @click="emit('update:wuxing', wx)"
    >
      {{ wx === 'all' ? '全部' : WX_MAP[wx] }}
    </button>
  </div>
</template>
