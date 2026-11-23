// 图表挂载 hook：容器尺寸变化自适应，卸载销毁
import { useEffect, useRef } from 'react'
import { echarts, chartBase } from './charts'

export function useChart(build: (ec: typeof echarts) => echarts.EChartsCoreOption, deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const inst = echarts.init(ref.current)
    inst.setOption({ ...chartBase, ...build(echarts) })
    const ro = new ResizeObserver(() => inst.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      inst.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}
