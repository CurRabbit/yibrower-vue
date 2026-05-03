<script setup lang="ts">
import type { GuaBase } from '@/types'

const props = defineProps<{
  gua: GuaBase
  imageUrls: string[]
  class?: string
}>()

function getGuaKey(g: GuaBase): string {
  return `gua_${String(g.num).padStart(2, '0')}_${g.pinyin}`
}
</script>

<template>
  <div :class="props.class" class="grid grid-cols-3 gap-2 p-2">
    <img
      v-for="(url, i) in imageUrls"
      :key="i"
      :src="url"
      :alt="`${gua.name} ${i + 1}`"
      class="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
    />
    <img
      v-if="imageUrls.length === 0"
      :src="`/yi/assets/${getGuaKey(gua)}/images/${getGuaKey(gua)}.png`"
      :alt="gua.name"
      class="w-full h-full object-contain rounded-lg col-span-3"
    />
  </div>
</template>
