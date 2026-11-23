// 应用外壳：顶部导航 + hash 路由 + 数据加载态
import { useDashboardData } from './data'
import { useHashRoute } from './router'
import { Overview } from './views/Overview'
import { Locations } from './views/Locations'
import { Community } from './views/Community'

export function App() {
  const route = useHashRoute()
  const { snap, history, error } = useDashboardData()

  const nav = (
    <nav className="topnav" aria-label="主导航">
      <a className={route.view === 'overview' ? 'active' : ''} href="#/">总览</a>
      <a className={route.view === 'district' ? 'active' : ''} href="#/district/58">位置筛选</a>
    </nav>
  )

  let body
  if (error) body = <p className="empty">{error}</p>
  else if (!snap) body = <p className="empty" aria-live="polite">数据加载中 …</p>
  else if (route.view === 'community') body = <Community snap={snap} id={route.id} />
  else if (route.view === 'district') body = <Locations snap={snap} initDistrictId={route.id} />
  else body = <Overview snap={snap} history={history} />

  return (
    <div className="shell">
      <header className="topbar">
        <h1>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z" /></svg>
          重庆房价监控大屏
        </h1>
        {nav}
      </header>
      <main>{body}</main>
      <footer className="foot">数据每日自动采集 · 房天下/链家公开页面 · 仅供参考</footer>
    </div>
  )
}
