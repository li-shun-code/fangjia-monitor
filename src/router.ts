// hash 路由：#/ | #/district/<id> | #/community/<id>
import { useEffect, useState } from 'react'

export type Route = { view: 'overview' } | { view: 'district'; id: number } | { view: 'community'; id: string }

export function parseHash(hash: string): Route {
  const m = /^#\/district\/(\d+)/.exec(hash)
  if (m) return { view: 'district', id: Number(m[1]) }
  const c = /^#\/community\/(.+)/.exec(hash)
  if (c) return { view: 'community', id: decodeURIComponent(c[1]) }
  return { view: 'overview' }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const go = (hash: string) => {
  location.hash = hash
}
