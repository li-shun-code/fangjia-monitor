# fangjia-monitor · 重庆房价监控大屏

区县级 + 小区级的重庆二手房监控大屏，兼容移动端。每日自动采集公开页面数据，趋势随时间累积。

## 功能

- **总览**：城市月均价/环比/同比、趋势折线（随采集累积）、37 区县均价排行（涨红跌绿）、小区涨幅/跌幅榜。
- **位置筛选**：区县 → 商圈级联 + 小区名搜索，小区卡片（均价/环比/在售/关注）。
- **小区详情**：小区 KPI + 在售二手房卡片（户型/面积/朝向/总价/单价/VR/视频/标签），相册灯箱翻页，外链房源原页。

## 数据来源（均为公开页面，免费无 key）

| 内容 | 来源 |
| --- | --- |
| 城市月均价、区县均价/环比/同比 | 房天下移动端房价地图 |
| 商圈、小区涨跌/热搜榜 | 房天下区页 |
| 小区在售/在租/关注度（TOP30 人气榜） | 链家移动端人气小区榜 |
| 二手房房源、相册图片 | 房天下移动端二手房（按小区过滤） |

安居客（antibot）与链家 PC 端（验证码）不可用，已弃用；详见 `docs/adr/0001-fang-main-source.md`。

## 架构

- `scripts/collect.mjs`：Node + cheerio 采集器 → 归一化 → `public/data/snapshot.json`（前端只读）；均价追加进 `data/history.json`（同日覆盖），并归档 `data/snapshots/<日期>.json`。
- `src/`：React 19 + Vite + TypeScript + ECharts 5（按需注册），hash 路由，深色玻璃主题（`src/styles.css` 为设计单一事实）。
- `.github/workflows/collect.yml`：每日北京时间 05:00 cron 采集并提交；提交可触发 Vercel 自动重新部署。
- 趋势不造数：少于 2 个数据点时显示空态提示。

## 本地开发

```bash
pnpm install
pnpm dev        # 开发服务器
pnpm build      # tsc --noEmit && vite build
pnpm collect    # 全量采集（约 950 请求）
COLLECT_LIMIT=2 pnpm collect   # 冒烟：只采前 2 个区
```

## 部署（Vercel）

1. GitHub 导入本仓库（私有仓，Framework Preset 选 **Vite**）。
2. 构建命令 `pnpm build`，输出目录 `dist`（默认即可）。
3. 每日采集 workflow 提交新快照后自动触发重新部署。

## 已知限制

- 链家 TOP30 中未被房天下区榜覆盖的小区（id 带 `L` 前缀）无房天下房源明细，仅展示链家 KPI。
- 房源图片为 soufunimg 外链直出；若站方收紧防盗链需转存。
- 采集为礼貌性爬取（UA/延迟/并发 3），仅供个人参考，不含商业用途。

## 词汇表与决策记录

- `GLOSSARY.md`：快照/历史/区县/商圈/小区/房源等术语口径。
- `docs/adr/`：数据源与架构决策。
