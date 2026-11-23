// 总览视图：城市 KPI + 趋势 + 区排行 + 小区涨跌榜
import { historySeries, deltaClass, fmtPct, fmtPrice } from '../data'
import type { History, Snapshot } from '../types'
import { TrendChart } from '../components/TrendChart'
import { RankBars } from '../components/RankBars'

function BoardList({ title, rows }: { title: string; rows: { id: string; name: string; district: string; avg: number | null; mom: number | null }[] }) {
  return (
    <section className="card glass">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="empty">暂无数据</p>
      ) : (
        <ol className="board">
          {rows.map((c, i) => (
            <li key={c.id}>
              <a href={`#/community/${encodeURIComponent(c.id)}`}>
                <span className="rank">{i + 1}</span>
                <span className="name">{c.name}</span>
                <span className="dist">{c.district}</span>
                <span className="num">{c.avg ? c.avg.toLocaleString('zh-CN') : '—'}</span>
                <span className={`num ${deltaClass(c.mom)}`}>{fmtPct(c.mom)}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function Overview({ snap, history }: { snap: Snapshot; history: History }) {
  const { city } = snap
  const points = historySeries(history)
  const withMom = snap.communities.filter((c) => c.mom != null && c.mom !== 0)
  const up = [...withMom].sort((a, b) => (b.mom ?? 0) - (a.mom ?? 0)).slice(0, 10)
  const down = [...withMom].sort((a, b) => (a.mom ?? 0) - (b.mom ?? 0)).slice(0, 10)
  const updated = new Date(snap.generatedAt).toLocaleString('zh-CN', { hour12: false })
  return (
    <div className="view">
      <div className="kpi-row">
        <div className="kpi glass">
          <span className="kpi-label">重庆二手房均价（{city.month}）</span>
          <b className="kpi-value">{fmtPrice(city.avg)}</b>
        </div>
        <div className={`kpi glass ${deltaClass(city.mom)}`}>
          <span className="kpi-label">环比上月</span>
          <b className="kpi-value">{fmtPct(city.mom)}</b>
        </div>
        <div className={`kpi glass ${deltaClass(city.yoy)}`}>
          <span className="kpi-label">同比去年</span>
          <b className="kpi-value">{fmtPct(city.yoy)}</b>
        </div>
        <div className="kpi glass">
          <span className="kpi-label">数据更新</span>
          <b className="kpi-value small">{updated}</b>
        </div>
      </div>

      <section className="card glass">
        <h2>城市均价趋势</h2>
        {points.length >= 2 ? <TrendChart points={points} /> : (
          <p className="empty">趋势数据随每日自动采集累积，明天回来看曲线（当前 {points.length} 个数据点）</p>
        )}
      </section>

      <section className="card glass">
        <h2>各区县二手房均价排行</h2>
        <RankBars districts={snap.districts} />
      </section>

      <div className="board-row">
        <BoardList title="涨幅榜" rows={up.map((c) => ({ id: String(c.id), name: c.name, district: c.district, avg: c.avg, mom: c.mom }))} />
        <BoardList title="跌幅榜" rows={down.map((c) => ({ id: String(c.id), name: c.name, district: c.district, avg: c.avg, mom: c.mom }))} />
      </div>
    </div>
  )
}
