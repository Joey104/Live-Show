/**
 * @file PredictionMarketPage.tsx
 * @description 預測市場管理工作台
 * 子模組：總覽 / 市場列表 / 押注記錄 / 強制結算工作台 / 功能清單
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showAlert, showConfirm, showPrompt } from '../../lib/dialog'
import {
  TrendingUp, BarChart3, List, Gavel, ListChecks,
  CheckCircle2, XCircle, AlertTriangle, Clock, Eye,
  ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Types ────────────────────────────────────────────────────────────────────

type PredictionTabId = 'overview' | 'markets' | 'bets' | 'settlement' | 'blueprint'

type MarketStatus = 'open' | 'closed' | 'settled' | 'cancelled'
type BetStatus = 'pending' | 'won' | 'lost' | 'refunded'
type BetChoice = 'yes' | 'no'

interface PredictionMarket {
  id: string
  title: string
  description: string
  yesAmount: number
  noAmount: number
  yesBettors: number
  noBettors: number
  status: MarketStatus
  createdAt: string
  settleAt?: string
  settledAt?: string
  winner?: BetChoice
  settledTotal?: number
}

interface BetRecord {
  id: string
  marketId: string
  marketTitle: string
  username: string
  userId: string
  choice: BetChoice
  amount: number
  status: BetStatus
  betAt: string
  settledAt?: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function mockMarkets(): PredictionMarket[] {
  return [
    {
      id: 'MKT-001', title: '本場直播 Alice 能否連贏 5 局？', description: '預測主播 Alice 本場直播中是否能連續贏得 5 局遊戲。結算以直播結束時最終記錄為準。',
      yesAmount: 12500, noAmount: 8300, yesBettors: 45, noBettors: 32,
      status: 'open', createdAt: '2026-03-24 14:00', settleAt: '2026-03-24 22:00',
    },
    {
      id: 'MKT-002', title: '今日總充值是否突破 100 萬？', description: '預測今日平台整體充值金額是否超過 100 萬點，以 23:59 結算時間點為準。',
      yesAmount: 22000, noAmount: 31500, yesBettors: 78, noBettors: 102,
      status: 'open', createdAt: '2026-03-24 10:00', settleAt: '2026-03-24 23:59',
    },
    {
      id: 'MKT-003', title: '主播 Bob 本週上播天數 ≥ 5 天？', description: '預測主播 Bob 本週（週一至週日）是否上播 5 天以上（含 5 天）。',
      yesAmount: 9800, noAmount: 6200, yesBettors: 35, noBettors: 28,
      status: 'closed', createdAt: '2026-03-18 09:00', settleAt: '2026-03-24 23:59',
    },
    {
      id: 'MKT-004', title: '新遊戲上線首日同時在線人數破 1000？', description: '新遊戲「SuperSlot」上線首日（2026-03-20）最高同時在線人數是否超過 1000 人。',
      yesAmount: 15600, noAmount: 9400, yesBettors: 56, noBettors: 41,
      status: 'settled', createdAt: '2026-03-19 12:00', settleAt: '2026-03-20 23:59',
      settledAt: '2026-03-21 00:15', winner: 'yes', settledTotal: 23400,
    },
    {
      id: 'MKT-005', title: '主播 Carol 本場下注金額破 5 萬？', description: '預測主播 Carol 本場直播中玩家下注總金額是否超過 5 萬點。',
      yesAmount: 4200, noAmount: 3100, yesBettors: 15, noBettors: 12,
      status: 'cancelled', createdAt: '2026-03-22 16:00', settleAt: '2026-03-22 20:00',
    },
  ]
}

function mockBets(): BetRecord[] {
  return [
    { id: 'BET-001', marketId: 'MKT-001', marketTitle: '本場直播 Alice 能否連贏 5 局？', username: 'player_tom', userId: '10001', choice: 'yes', amount: 500, status: 'pending', betAt: '2026-03-24 14:05' },
    { id: 'BET-002', marketId: 'MKT-001', marketTitle: '本場直播 Alice 能否連贏 5 局？', username: 'user_jay', userId: '10002', choice: 'no', amount: 300, status: 'pending', betAt: '2026-03-24 14:10' },
    { id: 'BET-003', marketId: 'MKT-002', marketTitle: '今日總充值是否突破 100 萬？', username: 'player_tom', userId: '10001', choice: 'no', amount: 1000, status: 'pending', betAt: '2026-03-24 10:15' },
    { id: 'BET-004', marketId: 'MKT-003', marketTitle: '主播 Bob 本週上播天數 ≥ 5 天？', username: 'whale_99', userId: '10003', choice: 'yes', amount: 2000, status: 'pending', betAt: '2026-03-18 09:30' },
    { id: 'BET-005', marketId: 'MKT-004', marketTitle: '新遊戲上線首日同時在線人數破 1000？', username: 'user_jay', userId: '10002', choice: 'yes', amount: 800, status: 'won', betAt: '2026-03-19 12:30', settledAt: '2026-03-21 00:15' },
    { id: 'BET-006', marketId: 'MKT-004', marketTitle: '新遊戲上線首日同時在線人數破 1000？', username: 'newbie_01', userId: '10004', choice: 'no', amount: 400, status: 'lost', betAt: '2026-03-19 13:00', settledAt: '2026-03-21 00:15' },
    { id: 'BET-007', marketId: 'MKT-005', marketTitle: '主播 Carol 本場下注金額破 5 萬？', username: 'whale_99', userId: '10003', choice: 'yes', amount: 600, status: 'refunded', betAt: '2026-03-22 16:15', settledAt: '2026-03-22 20:05' },
    { id: 'BET-008', marketId: 'MKT-002', marketTitle: '今日總充值是否突破 100 萬？', username: 'newbie_01', userId: '10004', choice: 'yes', amount: 200, status: 'pending', betAt: '2026-03-24 11:00' },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const marketStatusLabel: Record<MarketStatus, string> = {
  open: '進行中', closed: '已關閉', settled: '已結算', cancelled: '已取消',
}
const marketStatusBadge: Record<MarketStatus, string> = {
  open: 'bg-emerald-500/30 text-emerald-50',
  closed: 'bg-amber-500/30 text-amber-50',
  settled: 'bg-sky-500/30 text-sky-50',
  cancelled: 'bg-slate-600/40 text-slate-100',
}
const betStatusLabel: Record<BetStatus, string> = {
  pending: '待結算', won: '獲勝', lost: '落敗', refunded: '已退款',
}
const betStatusBadge: Record<BetStatus, string> = {
  pending: 'bg-amber-500/30 text-amber-50',
  won: 'bg-emerald-500/30 text-emerald-50',
  lost: 'bg-rose-500/40 text-rose-50',
  refunded: 'bg-slate-600/40 text-slate-100',
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PredictionMarketPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<PredictionTabId>('overview')
  const [markets, setMarkets] = useState<PredictionMarket[]>(mockMarkets)
  const [bets, setBets] = useState<BetRecord[]>(mockBets)

  // Market list state
  const [marketStatusFilter, setMarketStatusFilter] = useState<'all' | MarketStatus>('all')
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null)

  // Bets state
  const [betStatusFilter, setBetStatusFilter] = useState<'all' | BetStatus>('all')
  const [betMarketFilter, setBetMarketFilter] = useState<string>('all')
  const [betPage, setBetPage] = useState(1)
  const BET_PAGE_SIZE = 5

  const filteredMarkets = useMemo(() =>
    marketStatusFilter === 'all' ? markets : markets.filter(m => m.status === marketStatusFilter),
    [markets, marketStatusFilter])

  const filteredBets = useMemo(() => bets.filter(b => {
    if (betStatusFilter !== 'all' && b.status !== betStatusFilter) return false
    if (betMarketFilter !== 'all' && b.marketId !== betMarketFilter) return false
    return true
  }), [bets, betStatusFilter, betMarketFilter])

  const betTotalPages = Math.max(1, Math.ceil(filteredBets.length / BET_PAGE_SIZE))
  const pagedBets = useMemo(() => {
    const start = (betPage - 1) * BET_PAGE_SIZE
    return filteredBets.slice(start, start + BET_PAGE_SIZE)
  }, [filteredBets, betPage])

  const settlableMarkets = useMemo(() =>
    markets.filter(m => m.status === 'open' || m.status === 'closed'),
    [markets])

  const overview = useMemo(() => {
    const open = markets.filter(m => m.status === 'open').length
    const todayCreated = markets.filter(m => m.createdAt.startsWith('2026-03-24')).length
    const totalBetAmount = markets.reduce((s, m) => s + m.yesAmount + m.noAmount, 0)
    const pending = markets.filter(m => m.status === 'open' || m.status === 'closed').length
    const monthSettled = markets.filter(m => m.status === 'settled').reduce((s, m) => s + (m.settledTotal ?? 0), 0)
    return { open, todayCreated, totalBetAmount, pending, monthSettled }
  }, [markets])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleForceSettle(market: PredictionMarket, fromDrawer = false) {
    const yesTotal = market.yesAmount
    const noTotal = market.noAmount
    const winner = await showPrompt(
      `強制結算市場「${market.title}」\n\n` +
      `YES 押注：${yesTotal.toLocaleString()} 點（${market.yesBettors} 人）\n` +
      `NO 押注：${noTotal.toLocaleString()} 點（${market.noBettors} 人）\n\n` +
      `請輸入勝者（yes 或 no）：`,
      ''
    )
    if (winner === null) return
    const w = winner.trim().toLowerCase()
    if (w !== 'yes' && w !== 'no') {
      await showAlert('請輸入有效的勝者（yes 或 no）。')
      return
    }
    const winnerChoice = w as BetChoice
    const winnerBettors = winnerChoice === 'yes' ? market.yesBettors : market.noBettors
    const totalPool = market.yesAmount + market.noAmount
    const ok = await showConfirm(
      `⚠️ 高風險操作確認\n\n` +
      `市場：${market.title}\n` +
      `選擇勝者：${winnerChoice.toUpperCase()}\n` +
      `將發放 ${totalPool.toLocaleString()} 點給 ${winnerBettors} 名獲勝者\n\n` +
      `此操作不可回復，確認執行強制結算？`
    )
    if (!ok) return
    const now = new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    setMarkets(prev => prev.map(m => m.id === market.id
      ? { ...m, status: 'settled', settledAt: now, winner: winnerChoice, settledTotal: totalPool }
      : m))
    setBets(prev => prev.map(b => {
      if (b.marketId !== market.id) return b
      if (b.status !== 'pending') return b
      return { ...b, status: b.choice === winnerChoice ? 'won' : 'lost', settledAt: now }
    }))
    if (fromDrawer) setSelectedMarket(null)
    await showAlert(`已完成強制結算！\n市場：${market.title}\n勝者：${winnerChoice.toUpperCase()}\n發放總額：${totalPool.toLocaleString()} 點`)
  }

  async function handleCancelMarket(market: PredictionMarket, fromDrawer = false) {
    const ok = await showConfirm(
      `確認取消市場「${market.title}」嗎？\n\n取消後所有押注將自動退款，此操作不可回復。`
    )
    if (!ok) return
    const now = new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    setMarkets(prev => prev.map(m => m.id === market.id ? { ...m, status: 'cancelled' } : m))
    setBets(prev => prev.map(b => b.marketId === market.id && b.status === 'pending'
      ? { ...b, status: 'refunded', settledAt: now }
      : b))
    if (fromDrawer) setSelectedMarket(null)
    await showAlert(`已取消市場「${market.title}」，所有押注已退款。`)
  }

  // ─── Blueprint features ─────────────────────────────────────────────────────

  const blueprintFeatures: FeatureItem[] = [
    { id: 74, name: '預測市場建立與管理', description: '支援創建預測市場（標題、描述、選項、截止時間），並可在管理後台隨時查看所有市場狀態。', tag: '市場' },
    { id: '74a', name: '市場建立（標題/選項/時限/押注上限）', description: '建立市場時可設定標題、描述、押注截止時間與單筆押注上限，防止鯨魚操盤。', tag: '建立' },
    { id: '74b', name: '押注異常監控（單用戶超額押注警告）', description: '即時偵測單一用戶在同一市場的累計押注是否超過閾值，自動觸發風控警告並通知管理員。', tag: '風控' },
    { id: '74c', name: '結算 Audit Log', description: '每次強制結算或自動結算都寫入 Audit Log，記錄操作人、市場 ID、勝者、發放總額與時間戳。', tag: 'Audit' },
    { id: 75, name: '押注記錄查詢', description: '查詢所有用戶的押注記錄，支援依狀態（待結算/獲勝/落敗/退款）、市場篩選與分頁。', tag: '記錄' },
    { id: 76, name: '強制結算工作台', description: '管理員可在「強制結算工作台」一覽所有進行中市場，快速選擇勝者並觸發批次結算與點數發放。', tag: '結算' },
  ]


  // ─── Render ────────────────────────────────────────────────────────────────

  const tabs: { id: PredictionTabId; label: string; color: string }[] = [
    { id: 'overview', label: t('common.overview'), color: 'bg-slate-700' },
    { id: 'markets', label: t('tabs.predMarkets'), color: 'bg-sky-600' },
    { id: 'bets', label: t('tabs.predBets'), color: 'bg-violet-600' },
    { id: 'settlement', label: t('tabs.predSettlement'), color: 'bg-amber-600' },
    { id: 'blueprint', label: t('common.blueprint'), color: 'bg-slate-700' },
  ]

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">預測市場</span>
          <span className="text-[10px] text-slate-500">市場列表 / 押注記錄 / 強制結算工作台</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              className={['rounded-full px-2 py-0.5', activeTab === t.id ? `${t.color} text-white` : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── 總覽 ─────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">預測市場總覽</span>
            </div>
            <span className="text-[10px] text-slate-500">市場經濟快速統計，點選子頁籤進入詳細管理。</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-[11px]">
            <div className="space-y-1 rounded-xl border border-emerald-600/60 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><TrendingUp className="h-3.5 w-3.5 text-emerald-400" />進行中市場數</div>
              <div className="text-2xl font-semibold text-emerald-100">{overview.open}</div>
              <p className="text-[10px] text-emerald-200/80">目前狀態為 open 的市場。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-sky-600/60 bg-sky-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><BarChart3 className="h-3.5 w-3.5 text-sky-400" />今日新建市場</div>
              <div className="text-2xl font-semibold text-sky-100">{overview.todayCreated}</div>
              <p className="text-[10px] text-sky-200/80">今日（2026-03-24）新建立的市場數量。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-violet-600/60 bg-violet-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><List className="h-3.5 w-3.5 text-violet-400" />累計押注總額</div>
              <div className="text-2xl font-semibold text-violet-100">{overview.totalBetAmount.toLocaleString()}</div>
              <p className="text-[10px] text-violet-200/80">所有市場 yes+no 押注總和（點）。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-amber-600/60 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><Clock className="h-3.5 w-3.5 text-amber-400" />待結算市場</div>
              <div className="text-2xl font-semibold text-amber-100">{overview.pending}</div>
              <p className="text-[10px] text-amber-200/80">open 或 closed 狀態尚未結算的市場。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><CheckCircle2 className="h-3.5 w-3.5 text-rose-400" />本月結算總額</div>
              <div className="text-2xl font-semibold text-rose-100">{overview.monthSettled.toLocaleString()}</div>
              <p className="text-[10px] text-rose-200/80">本月已結算市場的發放點數總計。</p>
            </div>
          </div>
        </section>
      )}

      {/* ── 市場列表 ─────────────────────────────────────────────────────── */}
      {activeTab === 'markets' && (
        <section className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <List className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">市場列表</span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-100">詳情 · 強制結算 · 取消市場</span>
            </div>
            <select value={marketStatusFilter} onChange={e => setMarketStatusFilter(e.target.value as any)}
              className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
              <option value="all">全部狀態</option>
              <option value="open">進行中</option>
              <option value="closed">已關閉</option>
              <option value="settled">已結算</option>
              <option value="cancelled">已取消</option>
            </select>
          </header>
          <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-sky-100">
                <tr>
                  {['#', '市場 ID', '標題', '選項 YES/NO', '總押注額', '押注人數', '狀態', '創建時間', '結算時間', '操作'].map(h => (
                    <th key={h} className="border-b border-sky-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMarkets.map((m, i) => (
                  <tr key={m.id} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                    <td className="px-2 py-1.5 text-[10px] text-sky-100/80">{m.id}</td>
                    <td className="px-2 py-1.5 max-w-[180px]">
                      <div className="font-medium truncate">{m.title}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="text-emerald-300">YES: {m.yesAmount.toLocaleString()}</div>
                      <div className="text-rose-300">NO: {m.noAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums font-semibold">{(m.yesAmount + m.noAmount).toLocaleString()}</td>
                    <td className="px-2 py-1.5 tabular-nums">{m.yesBettors + m.noBettors}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${marketStatusBadge[m.status]}`}>
                        {marketStatusLabel[m.status]}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-sky-100/80">{m.createdAt}</td>
                    <td className="px-2 py-1.5 text-[10px] text-sky-100/80">{m.settleAt ?? m.settledAt ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <button onClick={() => setSelectedMarket(m)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-50 hover:bg-sky-500/30">
                          <Eye className="h-3 w-3" />詳情
                        </button>
                        {(m.status === 'open' || m.status === 'closed') && (
                          <>
                            <button onClick={() => handleForceSettle(m)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] text-white hover:bg-amber-500">
                              <Gavel className="h-3 w-3" />結算
                            </button>
                            <button onClick={() => handleCancelMarket(m)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500">
                              <XCircle className="h-3 w-3" />取消
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMarkets.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-6 text-center text-sky-100/80">目前沒有符合條件的市場。</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 押注記錄 ─────────────────────────────────────────────────────── */}
      {activeTab === 'bets' && (
        <section className="space-y-3 rounded-2xl border border-violet-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-semibold">押注記錄</span>
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-100">依狀態 / 市場篩選 · 分頁</span>
            </div>
            <div className="flex items-center gap-2">
              <select value={betMarketFilter} onChange={e => { setBetMarketFilter(e.target.value); setBetPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部市場</option>
                {markets.map(m => <option key={m.id} value={m.id}>{m.id}: {m.title.slice(0, 15)}…</option>)}
              </select>
              <select value={betStatusFilter} onChange={e => { setBetStatusFilter(e.target.value as any); setBetPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部狀態</option>
                <option value="pending">待結算</option>
                <option value="won">獲勝</option>
                <option value="lost">落敗</option>
                <option value="refunded">已退款</option>
              </select>
            </div>
          </header>
          <div className="overflow-hidden rounded-xl border border-violet-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-violet-100">
                <tr>
                  {['#', '記錄 ID', '市場標題', '用戶名稱', '用戶 ID', '選擇', '押注金額', '狀態', '押注時間', '結算時間'].map(h => (
                    <th key={h} className="border-b border-violet-600/60 px-2 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedBets.map((b, i) => (
                  <tr key={b.id} className="border-b border-violet-600/30 text-violet-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(betPage - 1) * BET_PAGE_SIZE + i + 1}</td>
                    <td className="px-2 py-1.5 text-[10px] text-violet-100/80">{b.id}</td>
                    <td className="px-2 py-1.5 max-w-[140px] truncate">{b.marketTitle}</td>
                    <td className="px-2 py-1.5 font-medium">{b.username}</td>
                    <td className="px-2 py-1.5 text-[10px] text-violet-100/80">{b.userId}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.choice === 'yes' ? 'bg-emerald-500/30 text-emerald-100' : 'bg-rose-500/30 text-rose-100'}`}>
                        {b.choice.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums font-semibold text-violet-100">{b.amount.toLocaleString()}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${betStatusBadge[b.status]}`}>
                        {betStatusLabel[b.status]}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-violet-100/80">{b.betAt}</td>
                    <td className="px-2 py-1.5 text-[10px] text-violet-100/80">{b.settledAt ?? '—'}</td>
                  </tr>
                ))}
                {pagedBets.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-6 text-center text-violet-100/80">目前沒有符合條件的押注記錄。</td></tr>
                )}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-violet-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>總筆數：{filteredBets.length} · 每頁 {BET_PAGE_SIZE} 筆</div>
              <div className="flex items-center gap-1">
                <button type="button" disabled={betPage <= 1} onClick={() => setBetPage(p => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">
                  <ChevronLeft className="h-3 w-3" />上一頁
                </button>
                <span>第 {betPage} / {betTotalPages} 頁</span>
                <button type="button" disabled={betPage >= betTotalPages} onClick={() => setBetPage(p => Math.min(betTotalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">
                  下一頁<ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* ── 強制結算工作台 ────────────────────────────────────────────────── */}
      {activeTab === 'settlement' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Gavel className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">強制結算工作台</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100">
                僅顯示 open / closed 市場 · 不可回復
              </span>
            </div>
          </header>
          {settlableMarkets.length === 0 ? (
            <div className="rounded-xl border border-amber-600/40 bg-slate-900/80 px-4 py-8 text-center text-[11px] text-amber-100/80">
              目前沒有需要結算的市場（所有市場已結算或取消）。
            </div>
          ) : (
            <div className="space-y-3">
              {settlableMarkets.map(m => {
                const total = m.yesAmount + m.noAmount
                const yesRatio = total > 0 ? (m.yesAmount / total) * 100 : 50
                return (
                  <div key={m.id} className="rounded-xl border border-amber-600/50 bg-slate-900/80 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-amber-50">{m.title}</div>
                        <div className="mt-0.5 text-[10px] text-amber-100/70">{m.id} · 截止：{m.settleAt ?? '—'}</div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-2 py-1.5">
                            <div className="text-emerald-200/70">YES 押注額</div>
                            <div className="font-semibold text-emerald-100">{m.yesAmount.toLocaleString()} 點</div>
                            <div className="text-[10px] text-emerald-200/60">{m.yesBettors} 人</div>
                          </div>
                          <div className="rounded-lg border border-rose-600/40 bg-rose-500/10 px-2 py-1.5">
                            <div className="text-rose-200/70">NO 押注額</div>
                            <div className="font-semibold text-rose-100">{m.noAmount.toLocaleString()} 點</div>
                            <div className="text-[10px] text-rose-200/60">{m.noBettors} 人</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>YES {yesRatio.toFixed(0)}%</span>
                            <span>NO {(100 - yesRatio).toFixed(0)}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden bg-rose-500/30">
                            <div className="h-full rounded-full bg-emerald-500/80 transition-all" style={{ width: `${yesRatio}%` }} />
                          </div>
                        </div>
                        <div className="mt-1.5 text-[10px] text-amber-100/60">
                          總押注人數：{m.yesBettors + m.noBettors} 人 · 總池：{total.toLocaleString()} 點
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => handleForceSettle(m)}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-amber-500">
                          <Gavel className="h-3 w-3" />選擇勝者
                        </button>
                        <button onClick={() => handleCancelMarket(m)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-600/60 bg-rose-500/10 px-3 py-1.5 text-[10px] text-rose-200 hover:bg-rose-500/20">
                          <XCircle className="h-3 w-3" />取消市場
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 功能清單 ─────────────────────────────────────────────────────── */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="預測市場功能清單"
          subtitle="對齊市場建立、押注記錄、強制結算、異常監控與 Audit Log 的完整鏈路。"
          items={blueprintFeatures}
        />
      )}

      {/* ── 市場詳情 Drawer ──────────────────────────────────────────────── */}
      {selectedMarket && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-sky-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-sky-700/60 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-sky-100">
                  <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-semibold">市場詳情</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-sky-200/80">{selectedMarket.id} · {selectedMarket.title}</p>
              </div>
              <button onClick={() => setSelectedMarket(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-700/80 bg-slate-900/80 text-sky-200 hover:border-sky-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-sky-50 space-y-3">
              {/* 基本資訊 */}
              <div className="space-y-1.5 rounded-xl border border-sky-700/60 bg-slate-900/80 p-3">
                <div className="flex justify-between"><span className="text-sky-200/70">市場 ID</span><span className="font-medium">{selectedMarket.id}</span></div>
                <div className="flex justify-between"><span className="text-sky-200/70">狀態</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${marketStatusBadge[selectedMarket.status]}`}>{marketStatusLabel[selectedMarket.status]}</span>
                </div>
                <div className="flex justify-between"><span className="text-sky-200/70">創建時間</span><span>{selectedMarket.createdAt}</span></div>
                <div className="flex justify-between"><span className="text-sky-200/70">結算時間</span><span>{selectedMarket.settleAt ?? '—'}</span></div>
                <div className="space-y-0.5 pt-1">
                  <div className="text-sky-200/70">描述</div>
                  <div className="text-[11px] text-sky-100/90">{selectedMarket.description}</div>
                </div>
              </div>

              {/* 押注比例 */}
              <div className="space-y-2 rounded-xl border border-sky-700/60 bg-slate-900/80 p-3">
                <div className="text-[11px] font-semibold text-sky-100">選項統計</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-2">
                    <div className="text-[10px] text-emerald-200/70">YES</div>
                    <div className="text-lg font-bold text-emerald-100">{selectedMarket.yesAmount.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-200/60">{selectedMarket.yesBettors} 人</div>
                  </div>
                  <div className="rounded-lg border border-rose-600/40 bg-rose-500/10 px-3 py-2">
                    <div className="text-[10px] text-rose-200/70">NO</div>
                    <div className="text-lg font-bold text-rose-100">{selectedMarket.noAmount.toLocaleString()}</div>
                    <div className="text-[10px] text-rose-200/60">{selectedMarket.noBettors} 人</div>
                  </div>
                </div>
                {(() => {
                  const total = selectedMarket.yesAmount + selectedMarket.noAmount
                  const yp = total > 0 ? (selectedMarket.yesAmount / total) * 100 : 50
                  return (
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>YES {yp.toFixed(1)}%</span><span>NO {(100 - yp).toFixed(1)}%</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden bg-rose-500/30">
                        <div className="h-full rounded-full bg-emerald-500/80" style={{ width: `${yp}%` }} />
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* 結算資訊（已結算才顯示） */}
              {selectedMarket.status === 'settled' && (
                <div className="space-y-1.5 rounded-xl border border-sky-500/50 bg-sky-500/10 p-3">
                  <div className="text-[11px] font-semibold text-sky-100">結算資訊</div>
                  <div className="flex justify-between"><span className="text-sky-200/70">勝者</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${selectedMarket.winner === 'yes' ? 'bg-emerald-500/30 text-emerald-100' : 'bg-rose-500/30 text-rose-100'}`}>
                      {selectedMarket.winner?.toUpperCase() ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-sky-200/70">結算時間</span><span>{selectedMarket.settledAt ?? '—'}</span></div>
                  <div className="flex justify-between"><span className="text-sky-200/70">發放總額</span><span className="font-semibold text-emerald-200">{selectedMarket.settledTotal?.toLocaleString() ?? '—'} 點</span></div>
                </div>
              )}

              {/* 操作 */}
              {(selectedMarket.status === 'open' || selectedMarket.status === 'closed') && (
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleForceSettle(selectedMarket, true)}
                    className="rounded-full bg-amber-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-amber-500 flex items-center justify-center gap-1">
                    <Gavel className="h-3.5 w-3.5" />強制結算（選擇勝者）
                  </button>
                  <button onClick={() => handleCancelMarket(selectedMarket, true)}
                    className="rounded-full bg-rose-600 px-3 py-2 text-[11px] text-white hover:bg-rose-500 flex items-center justify-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />取消市場
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default PredictionMarketPage
