# ADR-0002: 静态快照 + hash 路由 + 深色玻璃大屏

日期：2025-11-23
状态：已接受

## 背景

大屏需兼容移动端，部署目标是 Vercel（私有仓）。数据全部来自每日采集的静态 JSON，无后端。

## 决策

1. **纯静态前端**：React 19 + Vite + TypeScript + ECharts 5（按需注册 Line/Bar）。前端只 `fetch` `public/data/snapshot.json` 与 `data/history.json`，无任何 API 层。
2. **hash 路由**（`#/`、`#/district/<did>`、`#/community/<id>`）而非 history API：静态托管零配置（无 rewrite 规则），Vercel/任意静态服务器开箱即用。
3. **深色玻璃设计**：深青蓝底 `#0a1620` + 玻璃卡片（rgba 白 6-9% + backdrop-blur），青绿主色 #14B8A6；涨红跌绿（A股惯例）；系统中文字体栈 + 数字 `tabular-nums`；SVG 图标不用 emoji；断点 375/768/1024，响应式 Grid 重排（不用 scale hack）；尊重 `prefers-reduced-motion`、键盘焦点可见。
4. **设计 token**：检索产出存于 `design-system/fangjiamonitor/`（浅色原稿），实现版深色适配以 `src/styles.css` 为准——实现漂移时以 styles.css 为单一事实。

## 后果

- 前端零运行时依赖后端，私有仓 + Vercel 导入即部署。
- 数据更新依赖重新部署（Vercel 重构建）或 cron 直接提交触发自动部署；快照 JSON 本身不经过接口。
- ECharts 未代码分割，首包 gzip 约 250KB，对大屏可接受。
