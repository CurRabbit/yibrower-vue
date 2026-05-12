import { ref } from 'vue'

// 音效管理器 — Web Audio API 合成，无外部依赖
// 点击卦卡片：低沉 tap
// 点击爻位按钮：清脆短促

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

// 卦卡片点击 — 低沉短促 tap
function playCardTap() {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.frequency.setValueAtTime(180, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.08)
    gain.gain.setValueAtTime(0.3, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 0.1)
  } catch (_) {}
}

// 爻位按钮点击 — 清脆高频短促
function playYaoClick() {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.06)
    gain.gain.setValueAtTime(0.25, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 0.08)
  } catch (_) {}
}

// 偏好控制
const soundEnabled = ref(
  localStorage.getItem('yi-sound') !== 'off'
)

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  localStorage.setItem('yi-sound', soundEnabled.value ? 'on' : 'off')
}

function playCardTapIfEnabled() {
  if (soundEnabled.value) playCardTap()
}

function playYaoClickIfEnabled() {
  if (soundEnabled.value) playYaoClick()
}

export {
  soundEnabled,
  toggleSound,
  playCardTapIfEnabled,
  playYaoClickIfEnabled,
}
