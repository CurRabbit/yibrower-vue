<script setup lang="ts">
import SearchBar from './SearchBar.vue'
import WuxingFilter from './WuxingFilter.vue'
import PositionFilter from './PositionFilter.vue'
import OrderFilter from './OrderFilter.vue'
import ThemePanel from './ThemePanel.vue'
import type { Wuxing } from '@/types'
import type { GuaOrder } from '@/data/gua-data'
import { useLunar } from '@/composables/useLunar'

defineProps<{
  searchValue: string
  wuxing: Wuxing | 'all'
  position: string
  trigram: string
  totalGuas: number
  order: GuaOrder
}>()

const emit = defineEmits<{
  'update:searchValue': [v: string]
  'update:wuxing': [v: Wuxing | 'all']
  'update:position': [v: string]
  'update:trigram': [b: string]
  'update:order': [v: GuaOrder]
}>()

const { info: lunarInfo } = useLunar()

// ① 暴露 focus 方法透传给内部 SearchBar，供 HomeView 键盘快捷键调用
const searchBarRef = ref<{ focus: () => void } | null>(null)
function focusSearch() {
  searchBarRef.value?.focus()
}
// ⑤ 移动端底部导航"主题"按钮：透传 ThemePanel.toggle
const themePanelRef = ref<{ toggle: () => void } | null>(null)
function toggleThemePanel() { themePanelRef.value?.toggle() }

defineExpose({ focusSearch, toggleThemePanel })
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
          class="w-7 h-7 rounded flex items-center justify-center text-sm transition-all duration-300 hover:scale-105"
          style="background: linear-gradient(135deg, color-mix(in oklab, var(--gold) 25%, transparent), color-mix(in oklab, var(--gold) 8%, transparent)); border: 1px solid color-mix(in oklab, var(--gold) 30%, transparent); color: var(--gold-bright); box-shadow: 0 0 10px color-mix(in oklab, var(--gold) 15%, transparent)"
        >☷</div>
        <span
          class="text-sm font-bold leading-none hidden sm:block"
          style="color: var(--gold-bright); text-shadow: 0 0 15px color-mix(in oklab, var(--atm-color) 30%, transparent); letter-spacing: 0.08em"
        >易经</span>
      </div>

      <SearchBar ref="searchBarRef" :value="searchValue" @update:value="emit('update:searchValue', $event)" />

      <!-- Lunar & 时辰 — 搜索框右侧 -->
      <div
        v-if="lunarInfo"
        class="flex items-center gap-1 text-[11px] flex-shrink-0"
        style="color: var(--ink-faint); letter-spacing: 0.05em"
      >
        <span>{{ lunarInfo.lunarDate }}</span>
        <span style="color: var(--border-mid)">·</span>
        <span>{{ lunarInfo.shichen }}</span>
        <span
          v-if="lunarInfo.solarTerm"
          class="rounded px-1 py-0.5 text-[10px] font-medium"
          style="background: color-mix(in oklab, var(--atm-color) 14%, transparent); color: var(--atm-color); letter-spacing: 0.1em"
        >{{ lunarInfo.solarTerm }}</span>
      </div>

      <div class="ml-auto flex items-center gap-1.5 flex-shrink-0">
        <ThemePanel ref="themePanelRef" />
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
