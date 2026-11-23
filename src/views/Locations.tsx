// 位置筛选视图：区 → 商圈级联 + 小区列表（名称/均价/环比/在售/关注）
import { useEffect, useMemo, useState } from 'react'
import { deltaClass, fmtPct, fmtPrice } from '../data'
import type { Snapshot } from '../types'

export function Locations({ snap, initDistrictId }: { snap: Snapshot; initDistrictId?: number }) {
  const [districtId, setDistrictId] = useState<number>(initDistrictId ?? snap.districts[0]?.id ?? 0)
  const [areaId, setAreaId] = useState<number>(0) // 0 = 全部商圈
  const [q, setQ] = useState('')

  useEffect(() => {
    if (initDistrictId != null) setDistrictId(initDistrictId)
  }, [initDistrictId])
  useEffect(() => setAreaId(0), [districtId])

  const district = snap.districts.find((d) => d.id === districtId) ?? snap.districts[0]
  const rows = useMemo(() => {
    if (!district) return []
    return snap.communities
      .filter((c) => (areaId ? c.districtId === district.id && c.area && c.area === district.areas.find((a) => a.id === areaId)?.name : c.districtId === district.id))
      .filter((c) => (q ? c.name.includes(q.trim()) : true))
      .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))
  }, [snap.communities, district, areaId, q])

  if (!district) return <p className="empty">暂无区县数据</p>
  return (
    <div className="view">
      <div className="filter-bar glass">
        <label>
          区县
          <select value={districtId} onChange={(e) => setDistrictId(Number(e.target.value))}>
            {[...snap.districts].sort((a, b) => b.avg - a.avg).map((d) => (
              <option key={d.id} value={d.id}>{d.name}（{d.avg}）</option>
            ))}
          </select>
        </label>
        <label>
          商圈
          <select value={areaId} onChange={(e) => setAreaId(Number(e.target.value))} disabled={district.areas.length === 0}>
            <option value={0}>全部</option>
            {district.areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}（{a.avg}）</option>
            ))}
          </select>
        </label>
        <label className="grow">
          小区搜索
          <input type="search" value={q} placeholder="输入小区名关键字" onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <p className="filter-meta">
        {district.name} 参考均价 <b className={deltaClass(district.mom)}>{fmtPrice(district.avg)}</b>
        <span className={deltaClass(district.mom)}>（环比 {fmtPct(district.mom)}）</span>
        · 小区 {rows.length} 个
      </p>

      <div className="community-grid">
        {rows.map((c) => (
          <a key={c.id} className="community-card glass" href={`#/community/${encodeURIComponent(String(c.id))}`}>
            <b className="name">{c.name}</b>
            {c.area && <span className="area">{c.area}</span>}
            <span className="num price">{fmtPrice(c.avg)}</span>
            <span className={`num ${deltaClass(c.mom)}`}>{fmtPct(c.mom)}</span>
            <span className="meta">{c.sale != null ? `在售 ${c.sale}` : ''}{c.followers ? ` · ${c.followers}人关注` : ''}</span>
          </a>
        ))}
        {rows.length === 0 && <p className="empty">该筛选条件下没有小区</p>}
      </div>
    </div>
  )
}
