// 城市均价趋势折线（数据随每日采集累积）
import { chartBase, SERIES_COLOR } from '../charts'
import { useChart } from '../useChart'

export function TrendChart({ points }: { points: [string, number][] }) {
  const ref = useChart(
    () => ({
      grid: { left: 48, right: 16, top: 24, bottom: 28 },
      xAxis: { type: 'category', data: points.map(([d]) => d.slice(5)), axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } } },
      yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
      series: [
        {
          type: 'line',
          data: points.map(([, v]) => v),
          smooth: true,
          symbolSize: 6,
          lineStyle: { color: SERIES_COLOR, width: 2 },
          itemStyle: { color: SERIES_COLOR },
          areaStyle: { color: 'rgba(45, 212, 191, 0.12)' },
        },
      ],
      tooltip: { ...chartBase.tooltip, trigger: 'axis' },
    }),
    [points],
  )
  return <div ref={ref} className="chart" role="img" aria-label="城市二手房均价趋势图" />
}
