// 重庆房价监控采集器：房天下(城市/区/小区/二手房) + 链家(小区人气榜) → public/data/snapshot.json
// 运行：pnpm collect（全量约 950 请求 / 20 分钟）；COLLECT_LIMIT=2 冒烟（只采前 N 个区）
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import * as cheerio from 'cheerio'

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const DELAY_MS = 1300
const LISTINGS_CAP = 20 // 每小区存前 N 条房源
const LISTINGS_PER_DISTRICT = 8 // 每区抓房源的小区数上限（排行榜 up→down→hot 顺序）
const ALBUM_COMMUNITIES = 150 // 只给前 N 个有房源的小区抓首条房源相册（控制运行时长）
const POOL = 3 // 房源抓取并发车道（fang 移动端延迟高，串行太慢）
const LIMIT = Number(process.env.COLLECT_LIMIT || 0) // 0 = 不限

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const today = new Date().toISOString().slice(0, 10)

// ---- 抓取：按 content-type/meta charset 嗅探解码（fang 同站混用 GBK/UTF-8） ----
async function fetchPage(url, referer) {
  const headers = { 'user-agent': UA, accept: 'text/html' }
  if (referer) headers.referer = referer
  const res = await fetch(url, { headers, redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  let cs = /charset=([\w-]+)/.exec((res.headers.get('content-type') || '').toLowerCase())?.[1] ?? ''
  if (!cs) {
    const head = buf.subarray(0, 2048).toString('latin1')
    cs = /charset\s*=\s*["']?([\w-]+)/i.exec(head)?.[1] ?? ''
  }
  const decoder = /gb/i.test(cs) ? 'gb18030' : 'utf-8'
  return new TextDecoder(decoder).decode(buf)
}

const num = (s) => Number(String(s).replace(/[^\d.-]/g, ''))
const pctIn = (text) => num(/(-?[\d.]+)%/.exec(text)?.[1] ?? 0)

// 涨跌 class（jt-up-n / jt-dn[-n]）→ 带符号百分比
function signedDelta(cls, val) {
  const v = num(val)
  return /up/i.test(cls) ? Math.abs(v) : /dn|down/i.test(cls) ? -Math.abs(v) : v
}

// ---- 解析：城市页（37+ 区县块 + 城市头部均价） ----
function parseCity(html) {
  const headText = html.slice(0, html.indexOf('<div id="link'))
  const avgM = /二手房(\d{1,2})月均价<b>([\d.]+)元\/㎡/.exec(headText)
  const momM = /环比<b>(-?[\d.]+)%/.exec(headText)
  const yoyM = /同比<b>(-?[\d.]+)%/.exec(headText)
  const city = {
    avg: avgM ? num(avgM[2]) : null,
    month: avgM ? `${avgM[1]}月` : null,
    mom: momM ? num(momM[1]) : null,
    yoy: yoyM ? num(yoyM[1]) : null,
  }
  const $ = cheerio.load(html)
  const districts = []
  $('div[id^=link]').each((_, el) => {
    const block = $(el)
    const href = block.find('h3.title a').attr('href') || ''
    const did = num(/cq_list_(\d+)/.exec(href)?.[1] ?? '')
    const name = block.find('h3.title a span').clone().children().remove().end().text().trim()
    const prices = block.find('ul.text_sj li b').map((_, b) => num($(b).text())).get().filter((v) => v > 1000)
    const momEl = block.find('li span').filter((_, s) => /环比上月/.test($(s).text())).first()
    const yoyEl = block.find('li span').filter((_, s) => /同比去年/.test($(s).text())).first()
    const momSign = /下跌/.test(momEl.text()) ? -1 : 1
    const yoySign = /下跌/.test(yoyEl.text()) ? -1 : 1
    if (did && name && prices[0]) {
      districts.push({
        id: did, name, avg: prices[0], prevAvg: prices[1] ?? null,
        mom: momSign * Math.abs(pctIn(momEl.text())),
        yoy: yoySign * Math.abs(pctIn(yoyEl.text())),
      })
    }
  })
  return { city, districts }
}

// ---- 解析：区页（区参考均价 + 优质商圈 + 小区排行榜 3 tab） ----
function parseDistrict(html, did, name) {
  const $ = cheerio.load(html)
  const head = $('div.data-num.price').first()
  const headText = head.parent().text()
  const momCls = head.parent().find('span[class*=jt-]').attr('class') || ''
  const momVal = head.parent().find('span[class*=jt-]').text()
  const avg = num(head.find('i').first().text()) || null
  const month = /(\d{1,2})月参考均价/.exec(headText)?.[1] ?? null

  const areas = []
  $('ul.cfj-xqlist li').each((_, li) => {
    const a = $(li).find('a').first()
    const bid = num(/cq_list_\d+_(\d+)/.exec(a.attr('href') || '')?.[1] ?? '')
    const aname = a.find('h3').first().text().trim()
    const aavg = num(a.find('.price span').first().text())
    const amomCls = a.find('span[class*=jt-]').attr('class') || ''
    if (bid && aname && aavg) areas.push({ id: bid, name: aname, avg: aavg, mom: signedDelta(amomCls, a.find('span[class*=jt-]').text()) })
  })

  const TABS = ['up', 'down', 'hot']
  const communities = []
  $("div[class*='ranklist']").each((tabIdx, box) => {
    const tab = TABS[tabIdx] ?? 'other'
    $(box).find('li').each((_, li) => {
      const a = $(li).find('a').first()
      const xid = num(/xiaoqu\/cq\/(\d+)\.html/.exec(a.attr('href') || '')?.[1] ?? '')
      const cname = a.find('h3.lp').text().trim()
      const cavg = num(a.find('span.price i').first().text())
      const momCls = a.find('span[class*=jt-]').attr('class') || ''
      if (!xid || !cname) return
      const found = communities.find((c) => c.id === xid)
      if (found) { found.tabs.push(tab); return }
      communities.push({
        id: xid, name: cname, district: name, districtId: did, area: '',
        avg: cavg || null, mom: cavg ? signedDelta(momCls, a.find('span[class*=jt-] i').text()) : null,
        tabs: [tab],
      })
    })
  })
  return { avg, month, mom: avg ? signedDelta(momCls, momVal) : null, areas, communities }
}

// ---- 解析：链家人气小区榜（TOP30，补在售/在租/关注） ----
function parseLianjia(html) {
  const $ = cheerio.load(html)
  const rows = []
  $('div[class*=xiaoqu-card]').each((_, card) => {
    const el = $(card)
    const name = el.find('.title').text().trim()
    const desc = el.find('.desc').text().trim()
    const text = el.text()
    const href = el.find('a[href*=xiaoqu]').attr('href') || ''
    if (!name) return
    rows.push({
      name,
      area: desc.split('/')[0]?.trim() || '',
      sale: num(/在售(\d+)套/.exec(text)?.[1] ?? 0),
      rent: num(/在租(\d+)套/.exec(text)?.[1] ?? 0),
      avg: num(/([\d.]+)元\/平/.exec(text)?.[1] ?? 0) || null,
      followers: num(/(\d+)人已关注/.exec(text)?.[1] ?? 0),
      lianjiaId: /xiaoqu\/(\d+)/.exec(href)?.[1] ?? '',
    })
  })
  return rows
}

// ---- 解析：二手房列表（按小区 projcodes 过滤） ----
function parseEsfList(html) {
  const $ = cheerio.load(html)
  const houses = []
  $('li.listhouse').each((_, li) => {
    const el = $(li)
    const a = el.find('a.listtype').first()
    const houseid = num(/3_(\d+)\.html/.exec(a.attr('href') || '')?.[1] ?? '')
    const title = el.find('h3.line2').text().trim()
    const specs = el.find('.txt > p > span').map((_, s) => $(s).text().trim()).get()
    const img = el.find('img.lazy').attr('data-original') || ''
    if (!houseid || !title) return
    houses.push({
      houseid,
      title,
      areaSqm: specs[0] || '',
      layout: specs[1] || '',
      facing: specs[2] || '',
      community: specs[3] || '',
      totalWan: num(el.find('.price em').first().text()) || null,
      unit: num(/([\d.]+)/.exec(el.find('.del-price').text())?.[1] ?? 0) || null,
      img: img.startsWith('http') ? img : `https:${img}`,
      vr: el.find('.video_vr').length > 0,
      video: el.find('p.icon-new span.video').length > 0,
      tags: el.find('.stag span').map((_, s) => $(s).text().trim()).get().slice(0, 6),
      album: [],
    })
  })
  return houses.slice(0, LISTINGS_CAP)
}

// ---- 解析：房源详情相册（前 N 张 soufunimg 图） ----
function parseAlbum(html) {
  const imgs = [...html.matchAll(/(https?:)?\/\/[a-z0-9.\-]*soufunimg\.com[^"'\s)<>]+?\.(?:jpg|jpeg|png)/gi)].map((m) => (m[0].startsWith('http') ? m[0] : `https:${m[0]}`))
  return [...new Set(imgs)].slice(0, 12)
}

// ================= 主流程 =================
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a)

// 阶段1：城市页 → 城市行情 + 全部区县
log('抓取城市页 …')
const cityHtml = await fetchPage('https://m.fang.com/fangjia/cq/cityhouseprice.html')
const { city, districts } = parseCity(cityHtml)
if (!city.avg || districts.length === 0) {
  console.error('城市页解析失败：city =', city, 'districts =', districts.length)
  process.exit(1)
}
log(`城市均价 ${city.avg}（${city.month}，环比 ${city.mom}%），区县 ${districts.length} 个`)

// 阶段2：逐区页 → 区均价/商圈/小区榜
const distList = LIMIT > 0 ? districts.slice(0, LIMIT) : districts
const areaByDistrict = {}
const communities = new Map() // xid → community（含 tabs 去重）
for (const d of distList) {
  await sleep(DELAY_MS)
  try {
    const html = await fetchPage(`https://m.fang.com/fangjia/cq_list_${d.id}/`)
    const parsed = parseDistrict(html, d.id, d.name)
    d.avg = parsed.avg ?? d.avg
    d.month = parsed.month ?? city.month
    d.mom = parsed.mom ?? d.mom
    areaByDistrict[d.id] = parsed.areas
    // 商圈名回填到该区的小区（按名称包含匹配，宽松）
    parsed.communities.forEach((c) => {
      const exist = communities.get(c.id)
      if (exist) { exist.tabs = [...new Set([...exist.tabs, ...c.tabs])]; return }
      communities.set(c.id, c)
    })
    log(`区 ${d.name}(${d.id})：均价 ${d.avg}，商圈 ${parsed.areas.length}，小区榜 ${parsed.communities.length}`)
  } catch (e) {
    log(`区 ${d.name}(${d.id}) 失败，跳过：${e.message}`)
  }
}

// 阶段3：链家小区人气榜 → 补在售/在租/关注数（按名称模糊匹配 fang 小区）
let lianjiaRows = []
try {
  await sleep(DELAY_MS)
  lianjiaRows = parseLianjia(await fetchPage('https://m.lianjia.com/cq/bangdan/ibd3/'))
  log(`链家小区榜 ${lianjiaRows.length} 条`)
} catch (e) {
  log(`链家榜失败（不影响主数据）：${e.message}`)
}
for (const row of lianjiaRows) {
  const hit = [...communities.values()].find((c) => c.name === row.name || c.name.includes(row.name) || row.name.includes(c.name))
  if (hit) {
    hit.sale = row.sale; hit.rent = row.rent; hit.followers = row.followers
    if (!hit.area) hit.area = row.area
  } else {
    communities.set(`L${row.lianjiaId}`, {
      id: `L${row.lianjiaId}`, name: row.name, district: '', districtId: 0, area: row.area,
      avg: row.avg, mom: null, tabs: ['lianjia'], sale: row.sale, rent: row.rent, followers: row.followers,
    })
  }
}

// 阶段4：小区商圈回填（区页商圈名与小区名无直接关联，标记商圈为区页第一商圈 = 热门商圈近似；仅展示用）
// 说明：fang 区页小区榜不带商圈字段；链家匹配到的小区用链家商圈。其余留空。

// 阶段5：二手房房源（每区前 LISTINGS_PER_DISTRICT 个小区 + 链家 TOP30 中未覆盖的）
const order = [...communities.values()].sort((a, b) => (a.tabs.includes('up') ? 0 : 1) - (b.tabs.includes('up') ? 0 : 1))
const picked = []
const seenDistrictCount = new Map()
for (const c of order) {
  if (String(c.id).startsWith('L')) { picked.push(c); continue } // 链家补充小区直接尝试
  const n = seenDistrictCount.get(c.districtId) ?? 0
  if (n >= LISTINGS_PER_DISTRICT) continue
  seenDistrictCount.set(c.districtId, n + 1)
  picked.push(c)
}
const lianjiaExtra = lianjiaRows.slice(0, 30)
  .map((r) => `L${r.lianjiaId}`)
  .filter((id) => communities.has(id) && !picked.includes(communities.get(id)))
lianjiaExtra.forEach((id) => picked.push(communities.get(id)))

const listPick = LIMIT > 0 ? picked.slice(0, LIMIT * LISTINGS_PER_DISTRICT) : picked
log(`准备抓取 ${listPick.length} 个小区的房源 …`)
let okListings = 0
let albumBudget = ALBUM_COMMUNITIES
// 链家补充小区（id 带 L 前缀）没有 fang projcode：按名称搜索，并按房源卡片上的小区名字段过滤
const loose = (s) => String(s).replace(/[^\w]+/g, '')
const esfUrl = (c) =>
  String(c.id).startsWith('L')
    ? `https://m.fang.com/esf/cq/?keyword=${encodeURIComponent(c.name)}`
    : `https://m.fang.com/esf/cq/?projcodes=${c.id}`
// 阶段5+6：房源列表（POOL 车道并发）+ 首条房源相册（预算 ALBUM_COMMUNITIES 个小区）
let cursor = 0
await Promise.all(
  Array.from({ length: POOL }, async () => {
    while (cursor < listPick.length) {
      const c = listPick[cursor++]
      try {
        const html = await fetchPage(esfUrl(c))
        let listings = parseEsfList(html)
        if (String(c.id).startsWith('L')) {
          const key = loose(c.name)
          listings = listings.filter((h) => {
            const k = loose(h.community)
            return k && (k.includes(key) || key.includes(k))
          })
        }
        c.listings = listings
        okListings += listings.length
        if (c.listings.length > 0 && albumBudget > 0) {
          albumBudget--
          const h = c.listings[0]
          try {
            h.album = parseAlbum(await fetchPage(`https://m.fang.com/esf/cq/3_${h.houseid}.html`, `https://m.fang.com/esf/cq/?projcodes=${c.id}`))
          } catch { /* 相册失败留空 */ }
        }
        log(`小区 ${c.name}(${c.id})：房源 ${c.listings.length}`)
      } catch (e) {
        c.listings = []
        log(`小区 ${c.name}(${c.id}) 房源失败：${e.message}`)
      }
    }
  })
)

// 阶段7：组装 snapshot
const snapshot = {
  generatedAt: new Date().toISOString(),
  city,
  districts: distList.map((d) => ({ ...d, areas: areaByDistrict[d.id] ?? [] })),
  communities: [...communities.values()],
  counts: {
    districts: distList.length,
    communities: communities.size,
    listings: okListings,
  },
}
mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/snapshot.json', JSON.stringify(snapshot))

// 阶段8：历史追加（同日重跑覆盖当日）+ 快照归档
mkdirSync('data/snapshots', { recursive: true })
const historyPath = 'data/history.json'
let history = {}
if (existsSync(historyPath)) {
  try { history = JSON.parse(readFileSync(historyPath, 'utf8')) } catch { history = {} }
}
const districtPrices = {}
distList.forEach((d) => { districtPrices[d.name] = d.avg })
const communityPrices = {}
;[...communities.values()].forEach((c) => { communityPrices[c.id] = c.avg })
history[today] = {
  city: city.avg,
  cityMom: city.mom,
  districts: districtPrices,
  communities: communityPrices,
}
writeFileSync(historyPath, JSON.stringify(history))
writeFileSync(`data/snapshots/${today}.json`, JSON.stringify(snapshot))
log(`完成：snapshot.json（区 ${distList.length}，小区 ${communities.size}，房源 ${okListings}）；history ${Object.keys(history).length} 天`)
