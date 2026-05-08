export type Wuxing = 'jin' | 'mu' | 'shui' | 'huo' | 'tu'
export type Position = 'inner' | 'outer'
export type RelationType = 'cuo' | 'zong' | 'hu' | 'tong'

export interface GuaBase {
  num: number
  name: string
  pinyin: string
  wuxing: Wuxing
  binary: string
  guaci: string
  yaoci: string[]
  xiangci?: string
  tuanc?: string
}

export interface GuaWithMedia extends GuaBase {
  key: string
  images: string[]
  music: string[]
  lyrics: string[]
  voice: string[]
}

export interface GuaRelation {
  type: RelationType
  label: string
  gua: GuaBase | null
}

export interface FilterState {
  search: string
  wuxing: Wuxing | 'all'
}

export interface ModalState {
  open: boolean
  guaKey: string | null
}

export interface ImmersionState {
  active: boolean
  guaKey: string | null
  relType: RelationType | null
  journeyIndex: number
  journeyActive: boolean
}
