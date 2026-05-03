<script setup lang="ts">
import type { GuaBase } from '@/types'
import { WX_COLOR } from '@/data/wuxing-map'

const props = defineProps<{
  gua: GuaBase
  class?: string
}>()
</script>

<template>
  <div
    :class="props.class"
    class="flex flex-col items-center gap-0.5"
    :style="{
      padding: '12px 8px',
      borderRadius: '10px',
      background: `${WX_COLOR[gua.wuxing]}08`,
      border: `1px solid ${WX_COLOR[gua.wuxing]}20`,
    }"
  >
    <div
      v-for="(b, i) in [...gua.binary].reverse()"
      :key="i"
      class="rounded-sm"
      :style="{
        width: '36px',
        height: b === '1' ? '4px' : '3px',
        background: b === '1' ? WX_COLOR[gua.wuxing] : `${WX_COLOR[gua.wuxing]}60`,
        boxShadow: b === '1' ? `0 0 4px ${WX_COLOR[gua.wuxing]}50` : 'none',
      }"
    />
  </div>
</template>
