/**
 * @file BroadcasterApplicationsPage.tsx
 * @description 主播申請審核工作台
 * - 支援申請清單、狀態篩選、關鍵字搜尋、分頁
 * - 詳情右側抽屜（含資料卡與審核操作）
 * - 核准 / 拒絕（含原因）/ 取消流程，全部用原生抽屜與確認，風格對齊 BonusPage
 * - 功能清單（規格）Blueprint tab
 */

import { showAlert, showConfirm } from '../../lib/dialog'
import { useMemo, useState } from 'react'
import {
  FlagTriangleRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  PlusCircle,
  ListChecks,
  History,
  FileDown,
  Layers,
  UserCheck,
  UserX,
  Users,
  Undo2,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── 型別定義 ────────────────────────────────────────────────────────────────

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

type ApplicationTabId =
  | 'overview'
  | 'applications'
  | 'history'
  | 'blueprint'

/**
 * @description 主播申請資料模型（含詳細欄位，對齊後端審核需求）
 */
interface BroadcasterApplication {
  id: string
  userId: string
  username: string
  displayName?: string
  email?: string
  phone?: string
  /** 自我介紹 / 簡介 */
  bio?: string
  /** 擅長直播類型 */
  streamCategory?: string
  /** 過往直播平台（示意） */
  previousPlatforms?: string[]
  /** 申請附件說明（示意，例如上傳過的圖片說明） */
  attachments?: string[]
  appliedAt: string
  status: ApplicationStatus
  reason?: string
  note?: string
  processedAt?: string
  processedBy?: string
}

// ─── 示意資料 ─────────────────────────────────────────────────────────────────

function createNowLabel(): string {
  const now = new Date()
  return now.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function createMockApplications(): BroadcasterApplication[] {
  const now = new Date()
  const ago = (h: number) =>
    new Date(now.getTime() - h * 3600 * 1000).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  return [
    {
      id: 'APP-20250324-001',
      userId: '20001',
      username: 'streamer_iris',
      displayName: 'Iris 愛麗絲',
      email: 'iris@example.com',
      phone: '+63-912-000-0001',
      bio: '擅長遊戲直播，特別是 FPS 與 RPG 類型，擁有 3 年直播經驗。',
      streamCategory: '遊戲直播',
      previousPlatforms: ['Twitch', 'YouTube'],
      attachments: ['id_front.jpg', 'selfie_with_id.jpg'],
      appliedAt: ago(2),
      status: 'pending',
      note: '資料齊全，建議優先審核。',
    },
    {
      id: 'APP-20250323-002',
      userId: '20002',
      username: 'music_lee',
      displayName: 'Lee 音樂人',
      email: 'lee@example.com',
      phone: '+63-912-000-0002',
      bio: '以音樂直播為主，擅長吉他與鋼琴即興演奏。',
      streamCategory: '音樂演奏',
      previousPlatforms: ['Facebook Live'],
      attachments: ['passport.jpg'],
      appliedAt: ago(24),
      status: 'approved',
      processedAt: ago(5),
      processedBy: 'Admin A',
      note: '已核准，已通知用戶。',
    },
    {
      id: 'APP-20250322-003',
      userId: '20003',
      username: 'talkshow_tom',
      displayName: 'Tom 脫口秀',
      email: 'tom@example.com',
      phone: '+63-912-000-0003',
      bio: '以脫口秀與時事評論為主，風格輕鬆幽默。',
      streamCategory: '脫口秀 / 清談',
      previousPlatforms: ['YouTube', 'TikTok'],
      attachments: ['id_front.jpg'],
      appliedAt: ago(48),
      status: 'rejected',
      processedAt: ago(20),
      processedBy: 'Admin B',
      reason: '內容風格不符平台規範，請調整後重新申請。',
    },
    {
      id: 'APP-20250324-004',
      userId: '20004',
      username: 'casual_cat',
      displayName: 'Cat 休閒主播',
      email: 'cat@example.com',
      phone: '+63-912-000-0004',
      bio: '喜歡與觀眾聊天互動，無特定主題。',
      streamCategory: '生活閒聊',
      previousPlatforms: [],
      attachments: ['id_front.jpg', 'id_back.jpg'],
      appliedAt: ago(72),
      status: 'pending',
    },
    {
      id: 'APP-20250324-005',
      userId: '20005',
      username: 'pro_gamer',
      displayName: 'Pro Gamer Alex',
      email: 'pro@example.com',
      phone: '+63-912-000-0005',
      bio: '職業電競選手，曾參與多項國際賽事，現轉型直播分享技巧。',
      streamCategory: '電競 / 遊戲攻略',
      previousPlatforms: ['Twitch', 'Nimo TV'],
      attachments: ['passport.jpg', 'competition_cert.pdf'],
      appliedAt: ago(6),
      status: 'pending',
      note: '曾參與賽事，高潛力主播。',
    },
    {
      id: 'APP-20250321-006',
      userId: '20006',
      username: 'cook_nina',
      displayName: 'Nina 廚藝直播',
      email: 'nina@example.com',
      phone: '+63-912-000-0006',
      bio: '專注於菲律賓在地美食料理示範，有料理節目拍攝經驗。',
      streamCategory: '美食 / 料理',
      previousPlatforms: ['Facebook Live', 'YouTube'],
      attachments: ['id_front.jpg'],
      appliedAt: ago(96),
      status: 'cancelled',
      processedAt: ago(80),
      processedBy: 'Admin A',
      reason: '申請人主動取消。',
    },
  ]
}

// ─── 輔助 ─────────────────────────────────────────────────────────────────────

function statusLabel(s: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    pending: '待審核',
    approved: '已核准',
    rejected: '已拒絕',
    cancelled: '已取消',
  }
  return map[s]
}

function statusClass(s: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    pending: 'bg-amber-500/30 text-amber-50',
    approved: 'bg-emerald-500/30 text-emerald-50',
    rejected: 'bg-rose-500/40 text-rose-50',
    cancelled: 'bg-slate-600/40 text-slate-100',
  }
  return map[s]
}

// ─── 主元件 ───────────────────────────────────────────────────────────────────

export function BroadcasterApplicationsPage() {
  const [activeTab, setActiveTab] = useState<ApplicationTabId>('overview')
  const [rows, setRows] = useState<BroadcasterApplication[]>(() => createMockApplications())

  // 列表篩選
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('全部')
  const [page, setPage] = useState(1)
  const pageSize = 5

  // 歷史記錄篩選
  const [historyKeyword, setHistoryKeyword] = useState('')
  const [historyPage, setHistoryPage] = useState(1)

  // 詳情抽屜
  const [drawerItem, setDrawerItem] = useState<BroadcasterApplication | null>(null)

  // 拒絕原因抽屜
  const [rejectDrawerItem, setRejectDrawerItem] = useState<BroadcasterApplication | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // ─── 統計 ──────────────────────────────────────────────────────────────────

  const overviewStats = useMemo(() => {
    const total = rows.length
    const pending = rows.filter((r) => r.status === 'pending').length
    const approved = rows.filter((r) => r.status === 'approved').length
    const rejected = rows.filter((r) => r.status === 'rejected').length
    const cancelled = rows.filter((r) => r.status === 'cancelled').length
    return { total, pending, approved, rejected, cancelled }
  }, [rows])

  // ─── 申請清單（待審核 + 全部）─────────────────────────────────────────────

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.streamCategory ?? '未分類'))
    return ['全部', ...Array.from(set)]
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (keyword) {
        const target =
          `${r.id} ${r.userId} ${r.username} ${r.displayName ?? ''} ${r.email ?? ''} ${r.streamCategory ?? ''} ${r.note ?? ''}`.toLowerCase()
        if (!target.includes(keyword.toLowerCase())) return false
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (categoryFilter !== '全部' && (r.streamCategory ?? '未分類') !== categoryFilter) return false
      return true
    })
  }, [rows, keyword, statusFilter, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page])

  // ─── 審核歷史（已核准、已拒絕、已取消）──────────────────────────────────

  const historyRows = useMemo(() => {
    return rows.filter((r) => r.status !== 'pending').filter((r) => {
      if (historyKeyword) {
        const target =
          `${r.id} ${r.userId} ${r.username} ${r.displayName ?? ''} ${r.processedBy ?? ''} ${r.reason ?? ''}`.toLowerCase()
        return target.includes(historyKeyword.toLowerCase())
      }
      return true
    })
  }, [rows, historyKeyword])

  const historyTotalPages = Math.max(1, Math.ceil(historyRows.length / pageSize))
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * pageSize
    return historyRows.slice(start, start + pageSize)
  }, [historyRows, historyPage])

  // ─── 操作 ──────────────────────────────────────────────────────────────────

  async function handleApprove(id: string) {
    const item = rows.find((r) => r.id === id)
    if (!item) return
    const ok = await showConfirm(
      `確認核准主播申請「${item.id}」嗎？\n\n` +
        `用戶：${item.displayName ?? item.username}（ID: ${item.userId}）\n` +
        `申請類型：${item.streamCategory ?? '未填寫'}\n\n` +
        '核准後狀態將更新為「已核准」，並記錄審核時間與審核人。',
    )
    if (!ok) return
    const now = createNowLabel()
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: 'approved', processedAt: now, processedBy: 'Demo Admin' }
          : r,
      ),
    )
    if (drawerItem?.id === id) setDrawerItem((d) => d ? { ...d, status: 'approved', processedAt: now, processedBy: 'Demo Admin' } : d)
  }

  function handleOpenRejectDrawer(item: BroadcasterApplication) {
    setRejectDrawerItem(item)
    setRejectReason('')
  }

  function handleCloseRejectDrawer() {
    setRejectDrawerItem(null)
    setRejectReason('')
  }

  async function handleSubmitReject() {
    if (!rejectDrawerItem) return
    if (!rejectReason.trim()) {
      await showAlert('請填寫拒絕原因後再提交。')
      return
    }
    const now = createNowLabel()
    const id = rejectDrawerItem.id
    const reason = rejectReason.trim()
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: 'rejected', reason, processedAt: now, processedBy: 'Demo Admin' }
          : r,
      ),
    )
    if (drawerItem?.id === id)
      setDrawerItem((d) =>
        d ? { ...d, status: 'rejected', reason, processedAt: now, processedBy: 'Demo Admin' } : d,
      )
    handleCloseRejectDrawer()
  }

  async function handleCancel(id: string) {
    const item = rows.find((r) => r.id === id)
    if (!item) return
    const ok = await showConfirm(
      `確認將申請「${item.id}」標記為「已取消」嗎？\n\n` +
        `用戶：${item.displayName ?? item.username}（ID: ${item.userId}）`,
    )
    if (!ok) return
    const now = createNowLabel()
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: 'cancelled', processedAt: now, processedBy: 'Demo Admin' }
          : r,
      ),
    )
    if (drawerItem?.id === id)
      setDrawerItem((d) =>
        d ? { ...d, status: 'cancelled', processedAt: now, processedBy: 'Demo Admin' } : d,
      )
  }

  // ─── Blueprint ─────────────────────────────────────────────────────────────

  const blueprintFeatures: FeatureItem[] = [
    {
      id: 1,
      name: '主播申請清單與篩選',
      description: '列出所有主播申請，支援關鍵字、狀態、直播類型多維度篩選與分頁，提升審核效率。',
      tag: '審核',
    },
    {
      id: 2,
      name: '申請詳情抽屜（右側展開）',
      description:
        '點擊申請列查看完整資料（個人資訊、自介、附件說明、直播類型），並可直接在抽屜內發起核准或拒絕。',
      tag: '詳情',
    },
    {
      id: 3,
      name: '核准流程（含確認）',
      description:
        '核准前顯示確認提示，避免誤操作；核准後自動記錄處理時間與審核人，並寫入 Audit Log（正式環境）。',
      tag: '核准',
    },
    {
      id: 4,
      name: '拒絕流程（含原因填寫）',
      description:
        '拒絕時開啟側邊抽屜填寫原因，原因為必填，確保稽核可追溯；拒絕後狀態與原因一併寫入記錄。',
      tag: '拒絕',
    },
    {
      id: 5,
      name: '取消申請',
      description: '支援將待審核申請標記為「已取消」，並記錄操作人與時間，用於申請人主動撤回場景。',
      tag: '取消',
    },
    {
      id: 6,
      name: '審核歷史（已處理記錄）',
      description:
        '獨立的「審核記錄」分頁，集中顯示已核准、已拒絕、已取消的申請，支援關鍵字搜尋與分頁。',
      tag: '歷史',
    },
    {
      id: 7,
      name: '總覽統計卡',
      description: '即時顯示待審核、已核准、已拒絕、已取消筆數，幫助管理員快速掌握申請狀態分佈。',
      tag: '統計',
    },
    {
      id: 8,
      name: 'Audit Log（正式環境）',
      description:
        '所有核准、拒絕、取消操作須寫入 Audit Log，記錄操作人、時間與原因，供合規稽核使用。',
      tag: 'Audit',
    },
  ]

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Sub tabs header */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <FlagTriangleRight className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-100">主播申請審核</span>
          <span className="text-[10px] text-slate-500">
            列出待審核的主播申請，支援關鍵字搜尋、狀態篩選、核准 / 拒絕（含原因）/ 取消與審核歷史。
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {(
            [
              { id: 'overview', label: '總覽', activeClass: 'bg-slate-700 text-white' },
              { id: 'applications', label: '申請清單', activeClass: 'bg-amber-600 text-white' },
              { id: 'history', label: '審核記錄', activeClass: 'bg-sky-600 text-white' },
              { id: 'blueprint', label: '功能清單（規格）', activeClass: 'bg-slate-700 text-white' },
            ] as { id: ApplicationTabId; label: string; activeClass: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'rounded-full px-2 py-0.5',
                activeTab === tab.id
                  ? tab.activeClass
                  : 'text-slate-200 hover:bg-slate-800/80',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Tab: 總覽 ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">主播申請總覽</span>
            </div>
            <span className="text-[10px] text-slate-500">
              各狀態申請筆數的即時統計，點選下方頁籤可查看詳細清單。
            </span>
          </header>
          <p className="text-[11px] text-slate-400">
            此總覽提供申請狀態分佈的快速瀏覽。建議每日定時處理「待審核」申請，確保主播上線流程不受阻塞。
          </p>

          <div className="grid gap-3 md:grid-cols-4 text-[11px]">
            <div className="space-y-1 rounded-xl border border-amber-600/60 bg-amber-500/10 p-3">
              <div className="text-slate-100">待審核</div>
              <div className="text-2xl font-semibold text-amber-100">{overviewStats.pending}</div>
              <p className="text-[10px] text-amber-200/80">等待審核人員核准或拒絕的申請，建議優先處理。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-emerald-600/60 bg-emerald-500/10 p-3">
              <div className="text-slate-100">已核准</div>
              <div className="text-2xl font-semibold text-emerald-100">{overviewStats.approved}</div>
              <p className="text-[10px] text-emerald-200/80">已成功核准的主播申請，可進入後續入職流程。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="text-slate-100">已拒絕</div>
              <div className="text-2xl font-semibold text-rose-100">{overviewStats.rejected}</div>
              <p className="text-[10px] text-rose-200/80">不符規範的申請，已填寫拒絕原因並記錄。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-700/80 bg-slate-900/80 p-3">
              <div className="text-slate-100">已取消 / 總計</div>
              <div className="text-2xl font-semibold text-slate-100">
                {overviewStats.cancelled}
                <span className="ml-2 text-base text-slate-400">/ {overviewStats.total}</span>
              </div>
              <p className="text-[10px] text-slate-400">申請人主動撤回或管理員取消的申請筆數。</p>
            </div>
          </div>

          {/* 快速行動提示 */}
          {overviewStats.pending > 0 && (
            <div className="rounded-xl border border-amber-500/60 bg-amber-500/10 p-3 text-[11px] text-amber-50">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold">有 {overviewStats.pending} 筆待審核申請</span>
              </div>
              <p className="mt-1 text-[10px] text-amber-200/80">
                請前往「申請清單」頁籤，依序審核各申請並填寫處理結果，確保申請人能及時收到通知。
              </p>
              <button
                type="button"
                onClick={() => { setStatusFilter('pending'); setActiveTab('applications') }}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-amber-500"
              >
                <ListChecks className="h-3 w-3" />
                前往審核待審核申請
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Tab: 申請清單 ─────────────────────────────────────────────────── */}
      {activeTab === 'applications' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <FlagTriangleRight className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">主播申請清單</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100">
                支援關鍵字、狀態、直播類型多維篩選。
              </span>
            </div>
            <button
              type="button"
              onClick={async () => { await showAlert('示意：開啟新增主播申請表單（適用於後台人工代送申請）。') }}
              className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-500"
            >
              <PlusCircle className="h-3 w-3" />
              新增申請
            </button>
          </header>

          {/* 搜尋 & 篩選列 */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-[11px]">
            <div className="flex min-w-[240px] flex-1 items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                placeholder="申請 ID / User ID / 用戶名 / Email / 備註"
                className="h-6 flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as 'all' | ApplicationStatus); setPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100"
              >
                <option value="all">全部狀態</option>
                <option value="pending">待審核</option>
                <option value="approved">已核准</option>
                <option value="rejected">已拒絕</option>
                <option value="cancelled">已取消</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="ml-auto text-[10px] text-slate-500">共 {filteredRows.length} 筆</div>
          </div>

          {/* 表格 */}
          <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-amber-100">
                <tr>
                  <th className="w-8 border-b border-amber-600/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">申請 ID</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">用戶</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">Email</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">直播類型</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">申請時間</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">狀態</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">備註</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, idx) => (
                  <tr key={r.id} className="border-b border-amber-600/40 text-amber-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-2 py-1.5">
                      <span className="font-medium">{r.id}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{r.displayName ?? r.username}</span>
                        <span className="text-[10px] text-amber-200/80">@{r.username} · ID: {r.userId}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-amber-100/80">{r.email ?? '—'}</td>
                    <td className="px-2 py-1.5 text-amber-100/90">{r.streamCategory ?? '未填寫'}</td>
                    <td className="px-2 py-1.5 text-[10px] text-amber-100/70">{r.appliedAt}</td>
                    <td className="px-2 py-1.5">
                      <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]', statusClass(r.status)].join(' ')}>
                        {r.status === 'pending' && <Clock className="h-3 w-3" />}
                        {r.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {r.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {r.status === 'cancelled' && <Undo2 className="h-3 w-3" />}
                        <span>{statusLabel(r.status)}</span>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-amber-100/70">{r.note ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDrawerItem(r)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700"
                        >
                          <Eye className="h-3 w-3" />
                          詳情
                        </button>
                        {r.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500"
                            >
                              <UserCheck className="h-3 w-3" />
                              核准
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectDrawer(r)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500"
                            >
                              <UserX className="h-3 w-3" />
                              拒絕
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(r.id)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-white hover:bg-slate-600"
                            >
                              取消
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-[11px] text-amber-100/80">
                      目前沒有符合條件的主播申請。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="flex items-center justify-between border-t border-amber-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>共 {filteredRows.length} 筆 · 每頁 {pageSize} 筆</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" />
                  上一頁
                </button>
                <span>第 {page} / {totalPages} 頁</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

      {/* ── Tab: 審核記錄 ─────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <section className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">主播申請審核記錄</span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-100">
                已核准、已拒絕、已取消的申請歷史，含處理時間與審核人。
              </span>
            </div>
            <button
              type="button"
              onClick={async () => { await showAlert('示意：根據當前篩選條件匯出主播申請審核記錄 CSV。') }}
              className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700"
            >
              <FileDown className="h-3 w-3" />
              匯出 CSV
            </button>
          </header>

          {/* 搜尋 */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3">
            <div className="flex min-w-[240px] flex-1 items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                value={historyKeyword}
                onChange={(e) => { setHistoryKeyword(e.target.value); setHistoryPage(1) }}
                placeholder="申請 ID / 用戶名 / 審核人 / 拒絕原因"
                className="h-6 flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
            <span className="text-[10px] text-slate-500">共 {historyRows.length} 筆</span>
          </div>

          {/* 表格 */}
          <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-sky-100">
                <tr>
                  <th className="w-8 border-b border-sky-600/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">申請 ID</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">用戶</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">直播類型</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">申請時間</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">結果</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">處理時間</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">審核人</th>
                  <th className="border-b border-sky-600/60 px-2 py-2 text-left">拒絕原因 / 備註</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((r, idx) => (
                  <tr key={r.id} className="border-b border-sky-600/40 text-sky-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(historyPage - 1) * pageSize + idx + 1}</td>
                    <td className="px-2 py-1.5 font-medium">{r.id}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{r.displayName ?? r.username}</span>
                        <span className="text-[10px] text-sky-100/80">ID: {r.userId}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-sky-100/90">{r.streamCategory ?? '未填寫'}</td>
                    <td className="px-2 py-1.5 text-[10px] text-sky-100/70">{r.appliedAt}</td>
                    <td className="px-2 py-1.5">
                      <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]', statusClass(r.status)].join(' ')}>
                        {r.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {r.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {r.status === 'cancelled' && <Undo2 className="h-3 w-3" />}
                        <span>{statusLabel(r.status)}</span>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-sky-100/70">{r.processedAt ?? '—'}</td>
                    <td className="px-2 py-1.5 text-sky-100/90">{r.processedBy ?? '—'}</td>
                    <td className="px-2 py-1.5 text-[10px] text-sky-100/80">
                      {r.reason
                        ? <span className="text-rose-300">{r.reason}</span>
                        : r.note
                        ? r.note
                        : '—'}
                    </td>
                  </tr>
                ))}
                {paginatedHistory.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-[11px] text-sky-100/80">
                      目前沒有符合條件的審核記錄。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="flex items-center justify-between border-t border-sky-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>共 {historyRows.length} 筆 · 每頁 {pageSize} 筆</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" />
                  上一頁
                </button>
                <span>第 {historyPage} / {historyTotalPages} 頁</span>
                <button
                  type="button"
                  disabled={historyPage >= historyTotalPages}
                  onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
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

      {/* ── Tab: Blueprint ─────────────────────────────────────────────────── */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="主播申請審核功能清單"
          subtitle="協助 PM / 營運 / 合規 對齊主播審核流程與系統功能規格。"
          items={blueprintFeatures}
        />
      )}

      {/* ── 右側抽屜：申請詳情 ──────────────────────────────────────────── */}
      {drawerItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-amber-600/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-amber-600/70 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-amber-100">
                  <FlagTriangleRight className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-semibold">申請詳情</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-amber-200/80">
                  {drawerItem.id} · {drawerItem.displayName ?? drawerItem.username}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerItem(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-700/80 bg-slate-900/80 text-amber-200 hover:border-amber-400 hover:text-amber-100"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-4 text-[11px] text-amber-50">
              <div className="space-y-4">

                {/* 狀態 badge */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">目前狀態：</span>
                  <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]', statusClass(drawerItem.status)].join(' ')}>
                    {drawerItem.status === 'pending' && <Clock className="h-3 w-3" />}
                    {drawerItem.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                    {drawerItem.status === 'rejected' && <XCircle className="h-3 w-3" />}
                    {drawerItem.status === 'cancelled' && <Undo2 className="h-3 w-3" />}
                    <span>{statusLabel(drawerItem.status)}</span>
                  </span>
                </div>

                {/* 基本資訊 */}
                <div className="space-y-1.5 rounded-xl border border-amber-600/50 bg-slate-950/80 p-3">
                  <div className="text-[10px] font-semibold text-amber-300 uppercase tracking-wide">基本資訊</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-400">用戶名：</span>
                      <span>@{drawerItem.username}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">顯示名稱：</span>
                      <span>{drawerItem.displayName ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">User ID：</span>
                      <span className="tabular-nums">{drawerItem.userId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email：</span>
                      <span>{drawerItem.email ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">電話：</span>
                      <span>{drawerItem.phone ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">直播類型：</span>
                      <span>{drawerItem.streamCategory ?? '未填寫'}</span>
                    </div>
                  </div>
                </div>

                {/* 自我介紹 */}
                {drawerItem.bio && (
                  <div className="space-y-1 rounded-xl border border-slate-700/60 bg-slate-950/80 p-3">
                    <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">自我介紹</div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">{drawerItem.bio}</p>
                  </div>
                )}

                {/* 過往平台 & 附件 */}
                <div className="grid grid-cols-2 gap-3">
                  {drawerItem.previousPlatforms && drawerItem.previousPlatforms.length > 0 && (
                    <div className="space-y-1 rounded-xl border border-slate-700/60 bg-slate-950/80 p-3">
                      <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">過往平台</div>
                      <ul className="list-disc pl-4 text-[11px] text-slate-200 space-y-0.5">
                        {drawerItem.previousPlatforms.map((p) => <li key={p}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {drawerItem.attachments && drawerItem.attachments.length > 0 && (
                    <div className="space-y-1 rounded-xl border border-slate-700/60 bg-slate-950/80 p-3">
                      <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">附件（示意）</div>
                      <ul className="list-disc pl-4 text-[11px] text-slate-200 space-y-0.5">
                        {drawerItem.attachments.map((a) => <li key={a}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 時間 & 審核資訊 */}
                <div className="space-y-1 rounded-xl border border-slate-700/60 bg-slate-950/80 p-3">
                  <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">審核資訊</div>
                  <div className="space-y-1 text-[11px]">
                    <div><span className="text-slate-400">申請時間：</span>{drawerItem.appliedAt}</div>
                    {drawerItem.processedAt && <div><span className="text-slate-400">處理時間：</span>{drawerItem.processedAt}</div>}
                    {drawerItem.processedBy && <div><span className="text-slate-400">審核人：</span>{drawerItem.processedBy}</div>}
                    {drawerItem.note && <div><span className="text-slate-400">備註：</span>{drawerItem.note}</div>}
                    {drawerItem.reason && (
                      <div>
                        <span className="text-slate-400">拒絕原因：</span>
                        <span className="text-rose-300">{drawerItem.reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按鈕（僅待審核時顯示） */}
                {drawerItem.status === 'pending' && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">審核操作</div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => { handleApprove(drawerItem.id) }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-600 py-2 text-[11px] font-semibold text-white hover:bg-emerald-500"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        核准申請
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDrawerItem(null); handleOpenRejectDrawer(drawerItem) }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-rose-600 py-2 text-[11px] font-semibold text-white hover:bg-rose-500"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        拒絕並填寫原因
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleCancel(drawerItem.id); setDrawerItem(null) }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 py-2 text-[11px] text-slate-200 hover:bg-slate-800/80"
                      >
                        標記為已取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── 右側抽屜：拒絕原因填寫 ────────────────────────────────────────── */}
      {rejectDrawerItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-rose-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-rose-700/60 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-rose-50">
                  <UserX className="h-3.5 w-3.5 text-rose-400" />
                  <span className="font-semibold">拒絕主播申請</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-rose-200/80">
                  {rejectDrawerItem.id} · {rejectDrawerItem.displayName ?? rejectDrawerItem.username}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseRejectDrawer}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-700/80 bg-slate-900/80 text-rose-200 hover:border-rose-400 hover:text-rose-100"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-4 text-[11px] text-rose-50">
              <form
                className="space-y-4"
                onSubmit={(e) => { e.preventDefault(); handleSubmitReject() }}
              >
                {/* 申請人資訊快覽 */}
                <div className="rounded-xl border border-rose-700/50 bg-rose-500/10 p-3 text-[11px]">
                  <div className="space-y-1">
                    <div><span className="text-rose-200/80">申請人：</span>{rejectDrawerItem.displayName ?? rejectDrawerItem.username}（ID: {rejectDrawerItem.userId}）</div>
                    <div><span className="text-rose-200/80">直播類型：</span>{rejectDrawerItem.streamCategory ?? '未填寫'}</div>
                    <div><span className="text-rose-200/80">申請時間：</span>{rejectDrawerItem.appliedAt}</div>
                  </div>
                </div>

                {/* 拒絕原因輸入 */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-rose-100">
                    拒絕原因
                    <span className="ml-1 text-[10px] text-rose-400">（必填）</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={5}
                    placeholder="請描述拒絕此申請的具體原因，例如：內容不符平台規範、資料不完整、曾有違規紀錄等。此原因將記錄於 Audit Log，並可供後續查詢。"
                    className="w-full rounded-xl border border-rose-700/80 bg-slate-950/80 px-3 py-2 text-[11px] text-rose-50 outline-none focus:border-rose-400 placeholder:text-rose-300/40 leading-relaxed"
                  />
                  <p className="text-[10px] text-rose-200/70">
                    填寫後按「確認拒絕」即完成審核，拒絕原因將永久記錄。
                  </p>
                </div>

                {/* 風險提示 */}
                <div className="rounded-xl border border-amber-500/60 bg-amber-500/10 p-3 text-[10px] text-amber-50">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                    操作提醒
                  </div>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    <li>拒絕後狀態不可直接回到「待審核」，如需重新審核請讓申請人重新提交。</li>
                    <li>建議填寫詳細原因，方便申請人了解並改善後重申。</li>
                    <li>所有操作均寫入 Audit Log（正式環境）。</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseRejectDrawer}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-700/80 bg-slate-900/80 px-3 py-1.5 text-[10px] text-rose-100 hover:bg-slate-800/80"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-4 py-1.5 text-[10px] font-semibold text-white hover:bg-rose-500"
                  >
                    <UserX className="h-3 w-3" />
                    確認拒絕
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

export default BroadcasterApplicationsPage
