<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ value: string }>()
const emit = defineEmits<{ 'update:value': [v: string] }>()

const focused = ref(false)
</script>

<template>
  <div class="relative" style="width: 140px; flex-shrink: 0; min-width: 0">
    <div
      class="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
      :style="{
        opacity: focused ? 1 : 0,
        boxShadow: '0 0 0 3px rgba(212,168,67,0.12)',
      }"
    />
    <div class="relative flex items-center">
      <span
        class="absolute left-3.5 text-sm pointer-events-none transition-colors"
        :style="{ color: focused ? 'var(--gold)' : 'var(--ink-faint)' }"
      >⊛</span>
      <input
        type="text"
        :value="value"
        placeholder="搜索…"
        class="w-full rounded-full text-sm transition-all"
        :style="{
          padding: '7px 16px 7px 32px',
          background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(212,168,67,0.38)' : 'rgba(180,150,80,0.14)'}`,
          color: 'var(--ink)',
          outline: 'none',
          letterSpacing: '0.02em',
          boxShadow: focused ? 'inset 0 1px 3px rgba(0,0,0,0.2)' : 'none',
        }"
        @input="emit('update:value', ($event.target as HTMLInputElement).value)"
        @focus="focused = true"
        @blur="focused = false"
      />
      <button
        v-if="value"
        class="absolute right-3 rounded-full flex items-center justify-center cursor-pointer transition-all"
        style="width: 16px; height: 16px; font-size: 10px; line-height: 1; color: var(--ink-faint); background: rgba(180,150,80,0.1)"
        @mouseenter="($event.target as HTMLElement).style.color = 'var(--ink)'"
        @mouseleave="($event.target as HTMLElement).style.color = 'var(--ink-faint)'"
        @click="emit('update:value', '')"
      >✕</button>
    </div>
  </div>
</template>
