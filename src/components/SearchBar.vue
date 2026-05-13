<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSearchHistory } from '@/composables/useSearchHistory'

const props = defineProps<{ value: string }>()
const emit = defineEmits<{ 'update:value': [v: string] }>()

const focused = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const showHistory = ref(false)
const history = ref<string[]>([])

const { load, add, clear } = useSearchHistory()

function focus() {
  searchInputRef.value?.focus()
}

// 搜索框获得焦点时显示历史记录
watch(focused, (f) => {
  if (f) {
    history.value = load()
    showHistory.value = history.value.length > 0
  } else {
    showHistory.value = false
  }
})

function selectHistory(item: string) {
  emit('update:value', item)
  showHistory.value = false
  focused.value = false
}

function handleClearHistory() {
  clear()
  history.value = []
  showHistory.value = false
}

// 搜索时保存历史（离开焦点时）
function handleBlur() {
  focused.value = false
  if (props.value.trim()) {
    add(props.value.trim())
  }
}

// Escape 键：清空搜索内容并失焦
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (props.value) {
      emit('update:value', '')
    }
    searchInputRef.value?.blur()
  }
}

defineExpose({ focus })
</script>

<template>
  <!-- Mobile: wider search bar, focus expand -->
  <div class="relative" style="flex: 1; min-width: 0; max-width: 320px">
    <div
      class="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
      :style="{
        opacity: focused ? 1 : 0,
        boxShadow: '0 0 0 3px color-mix(in oklab, var(--atm-color) 12%, transparent)',
      }"
    />
    <div class="relative flex items-center">
      <span
        class="absolute left-3.5 text-sm pointer-events-none transition-colors"
        :style="{ color: focused ? 'var(--gold)' : 'var(--ink-faint)' }"
      >⊛</span>
      <input
        ref="searchInputRef"
        type="text"
        :value="value"
        placeholder="搜索卦象…"
        class="w-full rounded-full text-sm transition-all"
        :style="{
          padding: '7px 32px 7px 32px',
          background: focused ? 'var(--surface-2)' : 'var(--surface)',
          border: `1px solid ${focused ? 'color-mix(in oklab, var(--atm-color) 38%, transparent)' : 'var(--border-mid)'}`,
          color: 'var(--ink)',
          outline: 'none',
          letterSpacing: '0.02em',
          boxShadow: focused ? 'inset 0 1px 3px rgba(0,0,0,0.2), 0 0 12px color-mix(in oklab, var(--atm-color) 8%, transparent)' : 'none',
        }"
        @input="emit('update:value', ($event.target as HTMLInputElement).value)"
        @focus="focused = true"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      <button
        v-if="value"
        class="absolute right-3 rounded-full flex items-center justify-center cursor-pointer transition-all"
        style="width: 16px; height: 16px; font-size: 10px; line-height: 1; color: var(--ink-faint); background: var(--surface-2)"
        @mouseenter="($event.target as HTMLElement).style.color = 'var(--ink)'"
        @mouseleave="($event.target as HTMLElement).style.color = 'var(--ink-faint)'"
        @click="emit('update:value', '')"
      >✕</button>
    </div>

    <!-- 搜索历史下拉 -->
    <Transition name="history">
      <div
        v-if="showHistory && !value"
        class="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
        style="
          background: var(--surface-2);
          border: 1px solid var(--border-mid);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        "
      >
        <div class="flex items-center justify-between px-3 py-1.5" style="border-bottom: 1px solid var(--border)">
          <span class="text-[10px] uppercase tracking-widest" style="color: var(--ink-faint)">搜索历史</span>
          <button
            @click="handleClearHistory"
            class="text-[10px] cursor-pointer transition-colors"
            style="color: var(--ink-faint)"
            @mouseenter="($event.target as HTMLElement).style.color = 'var(--vermilion)'"
            @mouseleave="($event.target as HTMLElement).style.color = 'var(--ink-faint)'"
          >清除</button>
        </div>
        <div class="py-1">
          <button
            v-for="item in history"
            :key="item"
            @mousedown.prevent="selectHistory(item)"
            class="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
            style="color: var(--ink-light)"
            @mouseenter="($event.target as HTMLElement).style.background = 'var(--elevated)'"
            @mouseleave="($event.target as HTMLElement).style.background = 'transparent'"
          >
            <span style="color: var(--ink-faint)">⊛</span>
            <span>{{ item }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.history-enter-active, .history-leave-active { transition: all 0.15s ease; }
.history-enter-from, .history-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
