// 房源相册灯箱：键盘 ←/→/Esc，按钮翻页
import { useCallback, useEffect, useState } from 'react'

export function Lightbox({ album, title, onClose }: { album: string[]; title: string; onClose: () => void }) {
  const [idx, setIdx] = useState(0)
  const move = useCallback(
    (d: number) => setIdx((i) => (i + d + album.length) % album.length),
    [album.length],
  )
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') move(1)
      if (e.key === 'ArrowLeft') move(-1)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [move, onClose])
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${title} 相册`} onClick={onClose}>
      <img src={album[idx]} alt={`${title} 第 ${idx + 1} 张`} onClick={(e) => e.stopPropagation()} />
      <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => move(-1)} aria-label="上一张">‹</button>
        <span>{idx + 1} / {album.length}</span>
        <button type="button" onClick={() => move(1)} aria-label="下一张">›</button>
        <button type="button" className="close" onClick={onClose} aria-label="关闭">✕</button>
      </div>
    </div>
  )
}
