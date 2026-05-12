/**
 * useLunar — 农历 & 时辰计算
 * 无外部依赖，纯天文算法实现
 */

// 24节气名称（从冬至起，奇数=中气，偶数=节 气）
const SOLAR_TERMS = [
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
  '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
]

// 12时辰（以子时=23:00为起点）
const SHICHEN = ['子', '丑', '丑', '寅', '寅', '卯', '卯', '辰', '辰', '巳', '巳', '午', '午', '未', '未', '申', '申', '酉', '酉', '戌', '戌', '亥', '亥', '子']

// 60甲子（年）
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DIZHI   = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 儒略日数（JD）from Gregorian date */
function gregorianToJD(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

/** 从 JD 获取年月日（UTC noon） */
function jdToGregorian(jd: number): { year: number; month: number; day: number } {
  const Z  = Math.floor(jd + 0.5)
  const A  = Math.floor((Z - 1867216.25) / 36524.25)
  const a1 = Z + 1 + A - Math.floor(A / 4)
  const b  = a1 + 1524
  const c  = Math.floor((b - 122.1) / 365.25)
  const d  = Math.floor(365.25 * c)
  const e  = Math.floor((b - d) / 30.6001)
  const day = b - d - Math.floor(30.6001 * e)
  const month = e < 14 ? e - 1 : e - 13
  const year = month > 2 ? c - 4716 : c - 4715
  return { year, month, day }
}

/** 太阳几何黄经（°），简化均值算法 */
function sunLongitude(jd: number): number {
  const T  = (jd - 2451545) / 36525          // J2000 千年数
  const L0 = 280.46646 + 36000.76983 * T    // 平黄经
  const M  = 357.52716 + 35999.05034 * T     // 平近点角
  const C  = (1.91466 - 0.004817 * T) * Math.sin(M * Math.PI / 180)
           + 0.01999  * Math.sin(2 * M * Math.PI / 180)
  const λ = L0 + C                           // 真黄经
  return ((λ % 360) + 360) % 360
}

/** 某节气发生在一年中的 JD（简化：±1天内） */
function solarTermJD(year: number, idx: number): number {
  // 粗略：以冬至=0，累加每节气≈15.44天
  // 精确值用二分查找修正
  const y2k = 2451516 // 2000-01-06 基准（冬至附近）
  const doy  = Math.floor((gregorianToJD(year, 12, 31) - gregorianToJD(year, 1, 1)) / 1) + 1
  // 找到当年冬至的近似 JD
  let d = gregorianToJD(year, 12, 15)
  let lo = 0, hi = 365
  for (let i = 0; i < 10; i++) {
    const mid = Math.floor((lo + hi) / 2)
    const jd  = d + mid
    const sl  = sunLongitude(jd)
    const target = idx * 15
    if (sl < target) lo = mid + 1
    else hi = mid
  }
  // 二分后±2天扫描
  let best = d + lo
  let bestDiff = 999
  for (let dd = Math.max(d + lo - 2, d - 30); dd <= d + lo + 2; dd++) {
    const sl  = sunLongitude(dd)
    const diff = Math.abs(sl - idx * 15)
    if (diff < bestDiff) { bestDiff = diff; best = dd }
  }
  return best
}

/** 公历日期 → 农历月日（闰月用 negative 表示） */
function lunarFromGregorian(year: number, month: number, day: number): { lunarYear: number; lunarMonth: number; lunarDay: number; leap: boolean } {
  const jd  = gregorianToJD(year, month, day)
  // 2000-02-05 = 腊月初一 → JD 2451583
  const base = 2451583
  const offset = Math.floor(jd - base)

  // 粗估农历年（以立春为界）
  let ly = year
  const spring = solarTermJD(year, 3) // 立春
  if (jd < spring) ly--

  // 计算距当年立春的天数
  const lySpring = solarTermJD(ly, 3)
  const daysFromSpring = Math.floor(jd - lySpring)

  // 粗估月数（每朔望月≈29.53天）
  const SYNODIC = 29.530588
  let approxMonth = Math.floor(daysFromSpring / SYNODIC)

  // 逐月精确化：找到包含当前日的农历月
  // 2000年正月=J2451583+30=2451613（正月初一）
  const LY_START_JD = solarTermJD(ly, 3)
  let m = 0, mjd = LY_START_JD
  for (let i = 0; i < 16; i++) {
    const nmjd = mjd + SYNODIC * (i + 1)
    if (jd < nmjd) { m = i - 4; mjd = mjd + SYNODIC * i; break }
  }

  const lunarMonth = m
  const lunarDay = Math.floor(jd - (LY_START_JD + SYNODIC * Math.max(0, m + 4))) + 1
  return { lunarYear: ly, lunarMonth, lunarDay, leap: false }
}

/** 格式化农历日期 */
function formatLunarDate(lunarMonth: number, lunarDay: number): string {
  const MONTH_NAMES = ['', '正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月']
  const DAY_NAMES   = ['',
    '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'
  ]
  const m = lunarMonth === 11 ? '腊月' : lunarMonth === 12 ? '腊月' : MONTH_NAMES[lunarMonth] || `农历${lunarMonth}`
  return `${m}${DAY_NAMES[lunarDay] || lunarDay}`
}

/** 60甲子年 */
function ganjizhiYear(year: number): string {
  const base = 4 // 1984=甲子年
  const diff = year - 1984
  const idx = ((diff % 60) + 60) % 60
  return TIANGAN[idx % 10] + DIZHI[idx % 12]
}

/** 当日节气（无则空字符串） */
function todaySolarTerm(year: number, month: number, day: number): string {
  const jd = gregorianToJD(year, month, day)
  for (let i = 0; i < 24; i++) {
    const termJD = solarTermJD(year, i)
    if (Math.abs(termJD - jd) < 1.2) return SOLAR_TERMS[i]
  }
  return ''
}

import { ref, onMounted, onUnmounted } from 'vue'

export interface LunarInfo {
  lunarDate:   string   // 农历描述，如"三月初五"
  ganzhiYear:  string   // 甲子年，如"甲子"
  shichen:     string   // 当前时辰，如"午时"
  solarTerm:   string   // 节气（可能为空）
}

export function useLunar() {
  const info = ref<LunarInfo | null>(null)
  let timer: ReturnType<typeof setInterval>

  function update() {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    const d = now.getDate()

    const { lunarMonth, lunarDay } = lunarFromGregorian(y, m, d)
    const lunarDate = formatLunarDate(lunarMonth, lunarDay)
    const ganzhiYear = ganjizhiYear(y)
    const solarTerm = todaySolarTerm(y, m, d)

    // 时辰：当前小时+1（23→子，0→子，1→丑...）
    const h = now.getHours()
    const shichen = SHICHEN[(h + 1) % 24]

    info.value = { lunarDate, ganzhiYear, shichen, solarTerm }
  }

  onMounted(() => {
    update()
    timer = setInterval(update, 60_000) // 每分钟刷新
  })
  onUnmounted(() => clearInterval(timer))

  return { info }
}
