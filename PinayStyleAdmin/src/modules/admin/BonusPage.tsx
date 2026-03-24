
/**
 * @file BonusPage.tsx
 * @description Bonus 管理工作台（包含分級、兌換率、發放、扣回、兌換與流水）
 * - 支援分級（含有效期、使用場景、允許主播、允許平台、可兌換商品白名單、權益說明）
 * - 每個 Tier 擁有自己的兌換倍率（bonusToPointsRate）
 * - 發放 / 扣回 / 兌換 / 流水皆綁定 tierCode
 * - 兌換申請可指定目標平台 / 目標主播，審核時會檢核該 tier 的允許清單
 */

import { showAlert, showConfirm, showPrompt } from '../../lib/dialog'
import { useMemo, useState } from 'react'
import {
  Coins,
  PlusCircle,
  Search,
  Filter,
  Edit3,
  Undo2,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Settings2,
  ListChecks,
  History,
  Layers,
  RefreshCcw,
  Wallet,
  Eye,
  Clock,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'
import BonusFinancePanel from './bonus-finance'

/**
 * @description 可切換的 Bonus 管理子頁籤。
 */
type BonusTabId =
  | 'overview'
  | 'tiers'
  | 'rates'
  | 'issuance'
  | 'rollback'
  | 'redeem'
  | 'ledger'
  | 'blueprint'

/**
 * @description Bonus 來源 / 類型。
 */
type BonusSource = '活動' | '任務' | '推薦' | '補發' | '回滾' | '兌換' | '其他'

/**
 * @description Bonus 方向：發放或扣回。
 */
type BonusDirection = '發放' | '扣回'

/**
 * @description Bonus 發放 / 扣回任務狀態。
 */
type BonusTaskStatus = 'draft' | 'pending' | 'processing' | 'done' | 'failed'

/**
 * @description Bonus 發放任務資料模型（一定綁定某個 Bonus 等級）。
 */
interface BonusIssuanceTask {
  id: string
  name: string
  source: BonusSource
  /** 綁定的 Bonus 等級代碼（例如：GOLD / SILVER）。 */
  tierCode: string
  targetType: '單一用戶' | '多用戶匯入'
  userId?: string
  amount: number
  createdAt: string
  createdBy: string
  status: BonusTaskStatus
  note?: string
}

/**
 * @description Bonus 扣回（回滾）任務資料模型。
 */
interface BonusRollbackTask {
  id: string
  name: string
  source: BonusSource
  direction: BonusDirection
  tierCode: string
  affectedCount: number
  totalAmount: number
  createdAt: string
  createdBy: string
  status: BonusTaskStatus
  note?: string
}

/**
 * @description Bonus 流水紀錄資料模型。
 */
interface BonusLedgerRow {
  id: string
  userId: string
  username: string
  direction: BonusDirection
  amount: number
  balanceAfter: number
  source: BonusSource
  tierCode: string
  refId?: string
  createdAt: string
  note?: string
}

/**
 * @description Bonus 兌換申請狀態。
 */
type RedemptionStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled'

/**
 * @description Bonus 兌換申請紀錄資料模型。
 * - 新增 targetHost / targetPlatform：表示用戶在何處要使用該 Bonus（便於審核與驗證）
 */
interface RedemptionRequest {
  id: string
  userId: string
  username: string
  bonusAmount: number
  tierCode: string
  pointsEstimated: number
  channel: 'Points' | 'Coupon'
  status: RedemptionStatus
  createdAt: string
  createdBy: string
  processedAt?: string
  processedBy?: string
  note?: string
  targetHost?: string
  targetPlatform?: string
}

/**
 * @description Bonus 等級 / 分級設定資料模型。
 * - 新增 allowedHosts 與 allowedPlatforms，可限制在特定主播或平台模組使用
 */
interface BonusTier {
  id: string
  code: string
  name: string
  minBalance: number
  maxBalance: number | null
  /** 此等級的兌換倍率：1 Bonus 可兌換多少 points。 */
  bonusToPointsRate: number
  status: 'active' | 'inactive'
  order: number
  /** 生效起始時間（字串表示，示意，實務請使用 ISO） */
  validFrom?: string | null
  /** 生效結束時間（字串表示，示意，實務請使用 ISO） */
  validTo?: string | null
  /** 使用場景限制，例如：['特定主播 A','直播間禮品兑換'] */
  usageScopes?: string[]
  /** 允許兌換的商品 / 禮品白名單（示意） */
  allowedRedemptionItems?: string[]
  /** 允許使用的主播白名單（例如：主播 A、主播 B） */
  allowedHosts?: string[]
  /** 允許的遊戲 / 平台（例如：Slot、Casino） */
  allowedPlatforms?: string[]
  /** 額外權益或備註（結構化） */
  perks?: string[]
  note?: string
}

/**
 * @description Bonus 等級編輯表單狀態（輸入皆以字串為主前端示意）。
 */
interface TierFormState {
  code: string
  name: string
  minBalance: string
  maxBalance: string
  bonusToPointsRate: string
  status: 'active' | 'inactive'
  validFrom: string
  validTo: string
  usageScopes: string
  allowedRedemptionItems: string
  allowedHosts: string
  allowedPlatforms: string
  perks: string
  note: string
}

/**
 * @description Bonus 兌換率全域配置（預設值，用於無對應等級時的 fallback）。
 */
interface ExchangeRateConfig {
  bonusToPointsRate: number
  pointsToBonusRate: number
  minRedeemBonus: number
  stepBonus: number
  dailyMaxBonus: number
  allowReverseExchange: boolean
  effectiveFrom: string
  note: string
}

/**
 * @description 建立現在時間的顯示字串。
 */
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

/**
 * @description 將以逗號分隔的字串解析為陣列（過濾空白）。
 */
function parseCsvToArray(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * @description 產生預設的 Bonus 分級：金 / 銀 / 銅 / 鐵 / 石（含 allowedHosts 與 allowedPlatforms 範例）
 */
function createInitialBonusTiers(): BonusTier[] {
  return [
    {
      id: 'GOLD',
      code: 'GOLD',
      name: '金',
      minBalance: 50_000,
      maxBalance: null,
      bonusToPointsRate: 1.6,
      status: 'active',
      order: 1,
      validFrom: '2025-01-01',
      validTo: null,
      usageScopes: ['全站通用', '高價禮品兌換'],
      allowedRedemptionItems: ['高價禮物 A', '高價禮物 B', '專屬券'],
      allowedHosts: ['主播A', '主播B'],
      allowedPlatforms: ['Slot', 'Casino', 'Live'],
      perks: ['專屬客服', '活動優先權'],
      note: '金等級有更廣的使用場景與高倍率，建議僅對資格用戶開放。',
    },
    {
      id: 'SILVER',
      code: 'SILVER',
      name: '銀',
      minBalance: 10_000,
      maxBalance: 49_999,
      bonusToPointsRate: 1.3,
      status: 'active',
      order: 2,
      validFrom: '2025-01-01',
      validTo: null,
      usageScopes: ['大部分商品', '部分活動'],
      allowedRedemptionItems: ['中價禮物 A', '中價禮物 B'],
      allowedHosts: ['主播A'],
      allowedPlatforms: ['Slot', 'Live'],
      perks: ['活動優先權'],
      note: '銀等級適合常態活躍用戶，提供中階權益與中等倍率。',
    },
    {
      id: 'BRONZE',
      code: 'BRONZE',
      name: '銅',
      minBalance: 3_000,
      maxBalance: 9_999,
      bonusToPointsRate: 1.1,
      status: 'active',
      order: 3,
      validFrom: '2025-01-01',
      validTo: null,
      usageScopes: ['常規商品'],
      allowedRedemptionItems: ['入門禮物 A'],
      allowedHosts: ['主播B'],
      allowedPlatforms: ['Live'],
      perks: [],
      note: '銅等級為進階層，提供少量加成。',
    },
    {
      id: 'IRON',
      code: 'IRON',
      name: '鐵',
      minBalance: 1_000,
      maxBalance: 2_999,
      bonusToPointsRate: 1.0,
      status: 'active',
      order: 4,
      validFrom: '2025-01-01',
      validTo: null,
      usageScopes: ['基礎商品'],
      allowedRedemptionItems: ['基礎禮物 A'],
      allowedHosts: ['主播B'],
      allowedPlatforms: ['Casino'],
      perks: [],
      note: '一般等級，倍率接近 1，限制在特定平台/主播。',
    },
    {
      id: 'STONE',
      code: 'STONE',
      name: '石',
      minBalance: 0,
      maxBalance: 999,
      bonusToPointsRate: 0.9,
      status: 'active',
      order: 5,
      validFrom: '2025-01-01',
      validTo: null,
      usageScopes: ['入門商品（受限）'],
      allowedRedemptionItems: ['新手包'],
      allowedHosts: ['主播A'],
      allowedPlatforms: ['Slot'],
      perks: [],
      note: '入門等級，使用場景較受限，適用新手或低價值帳號。',
    },
  ]
}

/**
 * @description 產生預設的全域兌換率配置（fallback）。
 */
function createDefaultExchangeConfig(): ExchangeRateConfig {
  return {
    bonusToPointsRate: 1,
    pointsToBonusRate: 100,
    minRedeemBonus: 100,
    stepBonus: 50,
    dailyMaxBonus: 10_000,
    allowReverseExchange: false,
    effectiveFrom: '2025-03-01 00:00',
    note: '全域預設兌換率，僅在找不到等級時使用。',
  }
}

/**
 * @description 根據 Bonus 等級與全域預設計算「1 Bonus 可兌換多少 points」。
 */
function resolveBonusToPointsRate(
  tierCode: string,
  tiers: BonusTier[],
  globalConfig: ExchangeRateConfig,
): number {
  const tier = tiers.find((t) => t.code === tierCode && t.status === 'active')
  if (tier) return tier.bonusToPointsRate
  return globalConfig.bonusToPointsRate
}

/**
 * @description Bonus 管理主要元件。
 */
export function BonusPage() {
  const [activeTab, setActiveTab] = useState<BonusTabId>('overview')

  /** Bonus 分級 */
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>(() =>
    createInitialBonusTiers(),
  )
  const [editingTier, setEditingTier] = useState<BonusTier | null>(null)
  const [tierForm, setTierForm] = useState<TierFormState | null>(null)

  /** 全域兌換率配置 */
  const [exchangeConfig, setExchangeConfig] = useState<ExchangeRateConfig>(() =>
    createDefaultExchangeConfig(),
  )
  const [exchangeDraft, setExchangeDraft] = useState<ExchangeRateConfig | null>(null)

  /** 發放、回滾、流水、兌換（示意資料） */
  const [issuanceTasks, setIssuanceTasks] = useState<BonusIssuanceTask[]>(() => [
    {
      id: 'ISS-20250301-001',
      name: '2025/03 登入任務 Bonus 發放（石等級）',
      source: '任務',
      tierCode: 'STONE',
      targetType: '多用戶匯入',
      amount: 50,
      createdAt: '2025-03-01 10:00',
      createdBy: '營運 A',
      status: 'done',
      note: '完成 7 日連續登入任務用戶之獎勵發放，使用石等級 Bonus。',
    },
  ])

  const [rollbackTasks, setRollbackTasks] = useState<BonusRollbackTask[]>(() => [
    {
      id: 'RBK-20250305-001',
      name: '錯誤發放活動回滾（銅等級）',
      source: '回滾',
      direction: '扣回',
      tierCode: 'BRONZE',
      affectedCount: 320,
      totalAmount: 32_000,
      createdAt: '2025-03-05 11:10',
      createdBy: '風控',
      status: 'done',
      note: '活動配置錯誤，按新方案重新發放前先回收銅等級 Bonus。',
    },
  ])

  const [ledgerRows, setLedgerRows] = useState<BonusLedgerRow[]>(() => [
    {
      id: 'LED-1',
      userId: '10001',
      username: 'demo_player',
      direction: '發放',
      amount: 50,
      balanceAfter: 150,
      source: '任務',
      tierCode: 'STONE',
      refId: 'ISS-20250301-001',
      createdAt: '2025-03-01 10:05',
      note: '完成 7 日連續登入任務獎勵（石等級 Bonus）。',
    },
  ])

  const [redemptions, setRedemptions] = useState<RedemptionRequest[]>(() => {
    const tiers = createInitialBonusTiers()
    const fallbackConfig = createDefaultExchangeConfig()

    const rateSilver = resolveBonusToPointsRate('SILVER', tiers, fallbackConfig)

    return [
      {
        id: 'RED-20250320-001',
        userId: '10001',
        username: 'demo_player',
        bonusAmount: 500,
        tierCode: 'SILVER',
        pointsEstimated: Math.round(500 * rateSilver),
        channel: 'Points',
        status: 'pending',
        createdAt: '2025-03-20 12:00',
        createdBy: '系統',
        note: '用戶申請以銀等級 Bonus 兌換 points。',
        targetHost: '主播A',
        targetPlatform: 'Slot',
      },
    ]
  })

  const [issuancePage, setIssuancePage] = useState(1)
  const [rollbackPage, setRollbackPage] = useState(1)
  const [ledgerPage, setLedgerPage] = useState(1)
  const [redemptionPage, setRedemptionPage] = useState(1)
  const pageSize = 5

  const [ledgerKeyword, setLedgerKeyword] = useState('')
  const [ledgerDirectionFilter, setLedgerDirectionFilter] = useState<
    '全部' | BonusDirection
  >('全部')
  const [ledgerSourceFilter, setLedgerSourceFilter] = useState<'全部' | BonusSource>(
    '全部',
  )

  const [redemptionStatusFilter, setRedemptionStatusFilter] = useState<
    '全部' | RedemptionStatus
  >('全部')

  const [issuanceForm, setIssuanceForm] = useState<{
    name: string
    source: BonusSource
    tierCode: string
    targetType: '單一用戶' | '多用戶匯入'
    userId: string
    amount: string
    reason: string
    uploadFileName: string
  } | null>(null)

  const [rollbackForm, setRollbackForm] = useState<{
    name: string
    source: BonusSource
    tierCode: string
    targetType: '單一用戶' | '多用戶匯入'
    userId: string
    estimateAmount: string
    expectedCount: string
    reason: string
  } | null>(null)

  const overviewStats = useMemo(() => {
    const totalIssued = ledgerRows
      .filter((row) => row.direction === '發放')
      .reduce((sum, row) => sum + row.amount, 0)
    const totalRollback = ledgerRows
      .filter((row) => row.direction === '扣回')
      .reduce((sum, row) => sum + row.amount, 0)
    const net = totalIssued - totalRollback
    return {
      totalIssued,
      totalRollback,
      net,
      issuanceCount: issuanceTasks.length,
      rollbackCount: rollbackTasks.length,
      ledgerCount: ledgerRows.length,
      redemptionCount: redemptions.length,
    }
  }, [ledgerRows, issuanceTasks.length, rollbackTasks.length, redemptions.length])

  const sortedTiers = useMemo(
    () => [...bonusTiers].sort((a, b) => a.order - b.order),
    [bonusTiers],
  )

  const getTierLabel = (code: string): string => {
    if (code === 'MIXED') return '多等級 MIXED'
    const tier = sortedTiers.find((t) => t.code === code)
    return tier ? `${tier.name} (${tier.code})` : code
  }

  const issuanceTotalPages = Math.max(1, Math.ceil(issuanceTasks.length / pageSize))
  const paginatedIssuanceTasks = useMemo(() => {
    const start = (issuancePage - 1) * pageSize
    return issuanceTasks.slice(start, start + pageSize)
  }, [issuanceTasks, issuancePage])

  const rollbackTotalPages = Math.max(1, Math.ceil(rollbackTasks.length / pageSize))
  const paginatedRollbackTasks = useMemo(() => {
    const start = (rollbackPage - 1) * pageSize
    return rollbackTasks.slice(start, start + pageSize)
  }, [rollbackTasks, rollbackPage])

  const filteredLedgerRows = useMemo(() => {
    return ledgerRows.filter((row) => {
      if (ledgerKeyword) {
        const target = `${row.userId} ${row.username} ${row.refId ?? ''} ${
          row.note ?? ''
        } ${row.tierCode}`.toLowerCase()
        if (!target.includes(ledgerKeyword.toLowerCase())) return false
      }
      if (ledgerDirectionFilter !== '全部' && row.direction !== ledgerDirectionFilter)
        return false
      if (ledgerSourceFilter !== '全部' && row.source !== ledgerSourceFilter)
        return false
      return true
    })
  }, [ledgerRows, ledgerKeyword, ledgerDirectionFilter, ledgerSourceFilter])

  const ledgerTotalPages = Math.max(
    1,
    Math.ceil(filteredLedgerRows.length / pageSize),
  )
  const paginatedLedgerRows = useMemo(() => {
    const start = (ledgerPage - 1) * pageSize
    return filteredLedgerRows.slice(start, start + pageSize)
  }, [filteredLedgerRows, ledgerPage])

  const filteredRedemptions = useMemo(
    () =>
      redemptions.filter((item) => {
        if (redemptionStatusFilter !== '全部' && item.status !== redemptionStatusFilter)
          return false
        return true
      }),
    [redemptions, redemptionStatusFilter],
  )

  const redemptionTotalPages = Math.max(
    1,
    Math.ceil(filteredRedemptions.length / pageSize),
  )
  const paginatedRedemptions = useMemo(() => {
    const start = (redemptionPage - 1) * pageSize
    return filteredRedemptions.slice(start, start + pageSize)
  }, [filteredRedemptions, redemptionPage])

  /**
   * @description 開啟 Bonus 發放任務抽屜（新增）。
   */
  const handleOpenIssuanceDrawer = () => {
    const defaultTier = sortedTiers[sortedTiers.length - 1]?.code ?? 'STONE'
    setIssuanceForm({
      name: '',
      source: '活動',
      tierCode: defaultTier,
      targetType: '單一用戶',
      userId: '',
      amount: '',
      reason: '',
      uploadFileName: '',
    })
  }

  const handleCloseIssuanceDrawer = () => {
    setIssuanceForm(null)
  }

  const handleSubmitIssuance = async () => {
    if (!issuanceForm) return

    const name = issuanceForm.name.trim()
    if (!name) {
      await showAlert('請填寫「任務名稱」。')
      return
    }

    if (issuanceForm.targetType === '單一用戶' && !issuanceForm.userId.trim()) {
      await showAlert('單一用戶模式下，請填寫「用戶 ID」。')
      return
    }

    if (!issuanceForm.tierCode) {
      await showAlert('請選擇「Bonus 等級」。')
      return
    }

    const amountNum = Number(issuanceForm.amount.trim() || '0')
    if (!amountNum || Number.isNaN(amountNum) || amountNum <= 0) {
      await showAlert('請輸入大於 0 的「發放 Bonus 金額」。')
      return
    }

    if (!issuanceForm.reason.trim()) {
      await showAlert('請填寫「發放原因」，正式環境建議必填並寫入 Audit Log。')
      return
    }

    const nowLabel = createNowLabel()
    const newTaskId = `ISS-${Date.now()}`
    const newTask: BonusIssuanceTask = {
      id: newTaskId,
      name,
      source: issuanceForm.source,
      tierCode: issuanceForm.tierCode,
      targetType: issuanceForm.targetType,
      userId:
        issuanceForm.targetType === '單一用戶'
          ? issuanceForm.userId.trim()
          : undefined,
      amount: amountNum,
      createdAt: nowLabel,
      createdBy: 'Demo Admin',
      status: 'pending',
      note: issuanceForm.reason.trim(),
    }

    setIssuanceTasks((prev) => [newTask, ...prev])

    if (newTask.userId) {
      const lastBalance =
        ledgerRows.find((row) => row.userId === newTask.userId)?.balanceAfter ?? 0
      const newLedger: BonusLedgerRow = {
        id: `LED-${Date.now()}`,
        userId: newTask.userId,
        username: 'demo_user',
        direction: '發放',
        amount: amountNum,
        balanceAfter: lastBalance + amountNum,
        source: newTask.source,
        tierCode: newTask.tierCode,
        refId: newTask.id,
        createdAt: nowLabel,
        note: issuanceForm.reason.trim(),
      }
      setLedgerRows((prev) => [newLedger, ...prev])
    }

    await showAlert(
      `已模擬建立 Bonus 發放任務：\n\n` +
        `任務名稱：${name}\n` +
        `來源類型：${issuanceForm.source}\n` +
        `Bonus 等級：${getTierLabel(issuanceForm.tierCode)}\n` +
        `目標：${issuanceForm.targetType}${issuanceForm.userId ? `（User ID: ${issuanceForm.userId}）` : ''}\n` +
        `發放 Bonus 金額：${amountNum}\n` +
        (issuanceForm.uploadFileName ? `匯入檔案：${issuanceForm.uploadFileName}\n` : '') +
        `原因：${issuanceForm.reason.trim()}\n\n` +
        '正式環境建議：交由後端排程執行、支援試跑與 Audit Log。',
    )

    handleCloseIssuanceDrawer()
  }

  const handleOpenRollbackDrawer = () => {
    const defaultTier = sortedTiers[sortedTiers.length - 1]?.code ?? 'STONE'
    setRollbackForm({
      name: '',
      source: '回滾',
      tierCode: defaultTier,
      targetType: '多用戶匯入',
      userId: '',
      estimateAmount: '',
      expectedCount: '',
      reason: '',
    })
  }

  const handleCloseRollbackDrawer = () => {
    setRollbackForm(null)
  }

  const handleSubmitRollback = async () => {
    if (!rollbackForm) return

    const name = rollbackForm.name.trim()
    if (!name) {
      await showAlert('請填寫「任務名稱」。')
      return
    }

    if (rollbackForm.targetType === '單一用戶' && !rollbackForm.userId.trim()) {
      await showAlert('單一用戶模式下，請填寫「用戶 ID」。')
      return
    }

    if (!rollbackForm.tierCode) {
      await showAlert('請選擇「主要 Bonus 等級」。')
      return
    }

    const estimateAmount = Number(rollbackForm.estimateAmount.trim() || '0')
    if (!estimateAmount || Number.isNaN(estimateAmount) || estimateAmount <= 0) {
      await showAlert('請輸入大於 0 的「預估扣回 Bonus 金額」。')
      return
    }

    const expectedCount = Number(rollbackForm.expectedCount.trim() || '0')
    if (!expectedCount || Number.isNaN(expectedCount) || expectedCount <= 0) {
      await showAlert('請輸入大於 0 的「預估影響人數 / 筆數」。')
      return
    }

    if (!rollbackForm.reason.trim()) {
      await showAlert('請填寫「扣回原因」，正式環境建議必填並寫入 Audit Log。')
      return
    }

    const nowLabel = createNowLabel()
    const newTaskId = `RBK-${Date.now()}`
    const newTask: BonusRollbackTask = {
      id: newTaskId,
      name,
      source: rollbackForm.source,
      direction: '扣回',
      tierCode: rollbackForm.tierCode,
      affectedCount: expectedCount,
      totalAmount: estimateAmount,
      createdAt: nowLabel,
      createdBy: 'Demo Admin',
      status: 'pending',
      note: rollbackForm.reason.trim(),
    }

    setRollbackTasks((prev) => [newTask, ...prev])

    if (rollbackForm.targetType === '單一用戶' && rollbackForm.userId.trim()) {
      const userId = rollbackForm.userId.trim()
      const lastBalance =
        ledgerRows.find((row) => row.userId === userId)?.balanceAfter ?? 0
      const newLedger: BonusLedgerRow = {
        id: `LED-${Date.now()}`,
        userId,
        username: 'demo_user',
        direction: '扣回',
        amount: estimateAmount,
        balanceAfter: Math.max(0, lastBalance - estimateAmount),
        source: rollbackForm.source,
        tierCode: rollbackForm.tierCode,
        refId: newTaskId,
        createdAt: nowLabel,
        note: rollbackForm.reason.trim(),
      }
      setLedgerRows((prev) => [newLedger, ...prev])
    }

    await showAlert(
      `已模擬建立 Bonus 扣回任務：\n\n` +
        `任務名稱：${name}\n` +
        `來源類型：${rollbackForm.source}\n` +
        `主要 Bonus 等級：${getTierLabel(rollbackForm.tierCode)}\n` +
        `目標：${rollbackForm.targetType}${rollbackForm.userId ? `（User ID: ${rollbackForm.userId}）` : ''}\n` +
        `預估扣回 Bonus 金額：${estimateAmount}\n` +
        `預估影響人數 / 筆數：${expectedCount}\n` +
        `原因：${rollbackForm.reason.trim()}\n\n` +
        '正式環境建議：支援試跑、白名單與多階段審核。',
    )

    handleCloseRollbackDrawer()
  }

  const handleCreateTier = () => {
    setEditingTier(null)
    setTierForm({
      code: '',
      name: '',
      minBalance: '',
      maxBalance: '',
      bonusToPointsRate: '1',
      status: 'active',
      validFrom: '',
      validTo: '',
      usageScopes: '',
      allowedRedemptionItems: '',
      allowedHosts: '',
      allowedPlatforms: '',
      perks: '',
      note: '',
    })
  }

  const handleEditTier = (tier: BonusTier) => {
    setEditingTier(tier)
    setTierForm({
      code: tier.code,
      name: tier.name,
      minBalance: String(tier.minBalance),
      maxBalance: tier.maxBalance == null ? '' : String(tier.maxBalance),
      bonusToPointsRate: String(tier.bonusToPointsRate),
      status: tier.status,
      validFrom: tier.validFrom ?? '',
      validTo: tier.validTo ?? '',
      usageScopes: (tier.usageScopes ?? []).join(', '),
      allowedRedemptionItems: (tier.allowedRedemptionItems ?? []).join(', '),
      allowedHosts: (tier.allowedHosts ?? []).join(', '),
      allowedPlatforms: (tier.allowedPlatforms ?? []).join(', '),
      perks: (tier.perks ?? []).join(', '),
      note: tier.note ?? '',
    })
  }

  const handleCloseTierDrawer = () => {
    setEditingTier(null)
    setTierForm(null)
  }

  const handleSaveTier = async () => {
    if (!tierForm) return

    const code = tierForm.code.trim().toUpperCase()
    const name = tierForm.name.trim()
    if (!code || !name) {
      await showAlert('請填寫「等級代碼」與「等級名稱」。')
      return
    }

    const minBalance = Number(tierForm.minBalance || '0')
    const maxBalanceRaw = tierForm.maxBalance.trim()
    const maxBalance = maxBalanceRaw ? Number(maxBalanceRaw) : null
    const bonusToPointsRate = Number(tierForm.bonusToPointsRate || '1')

    if (
      Number.isNaN(minBalance) ||
      (maxBalance !== null && Number.isNaN(maxBalance)) ||
      Number.isNaN(bonusToPointsRate)
    ) {
      await showAlert('請確認門檻與倍率欄位皆為數字。')
      return
    }

    if (minBalance < 0) {
      await showAlert('最小餘額不可為負數。')
      return
    }
    if (maxBalance !== null && maxBalance <= minBalance) {
      await showAlert('若有設定最大餘額，需大於最小餘額。')
      return
    }

    const duplicate = bonusTiers.find(
      (t) => t.code.toLowerCase() === code.toLowerCase() && t.id !== editingTier?.id,
    )
    if (duplicate) {
      await showAlert(`Bonus 等級代碼「${code}」已存在，請使用其他代碼。`)
      return
    }

    const parsedUsage = parseCsvToArray(tierForm.usageScopes)
    const parsedItems = parseCsvToArray(tierForm.allowedRedemptionItems)
    const parsedPerks = parseCsvToArray(tierForm.perks)
    const parsedHosts = parseCsvToArray(tierForm.allowedHosts)
    const parsedPlatforms = parseCsvToArray(tierForm.allowedPlatforms)

    if (editingTier) {
      const updated: BonusTier = {
        ...editingTier,
        code,
        name,
        minBalance: Math.max(0, minBalance),
        maxBalance,
        bonusToPointsRate,
        status: tierForm.status,
        validFrom: tierForm.validFrom.trim() || null,
        validTo: tierForm.validTo.trim() || null,
        usageScopes: parsedUsage,
        allowedRedemptionItems: parsedItems,
        allowedHosts: parsedHosts,
        allowedPlatforms: parsedPlatforms,
        perks: parsedPerks,
        note: tierForm.note.trim() || undefined,
      }
      setBonusTiers((prev) => prev.map((t) => (t.id === editingTier.id ? updated : t)))
    } else {
      const maxOrder = bonusTiers.reduce((max, t) => Math.max(max, t.order), 0)
      const newTier: BonusTier = {
        id: code,
        code,
        name,
        minBalance: Math.max(0, minBalance),
        maxBalance,
        bonusToPointsRate,
        status: tierForm.status,
        order: maxOrder + 1,
        validFrom: tierForm.validFrom.trim() || null,
        validTo: tierForm.validTo.trim() || null,
        usageScopes: parsedUsage,
        allowedRedemptionItems: parsedItems,
        allowedHosts: parsedHosts,
        allowedPlatforms: parsedPlatforms,
        perks: parsedPerks,
        note: tierForm.note.trim() || undefined,
      }
      setBonusTiers((prev) => [...prev, newTier])
    }

    handleCloseTierDrawer()
  }

  const handleOpenExchangeDrawer = () => {
    setExchangeDraft({ ...exchangeConfig })
  }

  const handleCloseExchangeDrawer = () => {
    setExchangeDraft(null)
  }

  const handleSaveExchangeConfig = async () => {
    if (!exchangeDraft) return

    if (exchangeDraft.bonusToPointsRate <= 0) {
      await showAlert('「1 Bonus 可兌換 points」倍率需大於 0。')
      return
    }
    if (exchangeDraft.pointsToBonusRate <= 0) {
      await showAlert('「points 兌換 1 Bonus」倍率需大於 0。')
      return
    }
    if (exchangeDraft.minRedeemBonus <= 0) {
      await showAlert('單筆最小兌換 Bonus 需大於 0。')
      return
    }
    if (exchangeDraft.stepBonus <= 0) {
      await showAlert('兌換遞增單位需大於 0。')
      return
    }
    if (exchangeDraft.dailyMaxBonus <= 0) {
      await showAlert('每日最大可兌換 Bonus 需大於 0。')
      return
    }

    setExchangeConfig({ ...exchangeDraft })
    setExchangeDraft(null)
  }

  /**
   * @description 檢查兌換申請是否符合 tier 的使用限制（host / platform / items）
   * @returns true 若符合或無限制；false 若明確不符合
   */
  function checkRedemptionAllowedByTier(item: RedemptionRequest, tiers: BonusTier[]): boolean {
    const tier = tiers.find((t) => t.code === item.tierCode)
    if (!tier) return true // 無對應 tier 時 allow (fallback)
    // 如果申請帶 targetHost 且 tier 有 allowedHosts，則需包含
    if (item.targetHost && tier.allowedHosts && tier.allowedHosts.length > 0) {
      const ok = tier.allowedHosts.map(h => h.toLowerCase()).includes(item.targetHost.toLowerCase())
      if (!ok) return false
    }
    // 如果申請帶 targetPlatform 且 tier 有 allowedPlatforms，則需包含
    if (item.targetPlatform && tier.allowedPlatforms && tier.allowedPlatforms.length > 0) {
      const ok = tier.allowedPlatforms.map(p => p.toLowerCase()).includes(item.targetPlatform.toLowerCase())
      if (!ok) return false
    }
    // 若申請 channel 是 Coupon 且 tier 有 allowedRedemptionItems，則不在白名單也視為風險（此邏輯可再擴充）
    // 目前不強制阻擋，只在審核時提示
    return true
  }

  const handleApproveRedemption = async (item: RedemptionRequest) => {
    // 在核准前檢查 tier 限制
    const tier = bonusTiers.find((t) => t.code === item.tierCode)
    if (tier) {
      const hostMismatch =
        item.targetHost &&
        tier.allowedHosts &&
        tier.allowedHosts.length > 0 &&
        !tier.allowedHosts.map(h => h.toLowerCase()).includes(item.targetHost.toLowerCase())
      const platformMismatch =
        item.targetPlatform &&
        tier.allowedPlatforms &&
        tier.allowedPlatforms.length > 0 &&
        !tier.allowedPlatforms.map(p => p.toLowerCase()).includes(item.targetPlatform.toLowerCase())

      if (hostMismatch || platformMismatch) {
        const msg =
          `兌換申請（${item.id}）指定${hostMismatch ? `主播：${item.targetHost} ` : ''}${platformMismatch ? `平台：${item.targetPlatform} ` : ''}，` +
          `但該等級 ${tier.name}（${tier.code}）的允許清單不包含，是否仍要核准？\n\n` +
          `允許主播：${(tier.allowedHosts ?? []).join(', ') || '無'}\n` +
          `允許平台：${(tier.allowedPlatforms ?? []).join(', ') || '無'}\n\n` +
          '提示：若非營運本人操作，建議先取消或建立例外申請。'
        const ok = await showConfirm(msg)
        if (!ok) return
      }
    }

    const ok = await showConfirm(
      `確認核準兌換申請「${item.id}」嗎？\n` +
        `用戶：${item.username}（ID: ${item.userId}）\n` +
        `等級：${getTierLabel(item.tierCode)}\n` +
        `兌換 Bonus：${item.bonusAmount.toLocaleString()}，預估入帳 points：${item.pointsEstimated.toLocaleString()}\n\n` +
        '示意：實務上應檢查餘額、兌換率及每日上限，並寫入 Audit Log。',
    )
    if (!ok) return

    const nowLabel = createNowLabel()
    setRedemptions((prev) =>
      prev.map((red) =>
        red.id === item.id
          ? {
              ...red,
              status: 'approved',
              processedAt: nowLabel,
              processedBy: 'Demo Admin',
            }
          : red,
      ),
    )

    const lastBalance =
      ledgerRows.find((row) => row.userId === item.userId)?.balanceAfter ?? 0
    const newLedger: BonusLedgerRow = {
      id: `LED-${Date.now()}`,
      userId: item.userId,
      username: item.username,
      direction: '扣回',
      amount: item.bonusAmount,
      balanceAfter: Math.max(0, lastBalance - item.bonusAmount),
      source: '兌換',
      tierCode: item.tierCode,
      refId: item.id,
      createdAt: nowLabel,
      note: `兌換為 ${item.channel}，按 ${getTierLabel(item.tierCode)} 估算 points：${item.pointsEstimated.toLocaleString()}`,
    }
    setLedgerRows((prev) => [newLedger, ...prev])
  }

  const handleRejectRedemption = async (item: RedemptionRequest) => {
    const reason = await showPrompt(
      `請輸入拒絕兌換申請「${item.id}」的原因：`,
      '不符合兌換條件（示意）。',
    )
    if (reason === null) return

    const nowLabel = createNowLabel()
    setRedemptions((prev) =>
      prev.map((red) =>
        red.id === item.id
          ? {
              ...red,
              status: 'rejected',
              processedAt: nowLabel,
              processedBy: 'Demo Admin',
              note: reason.trim() || red.note,
            }
          : red,
      ),
    )
  }

  const handleCancelRedemption = async (item: RedemptionRequest) => {
    const ok = await showConfirm(`確認要標記兌換申請「${item.id}」為「已取消」嗎？`)
    if (!ok) return

    const nowLabel = createNowLabel()
    setRedemptions((prev) =>
      prev.map((red) =>
        red.id === item.id
          ? {
              ...red,
              status: 'cancelled',
              processedAt: nowLabel,
              processedBy: 'Demo Admin',
            }
          : red,
      ),
    )
  }

  const blueprintFeatures: FeatureItem[] = [
    {
      id: 24,
      name: 'Bonus 等級（金 / 銀 / 銅 / 鐵 / 石）管理',
      description:
        '定義 Bonus 等級與門檻與每級專屬兌換倍率，並可設定等級生效期間與使用場景限制（例如：指定主播或可兌換商品白名單）。',
      tag: '分級',
    },
    {
      id: 25,
      name: '每等級獨立兌換率',
      description:
        '每個 Bonus 等級都有自己的 Bonus → points 兌換倍率，支援快速調整與歷史版本追溯。',
      tag: '倍率',
    },
    {
      id: 26,
      name: 'Bonus 發放（綁定等級）',
      description:
        '所有發放任務都必須選擇 Bonus 等級，實際入帳與後續兌換都依該等級倍率計算。',
      tag: '發放',
    },
    {
      id: 27,
      name: 'Bonus 扣回 / 回滾（綁定主要等級 / MIXED）',
      description:
        '對錯誤發放或風控場景做批次回滾時，可標註主要 Bonus 等級或 MIXED，並依流水對帳。',
      tag: '扣回',
    },
    {
      id: 28,
      name: 'Bonus 兌換管理（依等級審核）',
      description:
        '兌換申請綁定對應 Bonus 等級與預估 points，審核時明確顯示倍率與預估成本，並寫入流水。',
      tag: '兌換',
    },
    {
      id: 29,
      name: 'Bonus 流水（含等級欄位）',
      description:
        '所有 Bonus 流水必須記錄等級欄位，方便後續做「按金 / 銀 / 銅等級」的成本與收益報表。',
      tag: '流水',
    },
    {
      id: 30,
      name: '全域兌換率與等級覆蓋',
      description:
        '支援「全域預設兌換率」與「等級覆蓋兌換率」兩層邏輯，避免多平台或多專案時混亂。',
      tag: '配置',
    },
    {
      id: 31,
      name: '高風險操作 Audit Log',
      description:
        '所有發放 / 扣回 / 兌換行為（含等級資訊）須寫入 Audit Log，支援匯出與異常追查。',
      tag: 'Audit',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Sub tabs header */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <Coins className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">Bonus 管理</span>
          <span className="text-[10px] text-slate-500">
            分級（含有效期與使用限制）、每級倍率、發放 / 扣回 / 兌換與流水，皆綁定等級。
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'overview'
                ? 'bg-slate-700 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            總覽
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'tiers'
                ? 'bg-amber-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            Bonus 分級
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rates')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'rates'
                ? 'bg-sky-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            兌換率配置
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('issuance')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'issuance'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            Bonus 發放
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rollback')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'rollback'
                ? 'bg-rose-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            扣回 / 回滾
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('redeem')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'redeem'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            Bonus 兌換
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'ledger'
                ? 'bg-violet-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            Bonus 流水
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
        </div>
      </section>

      {/* Tab: 總覽 */}
      {activeTab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">Bonus 經濟配置總覽</span>
            </div>
            <span className="text-[10px] text-slate-500">
              每個 Bonus 等級（如金 / 銀 / 銅 / 鐵 / 石）可設定生效期間與使用場景限制。
            </span>
          </header>
          <p className="text-[11px] text-slate-400">
            此總覽提供分級、各等級兌換率、發放與扣回總量等快速檢視。建議等級擁有明確的使用限制（例如：僅能在特定主播或兌換特定商品），以控制成本與權益分級。
          </p>

          <div className="grid gap-3 md:grid-cols-4 text-[11px]">
            <div className="space-y-1 rounded-xl border border-emerald-600/60 bg-emerald-500/10 p-3">
              <div className="text-slate-100">累計發放 Bonus</div>
              <div className="text-lg font-semibold text-emerald-100">
                {overviewStats.totalIssued.toLocaleString()}
              </div>
              <p className="text-[10px] text-emerald-200/80">
                依流水統計所有發放方向的 Bonus 點數，用於評估營運成本（不含扣回）。
              </p>
            </div>
            <div className="space-y-1 rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="text-slate-100">累計扣回 Bonus</div>
              <div className="text-lg font-semibold text-rose-100">
                {overviewStats.totalRollback.toLocaleString()}
              </div>
              <p className="text-[10px] text-rose-200/80">
                活動回滾與風控扣回總量，建議與報表中心比對異常比例。
              </p>
            </div>
            <div className="space-y-1 rounded-xl border border-indigo-600/60 bg-indigo-500/10 p-3">
              <div className="text-slate-100">淨發放 Bonus</div>
              <div className="text-lg font-semibold text-indigo-100">
                {overviewStats.net.toLocaleString()}
              </div>
              <p className="text-[10px] text-indigo-200/80">
                淨發放 = 發放 - 扣回，可做為 Bonus 經濟規模與負債預估指標。
              </p>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-700/80 bg-slate-900/80 p-3">
              <div className="text-slate-100">工作量概況</div>
              <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-slate-300">
                <li>發放任務：{overviewStats.issuanceCount} 筆</li>
                <li>扣回任務：{overviewStats.rollbackCount} 筆</li>
                <li>Bonus 流水：{overviewStats.ledgerCount} 筆</li>
                <li>兌換申請：{overviewStats.redemptionCount} 筆</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Bonus 分級管理 */}
      {activeTab === 'tiers' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">Bonus 分級管理（含有效期與使用限制）</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100">
                每級可設定生效期間、使用場景限制、允許主播/平台與可兌換商品白名單。
              </span>
            </div>
            <button
              type="button"
              onClick={handleCreateTier}
              className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-500"
            >
              <PlusCircle className="h-3 w-3" />
              新增 Bonus 等級
            </button>
          </header>

          <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-amber-100">
                <tr>
                  <th className="w-8 border-b border-amber-600/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">等級</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">適用區間</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-right">1 Bonus 兌換 points</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">使用限制</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-left">備註 / 權益</th>
                  <th className="border-b border-amber-600/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedTiers.map((tier) => (
                  <tr key={tier.id} className="border-b border-amber-600/40 text-amber-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{tier.order}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{tier.name} ({tier.code})</span>
                        <span className="text-[10px] text-amber-200/80">生效：{tier.validFrom ?? '—'} ~ {tier.validTo ?? '無上限'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="tabular-nums">
                        {tier.minBalance.toLocaleString()} – {tier.maxBalance == null ? '無上限' : tier.maxBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">x{tier.bonusToPointsRate.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-[11px] text-amber-100/90">
                      <div className="space-y-0.5">
                        <div>場景：{tier.usageScopes?.slice(0, 3).join(', ') || '—'}</div>
                        <div>可兌換品：{tier.allowedRedemptionItems?.slice(0, 3).join(', ') || '—'}</div>
                        <div>允許主播：{tier.allowedHosts?.slice(0,3).join(', ') || '—'}</div>
                        <div>允許平台：{tier.allowedPlatforms?.slice(0,3).join(', ') || '—'}</div>
                        <div className="text-[10px] text-amber-200/60">權益數：{tier.perks?.length ?? 0}</div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-amber-100/80">{tier.note ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleEditTier(tier)}
                        className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-amber-600/80 hover:text-white"
                      >
                        <Edit3 className="h-3 w-3" />
                        編輯
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedTiers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-[11px] text-amber-100/80">
                      目前尚未設定任何 Bonus 等級。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab: 兌換率配置 */}
      {activeTab === 'rates' && (
        <section className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <RefreshCcw className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">Bonus 兌換率配置</span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-100">
                全域預設兌換率（fallback），實際請以等級倍率為主。
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenExchangeDrawer}
              className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-sky-500"
            >
              <Edit3 className="h-3 w-3" />
              編輯兌換率
            </button>
          </header>

          <div className="grid gap-3 md:grid-cols-3 text-[11px]">
            <div className="space-y-1 rounded-xl border border-sky-600/60 bg-slate-950/80 p-3">
              <div className="text-slate-400">預設：1 Bonus 兌換 points</div>
              <div className="text-lg font-semibold text-sky-100">x{exchangeConfig.bonusToPointsRate.toFixed(2)}</div>
              <p className="text-[10px] text-slate-500">若找不到對應 Bonus 等級，系統會退回使用此倍率。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-sky-600/60 bg-slate-950/80 p-3">
              <div className="text-slate-400">points 兌換 1 Bonus（反向）</div>
              <div className="text-lg font-semibold text-sky-100">{exchangeConfig.pointsToBonusRate.toLocaleString()} points</div>
              <p className="text-[10px] text-slate-500">反向兌換倍率，建議僅於白名單或活動中開放。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-sky-600/60 bg-slate-950/80 p-3">
              <div className="text-slate-400">額度限制</div>
              <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-slate-300">
                <li>單筆最小兌換：{exchangeConfig.minRedeemBonus.toLocaleString()} Bonus</li>
                <li>兌換遞增單位：{exchangeConfig.stepBonus.toLocaleString()} Bonus</li>
                <li>單日最大兌換：{exchangeConfig.dailyMaxBonus.toLocaleString()} Bonus / 用戶</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Bonus 發放列表 */}
      {activeTab === 'issuance' && (
        <section className="space-y-3 rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold">Bonus 發放任務列表</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-100">
                每一筆發放都綁定一個 Bonus 等級（會影響後續兌換）。
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenIssuanceDrawer}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500"
            >
              <PlusCircle className="h-3 w-3" />
              新增發放任務
            </button>
          </header>

          <div className="overflow-hidden rounded-xl border border-emerald-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-emerald-100">
                <tr>
                  <th className="w-8 border-b border-emerald-600/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-emerald-600/60 px-2 py-2 text-left">任務名稱</th>
                  <th className="border-b border-emerald-600/60 px-2 py-2 text-left">來源</th>
                  <th className="border-b border-emerald-600/60 px-2 py-2 text-left">Bonus 等級</th>
                  <th className="border-b border-emerald-600/60 px-2 py-2 text-left">目標對象</th>
                  <th className="border-b border-emerald-600/60 px-2 py-2 text-right">金額</th>
                  <th className="border-b border-emerald-600/60 px-2 py-2 text-left">建立時間</th>
                  <th className="border-b border-emerald-600/60 px-2 py-2 text-left">建立人</th>
                  <th className="border-b border-emerald-600/60 px-2 py-2 text-left">狀態</th>
                  <th className="border-b border-emerald-600/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIssuanceTasks.map((task, index) => (
                  <tr key={task.id} className="border-b border-emerald-600/40 text-emerald-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(issuancePage - 1) * pageSize + index + 1}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{task.name}</span>
                        <span className="text-[10px] text-emerald-200/80">ID: {task.id}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">{task.source}</td>
                    <td className="px-2 py-1.5">{getTierLabel(task.tierCode)}</td>
                    <td className="px-2 py-1.5 text-emerald-100/90">
                      {task.targetType}
                      {task.userId && <span className="text-[10px] text-emerald-200/80"> · User ID: {task.userId}</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{task.amount.toLocaleString()}</td>
                    <td className="px-2 py-1.5">{task.createdAt}</td>
                    <td className="px-2 py-1.5">{task.createdBy}</td>
                    <td className="px-2 py-1.5">
                      <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]',
                        task.status === 'done' ? 'bg-emerald-500/30 text-emerald-50'
                        : task.status === 'processing' ? 'bg-sky-500/30 text-sky-50'
                        : task.status === 'pending' ? 'bg-amber-500/30 text-amber-50'
                        : task.status === 'failed' ? 'bg-rose-500/30 text-rose-50' : 'bg-slate-600/40 text-slate-100'
                      ].join(' ')}>
                        {task.status === 'done' && <CheckCircle2 className="h-3 w-3" />}
                        {task.status === 'failed' && <AlertTriangle className="h-3 w-3" />}
                        {task.status === 'processing' && <History className="h-3 w-3" />}
                        {task.status === 'pending' && <Clock className="h-3 w-3" />}
                        <span>
                          {task.status === 'done' ? '已完成' : task.status === 'processing' ? '執行中' : task.status === 'pending' ? '待執行' : task.status === 'failed' ? '失敗' : '草稿'}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={async () => await showAlert(`示意：開啟發放任務「${task.name}」詳情與 Audit Log 資訊。`)}
                        className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-500/40"
                      >
                        <Eye className="h-3 w-3" />
                        詳情
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedIssuanceTasks.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-[11px] text-emerald-100/80">
                      目前尚未建立任何 Bonus 發放任務。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="flex items-center justify-between border-t border-emerald-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>總任務數：{issuanceTasks.length} · 每頁 {pageSize} 筆</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={issuancePage <= 1}
                  onClick={() => setIssuancePage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" />
                  上一頁
                </button>
                <span>第 {issuancePage} / {issuanceTotalPages} 頁</span>
                <button
                  type="button"
                  disabled={issuancePage >= issuanceTotalPages}
                  onClick={() => setIssuancePage((p) => Math.min(issuanceTotalPages, p + 1))}
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

      {/* Tab: Bonus 扣回 / 回滾 */}
      {activeTab === 'rollback' && (
        <section className="space-y-3 rounded-2xl border border-rose-700/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Undo2 className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold">Bonus 扣回 / 回滾任務列表</span>
            </div>
            <button
              type="button"
              onClick={handleOpenRollbackDrawer}
              className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-500"
            >
              <PlusCircle className="h-3 w-3" />
              新增扣回任務
            </button>
          </header>

          <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-rose-100">
                <tr>
                  <th className="w-8 border-b border-rose-600/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">任務名稱</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">來源</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">主要 Bonus 等級</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">預估扣回金額</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">預估影響人數</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">建立時間</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">建立人</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-left">狀態</th>
                  <th className="border-b border-rose-600/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRollbackTasks.map((task, index) => (
                  <tr key={task.id} className="border-b border-rose-600/40 text-rose-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(rollbackPage - 1) * pageSize + index + 1}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{task.name}</span>
                        <span className="text-[10px] text-rose-100/80">ID: {task.id}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">{task.source}</td>
                    <td className="px-2 py-1.5">{getTierLabel(task.tierCode)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{task.totalAmount.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{task.affectedCount.toLocaleString()}</td>
                    <td className="px-2 py-1.5">{task.createdAt}</td>
                    <td className="px-2 py-1.5">{task.createdBy}</td>
                    <td className="px-2 py-1.5">
                      <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]',
                        task.status === 'done' ? 'bg-emerald-500/30 text-emerald-50'
                        : task.status === 'processing' ? 'bg-sky-500/30 text-sky-50'
                        : task.status === 'pending' ? 'bg-amber-500/30 text-amber-50'
                        : task.status === 'failed' ? 'bg-rose-500/40 text-rose-50' : 'bg-slate-600/40 text-slate-100'
                      ].join(' ')}>
                        {task.status === 'done' && <CheckCircle2 className="h-3 w-3" />}
                        {task.status === 'failed' && <AlertTriangle className="h-3 w-3" />}
                        {task.status === 'processing' && <History className="h-3 w-3" />}
                        {task.status === 'pending' && <Clock className="h-3 w-3" />}
                        <span>
                          {task.status === 'done' ? '已完成' : task.status === 'processing' ? '執行中' : task.status === 'pending' ? '待執行' : task.status === 'failed' ? '失敗' : '草稿'}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={async () => await showAlert(`示意：開啟扣回任務「${task.name}」詳情，包含受影響名單與流水 diff。`)}
                        className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/25 px-2 py-0.5 text-[10px] text-rose-50 hover:bg-rose-500/40"
                      >
                        <Eye className="h-3 w-3" />
                        詳情
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedRollbackTasks.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-[11px] text-rose-100/80">
                      目前尚未建立任何 Bonus 扣回 / 回滾任務。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="flex items-center justify-between border-t border-rose-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>總任務數：{rollbackTasks.length} · 每頁 {pageSize} 筆</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={rollbackPage <= 1}
                  onClick={() => setRollbackPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" />
                  上一頁
                </button>
                <span>第 {rollbackPage} / {rollbackTotalPages} 頁</span>
                <button
                  type="button"
                  disabled={rollbackPage >= rollbackTotalPages}
                  onClick={() => setRollbackPage((p) => Math.min(rollbackTotalPages, p + 1))}
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

      {/* Tab: Bonus 兌換管理 */}
      {activeTab === 'redeem' && (
        <section className="space-y-3 rounded-2xl border border-indigo-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold">Bonus 兌換管理（按等級）</span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-100">
                每筆申請綁定等級，審核時會顯示該等級的倍率與使用限制。
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-[10px] text-slate-500">狀態篩選：</span>
              <select
                value={redemptionStatusFilter}
                onChange={(e) => {
                  setRedemptionStatusFilter(e.target.value as '全部' | RedemptionStatus)
                  setRedemptionPage(1)
                }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100"
              >
                <option value="全部">全部</option>
                <option value="pending">待審核</option>
                <option value="processing">處理中</option>
                <option value="approved">已核准</option>
                <option value="rejected">已拒絕</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </header>

          <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-indigo-100">
                <tr>
                  <th className="w-8 border-b border-indigo-600/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-left">申請 ID</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-left">用戶</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-left">Bonus 等級</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-right">兌換 Bonus</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-right">預估 points</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-left">兌換渠道</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-left">狀態</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-left">申請 / 處理時間</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-left">備註</th>
                  <th className="border-b border-indigo-600/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRedemptions.map((item, index) => (
                  <tr key={item.id} className="border-b border-indigo-600/40 text-indigo-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(redemptionPage - 1) * pageSize + index + 1}</td>
                    <td className="px-2 py-1.5"><div className="flex flex-col"><span className="font-medium">{item.id}</span></div></td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{item.username}</span>
                        <span className="text-[10px] text-indigo-100/80">User ID: {item.userId}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">{getTierLabel(item.tierCode)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{item.bonusAmount.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{item.pointsEstimated.toLocaleString()}</td>
                    <td className="px-2 py-1.5">{item.channel}{item.targetHost ? ` · 主播: ${item.targetHost}` : ''}{item.targetPlatform ? ` · 平台: ${item.targetPlatform}` : ''}</td>
                    <td className="px-2 py-1.5">
                      <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]',
                        item.status === 'approved' ? 'bg-emerald-500/30 text-emerald-50'
                        : item.status === 'pending' ? 'bg-amber-500/30 text-amber-50'
                        : item.status === 'processing' ? 'bg-sky-500/30 text-sky-50'
                        : item.status === 'rejected' ? 'bg-rose-500/40 text-rose-50' : 'bg-slate-600/40 text-slate-100'
                      ].join(' ')}>
                        {item.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === 'rejected' && <AlertTriangle className="h-3 w-3" />}
                        {item.status === 'processing' && <History className="h-3 w-3" />}
                        {item.status === 'pending' && <Clock className="h-3 w-3" />}
                        {item.status === 'cancelled' && <Undo2 className="h-3 w-3" />}
                        <span>
                          {item.status === 'approved' ? '已核准' : item.status === 'pending' ? '待審核' : item.status === 'processing' ? '處理中' : item.status === 'rejected' ? '已拒絕' : '已取消'}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-indigo-100/80">
                      <div>申請：{item.createdAt}</div>
                      {item.processedAt && <div>處理：{item.processedAt}</div>}
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-indigo-100/80">{item.note ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={async () => await showAlert(`示意：開啟兌換申請「${item.id}」詳情與對應流水 / Audit Log。`)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700"
                        >
                          <Eye className="h-3 w-3" />
                          詳情
                        </button>
                        {item.status === 'pending' && (
                          <div className="flex flex-wrap justify-end gap-1">
                            <button type="button" onClick={() => handleApproveRedemption(item)} className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500">核准</button>
                            <button type="button" onClick={() => handleRejectRedemption(item)} className="inline-flex items-center gap-0.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500">拒絕</button>
                            <button type="button" onClick={() => handleCancelRedemption(item)} className="inline-flex items-center gap-0.5 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-white hover:bg-slate-600">取消</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedRedemptions.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-center text-[11px] text-indigo-100/80">
                      目前沒有符合條件的 Bonus 兌換申請。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="flex items-center justify-between border-t border-indigo-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>總申請數：{filteredRedemptions.length} · 每頁 {pageSize} 筆</div>
              <div className="flex items-center gap-1">
                <button type="button" disabled={redemptionPage <= 1} onClick={() => setRedemptionPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"><ChevronLeft className="h-3 w-3" /> 上一頁</button>
                <span>第 {redemptionPage} / {redemptionTotalPages} 頁</span>
                <button type="button" disabled={redemptionPage >= redemptionTotalPages} onClick={() => setRedemptionPage((p) => Math.min(redemptionTotalPages, p + 1))} className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40">下一頁 <ChevronRight className="h-3 w-3" /></button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* Tab: Bonus 流水查詢 */}
      {activeTab === 'ledger' && (
        <section className="space-y-3 rounded-2xl border border-violet-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-semibold">Bonus 流水查詢（含等級）</span>
            </div>
            <button type="button" onClick={async () => await showAlert('示意：根據當前篩選條件匯出 Bonus 流水 CSV。')} className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700">
              <FileDown className="h-3 w-3" />
              匯出 CSV
            </button>
          </header>

          <section className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <div className="flex min-w-[220px] flex-1 items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <input value={ledgerKeyword} onChange={(e) => { setLedgerKeyword(e.target.value); setLedgerPage(1) }} placeholder="用戶 ID / 名稱 / 參考 ID / 備註 / 等級代碼" className="h-6 flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:text-slate-500" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select value={ledgerDirectionFilter} onChange={(e) => { setLedgerDirectionFilter(e.target.value as '全部' | BonusDirection); setLedgerPage(1) }} className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                  <option value="全部">全部方向</option>
                  <option value="發放">發放</option>
                  <option value="扣回">扣回</option>
                </select>
                <select value={ledgerSourceFilter} onChange={(e) => { setLedgerSourceFilter(e.target.value as '全部' | BonusSource); setLedgerPage(1) }} className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                  <option value="全部">全部來源</option>
                  <option value="活動">活動</option>
                  <option value="任務">任務</option>
                  <option value="推薦">推薦</option>
                  <option value="補發">補發</option>
                  <option value="回滾">回滾</option>
                  <option value="兌換">兌換</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-violet-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-violet-100">
                <tr>
                  <th className="w-8 border-b border-violet-600/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">用戶</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">Bonus 等級</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">方向</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-right">金額</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-right">異動後餘額</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">來源</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">參考 ID</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">時間</th>
                  <th className="border-b border-violet-600/60 px-2 py-2 text-left">備註</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLedgerRows.map((row, index) => (
                  <tr key={row.id} className="border-b border-violet-600/40 text-violet-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(ledgerPage - 1) * pageSize + index + 1}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{row.username}</span>
                        <span className="text-[10px] text-violet-100/80">User ID: {row.userId}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-violet-100/90">{getTierLabel(row.tierCode)}</td>
                    <td className="px-2 py-1.5">
                      <span className={['rounded-full px-2 py-0.5 text-[10px]', row.direction === '發放' ? 'bg-emerald-500/30 text-emerald-50' : 'bg-rose-500/40 text-rose-50'].join(' ')}>{row.direction}</span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{row.direction === '發放' ? '+' : '-'}{row.amount.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{row.balanceAfter.toLocaleString()}</td>
                    <td className="px-2 py-1.5">{row.source}</td>
                    <td className="px-2 py-1.5">{row.refId ?? '—'}</td>
                    <td className="px-2 py-1.5">{row.createdAt}</td>
                    <td className="px-2 py-1.5 text-[10px] text-violet-100/80">{row.note ?? '—'}</td>
                  </tr>
                ))}
                {paginatedLedgerRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-[11px] text-violet-100/80">
                      目前沒有符合條件的 Bonus 流水紀錄。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="flex items-center justify-between border-t border-violet-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>總流水筆數：{filteredLedgerRows.length} · 每頁 {pageSize} 筆</div>
              <div className="flex items-center gap-1">
                <button type="button" disabled={ledgerPage <= 1} onClick={() => setLedgerPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"><ChevronLeft className="h-3 w-3" /> 上一頁</button>
                <span>第 {ledgerPage} / {ledgerTotalPages} 頁</span>
                <button type="button" disabled={ledgerPage >= ledgerTotalPages} onClick={() => setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1))} className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40">下一頁 <ChevronRight className="h-3 w-3" /></button>
              </div>
            </footer>
          </section>
        </section>
      )}

      {/* Tab: 規格藍圖 */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="Bonus 管理功能清單"
          subtitle="協助 PM / 營運 / 財務 / 風控對齊 Bonus 分級與兌換邏輯。"
          items={blueprintFeatures}
        />
      )}

      {/* 抽屜：Bonus 等級新增 / 編輯 */}
      {tierForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-amber-600/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-amber-600/70 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-amber-100">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-semibold">{editingTier ? '編輯 Bonus 等級' : '新增 Bonus 等級'}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-amber-200/80">
                  {editingTier ? `${editingTier.name} (${editingTier.code})` : '建立新的 Bonus 等級，並設定門檻、兌換倍率、有效期與使用限制。'}
                </p>
              </div>
              <button type="button" onClick={handleCloseTierDrawer} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-700/80 bg-slate-900/80 text-amber-200 hover:border-amber-400 hover:text-amber-100">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-amber-50">
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleSaveTier() }}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-amber-100">等級代碼</label>
                    <input value={tierForm.code} onChange={(e) => setTierForm((prev) => prev ? { ...prev, code: e.target.value.toUpperCase() } : prev)} className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" placeholder="例如：GOLD / SILVER" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-amber-100">等級名稱</label>
                    <input value={tierForm.name} onChange={(e) => setTierForm((prev) => prev ? { ...prev, name: e.target.value } : prev)} className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" placeholder="例如：金 Bonus 等級" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-amber-100">最小 Bonus 餘額</label>
                    <input value={tierForm.minBalance} onChange={(e) => setTierForm((prev) => prev ? { ...prev, minBalance: e.target.value } : prev)} inputMode="decimal" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" placeholder="例如：1000" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-amber-100">最大 Bonus 餘額（選填）</label>
                    <input value={tierForm.maxBalance} onChange={(e) => setTierForm((prev) => prev ? { ...prev, maxBalance: e.target.value } : prev)} inputMode="decimal" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" placeholder="留空表示無上限" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-amber-100">1 Bonus 兌換 points 倍率</label>
                  <input value={tierForm.bonusToPointsRate} onChange={(e) => setTierForm((prev) => prev ? { ...prev, bonusToPointsRate: e.target.value } : prev)} inputMode="decimal" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" placeholder="例如：1.2 / 1.4" />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-amber-100">狀態</label>
                  <select value={tierForm.status} onChange={(e) => setTierForm((prev) => prev ? { ...prev, status: e.target.value as 'active' | 'inactive' } : prev)} className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400">
                    <option value="active">啟用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-amber-100">生效起始日期（選填）</label>
                    <input value={tierForm.validFrom} onChange={(e) => setTierForm((prev) => prev ? { ...prev, validFrom: e.target.value } : prev)} placeholder="YYYY-MM-DD" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-amber-100">生效結束日期（選填）</label>
                    <input value={tierForm.validTo} onChange={(e) => setTierForm((prev) => prev ? { ...prev, validTo: e.target.value } : prev)} placeholder="YYYY-MM-DD 或留空" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-amber-100">使用場景（逗號分隔）</label>
                  <input value={tierForm.usageScopes} onChange={(e) => setTierForm((prev) => prev ? { ...prev, usageScopes: e.target.value } : prev)} placeholder="例如：指定主播 A, 直播間禮品" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" />
                  <p className="text-[10px] text-amber-200/70">示意：可限制此等級只能用於特定場景或商品，亦可留空代表通用。</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-amber-100">允許兌換的商品（逗號分隔）</label>
                  <input value={tierForm.allowedRedemptionItems} onChange={(e) => setTierForm((prev) => prev ? { ...prev, allowedRedemptionItems: e.target.value } : prev)} placeholder="例如：高價禮物 A, 優惠券 B" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-amber-100">允許的主播（逗號分隔）</label>
                    <input value={tierForm.allowedHosts} onChange={(e) => setTierForm((prev) => prev ? { ...prev, allowedHosts: e.target.value } : prev)} placeholder="例如：主播A, 主播B" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" />
                    <p className="text-[10px] text-amber-200/70">若設定，兌換申請需指定的主播才可使用此等級。</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-amber-100">允許的平台 / 遊戲（逗號分隔）</label>
                    <input value={tierForm.allowedPlatforms} onChange={(e) => setTierForm((prev) => prev ? { ...prev, allowedPlatforms: e.target.value } : prev)} placeholder="例如：Slot, Casino, Live" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" />
                    <p className="text-[10px] text-amber-200/70">若設定，僅能在列出的遊戲 / 平台使用此等級。</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-amber-100">特殊權益（逗號分隔）</label>
                  <input value={tierForm.perks} onChange={(e) => setTierForm((prev) => prev ? { ...prev, perks: e.target.value } : prev)} placeholder="例如：專屬客服, 活動優先權" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400" />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-amber-100">備註 / 權益摘要（選填）</label>
                  <textarea value={tierForm.note} onChange={(e) => setTierForm((prev) => prev ? { ...prev, note: e.target.value } : prev)} rows={3} className="w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-amber-50 outline-none focus:border-amber-400" placeholder="簡要說明此等級的主要權益與使用情境，方便客服與營運理解。" />
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={handleCloseTierDrawer} className="inline-flex items-center gap-1 rounded-full border border-amber-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-amber-100 hover:bg-slate-800/80">取消</button>
                  <button type="submit" className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-amber-500">儲存等級</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* 抽屜：兌換率配置編輯 */}
      {exchangeDraft && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-sky-600/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-sky-600/60 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-sky-100">
                  <Settings2 className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-semibold">編輯全域兌換率配置</span>
                </div>
                <p className="mt-0.5 text-[11px] text-sky-200/80">僅作為無對應 Bonus 等級時的 fallback。</p>
              </div>
              <button type="button" onClick={handleCloseExchangeDrawer} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-700/80 bg-slate-900/80 text-sky-200 hover:border-sky-400 hover:text-sky-100">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-sky-50">
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleSaveExchangeConfig() }}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">1 Bonus 兌換 points 倍率</label>
                    <input value={exchangeDraft.bonusToPointsRate} onChange={(e) => setExchangeDraft((prev) => prev ? { ...prev, bonusToPointsRate: Number(e.target.value || '1') } : prev)} inputMode="decimal" className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="例如：1" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">points 兌換 1 Bonus</label>
                    <input value={exchangeDraft.pointsToBonusRate} onChange={(e) => setExchangeDraft((prev) => prev ? { ...prev, pointsToBonusRate: Number(e.target.value || '100') } : prev)} inputMode="decimal" className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="例如：100" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">單筆最小兌換 Bonus</label>
                    <input value={exchangeDraft.minRedeemBonus} onChange={(e) => setExchangeDraft((prev) => prev ? { ...prev, minRedeemBonus: Number(e.target.value || '0') } : prev)} inputMode="numeric" className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="例如：100" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">兌換遞增單位</label>
                    <input value={exchangeDraft.stepBonus} onChange={(e) => setExchangeDraft((prev) => prev ? { ...prev, stepBonus: Number(e.target.value || '0') } : prev)} inputMode="numeric" className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="例如：50" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-sky-100">單日最大兌換 Bonus（每用戶）</label>
                  <input value={exchangeDraft.dailyMaxBonus} onChange={(e) => setExchangeDraft((prev) => prev ? { ...prev, dailyMaxBonus: Number(e.target.value || '0') } : prev)} inputMode="numeric" className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="例如：10000" />
                </div>

                <div className="space-y-2 rounded-lg border border-sky-700/70 bg-slate-950/90 p-3 text-[10px]">
                  <div className="flex items-center gap-2">
                    <input id="allowReverseExchange" type="checkbox" checked={exchangeDraft.allowReverseExchange} onChange={(e) => setExchangeDraft((prev) => prev ? { ...prev, allowReverseExchange: e.target.checked } : prev)} className="h-3 w-3 rounded border-sky-600 bg-slate-900/80" />
                    <label htmlFor="allowReverseExchange" className="text-[11px] text-sky-100">啟用 points → Bonus 反向兌換（建議僅限白名單）</label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-sky-100">生效時間</label>
                  <input value={exchangeDraft.effectiveFrom} onChange={(e) => setExchangeDraft((prev) => prev ? { ...prev, effectiveFrom: e.target.value } : prev)} className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="例如：2025-03-01 00:00" />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-sky-100">備註 / 實作說明</label>
                  <textarea value={exchangeDraft.note} onChange={(e) => setExchangeDraft((prev) => prev ? { ...prev, note: e.target.value } : prev)} rows={3} className="w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="補充關於批次 Job、風控、預算管控與版本管理的實作建議。" />
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={handleCloseExchangeDrawer} className="inline-flex items-center gap-1 rounded-full border border-sky-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-sky-100 hover:bg-slate-800/80">取消</button>
                  <button type="submit" className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-sky-500">儲存兌換率</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* 抽屜：Bonus 發放任務（保留） */}
      {issuanceForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-emerald-600/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-emerald-600/60 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-emerald-50">
                  <ListChecks className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold">新增 Bonus 發放任務</span>
                </div>
                <p className="mt-0.5 text-[11px] text-emerald-200/80">所有發放都需選擇 Bonus 等級，後續兌換與報表會依此等級計算。</p>
              </div>
              <button type="button" onClick={handleCloseIssuanceDrawer} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-700/80 bg-slate-900/80 text-emerald-200 hover:border-emerald-400 hover:text-emerald-100">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-emerald-50">
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleSubmitIssuance() }}>
                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">任務名稱</label>
                  <input value={issuanceForm.name} onChange={(e) => setIssuanceForm((prev) => prev ? { ...prev, name: e.target.value } : prev)} className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400" placeholder="例如：登入任務獎勵金等級發放" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">來源 / 類型</label>
                    <select value={issuanceForm.source} onChange={(e) => setIssuanceForm((prev) => prev ? { ...prev, source: e.target.value as BonusSource } : prev)} className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400">
                      <option value="活動">活動</option>
                      <option value="任務">任務</option>
                      <option value="推薦">推薦</option>
                      <option value="補發">補發</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">Bonus 等級</label>
                    <select value={issuanceForm.tierCode} onChange={(e) => setIssuanceForm((prev) => prev ? { ...prev, tierCode: e.target.value } : prev)} className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400">
                      {sortedTiers.map((tier) => (
                        <option key={tier.code} value={tier.code}>{tier.name} ({tier.code}) · x{tier.bonusToPointsRate.toFixed(2)} points</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">目標對象</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIssuanceForm((prev) => prev ? { ...prev, targetType: '單一用戶' } : prev)} className={['flex-1 rounded-full px-2 py-1 text-[10px]', issuanceForm.targetType === '單一用戶' ? 'bg-emerald-600 text-white' : 'border border-emerald-700/80 bg-slate-900/80 text-emerald-100 hover:bg-slate-800/80'].join(' ')}>單一用戶</button>
                    <button type="button" onClick={() => setIssuanceForm((prev) => prev ? { ...prev, targetType: '多用戶匯入' } : prev)} className={['flex-1 rounded-full px-2 py-1 text-[10px]', issuanceForm.targetType === '多用戶匯入' ? 'bg-slate-700 text-white' : 'border border-emerald-700/80 bg-slate-900/80 text-emerald-100 hover:bg-slate-800/80'].join(' ')}>多用戶匯入</button>
                  </div>
                </div>

                {issuanceForm.targetType === '單一用戶' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">用戶 ID（必填）</label>
                    <input value={issuanceForm.userId} onChange={(e) => setIssuanceForm((prev) => prev ? { ...prev, userId: e.target.value } : prev)} className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400" placeholder="例如：10001" />
                  </div>
                )}

                {issuanceForm.targetType === '多用戶匯入' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">匯入名單檔案（示意）</label>
                    <input value={issuanceForm.uploadFileName} onChange={(e) => setIssuanceForm((prev) => prev ? { ...prev, uploadFileName: e.target.value } : prev)} className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400" placeholder="示意：users_202503_bonus.csv" />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">發放 Bonus 金額</label>
                  <input value={issuanceForm.amount} onChange={(e) => setIssuanceForm((prev) => prev ? { ...prev, amount: e.target.value } : prev)} inputMode="decimal" className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400" placeholder="請輸入大於 0 的 Bonus 金額" />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">發放原因（必填）</label>
                  <textarea value={issuanceForm.reason} onChange={(e) => setIssuanceForm((prev) => prev ? { ...prev, reason: e.target.value } : prev)} rows={3} className="w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-emerald-50 outline-none focus:border-emerald-400" placeholder="請描述此次 Bonus 發放的原因、來源與對應工單 ID，實務上建議必填並寫入 Audit Log。" />
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={handleCloseIssuanceDrawer} className="inline-flex items-center gap-1 rounded-full border border-emerald-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-emerald-100 hover:bg-slate-800/80">取消</button>
                  <button type="submit" className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500">建立發放任務</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* 抽屜：Bonus 扣回任務表單（保留） */}
      {rollbackForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-rose-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-rose-700/60 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-rose-50">
                  <Undo2 className="h-3.5 w-3.5 text-rose-400" />
                  <span className="font-semibold">新增 Bonus 扣回 / 回滾任務</span>
                </div>
                <p className="mt-0.5 text-[11px] text-rose-200/80">需填寫原因與預估金額 / 人數，並標註主要 Bonus 等級（多等級可使用 MIXED）。</p>
              </div>
              <button type="button" onClick={handleCloseRollbackDrawer} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-700/80 bg-slate-900/80 text-rose-200 hover:border-rose-400 hover:text-rose-100">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-rose-50">
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleSubmitRollback() }}>
                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">任務名稱</label>
                  <input value={rollbackForm.name} onChange={(e) => setRollbackForm((prev) => prev ? { ...prev, name: e.target.value } : prev)} className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400" placeholder="例如：錯誤活動銅等級回滾" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-rose-100">來源 / 類型</label>
                    <select value={rollbackForm.source} onChange={(e) => setRollbackForm((prev) => prev ? { ...prev, source: e.target.value as BonusSource } : prev)} className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400">
                      <option value="回滾">回滾</option>
                      <option value="活動">活動</option>
                      <option value="任務">任務</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-rose-100">主要 Bonus 等級</label>
                    <select value={rollbackForm.tierCode} onChange={(e) => setRollbackForm((prev) => prev ? { ...prev, tierCode: e.target.value } : prev)} className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400">
                      {sortedTiers.map((tier) => (
                        <option key={tier.code} value={tier.code}>{tier.name} ({tier.code})</option>
                      ))}
                      <option value="MIXED">多等級 MIXED（示意）</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">目標對象</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRollbackForm((prev) => prev ? { ...prev, targetType: '單一用戶' } : prev)} className={['flex-1 rounded-full px-2 py-1 text-[10px]', rollbackForm.targetType === '單一用戶' ? 'bg-rose-600 text-white' : 'border border-rose-700/80 bg-slate-900/80 text-rose-100 hover:bg-slate-800/80'].join(' ')}>單一用戶</button>
                    <button type="button" onClick={() => setRollbackForm((prev) => prev ? { ...prev, targetType: '多用戶匯入' } : prev)} className={['flex-1 rounded-full px-2 py-1 text-[10px]', rollbackForm.targetType === '多用戶匯入' ? 'bg-slate-700 text-white' : 'border border-rose-700/80 bg-slate-900/80 text-rose-100 hover:bg-slate-800/80'].join(' ')}>多用戶匯入</button>
                  </div>
                </div>

                {rollbackForm.targetType === '單一用戶' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] text-rose-100">用戶 ID（必填）</label>
                    <input value={rollbackForm.userId} onChange={(e) => setRollbackForm((prev) => prev ? { ...prev, userId: e.target.value } : prev)} className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400" placeholder="例如：10001" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-rose-100">預估扣回金額（Bonus）</label>
                    <input value={rollbackForm.estimateAmount} onChange={(e) => setRollbackForm((prev) => prev ? { ...prev, estimateAmount: e.target.value } : prev)} inputMode="decimal" className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400" placeholder="請輸入大於 0 的 Bonus 金額" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-rose-100">預估影響人數 / 筆數</label>
                    <input value={rollbackForm.expectedCount} onChange={(e) => setRollbackForm((prev) => prev ? { ...prev, expectedCount: e.target.value } : prev)} inputMode="numeric" className="h-7 w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 text-[11px] text-rose-50 outline-none focus:border-rose-400" placeholder="請輸入大於 0 的數字" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-rose-100">扣回原因（必填）</label>
                  <textarea value={rollbackForm.reason} onChange={(e) => setRollbackForm((prev) => prev ? { ...prev, reason: e.target.value } : prev)} rows={3} className="w-full rounded-md border border-rose-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-rose-50 outline-none focus:border-rose-400" placeholder="請描述此次 Bonus 扣回 / 回滾的原因，建議必填並寫入 Audit Log。" />
                </div>

                <section className="space-y-1 rounded-lg border border-amber-500/60 bg-amber-500/10 p-3 text-[10px] text-amber-50">
                  <div className="font-semibold">風險提醒</div>
                  <ul className="list-disc space-y-0.5 pl-4">
                    <li>此為高風險操作，建議採用多階段審核與雙人覆核。</li>
                    <li>所有扣回紀錄須寫入 Audit Log，並與報表中心對齊。</li>
                    <li>建議先試跑並產出 diff 報表，再正式執行。</li>
                  </ul>
                </section>

                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={handleCloseRollbackDrawer} className="inline-flex items-center gap-1 rounded-full border border-rose-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-rose-100 hover:bg-slate-800/80">取消</button>
                  <button type="submit" className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-rose-500">建立扣回任務</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default BonusPage
