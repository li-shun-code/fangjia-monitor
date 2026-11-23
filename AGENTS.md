# AGENTS.md

重庆房价监控大屏（fangjia-monitor）。React 19 + Vite + TS + ECharts 前端，Node 采集器（房天下 + 链家公开页面），GitHub Actions 每日采集，静态快照驱动。

## 约定

- 术语口径见 `GLOSSARY.md`（快照/历史/区县/商圈/小区/房源）；架构决策见 `docs/adr/`，与之冲突需先显式说明。
- 设计单一事实是 `src/styles.css`（深色玻璃：底 #0a1620、主色 #14B8A6、涨红跌绿、系统中文字体栈 + tabular-nums）；`design-system/` 是检索留档。
- 数据链路：`scripts/collect.mjs` → `public/data/snapshot.json` + `data/history.json`。改解析器先跑 `COLLECT_LIMIT=2 pnpm collect` 冒烟校准，再全量。
- fang 页面 charset 混用（fangjia=UTF-8、esf=GBK）：解析一律走 `fetchPage` 的 charset 嗅探，不要 `res.text()`。
- 采集礼貌规则：UA、页间延迟、房源并发 ≤3，链家补充小区（`L` 前缀 id）用 `?keyword=` + 小区名字段过滤，不要 `?projcodes=L<id>`。
- 趋势数据只来自 `data/history.json` 累积，少于 2 点显示空态，禁止造数。
- `data/` 与 `public/data/` 是采集产物，必须提交（趋势靠 git 累积）；`.tmp/` 是一次性探针，不提交。

## Agent skills

### Issue tracker

GitHub issues，全部通过 `gh` CLI 操作，约定见 `docs/agents/issue-tracker.md`。PRs 不作为需求分流入口。

### Domain docs

探索代码前先读根目录 `GLOSSARY.md` 与 `docs/adr/`，规则见 `docs/agents/domain.md`。单上下文仓库（无 GLOSSARY-MAP）。
