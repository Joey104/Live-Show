/**
 * @file RevenueAnalysisPage.tsx
 * @description 收益分析工作台（平台總覽、平台收益、主播排行、禮物銷售、直播拆分、功能清單）
 */

import { showAlert } from '../../lib/dialog'
import { useMemo, useState } from 'react'
import {
  LineChart,
  TrendingUp,
  Gift,
  Users,
  Video,
  BarChart3,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Types ────────────────────────────────────────────────────────────────────

type RevenueTabId = 'overview' | 'platform' | 'broadcasters' | 'gifts' | 'streams' | 'blueprint'

type PlatformRange = 'today' | 'week' | 'month'
type BroadcasterSort = 'gift' | 'net'
type BroadcasterRange = 'week' | 'month'
type GiftRange = 'today' | 'week' | 'month'

interface DailyRevenue {
  date: string
  giftIncome: number
  platformCut: number
  bonusCost: number
  netIncome: number
}

interface BroadcasterRow {
  rank: number
  name: string
  broadcasterId: string
  sessions: number
  giftIncome: number
  platformCut: number
  broadcasterNet: number
  platformSharePct: number
}

interface GiftSaleRow {
  rank: number
  emoji: string
  name: string
  type: string
  salesCount: number
  salesCoins: number
  salesPhp: number
  platformCut: number
  sharePct: number
}

interface StreamRow {
  streamId: string
  broadcasterName: string
  startTime: string
  durationMin: number
  giftIncome: number
  platformCut: number
  broadcasterNet: number
  bonusCost: number
  topGift: string
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function ts(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
}

function tsFull(offsetHours = 0) {
  const d = new Date(Date.now() - offsetHours * 3_600_000)
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Mock: Daily Revenue (14 days) ────────────────────────────────────────────

function mockDailyRevenue(): DailyRevenue[] {
  const rawGift = [42000, 38500, 51000, 47200, 55800, 39100, 62300, 44700, 48900, 53400, 36800, 60100, 57200, 49600]
  return rawGift.map((g, i) => {
    const cut = Math.round(g * 0.3)
    const bonus = Math.round(g * 0.05)
    return {
      date: ts(13 - i),
      giftIncome: g,
      platformCut: cut,
      bonusCost: bonus,
      netIncome: cut - bonus,
    }
  })
}

// ─── Mock: Platform Range Data ────────────────────────────────────────────────

const platformRangeData: Record<PlatformRange, { giftIncome: number; platformCut: number; bonusCost: number; netIncome: number }> = {
  today: { giftIncome: 49_600, platformCut: 14_880, bonusCost: 2_480, netIncome: 12_400 },
  week: { giftIncome: 312_500, platformCut: 93_750, bonusCost: 15_625, netIncome: 78_125 },
  month: { giftIncome: 1_248_000, platformCut: 374_400, bonusCost: 62_400, netIncome: 312_000 },
}

// ─── Mock: Broadcasters ───────────────────────────────────────────────────────

function mockBroadcasters(): BroadcasterRow[] {
  const data = [
    { name: 'Angel Rivera', id: 'BC-001', sessions: 28, gift: 185_400 },
    { name: 'Maria Santos', id: 'BC-002', sessions: 22, gift: 162_800 },
    { name: 'Joy Dela Cruz', id: 'BC-003', sessions: 31, gift: 147_200 },
    { name: 'Lovely Reyes', id: 'BC-004', sessions: 19, gift: 128_600 },
    { name: 'Kristine Lim', id: 'BC-005', sessions: 25, gift: 114_300 },
    { name: 'Sunshine Tan', id: 'BC-006', sessions: 17, gift: 98_700 },
    { name: 'Princess Go', id: 'BC-007', sessions: 21, gift: 87_500 },
    { name: 'Belle Aquino', id: 'BC-008', sessions: 14, gift: 74_200 },
    { name: 'Faith Garcia', id: 'BC-009', sessions: 18, gift: 61_800 },
    { name: 'Hope Mendoza', id: 'BC-010', sessions: 12, gift: 49_400 },
  ]
  const totalGift = data.reduce((s, d) => s + d.gift, 0)
  return data.map((d, i) => {
    const cut = Math.round(d.gift * 0.3)
    const bNet = Math.round(d.gift * 0.7)
    return {
      rank: i + 1,
      name: d.name,
      broadcasterId: d.id,
      sessions: d.sessions,
      giftIncome: d.gift,
      platformCut: cut,
      broadcasterNet: bNet,
      platformSharePct: Math.round((d.gift / totalGift) * 1000) / 10,
    }
  })
}

// ─── Mock: Gift Sales ─────────────────────────────────────────────────────────

function mockGiftSales(): GiftSaleRow[] {
  const gifts = [
    { emoji: '💎', name: 'Diamond Ring', type: '豪華', count: 342, coins: 85_500 },
    { emoji: '🌹', name: 'Rose Bouquet', type: '浪漫', count: 1_204, coins: 60_200 },
    { emoji: '🚀', name: 'Rocket', type: '動感', count: 567, coins: 42_525 },
    { emoji: '🎂', name: 'Birthday Cake', type: '節日', count: 889, coins: 35_560 },
    { emoji: '👑', name: 'Crown', type: '豪華', count: 223, coins: 27_875 },
    { emoji: '🦋', name: 'Butterfly', type: '浪漫', count: 1_560, coins: 23_400 },
    { emoji: '⚡', name: 'Thunder', type: '動感', count: 742, coins: 18_550 },
    { emoji: '🎁', name: 'Gift Box', type: '通用', count: 2_134, coins: 10_670 },
  ]
  const total = gifts.reduce((s, g) => s + g.coins, 0)
  return gifts.map((g, i) => {
    const php = Math.round(g.coins * 0.05)
    const cut = Math.round(php * 0.3)
    return {
      rank: i + 1,
      emoji: g.emoji,
      name: g.name,
      type: g.type,
      salesCount: g.count,
      salesCoins: g.coins,
      salesPhp: php,
      platformCut: cut,
      sharePct: Math.round((g.coins / total) * 1000) / 10,
    }
  })
}

// ─── Mock: Streams ────────────────────────────────────────────────────────────

function mockStreams(): StreamRow[] {
  const rows = [
    { id: 'STR-20260324-001', name: 'Angel Rivera', hoursAgo: 2, dur: 120, gift: 28_400, top: '💎 Diamond Ring' },
    { id: 'STR-20260324-002', name: 'Maria Santos', hoursAgo: 5, dur: 90, gift: 19_800, top: '🌹 Rose Bouquet' },
    { id: 'STR-20260324-003', name: 'Joy Dela Cruz', hoursAgo: 8, dur: 150, gift: 35_200, top: '🚀 Rocket' },
    { id: 'STR-20260323-001', name: 'Lovely Reyes', hoursAgo: 26, dur: 75, gift: 12_600, top: '🎂 Birthday Cake' },
    { id: 'STR-20260323-002', name: 'Kristine Lim', hoursAgo: 30, dur: 105, gift: 22_100, top: '👑 Crown' },
    { id: 'STR-20260323-003', name: 'Sunshine Tan', hoursAgo: 34, dur: 60, gift: 8_700, top: '🦋 Butterfly' },
    { id: 'STR-20260322-001', name: 'Princess Go', hoursAgo: 50, dur: 130, gift: 16_500, top: '⚡ Thunder' },
    { id: 'STR-20260322-002', name: 'Belle Aquino', hoursAgo: 55, dur: 85, gift: 11_200, top: '🎁 Gift Box' },
  ]
  return rows.map((r) => {
    const cut = Math.round(r.gift * 0.3)
    const bNet = Math.round(r.gift * 0.7)
    const bonus = Math.round(r.gift * 0.04)
    return {
      streamId: r.id,
      broadcasterName: r.name,
      startTime: tsFull(r.hoursAgo),
      durationMin: r.dur,
      giftIncome: r.gift,
      platformCut: cut,
      broadcasterNet: bNet,
      bonusCost: bonus,
      topGift: r.top,
    }
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function phpFmt(n: number) {
  return `₱${n.toLocaleString()}`
}

function rankBadge(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `${rank}`
}

const PIE_COLORS = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#60a5fa']

// ─── Blueprint features ───────────────────────────────────────────────────────

const blueprintFeatures: FeatureItem[] = [
  { id: 66, name: '平台總收益統計', description: '支援時間範圍切換，並拆分禮物收入 / 平台抽成 / Bonus 成本 / 淨收入。', tag: '總覽' },
  { id: 67, name: 'Top 10 主播排行', description: '依禮物收入或淨收入排行，支援排序與時間範圍切換，並連結到單人詳情。', tag: '排行' },
  { id: 68, name: '禮物銷售排行', description: '各禮物銷售量 / 金額的圓餅圖或條形圖，搭配時間與 Top N 選擇。', tag: '排行' },
  { id: 69, name: '直播收益拆分', description: '每場直播收益拆分為收入、平台抽成與 Bonus 成本，支援下鑽到交易明細。', tag: '拆分' },
  { id: 70, name: '收益趨勢圖（7日/30日切換）', description: '純 CSS bar chart 示意，7 根長條按天呈現收益趨勢，滑鼠懸停可見數值。', tag: '圖表' },
  { id: 71, name: 'Bonus 成本拆分視角', description: 'KPI 卡與明細表中明確顯示 Bonus 成本佔比，協助財務評估平台淨收益。', tag: '成本' },
  { id: 72, name: '禮物圓餅圖與佔比分析', description: '用 conic-gradient 實現簡易圓餅，前 5 禮物各佔比，搭配圖例。', tag: '圖表' },
  { id: 73, name: '主播收益水平比例 bar', description: '每位主播一條水平比例 bar，直觀呈現各主播佔平台收益比例。', tag: '圖表' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function RevenueAnalysisPage() {
  const [activeTab, setActiveTab] = useState<RevenueTabId>('overview')

  // Platform tab
  const [platformRange, setPlatformRange] = useState<PlatformRange>('month')
  const [platformPage, setPlatformPage] = useState(1)
  const pageSize = 5

  // Broadcasters tab
  const [broadcasterSort, setBroadcasterSort] = useState<BroadcasterSort>('gift')
  const [broadcasterRange, setBroadcasterRange] = useState<BroadcasterRange>('month')

  // Gifts tab
  const [giftRange, setGiftRange] = useState<GiftRange>('month')

  // Streams tab
  const [streamKeyword, setStreamKeyword] = useState('')
  const [streamPage, setStreamPage] = useState(1)

  // Static mock data
  const dailyRevenue = useMemo(() => mockDailyRevenue(), [])
  const allBroadcasters = useMemo(() => mockBroadcasters(), [])
  const allGifts = useMemo(() => mockGiftSales(), [])
  const allStreams = useMemo(() => mockStreams(), [])

  // Overview KPI
  const overviewKpi = useMemo(() => {
    const m = platformRangeData.month
    return {
      totalRevenue: m.giftIncome,
      giftIncome: m.giftIncome,
      platformCut: m.platformCut,
      bonusCost: m.bonusCost,
      netIncome: m.netIncome,
      todayGift: platformRangeData.today.giftIncome,
    }
  }, [])

  // Platform tab data
  const platformKpi = platformRangeData[platformRange]

  // 7-day bar chart data (last 7 from daily)
  const barData = useMemo(() => {
    const last7 = dailyRevenue.slice(-7)
    const maxVal = Math.max(...last7.map((d) => d.netIncome))
    return last7.map((d) => ({
      ...d,
      pct: maxVal > 0 ? Math.round((d.netIncome / maxVal) * 100) : 0,
    }))
  }, [dailyRevenue])

  // Paginated daily table
  const totalPlatformPages = Math.max(1, Math.ceil(dailyRevenue.length / pageSize))
  const paginatedDaily = useMemo(() => {
    const start = (platformPage - 1) * pageSize
    return [...dailyRevenue].reverse().slice(start, start + pageSize)
  }, [dailyRevenue, platformPage])

  // Sorted broadcasters
  const sortedBroadcasters = useMemo(() => {
    const list = [...allBroadcasters]
    if (broadcasterSort === 'gift') list.sort((a, b) => b.giftIncome - a.giftIncome)
    else list.sort((a, b) => b.broadcasterNet - a.broadcasterNet)
    return list.map((b, i) => ({ ...b, rank: i + 1 }))
  }, [allBroadcasters, broadcasterSort])

  const maxBroadcasterGift = sortedBroadcasters[0]?.giftIncome ?? 1

  // Top 5 broadcasters for sidebar cards
  const top5Broadcasters = sortedBroadcasters.slice(0, 5)

  // Filtered streams
  const filteredStreams = useMemo(() => {
    if (!streamKeyword.trim()) return allStreams
    const kw = streamKeyword.toLowerCase()
    return allStreams.filter(
      (s) =>
        s.broadcasterName.toLowerCase().includes(kw) ||
        s.streamId.toLowerCase().includes(kw),
    )
  }, [allStreams, streamKeyword])

  const totalStreamPages = Math.max(1, Math.ceil(filteredStreams.length / pageSize))
  const paginatedStreams = useMemo(() => {
    const start = (streamPage - 1) * pageSize
    return filteredStreams.slice(start, start + pageSize)
  }, [filteredStreams, streamPage])

  const maxStreamGift = allStreams.reduce((m, s) => Math.max(m, s.giftIncome), 1)

  // Gift pie data (top 5)
  const top5Gifts = allGifts.slice(0, 5)
  const top5Total = top5Gifts.reduce((s, g) => s + g.salesCoins, 0)
  const pieSegments = useMemo(() => {
    let angle = 0
    return top5Gifts.map((g, i) => {
      const pct = g.salesCoins / top5Total
      const deg = pct * 360
      const seg = { start: angle, end: angle + deg, color: PIE_COLORS[i], pct: Math.round(pct * 1000) / 10 }
      angle += deg
      return seg
    })
  }, [top5Gifts, top5Total])

  const conicGradient = useMemo(() => {
    const stops = pieSegments.map((s) => `${s.color} ${s.start.toFixed(1)}deg ${s.end.toFixed(1)}deg`)
    return `conic-gradient(${stops.join(', ')})`
  }, [pieSegments])


  return (
    <div className="space-y-4">
      {/* ── Sub tabs header ── */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <LineChart className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">收益分析</span>
          <span className="text-[10px] text-slate-500">
            平台收益 / 主播排行 / 禮物銷售 / 直播拆分，皆含 mock 資料示意。
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {(
            [
              { id: 'overview', label: '總覽', color: 'bg-slate-700' },
              { id: 'platform', label: '平台收益', color: 'bg-emerald-600' },
              { id: 'broadcasters', label: '主播排行', color: 'bg-amber-600' },
              { id: 'gifts', label: '禮物銷售', color: 'bg-rose-600' },
              { id: 'streams', label: '直播拆分', color: 'bg-sky-600' },
              { id: 'blueprint', label: '功能清單', color: 'bg-slate-700' },
            ] as { id: RevenueTabId; label: string; color: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'rounded-full px-2 py-0.5',
                activeTab === tab.id
                  ? `${tab.color} text-white`
                  : 'text-slate-200 hover:bg-slate-800/80',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Tab: 總覽
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">本月收益總覽</span>
            </div>
            <span className="text-[10px] text-slate-500">所有數字為 Mock 示意。</span>
          </header>

          {/* 6 KPI Cards */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-[11px]">
            <div className="rounded-xl border border-slate-600/60 bg-slate-500/10 p-3">
              <div className="text-slate-400 text-[10px]">本月平台總收益</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">{phpFmt(overviewKpi.totalRevenue)}</div>
              <div className="mt-0.5 text-[10px] text-slate-500">禮物收入 × 100%</div>
            </div>
            <div className="rounded-xl border border-emerald-600/60 bg-emerald-500/10 p-3">
              <div className="text-slate-400 text-[10px]">本月禮物收入</div>
              <div className="mt-1 text-lg font-semibold text-emerald-100">{phpFmt(overviewKpi.giftIncome)}</div>
              <div className="mt-0.5 text-[10px] text-emerald-300/70">全部禮物兌換金額</div>
            </div>
            <div className="rounded-xl border border-sky-600/60 bg-sky-500/10 p-3">
              <div className="text-slate-400 text-[10px]">本月平台抽成（30%）</div>
              <div className="mt-1 text-lg font-semibold text-sky-100">{phpFmt(overviewKpi.platformCut)}</div>
              <div className="mt-0.5 text-[10px] text-sky-300/70">禮物收入 × 30%</div>
            </div>
            <div className="rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="text-slate-400 text-[10px]">本月 Bonus 成本</div>
              <div className="mt-1 text-lg font-semibold text-rose-100">{phpFmt(overviewKpi.bonusCost)}</div>
              <div className="mt-0.5 text-[10px] text-rose-300/70">活動 / 任務 Bonus 發放成本</div>
            </div>
            <div className="rounded-xl border border-indigo-600/60 bg-indigo-500/10 p-3">
              <div className="text-slate-400 text-[10px]">本月淨收入</div>
              <div className="mt-1 text-lg font-semibold text-indigo-100">{phpFmt(overviewKpi.netIncome)}</div>
              <div className="mt-0.5 text-[10px] text-indigo-300/70">= 抽成 − Bonus 成本</div>
            </div>
            <div className="rounded-xl border border-amber-600/60 bg-amber-500/10 p-3">
              <div className="text-slate-400 text-[10px]">今日禮物收入</div>
              <div className="mt-1 text-lg font-semibold text-amber-100">{phpFmt(overviewKpi.todayGift)}</div>
              <div className="mt-0.5 text-[10px] text-amber-300/70">截至目前累計</div>
            </div>
          </div>

          {/* Formula block */}
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 text-[11px] text-slate-300">
            <span className="font-semibold text-slate-100">收益公式：</span>
            禮物總收入 × 抽成率（30%） − Bonus 成本 = 平台淨收入
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Tab: 平台收益
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'platform' && (
        <section className="space-y-3 rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold">平台收益</span>
            </div>
            {/* Time range toggle */}
            <div className="flex items-center gap-1 rounded-full border border-emerald-700/80 bg-slate-900/80 p-0.5">
              {(['today', 'week', 'month'] as PlatformRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPlatformRange(r)}
                  className={[
                    'rounded-full px-2 py-0.5 text-[10px]',
                    platformRange === r
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800/80',
                  ].join(' ')}
                >
                  {r === 'today' ? '今日' : r === 'week' ? '本週' : '本月'}
                </button>
              ))}
            </div>
          </header>

          {/* 4 KPI split cards */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-[11px]">
            <div className="rounded-xl border border-emerald-600/60 bg-emerald-500/10 p-3">
              <div className="text-[10px] text-slate-400">禮物總收入</div>
              <div className="mt-1 text-base font-semibold text-emerald-100">{phpFmt(platformKpi.giftIncome)}</div>
            </div>
            <div className="rounded-xl border border-sky-600/60 bg-sky-500/10 p-3">
              <div className="text-[10px] text-slate-400">平台抽成（30%）</div>
              <div className="mt-1 text-base font-semibold text-sky-100">{phpFmt(platformKpi.platformCut)}</div>
            </div>
            <div className="rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="text-[10px] text-slate-400">Bonus 成本</div>
              <div className="mt-1 text-base font-semibold text-rose-100">{phpFmt(platformKpi.bonusCost)}</div>
            </div>
            <div className="rounded-xl border border-indigo-600/60 bg-indigo-500/10 p-3">
              <div className="text-[10px] text-slate-400">淨收入</div>
              <div className="mt-1 text-base font-semibold text-indigo-100">{phpFmt(platformKpi.netIncome)}</div>
            </div>
          </div>

          {/* 7-day bar chart */}
          <div className="space-y-2 rounded-xl border border-emerald-600/60 bg-slate-950/80 p-3">
            <div className="text-[11px] font-semibold text-emerald-100">7 日淨收入趨勢（示意）</div>
            <div className="flex items-end gap-1" style={{ height: 120 }}>
              {barData.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    title={`${d.date}：淨收入 ${phpFmt(d.netIncome)}`}
                    className="w-full rounded-t bg-emerald-500/70 hover:bg-emerald-400 transition-all cursor-pointer"
                    style={{ height: `${Math.max(d.pct, 4)}%` }}
                  />
                  <span className="text-[9px] text-slate-400">{d.date}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-500">Y 軸：淨收入（PHP）· 滑鼠懸停查看數值</div>
          </div>

          {/* Daily revenue table */}
          <div className="overflow-hidden rounded-xl border border-emerald-600/60 bg-slate-950/80">
            <div className="border-b border-emerald-600/60 bg-slate-900/80 px-3 py-2 text-[11px] font-semibold text-emerald-100">
              收益明細（最近 14 天）
            </div>
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-emerald-100">
                <tr>
                  <th className="border-b border-emerald-600/60 px-3 py-2 text-left">日期</th>
                  <th className="border-b border-emerald-600/60 px-3 py-2 text-right">禮物收入</th>
                  <th className="border-b border-emerald-600/60 px-3 py-2 text-right">平台抽成</th>
                  <th className="border-b border-emerald-600/60 px-3 py-2 text-right">Bonus 成本</th>
                  <th className="border-b border-emerald-600/60 px-3 py-2 text-right">淨收入</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDaily.map((row) => (
                  <tr key={row.date} className="border-b border-emerald-600/30 text-emerald-50 last:border-b-0">
                    <td className="px-3 py-1.5">{row.date}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{phpFmt(row.giftIncome)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-sky-200">{phpFmt(row.platformCut)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-rose-200">{phpFmt(row.bonusCost)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-indigo-200 font-semibold">{phpFmt(row.netIncome)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-emerald-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>共 {dailyRevenue.length} 天 · 每頁 {pageSize} 筆</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={platformPage <= 1}
                  onClick={() => setPlatformPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" />上一頁
                </button>
                <span>第 {platformPage} / {totalPlatformPages} 頁</span>
                <button
                  type="button"
                  disabled={platformPage >= totalPlatformPages}
                  onClick={() => setPlatformPage((p) => Math.min(totalPlatformPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  下一頁<ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Tab: 主播排行
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'broadcasters' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">主播收益排行</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort toggle */}
              <div className="flex items-center gap-1 rounded-full border border-amber-700/80 bg-slate-900/80 p-0.5">
                {(['gift', 'net'] as BroadcasterSort[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBroadcasterSort(s)}
                    className={[
                      'rounded-full px-2 py-0.5 text-[10px]',
                      broadcasterSort === s
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800/80',
                    ].join(' ')}
                  >
                    {s === 'gift' ? '依禮物收入' : '依淨收入'}
                  </button>
                ))}
              </div>
              {/* Range toggle */}
              <div className="flex items-center gap-1 rounded-full border border-amber-700/80 bg-slate-900/80 p-0.5">
                {(['week', 'month'] as BroadcasterRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setBroadcasterRange(r)}
                    className={[
                      'rounded-full px-2 py-0.5 text-[10px]',
                      broadcasterRange === r
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800/80',
                    ].join(' ')}
                  >
                    {r === 'week' ? '本週' : '本月'}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Top 10 table */}
          <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-amber-100">
                <tr>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">排名</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">主播名稱</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">主播 ID</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-right">直播場次</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-right">禮物總收入</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-right">平台抽成</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-right">主播淨收入</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-right">佔平台比</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedBroadcasters.map((b) => (
                  <tr key={b.broadcasterId} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-base">{rankBadge(b.rank)}</td>
                    <td className="px-2 py-1.5 font-medium">{b.name}</td>
                    <td className="px-2 py-1.5 text-[10px] text-amber-200/70">{b.broadcasterId}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{b.sessions}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{phpFmt(b.giftIncome)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-sky-200">{phpFmt(b.platformCut)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-200">{phpFmt(b.broadcasterNet)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{b.platformSharePct}%</td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={async () =>
                          await showAlert(
                            `示意：開啟主播「${b.name}」（${b.broadcasterId}）的收益詳情頁面。\n\n本月禮物收入：${phpFmt(b.giftIncome)}\n主播淨收入：${phpFmt(b.broadcasterNet)}`,
                          )
                        }
                        className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/25 px-2 py-0.5 text-[10px] text-amber-50 hover:bg-amber-500/40"
                      >
                        <Eye className="h-3 w-3" />
                        詳情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Horizontal proportion bars */}
          <div className="space-y-2 rounded-xl border border-amber-600/60 bg-slate-950/80 p-3">
            <div className="text-[11px] font-semibold text-amber-100">主播收益佔比（水平比例 bar）</div>
            {sortedBroadcasters.map((b) => {
              const pct = Math.round((b.giftIncome / maxBroadcasterGift) * 100)
              return (
                <div key={b.broadcasterId} className="flex items-center gap-2 text-[10px]">
                  <span className="w-24 shrink-0 truncate text-amber-100">{b.name}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-slate-800/80" style={{ height: 8 }}>
                    <div
                      className="h-full rounded-full bg-amber-500/70"
                      style={{ width: `${pct}%` }}
                      title={`${phpFmt(b.giftIncome)} (${b.platformSharePct}%)`}
                    />
                  </div>
                  <span className="w-16 text-right tabular-nums text-slate-400">{b.platformSharePct}%</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Tab: 禮物銷售
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'gifts' && (
        <section className="space-y-3 rounded-2xl border border-rose-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold">禮物銷售排行</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-rose-700/80 bg-slate-900/80 p-0.5">
              {(['today', 'week', 'month'] as GiftRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setGiftRange(r)}
                  className={[
                    'rounded-full px-2 py-0.5 text-[10px]',
                    giftRange === r
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800/80',
                  ].join(' ')}
                >
                  {r === 'today' ? '今日' : r === 'week' ? '本週' : '本月'}
                </button>
              ))}
            </div>
          </header>

          {/* Sales table */}
          <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-rose-100">
                <tr>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">排名</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">Emoji</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">禮物名稱</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">類型</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">銷售次數</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">金額(Coins)</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">換算(PHP)</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">平台抽成</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">佔比(%)</th>
                </tr>
              </thead>
              <tbody>
                {allGifts.map((g) => (
                  <tr key={g.name} className="border-b border-rose-600/30 text-rose-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-base">{rankBadge(g.rank)}</td>
                    <td className="px-2 py-1.5 text-base">{g.emoji}</td>
                    <td className="px-2 py-1.5 font-medium">{g.name}</td>
                    <td className="px-2 py-1.5">
                      <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-200">
                        {g.type}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{g.salesCount.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{g.salesCoins.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{phpFmt(g.salesPhp)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-sky-200">{phpFmt(g.platformCut)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{g.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pie chart + legend */}
          <div className="flex flex-wrap items-start gap-4 rounded-xl border border-rose-600/60 bg-slate-950/80 p-4">
            {/* Conic-gradient pie */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-[11px] font-semibold text-rose-100">Top 5 禮物佔比（圓餅示意）</div>
              <div
                className="rounded-full"
                style={{
                  width: 120,
                  height: 120,
                  background: conicGradient,
                }}
              />
            </div>
            {/* Legend */}
            <div className="flex flex-1 flex-col gap-1.5 text-[11px]">
              <div className="font-semibold text-rose-100">圖例</div>
              {top5Gifts.map((g, i) => (
                <div key={g.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm shrink-0" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-slate-300">
                    {g.emoji} {g.name}
                  </span>
                  <span className="ml-auto text-slate-400 tabular-nums">{g.sharePct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7-day trend bars per gift */}
          <div className="space-y-2 rounded-xl border border-rose-600/60 bg-slate-950/80 p-3">
            <div className="text-[11px] font-semibold text-rose-100">各禮物本週銷售佔比（水平比例 bar）</div>
            {allGifts.map((g) => {
              const maxCoins = allGifts[0].salesCoins
              const pct = Math.round((g.salesCoins / maxCoins) * 100)
              return (
                <div key={g.name} className="flex items-center gap-2 text-[10px]">
                  <span className="w-4">{g.emoji}</span>
                  <span className="w-28 shrink-0 truncate text-rose-100">{g.name}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-slate-800/80" style={{ height: 8 }}>
                    <div
                      className="h-full rounded-full bg-rose-500/70"
                      style={{ width: `${pct}%` }}
                      title={`${g.salesCoins.toLocaleString()} Coins (${g.sharePct}%)`}
                    />
                  </div>
                  <span className="w-12 text-right tabular-nums text-slate-400">{g.sharePct}%</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Tab: 直播拆分
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'streams' && (
        <section className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">直播收益拆分</span>
            </div>
          </header>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="flex min-w-[220px] flex-1 items-center gap-1 rounded-full border border-sky-700/80 bg-slate-900/80 px-2 py-1">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={streamKeyword}
                onChange={(e) => {
                  setStreamKeyword(e.target.value)
                  setStreamPage(1)
                }}
                placeholder="主播名稱 / 直播 ID"
                className="h-6 flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Top 5 broadcaster cards */}
          <div className="space-y-2 rounded-xl border border-sky-600/60 bg-slate-950/80 p-3">
            <div className="text-[11px] font-semibold text-sky-100">主播收益排行 Top 5</div>
            {top5Broadcasters.map((b) => {
              const pct = Math.round((b.giftIncome / maxBroadcasterGift) * 100)
              return (
                <div key={b.broadcasterId} className="flex items-center gap-2 rounded-lg border border-sky-600/40 bg-sky-500/10 p-2 text-[10px]">
                  <span className="text-base">{rankBadge(b.rank)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sky-100">{b.name}</div>
                    <div className="mt-0.5 overflow-hidden rounded-full bg-slate-800/80" style={{ height: 6 }}>
                      <div className="h-full rounded-full bg-sky-500/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="tabular-nums text-slate-300">{phpFmt(b.giftIncome)}</span>
                </div>
              )
            })}
          </div>

          {/* Stream detail table */}
          <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-sky-100">
                <tr>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">直播 ID</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">主播</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">開始時間</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-right">時長(分)</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-right">禮物收入</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-right">平台抽成</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-right">主播淨收入</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-right">Bonus 成本</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">最高禮物</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStreams.map((s) => (
                  <tr key={s.streamId} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-[10px] text-sky-200/70">{s.streamId}</td>
                    <td className="px-2 py-1.5 font-medium">{s.broadcasterName}</td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-400">{s.startTime}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{s.durationMin}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{phpFmt(s.giftIncome)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-sky-200">{phpFmt(s.platformCut)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-200">{phpFmt(s.broadcasterNet)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-rose-200">{phpFmt(s.bonusCost)}</td>
                    <td className="px-2 py-1.5 text-[10px]">{s.topGift}</td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={async () =>
                          await showAlert(
                            `示意：開啟直播「${s.streamId}」的詳細收益明細。\n\n主播：${s.broadcasterName}\n禮物收入：${phpFmt(s.giftIncome)}\n平台抽成：${phpFmt(s.platformCut)}\n主播淨收入：${phpFmt(s.broadcasterNet)}\nBonus 成本：${phpFmt(s.bonusCost)}`,
                          )
                        }
                        className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/25 px-2 py-0.5 text-[10px] text-sky-50 hover:bg-sky-500/40"
                      >
                        <Eye className="h-3 w-3" />
                        詳情
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedStreams.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-[11px] text-sky-100/60">
                      沒有符合條件的直播記錄。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-sky-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>共 {filteredStreams.length} 筆 · 每頁 {pageSize} 筆</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={streamPage <= 1}
                  onClick={() => setStreamPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" />上一頁
                </button>
                <span>第 {streamPage} / {totalStreamPages} 頁</span>
                <button
                  type="button"
                  disabled={streamPage >= totalStreamPages}
                  onClick={() => setStreamPage((p) => Math.min(totalStreamPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  下一頁<ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Tab: 功能清單
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="收益分析功能清單"
          subtitle="面向財務與運營的核心收益視角，含圖表示意與各維度下鑽。"
          items={blueprintFeatures}
        />
      )}
    </div>
  )
}

export default RevenueAnalysisPage
