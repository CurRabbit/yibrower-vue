<script setup lang="ts">
import { GUA_ORDER_LABELS } from '@/data/gua-data'
import type { GuaOrder } from '@/data/gua-data'

defineProps<{ order: GuaOrder }>()
const emit = defineEmits<{ 'update:order': [v: GuaOrder] }>()

const orders = Object.entries(GUA_ORDER_LABELS) as [GuaOrder, string][]
</script>

<template>
  <div class="flex items-center gap-0.5">
    <button
      v-for="[key, label] in orders"
      :key="key"
      @click="emit('update:order', key)"
      :style="{
        padding: '2px 8px',
        borderRadius: 6,
        border: '1px solid',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.05em',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: order === key ? 'rgba(200,150,30,0.15)' : 'transparent',
        borderColor: order === key ? 'rgba(200,150,30,0.5)' : 'var(--border)',
        color: order === key ? '#c8961e' : 'var(--ink-faint)',
        boxShadow: order === key ? '0 0 6px rgba(200,150,30,0.2)' : 'none',
      }"
    >{{ label }}</button>
  </div>
</template>
