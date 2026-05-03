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
      class="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      :style="{
        background: props.wuxing === wx
          ? `${wx === 'all' ? '#c8961e' : WX_COLOR[wx]}18`
          : 'rgba(255,255,255,0.03)',
        color: props.wuxing === wx
          ? (wx === 'all' ? '#c8961e' : WX_COLOR[wx])
          : 'var(--ink-faint)',
        border: `1px solid ${props.wuxing === wx
          ? (wx === 'all' ? 'rgba(200,150,30,0.35)' : `${WX_COLOR[wx]}35`)
          : 'rgba(180,150,80,0.06)'}`,
      }"
      @click="emit('update:wuxing', wx)"
    >
      {{ wx === 'all' ? '全部' : WX_MAP[wx] }}
    </button>
  </div>
</template>
