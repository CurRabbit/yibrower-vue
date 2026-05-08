<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { GuaBase } from '@/types'

const props = defineProps<{
  gua: GuaBase
  imageUrls: string[]
  class?: string
}>()

const current = ref(0)
const total = computed(() => props.imageUrls.length)
const lightboxOpen = ref(false)
const imgLoaded = ref(false)

function prev() {
  imgLoaded.value = false
  current.value = current.value > 0 ? current.value - 1 : props.imageUrls.length - 1
}

function next() {
  imgLoaded.value = false
  current.value = current.value < props.imageUrls.length - 1 ? current.value + 1 : 0
}

function goTo(i: number) {
  imgLoaded.value = false
  current.value = i
}

function openLightbox(i: number) {
  current.value = i
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div :class="props.class" class="flex flex-col gap-2">
    <!-- Single image with swipe area -->
    <div class="relative w-full overflow-hidden rounded-lg bg-black/30 cursor-zoom-in" style="aspect-ratio: 4/3;" @click="openLightbox(current)">
      <!-- Loading skeleton -->
      <div v-if="!imgLoaded" class="absolute inset-0 flex items-center justify-center">
        <div class="w-8 h-8 border-2 rounded-full animate-spin" style="border-color: var(--gold); border-top-color: transparent" />
      </div>
      <img
        v-if="imageUrls.length > 0"
        :src="imageUrls[current]"
        :alt="`${gua.name} ${current + 1}`"
        class="w-full h-full object-contain transition-opacity duration-300"
        :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
        @load="imgLoaded = true"
      />

      <!-- Zoom hint -->
      <div class="absolute bottom-2 right-2 opacity-40 text-white text-xs flex items-center gap-1 pointer-events-none">
        <span>◈</span>
      </div>

      <!-- Left nav -->
      <button
        v-if="imageUrls.length > 1"
        @click.stop="prev"
        class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-lg opacity-60 hover:opacity-100 transition-opacity"
        style="background: rgba(0,0,0,0.5); color: #fff;"
        aria-label="上一张"
      >‹</button>

      <!-- Right nav -->
      <button
        v-if="imageUrls.length > 1"
        @click.stop="next"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-lg opacity-60 hover:opacity-100 transition-opacity"
        style="background: rgba(0,0,0,0.5); color: #fff;"
        aria-label="下一张"
      >›</button>
    </div>

    <!-- Dot indicators -->
    <div v-if="imageUrls.length > 1" class="flex items-center justify-center gap-1.5">
      <button
        v-for="(_, i) in imageUrls"
        :key="i"
        @click="goTo(i)"
        class="h-1.5 rounded-full transition-all"
        :style="{
          width: i === current ? '20px' : '6px',
          background: i === current ? 'var(--atm-color)' : 'color-mix(in oklab, var(--atm-color) 25%, transparent)',
        }"
        :aria-label="`第${i + 1}张`"
      />
    </div>

    <!-- Counter -->
    <div v-if="imageUrls.length > 1" class="text-center text-xs" style="color: var(--ink-faint)">
      {{ current + 1 }} / {{ total }}
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center"
          style="background: rgba(5,3,2,0.95); backdrop-filter: blur(12px);"
          @click.self="closeLightbox"
        >
          <!-- Close -->
          <button
            @click="closeLightbox"
            class="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110"
            style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);"
            aria-label="关闭"
          >×</button>

          <!-- Counter -->
          <div class="absolute top-4 left-1/2 -translate-x-1/2 text-sm" style="color: rgba(255,255,255,0.5)">
            {{ current + 1 }} / {{ total }}
          </div>

          <!-- Gua name badge -->
          <div class="absolute top-4 left-4 px-3 py-1 rounded-lg text-sm font-medium" style="background: rgba(200,150,30,0.2); color: var(--gold-bright, #c8961e); border: 1px solid rgba(200,150,30,0.3);">
            {{ gua.name }} · {{ gua.pinyin }}
          </div>

          <!-- Image -->
          <div class="relative w-full h-full flex items-center justify-center p-8 md:p-16" @click.self="closeLightbox">
            <img
              :src="imageUrls[current]"
              :alt="`${gua.name} ${current + 1}`"
              class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style="max-height: 85vh;"
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
                background: i === current ? 'var(--gold, #c8961e)' : 'rgba(255,255,255,0.3)',
              }"
              :aria-label="`第${i + 1}张`"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.25s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
