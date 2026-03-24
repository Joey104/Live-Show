/**
 * @file ReportsPage.tsx
 * @description 報表中心（Reports Center）
 * 整合 7 大報表分類：用戶 / 經濟 / 直播 / 行銷 / 支付 / Bonus / 功能清單
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showAlert } from '../../lib/dialog'
import {
  BarChart3, Users, Coins, Radio, Megaphone, CreditCard, TrendingUp,
  ChevronLeft, ChevronRight, FileDown, Search, Download, Calendar,
  Gift, ArrowDownCircle, ArrowUpCircle, Star, Tag, Share2,
  Layers3, CheckCircle2, Clock, AlertTriangle, Eye, Copy,
  ListChecks, Activity,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Tab IDs ──────────────────────────────────────────────────────────────────

type ReportsTabId = 'overview' | 'user' | 'economy' | 'live' | 'marketing' | 'payment' | 'bonus' | 'blueprint'
type UserSubTab = 'growth' | 'balance' | 'gifts' | 'tx'
type EconomySubTab = 'revenue' | 'gift_trend' | 'today'
type LiveSubTab = 'earnings' | 'market' | 'history'
type MarketingSubTab = 'campaign' | 'coupon' | 'referral'
type PaymentSubTab = 'reconcile' | 'analysis'
type BonusSubTab = 'issuance' | 'ledger' | 'redeem'

// ─── Paginator ────────────────────────────────────────────────────────────────

function Paginator({ page, total, pageSize, onPrev, onNext, borderColor = 'border-slate-700/80' }: {
  page: number; total: number; pageSize: number
  onPrev: () => void; onNext: () => void; borderColor?: string
}) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <footer className={`flex items-center justify-between border-t ${borderColor} bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300`}>
      <div>{t('common.total', { count: total })} · {t('common.perPage', { size: pageSize })}</div>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={onPrev}
          className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40 text-[10px]">
          <ChevronLeft className="h-3 w-3" /> {t('common.prevPage')}
        </button>
        <span>{t('common.pageOf', { page, total: totalPages })}</span>
        <button type="button" disabled={page >= totalPages} onClick={onNext}
          className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40 text-[10px]">
          {t('common.nextPage')} <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </footer>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateLabel(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000)
  return d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
}

function ts(hoursAgo = 0): string {
  const d = new Date(Date.now() - hoursAgo * 3_600_000)
  return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// --- 用戶每日增長 ---
interface UserGrowthRow { date: string; newUsers: number; activeUsers: number; growthRate: number }
function mockUserGrowth(): UserGrowthRow[] {
  return [6,5,4,3,2,1,0].map(d => ({
    date: dateLabel(d),
    newUsers: 120 + Math.floor(Math.random() * 80),
    activeUsers: 400 + Math.floor(Math.random() * 200),
    growthRate: parseFloat((2 + Math.random() * 5).toFixed(1)),
  }))
}

// --- 用戶餘額總覽 ---
interface UserBalanceRow { id: string; userId: string; name: string; points: number; bonus: number; totalPHP: number; updatedAt: string }
function mockUserBalances(): UserBalanceRow[] {
  const names = ['alice', 'bob', 'carol', 'dave', 'ed', 'frank']
  return names.map((n, i) => ({
    id: String(i + 1),
    userId: String(10001 + i),
    name: n,
    points: 1000 + i * 850,
    bonus: 200 + i * 120,
    totalPHP: parseFloat(((1000 + i * 850) * 0.01 + (200 + i * 120) * 0.005).toFixed(2)),
    updatedAt: ts(i * 3),
  }))
}

// --- 用戶送禮記錄 ---
interface GiftRow { id: string; time: string; sender: string; receiver: string; giftName: string; emoji: string; coins: number; php: number }
function mockGiftRows(): GiftRow[] {
  const gifts = [
    { name: '玫瑰花', emoji: '🌹', coins: 50 },
    { name: '皇冠', emoji: '👑', coins: 500 },
    { name: '火箭', emoji: '🚀', coins: 1000 },
    { name: '愛心', emoji: '❤️', coins: 20 },
    { name: '鑽石', emoji: '💎', coins: 2000 },
    { name: '🎁 禮盒', emoji: '🎁', coins: 100 },
  ]
  const senders = ['alice', 'bob', 'carol', 'dave', 'ed', 'frank']
  const hosts = ['主播A', '主播B', '主播C']
  return gifts.map((g, i) => ({
    id: String(i + 1),
    time: ts(i * 4),
    sender: senders[i % senders.length],
    receiver: hosts[i % hosts.length],
    giftName: g.name,
    emoji: g.emoji,
    coins: g.coins,
    php: parseFloat((g.coins * 0.5).toFixed(2)),
  }))
}

// --- 用戶交易記錄 ---
interface TxRow { id: string; time: string; user: string; type: string; amount: number; balanceAfter: number; note: string }
function mockTxRows(): TxRow[] {
  const types = ['充值', '消費', '送禮', 'Bonus', '充值', '消費', '送禮', '充值']
  const users = ['alice', 'bob', 'carol', 'dave', 'ed', 'frank', 'grace', 'henry']
  return types.map((t, i) => ({
    id: String(i + 1),
    time: ts(i * 2),
    user: users[i],
    type: t,
    amount: [500, -50, -200, 100, 1000, -30, -100, 2000][i],
    balanceAfter: [1500, 950, 2300, 820, 2820, 390, 1100, 3200][i],
    note: `${t}交易示意`,
  }))
}

// --- 平台收益 ---
interface RevenueRow { date: string; giftIncome: number; commission: number; bonusCost: number; netIncome: number }
function mockRevenueRows(): RevenueRow[] {
  return [6,5,4,3,2,1,0].map(d => {
    const gift = 5000 + Math.floor(Math.random() * 3000)
    const comm = Math.floor(gift * 0.3)
    const bonus = Math.floor(gift * 0.05)
    return { date: dateLabel(d), giftIncome: gift, commission: comm, bonusCost: bonus, netIncome: comm - bonus }
  })
}

// --- 禮物銷售趨勢 ---
interface GiftTrendRow { date: string; count: number; total: number; topGift: string }
function mockGiftTrend(): GiftTrendRow[] {
  const gifts = ['皇冠👑', '火箭🚀', '鑽石💎', '玫瑰🌹', '禮盒🎁', '愛心❤️', '星星⭐']
  return [6,5,4,3,2,1,0].map((d, i) => ({
    date: dateLabel(d),
    count: 80 + Math.floor(Math.random() * 60),
    total: 15000 + Math.floor(Math.random() * 10000),
    topGift: gifts[i],
  }))
}

// --- 直播收益 ---
interface LiveEarningsRow {
  liveId: string; host: string; startTime: string; duration: string
  giftIncome: number; commission: number; hostNet: number; topGift: string
}
function mockLiveEarnings(): LiveEarningsRow[] {
  const hosts = ['主播A', '主播B', '主播C', '主播A', '主播D', '主播B']
  const gifts = ['皇冠👑', '火箭🚀', '鑽石💎', '玫瑰🌹', '禮盒🎁', '愛心❤️']
  return hosts.map((h, i) => {
    const gift = 3000 + i * 1200
    const comm = Math.floor(gift * 0.3)
    return {
      liveId: `LIVE-${String(i + 1).padStart(3, '0')}`,
      host: h,
      startTime: ts(i * 6 + 2),
      duration: `${60 + i * 15} 分鐘`,
      giftIncome: gift,
      commission: comm,
      hostNet: gift - comm,
      topGift: gifts[i],
    }
  })
}

// --- 市場押注 ---
interface MarketBetRow {
  marketId: string; title: string; yesBet: number; noBet: number; participants: number; status: string; winner: string
}
function mockMarketBets(): MarketBetRow[] {
  return [
    { marketId: 'MKT-001', title: '今日誰得冠軍？', yesBet: 5000, noBet: 3000, participants: 88, status: '已結算', winner: 'YES' },
    { marketId: 'MKT-002', title: '下一首歌是情歌？', yesBet: 2000, noBet: 4500, participants: 65, status: '已結算', winner: 'NO' },
    { marketId: 'MKT-003', title: '主播會換裝嗎？', yesBet: 1200, noBet: 800, participants: 40, status: '進行中', winner: '—' },
    { marketId: 'MKT-004', title: '連麥對象是誰？', yesBet: 3500, noBet: 2000, participants: 75, status: '已結算', winner: 'YES' },
    { marketId: 'MKT-005', title: '今日直播時長 > 2h？', yesBet: 6000, noBet: 1500, participants: 120, status: '進行中', winner: '—' },
  ]
}

// --- 主播歷史 ---
interface HostHistoryRow { sessionId: string; title: string; time: string; duration: string; viewers: number; giftIncome: number }
function mockHostHistory(): HostHistoryRow[] {
  return [
    { sessionId: 'LIVE-021', title: '週五歌舞直播', time: ts(48), duration: '120 分鐘', viewers: 1200, giftIncome: 18000 },
    { sessionId: 'LIVE-019', title: '才藝大賽特別場', time: ts(96), duration: '90 分鐘', viewers: 980, giftIncome: 12000 },
    { sessionId: 'LIVE-015', title: '連麥合唱場', time: ts(144), duration: '75 分鐘', viewers: 750, giftIncome: 8500 },
    { sessionId: 'LIVE-012', title: '互動問答場', time: ts(192), duration: '60 分鐘', viewers: 620, giftIncome: 6000 },
  ]
}

// --- 活動成效 ---
interface CampaignRow { name: string; type: string; participants: number; achieved: number; achieveRate: number; bonusGiven: number; convRate: number }
function mockCampaigns(): CampaignRow[] {
  return [
    { name: '3月登入任務', type: '任務', participants: 5000, achieved: 3200, achieveRate: 64, bonusGiven: 160000, convRate: 42 },
    { name: '首充加倍活動', type: '充值', participants: 1200, achieved: 900, achieveRate: 75, bonusGiven: 90000, convRate: 68 },
    { name: '推薦好友計畫', type: '推薦', participants: 800, achieved: 480, achieveRate: 60, bonusGiven: 48000, convRate: 35 },
    { name: '每日簽到獎勵', type: '簽到', participants: 8000, achieved: 6400, achieveRate: 80, bonusGiven: 320000, convRate: 55 },
    { name: '消費達標禮', type: '消費', participants: 600, achieved: 320, achieveRate: 53, bonusGiven: 32000, convRate: 28 },
  ]
}

// --- 優惠券 ---
interface CouponRow { name: string; type: string; issued: number; used: number; useRate: number; success: number; failed: number; cancelled: number }
function mockCoupons(): CouponRow[] {
  return [
    { name: '首充折扣券', type: '折扣', issued: 2000, used: 1500, useRate: 75, success: 1450, failed: 30, cancelled: 20 },
    { name: '會員生日券', type: '禮品', issued: 500, used: 380, useRate: 76, success: 370, failed: 5, cancelled: 5 },
    { name: '限時雙倍券', type: '倍率', issued: 3000, used: 1800, useRate: 60, success: 1750, failed: 30, cancelled: 20 },
    { name: '新用戶歡迎券', type: '禮品', issued: 10000, used: 6500, useRate: 65, success: 6400, failed: 60, cancelled: 40 },
  ]
}

// --- 推薦分潤 ---
interface ReferralRow { plan: string; relations: number; bonusPaid: number; rollbacks: number; rollbackRate: number }
function mockReferrals(): ReferralRow[] {
  return [
    { plan: '標準推薦計畫', relations: 1200, bonusPaid: 120000, rollbacks: 36, rollbackRate: 3.0 },
    { plan: '達人推薦計畫', relations: 300, bonusPaid: 60000, rollbacks: 6, rollbackRate: 2.0 },
    { plan: '主播邀請計畫', relations: 80, bonusPaid: 40000, rollbacks: 2, rollbackRate: 2.5 },
  ]
}

// --- 充值/提領對帳 ---
interface PayReconcileRow { date: string; depCount: number; depTotal: number; wdlCount: number; wdlTotal: number; netIn: number }
function mockPayReconcile(): PayReconcileRow[] {
  return [6,5,4,3,2,1,0].map(d => {
    const depTotal = 80000 + Math.floor(Math.random() * 40000)
    const wdlTotal = 30000 + Math.floor(Math.random() * 20000)
    return {
      date: dateLabel(d),
      depCount: 40 + Math.floor(Math.random() * 30),
      depTotal,
      wdlCount: 15 + Math.floor(Math.random() * 15),
      wdlTotal,
      netIn: depTotal - wdlTotal,
    }
  })
}

// --- 支付處理分析 ---
interface PayAnalysisRow { channel: string; avgMs: number; successRate: number; failCount: number; topFailReason: string }
function mockPayAnalysis(): PayAnalysisRow[] {
  return [
    { channel: 'Pay88', avgMs: 1200, successRate: 98.5, failCount: 12, topFailReason: 'callback 超時' },
    { channel: 'DragonPay', avgMs: 1800, successRate: 96.2, failCount: 34, topFailReason: 'callback 未收到' },
    { channel: '銀行轉帳', avgMs: 86400000, successRate: 95.0, failCount: 8, topFailReason: '憑證不符' },
    { channel: '人工入帳', avgMs: 3600000, successRate: 99.1, failCount: 3, topFailReason: '金額錯誤' },
  ]
}

// --- Bonus 發放報表 ---
interface BonusIssuanceReportRow { source: string; tasks: number; total: number; users: number; avgPerUser: number }
function mockBonusIssuanceReport(): BonusIssuanceReportRow[] {
  return [
    { source: '活動', tasks: 12, total: 480000, users: 4800, avgPerUser: 100 },
    { source: '任務', tasks: 8, total: 160000, users: 3200, avgPerUser: 50 },
    { source: '推薦', tasks: 5, total: 60000, users: 1200, avgPerUser: 50 },
    { source: '補發', tasks: 3, total: 15000, users: 150, avgPerUser: 100 },
    { source: '其他', tasks: 2, total: 5000, users: 100, avgPerUser: 50 },
  ]
}

// --- Bonus 流水 ---
interface BonusLedgerReportRow { date: string; issued: number; deducted: number; net: number; users: number }
function mockBonusLedgerReport(): BonusLedgerReportRow[] {
  return [6,5,4,3,2,1,0].map(d => {
    const issued = 50000 + Math.floor(Math.random() * 30000)
    const deducted = 10000 + Math.floor(Math.random() * 10000)
    return {
      date: dateLabel(d),
      issued,
      deducted,
      net: issued - deducted,
      users: 300 + Math.floor(Math.random() * 200),
    }
  })
}

// --- Bonus 兌換報表 ---
interface BonusRedeemReportRow { tier: string; applied: number; success: number; failed: number; cancelled: number; successRate: number; totalBonus: number }
function mockBonusRedeemReport(): BonusRedeemReportRow[] {
  return [
    { tier: '金 (GOLD)', applied: 120, success: 115, failed: 3, cancelled: 2, successRate: 95.8, totalBonus: 230000 },
    { tier: '銀 (SILVER)', applied: 350, success: 330, failed: 12, cancelled: 8, successRate: 94.3, totalBonus: 495000 },
    { tier: '銅 (BRONZE)', applied: 600, success: 560, failed: 25, cancelled: 15, successRate: 93.3, totalBonus: 504000 },
    { tier: '鐵 (IRON)', applied: 800, success: 740, failed: 40, cancelled: 20, successRate: 92.5, totalBonus: 444000 },
    { tier: '石 (STONE)', applied: 1200, success: 1100, failed: 60, cancelled: 40, successRate: 91.7, totalBonus: 330000 },
  ]
}


// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<ReportsTabId>('overview')

  // Sub tabs
  const [userSub, setUserSub] = useState<UserSubTab>('growth')
  const [econSub, setEconSub] = useState<EconomySubTab>('revenue')
  const [liveSub, setLiveSub] = useState<LiveSubTab>('earnings')
  const [mktSub, setMktSub] = useState<MarketingSubTab>('campaign')
  const [paySub, setPaySub] = useState<PaymentSubTab>('reconcile')
  const [bonusSub, setBonusSub] = useState<BonusSubTab>('issuance')

  // User tab state
  const [growthRange, setGrowthRange] = useState<'7d' | '30d'>('7d')
  const [balanceSearch, setBalanceSearch] = useState('')
  const [giftUserFilter, setGiftUserFilter] = useState('')
  const [giftTypeFilter, setGiftTypeFilter] = useState('all')
  const [txUserFilter, setTxUserFilter] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState('all')

  // Economy tab state
  const [revenueRange, setRevenueRange] = useState<'7d' | '30d'>('7d')

  // Live tab state
  const [hostSearch, setHostSearch] = useState('alice')

  // Bonus tab state
  const [bonusLedgerDir, setBonusLedgerDir] = useState('all')
  const [bonusLedgerTier, setBonusLedgerTier] = useState('all')

  // Payment tab state
  const [payRange, setPayRange] = useState<'7d' | '30d'>('7d')

  // Pagination
  const PS = 5
  const [balancePage, setBalancePage] = useState(1)
  const [giftPage, setGiftPage] = useState(1)
  const [txPage, setTxPage] = useState(1)
  const [revenuePage, setRevenuePage] = useState(1)
  const [giftTrendPage, setGiftTrendPage] = useState(1)
  const [liveEarningsPage, setLiveEarningsPage] = useState(1)
  const [marketPage, setMarketPage] = useState(1)
  const [campaignPage, setCampaignPage] = useState(1)
  const [payRecPage, setPayRecPage] = useState(1)
  const [bonusIssuancePage, setBonusIssuancePage] = useState(1)
  const [bonusLedgerPage, setBonusLedgerPage] = useState(1)
  const [bonusRedeemPage, setBonusRedeemPage] = useState(1)

  // Data (memoized)
  const growthData = useMemo(() => mockUserGrowth(), [])
  const balanceData = useMemo(() => mockUserBalances(), [])
  const giftData = useMemo(() => mockGiftRows(), [])
  const txData = useMemo(() => mockTxRows(), [])
  const revenueData = useMemo(() => mockRevenueRows(), [])
  const giftTrendData = useMemo(() => mockGiftTrend(), [])
  const liveEarningsData = useMemo(() => mockLiveEarnings(), [])
  const marketBetData = useMemo(() => mockMarketBets(), [])
  const hostHistoryData = useMemo(() => mockHostHistory(), [])
  const campaignData = useMemo(() => mockCampaigns(), [])
  const couponData = useMemo(() => mockCoupons(), [])
  const referralData = useMemo(() => mockReferrals(), [])
  const payRecData = useMemo(() => mockPayReconcile(), [])
  const payAnalysisData = useMemo(() => mockPayAnalysis(), [])
  const bonusIssuanceData = useMemo(() => mockBonusIssuanceReport(), [])
  const bonusLedgerData = useMemo(() => mockBonusLedgerReport(), [])
  const bonusRedeemData = useMemo(() => mockBonusRedeemReport(), [])

  // Filtered data
  const filteredBalance = useMemo(() =>
    balanceSearch ? balanceData.filter(r => `${r.userId} ${r.name}`.toLowerCase().includes(balanceSearch.toLowerCase())) : balanceData,
    [balanceData, balanceSearch])

  const filteredGift = useMemo(() =>
    giftData.filter(r => {
      if (giftUserFilter && !r.sender.toLowerCase().includes(giftUserFilter.toLowerCase())) return false
      if (giftTypeFilter !== 'all' && r.giftName !== giftTypeFilter) return false
      return true
    }),
    [giftData, giftUserFilter, giftTypeFilter])

  const filteredTx = useMemo(() =>
    txData.filter(r => {
      if (txUserFilter && !r.user.toLowerCase().includes(txUserFilter.toLowerCase())) return false
      if (txTypeFilter !== 'all' && r.type !== txTypeFilter) return false
      return true
    }),
    [txData, txUserFilter, txTypeFilter])

  const filteredBonusLedger = useMemo(() =>
    bonusLedgerData.filter(() => true), // direction/tier filter is display-only for mock
    [bonusLedgerData])

  // Overview stats
  const revenueKPI = useMemo(() => {
    const total = revenueData.reduce((s, r) => ({ gift: s.gift + r.giftIncome, comm: s.comm + r.commission, bonus: s.bonus + r.bonusCost, net: s.net + r.netIncome }), { gift: 0, comm: 0, bonus: 0, net: 0 })
    return total
  }, [revenueData])

  // Tab config
  const tabConfig: { id: ReportsTabId; label: string; color: string }[] = [
    { id: 'overview', label: t('common.overview'), color: 'bg-slate-700' },
    { id: 'user', label: t('tabs.rptUser'), color: 'bg-sky-600' },
    { id: 'economy', label: t('tabs.rptEconomy'), color: 'bg-emerald-600' },
    { id: 'live', label: t('tabs.rptLive'), color: 'bg-violet-600' },
    { id: 'marketing', label: t('tabs.rptMarketing'), color: 'bg-amber-600' },
    { id: 'payment', label: t('tabs.rptPayment'), color: 'bg-rose-600' },
    { id: 'bonus', label: t('tabs.rptBonus'), color: 'bg-indigo-600' },
    { id: 'blueprint', label: t('common.blueprint'), color: 'bg-slate-700' },
  ]

  const overviewCards = [
    { id: 'user', icon: <Users className="h-5 w-5 text-sky-400" />, label: '用戶報表', count: 4, desc: '每日增長、餘額總覽、送禮記錄與交易明細。', color: 'border-sky-600/60 bg-sky-500/10' },
    { id: 'economy', icon: <TrendingUp className="h-5 w-5 text-emerald-400" />, label: '經濟報表', count: 3, desc: '平台總收益、禮物銷售趨勢與今日關鍵摘要。', color: 'border-emerald-600/60 bg-emerald-500/10' },
    { id: 'live', icon: <Radio className="h-5 w-5 text-violet-400" />, label: '直播報表', count: 3, desc: '直播收益統計、市場押注分析與主播歷史記錄。', color: 'border-violet-600/60 bg-violet-500/10' },
    { id: 'marketing', icon: <Megaphone className="h-5 w-5 text-amber-400" />, label: '行銷報表', count: 3, desc: '活動成效、優惠券使用率與推薦分潤分析。', color: 'border-amber-600/60 bg-amber-500/10' },
    { id: 'payment', icon: <CreditCard className="h-5 w-5 text-rose-400" />, label: '支付報表', count: 2, desc: '充值/提領對帳報表與支付通道處理效能分析。', color: 'border-rose-600/60 bg-rose-500/10' },
    { id: 'bonus', icon: <Coins className="h-5 w-5 text-indigo-400" />, label: 'Bonus 報表', count: 3, desc: '發放報表、Bonus 流水統計與兌換成效追蹤。', color: 'border-indigo-600/60 bg-indigo-500/10' },
    { id: 'blueprint', icon: <ListChecks className="h-5 w-5 text-slate-400" />, label: '功能清單', count: 0, desc: '報表中心規格藍圖，供 PM / 技術對齊使用。', color: 'border-slate-700/80 bg-slate-900/80' },
  ]

  // ─── SubTab toggle helper ────────────────────────────────────────────────

  function SubTabBtn({ active, label, color, onClick }: { active: boolean; label: string; color: string; onClick: () => void }) {
    return (
      <button type="button" onClick={onClick}
        className={['rounded-full px-2 py-0.5 text-[10px]', active ? `${color} text-white` : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
        {label}
      </button>
    )
  }

  // ─── CSV Export helper ───────────────────────────────────────────────────

  async function handleExport(label: string) {
    await showAlert(`示意：匯出「${label}」CSV 報表。\n正式環境將呼叫後端 API 產生並下載檔案。`)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">報表中心</span>
          <span className="text-[10px] text-slate-500">整合全平台指標，支援 CSV 匯出</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {tabConfig.map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              className={['rounded-full px-2 py-0.5 text-[10px]', activeTab === t.id ? `${t.color} text-white` : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
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
              <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">報表中心</span>
              <span className="text-[10px] text-slate-500">報表中心整合全平台指標，支援 CSV 匯出。</span>
            </div>
            <button type="button" onClick={() => handleExport('全部報表')}
              className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2 py-1 text-[10px] text-white hover:bg-slate-600">
              <Download className="h-3 w-3" />全部匯出
            </button>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-[11px]">
            {overviewCards.map(card => (
              <div key={card.id} className={`space-y-2 rounded-xl border p-3 ${card.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {card.icon}
                    <span className="font-semibold text-slate-100">{card.label}</span>
                  </div>
                  {card.count > 0 && (
                    <span className="rounded-full bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400">{card.count} 份報表</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">{card.desc}</p>
                <button type="button"
                  onClick={() => setActiveTab(card.id as ReportsTabId)}
                  className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">
                  進入 →
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 用戶報表 ─────────────────────────────────────────────────────── */}
      {activeTab === 'user' && (
        <section className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">用戶報表</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
              <SubTabBtn active={userSub === 'growth'} label="每日增長" color="bg-sky-600" onClick={() => setUserSub('growth')} />
              <SubTabBtn active={userSub === 'balance'} label="餘額總覽" color="bg-sky-600" onClick={() => setUserSub('balance')} />
              <SubTabBtn active={userSub === 'gifts'} label="送禮記錄" color="bg-sky-600" onClick={() => setUserSub('gifts')} />
              <SubTabBtn active={userSub === 'tx'} label="交易記錄" color="bg-sky-600" onClick={() => setUserSub('tx')} />
            </div>
          </header>

          {/* 每日增長 */}
          {userSub === 'growth' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
                  <button type="button" onClick={() => setGrowthRange('7d')}
                    className={['rounded-full px-2 py-0.5 text-[10px]', growthRange === '7d' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'].join(' ')}>7日</button>
                  <button type="button" onClick={() => setGrowthRange('30d')}
                    className={['rounded-full px-2 py-0.5 text-[10px]', growthRange === '30d' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'].join(' ')}>30日</button>
                </div>
                <button type="button" onClick={() => handleExport('每日用戶增長')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              {/* Bar chart */}
              <div className="rounded-xl border border-sky-600/40 bg-slate-900/80 p-3">
                <div className="mb-1 text-[10px] text-sky-200/80">新增用戶趨勢（示意）</div>
                <div className="flex items-end gap-1 h-20">
                  {growthData.map((row, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-sky-500/60" style={{ height: `${(row.newUsers / 250) * 72}px` }} />
                      <span className="text-[9px] text-sky-200/70">{row.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-sky-100">
                    <tr>
                      {['日期', '新增用戶', '活躍用戶', '增長率(%)'].map(h => (
                        <th key={h} className="border-b border-sky-600/60 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {growthData.map((row, i) => (
                      <tr key={i} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                        <td className="px-3 py-1.5">{row.date}</td>
                        <td className="px-3 py-1.5 tabular-nums text-emerald-200">{row.newUsers.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.activeUsers.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.growthRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 餘額總覽 */}
          {userSub === 'balance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1 flex-1 max-w-xs">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input value={balanceSearch} onChange={e => { setBalanceSearch(e.target.value); setBalancePage(1) }}
                    placeholder="用戶 ID / 名稱搜尋"
                    className="bg-transparent outline-none text-[11px] text-slate-100 placeholder:text-slate-500 w-full" />
                </div>
                <button type="button" onClick={() => handleExport('用戶餘額總覽')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-sky-100">
                    <tr>
                      {['#', '用戶 ID', '名稱', '點數餘額', 'Bonus 餘額', '總資產(PHP)', '最後異動'].map(h => (
                        <th key={h} className="border-b border-sky-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalance.slice((balancePage - 1) * PS, balancePage * PS).map((row, i) => (
                      <tr key={row.id} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                        <td className="px-2 py-1.5 text-slate-300">{(balancePage - 1) * PS + i + 1}</td>
                        <td className="px-2 py-1.5">{row.userId}</td>
                        <td className="px-2 py-1.5 font-medium">{row.name}</td>
                        <td className="px-2 py-1.5 tabular-nums text-sky-200">{row.points.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-indigo-200">{row.bonus.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-emerald-200">{row.totalPHP.toLocaleString()}</td>
                        <td className="px-2 py-1.5 text-[10px] text-sky-100/70">{row.updatedAt}</td>
                      </tr>
                    ))}
                    {filteredBalance.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-sky-100/70">無符合資料</td></tr>}
                  </tbody>
                </table>
                <Paginator page={balancePage} total={filteredBalance.length} pageSize={PS} borderColor="border-sky-600/60"
                  onPrev={() => setBalancePage(p => Math.max(1, p - 1))} onNext={() => setBalancePage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 送禮記錄 */}
          {userSub === 'gifts' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input value={giftUserFilter} onChange={e => { setGiftUserFilter(e.target.value); setGiftPage(1) }}
                    placeholder="送禮用戶 ID"
                    className="bg-transparent outline-none text-[11px] text-slate-100 placeholder:text-slate-500" />
                </div>
                <select value={giftTypeFilter} onChange={e => { setGiftTypeFilter(e.target.value); setGiftPage(1) }}
                  className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                  <option value="all">全部禮物</option>
                  {giftData.map(g => <option key={g.giftName} value={g.giftName}>{g.giftName}</option>)}
                </select>
                <button type="button" onClick={() => handleExport('用戶送禮記錄')}
                  className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-sky-100">
                    <tr>
                      {['#', '時間', '送禮用戶', '接收主播', '禮物名稱', 'Emoji', '金額(Coins)', '換算(PHP)'].map(h => (
                        <th key={h} className="border-b border-sky-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGift.slice((giftPage - 1) * PS, giftPage * PS).map((row, i) => (
                      <tr key={row.id} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                        <td className="px-2 py-1.5 text-slate-300">{(giftPage - 1) * PS + i + 1}</td>
                        <td className="px-2 py-1.5 text-[10px] text-sky-100/70">{row.time}</td>
                        <td className="px-2 py-1.5">{row.sender}</td>
                        <td className="px-2 py-1.5">{row.receiver}</td>
                        <td className="px-2 py-1.5">{row.giftName}</td>
                        <td className="px-2 py-1.5 text-lg">{row.emoji}</td>
                        <td className="px-2 py-1.5 tabular-nums text-amber-200">{row.coins.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-emerald-200">{row.php.toLocaleString()}</td>
                      </tr>
                    ))}
                    {filteredGift.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-sky-100/70">無符合資料</td></tr>}
                  </tbody>
                </table>
                <Paginator page={giftPage} total={filteredGift.length} pageSize={PS} borderColor="border-sky-600/60"
                  onPrev={() => setGiftPage(p => Math.max(1, p - 1))} onNext={() => setGiftPage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 交易記錄 */}
          {userSub === 'tx' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input value={txUserFilter} onChange={e => { setTxUserFilter(e.target.value); setTxPage(1) }}
                    placeholder="用戶 ID"
                    className="bg-transparent outline-none text-[11px] text-slate-100 placeholder:text-slate-500" />
                </div>
                <select value={txTypeFilter} onChange={e => { setTxTypeFilter(e.target.value); setTxPage(1) }}
                  className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                  <option value="all">全部類型</option>
                  <option value="充值">充值</option>
                  <option value="消費">消費</option>
                  <option value="送禮">送禮</option>
                  <option value="Bonus">Bonus</option>
                </select>
                <button type="button" onClick={() => handleExport('用戶交易記錄')}
                  className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-sky-100">
                    <tr>
                      {['#', '時間', '用戶', '類型', '金額', '餘額後', '備註'].map(h => (
                        <th key={h} className="border-b border-sky-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.slice((txPage - 1) * PS, txPage * PS).map((row, i) => (
                      <tr key={row.id} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                        <td className="px-2 py-1.5 text-slate-300">{(txPage - 1) * PS + i + 1}</td>
                        <td className="px-2 py-1.5 text-[10px] text-sky-100/70">{row.time}</td>
                        <td className="px-2 py-1.5">{row.user}</td>
                        <td className="px-2 py-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.amount > 0 ? 'bg-emerald-500/30 text-emerald-50' : 'bg-rose-500/30 text-rose-50'}`}>{row.type}</span>
                        </td>
                        <td className={`px-2 py-1.5 tabular-nums font-medium ${row.amount > 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                          {row.amount > 0 ? '+' : ''}{row.amount.toLocaleString()}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">{row.balanceAfter.toLocaleString()}</td>
                        <td className="px-2 py-1.5 text-[10px] text-sky-100/70">{row.note}</td>
                      </tr>
                    ))}
                    {filteredTx.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-sky-100/70">無符合資料</td></tr>}
                  </tbody>
                </table>
                <Paginator page={txPage} total={filteredTx.length} pageSize={PS} borderColor="border-sky-600/60"
                  onPrev={() => setTxPage(p => Math.max(1, p - 1))} onNext={() => setTxPage(p => p + 1)} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 經濟報表 ─────────────────────────────────────────────────────── */}
      {activeTab === 'economy' && (
        <section className="space-y-3 rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold">經濟報表</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
              <SubTabBtn active={econSub === 'revenue'} label="平台收益" color="bg-emerald-600" onClick={() => setEconSub('revenue')} />
              <SubTabBtn active={econSub === 'gift_trend'} label="禮物銷售趨勢" color="bg-emerald-600" onClick={() => setEconSub('gift_trend')} />
              <SubTabBtn active={econSub === 'today'} label="今日摘要" color="bg-emerald-600" onClick={() => setEconSub('today')} />
            </div>
          </header>

          {/* 平台收益 */}
          {econSub === 'revenue' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
                  <button type="button" onClick={() => setRevenueRange('7d')}
                    className={['rounded-full px-2 py-0.5 text-[10px]', revenueRange === '7d' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'].join(' ')}>7日</button>
                  <button type="button" onClick={() => setRevenueRange('30d')}
                    className={['rounded-full px-2 py-0.5 text-[10px]', revenueRange === '30d' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'].join(' ')}>30日</button>
                </div>
                <button type="button" onClick={() => handleExport('平台總收益')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              {/* KPI cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-[11px]">
                {[
                  { label: '禮物收入', val: revenueKPI.gift, color: 'border-emerald-600/60 bg-emerald-500/10 text-emerald-100' },
                  { label: '平台抽成', val: revenueKPI.comm, color: 'border-sky-600/60 bg-sky-500/10 text-sky-100' },
                  { label: 'Bonus 成本', val: revenueKPI.bonus, color: 'border-rose-600/60 bg-rose-500/10 text-rose-100' },
                  { label: '淨收入', val: revenueKPI.net, color: 'border-amber-600/60 bg-amber-500/10 text-amber-100' },
                ].map(kpi => (
                  <div key={kpi.label} className={`rounded-xl border p-3 ${kpi.color}`}>
                    <div className="text-slate-400 text-[10px]">{kpi.label}</div>
                    <div className="text-lg font-semibold">{kpi.val.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">PHP（7日合計）</div>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-xl border border-emerald-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-emerald-100">
                    <tr>
                      {['日期', '禮物收入', '抽成', 'Bonus 成本', '淨收入'].map(h => (
                        <th key={h} className="border-b border-emerald-600/60 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.slice((revenuePage - 1) * PS, revenuePage * PS).map((row, i) => (
                      <tr key={i} className="border-b border-emerald-600/30 text-emerald-50 last:border-b-0">
                        <td className="px-3 py-1.5">{row.date}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.giftIncome.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.commission.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums text-rose-200">{row.bonusCost.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums text-emerald-200 font-medium">{row.netIncome.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator page={revenuePage} total={revenueData.length} pageSize={PS} borderColor="border-emerald-600/60"
                  onPrev={() => setRevenuePage(p => Math.max(1, p - 1))} onNext={() => setRevenuePage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 禮物銷售趨勢 */}
          {econSub === 'gift_trend' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => handleExport('禮物銷售趨勢')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              {/* CSS bar chart */}
              <div className="rounded-xl border border-emerald-600/40 bg-slate-900/80 p-3">
                <div className="mb-1 text-[10px] text-emerald-200/80">禮物銷售額趨勢（示意）</div>
                <div className="flex items-end gap-1 h-24">
                  {giftTrendData.map((row, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-emerald-500/60" style={{ height: `${(row.total / 30000) * 88}px` }} />
                      <span className="text-[9px] text-emerald-200/70">{row.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-emerald-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-emerald-100">
                    <tr>
                      {['日期', '銷售筆數', '銷售總額', 'Top 禮物'].map(h => (
                        <th key={h} className="border-b border-emerald-600/60 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {giftTrendData.slice((giftTrendPage - 1) * PS, giftTrendPage * PS).map((row, i) => (
                      <tr key={i} className="border-b border-emerald-600/30 text-emerald-50 last:border-b-0">
                        <td className="px-3 py-1.5">{row.date}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.count.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums text-emerald-200">{row.total.toLocaleString()}</td>
                        <td className="px-3 py-1.5">{row.topGift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator page={giftTrendPage} total={giftTrendData.length} pageSize={PS} borderColor="border-emerald-600/60"
                  onPrev={() => setGiftTrendPage(p => Math.max(1, p - 1))} onNext={() => setGiftTrendPage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 今日摘要 */}
          {econSub === 'today' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-600/60 bg-slate-900/80 p-4 text-[11px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-100">今日平台摘要</span>
                  <button type="button"
                    onClick={() => showAlert('今日摘要（示意）：\n新增用戶：182\n活躍直播：24\n禮物收入：68,500 PHP\nBonus 發放：9,500\n充值總額：120,000 PHP\n提領總額：42,000 PHP')}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500">
                    <Copy className="h-3 w-3" />複製今日摘要
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { icon: <Users className="h-4 w-4 text-sky-400" />, label: '新增用戶', val: '182', color: 'border-sky-600/60 bg-sky-500/10' },
                    { icon: <Radio className="h-4 w-4 text-violet-400" />, label: '活躍直播', val: '24 場', color: 'border-violet-600/60 bg-violet-500/10' },
                    { icon: <Gift className="h-4 w-4 text-amber-400" />, label: '禮物收入', val: '68,500 PHP', color: 'border-amber-600/60 bg-amber-500/10' },
                    { icon: <Coins className="h-4 w-4 text-indigo-400" />, label: 'Bonus 發放', val: '9,500', color: 'border-indigo-600/60 bg-indigo-500/10' },
                    { icon: <ArrowDownCircle className="h-4 w-4 text-emerald-400" />, label: '充值總額', val: '120,000 PHP', color: 'border-emerald-600/60 bg-emerald-500/10' },
                    { icon: <ArrowUpCircle className="h-4 w-4 text-rose-400" />, label: '提領總額', val: '42,000 PHP', color: 'border-rose-600/60 bg-rose-500/10' },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center gap-3 rounded-xl border p-3 ${item.color}`}>
                      {item.icon}
                      <div>
                        <div className="text-[10px] text-slate-400">{item.label}</div>
                        <div className="font-semibold text-slate-100">{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 直播報表 ─────────────────────────────────────────────────────── */}
      {activeTab === 'live' && (
        <section className="space-y-3 rounded-2xl border border-violet-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-semibold">直播報表</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
              <SubTabBtn active={liveSub === 'earnings'} label="收益統計" color="bg-violet-600" onClick={() => setLiveSub('earnings')} />
              <SubTabBtn active={liveSub === 'market'} label="押注統計" color="bg-violet-600" onClick={() => setLiveSub('market')} />
              <SubTabBtn active={liveSub === 'history'} label="主播歷史" color="bg-violet-600" onClick={() => setLiveSub('history')} />
            </div>
          </header>

          {/* 收益統計 */}
          {liveSub === 'earnings' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => handleExport('直播收益統計')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-violet-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-violet-100">
                    <tr>
                      {['直播 ID', '主播', '開始時間', '時長', '禮物收入', '平台抽成', '主播淨收', 'Top 禮物'].map(h => (
                        <th key={h} className="border-b border-violet-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveEarningsData.slice((liveEarningsPage - 1) * PS, liveEarningsPage * PS).map((row, i) => (
                      <tr key={i} className="border-b border-violet-600/30 text-violet-50 last:border-b-0">
                        <td className="px-2 py-1.5 font-medium">{row.liveId}</td>
                        <td className="px-2 py-1.5">{row.host}</td>
                        <td className="px-2 py-1.5 text-[10px] text-violet-100/70">{row.startTime}</td>
                        <td className="px-2 py-1.5">{row.duration}</td>
                        <td className="px-2 py-1.5 tabular-nums text-amber-200">{row.giftIncome.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.commission.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-emerald-200">{row.hostNet.toLocaleString()}</td>
                        <td className="px-2 py-1.5">{row.topGift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator page={liveEarningsPage} total={liveEarningsData.length} pageSize={PS} borderColor="border-violet-600/60"
                  onPrev={() => setLiveEarningsPage(p => Math.max(1, p - 1))} onNext={() => setLiveEarningsPage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 押注統計 */}
          {liveSub === 'market' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => handleExport('市場押注統計')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-violet-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-violet-100">
                    <tr>
                      {['市場 ID', '標題', 'YES 押注', 'NO 押注', '參與人數', '狀態', '結算勝者'].map(h => (
                        <th key={h} className="border-b border-violet-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marketBetData.slice((marketPage - 1) * PS, marketPage * PS).map((row, i) => (
                      <tr key={i} className="border-b border-violet-600/30 text-violet-50 last:border-b-0">
                        <td className="px-2 py-1.5 font-medium">{row.marketId}</td>
                        <td className="px-2 py-1.5">{row.title}</td>
                        <td className="px-2 py-1.5 tabular-nums text-emerald-200">{row.yesBet.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-rose-200">{row.noBet.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.participants}</td>
                        <td className="px-2 py-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.status === '已結算' ? 'bg-emerald-500/30 text-emerald-50' : 'bg-amber-500/30 text-amber-50'}`}>{row.status}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          {row.winner !== '—' ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.winner === 'YES' ? 'bg-emerald-600/40 text-emerald-50' : 'bg-rose-600/40 text-rose-50'}`}>{row.winner}</span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator page={marketPage} total={marketBetData.length} pageSize={PS} borderColor="border-violet-600/60"
                  onPrev={() => setMarketPage(p => Math.max(1, p - 1))} onNext={() => setMarketPage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 主播歷史 */}
          {liveSub === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px]">
                <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input value={hostSearch} onChange={e => setHostSearch(e.target.value)}
                    placeholder="主播 ID 或名稱"
                    className="bg-transparent outline-none text-[11px] text-slate-100 placeholder:text-slate-500" />
                </div>
                <span className="text-[10px] text-slate-500">預設顯示 alice 的直播歷史</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-violet-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-violet-100">
                    <tr>
                      {['場次 ID', '標題', '時間', '時長', '觀眾數', '禮物收入'].map(h => (
                        <th key={h} className="border-b border-violet-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hostHistoryData.map((row, i) => (
                      <tr key={i} className="border-b border-violet-600/30 text-violet-50 last:border-b-0">
                        <td className="px-2 py-1.5 font-medium">{row.sessionId}</td>
                        <td className="px-2 py-1.5">{row.title}</td>
                        <td className="px-2 py-1.5 text-[10px] text-violet-100/70">{row.time}</td>
                        <td className="px-2 py-1.5">{row.duration}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.viewers.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-amber-200">{row.giftIncome.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}


      {/* ── 行銷報表 ─────────────────────────────────────────────────────── */}
      {activeTab === 'marketing' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">行銷報表</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
              {([['campaign','活動成效'],['coupon','優惠券使用'],['referral','推薦分潤']] as [MarketingSubTab, string][]).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setMktSub(id)}
                  className={['rounded-full px-2 py-0.5 text-[10px]', mktSub === id ? 'bg-amber-600 text-white' : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
          </header>

          {/* 活動成效 */}
          {mktSub === 'campaign' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => handleExport('活動成效報表')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-amber-100">
                    <tr>
                      {['#', '活動名稱', '類型', '參與人數', '達標人數', '達標率', '發放 Bonus', '轉化率'].map(h => (
                        <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaignData.slice((campaignPage - 1) * PS, campaignPage * PS).map((row, i) => (
                      <tr key={i} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                        <td className="px-2 py-1.5 text-slate-300">{(campaignPage - 1) * PS + i + 1}</td>
                        <td className="px-2 py-1.5 font-medium">{row.name}</td>
                        <td className="px-2 py-1.5">
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-50">{row.type}</span>
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">{row.participants.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-emerald-200">{row.achieved.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.achieveRate}%</td>
                        <td className="px-2 py-1.5 tabular-nums text-indigo-200">{row.bonusGiven.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.convRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator page={campaignPage} total={campaignData.length} pageSize={PS} borderColor="border-amber-600/60"
                  onPrev={() => setCampaignPage(p => Math.max(1, p - 1))} onNext={() => setCampaignPage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 優惠券 */}
          {mktSub === 'coupon' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => handleExport('優惠券使用報表')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-amber-100">
                    <tr>
                      {['#', '券名稱', '類型', '發行量', '已用數', '使用率', '成功', '失敗', '撤銷'].map(h => (
                        <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {couponData.map((row, i) => (
                      <tr key={i} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                        <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                        <td className="px-2 py-1.5 font-medium">{row.name}</td>
                        <td className="px-2 py-1.5">
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px]">{row.type}</span>
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">{row.issued.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.used.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.useRate}%</td>
                        <td className="px-2 py-1.5 tabular-nums text-emerald-200">{row.success.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-rose-200">{row.failed}</td>
                        <td className="px-2 py-1.5 tabular-nums text-slate-400">{row.cancelled}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 推薦分潤 */}
          {mktSub === 'referral' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => handleExport('推薦分潤報表')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-amber-100">
                    <tr>
                      {['#', '方案名稱', '推薦關係數', '已發分潤', '回滾數', '回滾率'].map(h => (
                        <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referralData.map((row, i) => (
                      <tr key={i} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                        <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                        <td className="px-2 py-1.5 font-medium">{row.plan}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.relations.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-emerald-200">{row.bonusPaid.toLocaleString()}</td>
                        <td className="px-2 py-1.5 tabular-nums text-rose-200">{row.rollbacks}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.rollbackRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 支付報表 ─────────────────────────────────────────────────────── */}
      {activeTab === 'payment' && (
        <section className="space-y-3 rounded-2xl border border-rose-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold">支付報表</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
              <button type="button" onClick={() => setPaySub('reconcile')}
                className={['rounded-full px-2 py-0.5 text-[10px]', paySub === 'reconcile' ? 'bg-rose-600 text-white' : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
                充值提領對帳
              </button>
              <button type="button" onClick={() => setPaySub('analysis')}
                className={['rounded-full px-2 py-0.5 text-[10px]', paySub === 'analysis' ? 'bg-rose-600 text-white' : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
                支付處理分析
              </button>
            </div>
          </header>

          {/* 充值提領對帳 */}
          {paySub === 'reconcile' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
                  <button type="button" onClick={() => setPayRange('7d')}
                    className={['rounded-full px-2 py-0.5 text-[10px]', payRange === '7d' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-slate-800'].join(' ')}>7日</button>
                  <button type="button" onClick={() => setPayRange('30d')}
                    className={['rounded-full px-2 py-0.5 text-[10px]', payRange === '30d' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-slate-800'].join(' ')}>30日</button>
                </div>
                <button type="button" onClick={() => handleExport('充值提領對帳')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-rose-100">
                    <tr>
                      {['日期', '充值筆數', '充值總額', '提領筆數', '提領總額', '淨流入'].map(h => (
                        <th key={h} className="border-b border-rose-600/60 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payRecData.slice((payRecPage - 1) * PS, payRecPage * PS).map((row, i) => (
                      <tr key={i} className="border-b border-rose-600/30 text-rose-50 last:border-b-0">
                        <td className="px-3 py-1.5">{row.date}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.depCount}</td>
                        <td className="px-3 py-1.5 tabular-nums text-emerald-200">{row.depTotal.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.wdlCount}</td>
                        <td className="px-3 py-1.5 tabular-nums text-rose-200">{row.wdlTotal.toLocaleString()}</td>
                        <td className={`px-3 py-1.5 tabular-nums font-medium ${row.netIn >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                          {row.netIn >= 0 ? '+' : ''}{row.netIn.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator page={payRecPage} total={payRecData.length} pageSize={PS} borderColor="border-rose-600/60"
                  onPrev={() => setPayRecPage(p => Math.max(1, p - 1))} onNext={() => setPayRecPage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 支付處理分析 */}
          {paySub === 'analysis' && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-rose-100">
                    <tr>
                      {['支付通道', '平均處理時間', '成功率', '失敗數', '失敗原因 Top1'].map(h => (
                        <th key={h} className="border-b border-rose-600/60 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payAnalysisData.map((row, i) => (
                      <tr key={i} className="border-b border-rose-600/30 text-rose-50 last:border-b-0">
                        <td className="px-3 py-1.5 font-medium">{row.channel}</td>
                        <td className="px-3 py-1.5 tabular-nums">
                          {row.avgMs < 60000 ? `${row.avgMs} ms` : row.avgMs < 3600000 ? `${Math.round(row.avgMs / 60000)} 分鐘` : `${Math.round(row.avgMs / 3600000)} 小時`}
                        </td>
                        <td className="px-3 py-1.5 tabular-nums">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.successRate >= 98 ? 'bg-emerald-500/30 text-emerald-50' : row.successRate >= 95 ? 'bg-amber-500/30 text-amber-50' : 'bg-rose-500/30 text-rose-50'}`}>
                            {row.successRate}%
                          </span>
                        </td>
                        <td className="px-3 py-1.5 tabular-nums text-rose-200">{row.failCount}</td>
                        <td className="px-3 py-1.5 text-[10px] text-rose-100/80">{row.topFailReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Bonus 報表 ───────────────────────────────────────────────────── */}
      {activeTab === 'bonus' && (
        <section className="space-y-3 rounded-2xl border border-indigo-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold">Bonus 報表</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
              {([['issuance','發放報表'],['ledger','流水報表'],['redeem','兌換報表']] as [BonusSubTab, string][]).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setBonusSub(id)}
                  className={['rounded-full px-2 py-0.5 text-[10px]', bonusSub === id ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
          </header>

          {/* 發放報表 */}
          {bonusSub === 'issuance' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => handleExport('Bonus 發放報表')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-indigo-100">
                    <tr>
                      {['#', '來源類型', '發放任務數', '發放總量', '影響用戶數', '平均每人'].map(h => (
                        <th key={h} className="border-b border-indigo-600/60 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bonusIssuanceData.slice((bonusIssuancePage - 1) * PS, bonusIssuancePage * PS).map((row, i) => (
                      <tr key={i} className="border-b border-indigo-600/30 text-indigo-50 last:border-b-0">
                        <td className="px-3 py-1.5 text-slate-300">{(bonusIssuancePage - 1) * PS + i + 1}</td>
                        <td className="px-3 py-1.5 font-medium">
                          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px]">{row.source}</span>
                        </td>
                        <td className="px-3 py-1.5 tabular-nums">{row.tasks}</td>
                        <td className="px-3 py-1.5 tabular-nums text-indigo-200">{row.total.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.users.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums text-emerald-200">{row.avgPerUser}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator page={bonusIssuancePage} total={bonusIssuanceData.length} pageSize={PS} borderColor="border-indigo-600/60"
                  onPrev={() => setBonusIssuancePage(p => Math.max(1, p - 1))} onNext={() => setBonusIssuancePage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 流水報表 */}
          {bonusSub === 'ledger' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <select value={bonusLedgerDir} onChange={e => setBonusLedgerDir(e.target.value)}
                  className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                  <option value="all">全部方向</option>
                  <option value="發放">發放</option>
                  <option value="扣回">扣回</option>
                </select>
                <select value={bonusLedgerTier} onChange={e => setBonusLedgerTier(e.target.value)}
                  className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                  <option value="all">全部等級</option>
                  <option value="GOLD">金</option>
                  <option value="SILVER">銀</option>
                  <option value="BRONZE">銅</option>
                  <option value="IRON">鐵</option>
                  <option value="STONE">石</option>
                </select>
                <button type="button" onClick={() => handleExport('Bonus 流水報表')}
                  className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-indigo-100">
                    <tr>
                      {['日期', '發放量', '扣回量', '淨發放', '涉及用戶數'].map(h => (
                        <th key={h} className="border-b border-indigo-600/60 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBonusLedger.slice((bonusLedgerPage - 1) * PS, bonusLedgerPage * PS).map((row, i) => (
                      <tr key={i} className="border-b border-indigo-600/30 text-indigo-50 last:border-b-0">
                        <td className="px-3 py-1.5">{row.date}</td>
                        <td className="px-3 py-1.5 tabular-nums text-emerald-200">+{row.issued.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums text-rose-200">-{row.deducted.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums font-medium text-indigo-200">{row.net.toLocaleString()}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.users.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator page={bonusLedgerPage} total={filteredBonusLedger.length} pageSize={PS} borderColor="border-indigo-600/60"
                  onPrev={() => setBonusLedgerPage(p => Math.max(1, p - 1))} onNext={() => setBonusLedgerPage(p => p + 1)} />
              </div>
            </div>
          )}

          {/* 兌換報表 */}
          {bonusSub === 'redeem' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => handleExport('Bonus 兌換報表')}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">
                  <FileDown className="h-3 w-3" />匯出 CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/90 text-indigo-100">
                    <tr>
                      {['#', '等級', '申請數', '成功數', '失敗數', '撤銷數', '成功率', '兌換總 Bonus'].map(h => (
                        <th key={h} className="border-b border-indigo-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bonusRedeemData.slice((bonusRedeemPage - 1) * PS, bonusRedeemPage * PS).map((row, i) => (
                      <tr key={i} className="border-b border-indigo-600/30 text-indigo-50 last:border-b-0">
                        <td className="px-2 py-1.5 text-slate-300">{(bonusRedeemPage - 1) * PS + i + 1}</td>
                        <td className="px-2 py-1.5 font-medium">{row.tier}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.applied}</td>
                        <td className="px-2 py-1.5 tabular-nums text-emerald-200">{row.success}</td>
                        <td className="px-2 py-1.5 tabular-nums text-rose-200">{row.failed}</td>
                        <td className="px-2 py-1.5 tabular-nums text-slate-400">{row.cancelled}</td>
                        <td className="px-2 py-1.5 tabular-nums">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.successRate >= 95 ? 'bg-emerald-500/30 text-emerald-50' : 'bg-amber-500/30 text-amber-50'}`}>{row.successRate}%</span>
                        </td>
                        <td className="px-2 py-1.5 tabular-nums text-indigo-200">{row.totalBonus.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator page={bonusRedeemPage} total={bonusRedeemData.length} pageSize={PS} borderColor="border-indigo-600/60"
                  onPrev={() => setBonusRedeemPage(p => Math.max(1, p - 1))} onNext={() => setBonusRedeemPage(p => p + 1)} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 功能清單 ─────────────────────────────────────────────────────── */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="報表中心功能清單"
          subtitle="整合全平台報表規格，供 PM / 技術 / 財務 / 營運對齊使用。"
          items={blueprintFeatures}
        />
      )}
    </div>
  )
}

// ─── Blueprint Features ───────────────────────────────────────────────────────

const blueprintFeatures: FeatureItem[] = [
  { id: 101, name: '報表總覽 Dashboard', description: '一頁整合 7 大報表分類入口，快速瀏覽關鍵指標與一鍵進入子報表。', tag: '總覽' },
  { id: 102, name: '用戶每日增長報表', description: '追蹤每日新增與活躍用戶，支援時間範圍切換與趨勢圖表。', tag: '用戶' },
  { id: 103, name: '用戶餘額總覽', description: '查看所有用戶點數與 Bonus 餘額，支援搜尋篩選與匯出。', tag: '用戶' },
  { id: 104, name: '用戶送禮記錄', description: '記錄每筆送禮流水，支援禮物類型篩選、金額換算與匯出。', tag: '用戶' },
  { id: 105, name: '用戶交易記錄', description: '涵蓋充值 / 消費 / 送禮 / Bonus 等全部交易類型，支援多維篩選。', tag: '用戶' },
  { id: 106, name: '平台總收益報表', description: '按日統計禮物收入、抽成、Bonus 成本與淨收入，提供 KPI 卡片。', tag: '經濟' },
  { id: 107, name: '禮物銷售趨勢', description: '視覺化每日禮物銷售額，展示 Top 禮物排行。', tag: '經濟' },
  { id: 108, name: '今日平台摘要', description: '一鍵複製今日所有關鍵指標，方便每日彙報使用。', tag: '經濟' },
  { id: 109, name: '直播收益統計', description: '按場次統計禮物收入、抽成與主播淨收，支援排序與匯出。', tag: '直播' },
  { id: 110, name: '市場押注統計', description: '記錄各預測市場的押注資料與結算情況。', tag: '直播' },
  { id: 111, name: '主播直播歷史', description: '查看指定主播的歷史場次資料，支援搜尋。', tag: '直播' },
  { id: 112, name: '活動成效報表', description: '追蹤活動參與人數、達標率與 Bonus 轉化效果。', tag: '行銷' },
  { id: 113, name: '優惠券使用報表', description: '統計各優惠券的發行量、使用率與成功 / 失敗 / 撤銷情況。', tag: '行銷' },
  { id: 114, name: '推薦分潤報表', description: '顯示各推薦計畫的分潤發放量與回滾比例。', tag: '行銷' },
  { id: 115, name: '充值 / 提領對帳', description: '按日統計充值與提領資金流向，計算淨流入。', tag: '支付' },
  { id: 116, name: '支付處理分析', description: '評估各支付通道的處理速度、成功率與失敗原因分析。', tag: '支付' },
  { id: 117, name: 'Bonus 發放報表', description: '按來源類型統計發放任務數、發放總量與影響用戶數。', tag: 'Bonus' },
  { id: 118, name: 'Bonus 流水報表', description: '按日追蹤 Bonus 發放與扣回量，計算淨發放與涉及用戶數。', tag: 'Bonus' },
  { id: 119, name: 'Bonus 兌換報表', description: '按等級統計兌換申請數量、成功率與兌換總量，評估各等級兌換成效。', tag: 'Bonus' },
  { id: 120, name: 'CSV 全域匯出', description: '所有報表均支援 CSV 匯出，方便財務對帳與進一步資料分析。', tag: '匯出' },
]

export default ReportsPage
