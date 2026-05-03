<script setup lang="ts">
import type { GuaBase } from '@/types'

const props = defineProps<{
  gua: GuaBase
  class?: string
}>()

function getGuaKey(g: GuaBase): string {
  return `gua_${String(g.num).padStart(2, '0')}_${g.pinyin}`
}

const musicSrc = `/yi/assets/${getGuaKey(props.gua)}/music/${getGuaKey(props.gua)}.mp3`
</script>

<template>
  <div :class="props.class" class="flex flex-col gap-3">
    <audio
      :src="musicSrc"
      controls
      class="w-full"
    />
  </div>
</template>
