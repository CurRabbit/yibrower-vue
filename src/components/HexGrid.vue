<script setup lang="ts">
import type { GuaBase } from '@/types'
import { WX_COLOR, WX_BG, WX_MAP } from '@/data/wuxing-map'

const props = defineProps<{
  guas: GuaBase[]
  onSelect: (key: string) => void
}>()

function getGuaKey(g: GuaBase): string {
  return `gua_${String(g.num).padStart(2, '0')}_${g.pinyin}`
}

function getCardVariant(gua: GuaBase): 'gateway' | 'balanced' | 'recessive' {
  const yangCount = (gua.binary.match(/1/g) || []).length
  if (yangCount >= 5) return 'gateway'
  if (yangCount <= 2) return 'recessive'
  return 'balanced'
}
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
    <div
      v-for="(gua, i) in guas"
      :key="getGuaKey(gua)"
      class="gua-card-enter cursor-pointer group"
      :style="{ animationDelay: `${(i % 8) * 40}ms`, animationFillMode: 'both' }"
      @click="onSelect(getGuaKey(gua))"
    >
      <div
        class="relative overflow-hidden transition-all duration-300 group-hover:shadow-hover group-hover:-translate-y-1"
        :style="{
          background: getCardVariant(gua) === 'balanced'
            ? `linear-gradient(135deg, ${WX_BG[gua.wuxing].replace('0.12', '0.10')}, rgba(22,18,14,0.96))`
            : `linear-gradient(160deg, ${WX_BG[gua.wuxing].replace('0.12', '0.18')}, rgba(22,18,14,0.98))`,
          border: `1px solid ${WX_BG[gua.wuxing].replace('0.12', '0.35')}`,
          borderTop: getCardVariant(gua) === 'gateway' ? `2px solid ${WX_COLOR[gua.wuxing]}` : undefined,
          borderLeft: getCardVariant(gua) === 'recessive' ? `2px dashed ${WX_COLOR[gua.wuxing]}50` : undefined,
          boxShadow: 'var(--shadow-card)',
          borderRadius: '12px',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease, border-top 0.3s ease, border-left 0.3s ease',
        }"
      >
        <!-- Image area -->
        <div class="relative w-full aspect-square overflow-hidden">
          <img
            :src="`/yi/assets/${getGuaKey(gua)}/images/${getGuaKey(gua)}.png`"
            :alt="gua.name"
            class="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            @error="(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }"
          />
          <!-- Wuxing corner badge -->
          <div
            class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
            :style="{
              backgroundColor: `${WX_COLOR[gua.wuxing]}28`,
              color: WX_COLOR[gua.wuxing],
              border: `1px solid ${WX_COLOR[gua.wuxing]}55`,
              backdropFilter: 'blur(8px)',
            }"
          >
            {{ WX_MAP[gua.wuxing] }}
          </div>
        </div>

        <!-- Card body -->
        <div class="px-2 pb-2 pt-1 flex items-center gap-1">
          <span
            class="font-mono flex-shrink-0 leading-none"
            style="color: var(--ink-light); font-size: 10px; opacity: 0.7"
          >
            {{ String(gua.num).padStart(2, '0') }}
          </span>
          <div class="w-px h-3 flex-shrink-0" :style="{ background: `${WX_COLOR[gua.wuxing]}55` }" />
          <span
            class="flex-shrink-0 leading-none"
            :style="{ color: WX_COLOR[gua.wuxing], fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }"
          >
            {{ gua.name }}
          </span>

          <!-- 卦象 -->
          <div class="relative ml-auto flex-shrink-0" style="width: 26px; height: 30px">
            <div
              v-for="(b, idx) in [...gua.binary].reverse()"
              :key="idx"
              class="absolute left-0 right-0"
              :style="{ top: idx * 5 }"
            >
              <!-- 阳爻 -->
              <div
                v-if="b === '1'"
                class="absolute rounded-sm"
                :style="{
                  left: 0, width: '100%', top: 0, height: 3,
                  background: WX_COLOR[gua.wuxing],
                  boxShadow: `0 0 3px ${WX_COLOR[gua.wuxing]}60`,
                }"
              />
              <!-- 阴爻 -->
              <template v-else>
                <div
                  class="absolute rounded-sm"
                  :style="{ left: 0, top: 0.5, width: '40%', height: 2, background: `${WX_COLOR[gua.wuxing]}80` }"
                />
                <div
                  class="absolute rounded-sm"
                  :style="{ right: 0, top: 0.5, width: '40%', height: 2, background: `${WX_COLOR[gua.wuxing]}80` }"
                />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
