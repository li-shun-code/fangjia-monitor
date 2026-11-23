// 小区详情视图：小区 KPI + 二手房房源卡片（相册灯箱 / 外链详情页）
import { deltaClass, fmtPct, fmtPrice } from '../data'
import type { Snapshot } from '../types'
import { HouseCard } from '../components/HouseCard'

export function Community({ snap, id }: { snap: Snapshot; id: string }) {
  const c = snap.communities.find((x) => String(x.id) === id)
  if (!c) return <p className="empty">没有找到该小区，可能数据快照已更新，<a href="#/">回到总览</a>。</p>
  const listings = c.listings ?? []
  return (
    <div className="view">
      <p className="crumbs"><a href="#/">总览</a> / {c.district && <a href={`#/district/${c.districtId}`}>{c.district}</a>} / {c.name}</p>

      <div className="kpi-row">
        <div className="kpi glass">
          <span className="kpi-label">小区均价</span>
          <b className="kpi-value">{fmtPrice(c.avg)}</b>
        </div>
        <div className={`kpi glass ${deltaClass(c.mom)}`}>
          <span className="kpi-label">环比</span>
          <b className="kpi-value">{fmtPct(c.mom)}</b>
        </div>
        {c.sale != null && (
          <div className="kpi glass">
            <span className="kpi-label">在售 / 在租</span>
            <b className="kpi-value">{c.sale} / {c.rent ?? '—'}</b>
          </div>
        )}
        {c.followers != null && c.followers > 0 && (
          <div className="kpi glass">
            <span className="kpi-label">关注度</span>
            <b className="kpi-value">{c.followers.toLocaleString('zh-CN')}人</b>
          </div>
        )}
      </div>

      <section className="card glass">
        <h2>在售二手房（{listings.length}）</h2>
        {listings.length === 0 ? (
          <p className="empty">该小区暂无在售房源或尚未采集，每日采集会自动补齐。</p>
        ) : (
          <div className="house-grid">
            {listings.map((h) => <HouseCard key={h.houseid} h={h} />)}
          </div>
        )}
      </section>
      <p className="fineprint">房源数据来自房天下移动端公开页面，点击标题查看原页；小区均价为参考值。</p>
    </div>
  )
}
