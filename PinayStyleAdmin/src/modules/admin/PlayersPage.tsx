/**
 * @file PlayersPage.tsx
 * @description Player / user management workspace: tabs for user list, banned / blacklist management,
 * basic profile maintenance (including ID and personal fields), and full capability blueprint.
 */

import { useMemo, useState } from 'react'
import {
  Search,
  Ban,
  VolumeX,
  KeyRound,
  ArrowUpRight,
  CirclePlus,
  Users,
  Filter,
  Eye,
  XCircle,
  Unlock,
  ChevronLeft,
  ChevronRight,
  UserX,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

/**
 * @description 顯示在頁面上可切換的子頁籤。
 */
type PlayersTabId = 'list' | 'banned' | 'maintenance' | 'blueprint' | 'blacklist'

/**
 * @description 用戶狀態型別。
 * - 正常：可正常登入 / 使用。
 * - 封禁：帳號禁止登入，通常有期限與原因。
 * - 禁言中：僅限制聊天 / 發言。
 * - 黑名單：高風險帳號，通常不允許再次註冊或需要額外審核。
 */
type PlayerStatus = '正常' | '封禁' | '禁言中' | '黑名單'

/**
 * @description 用戶性別選項。
 */
type PlayerGender = '男' | '女' | '其他'

/**
 * @description 客服備註 / 異動原因記錄。
 */
export interface MaintenanceNote {
  /** 唯一識別 ID。 */
  id: string
  /** 建立時間（字串格式即可）。 */
  createdAt: string
  /** 建立人（示意：客服名稱或系統）。 */
  createdBy: string
  /** 備註內容或異動原因。 */
  message: string
}

/**
 * @description 單筆 Player / 用戶列的資料模型。
 * 增加身份證號與其他個人資料欄位，並以 notes 陣列記錄多次客服備註 / 異動原因。
 */
export interface PlayerRow {
  id: string
  username: string
  email: string
  type: 'Player' | 'Broadcaster'
  status: PlayerStatus
  points: number
  bonus: number
  level: string
  createdAt: string
  lastActive: string
  /** 顯示名稱（若未填則回退 username）。 */
  displayName?: string
  /** 手機號碼。 */
  phone?: string
  /** 國家 / 地區。 */
  country?: string
  /** 生日（yyyy-MM-dd）。 */
  birthday?: string
  /** 身份證號 / 身分證字號。 */
  nationalId?: string
  /** 聯絡地址。 */
  address?: string
  /** 城市 / 縣市。 */
  city?: string
  /** 郵遞區號。 */
  postalCode?: string
  /** 性別。 */
  gender?: PlayerGender
  /** 資料是否已補全，用於維護清單篩選。 */
  profileCompleted?: boolean
  /** 多次客服備註 / 異動原因（含時間與來源）。 */
  notes?: MaintenanceNote[]
}

/**
 * @description 產生一筆新的客服備註記錄。
 */
function createMaintenanceNote(message: string, createdBy = '客服 Demo'): MaintenanceNote {
  const now = new Date()
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    createdBy,
    message,
  }
}

/**
 * @description 取得用戶最新一筆備註。
 */
function getLatestNote(row: PlayerRow): MaintenanceNote | undefined {
  const notes = row.notes
  if (!notes || notes.length === 0) return undefined
  return notes[notes.length - 1]
}

/**
 * @description 將一筆新的備註附加到指定用戶列，回傳新的列資料。
 */
function appendNote(row: PlayerRow, message: string, createdBy?: string): PlayerRow {
  const trimmed = message.trim()
  if (!trimmed) return row
  const note = createMaintenanceNote(trimmed, createdBy)
  const notes = row.notes ? [...row.notes, note] : [note]
  return {
    ...row,
    notes,
  }
}

/**
 * @description Player management main component with real interaction simulation.
 * - 子頁籤：列表 / 封禁 & 禁言管理 / 資料維護清單 / 功能清單 / 黑名單清單。
 * - 模擬：搜尋 / 篩選 / 分頁 / 封禁 / 解封 / 禁言 / 解禁 / 黑名單 / 基本資料維護（含身份證與完整個資）。
 * - 客服備註：以 notes 陣列記錄多次異動原因與時間。
 */
/** @description 調整點數 / Bonus 單次最大允許金額（示意上限，可依實際需求調整）。 */
const MAX_ADJUST_AMOUNT = 1_000_000

export function PlayersPage() {
  const [activeTab, setActiveTab] = useState<PlayersTabId>('list')
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<'全部' | 'Player' | 'Broadcaster' | '封禁'>('全部')
  const [statusFilter, setStatusFilter] = useState<'全部' | PlayerStatus>('全部')
  const [page, setPage] = useState(1)
  const pageSize = 20

  /**
   * @description 用於模擬操作結果的本地狀態（封禁 / 解封 / 禁言 / 黑名單 / 基本資料維護 / 備註時間軸）。
   */
  const [rows, setRows] = useState<PlayerRow[]>(() => {
    /**
     * @description 建立一些示意資料，足夠測試搜尋 / 分頁 / 封禁 / 黑名單 / 資料維護。
     */
    const base: PlayerRow[] = [
      {
        id: '10001',
        username: 'demo_player',
        displayName: 'Demo Player',
        email: 'demo***@mail.com',
        type: 'Player',
        status: '正常',
        points: 12340,
        bonus: 120,
        level: 'L3',
        createdAt: '2025-12-01 10:00',
        lastActive: '2026-03-23 10:21',
        phone: undefined,
        country: undefined,
        birthday: undefined,
        nationalId: undefined,
        address: undefined,
        city: undefined,
        postalCode: undefined,
        gender: '男',
        profileCompleted: false,
        notes: [createMaintenanceNote('客服：待補全手機、國家與生日資料。', '客服 A')],
      },
      {
        id: '20001',
        username: 'star_streamer',
        displayName: 'Star Streamer',
        email: 'star***@mail.com',
        type: 'Broadcaster',
        status: '正常',
        points: 563_800,
        bonus: 8_420,
        level: '主播 L2',
        createdAt: '2025-11-12 14:20',
        lastActive: '2026-03-23 11:05',
        phone: '+886-912-000-000',
        country: 'TW',
        birthday: '1995-06-18',
        nationalId: 'A123456789',
        address: '台北市信義區信義路 100 號',
        city: '台北市',
        postalCode: '110',
        gender: '女',
        profileCompleted: true,
        notes: [
          createMaintenanceNote('系統：升級為主播 L2 等級。', '系統'),
          createMaintenanceNote('客服：更新聯絡電話與地址。', '客服 B'),
        ],
      },
      {
        id: '30001',
        username: 'banned_user',
        displayName: 'Banned User',
        email: 'ban***@mail.com',
        type: 'Player',
        status: '封禁',
        points: 0,
        bonus: 0,
        level: 'L1',
        createdAt: '2025-10-02 09:15',
        lastActive: '2026-01-12 09:02',
        phone: undefined,
        country: 'US',
        birthday: undefined,
        nationalId: undefined,
        address: undefined,
        city: undefined,
        postalCode: undefined,
        gender: '男',
        profileCompleted: false,
        notes: [createMaintenanceNote('多次違規送禮，已封禁帳號（示意）。', '風控')],
      },
      {
        id: '40001',
        username: 'muted_user',
        displayName: 'Muted User',
        email: 'mute***@mail.com',
        type: 'Player',
        status: '禁言中',
        points: 9_900,
        bonus: 300,
        level: 'L2',
        createdAt: '2025-09-18 18:02',
        lastActive: '2026-03-22 22:10',
        phone: '+1-555-1234',
        country: 'US',
        birthday: '1992-01-05',
        nationalId: undefined,
        address: '1 Market St',
        city: 'San Francisco',
        postalCode: '94105',
        gender: '女',
        profileCompleted: true,
        notes: [createMaintenanceNote('聊天室罵人，禁言 7 天（示意）。', '版主')],
      },
      {
        id: '50001',
        username: 'blacklisted_user',
        displayName: 'Blacklisted User',
        email: 'black***@mail.com',
        type: 'Player',
        status: '黑名單',
        points: 0,
        bonus: 0,
        level: 'L1',
        createdAt: '2025-08-01 12:00',
        lastActive: '2025-12-31 23:59',
        nationalId: 'B987654321',
        address: undefined,
        city: undefined,
        postalCode: undefined,
        gender: '男',
        profileCompleted: true,
        notes: [
          createMaintenanceNote('疑似詐騙行為，列入黑名單，禁止再次註冊（示意）。', '風控'),
        ],
      },
    ]

    // 產生多幾筆假資料，用來測試分頁與維護清單。
    const extra: PlayerRow[] = Array.from({ length: 32 }).map((_, index) => {
      const id = 60000 + index
      const incomplete = index % 6 === 0
      return {
        id: String(id),
        username: `player_${id}`,
        displayName: `Player ${id}`,
        email: `user${id}@mail.com`,
        type: index % 5 === 0 ? 'Broadcaster' : 'Player',
        status: '正常',
        points: 2000 + index * 37,
        bonus: 50 + index * 5,
        level: index % 4 === 0 ? 'L1' : index % 4 === 1 ? 'L2' : index % 4 === 2 ? 'L3' : 'L4',
        createdAt: '2025-12-20 12:00',
        lastActive: '2026-03-20 09:30',
        phone: incomplete ? undefined : `+886-900-${String(index).padStart(4, '0')}`,
        country: incomplete ? undefined : 'TW',
        birthday: incomplete ? undefined : '1990-01-01',
        nationalId: incomplete ? undefined : `A1${String(id).slice(-7)}`,
        address: incomplete ? undefined : `台北市測試路 ${index} 號`,
        city: incomplete ? undefined : '台北市',
        postalCode: incomplete ? undefined : '100',
        gender: index % 3 === 0 ? '男' : index % 3 === 1 ? '女' : '其他',
        profileCompleted: !incomplete,
        notes: incomplete
          ? [createMaintenanceNote('待補全基本資料（手機 / 國家 / 生日 / 身份證）。', '客服 系統')]
          : undefined,
      }
    })

    return [...base, ...extra]
  })

  /** 詳情抽屜的選取用戶。 */
  const [detailUser, setDetailUser] = useState<PlayerRow | null>(null)

  /** 調整點數 / Bonus 點數的目標用戶與表單狀態。 */
  const [adjustingUser, setAdjustingUser] = useState<PlayerRow | null>(null)
  const [adjustForm, setAdjustForm] = useState<AdjustBalanceFormState | null>(null)

  /**
   * @description 依目前表單與目標用戶，動態計算「預估餘額試算」資訊。
   * 僅在抽屜綁定了具體用戶時才有意義。
   */
  const adjustPreview = useMemo(() => {
    if (!adjustForm || !adjustingUser) return null

    const rawAmount = adjustForm.amount.trim()
    const amountNumber = Number(rawAmount)
    const hasValidAmount =
      rawAmount !== '' && !Number.isNaN(amountNumber) && amountNumber > 0
    const isOverLimit = hasValidAmount && amountNumber > MAX_ADJUST_AMOUNT

    const balanceLabel =
      adjustForm.balanceType === 'points' ? '點數 points' : 'Bonus 點數'

    const base =
      adjustForm.balanceType === 'points'
        ? adjustingUser.points
        : adjustingUser.bonus

    let delta = 0
    if (hasValidAmount) {
      delta = adjustForm.operation === 'add' ? amountNumber : -amountNumber
    }

    const after = hasValidAmount ? base + delta : null

    const formattedAmount = hasValidAmount
      ? amountNumber.toLocaleString()
      : ''

    return {
      balanceLabel,
      baseLabel: base.toLocaleString(),
      deltaLabel: hasValidAmount
        ? delta > 0
          ? `+${formattedAmount}`
          : `-${Math.abs(amountNumber).toLocaleString()}`
        : '—',
      afterLabel: after !== null ? after.toLocaleString() : null,
      isOverLimit,
    }
  }, [adjustForm, adjustingUser])

  /**
   * @description 依搜尋 / 篩選條件過濾後的用戶列表。
   */
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (keyword) {
        const target = `${row.username} ${row.displayName ?? ''} ${row.email} ${row.id}`.toLowerCase()
        if (!target.includes(keyword.toLowerCase())) return false
      }
      if (typeFilter === 'Player' && row.type !== 'Player') return false
      if (typeFilter === 'Broadcaster' && row.type !== 'Broadcaster') return false
      if (typeFilter === '封禁' && row.status !== '封禁') return false
      if (statusFilter !== '全部' && row.status !== statusFilter) return false
      return true
    })
  }, [rows, keyword, typeFilter, statusFilter])

  /**
   * @description 目前頁面顯示的分頁結果。
   */
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))

  /**
   * @description 切換篩選時重置到第 1 頁，避免頁碼超出範圍。
   */
  const handleFilterChange = <T,>(updater: (prev: T) => T, current: T) => {
    const next = updater(current)
    if (next !== current) {
      setPage(1)
    }
  }

  /**
   * @description 封禁用戶（模擬，僅更新前端狀態，並追加一筆備註）。
   */
  const handleBan = async (row: PlayerRow) => {
    const ok = await showConfirm(
      `確認要封禁用戶「${row.username}」嗎？\n此操作屬於高風險，建議實務上加上 RBAC 與 Audit Log。`,
    )
    if (!ok) return
    setRows((prev) =>
      prev.map((item) => {
        if (item.id !== row.id) return item
        const updated: PlayerRow = {
          ...item,
          status: '封禁',
        }
        return appendNote(updated, '封禁帳號（示意操作）。', '客服 Demo')
      }),
    )
  }

  /**
   * @description 解封用戶（模擬，並追加一筆備註）。
   */
  const handleUnban = async (row: PlayerRow) => {
    const ok = await showConfirm(`確認要解封用戶「${row.username}」嗎？`)
    if (!ok) return
    setRows((prev) =>
      prev.map((item) => {
        if (item.id !== row.id) return item
        const updated: PlayerRow = {
          ...item,
          status: '正常',
        }
        return appendNote(updated, '解封帳號（示意操作）。', '客服 Demo')
      }),
    )
  }

  /**
   * @description 禁言用戶（模擬，並追加一筆備註）。
   */
  const handleMute = async (row: PlayerRow) => {
    const ok = await showConfirm(`確認要將用戶「${row.username}」設定為禁言狀態嗎？`)
    if (!ok) return
    setRows((prev) =>
      prev.map((item) => {
        if (item.id !== row.id) return item
        const updated: PlayerRow = {
          ...item,
          status: '禁言中',
        }
        return appendNote(updated, '設定為禁言狀態（示意）。', '客服 Demo')
      }),
    )
  }

  /**
   * @description 解除禁言（模擬，並追加一筆備註）。
   */
  const handleUnmute = async (row: PlayerRow) => {
    const ok = await showConfirm(`確認要解除用戶「${row.username}」的禁言狀態嗎？`)
    if (!ok) return
    setRows((prev) =>
      prev.map((item) => {
        if (item.id !== row.id) return item
        const updated: PlayerRow = {
          ...item,
          status: '正常',
        }
        return appendNote(updated, '解除禁言狀態（示意）。', '客服 Demo')
      }),
    )
  }

  /**
   * @description 將用戶加入黑名單（模擬），並以備註記錄黑名單原因。
   * 實務上需填寫原因 / 來源，並禁止該身分資訊再次註冊。
   */
  const handleBlacklist = async (row: PlayerRow) => {
    const latest = getLatestNote(row)
    const reason = await showPrompt(
      `確認要將用戶「${row.username}」加入黑名單嗎？\n建議輸入黑名單原因（必填於實務環境）：`,
      latest?.message ?? '',
    )
    if (reason === null) return
    const trimmed = reason.trim()
    const ok = await showConfirm(
      `再次確認：將用戶「${row.username}」加入黑名單。\n` +
        `示意：後端應禁止其再次註冊 / 登入，並寫入 Audit Log。\n\n` +
        (trimmed ? `黑名單原因：${trimmed}` : '（目前未填寫原因，正式環境不建議）'),
    )
    if (!ok) return
    setRows((prev) =>
      prev.map((item) => {
        if (item.id !== row.id) return item
        let updated: PlayerRow = {
          ...item,
          status: '黑名單',
        }
        if (trimmed) {
          updated = appendNote(updated, `加入黑名單：${trimmed}`, '風控 / 客服 Demo')
        } else {
          updated = appendNote(updated, '加入黑名單（未填寫原因，示意）。', '風控 / 客服 Demo')
        }
        return updated
      }),
    )
  }

  /**
   * @description 將用戶自黑名單移除（模擬），並追加備註。
   */
  const handleRemoveBlacklist = async (row: PlayerRow) => {
    const ok = await showConfirm(
      `確認要將用戶「${row.username}」從黑名單移除嗎？\n` +
        '建議實務上記錄審核流程與原因，並保留歷史紀錄。',
    )
    if (!ok) return
    setRows((prev) =>
      prev.map((item) => {
        if (item.id !== row.id) return item
        const updated: PlayerRow = {
          ...item,
          status: '正常',
        }
        return appendNote(updated, '移出黑名單（示意）。', '風控 / 客服 Demo')
      }),
    )
  }

  /**
   * @description 模擬重置密碼。
   */
  const handleResetPassword = async (row: PlayerRow) => {
    const ok = await showConfirm(
      `確認要重置用戶「${row.username}」的登入密碼嗎？\n建議實務上顯示一次性密碼並記錄 Audit Log。`,
    )
    if (!ok) return
    const generated = `tmp-${Math.random().toString(36).slice(2, 8)}`
    await showAlert(
      `已模擬重置密碼。\n一次性新密碼（示意）：${generated}\n` +
        '請務必在真實環境中僅顯示一次並寫入 Audit Log。',
    )
  }

  /**
   * @description 開啟調整點數 / Bonus 點數的表單抽屜。
   * 可從列表工具列或個別用戶詳情觸發，若有 row 則預設綁定該用戶。
   */
  const handleAdjustBalance = (row?: PlayerRow) => {
    setAdjustingUser(row ?? null)
    setAdjustForm({
      operation: 'add',
      balanceType: 'points',
      amount: '',
      reason: '',
      ticketId: '',
    })
  }

  /**
   * @description 關閉調整點數 / Bonus 抽屜並重置表單。
   */
  const handleCloseAdjustDrawer = () => {
    setAdjustForm(null)
    setAdjustingUser(null)
  }

  /**
   * @description 模擬送出調整點數 / Bonus 點數表單。
   * 僅在前端顯示確認訊息，不修改實際餘額，用於演練流程與 UI。
   */
  const handleSubmitAdjust = async () => {
    if (!adjustForm) return

    const rawAmount = adjustForm.amount.trim()
    const amountNumber = Number(rawAmount)
    if (!rawAmount || Number.isNaN(amountNumber) || amountNumber <= 0) {
      await showAlert('請輸入大於 0 的「調整金額」，僅接受數字。')
      return
    }

    if (amountNumber > MAX_ADJUST_AMOUNT) {
      await showAlert(
        `單次最大可調整金額為 ${MAX_ADJUST_AMOUNT.toLocaleString()}，請拆分為多次操作。`,
      )
      return
    }

    if (!adjustForm.reason.trim()) {
      await showAlert('請填寫「調整原因」，實務上建議為必填欄位並寫入 Audit Log。')
      return
    }

    const targetLabel = adjustingUser
      ? `${adjustingUser.displayName ?? adjustingUser.username} (ID: ${adjustingUser.id})`
      : '未綁定特定用戶（示意：實務上應先選擇具體用戶）'

    const balanceLabel =
      adjustForm.balanceType === 'points' ? '點數 points' : 'Bonus 點數'

    const directionLabel = adjustForm.operation === 'add' ? '增加' : '扣除'

    await showAlert(
      `已模擬送出調整申請：\n\n` +
        `目標：${targetLabel}\n` +
        `項目：${balanceLabel}\n` +
        `方向：${directionLabel}\n` +
        `金額：${amountNumber}\n` +
        `原因：${adjustForm.reason.trim()}\n` +
        (adjustForm.ticketId.trim()
          ? `工單 / 參考編號：${adjustForm.ticketId.trim()}\n`
          : '') +
        '\n示意：實務上應呼叫後端 API、檢查 RBAC 並寫入 Audit Log。',
    )

    handleCloseAdjustDrawer()
  }

  /**
   * @description 更新單一用戶列（供資料維護清單與其他子功能共用）。
   */
  const handleUpdateRow = (updated: PlayerRow) => {
    setRows((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
    )
    // 若詳情抽屜正開啟同一用戶，也同步更新。
    setDetailUser((current) =>
      current && current.id === updated.id ? { ...current, ...updated } : current,
    )
  }

  /**
   * @description 被封禁 / 禁言 / 黑名單的用戶，用於「封禁 / 禁言管理」子頁。
   */
  const bannedOrMutedRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.status === '封禁' || row.status === '禁言中' || row.status === '黑名單',
      ),
    [rows],
  )

  /**
   * @description 黑名單用戶清單，獨立子頁顯示。
   */
  const blacklistRows = useMemo(() => rows.filter((row) => row.status === '黑名單'), [rows])

  /**
   * @description 本頁功能清單，用於規格藍圖 tab。
   */
  const features: FeatureItem[] = [
    {
      id: 6,
      name: '搜尋用戶',
      description: '支援用戶名 / Email / ID 關鍵字搜尋，建議加上自動補齊與歷史搜尋。',
      tag: '查詢',
    },
    {
      id: 7,
      name: '類型區隔篩選',
      description: '按 Player / Broadcaster / 封禁視圖切換，主播仍保留會員屬性但獨立視圖。',
      tag: '視圖',
    },
    {
      id: 8,
      name: '欄位排序',
      description:
        '餘額 / Bonus 餘額 / 創建時間 / 用戶名列提供可點擊排序（前端+後端排序）。',
      tag: '表格',
    },
    {
      id: 9,
      name: '分頁瀏覽',
      description: '每頁 20 筆，可調整分頁大小並顯示總筆數與當前篩選條件。',
      tag: '表格',
    },
    {
      id: 10,
      name: '設為 / 取消主播',
      description:
        '一鍵切換主播權限，需清楚提示將影響行銷活動受眾、任務規則與收益分潤。',
      tag: '高風險',
    },
    {
      id: 11,
      name: '封禁 / 解封',
      description:
        '設定封禁原因 / 期限（永久 / 一段時間），須 RBAC 控制與 Audit Log 記錄。',
      tag: 'RBAC',
    },
    {
      id: 12,
      name: '查看用戶詳情',
      description:
        '用抽屜顯示 Overview / 直播歷史 / 送禮記錄 / 財務摘要 / Bonus 流水等多 Tab 資訊。',
      tag: '抽屜',
    },
    {
      id: 13,
      name: '重置密碼',
      description:
        '生成一次性隨機密碼，只顯示一次並要求管理員二次確認與風險提示，必記 Audit Log。',
      tag: '高風險',
    },
    {
      id: 14,
      name: '增加 / 扣除點數',
      description:
        '支援正向發放與負向扣除點數，需輸入原因與來源，並顯示餘額變化預估與 RBAC 檢查。',
      tag: '高風險',
    },
    {
      id: 15,
      name: '增加 / 扣除 Bonus 點數',
      description:
        '同一套表單元件處理 Bonus points 發放 / 回收，需標明來源（活動 / 任務 / 推薦 / 風控）。',
      tag: '高風險',
    },
    {
      id: 16,
      name: '用戶備註（多筆）',
      description:
        '管理員專用內部備忘，可多次新增備註，記錄異動原因與時間戳，建議串接 Audit Log。',
      tag: '內部',
    },
    {
      id: 17,
      name: '禁言用戶',
      description:
        '設定禁言分鐘數並預覽到期時間，需顯示目前禁言狀態與剩餘時間，操作需確認。',
      tag: '風控',
    },
    {
      id: 18,
      name: '匯出 CSV',
      description:
        '根據當前篩選結果匯出，支援含 / 不含敏感欄位選擇並在前端提示口徑與 RBAC 限制。',
      tag: '匯出',
    },
    {
      id: 19,
      name: '黑名單管理',
      description:
        '將高風險用戶列入黑名單，禁止再次註冊 / 登入，並清楚區分於一般封禁用戶。',
      tag: '風控',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Sub tabs: 用戶列表 / 封禁管理 / 資料維護清單 / 規格藍圖 / 黑名單清單 */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">Player / 用戶管理</span>
          <span className="text-[10px] text-slate-500">
            透過子頁籤區分「實際操作」、「資料維護」、「黑名單」與「規格藍圖」。
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'list'
                ? 'bg-sky-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            用戶列表
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('banned')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'banned'
                ? 'bg-amber-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            封禁 / 禁言管理
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'maintenance'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            資料維護清單
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blueprint')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'blueprint'
                ? 'bg-slate-700 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            功能清單（規格）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blacklist')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'blacklist'
                ? 'bg-rose-700 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            黑名單清單
          </button>
        </div>
      </section>

      {/* Tab: 用戶列表（含搜尋 / 分頁 / 操作） */}
      {activeTab === 'list' && (
        <>
          {/* Search & filters */}
          <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
            <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-sky-400" />
                <span className="font-semibold">用戶搜尋與篩選</span>
              </div>
              <span className="text-[10px] text-slate-500">
                實務上建議所有操作前先查 RBAC 與 Audit Log。
              </span>
            </header>
            <div className="flex flex-wrap gap-2">
              <div className="flex min-w-[220px] flex-1 items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value)
                    setPage(1)
                  }}
                  placeholder="用戶名 / 顯示名稱 / Email / ID"
                  className="h-6 flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
              <select
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100"
                value={typeFilter}
                onChange={(e) =>
                  handleFilterChange(
                    () => e.target.value as '全部' | 'Player' | 'Broadcaster' | '封禁',
                    typeFilter,
                  )
                }
              >
                <option value="全部">全部類型</option>
                <option value="Player">Player</option>
                <option value="Broadcaster">Broadcaster</option>
                <option value="封禁">封禁用戶</option>
              </select>
              <select
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100"
                value={statusFilter}
                onChange={(e) =>
                  handleFilterChange(() => e.target.value as '全部' | PlayerStatus, statusFilter)
                }
              >
                <option value="全部">全部狀態</option>
                <option value="正常">正常</option>
                <option value="封禁">封禁</option>
                <option value="禁言中">禁言中</option>
                <option value="黑名單">黑名單</option>
              </select>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-200 hover:border-sky-500/80 hover:text-sky-100"
              >
                高級篩選
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </section>

          {/* Table with pagination */}
          <section className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
            <header className="flex items-center justify-between text-xs text-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">用戶列表（示意）</span>
                <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                  每頁 20 筆 · 支援搜尋 / 篩選 / 分頁 / 匯出 / 黑名單標記
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAdjustBalance()}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500"
                >
                  <CirclePlus className="h-3 w-3" />
                  調整點數 / Bonus
                </button>
                <button
                  type="button"
                  onClick={async () =>
                    await showAlert(
                      '示意：根據當前篩選條件匯出 CSV，並由後端控制欄位與 RBAC。',
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700"
                >
                  匯出 CSV
                </button>
              </div>
            </header>

            <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/80">
              <table className="min-w-full border-collapse text-[11px]">
                <thead className="bg-slate-900/90 text-slate-300">
                  <tr>
                    <th className="w-8 border-b border-slate-800/80 px-2 py-2 text-left">
                      <input type="checkbox" className="h-3 w-3" />
                    </th>
                    <th className="border-b border-slate-800/80 px-2 py-2 text-left">用戶</th>
                    <th className="border-b border-slate-800/80 px-2 py-2 text-left">類型</th>
                    <th className="border-b border-slate-800/80 px-2 py-2 text-left">狀態</th>
                    <th className="border-b border-slate-800/80 px-2 py-2 text-right">
                      點數 (points)
                    </th>
                    <th className="border-b border-slate-800/80 px-2 py-2 text-right">
                      Bonus 點數
                    </th>
                    <th className="border-b border-slate-800/80 px-2 py-2 text-left">會員等級</th>
                    <th className="border-b border-slate-800/80 px-2 py-2 text-left">建立時間</th>
                    <th className="border-b border-slate-800/80 px-2 py-2 text-left">最近活躍</th>
                    <th className="border-b border-slate-800/80 px-2 py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-800/80 text-slate-200">
                      <td className="px-2 py-1.5">
                        <input type="checkbox" className="h-3 w-3" />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {row.displayName ?? row.username}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ID: {row.id} · {row.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">{row.type}</td>
                      <td className="px-2 py-1.5">
                        <span
                          className={[
                            'rounded-full px-2 py-0.5 text-[10px]',
                            row.status === '正常'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : row.status === '封禁'
                              ? 'bg-rose-500/15 text-rose-300'
                              : row.status === '禁言中'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-fuchsia-500/20 text-fuchsia-200',
                          ].join(' ')}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {row.points.toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {row.bonus.toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5">{row.level}</td>
                      <td className="px-2 py-1.5">{row.createdAt}</td>
                      <td className="px-2 py-1.5">{row.lastActive}</td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailUser(row)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700"
                          >
                            <Eye className="h-3 w-3" />
                            詳情
                          </button>
                          {row.status !== '禁言中' ? (
                            <button
                              type="button"
                              onClick={() => handleMute(row)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-amber-200 hover:bg-amber-600/80 hover:text-white"
                            >
                              <VolumeX className="h-3 w-3" />
                              禁言
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUnmute(row)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-amber-200 hover:bg-amber-600/80 hover:text-white"
                            >
                              <Unlock className="h-3 w-3" />
                              解禁
                            </button>
                          )}
                          {row.status !== '封禁' ? (
                            <button
                              type="button"
                              onClick={() => handleBan(row)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-rose-200 hover:bg-rose-600/80 hover:text-white"
                            >
                              <Ban className="h-3 w-3" />
                              封禁
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUnban(row)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-600/80 hover:text-white"
                            >
                              <Unlock className="h-3 w-3" />
                              解封
                            </button>
                          )}
                          {row.status !== '黑名單' ? (
                            <button
                              type="button"
                              onClick={() => handleBlacklist(row)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-fuchsia-200 hover:bg-fuchsia-700/80 hover:text-white"
                            >
                              <UserX className="h-3 w-3" />
                              黑名單
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemoveBlacklist(row)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-fuchsia-200 hover:bg-fuchsia-700/80 hover:text-white"
                            >
                              <Unlock className="h-3 w-3" />
                              移出黑名單
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-6 text-center text-[11px] text-slate-400"
                      >
                        無資料，請調整搜尋或篩選條件，或確認是否為測試環境。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <footer className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>
                    總筆數：{filteredRows.length} · 每頁 {pageSize} 筆
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-200 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    上一頁
                  </button>
                  <span>
                    第 {page} / {totalPages} 頁
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-200 disabled:opacity-40"
                  >
                    下一頁
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </footer>
            </div>
          </section>
        </>
      )}

      {/* Tab: 封禁 / 禁言 / 黑名單管理 */}
      {activeTab === 'banned' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/60 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">封禁 / 禁言 / 黑名單管理</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100">
                僅顯示狀態為「封禁」、「禁言中」或「黑名單」的用戶
              </span>
            </div>
            <span className="text-[10px] text-amber-200">
              高風險操作，建議所有封禁 / 解封 / 解禁 / 黑名單異動都透過 Audit Log 管控。
            </span>
          </header>
          <div className="overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/5">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-amber-950/60 text-amber-100">
                <tr>
                  <th className="w-8 border-b border-amber-500/40 px-2 py-2 text-left">
                    <input type="checkbox" className="h-3 w-3" />
                  </th>
                  <th className="border-b border-amber-500/40 px-2 py-2 text-left">用戶</th>
                  <th className="border-b border-amber-500/40 px-2 py-2 text-left">狀態</th>
                  <th className="border-b border-amber-500/40 px-2 py-2 text-left">最近活躍</th>
                  <th className="border-b border-amber-500/40 px-2 py-2 text-left">
                    最新客服備註（示意）
                  </th>
                  <th className="border-b border-amber-500/40 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {bannedOrMutedRows.map((row) => {
                  const latest = getLatestNote(row)
                  return (
                    <tr key={row.id} className="border-b border-amber-500/30 text-amber-50">
                      <td className="px-2 py-1.5">
                        <input type="checkbox" className="h-3 w-3" />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {row.displayName ?? row.username}
                          </span>
                          <span className="text-[10px] text-amber-200/80">ID: {row.id}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className={[
                            'rounded-full px-2 py-0.5 text-[10px]',
                            row.status === '封禁'
                              ? 'bg-rose-500/30 text-rose-50'
                              : row.status === '禁言中'
                              ? 'bg-amber-500/30 text-amber-50'
                              : 'bg-fuchsia-500/40 text-fuchsia-50',
                          ].join(' ')}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">{row.lastActive}</td>
                      <td className="px-2 py-1.5 text-[10px] text-amber-100/80">
                        {latest ? `${latest.createdAt} · ${latest.message}` : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailUser(row)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-50 hover:bg-amber-500/40"
                          >
                            <Eye className="h-3 w-3" />
                            詳情
                          </button>
                          {row.status === '封禁' && (
                            <button
                              type="button"
                              onClick={() => handleUnban(row)}
                              className="inline-flex items_center gap-0.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-500/40"
                            >
                              <Unlock className="h-3 w-3" />
                              解封
                            </button>
                          )}
                          {row.status === '禁言中' && (
                            <button
                              type="button"
                              onClick={() => handleUnmute(row)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-500/40"
                            >
                              <Unlock className="h-3 w-3" />
                              解禁
                            </button>
                          )}
                          {row.status !== '黑名單' ? (
                            <button
                              type="button"
                              onClick={() => handleBlacklist(row)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-fuchsia-500/25 px-2 py-0.5 text-[10px] text-fuchsia-50 hover:bg-fuchsia-500/40"
                            >
                              <UserX className="h-3 w-3" />
                              黑名單
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemoveBlacklist(row)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-500/40"
                            >
                              <Unlock className="h-3 w-3" />
                              移出黑名單
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {bannedOrMutedRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-[11px] text-amber-100/80"
                    >
                      目前沒有封禁、禁言或黑名單中的用戶。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab: 資料維護清單（基本資料補全 / 客服異動） */}
      {activeTab === 'maintenance' && (
        <PlayerMaintenanceTab rows={rows} onUpdateRow={handleUpdateRow} />
      )}

      {/* Tab: 功能清單（規格藍圖） */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="Player 管理功能清單"
          subtitle="以下為本頁應完成的完整能力範圍，方便 PM / RD / QA 對齊需求。"
          items={features}
          headerExtra={
            <button
              type="button"
              onClick={async () =>
                await showAlert('示意：可在這裡連結到對應的 RBAC / Audit Log 設計文檔。')
              }
              className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700"
            >
              <KeyRound className="h-3 w-3" />
              對應權限與 Audit Log 規格
            </button>
          }
        />
      )}

      {/* Tab: 黑名單清單 */}
      {activeTab === 'blacklist' && (
        <section className="space-y-3 rounded-2xl border border-rose-700/70 bg-slate-950/90 p-4">
          <header className="mb-1 flex items-center justify_between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <UserX className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold">黑名單清單</span>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100">
                僅顯示狀態為「黑名單」的用戶，示意禁止再次註冊 / 登入
              </span>
            </div>
            <span className="text-[10px] text-rose-200">
              實務上建議黑名單與法務 / 風控流程對齊，所有變更必須稽核。
            </span>
          </header>
          <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-rose-500/5">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-rose-950/70 text-rose-50">
                <tr>
                  <th className="w-8 border-b border-rose-600/60 px-2 py-2 text-left">
                    <input type="checkbox" className="h-3 w-3" />
                  </th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">用戶</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">Email</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">最近活躍</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">
                    黑名單原因 / 最新備註
                  </th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {blacklistRows.map((row) => {
                  const latest = getLatestNote(row)
                  return (
                    <tr key={row.id} className="border-b border-rose-600/40 text-rose-50">
                      <td className="px-2 py-1.5">
                        <input type="checkbox" className="h-3 w-3" />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {row.displayName ?? row.username}
                          </span>
                          <span className="text-[10px] text-rose-100/80">ID: {row.id}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">{row.email}</td>
                      <td className="px-2 py-1.5">{row.lastActive}</td>
                      <td className="px-2 py-1.5 text-[10px] text-rose-100/80">
                        {latest ? `${latest.createdAt} · ${latest.message}` : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailUser(row)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/25 px-2 py-0.5 text-[10px] text-rose-50 hover:bg-rose-500/40"
                          >
                            <Eye className="h-3 w-3" />
                            詳情
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlacklist(row)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-500/40"
                          >
                            <Unlock className="h-3 w-3" />
                            移出黑名單
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {blacklistRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-[11px] text-rose-100/80"
                    >
                      目前沒有黑名單中的用戶。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 詳情抽屜：模擬 Overview + 直播 + 送禮 + 交易 + Bonus + 任務等子區塊 */}
      {detailUser && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-800/80 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Users className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-semibold">用戶詳情</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {detailUser.displayName ?? detailUser.username} · ID: {detailUser.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-sky-500/80 hover:text-sky-200"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-slate-200">
              {/* Overview */}
              <section className="mb-3 space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3">
                <h3 className="text-xs font-semibold text-slate-100">Overview</h3>
                <p className="text-[11px] text-slate-400">
                  快速總覽用戶等級、餘額、狀態與基本資料（含身份證 / 地址等），實務上可放在第一屏。
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-slate-400">顯示名稱</div>
                    <div className="text-slate-100">
                      {detailUser.displayName ?? detailUser.username}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Email</div>
                    <div className="text-slate-100">{detailUser.email}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">會員等級</div>
                    <div className="text-slate-100">{detailUser.level}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">帳號狀態</div>
                    <div className="text-slate-100">{detailUser.status}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">點數 (points)</div>
                    <div className="text-slate-100">
                      {detailUser.points.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Bonus 點數</div>
                    <div className="text-slate-100">
                      {detailUser.bonus.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">手機</div>
                    <div className="text-slate-100">
                      {detailUser.phone ?? '尚未填寫'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">國家 / 地區</div>
                    <div className="text-slate-100">
                      {detailUser.country ?? '尚未填寫'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">生日</div>
                    <div className="text-slate-100">
                      {detailUser.birthday ?? '尚未填寫'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">性別</div>
                    <div className="text-slate-100">
                      {detailUser.gender ?? '尚未填寫'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">身份證號</div>
                    <div className="text-slate-100">
                      {detailUser.nationalId ?? '尚未填寫'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">資料狀態</div>
                    <div className="text-slate-100">
                      {detailUser.profileCompleted ? '已補全' : '待補全'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">地址</div>
                    <div className="text-slate-100">
                      {detailUser.address ?? '尚未填寫'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">城市 / 郵遞區號</div>
                    <div className="text-slate-100">
                      {detailUser.city ?? '—'}
                      {detailUser.postalCode ? ` · ${detailUser.postalCode}` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">建立時間</div>
                    <div className="text-slate-100">{detailUser.createdAt}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">最近活躍</div>
                    <div className="text-slate-100">{detailUser.lastActive}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-400">客服備註 / 異動歷史（時間軸）</div>
                    {detailUser.notes && detailUser.notes.length > 0 ? (
                      <ul className="mt-1 max-h-32 space-y-1 overflow-auto pr-1">
                        {detailUser.notes
                          .slice()
                          .reverse()
                          .map((note) => (
                            <li
                              key={note.id}
                              className="rounded-md bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-slate-300">{note.createdAt}</span>
                                <span className="text-sky-300">{note.createdBy}</span>
                              </div>
                              <p className="mt-0.5 text-slate-100">{note.message}</p>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="text-slate-100">尚未填寫客服備註</div>
                    )}
                  </div>
                </div>
              </section>

              {/* 直播 / 送禮 / 交易 / Bonus / 任務 區塊示意 */}
              <section className="mb-3 space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3">
                <h3 className="text-xs font-semibold text-slate-100">直播歷史（示意）</h3>
                <p className="text-[11px] text-slate-400">
                  實作時可拉「該主播每場直播」列表，支援時間範圍與收益檢視。
                </p>
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/80 px-2 py-1.5 text-[10px] text-slate-300">
                  暫無真實資料，僅示意結構：場次、開播時間、時長、禮物收入、抽成 / 淨收入。
                </div>
              </section>

              <section className="mb-3 space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3">
                <h3 className="text-xs font-semibold text-slate-100">送禮記錄（示意）</h3>
                <p className="text-[11px] text-slate-400">
                  實作時可依禮物、金額區間、時間範圍查詢，並支援匯出。
                </p>
              </section>

              <section className="mb-3 space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3">
                <h3 className="text-xs font-semibold text-slate-100">交易與 Bonus 流水（示意）</h3>
                <p className="text-[11px] text-slate-400">
                  建議統一展示充值 / 消費 / 抽成 / Bonus 發放 / 回滾，並可切換「僅 Bonus」視圖。
                </p>
              </section>

              <section className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3">
                <h3 className="text-xs font-semibold text-slate-100">高風險操作（示意）</h3>
                <p className="text-[11px] text-slate-400">
                  以下按鈕僅做流程演練，實務上需串接後端 API 並寫入 Audit Log。
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetPassword(detailUser)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700"
                  >
                    <KeyRound className="h-3 w-3" />
                    重置密碼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustBalance(detailUser)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] text-white hover:bg-emerald-500"
                  >
                    <CirclePlus className="h-3 w-3" />
                    調整點數 / Bonus
                  </button>
                  <button
                    type="button"
                    onClick={async () =>
                      await showAlert('示意：打開「用戶備註」編輯表單，支援多管理員標註。')
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700"
                  >
                    備註
                  </button>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

      {/* 調整點數 / Bonus 點數抽屜：從列表工具列或用戶詳情觸發 */}
      {adjustForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-emerald-600/60 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-emerald-600/40 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-emerald-50">
                  <CirclePlus className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold">調整點數 / Bonus 點數</span>
                </div>
                <p className="mt-0.5 text-[11px] text-emerald-200/80">
                  僅示意流程與表單欄位，實務上需由後端檢查 RBAC、風控規則並寫入 Audit Log。
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseAdjustDrawer}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-700/80 bg-slate-900/80 text-emerald-200 hover:border-emerald-400 hover:text-emerald-100"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-emerald-50">
              {adjustingUser ? (
                <section className="mb-3 rounded-lg border border-emerald-600/50 bg-emerald-500/10 px-3 py-2">
                  <div className="text-[11px] font-semibold text-emerald-100">
                    目標用戶
                  </div>
                  <div className="mt-0.5 text-[11px] text-emerald-100">
                    {adjustingUser.displayName ?? adjustingUser.username}
                  </div>
                  <div className="text-[10px] text-emerald-200/80">
                    ID: {adjustingUser.id} · {adjustingUser.email}
                  </div>
                  <p className="mt-1 text-[10px] text-emerald-200/80">
                    示意：此處鎖定單一用戶，實務上也可支援「多選用戶」批次調整。
                  </p>
                </section>
              ) : (
                <section className="mb-3 rounded-lg border border-emerald-600/40 bg-slate-950/80 px-3 py-2">
                  <div className="text-[11px] font-semibold text-emerald-100">
                    尚未選擇具體用戶
                  </div>
                  <p className="mt-1 text-[10px] text-emerald-200/80">
                    目前從列表工具列開啟，僅示意調整表單。實務上建議：
                    先從「用戶列表」勾選用戶或從「用戶詳情」進入再執行調整。
                  </p>
                </section>
              )}

              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmitAdjust()
                }}
              >
                <section className="space-y-2 rounded-lg border border-emerald-700/60 bg-slate-950/80 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-[11px] text-emerald-100">操作方向</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setAdjustForm((prev) =>
                              prev ? { ...prev, operation: 'add' } : prev,
                            )
                          }
                          className={[
                            'flex-1 rounded-full px-2 py-1 text-[10px]',
                            adjustForm.operation === 'add'
                              ? 'bg-emerald-600 text-white'
                              : 'border border-emerald-700/80 bg-slate-900/80 text-emerald-100 hover:bg-slate-800/80',
                          ].join(' ')}
                        >
                          增加
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAdjustForm((prev) =>
                              prev ? { ...prev, operation: 'deduct' } : prev,
                            )
                          }
                          className={[
                            'flex-1 rounded-full px-2 py-1 text-[10px]',
                            adjustForm.operation === 'deduct'
                              ? 'bg-rose-600 text-white'
                              : 'border border-emerald-700/80 bg-slate-900/80 text-emerald-100 hover:bg-slate-800/80',
                          ].join(' ')}
                        >
                          扣除
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-emerald-100">調整項目</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setAdjustForm((prev) =>
                              prev ? { ...prev, balanceType: 'points' } : prev,
                            )
                          }
                          className={[
                            'flex-1 rounded-full px-2 py-1 text-[10px]',
                            adjustForm.balanceType === 'points'
                              ? 'bg-slate-700 text-white'
                              : 'border border-emerald-700/80 bg-slate-900/80 text-emerald-100 hover:bg-slate-800/80',
                          ].join(' ')}
                        >
                          點數 points
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAdjustForm((prev) =>
                              prev ? { ...prev, balanceType: 'bonus' } : prev,
                            )
                          }
                          className={[
                            'flex-1 rounded-full px-2 py-1 text-[10px]',
                            adjustForm.balanceType === 'bonus'
                              ? 'bg-slate-700 text-white'
                              : 'border border-emerald-700/80 bg-slate-900/80 text-emerald-100 hover:bg-slate-800/80',
                          ].join(' ')}
                        >
                          Bonus 點數
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">
                      調整金額
                    </label>
                    <input
                      value={adjustForm.amount}
                      onChange={(e) =>
                        setAdjustForm((prev) =>
                          prev ? { ...prev, amount: e.target.value } : prev,
                        )
                      }
                      inputMode="decimal"
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="請輸入大於 0 的金額"
                    />
                    <p className="text-[10px] text-emerald-300/80">
                      示意：實務上建議顯示「調整前 / 調整後預估餘額」，並限制單次最大金額（目前上限{' '}
                      {MAX_ADJUST_AMOUNT.toLocaleString()}）。
                    </p>

                    {adjustingUser && adjustPreview && (
                      <div className="mt-2 rounded-md border border-emerald-700/60 bg-slate-950/80 px-2 py-1.5 text-[10px] text-emerald-100">
                        <div className="mb-1 text-[10px] font-semibold text-emerald-100">
                          預估餘額試算（{adjustPreview.balanceLabel}）
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="text-emerald-300/80">目前餘額</div>
                            <div className="font-mono text-emerald-50">
                              {adjustPreview.baseLabel}
                            </div>
                          </div>
                          <div>
                            <div className="text-emerald-300/80">本次變動</div>
                            <div className="font-mono text-emerald-50">
                              {adjustPreview.deltaLabel}
                            </div>
                          </div>
                          <div>
                            <div className="text-emerald-300/80">預估調整後</div>
                            <div className="font-mono text-emerald-50">
                              {adjustPreview.afterLabel ?? '—'}
                            </div>
                          </div>
                        </div>
                        {!adjustPreview.afterLabel && (
                          <p className="mt-1 text-[10px] text-emerald-300/80">
                            請先輸入大於 0 的金額，即可看到預估調整後餘額。
                          </p>
                        )}
                        {adjustPreview.isOverLimit && (
                          <p className="mt-1 text-[10px] text-rose-300">
                            已超過單次最大金額 {MAX_ADJUST_AMOUNT.toLocaleString()}，請拆分為多次調整。
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-2 rounded-lg border border-emerald-700/60 bg-slate-950/80 p-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">
                      調整原因（必填）
                    </label>
                    <textarea
                      value={adjustForm.reason}
                      onChange={(e) =>
                        setAdjustForm((prev) =>
                          prev ? { ...prev, reason: e.target.value } : prev,
                        )
                      }
                      rows={3}
                      className="w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="請描述此次增加 / 扣除的原因、來源（例如：活動發放、人工補發、風控回收……）"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">
                      工單 / 參考編號（選填）
                    </label>
                    <input
                      value={adjustForm.ticketId}
                      onChange={(e) =>
                        setAdjustForm((prev) =>
                          prev ? { ...prev, ticketId: e.target.value } : prev,
                        )
                      }
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="例如：JIRA-123 / TICKET-20250301-0001"
                    />
                    <p className="text-[10px] text-emerald-300/80">
                      建議將此欄位與工單 / 稽核系統串接，方便日後追蹤。
                    </p>
                  </div>
                </section>

                <section className="space-y-1 rounded-lg border border-amber-500/60 bg-amber-500/10 p-3 text-[10px] text-amber-50">
                  <div className="font-semibold">風險提醒</div>
                  <ul className="list-disc space-y-0.5 pl-4">
                    <li>此為高風險操作，應限制在具備對應 RBAC 權限的管理員。</li>
                    <li>所有調整紀錄須寫入 Audit Log，包含操作人、時間、IP 與原因。</li>
                    <li>建議支援「雙人覆核 / 四眼原則」以降低人為風險。</li>
                  </ul>
                </section>

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseAdjustDrawer}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-emerald-100 hover:bg-slate-800/80"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500"
                  >
                    送出調整（模擬）
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

/**
 * @description 調整點數 / Bonus 點數的表單狀態模型。
 */
interface AdjustBalanceFormState {
  /** 操作方向：增加或扣除。 */
  operation: 'add' | 'deduct'
  /** 調整目標：點數或 Bonus 點數。 */
  balanceType: 'points' | 'bonus'
  /** 調整金額；以字串儲存便於輸入驗證。 */
  amount: string
  /** 調整原因 / 備註，實務上建議必填。 */
  reason: string
  /** 相關工單 / 票券 / 審核編號（選填）。 */
  ticketId: string
}

/**
 * @description 資料維護清單子頁：專門列出待補全 / 已補全用戶，並提供基本資料編輯及客服異動紀錄。
 */
interface PlayerMaintenanceTabProps {
  /** 全部用戶列。 */
  rows: PlayerRow[]
  /** 儲存單筆用戶變更。 */
  onUpdateRow: (row: PlayerRow) => void
}

/**
 * @description 編輯表單狀態模型。
 */
interface MaintenanceFormState {
  displayName: string
  email: string
  phone: string
  country: string
  birthday: string
  nationalId: string
  address: string
  city: string
  postalCode: string
  gender: PlayerGender | ''
  profileCompleted: boolean
  /** 本次異動的備註 / 原因（會新增一筆 notes）。 */
  newNote: string
}

/**
 * @description Player 資料維護清單與基本資料編輯抽屜。
 * - 支援「僅看待補全」與「查看全部」切換。
 * - 可補全 / 修改顯示名稱、Email、手機、國家、生日、身份證號、地址、城市與郵遞區號、性別。
 * - 可填寫「客服備註 / 異動原因」，以 notes 陣列累積歷史紀錄。
 */
function PlayerMaintenanceTab(props: PlayerMaintenanceTabProps) {
  const { rows, onUpdateRow } = props
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(true)
  const [editingUser, setEditingUser] = useState<PlayerRow | null>(null)
  const [form, setForm] = useState<MaintenanceFormState | null>(null)

  const totalIncomplete = useMemo(
    () => rows.filter((row) => !row.profileCompleted).length,
    [rows],
  )

  const maintenanceRows = useMemo(() => {
    const base = rows
    if (showOnlyIncomplete) {
      return base.filter((row) => !row.profileCompleted)
    }
    return base
  }, [rows, showOnlyIncomplete])

  /**
   * @description 開啟指定用戶的資料維護抽屜。
   */
  const startEdit = (row: PlayerRow) => {
    setEditingUser(row)
    setForm({
      displayName: row.displayName ?? row.username,
      email: row.email,
      phone: row.phone ?? '',
      country: row.country ?? '',
      birthday: row.birthday ?? '',
      nationalId: row.nationalId ?? '',
      address: row.address ?? '',
      city: row.city ?? '',
      postalCode: row.postalCode ?? '',
      gender: row.gender ?? '',
      profileCompleted: row.profileCompleted ?? false,
      newNote: '',
    })
  }

  /**
   * @description 儲存基本資料修改（模擬）。
   * - 可同時作為資料補全與客服協助異動。
   * - 若填寫 newNote，會新增一筆 notes 紀錄。
   */
  const handleSave = async () => {
    if (!editingUser || !form) return
    if (!form.email.trim()) {
      await showAlert('Email 為必填欄位。')
      return
    }
    const baseUpdated: PlayerRow = {
      ...editingUser,
      displayName: form.displayName.trim() || editingUser.username,
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      country: form.country.trim() || undefined,
      birthday: form.birthday.trim() || undefined,
      nationalId: form.nationalId.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      gender: form.gender || undefined,
      profileCompleted: form.profileCompleted,
    }

    let updated: PlayerRow = baseUpdated
    if (form.newNote.trim()) {
      updated = appendNote(baseUpdated, form.newNote, '客服維護')
    }

    onUpdateRow(updated)
    setEditingUser(null)
    setForm(null)
  }

  /**
   * @description 關閉編輯抽屜。
   */
  const handleCloseDrawer = () => {
    setEditingUser(null)
    setForm(null)
  }

  return (
    <>
      <section className="space-y-3 rounded-2xl border border-emerald-600/60 bg-slate-950/80 p-4">
        <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold">資料維護清單</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-100">
              待補全 {totalIncomplete} 筆 · 支援僅看待補全 / 全部切換 · 可協助異動基本資料與留下備註
            </span>
          </div>
          <span className="text-[10px] text-emerald-200">
            建議實作時搭配任務 / 工單系統，追蹤誰在何時完成資料補全或異動。
          </span>
        </header>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setShowOnlyIncomplete(true)}
            className={[
              'rounded-full px-2 py-0.5',
              showOnlyIncomplete
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-700/80 bg-slate-900/80 text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            僅看待補全
          </button>
          <button
            type="button"
            onClick={() => setShowOnlyIncomplete(false)}
            className={[
              'rounded-full px-2 py-0.5',
              !showOnlyIncomplete
                ? 'bg-slate-700 text-white'
                : 'border border-slate-700/80 bg-slate-900/80 text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            查看全部用戶
          </button>
          <span className="text-[10px] text-slate-500">
            待補全條件示例：缺手機 / 缺國家 / 缺生日 / 缺身份證或 profileCompleted = false。
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-emerald-500/40 bg-emerald-500/5">
          <table className="min-w-full border-collapse text-[11px]">
            <thead className="bg-emerald-950/60 text-emerald-100">
              <tr>
                <th className="w-8 border-b border-emerald-500/40 px-2 py-2 text-left">
                  <input type="checkbox" className="h-3 w-3" />
                </th>
                <th className="border-b border-emerald-500/40 px-2 py-2 text-left">用戶</th>
                <th className="border-b border-emerald-500/40 px-2 py-2 text-left">Email</th>
                <th className="border-b border-emerald-500/40 px-2 py-2 text-left">手機</th>
                <th className="border-b border-emerald-500/40 px-2 py-2 text-left">
                  國家 / 地區
                </th>
                <th className="border-b border-emerald-500/40 px-2 py-2 text-left">生日</th>
                <th className="border-b border-emerald-500/40 px-2 py-2 text-left">
                  身份證號
                </th>
                <th className="border-b border-emerald-500/40 px-2 py-2 text-left">資料狀態</th>
                <th className="border-b border-emerald-500/40 px-2 py-2 text-left">
                  最新客服備註 / 異動原因
                </th>
                <th className="border-b border-emerald-500/40 px-2 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceRows.map((row) => {
                const latest = getLatestNote(row)
                return (
                  <tr
                    key={row.id}
                    className="border-b border-emerald-500/30 text-emerald-50"
                  >
                    <td className="px-2 py-1.5">
                      <input type="checkbox" className="h-3 w-3" />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {row.displayName ?? row.username}
                        </span>
                        <span className="text-[10px] text-emerald-100/80">
                          ID: {row.id} · {row.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">{row.email}</td>
                    <td className="px-2 py-1.5">
                      {row.phone ?? <span className="text-emerald-200/70">未填寫</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      {row.country ?? <span className="text-emerald-200/70">未填寫</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      {row.birthday ?? <span className="text-emerald-200/70">未填寫</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      {row.nationalId ?? (
                        <span className="text-emerald-200/70">未填寫</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-[10px]',
                          row.profileCompleted
                            ? 'bg-emerald-500/40 text-emerald-50'
                            : 'bg-amber-500/40 text-amber-50',
                        ].join(' ')}
                      >
                        {row.profileCompleted ? '已補全' : '待補全'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-emerald-100/80">
                      {latest ? `${latest.createdAt} · ${latest.message}` : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-500/40"
                      >
                        維護
                      </button>
                    </td>
                  </tr>
                )
              })}
              {maintenanceRows.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-6 text-center text-[11px] text-emerald-100/80"
                  >
                    目前沒有符合條件的用戶。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 編輯抽屜：基本資料補全 / 修改 + 客服備註時間軸 */}
      {editingUser && form && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-emerald-600/60 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-emerald-600/40 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-emerald-50">
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold">基本資料維護</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-emerald-200/80">
                  {editingUser.displayName ?? editingUser.username} · ID: {editingUser.id}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-700/80 bg-slate-900/80 text-emerald-200 hover:border-emerald-400 hover:text-emerald-100"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-emerald-50">
              <p className="mb-3 text-[11px] text-emerald-200/80">
                此處聚焦「個人基本資料維護」，不直接處理點數 / Bonus 或權限等高風險欄位。
                可同時用於資料補全與客服協助異動，每次異動建議填寫原因並保留在備註時間軸中。
              </p>

              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSave()
                }}
              >
                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">
                    顯示名稱
                  </label>
                  <input
                    value={form.displayName}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, displayName: e.target.value } : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="對前台或客服顯示的名稱"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">
                    Email（必填）
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, email: e.target.value } : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="example@mail.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">手機</label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, phone: e.target.value } : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="+886-9xx-xxx-xxx"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">
                    國家 / 地區（ISO 簡碼）
                  </label>
                  <input
                    value={form.country}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, country: e.target.value.toUpperCase() } : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="例如：TW / US / JP"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">
                    生日（yyyy-MM-dd）
                  </label>
                  <input
                    value={form.birthday}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, birthday: e.target.value } : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="1990-01-01"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">
                    身份證號 / 身分證字號
                  </label>
                  <input
                    value={form.nationalId}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, nationalId: e.target.value.toUpperCase() } : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="例如：A123456789"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">地址</label>
                  <input
                    value={form.address}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, address: e.target.value } : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="縣市 + 區 + 路 / 街 + 號"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">城市</label>
                    <input
                      value={form.city}
                      onChange={(e) =>
                        setForm((prev) =>
                          prev ? { ...prev, city: e.target.value } : prev,
                        )
                      }
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="例如：台北市"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">
                      郵遞區號
                    </label>
                    <input
                      value={form.postalCode}
                      onChange={(e) =>
                        setForm((prev) =>
                          prev ? { ...prev, postalCode: e.target.value } : prev,
                        )
                      }
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="例如：100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">性別</label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, gender: e.target.value as PlayerGender | '' } : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                  >
                    <option value="">未選擇</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="profileCompleted"
                    type="checkbox"
                    checked={form.profileCompleted}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, profileCompleted: e.target.checked } : prev,
                      )
                    }
                    className="h-3 w-3 rounded border-emerald-600 bg-slate-900/80"
                  />
                  <label
                    htmlFor="profileCompleted"
                    className="text-[11px] text-emerald-100"
                  >
                    標記為「資料已補全」
                  </label>
                </div>

                <div className="space-y-1 pt-2">
                  <label className="block text-[11px] text-emerald-100">
                    本次客服備註 / 異動原因
                  </label>
                  <textarea
                    value={form.newNote}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, newNote: e.target.value } : prev,
                      )
                    }
                    rows={3}
                    className="w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="請簡要描述此次補全 / 異動的原因，實務上建議必填並寫入 Audit Log。"
                  />
                </div>

                {editingUser.notes && editingUser.notes.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <div className="text-[11px] text-emerald-100">
                      既有客服備註（最近 3 筆）
                    </div>
                    <ul className="max-h-24 space-y-1 overflow-auto pr-1 text-[10px] text-emerald-50">
                      {editingUser.notes
                        .slice(-3)
                        .reverse()
                        .map((note) => (
                          <li
                            key={note.id}
                            className="rounded-md border border-emerald-700/60 bg-slate-950/90 px-2 py-1"
                          >
                            <div className="flex items-center justify-between">
                              <span>{note.createdAt}</span>
                              <span className="text-emerald-300">
                                {note.createdBy}
                              </span>
                            </div>
                            <p className="mt-0.5">{note.message}</p>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-emerald-100 hover:bg-slate-800/80"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500"
                  >
                    儲存變更
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export default PlayersPage
