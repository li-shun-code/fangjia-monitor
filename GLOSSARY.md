# GLOSSARY

重庆房价监控大屏的领域词汇表。输出中提到这些概念时用这里的词，不要漂移到同义词。

## 数据实体

- **快照（snapshot）**：一次采集产出的全量数据文件 `public/data/snapshot.json`，含城市行情、全部区县、小区与房源。前端只读快照。
- **历史（history）**：`data/history.json`，按日期累积的城市/区县/小区均价序列。趋势图的唯一数据来源；同日重跑覆盖当日条目。
- **归档（archive）**：`data/snapshots/<日期>.json`，每天的快照留档。
- **城市行情（city）**：重庆全市二手房月均价 + 环比/同比。
- **区县（district）**：房天下口径的重庆区县（37 个，含远郊；江北/渝北并入两江新区等口径差异以房天下为准）。`did` 为房天下区县 id。
- **商圈（area）**：区页「优质商圈」列表条目，`bid` 为房天下商圈 id。区页小区榜不带商圈字段，小区的 `area` 仅链家匹配到时才有值。
- **小区（community）**：监控的最小聚合单位。房天下小区用数字 `xid`；仅来自链家榜的小区 id 带 `L` 前缀（无房天下 projcode）。
- **房源（listing）**：二手房挂牌，来自房天下移动端 `esf` 列表，每小区最多存 20 条。
- **相册（album）**：房源详情页抓到的图片直链（soufunimg），首条房源才抓，最多 12 张。外链直出，无 referer 限制。

## 涨跌口径

- **环比（mom）**：较上月百分比，带符号。
- **同比（yoy）**：较去年百分比，带符号。
- **涨红跌绿**：展示约定（A股惯例），`up`=红 `down`=绿，见 `src/data.ts#deltaClass`。

## 采集

- **采集器（collector）**：`scripts/collect.mjs`，Node + cheerio，抓房天下（城市/区/房源）+ 链家（小区人气榜）。城市页失败 fail-fast，其余 fail-soft。
- **冒烟采集（smoke collect）**：`COLLECT_LIMIT=2 pnpm collect`，只采前 2 个区，用于验证解析器。
- **每日 cron**：GitHub Actions 定时采集并提交新快照/历史，趋势因此逐日累积（不造数，不足 2 点显示空态）。
