export const REL_LABELS: Record<string, string> = {
  cuo: '错卦',
  zong: '综卦',
  hu:  '互卦',
  tong: '同卦',
}

// 错卦：全部阴阳翻转
export function getCuo(num: number): number {
  const bits = num.toString(2).padStart(6, '0')
  return parseInt(bits.split('').map(b => b === '1' ? '0' : '1').join(''), 2)
}

// 综卦：上下卦互换（旋转180°）
const ZONG_MAP: Record<number, number> = {
  1:1, 2:2, 3:62, 4:61, 5:60, 6:59, 7:58, 8:57,
  9:53, 10:54, 11:55, 12:56, 13:49, 14:50, 15:51, 16:52,
  17:45, 18:46, 19:43, 20:44, 21:47, 22:48, 23:41, 24:42,
  25:21, 26:22, 27:19, 28:20, 29:23, 30:24, 31:17, 32:18,
  33:5, 34:6, 35:3, 36:4, 37:1, 38:2, 39:63, 40:64,
  41:23, 42:24, 43:19, 44:20, 45:17, 46:18, 47:21, 48:22,
  49:13, 50:14, 51:15, 52:16, 53:9, 54:10, 55:11, 56:12,
  57:8, 58:7, 59:6, 60:5, 61:4, 62:3, 63:36, 64:35,
}

export function getZong(num: number): number {
  return ZONG_MAP[num] ?? num
}
