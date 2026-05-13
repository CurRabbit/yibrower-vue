<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme, COLOR_OPTIONS, TEXTURE_OPTIONS, FONT_SIZE_OPTIONS, ANIM_OPTIONS } from '@/composables/useTheme'
import { soundEnabled, toggleSound } from '@/composables/useSound'

const { theme, setTheme } = useTheme()
const open = ref(false)

function toggle() { open.value = !open.value }
function close() { open.value = false }

// Escape 键关闭面板
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    e.stopPropagation()
    close()
  }
}
onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))

defineExpose({ toggle })
</script>

<template>
  <div class="relative">
    <!-- Trigger button -->
    <button
      @click="toggle"
      :style="{
        width: 26, height: 26, borderRadius: 6,
        border: `1px solid var(--border-mid)`,
        background: open ? `${COLOR_OPTIONS.find(o => o.key === theme.color)?.accent}18` : 'var(--surface)',
        color: open ? COLOR_OPTIONS.find(o => o.key === theme.color)?.accent : 'var(--ink-faint)',
        fontSize: 11, fontWeight: 700,
        cursor: 'pointer', transition: 'all 0.2s ease',
      }"
      title="主题设置"
    >◈</button>

    <!-- Panel -->
    <Transition name="panel">
      <div
        v-if="open"
        class="absolute right-0 top-9 z-50 w-64 rounded-xl overflow-hidden"
        style="
          background: var(--surface-2);
          border: 1px solid var(--border-mid);
          box-shadow: 0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,150,30,0.06);
        "
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3" style="border-bottom: 1px solid var(--border)">
          <span class="text-sm font-medium" style="color: var(--gold-bright)">主题设置</span>
          <button @click="close" class="text-lg leading-none" style="color: var(--ink-faint)">×</button>
        </div>

        <div class="p-4 flex flex-col gap-5">

          <!-- 配色 -->
          <div>
            <div class="text-[10px] uppercase tracking-widest mb-2" style="color: var(--ink-faint)">配色</div>
            <div class="grid grid-cols-7 gap-2">
              <button
                v-for="opt in COLOR_OPTIONS"
                :key="opt.key"
                @click="setTheme({ color: opt.key })"
                :title="opt.hint"
                class="flex flex-col items-center gap-1 p-2 rounded transition-all"
                :style="{
                  background: theme.color === opt.key ? `${opt.accent}18` : 'var(--surface)',
                  border: theme.color === opt.key ? `1.5px solid ${opt.accent}` : `1px solid var(--border)`,
                  color: theme.color === opt.key ? opt.accent : 'var(--ink-faint)',
                  boxShadow: theme.color === opt.key ? `0 0 8px ${opt.accent}30` : 'none',
                }"
              >
                <div class="w-5 h-5 rounded-full" :style="{ background: `linear-gradient(135deg, ${opt.accent}, ${opt.accent}80)` }" />
                <span class="text-[11px] font-bold">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- 质感 -->
          <div>
            <div class="text-[10px] uppercase tracking-widest mb-2" style="color: var(--ink-faint)">质感</div>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in TEXTURE_OPTIONS"
                :key="opt.key"
                @click="setTheme({ texture: opt.key })"
                :title="opt.hint"
                class="flex flex-col items-center gap-1 p-2 rounded transition-all"
                :style="{
                  background: theme.texture === opt.key ? `${COLOR_OPTIONS.find(o => o.key === theme.color)?.accent}14` : 'var(--surface)',
                  border: theme.texture === opt.key ? `1.5px solid ${COLOR_OPTIONS.find(o => o.key === theme.color)?.accent}` : `1px solid var(--border)`,
                  color: theme.texture === opt.key ? 'var(--gold-bright)' : 'var(--ink-faint)',
                }"
              >
                <!-- Visual preview swatch -->
                <div
                  v-if="opt.key === 'default'"
                  class="w-8 h-5 rounded"
                  style="background: var(--surface-2); border: 1px solid var(--border)"
                />
                <div
                  v-else-if="opt.key === 'paper'"
                  class="w-8 h-5 rounded overflow-hidden relative"
                  style="background: var(--surface-2); border: 1px solid var(--border)"
                >
                  <div class="absolute inset-0 opacity-30" style="
                    background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27100%27 height=%27100%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%27 height=%27100%27 filter=%27url(%23n)%27 opacity=%270.4%27/%3E%3C/svg%3E');
                    " />
                </div>
                <div
                  v-else
                  class="w-8 h-5 rounded"
                  style="
                    background: var(--surface-2);
                    border: 1px solid var(--border);
                    background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2780%27 height=%2780%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.02 0.15%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix type=%27saturate%27 values=%270%27/%3E%3C/filter%3E%3Crect width=%2780%27 height=%2780%27 filter=%27url(%23n)%27 opacity=%270.5%27/%3E%3C/svg%3E');
                    "
                />
                <span class="text-[11px] font-medium">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- 字体大小 -->
          <div>
            <div class="text-[10px] uppercase tracking-widest mb-2" style="color: var(--ink-faint)">字体</div>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in FONT_SIZE_OPTIONS"
                :key="opt.key"
                @click="setTheme({ fontSize: opt.key })"
                :title="opt.hint"
                class="flex flex-col items-center gap-1 p-2 rounded transition-all"
                :style="{
                  background: theme.fontSize === opt.key ? `${COLOR_OPTIONS.find(o => o.key === theme.color)?.accent}14` : 'var(--surface)',
                  border: theme.fontSize === opt.key ? `1.5px solid ${COLOR_OPTIONS.find(o => o.key === theme.color)?.accent}` : `1px solid var(--border)`,
                  color: theme.fontSize === opt.key ? 'var(--gold-bright)' : 'var(--ink-faint)',
                }"
              >
                <span :style="{ fontSize: opt.key === 'sm' ? '10px' : opt.key === 'md' ? '13px' : '15px', fontWeight: 600 }">字</span>
                <span class="text-[10px] opacity-60">{{ opt.hint }}</span>
              </button>
            </div>
          </div>

          <!-- 动画速度 -->
          <div>
            <div class="text-[10px] uppercase tracking-widest mb-2" style="color: var(--ink-faint)">动效</div>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="opt in ANIM_OPTIONS"
                :key="opt.key"
                @click="setTheme({ anim: opt.key })"
                :title="opt.hint"
                class="flex flex-col items-center gap-1 p-2 rounded transition-all"
                :style="{
                  background: theme.anim === opt.key ? `${COLOR_OPTIONS.find(o => o.key === theme.color)?.accent}14` : 'var(--surface)',
                  border: theme.anim === opt.key ? `1.5px solid ${COLOR_OPTIONS.find(o => o.key === theme.color)?.accent}` : `1px solid var(--border)`,
                  color: theme.anim === opt.key ? 'var(--gold-bright)' : 'var(--ink-faint)',
                }"
              >
                <!-- Animated dot preview -->
                <div class="relative w-5 h-5 flex items-center justify-center">
                  <div
                    v-if="opt.key !== 'none'"
                    class="w-3 h-3 rounded-full"
                    :style="{
                      background: COLOR_OPTIONS.find(o => o.key === theme.color)?.accent,
                      animation: opt.key === 'slow' ? 'pulseDot 1.8s ease-in-out infinite' :
                                 opt.key === 'normal' ? 'pulseDot 0.6s ease-in-out infinite' :
                                 'pulseDot 0.25s ease-in-out infinite',
                    }"
                  />
                  <div
                    v-else
                    class="w-3 h-3 rounded-full"
                    style="background: var(--ink-faint); opacity: 0.3"
                  />
                </div>
                <span class="text-[11px]">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- 音效 -->
          <div>
            <div class="text-[10px] uppercase tracking-widest mb-2" style="color: var(--ink-faint)">音效</div>
            <div class="flex gap-2">
              <button
                @click="toggleSound"
                class="flex-1 flex items-center justify-center gap-2 p-2 rounded text-[11px] font-medium transition-all"
                :style="{
                  background: !soundEnabled ? 'var(--surface)' : `${COLOR_OPTIONS.find(o => o.key === theme.color)?.accent}14`,
                  border: `1px solid ${!soundEnabled ? 'var(--border)' : COLOR_OPTIONS.find(o => o.key === theme.color)?.accent}50`,
                  color: 'var(--ink-faint)',
                }"
              >
                <!-- 静音 SVG icon -->
                <svg v-if="!soundEnabled" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                <!-- 开启 SVG icon -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <span>{{ !soundEnabled ? '静音' : '开启' }}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>

    <!-- Click outside to close -->
    <div v-if="open" class="fixed inset-0 z-40" @click="close" />

    <!-- Pulse animation for dot preview -->
    <style>
      @keyframes pulseDot {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      .panel-enter-active, .panel-leave-active { transition: all 0.2s ease; }
      .panel-enter-from, .panel-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }
    </style>
  </div>
</template>
