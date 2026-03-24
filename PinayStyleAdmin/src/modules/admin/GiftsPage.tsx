/**
 * @file GiftsPage.tsx
 * @description 禮物管理工作台（目錄、銷售統計、批量管理、功能清單）
 */

import { showAlert, showConfirm } from '../../lib/dialog'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Gift,
  PlusCircle,
  Search,
  Filter,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Package,
  TrendingUp,
  Star,
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Layers,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Types ────────────────────────────────────────────────────────────────────

type GiftsTabId = 'overview' | 'catalogue' | 'stats' | 'batch' | 'blueprint'

type GiftType = '普通' | '稀有' | '傳說'
type GiftStatus = 'active' | 'inactive' | 'deleted'

interface GiftItem {
  id: string
  emoji: string
  name: string
  type: GiftType
  price: number
  platformRate: number   // platform cut % (e.g. 30)
  status: GiftStatus
  monthlySales: number
  animationDesc?: string
  usageScenes?: string[]
  createdAt: string
  updatedAt: string
}

interface GiftFormState {
  emoji: string
  name: string
  type: GiftType
  price: string
  platformRate: string
  animationDesc: string
  usageScenes: string
  status: 'active' | 'inactive'
}

interface GiftSalesStat {
  giftId: string
  giftName: string
  emoji: string
  type: GiftType
  salesCount: number
  salesCoins: number
  platformCut: number
  hostNet: number
  percentage: number
}

interface HostGiftRank {
  rank: number
  hostName: string
  giftCount: number
  hostNetPHP: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ts(offsetHours = 0): string {
  const d = new Date(Date.now() - offsetHours * 3_600_000)
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function hostNetRate(platformRate: number): number {
  return 100 - platformRate
}

function typeLabel(type: GiftType): string {
  return type
}

function typeBadgeClass(type: GiftType): string {
  if (type === '傳說') return 'bg-amber-500/30 text-amber-100'
  if (type === '稀有') return 'bg-violet-500/30 text-violet-100'
  return 'bg-slate-600/40 text-slate-200'
}

function statusLabel(status: GiftStatus): string {
  if (status === 'active') return '上架中'
  if (status === 'inactive') return '下架中'
  return '已刪除'
}

function statusBadgeClass(status: GiftStatus): string {
  if (status === 'active') return 'bg-emerald-500/30 text-emerald-100'
  if (status === 'inactive') return 'bg-slate-600/40 text-slate-300'
  return 'bg-rose-500/30 text-rose-100'
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function createInitialGifts(): GiftItem[] {
  return [
    {
      id: 'GIFT-001',
      emoji: '🌹',
      name: '玫瑰',
      type: '普通',
      price: 10,
      platformRate: 30,
      status: 'active',
      monthlySales: 842,
      animationDesc: '玫瑰花瓣飄落動效，持續 2 秒。',
      usageScenes: ['一般直播', '特殊活動'],
      createdAt: ts(720),
      updatedAt: ts(24),
    },
    {
      id: 'GIFT-002',
      emoji: '💎',
      name: '鑽石',
      type: '稀有',
      price: 50,
      platformRate: 30,
      status: 'active',
      monthlySales: 317,
      animationDesc: '鑽石旋轉閃爍特效，持續 3 秒。',
      usageScenes: ['一般直播', '週年活動'],
      createdAt: ts(600),
      updatedAt: ts(48),
    },
    {
      id: 'GIFT-003',
      emoji: '🚀',
      name: '火箭',
      type: '傳說',
      price: 500,
      platformRate: 25,
      status: 'active',
      monthlySales: 58,
      animationDesc: '全螢幕火箭升空爆炸動效，持續 5 秒。',
      usageScenes: ['特殊活動', '慶典直播'],
      createdAt: ts(500),
      updatedAt: ts(72),
    },
    {
      id: 'GIFT-004',
      emoji: '🎂',
      name: '蛋糕',
      type: '普通',
      price: 20,
      platformRate: 30,
      status: 'active',
      monthlySales: 453,
      animationDesc: '生日蛋糕出現並閃爍蠟燭，持續 2.5 秒。',
      usageScenes: ['生日慶典'],
      createdAt: ts(450),
      updatedAt: ts(100),
    },
    {
      id: 'GIFT-005',
      emoji: '👑',
      name: '皇冠',
      type: '稀有',
      price: 100,
      platformRate: 28,
      status: 'active',
      monthlySales: 189,
      animationDesc: '皇冠緩緩降落至主播頭頂，持續 4 秒。',
      usageScenes: ['一般直播', '頂點挑戰'],
      createdAt: ts(400),
      updatedAt: ts(120),
    },
    {
      id: 'GIFT-006',
      emoji: '🌈',
      name: '彩虹',
      type: '傳說',
      price: 1000,
      platformRate: 20,
      status: 'active',
      monthlySales: 12,
      animationDesc: '彩虹橫跨全螢幕並出現光粒特效，持續 6 秒。',
      usageScenes: ['超級慶典'],
      createdAt: ts(350),
      updatedAt: ts(200),
    },
    {
      id: 'GIFT-007',
      emoji: '🍀',
      name: '幸運草',
      type: '普通',
      price: 15,
      platformRate: 30,
      status: 'active',
      monthlySales: 621,
      animationDesc: '四葉幸運草旋轉飄散特效，持續 2 秒。',
      usageScenes: ['一般直播'],
      createdAt: ts(300),
      updatedAt: ts(300),
    },
    {
      id: 'GIFT-008',
      emoji: '❤️',
      name: '愛心',
      type: '普通',
      price: 5,
      platformRate: 30,
      status: 'inactive',
      monthlySales: 0,
      animationDesc: '心型動效彈出，持續 1.5 秒。',
      usageScenes: ['一般直播'],
      createdAt: ts(200),
      updatedAt: ts(400),
    },
  ]
}

function createSalesStats(gifts: GiftItem[]): GiftSalesStat[] {
  const totalSales = gifts.reduce((s, g) => s + g.monthlySales * g.price, 0) || 1
  return gifts
    .map((g) => {
      const salesCoins = g.monthlySales * g.price
      const platformCut = Math.round(salesCoins * g.platformRate / 100)
      const hostNet = salesCoins - platformCut
      return {
        giftId: g.id,
        giftName: g.name,
        emoji: g.emoji,
        type: g.type,
        salesCount: g.monthlySales,
        salesCoins,
        platformCut,
        hostNet,
        percentage: Math.round((salesCoins / totalSales) * 100 * 10) / 10,
      }
    })
    .sort((a, b) => b.salesCoins - a.salesCoins)
}

const mockHostRanks: HostGiftRank[] = [
  { rank: 1, hostName: 'Maria Santos', giftCount: 1283, hostNetPHP: 48520 },
  { rank: 2, hostName: 'Ana Reyes', giftCount: 975, hostNetPHP: 32100 },
  { rank: 3, hostName: 'Jessica Cruz', giftCount: 812, hostNetPHP: 27450 },
  { rank: 4, hostName: 'Grace Lim', giftCount: 634, hostNetPHP: 19800 },
  { rank: 5, hostName: 'Lovely Tan', giftCount: 521, hostNetPHP: 15300 },
]

const rankMedals = ['🥇', '🥈', '🥉']

// ─── Main Component ───────────────────────────────────────────────────────────

export function GiftsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<GiftsTabId>('overview')

  // ── Gift catalogue state ──
  const [gifts, setGifts] = useState<GiftItem[]>(() => createInitialGifts())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null)
  const [giftForm, setGiftForm] = useState<GiftFormState | null>(null)

  // Catalogue filters
  const [catStatusFilter, setCatStatusFilter] = useState<'全部' | GiftStatus>('全部')
  const [catTypeFilter, setCatTypeFilter] = useState<'全部' | GiftType>('全部')
  const [catSearch, setCatSearch] = useState('')
  const [catPage, setCatPage] = useState(1)
  const pageSize = 5

  // Stats state
  const [statsRange, setStatsRange] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [statsPage, setStatsPage] = useState(1)

  // Batch state
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set())

  // ── Derived data ──
  const salesStats = useMemo(() => createSalesStats(gifts), [gifts])

  const filteredGifts = useMemo(() => {
    return gifts.filter((g) => {
      if (catStatusFilter !== '全部' && g.status !== catStatusFilter) return false
      if (catTypeFilter !== '全部' && g.type !== catTypeFilter) return false
      if (catSearch) {
        const q = catSearch.toLowerCase()
        if (!g.name.toLowerCase().includes(q) && !g.emoji.includes(q)) return false
      }
      return true
    })
  }, [gifts, catStatusFilter, catTypeFilter, catSearch])

  const catTotalPages = Math.max(1, Math.ceil(filteredGifts.length / pageSize))
  const paginatedGifts = useMemo(() => {
    const start = (catPage - 1) * pageSize
    return filteredGifts.slice(start, start + pageSize)
  }, [filteredGifts, catPage])

  const statsTotalPages = Math.max(1, Math.ceil(salesStats.length / pageSize))
  const paginatedStats = useMemo(() => {
    const start = (statsPage - 1) * pageSize
    return salesStats.slice(start, start + pageSize)
  }, [salesStats, statsPage])

  // ── Overview KPIs ──
  const overviewKpis = useMemo(() => {
    const active = gifts.filter((g) => g.status === 'active')
    const todayTx = active.reduce((s, g) => s + Math.round(g.monthlySales / 30), 0)
    const todayRevPHP = active.reduce((s, g) => s + Math.round((g.monthlySales / 30) * g.price * 0.005), 0)
    const monthRevPHP = active.reduce((s, g) => s + Math.round(g.monthlySales * g.price * 0.005), 0)
    const topGift = [...active].sort((a, b) => b.monthlySales - a.monthlySales)[0]
    const platformCut = active.reduce((s, g) => s + Math.round(g.monthlySales * g.price * (g.platformRate / 100) * 0.005), 0)
    return {
      activeCount: active.length,
      todayTx,
      todayRevPHP,
      monthRevPHP,
      topGiftName: topGift ? `${topGift.emoji} ${topGift.name}` : '—',
      platformCut,
    }
  }, [gifts])

  // Batch stats
  const batchStats = useMemo(() => ({
    active: gifts.filter((g) => g.status === 'active').length,
    inactive: gifts.filter((g) => g.status === 'inactive').length,
    deleted: gifts.filter((g) => g.status === 'deleted').length,
  }), [gifts])

  // ── Handlers ──

  function openCreateDrawer() {
    setEditingGift(null)
    setGiftForm({
      emoji: '',
      name: '',
      type: '普通',
      price: '',
      platformRate: '30',
      animationDesc: '',
      usageScenes: '',
      status: 'active',
    })
    setDrawerOpen(true)
  }

  function openEditDrawer(gift: GiftItem) {
    setEditingGift(gift)
    setGiftForm({
      emoji: gift.emoji,
      name: gift.name,
      type: gift.type,
      price: String(gift.price),
      platformRate: String(gift.platformRate),
      animationDesc: gift.animationDesc ?? '',
      usageScenes: (gift.usageScenes ?? []).join(', '),
      status: gift.status === 'deleted' ? 'inactive' : gift.status,
    })
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingGift(null)
    setGiftForm(null)
  }

  async function handleSaveGift() {
    if (!giftForm) return

    const name = giftForm.name.trim()
    const emoji = giftForm.emoji.trim()
    if (!name || !emoji) {
      await showAlert('請填寫「禮物名稱」與「Emoji」。')
      return
    }
    const price = Number(giftForm.price)
    if (!price || Number.isNaN(price) || price <= 0) {
      await showAlert('請輸入大於 0 的「定價（Coins）」。')
      return
    }
    const platformRate = Number(giftForm.platformRate)
    if (Number.isNaN(platformRate) || platformRate < 0 || platformRate > 100) {
      await showAlert('平台抽成率需介於 0 ~ 100 之間。')
      return
    }

    const action = editingGift ? '更新' : '新增'
    const ok = await showConfirm(`確認${action}禮物「${emoji} ${name}」？\n定價：${price} Coins\n平台抽成率：${platformRate}%\n主播淨收入率：${hostNetRate(platformRate)}%`)
    if (!ok) return

    const now = ts()
    const usageScenes = giftForm.usageScenes.split(',').map((s) => s.trim()).filter(Boolean)

    if (editingGift) {
      setGifts((prev) =>
        prev.map((g) =>
          g.id === editingGift.id
            ? {
                ...g,
                emoji,
                name,
                type: giftForm.type,
                price,
                platformRate,
                status: giftForm.status,
                animationDesc: giftForm.animationDesc.trim() || undefined,
                usageScenes,
                updatedAt: now,
              }
            : g,
        ),
      )
    } else {
      const newGift: GiftItem = {
        id: `GIFT-${Date.now()}`,
        emoji,
        name,
        type: giftForm.type,
        price,
        platformRate,
        status: giftForm.status,
        monthlySales: 0,
        animationDesc: giftForm.animationDesc.trim() || undefined,
        usageScenes,
        createdAt: now,
        updatedAt: now,
      }
      setGifts((prev) => [newGift, ...prev])
    }

    await showAlert(`已成功${action}禮物「${emoji} ${name}」。`)
    closeDrawer()
  }

  async function handleToggleStatus(gift: GiftItem) {
    if (gift.status === 'deleted') return
    const isActive = gift.status === 'active'
    const action = isActive ? '下架' : '上架'
    const ok = await showConfirm(`確認將禮物「${gift.emoji} ${gift.name}」${action}？`)
    if (!ok) return
    setGifts((prev) =>
      prev.map((g) =>
        g.id === gift.id
          ? { ...g, status: isActive ? 'inactive' : 'active', updatedAt: ts() }
          : g,
      ),
    )
  }

  async function handleDeleteGift(gift: GiftItem) {
    const ok = await showConfirm(
      `⚠️ 確認刪除禮物「${gift.emoji} ${gift.name}」？\n\n此操作為高風險操作。歷史銷售記錄與流水將予以保留並標記「已刪除禮物」，不會消除。\n\n刪除後禮物狀態將標記為「已刪除」，無法再上架。`,
    )
    if (!ok) return
    setGifts((prev) =>
      prev.map((g) =>
        g.id === gift.id ? { ...g, status: 'deleted', updatedAt: ts() } : g,
      ),
    )
  }

  // ── Batch handlers ──

  function toggleBatchAll(checked: boolean) {
    if (checked) {
      setBatchSelected(new Set(gifts.filter((g) => g.status !== 'deleted').map((g) => g.id)))
    } else {
      setBatchSelected(new Set())
    }
  }

  function toggleBatchItem(id: string, checked: boolean) {
    setBatchSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleBatchActivate() {
    const ids = Array.from(batchSelected)
    const names = gifts.filter((g) => ids.includes(g.id)).map((g) => `${g.emoji} ${g.name}`).join('、')
    const ok = await showConfirm(`確認批量上架以下 ${ids.length} 個禮物？\n\n${names}`)
    if (!ok) return
    setGifts((prev) =>
      prev.map((g) =>
        ids.includes(g.id) && g.status !== 'deleted' ? { ...g, status: 'active', updatedAt: ts() } : g,
      ),
    )
    setBatchSelected(new Set())
    await showAlert(`已批量上架 ${ids.length} 個禮物。`)
  }

  async function handleBatchDeactivate() {
    const ids = Array.from(batchSelected)
    const names = gifts.filter((g) => ids.includes(g.id)).map((g) => `${g.emoji} ${g.name}`).join('、')
    const ok = await showConfirm(`確認批量下架以下 ${ids.length} 個禮物？\n\n${names}`)
    if (!ok) return
    setGifts((prev) =>
      prev.map((g) =>
        ids.includes(g.id) && g.status !== 'deleted' ? { ...g, status: 'inactive', updatedAt: ts() } : g,
      ),
    )
    setBatchSelected(new Set())
    await showAlert(`已批量下架 ${ids.length} 個禮物。`)
  }

  async function handleBatchDelete() {
    const ids = Array.from(batchSelected)
    const names = gifts.filter((g) => ids.includes(g.id)).map((g) => `${g.emoji} ${g.name}`).join('、')
    const ok = await showConfirm(
      `⚠️ 高風險操作：確認批量刪除以下 ${ids.length} 個禮物？\n\n${names}\n\n歷史銷售記錄將予以保留並標記「已刪除禮物」，不可逆。`,
    )
    if (!ok) return
    setGifts((prev) =>
      prev.map((g) =>
        ids.includes(g.id) ? { ...g, status: 'deleted', updatedAt: ts() } : g,
      ),
    )
    setBatchSelected(new Set())
    await showAlert(`已批量刪除 ${ids.length} 個禮物。`)
  }

  // ── Blueprint features ──
  const blueprintFeatures: FeatureItem[] = [
    {
      id: 48,
      name: '查看禮物列表',
      description: '展示所有禮物的 icon / 名稱 / 價格 / 狀態，支援排序與搜尋，並連動銷售統計。',
      tag: '列表',
    },
    {
      id: 49,
      name: '新增禮物',
      description: '設定名稱、emoji 或 icon、定價與狀態，建議在提交前顯示對應收益模擬。',
      tag: '新增',
    },
    {
      id: 50,
      name: '編輯禮物',
      description: '允許修改名稱 / 圖示 / 價格，對已售出禮物應採穩健策略並標記生效時間。',
      tag: '編輯',
    },
    {
      id: 51,
      name: '刪除禮物',
      description: '永久移除禮物（需二次確認），並顯示對歷史記錄的處理方式（保留 / 匿名化）。',
      tag: '高風險',
    },
    {
      id: 52,
      name: '上架 / 下架',
      description: '暫時停售或重新啟用禮物，狀態 Badge 與操作按鈕需在所有列表中保持一致。',
      tag: '上下架',
    },
    {
      id: 53,
      name: '批量上下架',
      description: '支援多選一鍵操作，應明確顯示受影響禮物數量與當前狀態變化。',
      tag: '批量',
    },
    {
      id: 54,
      name: '查看銷售統計',
      description: '各禮物購買次數 / 金額統計，建議搭配時間切換與 Top N 排行報表。',
      tag: '統計',
    },
  ]

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* Tab header */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <Gift className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-xs font-semibold text-slate-100">禮物管理</span>
          <span className="text-[10px] text-slate-500">
            目錄、抽成配置、銷售統計與批量管理。
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {(
            [
              { id: 'overview', label: t('common.overview') },
              { id: 'catalogue', label: t('tabs.giftCatalogue') },
              { id: 'stats', label: t('tabs.giftStats') },
              { id: 'batch', label: t('tabs.giftBatch') },
              { id: 'blueprint', label: t('common.blueprint') },
            ] as { id: GiftsTabId; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={[
                'rounded-full px-2 py-0.5',
                activeTab === id
                  ? id === 'catalogue'
                    ? 'bg-rose-600 text-white'
                    : id === 'stats'
                    ? 'bg-amber-600 text-white'
                    : id === 'batch'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-700 text-white'
                  : 'text-slate-200 hover:bg-slate-800/80',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Tab: 總覽 ── */}
      {activeTab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center gap-1.5 text-xs text-slate-200">
            <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold">禮物經濟總覽</span>
          </header>
          <div className="grid gap-3 md:grid-cols-3 text-[11px]">
            <div className="space-y-1 rounded-xl border border-slate-700/60 bg-slate-900/80 p-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Package className="h-3.5 w-3.5" />
                <span>禮物總數（上架中）</span>
              </div>
              <div className="text-2xl font-semibold text-slate-100">{overviewKpis.activeCount}</div>
              <p className="text-[10px] text-slate-500">目前上架且可被贈送的禮物種類數量。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-700/60 bg-slate-900/80 p-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Coins className="h-3.5 w-3.5" />
                <span>今日禮物交易筆數</span>
              </div>
              <div className="text-2xl font-semibold text-slate-100">{overviewKpis.todayTx.toLocaleString()}</div>
              <p className="text-[10px] text-slate-500">依本月銷售量推算今日預估交易筆數。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-700/60 bg-slate-900/80 p-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>今日禮物收入（PHP）</span>
              </div>
              <div className="text-2xl font-semibold text-slate-100">₱{overviewKpis.todayRevPHP.toLocaleString()}</div>
              <p className="text-[10px] text-slate-500">以 1 Coin = 0.005 PHP 換算推算值（示意）。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-emerald-700/60 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <ArrowUpCircle className="h-3.5 w-3.5" />
                <span>本月累計收入（PHP）</span>
              </div>
              <div className="text-2xl font-semibold text-emerald-100">₱{overviewKpis.monthRevPHP.toLocaleString()}</div>
              <p className="text-[10px] text-emerald-200/70">本月禮物總銷售額換算 PHP 後的累計值。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-amber-700/60 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Star className="h-3.5 w-3.5" />
                <span>最暢銷禮物</span>
              </div>
              <div className="text-2xl font-semibold text-amber-100">{overviewKpis.topGiftName}</div>
              <p className="text-[10px] text-amber-200/70">本月銷售次數最多的禮物。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-rose-700/60 bg-rose-500/10 p-3">
              <div className="flex items-center gap-1.5 text-rose-300">
                <ArrowDownCircle className="h-3.5 w-3.5" />
                <span>平台抽成收入（本月）</span>
              </div>
              <div className="text-2xl font-semibold text-rose-100">₱{overviewKpis.platformCut.toLocaleString()}</div>
              <p className="text-[10px] text-rose-200/70">依各禮物抽成率計算後的平台實際收益。</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Tab: 禮物目錄 ── */}
      {activeTab === 'catalogue' && (
        <section className="space-y-3 rounded-2xl border border-rose-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold">禮物目錄</span>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100">
                rose 色系 · 支援新增、編輯、上下架與刪除
              </span>
            </div>
            <button
              type="button"
              onClick={openCreateDrawer}
              className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-500"
            >
              <PlusCircle className="h-3 w-3" />
              新增禮物
            </button>
          </header>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="flex min-w-[200px] flex-1 items-center gap-1 rounded-full border border-rose-700/60 bg-slate-900/80 px-2 py-1">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={catSearch}
                onChange={(e) => { setCatSearch(e.target.value); setCatPage(1) }}
                placeholder="搜尋禮物名稱…"
                className="h-6 flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={catStatusFilter}
              onChange={(e) => { setCatStatusFilter(e.target.value as '全部' | GiftStatus); setCatPage(1) }}
              className="h-7 rounded-full border border-rose-700/60 bg-slate-900/80 px-2 text-[11px] text-slate-100"
            >
              <option value="全部">全部狀態</option>
              <option value="active">上架中</option>
              <option value="inactive">下架中</option>
              <option value="deleted">已刪除</option>
            </select>
            <select
              value={catTypeFilter}
              onChange={(e) => { setCatTypeFilter(e.target.value as '全部' | GiftType); setCatPage(1) }}
              className="h-7 rounded-full border border-rose-700/60 bg-slate-900/80 px-2 text-[11px] text-slate-100"
            >
              <option value="全部">全部類型</option>
              <option value="普通">普通</option>
              <option value="稀有">稀有</option>
              <option value="傳說">傳說</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-rose-100">
                <tr>
                  <th className="w-8 border-b border-rose-600/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">禮物 ID</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">Emoji</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">名稱</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">類型</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">定價</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">平台抽成</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">主播淨收</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">狀態</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">本月銷量</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGifts.map((gift, idx) => (
                  <tr key={gift.id} className="border-b border-rose-600/30 text-rose-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-400">{(catPage - 1) * pageSize + idx + 1}</td>
                    <td className="px-2 py-1.5 text-[10px] text-rose-100/70">{gift.id}</td>
                    <td className="px-2 py-1.5 text-lg">{gift.emoji}</td>
                    <td className="px-2 py-1.5 font-medium">{gift.name}</td>
                    <td className="px-2 py-1.5">
                      <span className={['rounded-full px-2 py-0.5 text-[10px]', typeBadgeClass(gift.type)].join(' ')}>
                        {typeLabel(gift.type)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{gift.price.toLocaleString()} Coins</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{gift.platformRate}%</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{hostNetRate(gift.platformRate)}%</td>
                    <td className="px-2 py-1.5">
                      <span className={['rounded-full px-2 py-0.5 text-[10px]', statusBadgeClass(gift.status)].join(' ')}>
                        {statusLabel(gift.status)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{gift.monthlySales.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(gift)}
                          disabled={gift.status === 'deleted'}
                          className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-rose-600/80 hover:text-white disabled:opacity-40"
                        >
                          <Edit3 className="h-3 w-3" />
                          編輯
                        </button>
                        {gift.status !== 'deleted' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(gift)}
                            className={[
                              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px]',
                              gift.status === 'active'
                                ? 'bg-slate-700/80 text-slate-200 hover:bg-slate-600'
                                : 'bg-emerald-600/80 text-white hover:bg-emerald-500',
                            ].join(' ')}
                          >
                            {gift.status === 'active' ? '下架' : '上架'}
                          </button>
                        )}
                        {gift.status !== 'deleted' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGift(gift)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-rose-700/60 px-2 py-0.5 text-[10px] text-rose-100 hover:bg-rose-600"
                          >
                            <Trash2 className="h-3 w-3" />
                            刪除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedGifts.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-center text-[11px] text-rose-100/80">
                      沒有符合條件的禮物。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-rose-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>共 {filteredGifts.length} 筆 · 每頁 {pageSize} 筆</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={catPage <= 1}
                  onClick={() => setCatPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" />
                  上一頁
                </button>
                <span>第 {catPage} / {catTotalPages} 頁</span>
                <button
                  type="button"
                  disabled={catPage >= catTotalPages}
                  onClick={() => setCatPage((p) => Math.min(catTotalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  下一頁
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* ── Tab: 銷售統計 ── */}
      {activeTab === 'stats' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center gap-1.5 text-xs text-slate-200">
            <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold">禮物銷售統計</span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100">amber 色系</span>
          </header>

          {/* Time range */}
          <div className="flex flex-wrap gap-1 text-[11px]">
            {(
              [
                { id: 'today', label: '今日' },
                { id: 'week', label: '本週' },
                { id: 'month', label: '本月' },
                { id: 'custom', label: '自訂' },
              ] as { id: typeof statsRange; label: string }[]
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatsRange(id)}
                className={[
                  'rounded-full px-3 py-1 text-[11px]',
                  statsRange === id
                    ? 'bg-amber-600 text-white'
                    : 'border border-amber-700/60 bg-slate-900/80 text-amber-100 hover:bg-amber-900/40',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
            {statsRange !== 'month' && (
              <span className="flex items-center text-[10px] text-slate-500">（目前僅顯示本月 Mock 數據）</span>
            )}
          </div>

          {/* Sales ranking table */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-amber-100">禮物銷售排行</div>
            <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
              <table className="min-w-full border-collapse text-[11px]">
                <thead className="bg-slate-900/90 text-amber-100">
                  <tr>
                    <th className="w-10 border-b border-amber-600/60 px-2 py-2 text-left">排名</th>
                    <th className="border-b border-amber-600/60 px-2 py-2 text-left">禮物</th>
                    <th className="border-b border-amber-600/60 px-2 py-2 text-left">類型</th>
                    <th className="border-b border-amber-600/60 px-2 py-2 text-right">銷售次數</th>
                    <th className="border-b border-amber-600/60 px-2 py-2 text-right">銷售金額(Coins)</th>
                    <th className="border-b border-amber-600/60 px-2 py-2 text-right">平台抽成</th>
                    <th className="border-b border-amber-600/60 px-2 py-2 text-right">主播淨收入</th>
                    <th className="border-b border-amber-600/60 px-2 py-2 text-right">佔比</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStats.map((stat, idx) => {
                    const globalRank = (statsPage - 1) * pageSize + idx + 1
                    const medal = rankMedals[globalRank - 1]
                    return (
                      <tr key={stat.giftId} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                        <td className="px-2 py-1.5 text-center">
                          {medal ? (
                            <span className="text-base">{medal}</span>
                          ) : (
                            <span className="text-slate-400">{globalRank}</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{stat.emoji}</span>
                            <span className="font-medium">{stat.giftName}</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={['rounded-full px-2 py-0.5 text-[10px]', typeBadgeClass(stat.type)].join(' ')}>
                            {stat.type}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{stat.salesCount.toLocaleString()}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{stat.salesCoins.toLocaleString()}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{stat.platformCut.toLocaleString()}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{stat.hostNet.toLocaleString()}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-100">
                            {stat.percentage}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <footer className="flex items-center justify-between border-t border-amber-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
                <div>共 {salesStats.length} 筆 · 每頁 {pageSize} 筆</div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={statsPage <= 1}
                    onClick={() => setStatsPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    上一頁
                  </button>
                  <span>第 {statsPage} / {statsTotalPages} 頁</span>
                  <button
                    type="button"
                    disabled={statsPage >= statsTotalPages}
                    onClick={() => setStatsPage((p) => Math.min(statsTotalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                  >
                    下一頁
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </footer>
            </div>
          </div>

          {/* Host gift income ranking */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-amber-100">主播禮物收入排行 Top 5</div>
            <div className="grid gap-2 md:grid-cols-5">
              {mockHostRanks.map((h) => (
                <div
                  key={h.rank}
                  className="flex flex-col items-center space-y-1 rounded-xl border border-amber-600/50 bg-amber-500/10 p-3 text-center"
                >
                  <div className="text-xl">{rankMedals[h.rank - 1] ?? `#${h.rank}`}</div>
                  <div className="text-[11px] font-semibold text-amber-50">{h.hostName}</div>
                  <div className="text-[10px] text-amber-200/80">收到 {h.giftCount.toLocaleString()} 次禮物</div>
                  <div className="text-[11px] font-bold text-amber-100">₱{h.hostNetPHP.toLocaleString()}</div>
                  <div className="text-[10px] text-amber-200/60">主播淨收入</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Tab: 批量管理 ── */}
      {activeTab === 'batch' && (
        <section className="space-y-3 rounded-2xl border border-violet-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-semibold">禮物批量管理</span>
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-100">violet 色系</span>
            </div>
            {/* Status summary */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-100">上架中 {batchStats.active}</span>
              <span className="rounded-full bg-slate-600/40 px-2 py-0.5 text-slate-300">下架中 {batchStats.inactive}</span>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-rose-100">已刪除 {batchStats.deleted}</span>
            </div>
          </header>

          {/* Batch action bar */}
          {batchSelected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-600/60 bg-violet-500/10 px-3 py-2 text-[11px]">
              <span className="text-violet-100 font-semibold">已選 {batchSelected.size} 項</span>
              <button
                type="button"
                onClick={handleBatchActivate}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] text-white hover:bg-emerald-500"
              >
                <Eye className="h-3 w-3" />
                批量上架
              </button>
              <button
                type="button"
                onClick={handleBatchDeactivate}
                className="inline-flex items-center gap-1 rounded-full bg-slate-600 px-2 py-1 text-[10px] text-white hover:bg-slate-500"
              >
                批量下架
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                className="inline-flex items-center gap-1 rounded-full bg-rose-700 px-2 py-1 text-[10px] text-white hover:bg-rose-600"
              >
                <Trash2 className="h-3 w-3" />
                批量刪除
              </button>
              <button
                type="button"
                onClick={() => setBatchSelected(new Set())}
                className="ml-auto text-[10px] text-slate-400 underline hover:text-slate-200"
              >
                清除選取
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-violet-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-violet-100">
                <tr>
                  <th className="w-8 border-b border-violet-600/60 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={
                        batchSelected.size > 0 &&
                        gifts.filter((g) => g.status !== 'deleted').every((g) => batchSelected.has(g.id))
                      }
                      onChange={(e) => toggleBatchAll(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-violet-600 bg-slate-900/80"
                    />
                  </th>
                  <th className="w-8 border-b border-violet-600/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">Emoji</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">名稱</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">類型</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-right">定價</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">狀態</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((gift, idx) => (
                  <tr key={gift.id} className="border-b border-violet-600/30 text-violet-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        disabled={gift.status === 'deleted'}
                        checked={batchSelected.has(gift.id)}
                        onChange={(e) => toggleBatchItem(gift.id, e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-violet-600 bg-slate-900/80 disabled:opacity-40"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-slate-400">{idx + 1}</td>
                    <td className="px-2 py-1.5 text-lg">{gift.emoji}</td>
                    <td className="px-2 py-1.5 font-medium">{gift.name}</td>
                    <td className="px-2 py-1.5">
                      <span className={['rounded-full px-2 py-0.5 text-[10px]', typeBadgeClass(gift.type)].join(' ')}>
                        {gift.type}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{gift.price.toLocaleString()} Coins</td>
                    <td className="px-2 py-1.5">
                      <span className={['rounded-full px-2 py-0.5 text-[10px]', statusBadgeClass(gift.status)].join(' ')}>
                        {statusLabel(gift.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Tab: 功能清單 ── */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="禮物管理功能清單"
          subtitle="將禮物作為平台核心商品來管理與分析。"
          items={blueprintFeatures}
        />
      )}

      {/* ── Drawer: 新增 / 編輯禮物 ── */}
      {drawerOpen && giftForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-rose-600/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-rose-600/60 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-rose-100">
                  <Gift className="h-3.5 w-3.5 text-rose-400" />
                  <span className="font-semibold">{editingGift ? '編輯禮物' : '新增禮物'}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-rose-200/80">
                  {editingGift
                    ? `${editingGift.emoji} ${editingGift.name}`
                    : '建立新的禮物並設定定價與抽成率。'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-700/80 bg-slate-900/80 text-rose-200 hover:border-rose-400 hover:text-rose-100"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-rose-50">
              <form
                className="space-y-3"
                onSubmit={(e) => { e.preventDefault(); handleSaveGift() }}
              >
                {/* Emoji */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">Emoji</label>
                  <input
                    value={giftForm.emoji}
                    onChange={(e) => setGiftForm((prev) => prev ? { ...prev, emoji: e.target.value } : prev)}
                    className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400"
                    placeholder="例如：🌹"
                    maxLength={4}
                  />
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">禮物名稱</label>
                  <input
                    value={giftForm.name}
                    onChange={(e) => setGiftForm((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                    className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400"
                    placeholder="例如：玫瑰"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">類型</label>
                  <select
                    value={giftForm.type}
                    onChange={(e) => setGiftForm((prev) => prev ? { ...prev, type: e.target.value as GiftType } : prev)}
                    className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400"
                  >
                    <option value="普通">普通</option>
                    <option value="稀有">稀有</option>
                    <option value="傳說">傳說</option>
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">定價（Coins）</label>
                  <input
                    value={giftForm.price}
                    onChange={(e) => setGiftForm((prev) => prev ? { ...prev, price: e.target.value } : prev)}
                    inputMode="numeric"
                    className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400"
                    placeholder="例如：50"
                  />
                </div>

                {/* Platform rate */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">平台抽成率（0–100%，預設 30%）</label>
                  <input
                    value={giftForm.platformRate}
                    onChange={(e) => setGiftForm((prev) => prev ? { ...prev, platformRate: e.target.value } : prev)}
                    inputMode="decimal"
                    className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400"
                    placeholder="30"
                  />
                  {/* Auto-calculated host net */}
                  {giftForm.platformRate !== '' && !Number.isNaN(Number(giftForm.platformRate)) && (
                    <div className="rounded-md border border-rose-800/60 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-100">
                      <span>主播淨收入率：</span>
                      <span className="font-semibold">{Math.max(0, 100 - Number(giftForm.platformRate))}%</span>
                      {giftForm.price !== '' && !Number.isNaN(Number(giftForm.price)) && Number(giftForm.price) > 0 && (
                        <span className="ml-2 text-rose-200/80">
                          （每筆交易主播淨得：{Math.round(Number(giftForm.price) * (100 - Number(giftForm.platformRate)) / 100)} Coins）
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Animation desc */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">動效描述</label>
                  <textarea
                    value={giftForm.animationDesc}
                    onChange={(e) => setGiftForm((prev) => prev ? { ...prev, animationDesc: e.target.value } : prev)}
                    rows={2}
                    className="w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-rose-50 outline-none focus:border-rose-400"
                    placeholder="說明動畫效果，例如：玫瑰花瓣飄落動效，持續 2 秒。"
                  />
                </div>

                {/* Usage scenes */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">適用場景（逗號分隔）</label>
                  <input
                    value={giftForm.usageScenes}
                    onChange={(e) => setGiftForm((prev) => prev ? { ...prev, usageScenes: e.target.value } : prev)}
                    className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400"
                    placeholder="例如：一般直播, 特殊活動"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">狀態</label>
                  <select
                    value={giftForm.status}
                    onChange={(e) => setGiftForm((prev) => prev ? { ...prev, status: e.target.value as 'active' | 'inactive' } : prev)}
                    className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400"
                  >
                    <option value="active">上架</option>
                    <option value="inactive">下架</option>
                  </select>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-rose-100 hover:bg-slate-800/80"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-rose-500"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {editingGift ? '儲存變更' : '建立禮物'}
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default GiftsPage
