import { ref, watch, onMounted } from 'vue'

/* ── Types ── */
export type ColorTheme = 'default' | 'ink' | 'celadon' | 'vermilion' | 'cloud' | 'dawn' | 'mountain'
export type TextureTheme = 'default' | 'paper' | 'wood'
export type FontSize = 'sm' | 'md' | 'lg'
export type AnimSpeed = 'slow' | 'normal' | 'fast' | 'none'

export interface FullTheme {
  color: ColorTheme
  texture: TextureTheme
  fontSize: FontSize
  anim: AnimSpeed
}

/* ── Options ── */
export const COLOR_OPTIONS: { key: ColorTheme; label: string; hint: string; accent: string }[] = [
  { key: 'default',   label: '金', hint: '暖金流光',    accent: '#c8961e' },
  { key: 'ink',       label: '墨', hint: '水墨素雅',    accent: '#8a7e70' },
  { key: 'celadon',  label: '瓷', hint: '青瓷冰裂',    accent: '#5a8878' },
  { key: 'vermilion', label: '朱', hint: '宫墙朱红',    accent: '#9a6840' },
  { key: 'cloud',     label: '云', hint: '暖白学术',    accent: '#4a6a8a' },
  { key: 'dawn',      label: '晨', hint: '暖米古雅',    accent: '#9a6030' },
  { key: 'mountain',  label: '山', hint: '青绿自然',    accent: '#3a7060' },
]

export const TEXTURE_OPTIONS: { key: TextureTheme; label: string; hint: string }[] = [
  { key: 'default', label: '素面', hint: '纯净深色' },
  { key: 'paper',   label: '宣纸', hint: '纸纹质感' },
  { key: 'wood',    label: '木纹', hint: '木色沉稳' },
]

export const FONT_SIZE_OPTIONS: { key: FontSize; label: string; hint: string; scale: string }[] = [
  { key: 'sm', label: '小', hint: '紧凑', scale: '0.875' },
  { key: 'md', label: '中', hint: '标准', scale: '1' },
  { key: 'lg', label: '大', hint: '舒朗', scale: '1.125' },
]

export const ANIM_OPTIONS: { key: AnimSpeed; label: string; hint: string; duration: string }[] = [
  { key: 'slow',   label: '慢', hint: '悠远', duration: '1.8s' },
  { key: 'normal', label: '常', hint: '标准', duration: '0.6s' },
  { key: 'fast',   label: '快', hint: '凌厉', duration: '0.25s' },
  { key: 'none',   label: '静', hint: '禁用', duration: '0s' },
]

/* ── Defaults ── */
const DEFAULT_THEME: FullTheme = {
  color: 'default',
  texture: 'default',
  fontSize: 'md',
  anim: 'normal',
}

/* ── Storage key ── */
const STORAGE_KEY = 'yi-theme-v2'

function loadTheme(): FullTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_THEME }
}

function saveTheme(t: FullTheme) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
}

/* ── Composable ── */
const theme = ref<FullTheme>(loadTheme())

export function useTheme() {
  function setTheme(patch: Partial<FullTheme>) {
    theme.value = { ...theme.value, ...patch }
  }

  function applyTheme() {
    const t = theme.value

    // Color theme
    document.body.setAttribute('data-theme', t.color === 'default' ? '' : t.color)

    // Texture theme
    document.body.setAttribute('data-texture', t.texture === 'default' ? '' : t.texture)

    // Font size via CSS variable
    const fsOpt = FONT_SIZE_OPTIONS.find(o => o.key === t.fontSize)
    document.documentElement.style.setProperty('--font-scale', fsOpt?.scale ?? '1')

    // Anim speed via CSS variable + disable all
    const anOpt = ANIM_OPTIONS.find(o => o.key === t.anim)
    document.documentElement.style.setProperty('--anim-duration', anOpt?.duration ?? '0.6s')
    if (t.anim === 'none') {
      document.body.classList.add('anim-none')
    } else {
      document.body.classList.remove('anim-none')
    }

    saveTheme(t)
  }

  watch(theme, applyTheme, { deep: true })

  onMounted(applyTheme)

  return { theme, setTheme }
}
