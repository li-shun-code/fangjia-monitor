// snapshot.json / history.json 数据结构（与 scripts/collect.mjs 输出一一对应）
export interface CityInfo {
  avg: number | null
  month: string | null
  mom: number | null
  yoy: number | null
}

export interface Area {
  id: number
  name: string
  avg: number
  mom: number
}

export interface District {
  id: number
  name: string
  avg: number
  prevAvg: number | null
  mom: number | null
  yoy: number | null
  month?: string | null
  areas: Area[]
}

export interface Listing {
  houseid: number
  title: string
  areaSqm: string
  layout: string
  facing: string
  community: string
  totalWan: number | null
  unit: number | null
  img: string
  vr: boolean
  video: boolean
  tags: string[]
  album: string[]
}

export interface Community {
  id: number | string
  name: string
  district: string
  districtId: number
  area: string
  avg: number | null
  mom: number | null
  tabs: string[]
  sale?: number
  rent?: number
  followers?: number
  listings?: Listing[]
}

export interface Snapshot {
  generatedAt: string
  city: CityInfo
  districts: District[]
  communities: Community[]
  counts: { districts: number; communities: number; listings: number }
}

// history.json：日期 → 当日价格快照（趋势随采集累积）
export interface HistoryPoint {
  city: number
  cityMom: number
  districts: Record<string, number>
  communities: Record<string, number>
}
export type History = Record<string, HistoryPoint>
