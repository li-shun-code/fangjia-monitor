// 房源卡片：缩略图 + 户型/面积/朝向 + 总价/单价 + 标签；有相册可开灯箱
import { useState } from 'react'
import type { Listing } from '../types'
import { fmtWan } from '../data'
import { Lightbox } from './Lightbox'

const detailUrl = (h: Listing) => `https://m.fang.com/esf/cq/3_${h.houseid}.html`

export function HouseCard({ h }: { h: Listing }) {
  const [open, setOpen] = useState(false)
  const mainImg = h.album[0] || h.img
  return (
    <article className="house-card glass">
      <button type="button" className="house-img" onClick={() => h.album.length > 1 && setOpen(true)} disabled={h.album.length < 2}
        aria-label={h.album.length > 1 ? `打开 ${h.title} 相册（${h.album.length} 张）` : h.title}>
        <img src={mainImg} alt={h.title} loading="lazy" />
        {(h.vr || h.video) && (
          <span className="house-badges">
            {h.vr && <span className="badge">VR</span>}
            {h.video && <span className="badge">视频</span>}
          </span>
        )}
        {h.album.length > 1 && <span className="album-count">{h.album.length}图</span>}
      </button>
      <div className="house-body">
        <a className="house-title" href={detailUrl(h)} target="_blank" rel="noreferrer">{h.title}</a>
        <p className="house-specs">{[h.layout, h.areaSqm, h.facing].filter(Boolean).join(' · ')}</p>
        {h.tags.length > 0 && (
          <p className="house-tags">{h.tags.slice(0, 4).map((t) => <span key={t} className="tag">{t}</span>)}</p>
        )}
        <p className="house-price">
          <b className="price-main">{fmtWan(h.totalWan)}</b>
          <span className="price-unit">{h.unit ? `${h.unit}元/㎡` : ''}</span>
        </p>
      </div>
      {open && <Lightbox album={h.album} title={h.title} onClose={() => setOpen(false)} />}
    </article>
  )
}
