<script setup lang="ts">
import SearchBar from './SearchBar.vue'
import WuxingFilter from './WuxingFilter.vue'
import PositionFilter from './PositionFilter.vue'
import OrderFilter from './OrderFilter.vue'
import type { Wuxing } from '@/types'
import type { GuaOrder } from '@/data/gua-data'

defineProps<{
  searchValue: string
  wuxing: Wuxing | 'all'
  position: string
  trigram: string
  totalGuas: number
  theme: string
  order: GuaOrder
}>()

const emit = defineEmits<{
  'update:searchValue': [v: string]
  'update:wuxing': [v: Wuxing | 'all']
  'update:position': [v: string]
  'update:trigram': [b: string]
  'update:theme': [v: string]
  'update:order': [v: GuaOrder]
}>()

const THEMES = [
  { key: 'default',  label: '金', color: '#c8961e' },
  { key: 'ink',      label: '墨', color: '#6b5d4d' },
  { key: 'celadon',  label: '瓷', color: '#5a8878' },
  { key: 'vermilion', label: '朱', color: '#9a6840' },
]
</script>

<template>
  <header
    class="sticky top-0 z-50 relative flex flex-col gap-2"
    style="padding: 8px 12px 10px; background: color-mix(in oklab, var(--bg) 92%, transparent); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); box-shadow: 0 4px 30px rgba(0,0,0,0.3)"
  >
    <!-- Bottom gradient line -->
    <div
      class="absolute bottom-0 left-0 right-0 h-px"
          :style="{
            background: `linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--atm-color) 40%, transparent) 20%, color-mix(in oklab, var(--atm-color) 50%, transparent) 50%, color-mix(in oklab, var(--atm-color) 40%, transparent) 80%, transparent 100%)`,
          }"
    />

    <!-- Row 1: Logo + Search + Theme + Counter -->
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Logo -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <div
          class="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all duration-300 hover:scale-105"
          style="background: linear-gradient(135deg, color-mix(in oklab, var(--gold) 25%, transparent), color-mix(in oklab, var(--gold) 8%, transparent)); border: 1px solid color-mix(in oklab, var(--gold) 30%, transparent); color: var(--gold-bright); box-shadow: 0 0 10px color-mix(in oklab, var(--gold) 15%, transparent)"
        >☷</div>
        <span
          class="text-sm font-bold leading-none hidden sm:block"
          style="color: var(--gold-bright); text-shadow: 0 0 15px color-mix(in oklab, var(--atm-color) 30%, transparent); letter-spacing: 0.08em"
        >易经</span>
      </div>

      <SearchBar :value="searchValue" @update:value="emit('update:searchValue', $event)" />

      <div class="ml-auto flex items-center gap-1.5 flex-shrink-0">
        <!-- Theme switcher -->
        <div class="flex items-center gap-1">
          <button
            v-for="t in THEMES"
            :key="t.key"
            @click="emit('update:theme', t.key)"
            :title="t.key === 'default' ? '默认金色' : t.key === 'ink' ? '水墨' : t.key === 'celadon' ? '青瓷' : '紫禁'"
            :style="{
              width: 26, height: 26, borderRadius: 6,
              border: theme === t.key ? `1.5px solid ${t.color}` : '1px solid var(--border)',
              background: theme === t.key ? `${t.color}18` : 'var(--surface)',
              color: theme === t.key ? t.color : 'var(--ink-faint)',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
              cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: theme === t.key ? `0 0 8px ${t.color}40` : 'none',
            }"
          >{{ t.label }}</button>
        </div>
        <!-- Counter -->
        <span class="text-xs flex-shrink-0 pl-1" style="color: var(--ink-faint); letter-spacing: 0.1em">
          {{ totalGuas }} 卦
        </span>
      </div>
    </div>

    <!-- Row 2: Filters -->
    <div class="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
      <WuxingFilter :wuxing="wuxing" @update:wuxing="emit('update:wuxing', $event)" />
      <PositionFilter
        :active="position"
        :trigram="trigram"
        @update:active="emit('update:position', $event)"
        @update:trigram="emit('update:trigram', $event)"
      />
      <OrderFilter :order="order" @update:order="emit('update:order', $event)" />
    </div>
  </header>
</template>
