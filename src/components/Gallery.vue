<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GuaBase } from '@/types'

const props = defineProps<{
  gua: GuaBase
  imageUrls: string[]
  class?: string
}>()

const current = ref(0)
const total = computed(() => props.imageUrls.length)
const lightboxOpen = ref(false)
const lightboxOrigin = ref<{ x: number; y: number } | null>(null)

// Per-image loading state
const loaded = ref<Record<number, boolean>>({})
const errored = ref<Record<number, boolean>>({})

// Reset loaded states when imageUrls change (different gua)
watch(() => props.imageUrls, () => {
  loaded.value = {}
  errored.value = {}
  current.value = 0
})

function openLightbox(i: number, e?: MouseEvent) {
  current.value = i
  lightboxOpen.value = true
  if (e) {
    lightboxOrigin.value = { x: e.clientX, y: e.clientY }
  }
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxOpen.value = false
  lightboxOrigin.value = null
  document.body.style.overflow = ''
}

function prev() {
  current.value = current.value > 0 ? current.value - 1 : props.imageUrls.length - 1
}

function next() {
  current.value = current.value < props.imageUrls.length - 1 ? current.value + 1 : 0
}

function goTo(i: number) {
  current.value = i
}

function handleKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

// Touch swipe for mobile lightbox
const lightboxTouchStartX = ref(0)
function handleLightboxTouchStart(e: TouchEvent) {
  lightboxTouchStartX.value = e.touches[0]?.clientX ?? 0
}
function handleLightboxTouchEnd(e: TouchEvent) {
  if (!lightboxOpen.value) return
  const dx = e.changedTouches[0]?.clientX - lightboxTouchStartX.value ?? 0
  if (Math.abs(dx) < 60) return
  if (dx < 0) next()
  else prev()
}

function handleImgLoad(i: number) {
  loaded.value[i] = true
}

function handleImgError(i: number) {
  errored.value[i] = true
}

function isLoaded(i: number) {
  return loaded.value[i] === true && !errored.value[i]
}

// Attach keydown once via addEventListener pattern
import { onMounted, onUnmounted } from 'vue'
onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div :class="props.class" class="flex flex-col gap-2">

    <!-- Image count + view toggle header -->
    <div v-if="imageUrls.length > 0" class="flex items-center justify-between">
      <span class="text-[10px] uppercase tracking-widest" style="color: var(--ink-faint)">
        图库 · {{ imageUrls.length }} 张
      </span>
    </div>

    <!-- Thumbnail grid -->
    <div v-if="imageUrls.length > 0" class="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      <div
        v-for="(url, i) in imageUrls"
        :key="i"
        class="relative rounded-lg overflow-hidden cursor-zoom-in aspect-square"
        :class="current === i ? 'ring-2' : 'opacity-80 hover:opacity-100'"
        :style="{
          ringColor: current === i ? 'var(--atm-color)' : 'transparent',
          transition: 'opacity 0.2s, transform 0.2s',
        }"
        @click="openLightbox(i, $event)"
      >
        <!-- Skeleton while loading -->
        <div
          v-if="!isLoaded(i)"
          class="absolute inset-0 animate-pulse rounded-lg"
          style="background: var(--surface-2)"
        />

        <!-- Image -->
        <img
          :src="url"
          :alt="`${gua.name} ${i + 1}`"
          class="w-full h-full object-cover transition-all duration-200 hover:scale-105"
          :class="isLoaded(i) ? 'opacity-100' : 'opacity-0'"
          @load="handleImgLoad(i)"
          @error="handleImgError(i)"
        />

        <!-- Current indicator -->
        <div
          v-if="current === i"
          class="absolute bottom-1 right-1 w-2 h-2 rounded-full"
          style="background: var(--atm-color); box-shadow: 0 0 4px var(--atm-color)"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-8 gap-2 rounded-lg" style="background: var(--surface); border: 1px dashed var(--border)">
      <div class="text-2xl opacity-20">◈</div>
      <p class="text-xs" style="color: var(--ink-faint)">暂无图片</p>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="gallery-lb">
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center"
          style="background: rgba(5,3,2,0.95); backdrop-filter: blur(16px);"
          @click.self="closeLightbox"
          @touchstart.passive="handleLightboxTouchStart"
          @touchend.passive="handleLightboxTouchEnd"
          role="dialog"
          aria-modal="true"
        >
          <!-- Close -->
          <button
            @click="closeLightbox"
            class="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
            style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);"
            aria-label="关闭"
          >×</button>

          <!-- Counter -->
          <div class="absolute top-4 left-1/2 -translate-x-1/2 text-sm" style="color: rgba(255,255,255,0.5)">
            {{ current + 1 }} / {{ total }}
          </div>

          <!-- Gua name badge -->
          <div class="absolute top-4 left-4 px-3 py-1 rounded-lg text-sm font-medium" style="background: rgba(200,150,30,0.2); color: var(--gold-bright); border: 1px solid rgba(200,150,30,0.3);">
            {{ gua.name }} · {{ gua.pinyin }}
          </div>

          <!-- Large image -->
          <div class="relative w-full h-full flex items-center justify-center p-8 md:p-16" @click.self="closeLightbox">
            <img
              :src="imageUrls[current]"
              :alt="`${gua.name} ${current + 1}`"
              class="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              style="max-height: 85vh; animation: galleryImgIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both"
              @click.stop
            />
          </div>

          <!-- Left nav -->
          <button
            v-if="imageUrls.length > 1"
            @click.stop="prev"
            class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
            style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);"
            aria-label="上一张"
          >‹</button>

          <!-- Right nav -->
          <button
            v-if="imageUrls.length > 1"
            @click.stop="next"
            class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
            style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);"
            aria-label="下一张"
          >›</button>

          <!-- Dot strip at bottom -->
          <div v-if="imageUrls.length > 1" class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full" style="background: rgba(0,0,0,0.5);">
            <button
              v-for="(_, i) in imageUrls"
              :key="i"
              @click.stop="goTo(i)"
              class="rounded-full transition-all"
              :style="{
                width: i === current ? '8px' : '5px',
                height: i === current ? '8px' : '5px',
                background: i === current ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
              }"
              :aria-label="`第${i + 1}张`"
            />
          </div>

          <!-- Thumbnail strip at bottom of lightbox (above dots) -->
          <div v-if="imageUrls.length > 1" class="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style="background: rgba(0,0,0,0.4); max-width: 90vw; overflow-x: auto;">
            <button
              v-for="(url, i) in imageUrls"
              :key="i"
              @click.stop="goTo(i)"
              class="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden transition-all"
              :style="{
                opacity: i === current ? 1 : 0.5,
                ring: i === current ? '0 0 0 2px var(--gold)' : 'none',
                outline: i === current ? '2px solid var(--gold)' : '2px solid transparent',
                outlineOffset: '1px',
              }"
            >
              <img :src="url" :alt="`thumb ${i + 1}`" class="w-full h-full object-cover" loading="lazy" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.gallery-lb-enter-active {
  transition: opacity 0.2s ease;
}
.gallery-lb-leave-active {
  transition: opacity 0.15s ease;
}
.gallery-lb-enter-from,
.gallery-lb-leave-to {
  opacity: 0;
}

@keyframes galleryImgIn {
  from { transform: scale(0.92); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
</style>
