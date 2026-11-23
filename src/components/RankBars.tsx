// 区均价排行横向柱状（按环比涨跌着色：涨红跌绿）；导航走区列表，不依赖图内点击
import { DOWN_COLOR, SERIES_COLOR, UP_COLOR } from '../charts'
import { useChart } from '../useChart'
import type { District } from '../types'

export function RankBars({ districts }: { districts: District[] }) {
  const sorted = [...districts].sort((a, b) => b.avg - a.avg)
  const ref = useChart(
    () => ({
      grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
      yAxis: {
        type: 'category',
        data: sorted.map((d) => d.name),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
        axisLabel: { color: '#c9dae4' },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((d) => ({
            value: d.avg,
            itemStyle: { color: (d.mom ?? 0) > 0 ? UP_COLOR : (d.mom ?? 0) < 0 ? DOWN_COLOR : SERIES_COLOR, borderRadius: [0, 4, 4, 0], opacity: 0.85 },
          })),
          barMaxWidth: 14,
          label: { show: true, position: 'right', color: '#8aa3b1', formatter: (p: { value: number }) => p.value.toLocaleString('zh-CN') },
        },
      ],
      tooltip: { trigger: 'item', formatter: (p: { name: string; value: number }) => `${p.name}：${p.value.toLocaleString('zh-CN')}元/㎡` },
    }),
    [districts],
  )
  return <div ref={ref} className="chart tall" role="img" aria-label="各区二手房均价排行" />
}
