// 数据加载 + 展示格式化
import { useEffect, useState } from 'react'
import type { History, Snapshot } from './types'

const base = import.meta.env.BASE_URL

// history.json 可能在首次部署时不存在（404）→ 返回空对象，不阻塞大屏
async function loadJson<T>(path: string, optional = false): Promise<T | null> {
  const res = await fetch(base + path)
  if (!res.ok) {
    if (optional) return null
    throw new Error(`${path} HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export function useDashboardData() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [history, setHistory] = useState<History>({})
  const [error, setError] = useState('')
  useEffect(() => {
    let on = true
    Promise.all([loadJson<Snapshot>('data/snapshot.json'), loadJson<History>('data/history.json', true)])
      .then(([s, h]) => {
        if (!on) return
        if (s) setSnap(s)
        if (h) setHistory(h)
        if (!s) setError('暂无数据，请先运行 pnpm collect 采集')
      })
      .catch((e) => on && setError(String(e.message ?? e)))
    return () => {
      on = false
    }
  }, [])
  return { snap, history, error }
}

// 历史点按日期排序 → ECharts 折线数据
export function historySeries(history: Record<string, { city: number }>) {
  return Object.entries(history)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, p]) => [date, p.city] as [string, number])
}

export const fmtPrice = (v: number | null | undefined) => (v == null ? '—' : `${v.toLocaleString('zh-CN')}元/㎡`)
export const fmtWan = (v: number | null | undefined) => (v == null ? '—' : `${v}万`)
export const fmtPct = (v: number | null | undefined) => (v == null ? '—' : `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`)
// 涨红跌绿（A股惯例）
export const deltaClass = (v: number | null | undefined) => (v == null ? '' : v > 0 ? 'up' : v < 0 ? 'down' : '')
