// ECharts 按需引入（折线 + 柱状，控制包体）
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, CanvasRenderer])
export { echarts }

// 大屏图表公共样式（深色玻璃）
export const chartBase = {
  textStyle: { color: '#8aa3b1', fontFamily: 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif' },
  tooltip: {
    backgroundColor: 'rgba(10, 22, 32, 0.92)',
    borderColor: 'rgba(255,255,255,0.12)',
    textStyle: { color: '#e6f1f5' },
  },
}
export const UP_COLOR = '#f87171' // 涨红
export const DOWN_COLOR = '#34d399' // 跌绿
export const SERIES_COLOR = '#2dd4bf' // 青绿主色
