<script setup lang="ts">
import type { GuaBase } from '@/types'
import { WX_COLOR } from '@/data/wuxing-map'

const props = defineProps<{
  gua: GuaBase
  class?: string
}>()

const GUA_SYMBOLS = [
  '䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏',
  '䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟',
  '䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯',
  '䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'
]
</script>

<template>
  <div
    :class="props.class"
    class="flex items-center justify-center"
    :style="{
      padding: '10px 12px',
      borderRadius: '6px',
      background: `${WX_COLOR[gua.wuxing]}08`,
      border: `1px solid ${WX_COLOR[gua.wuxing]}20`,
    }"
  >
    <span
      :style="{
        fontSize: '36px',
        lineHeight: 1,
        color: WX_COLOR[gua.wuxing],
        textShadow: `0 0 12px ${WX_COLOR[gua.wuxing]}50`,
      }"
    >{{ GUA_SYMBOLS[gua.num - 1] }}</span>
  </div>
</template>
