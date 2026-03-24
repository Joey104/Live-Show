/**
 * @file MarketingPage.tsx
 * @description 市場營銷管理工作台（活動 / 優惠券 / 推薦分潤 / 分潤矩陣 / 成長任務 / 任務進度）
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showAlert, showConfirm, showPrompt } from '../../lib/dialog'
import {
  Gift, Megaphone, Ticket, Users, Grid3x3, CheckSquare,
  BarChart3, ListChecks, PlusCircle, Eye, Copy, Award,
  Search, Filter, Edit3, XCircle, ChevronLeft, ChevronRight,
  ToggleLeft, ToggleRight, TrendingUp, Target, Clock,
  CheckCircle2, AlertTriangle, History, Layers,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Types ────────────────────────────────────────────────────────────────────

type MarketingTabId =
  | 'overview' | 'campaigns' | 'coupons' | 'referral'
  | 'matrix' | 'tasks' | 'progress' | 'blueprint'

type CampaignType = '充值' | '任務' | '推薦' | '觀看'
type CampaignAudience = 'Player' | 'Broadcaster' | '全部'
type BonusTierCode = 'GOLD' | 'SILVER' | 'BRONZE' | 'IRON' | 'STONE'
type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended'

type CouponType = '折扣' | '面額' | '免費'
type CouponStatus = 'active' | 'disabled'
type CouponUsageResult = 'success' | 'fail' | 'revoked'
type CouponSubTab = 'list' | 'usage'

type ReferralSubTab = 'schemes' | 'relations' | 'payouts'
type ReferralTrigger = '註冊' | '首充' | '任務達標' | '觀看達標'
type ReferralPayoutType = '固定金額' | '百分比'
type ReferralPayoutStatus = 'pending' | 'paid' | 'failed'

type TaskType = '首充' | '連登' | '消費' | '觀看'
type TaskPeriod = '一次性' | '每日' | '每週'
type TaskStatus = 'draft' | 'active' | 'paused' | 'ended'
type TaskProgressStatus = 'in_progress' | 'completed' | 'expired'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Campaign {
  id: string
  name: string
  type: CampaignType
  audience: CampaignAudience
  tierCode: BonusTierCode
  status: CampaignStatus
  startAt: string
  endAt: string
  issuedBonus: number
  estimatedCount: number
  capAmount: number
  rule: string
  note?: string
}

interface CampaignForm {
  name: string
  type: CampaignType
  audience: CampaignAudience
  tierCode: BonusTierCode
  startAt: string
  endAt: string
  rule: string
  estimatedCount: string
  capAmount: string
  note: string
}

interface Coupon {
  id: string
  name: string
  type: CouponType
  faceValue: number
  discountRate: number
  minSpend: number
  validFrom: string
  validTo: string
  totalIssued: number
  totalUsed: number
  remaining: number
  status: CouponStatus
  audience: CampaignAudience
  perUserLimit: number
  scenes: string[]
}

interface CouponForm {
  name: string
  type: CouponType
  faceValue: string
  discountRate: string
  minSpend: string
  validFrom: string
  validTo: string
  totalIssued: string
  perUserLimit: string
  scenes: string
  audience: CampaignAudience
}

interface CouponUsageRecord {
  id: string
  userId: string
  couponId: string
  usedAt: string
  result: CouponUsageResult
  refOrderId?: string
}

interface ReferralScheme {
  id: string
  name: string
  trigger: ReferralTrigger
  payoutType: ReferralPayoutType
  ratio: number
  capAmount: number
  status: 'active' | 'inactive'
  validFrom: string
  validTo: string
}

interface ReferralSchemeForm {
  name: string
  trigger: ReferralTrigger
  payoutType: ReferralPayoutType
  ratio: string
  capAmount: string
  validFrom: string
  validTo: string
}

interface ReferralRelation {
  id: string
  referrerId: string
  referrerName: string
  refereeId: string
  refereeName: string
  createdAt: string
  triggeredEvents: string
  totalPayout: number
}

interface ReferralPayoutRecord {
  id: string
  referrerId: string
  referrerName: string
  refereeId: string
  refereeName: string
  triggerEvent: string
  payoutAmount: number
  status: ReferralPayoutStatus
  createdAt: string
}

interface GrowthTask {
  id: string
  name: string
  type: TaskType
  period: TaskPeriod
  targetValue: number
  rewardTierCode: BonusTierCode
  rewardAmount: number
  audience: CampaignAudience
  status: TaskStatus
  completedCount: number
  startAt: string
  endAt: string
  desc?: string
}

interface GrowthTaskForm {
  name: string
  type: TaskType
  period: TaskPeriod
  targetValue: string
  rewardTierCode: BonusTierCode
  rewardAmount: string
  audience: CampaignAudience
  startAt: string
  endAt: string
  desc: string
}

interface TaskProgressRecord {
  taskName: string
  targetValue: number
  currentProgress: number
  status: TaskProgressStatus
  completedAt?: string
  rewardEarned: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ts(offsetHours = 0): string {
  const d = new Date(Date.now() - offsetHours * 3_600_000)
  return d.toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const tierCostMap: Record<BonusTierCode, number> = {
  GOLD: 5.0, SILVER: 3.0, BRONZE: 1.5, IRON: 1.0, STONE: 0.5,
}

function calcEstimatedCost(tierCode: BonusTierCode, count: number): number {
  return Math.round((tierCostMap[tierCode] ?? 1) * count)
}

const BONUS_TIERS: BonusTierCode[] = ['GOLD', 'SILVER', 'BRONZE', 'IRON', 'STONE']
const TIER_LABELS: Record<BonusTierCode, string> = {
  GOLD: '金', SILVER: '銀', BRONZE: '銅', IRON: '鐵', STONE: '石',
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function mockCampaigns(): Campaign[] {
  return [
    { id: 'CMP-001', name: '三月充值狂歡', type: '充值', audience: 'Player', tierCode: 'GOLD', status: 'active', startAt: ts(72), endAt: ts(-72), issuedBonus: 12500, estimatedCount: 300, capAmount: 50000, rule: '充值 ≥ 500 即獲 GOLD Bonus x5', note: '限時三月' },
    { id: 'CMP-002', name: '主播任務挑戰', type: '任務', audience: 'Broadcaster', tierCode: 'SILVER', status: 'active', startAt: ts(48), endAt: ts(-48), issuedBonus: 3200, estimatedCount: 80, capAmount: 10000, rule: '每完成 5 場直播獲 SILVER Bonus x3' },
    { id: 'CMP-003', name: '推薦好友計畫', type: '推薦', audience: '全部', tierCode: 'BRONZE', status: 'paused', startAt: ts(120), endAt: ts(-24), issuedBonus: 8700, estimatedCount: 500, capAmount: 20000, rule: '推薦人與被推薦人各得 BRONZE Bonus x2', note: '暫停中待審核' },
    { id: 'CMP-004', name: '觀看達成獎勵', type: '觀看', audience: 'Player', tierCode: 'IRON', status: 'ended', startAt: ts(200), endAt: ts(24), issuedBonus: 21000, estimatedCount: 1000, capAmount: 30000, rule: '累計觀看 10 小時得 IRON Bonus x10' },
    { id: 'CMP-005', name: '新春草稿活動', type: '充值', audience: '全部', tierCode: 'STONE', status: 'draft', startAt: ts(-5), endAt: ts(-24 * 7), issuedBonus: 0, estimatedCount: 200, capAmount: 5000, rule: '待配置' },
  ]
}

function mockCoupons(): Coupon[] {
  return [
    { id: 'CPN-001', name: '首充折扣券 20%', type: '折扣', faceValue: 0, discountRate: 0.8, minSpend: 200, validFrom: ts(72), validTo: ts(-72), totalIssued: 1000, totalUsed: 430, remaining: 570, status: 'active', audience: 'Player', perUserLimit: 1, scenes: ['充值'] },
    { id: 'CPN-002', name: '100 面額禮品券', type: '面額', faceValue: 100, discountRate: 1, minSpend: 500, validFrom: ts(48), validTo: ts(-48), totalIssued: 500, totalUsed: 210, remaining: 290, status: 'active', audience: '全部', perUserLimit: 2, scenes: ['充值', '禮品兌換'] },
    { id: 'CPN-003', name: '主播免費體驗包', type: '免費', faceValue: 200, discountRate: 1, minSpend: 0, validFrom: ts(100), validTo: ts(-10), totalIssued: 200, totalUsed: 198, remaining: 2, status: 'disabled', audience: 'Broadcaster', perUserLimit: 1, scenes: ['直播體驗'] },
    { id: 'CPN-004', name: '周末折扣 15%', type: '折扣', faceValue: 0, discountRate: 0.85, minSpend: 300, validFrom: ts(24), validTo: ts(-96), totalIssued: 800, totalUsed: 50, remaining: 750, status: 'active', audience: '全部', perUserLimit: 3, scenes: ['充值', '點數兌換'] },
    { id: 'CPN-005', name: '50 面額新手券', type: '面額', faceValue: 50, discountRate: 1, minSpend: 100, validFrom: ts(10), validTo: ts(-120), totalIssued: 2000, totalUsed: 890, remaining: 1110, status: 'active', audience: 'Player', perUserLimit: 1, scenes: ['充值'] },
  ]
}

function mockCouponUsage(): CouponUsageRecord[] {
  return [
    { id: 'CUR-001', userId: '10001', couponId: 'CPN-001', usedAt: ts(5), result: 'success', refOrderId: 'DEP-001' },
    { id: 'CUR-002', userId: '10002', couponId: 'CPN-002', usedAt: ts(10), result: 'success', refOrderId: 'DEP-002' },
    { id: 'CUR-003', userId: '10003', couponId: 'CPN-001', usedAt: ts(15), result: 'fail' },
    { id: 'CUR-004', userId: '10004', couponId: 'CPN-003', usedAt: ts(20), result: 'revoked', refOrderId: 'DEP-003' },
    { id: 'CUR-005', userId: '10005', couponId: 'CPN-004', usedAt: ts(25), result: 'success', refOrderId: 'DEP-004' },
  ]
}

function mockReferralSchemes(): ReferralScheme[] {
  return [
    { id: 'REF-SCH-001', name: '標準推薦方案', trigger: '首充', payoutType: '百分比', ratio: 5, capAmount: 500, status: 'active', validFrom: ts(200), validTo: ts(-200) },
    { id: 'REF-SCH-002', name: '主播招募計畫', trigger: '任務達標', payoutType: '固定金額', ratio: 100, capAmount: 1000, status: 'active', validFrom: ts(100), validTo: ts(-100) },
    { id: 'REF-SCH-003', name: '觀看推薦獎勵', trigger: '觀看達標', payoutType: '百分比', ratio: 3, capAmount: 300, status: 'inactive', validFrom: ts(300), validTo: ts(-50) },
    { id: 'REF-SCH-004', name: '新用戶推薦禮', trigger: '註冊', payoutType: '固定金額', ratio: 50, capAmount: 200, status: 'active', validFrom: ts(50), validTo: ts(-150) },
  ]
}

function mockReferralRelations(): ReferralRelation[] {
  return [
    { id: 'REL-001', referrerId: '10001', referrerName: 'alice', refereeId: '10010', refereeName: 'fiona', createdAt: ts(100), triggeredEvents: '首充', totalPayout: 250 },
    { id: 'REL-002', referrerId: '10002', referrerName: 'bob', refereeId: '10011', refereeName: 'grace', createdAt: ts(80), triggeredEvents: '首充, 任務達標', totalPayout: 600 },
    { id: 'REL-003', referrerId: '10001', referrerName: 'alice', refereeId: '10012', refereeName: 'henry', createdAt: ts(60), triggeredEvents: '—', totalPayout: 0 },
    { id: 'REL-004', referrerId: '10003', referrerName: 'carol', refereeId: '10013', refereeName: 'iris', createdAt: ts(30), triggeredEvents: '首充', totalPayout: 150 },
  ]
}

function mockReferralPayouts(): ReferralPayoutRecord[] {
  return [
    { id: 'PAY-001', referrerId: '10001', referrerName: 'alice', refereeId: '10010', refereeName: 'fiona', triggerEvent: '首充', payoutAmount: 250, status: 'paid', createdAt: ts(95) },
    { id: 'PAY-002', referrerId: '10002', referrerName: 'bob', refereeId: '10011', refereeName: 'grace', triggerEvent: '首充', payoutAmount: 200, status: 'paid', createdAt: ts(75) },
    { id: 'PAY-003', referrerId: '10002', referrerName: 'bob', refereeId: '10011', refereeName: 'grace', triggerEvent: '任務達標', payoutAmount: 400, status: 'pending', createdAt: ts(20) },
    { id: 'PAY-004', referrerId: '10003', referrerName: 'carol', refereeId: '10013', refereeName: 'iris', triggerEvent: '首充', payoutAmount: 150, status: 'failed', createdAt: ts(25) },
    { id: 'PAY-005', referrerId: '10001', referrerName: 'alice', refereeId: '10012', refereeName: 'henry', triggerEvent: '—', payoutAmount: 0, status: 'pending', createdAt: ts(5) },
  ]
}

function mockGrowthTasks(): GrowthTask[] {
  return [
    { id: 'TSK-001', name: '7日連續登入', type: '連登', period: '每日', targetValue: 7, rewardTierCode: 'STONE', rewardAmount: 50, audience: 'Player', status: 'active', completedCount: 320, startAt: ts(200), endAt: ts(-200), desc: '連續登入 7 天獲得 STONE Bonus' },
    { id: 'TSK-002', name: '首次充值任務', type: '首充', period: '一次性', targetValue: 100, rewardTierCode: 'BRONZE', rewardAmount: 100, audience: 'Player', status: 'active', completedCount: 580, startAt: ts(100), endAt: ts(-100), desc: '首次充值 ≥100 完成任務' },
    { id: 'TSK-003', name: '主播月播任務', type: '觀看', period: '每週', targetValue: 5, rewardTierCode: 'SILVER', rewardAmount: 200, audience: 'Broadcaster', status: 'active', completedCount: 45, startAt: ts(80), endAt: ts(-80) },
    { id: 'TSK-004', name: '消費達標任務', type: '消費', period: '每週', targetValue: 500, rewardTierCode: 'IRON', rewardAmount: 80, audience: '全部', status: 'paused', completedCount: 120, startAt: ts(50), endAt: ts(-50) },
    { id: 'TSK-005', name: '黃金消費挑戰', type: '消費', period: '一次性', targetValue: 5000, rewardTierCode: 'GOLD', rewardAmount: 500, audience: 'Player', status: 'draft', completedCount: 0, startAt: ts(-5), endAt: ts(-200) },
  ]
}

const REFERRAL_LEVELS: BonusTierCode[] = ['GOLD', 'SILVER', 'BRONZE', 'IRON', 'STONE']

function defaultMatrix(): Record<string, Record<string, string>> {
  const m: Record<string, Record<string, string>> = {}
  const defaults: Record<string, Record<string, string>> = {
    GOLD:   { GOLD: '3.0', SILVER: '2.5', BRONZE: '2.0', IRON: '1.5', STONE: '1.2' },
    SILVER: { GOLD: '2.5', SILVER: '2.0', BRONZE: '1.8', IRON: '1.3', STONE: '1.0' },
    BRONZE: { GOLD: '2.0', SILVER: '1.8', BRONZE: '1.5', IRON: '1.2', STONE: '0.9' },
    IRON:   { GOLD: '1.5', SILVER: '1.3', BRONZE: '1.2', IRON: '1.0', STONE: '0.8' },
    STONE:  { GOLD: '1.2', SILVER: '1.0', BRONZE: '0.9', IRON: '0.8', STONE: '0.5' },
  }
  for (const r of REFERRAL_LEVELS) {
    m[r] = { ...defaults[r] }
  }
  return m
}

const blueprintFeatures: FeatureItem[] = [
  { id: 83, name: '活動（Campaign）列表', description: '展示草稿 / 上架 / 結束等狀態，可依時間範圍與受眾類型（Player / Broadcaster）篩選。', tag: '活動' },
  { id: 84, name: '活動建立 / 編輯', description: '配置獎勵方案、受眾、Bonus 等級與發放規則，支援複製現有活動。', tag: '活動' },
  { id: 85, name: '活動受眾（含主播參與）', description: '清楚標示 Player / Broadcaster 是否可參與，並支援按會員等級篩選。', tag: '受眾' },
  { id: 86, name: '活動預估發放計算', description: '根據等級倍數與預估人數，計算預估 Bonus 發放量與成本，協助預算控管。', tag: '預估' },
  { id: 87, name: '活動發獎 / 補發 / 撤銷', description: '所有發放行為需生成 Bonus 流水並支援回滾，並記錄審核與操作人。', tag: '發獎' },
  { id: 88, name: '活動成效報表', description: '統計參與人數、達標數、發放總 Bonus 及轉化，支援按活動比較。', tag: '報表' },
  { id: 89, name: '優惠券（Coupon）列表', description: '展示有效中 / 已用 / 已過期 / 停用的優惠券，支援搜尋與篩選。', tag: '優惠券' },
  { id: 90, name: '建立 / 配置優惠券', description: '設定面額 / 折扣 / 有效期 / 使用門檻，並支援限制適用對象與場景。', tag: '優惠券' },
  { id: 91, name: '優惠券發放策略', description: '支援指定 / 自動 / 領取等方式，並可按 Player / Broadcaster 區隔受眾。', tag: '發放' },
  { id: 92, name: '優惠券使用記錄', description: '查詢券的使用成功 / 失敗 / 撤銷紀錄，並關聯到交易 / 點數 / Bonus 影響。', tag: '流水' },
  { id: 93, name: '推薦分潤（Referral）方案列表', description: '展示所有推薦方案與觸發條件（註冊 / 充值 / 任務達標等），含當前狀態。', tag: '推薦' },
  { id: 94, name: '推薦分潤倍率矩陣配置', description: '以推薦人等級 × 被推薦人等級矩陣方式配置分潤倍率，支援批量填值。', tag: '矩陣' },
  { id: 95, name: '推薦關係查詢', description: '查詢推薦人 / 被推薦人關係與建立時間，支援導出與風控分析。', tag: '關係' },
  { id: 96, name: '分潤發放 / 回滾', description: '依觸發事件自動或手動發放 Bonus 點數，支援失敗回滾並生成 Audit Log。', tag: '發放' },
  { id: 97, name: '任務（Task）列表（成長）', description: '展示首充 / 連登 / 消費 / 觀看等任務模板與執行情況。', tag: '任務' },
  { id: 98, name: '任務建立 / 配置', description: '設定目標值、獎勵點數 / Bonus 等級與會員等級倍率，支援週期性任務。', tag: '任務' },
  { id: 99, name: '任務受眾（含主播參與）', description: '控制 Player / Broadcaster 是否可參與，並按會員等級與地域等條件過濾。', tag: '受眾' },
  { id: 100, name: '任務進度查詢', description: '支援查詢某玩家的任務進度，建議用抽屜顯示細節與近期紀錄。', tag: '進度' },
  { id: 101, name: '任務發獎 / 補發 / 回滾', description: '完成任務後發放 Bonus 點數，支援補發與回滾，並將流水與 Audit Log 串接。', tag: '發獎' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function MarketingPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<MarketingTabId>('overview')

  // campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => mockCampaigns())
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<'all' | CampaignStatus>('all')
  const [campaignTypeFilter, setCampaignTypeFilter] = useState<'all' | CampaignType>('all')
  const [campaignDrawer, setCampaignDrawer] = useState<{ mode: 'new' | 'edit'; data: CampaignForm; editId?: string } | null>(null)

  // coupons
  const [coupons, setCoupons] = useState<Coupon[]>(() => mockCoupons())
  const [couponUsage] = useState<CouponUsageRecord[]>(() => mockCouponUsage())
  const [couponSubTab, setCouponSubTab] = useState<CouponSubTab>('list')
  const [couponDrawer, setCouponDrawer] = useState<CouponForm | null>(null)

  // referral
  const [referralSchemes, setReferralSchemes] = useState<ReferralScheme[]>(() => mockReferralSchemes())
  const [referralRelations] = useState<ReferralRelation[]>(() => mockReferralRelations())
  const [referralPayouts] = useState<ReferralPayoutRecord[]>(() => mockReferralPayouts())
  const [referralSubTab, setReferralSubTab] = useState<ReferralSubTab>('schemes')
  const [referralSearch, setReferralSearch] = useState('')
  const [referralDrawer, setReferralDrawer] = useState<ReferralSchemeForm | null>(null)

  // matrix
  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>(() => defaultMatrix())

  // tasks
  const [growthTasks, setGrowthTasks] = useState<GrowthTask[]>(() => mockGrowthTasks())
  const [taskDrawer, setTaskDrawer] = useState<{ mode: 'new' | 'edit'; data: GrowthTaskForm; editId?: string } | null>(null)

  // progress
  const [progressUserId, setProgressUserId] = useState('')
  const [progressQueried, setProgressQueried] = useState(false)
  const [progressResults, setProgressResults] = useState<TaskProgressRecord[]>([])

  // pagination
  const pageSize = 5
  const [campaignPage, setCampaignPage] = useState(1)
  const [couponPage, setCouponPage] = useState(1)
  const [taskPage, setTaskPage] = useState(1)

  // ─── Computed ───────────────────────────────────────────────────────────────

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (campaignStatusFilter !== 'all' && c.status !== campaignStatusFilter) return false
      if (campaignTypeFilter !== 'all' && c.type !== campaignTypeFilter) return false
      return true
    })
  }, [campaigns, campaignStatusFilter, campaignTypeFilter])

  const campaignTotalPages = Math.max(1, Math.ceil(filteredCampaigns.length / pageSize))
  const paginatedCampaigns = useMemo(() => {
    const start = (campaignPage - 1) * pageSize
    return filteredCampaigns.slice(start, start + pageSize)
  }, [filteredCampaigns, campaignPage])

  const couponTotalPages = Math.max(1, Math.ceil(coupons.length / pageSize))
  const paginatedCoupons = useMemo(() => {
    const start = (couponPage - 1) * pageSize
    return coupons.slice(start, start + pageSize)
  }, [coupons, couponPage])

  const taskTotalPages = Math.max(1, Math.ceil(growthTasks.length / pageSize))
  const paginatedTasks = useMemo(() => {
    const start = (taskPage - 1) * pageSize
    return growthTasks.slice(start, start + pageSize)
  }, [growthTasks, taskPage])

  const filteredRelations = useMemo(() => {
    if (!referralSearch.trim()) return referralRelations
    const q = referralSearch.toLowerCase()
    return referralRelations.filter(r =>
      r.referrerId.includes(q) || r.refereeId.includes(q) ||
      r.referrerName.toLowerCase().includes(q) || r.refereeName.toLowerCase().includes(q)
    )
  }, [referralRelations, referralSearch])

  const overviewStats = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const monthBonus = campaigns.reduce((s, c) => s + c.issuedBonus, 0)
    const couponUsageRate = coupons.length > 0
      ? Math.round((coupons.reduce((s, c) => s + c.totalUsed, 0) / coupons.reduce((s, c) => s + c.totalIssued, 0)) * 100)
      : 0
    const referralUsers = referralRelations.length
    const taskTotal = growthTasks.reduce((s, t) => s + t.completedCount, 0)
    const taskTarget = growthTasks.reduce((s, t) => s + t.targetValue * 10, 0)
    const taskRate = taskTarget > 0 ? Math.round((taskTotal / taskTarget) * 100) : 0
    const budgetUsed = Math.round((campaigns.filter(c=>c.status!=='draft').reduce((s,c)=>s+c.issuedBonus,0) / campaigns.reduce((s,c)=>s+c.capAmount,0)) * 100)
    return { activeCampaigns, monthBonus, couponUsageRate, referralUsers, taskRate, budgetUsed }
  }, [campaigns, coupons, referralRelations, growthTasks])

  // ─── Handlers: Campaigns ────────────────────────────────────────────────────

  const openNewCampaignDrawer = () => {
    setCampaignDrawer({
      mode: 'new',
      data: { name: '', type: '充值', audience: 'Player', tierCode: 'STONE', startAt: '', endAt: '', rule: '', estimatedCount: '', capAmount: '', note: '' },
    })
  }

  const openEditCampaignDrawer = (c: Campaign) => {
    setCampaignDrawer({
      mode: 'edit',
      editId: c.id,
      data: { name: c.name, type: c.type, audience: c.audience, tierCode: c.tierCode, startAt: c.startAt, endAt: c.endAt, rule: c.rule, estimatedCount: String(c.estimatedCount), capAmount: String(c.capAmount), note: c.note ?? '' },
    })
  }

  const handleSaveCampaign = async () => {
    if (!campaignDrawer) return
    const f = campaignDrawer.data
    if (!f.name.trim()) { await showAlert('請填寫活動名稱。'); return }
    if (!f.rule.trim()) { await showAlert('請填寫獎勵規則。'); return }
    const estimatedCount = Number(f.estimatedCount) || 0
    const capAmount = Number(f.capAmount) || 0
    const estimatedCost = calcEstimatedCost(f.tierCode, estimatedCount)

    if (campaignDrawer.mode === 'new') {
      const newC: Campaign = {
        id: `CMP-${Date.now()}`, name: f.name.trim(), type: f.type,
        audience: f.audience, tierCode: f.tierCode, status: 'draft',
        startAt: f.startAt || ts(0), endAt: f.endAt || ts(-24 * 7),
        issuedBonus: 0, estimatedCount, capAmount, rule: f.rule.trim(), note: f.note.trim() || undefined,
      }
      setCampaigns(prev => [newC, ...prev])
      await showAlert(`活動「${newC.name}」已建立（草稿）。\n預估 Bonus 成本：${estimatedCost.toLocaleString()}`)
    } else if (campaignDrawer.editId) {
      setCampaigns(prev => prev.map(c => c.id === campaignDrawer.editId ? {
        ...c, name: f.name.trim(), type: f.type, audience: f.audience,
        tierCode: f.tierCode, startAt: f.startAt, endAt: f.endAt,
        rule: f.rule.trim(), estimatedCount, capAmount, note: f.note.trim() || undefined,
      } : c))
    }
    setCampaignDrawer(null)
  }

  const handleToggleCampaignStatus = async (c: Campaign) => {
    const isActive = c.status === 'active'
    const ok = await showConfirm(`確認${isActive ? '下架' : '上架'}活動「${c.name}」嗎？`)
    if (!ok) return
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: isActive ? 'paused' : 'active' } : x))
  }

  const handleCopyCampaign = async (c: Campaign) => {
    const newName = await showPrompt('請輸入複製後的活動名稱：', `${c.name} (複製)`)
    if (newName === null) return
    const newC: Campaign = { ...c, id: `CMP-${Date.now()}`, name: newName.trim() || `${c.name} (複製)`, status: 'draft', issuedBonus: 0 }
    setCampaigns(prev => [newC, ...prev])
    await showAlert(`活動已複製為：「${newC.name}」`)
  }

  const handleIssueCampaignBonus = async (c: Campaign) => {
    const ok = await showConfirm(`確認對活動「${c.name}」執行發獎嗎？\nBonus 等級：${TIER_LABELS[c.tierCode]}（${c.tierCode}）\n預估人數：${c.estimatedCount.toLocaleString()}\n發放上限：${c.capAmount.toLocaleString()}`)
    if (!ok) return
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, issuedBonus: x.issuedBonus + Math.min(calcEstimatedCost(x.tierCode, x.estimatedCount), x.capAmount) } : x))
    await showAlert(`已模擬發放活動「${c.name}」的 Bonus，實務請連接後端任務系統。`)
  }

  // ─── Handlers: Coupons ──────────────────────────────────────────────────────

  const openNewCouponDrawer = () => {
    setCouponDrawer({ name: '', type: '折扣', faceValue: '', discountRate: '', minSpend: '', validFrom: '', validTo: '', totalIssued: '', perUserLimit: '1', scenes: '', audience: 'Player' })
  }

  const handleSaveCoupon = async () => {
    if (!couponDrawer) return
    if (!couponDrawer.name.trim()) { await showAlert('請填寫券名稱。'); return }
    const totalIssued = Number(couponDrawer.totalIssued) || 0
    if (totalIssued <= 0) { await showAlert('請填寫大於 0 的發行量。'); return }
    const faceValue = Number(couponDrawer.faceValue) || 0
    const discountRate = Number(couponDrawer.discountRate) || 1
    const newCoupon: Coupon = {
      id: `CPN-${Date.now()}`, name: couponDrawer.name.trim(), type: couponDrawer.type,
      faceValue, discountRate: couponDrawer.type === '折扣' ? discountRate : 1,
      minSpend: Number(couponDrawer.minSpend) || 0,
      validFrom: couponDrawer.validFrom || ts(0), validTo: couponDrawer.validTo || ts(-24 * 30),
      totalIssued, totalUsed: 0, remaining: totalIssued,
      status: 'active', audience: couponDrawer.audience,
      perUserLimit: Number(couponDrawer.perUserLimit) || 1,
      scenes: couponDrawer.scenes.split(',').map(s => s.trim()).filter(Boolean),
    }
    setCoupons(prev => [newCoupon, ...prev])
    setCouponDrawer(null)
    await showAlert(`優惠券「${newCoupon.name}」已建立。`)
  }

  const handleToggleCoupon = async (c: Coupon) => {
    const ok = await showConfirm(`確認${c.status === 'active' ? '停用' : '啟用'}優惠券「${c.name}」嗎？`)
    if (!ok) return
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x))
  }

  // ─── Handlers: Referral ─────────────────────────────────────────────────────

  const openNewReferralDrawer = () => {
    setReferralDrawer({ name: '', trigger: '首充', payoutType: '百分比', ratio: '', capAmount: '', validFrom: '', validTo: '' })
  }

  const handleSaveReferralScheme = async () => {
    if (!referralDrawer) return
    if (!referralDrawer.name.trim()) { await showAlert('請填寫方案名稱。'); return }
    const ratio = Number(referralDrawer.ratio)
    if (!ratio || ratio <= 0) { await showAlert('請填寫大於 0 的分潤比例。'); return }
    const newScheme: ReferralScheme = {
      id: `REF-SCH-${Date.now()}`, name: referralDrawer.name.trim(),
      trigger: referralDrawer.trigger, payoutType: referralDrawer.payoutType,
      ratio, capAmount: Number(referralDrawer.capAmount) || 0,
      status: 'active', validFrom: referralDrawer.validFrom || ts(0), validTo: referralDrawer.validTo || ts(-24 * 30),
    }
    setReferralSchemes(prev => [newScheme, ...prev])
    setReferralDrawer(null)
    await showAlert(`推薦方案「${newScheme.name}」已建立。`)
  }

  // ─── Handlers: Matrix ───────────────────────────────────────────────────────

  const handleSaveMatrix = async () => {
    const ok = await showConfirm('確認儲存分潤矩陣？所有倍率修改將立即生效（示意）。')
    if (!ok) return
    await showAlert('分潤矩陣已儲存。實務請同步後端配置並寫入 Audit Log。')
  }

  // ─── Handlers: Tasks ────────────────────────────────────────────────────────

  const openNewTaskDrawer = () => {
    setTaskDrawer({ mode: 'new', data: { name: '', type: '首充', period: '一次性', targetValue: '', rewardTierCode: 'STONE', rewardAmount: '', audience: 'Player', startAt: '', endAt: '', desc: '' } })
  }

  const openEditTaskDrawer = (t: GrowthTask) => {
    setTaskDrawer({ mode: 'edit', editId: t.id, data: { name: t.name, type: t.type, period: t.period, targetValue: String(t.targetValue), rewardTierCode: t.rewardTierCode, rewardAmount: String(t.rewardAmount), audience: t.audience, startAt: t.startAt, endAt: t.endAt, desc: t.desc ?? '' } })
  }

  const handleSaveTask = async () => {
    if (!taskDrawer) return
    const f = taskDrawer.data
    if (!f.name.trim()) { await showAlert('請填寫任務名稱。'); return }
    if (!Number(f.targetValue) || Number(f.targetValue) <= 0) { await showAlert('請填寫大於 0 的目標值。'); return }
    if (!Number(f.rewardAmount) || Number(f.rewardAmount) <= 0) { await showAlert('請填寫大於 0 的獎勵數量。'); return }
    if (taskDrawer.mode === 'new') {
      const newTask: GrowthTask = {
        id: `TSK-${Date.now()}`, name: f.name.trim(), type: f.type, period: f.period,
        targetValue: Number(f.targetValue), rewardTierCode: f.rewardTierCode,
        rewardAmount: Number(f.rewardAmount), audience: f.audience, status: 'draft',
        completedCount: 0, startAt: f.startAt || ts(0), endAt: f.endAt || ts(-24 * 30), desc: f.desc.trim() || undefined,
      }
      setGrowthTasks(prev => [newTask, ...prev])
    } else if (taskDrawer.editId) {
      setGrowthTasks(prev => prev.map(t => t.id === taskDrawer.editId ? {
        ...t, name: f.name.trim(), type: f.type, period: f.period,
        targetValue: Number(f.targetValue), rewardTierCode: f.rewardTierCode,
        rewardAmount: Number(f.rewardAmount), audience: f.audience,
        startAt: f.startAt, endAt: f.endAt, desc: f.desc.trim() || undefined,
      } : t))
    }
    setTaskDrawer(null)
  }

  const handleToggleTask = async (t: GrowthTask) => {
    const isActive = t.status === 'active'
    const ok = await showConfirm(`確認${isActive ? '下架' : '上架'}任務「${t.name}」嗎？`)
    if (!ok) return
    setGrowthTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: isActive ? 'paused' : 'active' } : x))
  }

  // ─── Handlers: Progress ─────────────────────────────────────────────────────

  const handleQueryProgress = () => {
    if (!progressUserId.trim()) return
    // Mock: generate some progress based on userId
    setProgressResults([
      { taskName: '7日連續登入', targetValue: 7, currentProgress: 5, status: 'in_progress', rewardEarned: 0 },
      { taskName: '首次充值任務', targetValue: 100, currentProgress: 100, status: 'completed', completedAt: ts(20), rewardEarned: 100 },
      { taskName: '消費達標任務', targetValue: 500, currentProgress: 320, status: 'in_progress', rewardEarned: 0 },
      { taskName: '黃金消費挑戰', targetValue: 5000, currentProgress: 800, status: 'in_progress', rewardEarned: 0 },
    ])
    setProgressQueried(true)
  }

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const statusBadge = (status: CampaignStatus | TaskStatus) => {
    const map: Record<string, string> = {
      draft: 'bg-slate-600/40 text-slate-100',
      active: 'bg-emerald-500/30 text-emerald-50',
      paused: 'bg-amber-500/30 text-amber-50',
      ended: 'bg-slate-700/60 text-slate-300',
    }
    const labels: Record<string, string> = { draft: '草稿', active: '進行中', paused: '暫停', ended: '已結束' }
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${map[status] ?? ''}`}>{labels[status] ?? status}</span>
  }

  const audienceBadge = (a: CampaignAudience) => {
    const map: Record<CampaignAudience, string> = { Player: 'bg-sky-500/25 text-sky-100', Broadcaster: 'bg-violet-500/25 text-violet-100', '全部': 'bg-slate-600/40 text-slate-100' }
    return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${map[a]}`}>{a}</span>
  }

  const payoutStatusBadge = (s: ReferralPayoutStatus) => {
    const map: Record<ReferralPayoutStatus, string> = { pending: 'bg-amber-500/30 text-amber-50', paid: 'bg-emerald-500/30 text-emerald-50', failed: 'bg-rose-500/30 text-rose-50' }
    const labels: Record<ReferralPayoutStatus, string> = { pending: '待發放', paid: '已發放', failed: '失敗' }
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${map[s]}`}>{labels[s]}</span>
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <Gift className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">市場營銷管理</span>
          <span className="text-[10px] text-slate-500">活動 / 優惠券 / 推薦分潤 / 矩陣 / 成長任務一體化管理。</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {([
            ['overview', t('common.overview'), 'bg-slate-700'],
            ['campaigns', t('tabs.mktCampaigns'), 'bg-emerald-600'],
            ['coupons', t('tabs.mktCoupons'), 'bg-amber-600'],
            ['referral', t('tabs.mktReferral'), 'bg-indigo-600'],
            ['matrix', t('tabs.mktMatrix'), 'bg-violet-600'],
            ['tasks', t('tabs.mktTasks'), 'bg-sky-600'],
            ['progress', t('tabs.mktProgress'), 'bg-teal-600'],
            ['blueprint', t('common.blueprint'), 'bg-slate-700'],
          ] as [MarketingTabId, string, string][]).map(([id, label, activeClass]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={[
                'rounded-full px-2 py-0.5',
                activeTab === id ? `${activeClass} text-white` : 'text-slate-200 hover:bg-slate-800/80',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── 總覽 ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center gap-1.5 text-xs text-slate-200">
            <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-semibold">營銷總覽</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-[11px]">
            {[
              { label: '進行中活動數', value: overviewStats.activeCampaigns, unit: '個', color: 'emerald' },
              { label: '累計發放 Bonus', value: overviewStats.monthBonus.toLocaleString(), unit: '', color: 'sky' },
              { label: '優惠券使用率', value: `${overviewStats.couponUsageRate}%`, unit: '', color: 'amber' },
              { label: '推薦新增用戶', value: overviewStats.referralUsers, unit: '組', color: 'indigo' },
              { label: '任務完成率', value: `${overviewStats.taskRate}%`, unit: '', color: 'teal' },
              { label: '預算使用率', value: `${overviewStats.budgetUsed}%`, unit: '', color: 'violet' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className={`space-y-1 rounded-xl border border-${color}-600/60 bg-${color}-500/10 p-3`}>
                <div className="text-slate-400">{label}</div>
                <div className={`text-lg font-semibold text-${color}-100`}>{value}{unit}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 活動管理 ───────────────────────────────────────────────────────── */}
      {activeTab === 'campaigns' && (
        <section className="space-y-3 rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold">活動管理</span>
            </div>
            <div className="flex items-center gap-2">
              <select value={campaignStatusFilter} onChange={e => { setCampaignStatusFilter(e.target.value as 'all' | CampaignStatus); setCampaignPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部狀態</option>
                <option value="draft">草稿</option>
                <option value="active">進行中</option>
                <option value="paused">暫停</option>
                <option value="ended">已結束</option>
              </select>
              <select value={campaignTypeFilter} onChange={e => { setCampaignTypeFilter(e.target.value as 'all' | CampaignType); setCampaignPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部類型</option>
                <option value="充值">充值</option>
                <option value="任務">任務</option>
                <option value="推薦">推薦</option>
                <option value="觀看">觀看</option>
              </select>
              <button type="button" onClick={openNewCampaignDrawer}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500">
                <PlusCircle className="h-3 w-3" />新增活動
              </button>
            </div>
          </header>
          <div className="overflow-hidden rounded-xl border border-emerald-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-emerald-100">
                <tr>
                  {['活動 ID', '名稱', '類型', '受眾', 'Bonus 等級', '狀態', '時間範圍', '已發放', '操作'].map(h => (
                    <th key={h} className="border-b border-emerald-600/60 px-2 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.map(c => (
                  <tr key={c.id} className="border-b border-emerald-600/30 text-emerald-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-[10px] text-emerald-200/80">{c.id}</td>
                    <td className="px-2 py-1.5 font-medium">{c.name}</td>
                    <td className="px-2 py-1.5">{c.type}</td>
                    <td className="px-2 py-1.5">{audienceBadge(c.audience)}</td>
                    <td className="px-2 py-1.5">{TIER_LABELS[c.tierCode]}（{c.tierCode}）</td>
                    <td className="px-2 py-1.5">{statusBadge(c.status)}</td>
                    <td className="px-2 py-1.5 text-[10px] text-emerald-200/80">
                      <div>{c.startAt}</div>
                      <div>~ {c.endAt}</div>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">{c.issuedBonus.toLocaleString()}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => showAlert(`活動詳情：${c.name}\n規則：${c.rule}\n備註：${c.note ?? '—'}`)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-1.5 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700">
                          <Eye className="h-3 w-3" />詳情
                        </button>
                        <button type="button" onClick={() => handleToggleCampaignStatus(c)}
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${c.status === 'active' ? 'bg-amber-600/80 text-white hover:bg-amber-500' : 'bg-emerald-600/80 text-white hover:bg-emerald-500'}`}>
                          {c.status === 'active' ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                          {c.status === 'active' ? '下架' : '上架'}
                        </button>
                        <button type="button" onClick={() => handleCopyCampaign(c)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-slate-700/80 px-1.5 py-0.5 text-[10px] text-slate-100 hover:bg-slate-600">
                          <Copy className="h-3 w-3" />複製
                        </button>
                        <button type="button" onClick={() => handleIssueCampaignBonus(c)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-emerald-700/80 px-1.5 py-0.5 text-[10px] text-white hover:bg-emerald-600">
                          <Award className="h-3 w-3" />發獎
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedCampaigns.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-[11px] text-emerald-100/60">沒有符合條件的活動。</td></tr>
                )}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-emerald-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>共 {filteredCampaigns.length} 筆</div>
              <div className="flex items-center gap-1">
                <button type="button" disabled={campaignPage <= 1} onClick={() => setCampaignPage(p => p - 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40">
                  <ChevronLeft className="h-3 w-3" />上一頁
                </button>
                <span>第 {campaignPage} / {campaignTotalPages} 頁</span>
                <button type="button" disabled={campaignPage >= campaignTotalPages} onClick={() => setCampaignPage(p => p + 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40">
                  下一頁<ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* ── 優惠券 ─────────────────────────────────────────────────────────── */}
      {activeTab === 'coupons' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">優惠券管理</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full border border-amber-600/60 bg-slate-900/80 p-0.5 text-[10px]">
                {(['list', '券列表'] as const).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setCouponSubTab(id as CouponSubTab)}
                    className={['rounded-full px-2 py-0.5', couponSubTab === id ? 'bg-amber-600 text-white' : 'text-slate-200'].join(' ')}>
                    {label}
                  </button>
                ))}
                {(['usage', '使用記錄'] as const).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setCouponSubTab(id as CouponSubTab)}
                    className={['rounded-full px-2 py-0.5', couponSubTab === id ? 'bg-amber-600 text-white' : 'text-slate-200'].join(' ')}>
                    {label}
                  </button>
                ))}
              </div>
              {couponSubTab === 'list' && (
                <button type="button" onClick={openNewCouponDrawer}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-500">
                  <PlusCircle className="h-3 w-3" />新增優惠券
                </button>
              )}
            </div>
          </header>

          {couponSubTab === 'list' && (
            <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
              <table className="min-w-full border-collapse text-[11px]">
                <thead className="bg-slate-900/90 text-amber-100">
                  <tr>
                    {['券 ID', '名稱', '類型', '面額/折扣率', '使用門檻', '有效期', '已發/已用/剩餘', '狀態', '操作'].map(h => (
                      <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedCoupons.map(c => (
                    <tr key={c.id} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                      <td className="px-2 py-1.5 text-[10px] text-amber-200/80">{c.id}</td>
                      <td className="px-2 py-1.5 font-medium">{c.name}</td>
                      <td className="px-2 py-1.5">{c.type}</td>
                      <td className="px-2 py-1.5 tabular-nums">
                        {c.type === '折扣' ? `${Math.round((1 - c.discountRate) * 100)}% OFF` : `${c.faceValue} 元`}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums">≥ {c.minSpend}</td>
                      <td className="px-2 py-1.5 text-[10px] text-amber-200/80">
                        <div>{c.validFrom}</div><div>~ {c.validTo}</div>
                      </td>
                      <td className="px-2 py-1.5 tabular-nums text-[10px]">
                        <div>發：{c.totalIssued.toLocaleString()}</div>
                        <div>用：{c.totalUsed.toLocaleString()}</div>
                        <div>餘：{c.remaining.toLocaleString()}</div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${c.status === 'active' ? 'bg-emerald-500/30 text-emerald-50' : 'bg-slate-600/40 text-slate-300'}`}>
                          {c.status === 'active' ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => showAlert(`優惠券：${c.name}\n受眾：${c.audience}\n限領：${c.perUserLimit} 次\n場景：${c.scenes.join(', ')}`)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-1.5 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700">
                            <Eye className="h-3 w-3" />詳情
                          </button>
                          <button type="button" onClick={() => handleToggleCoupon(c)}
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${c.status === 'active' ? 'bg-rose-600/80 text-white hover:bg-rose-500' : 'bg-emerald-600/80 text-white hover:bg-emerald-500'}`}>
                            {c.status === 'active' ? '停用' : '啟用'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedCoupons.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-6 text-center text-[11px] text-amber-100/60">尚無優惠券。</td></tr>
                  )}
                </tbody>
              </table>
              <footer className="flex items-center justify-between border-t border-amber-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
                <div>共 {coupons.length} 筆</div>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={couponPage <= 1} onClick={() => setCouponPage(p => p - 1)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40">
                    <ChevronLeft className="h-3 w-3" />上一頁
                  </button>
                  <span>第 {couponPage} / {couponTotalPages} 頁</span>
                  <button type="button" disabled={couponPage >= couponTotalPages} onClick={() => setCouponPage(p => p + 1)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40">
                    下一頁<ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </footer>
            </div>
          )}

          {couponSubTab === 'usage' && (
            <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
              <table className="min-w-full border-collapse text-[11px]">
                <thead className="bg-slate-900/90 text-amber-100">
                  <tr>
                    {['記錄 ID', '用戶', '券 ID', '使用時間', '結果', '關聯訂單'].map(h => (
                      <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {couponUsage.map(u => (
                    <tr key={u.id} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                      <td className="px-2 py-1.5 text-[10px] text-amber-200/80">{u.id}</td>
                      <td className="px-2 py-1.5">{u.userId}</td>
                      <td className="px-2 py-1.5">{u.couponId}</td>
                      <td className="px-2 py-1.5">{u.usedAt}</td>
                      <td className="px-2 py-1.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${u.result === 'success' ? 'bg-emerald-500/30 text-emerald-50' : u.result === 'fail' ? 'bg-rose-500/30 text-rose-50' : 'bg-slate-600/40 text-slate-300'}`}>
                          {u.result === 'success' ? '成功' : u.result === 'fail' ? '失敗' : '撤銷'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">{u.refOrderId ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── 推薦分潤 ───────────────────────────────────────────────────────── */}
      {activeTab === 'referral' && (
        <section className="space-y-3 rounded-2xl border border-indigo-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold">推薦分潤</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full border border-indigo-600/60 bg-slate-900/80 p-0.5 text-[10px]">
                {([['schemes', '方案列表'], ['relations', '推薦關係查詢'], ['payouts', '分潤發放記錄']] as [ReferralSubTab, string][]).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setReferralSubTab(id)}
                    className={['rounded-full px-2 py-0.5', referralSubTab === id ? 'bg-indigo-600 text-white' : 'text-slate-200'].join(' ')}>
                    {label}
                  </button>
                ))}
              </div>
              {referralSubTab === 'schemes' && (
                <button type="button" onClick={openNewReferralDrawer}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500">
                  <PlusCircle className="h-3 w-3" />新增方案
                </button>
              )}
            </div>
          </header>

          {referralSubTab === 'schemes' && (
            <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
              <table className="min-w-full border-collapse text-[11px]">
                <thead className="bg-slate-900/90 text-indigo-100">
                  <tr>
                    {['方案 ID', '名稱', '觸發條件', '分潤類型', '比例', '狀態', '操作'].map(h => (
                      <th key={h} className="border-b border-indigo-600/60 px-2 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referralSchemes.map(s => (
                    <tr key={s.id} className="border-b border-indigo-600/30 text-indigo-50 last:border-b-0">
                      <td className="px-2 py-1.5 text-[10px] text-indigo-200/80">{s.id}</td>
                      <td className="px-2 py-1.5 font-medium">{s.name}</td>
                      <td className="px-2 py-1.5">{s.trigger}</td>
                      <td className="px-2 py-1.5">{s.payoutType}</td>
                      <td className="px-2 py-1.5 tabular-nums">
                        {s.payoutType === '百分比' ? `${s.ratio}%` : `${s.ratio} 元`}
                        <span className="text-[10px] text-indigo-200/60"> (上限 {s.capAmount})</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${s.status === 'active' ? 'bg-emerald-500/30 text-emerald-50' : 'bg-slate-600/40 text-slate-300'}`}>
                          {s.status === 'active' ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <button type="button" onClick={() => showAlert(`方案詳情：${s.name}\n生效：${s.validFrom} ~ ${s.validTo}`)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-1.5 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700">
                          <Eye className="h-3 w-3" />詳情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {referralSubTab === 'relations' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-indigo-600/50 bg-slate-900/80 p-3 text-[11px]">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <input value={referralSearch} onChange={e => setReferralSearch(e.target.value)}
                  placeholder="搜尋用戶 ID 或名稱…"
                  className="flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-500" />
              </div>
              <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
                <table className="min-w-full border-collapse text-[11px]">
                  <thead className="bg-slate-900/90 text-indigo-100">
                    <tr>
                      {['推薦人', '被推薦人', '建立時間', '已觸發事件', '已發分潤'].map(h => (
                        <th key={h} className="border-b border-indigo-600/60 px-2 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRelations.map(r => (
                      <tr key={r.id} className="border-b border-indigo-600/30 text-indigo-50 last:border-b-0">
                        <td className="px-2 py-1.5">{r.referrerName} <span className="text-[10px] text-indigo-200/60">#{r.referrerId}</span></td>
                        <td className="px-2 py-1.5">{r.refereeName} <span className="text-[10px] text-indigo-200/60">#{r.refereeId}</span></td>
                        <td className="px-2 py-1.5">{r.createdAt}</td>
                        <td className="px-2 py-1.5">{r.triggeredEvents}</td>
                        <td className="px-2 py-1.5 tabular-nums">{r.totalPayout.toLocaleString()}</td>
                      </tr>
                    ))}
                    {filteredRelations.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-[11px] text-indigo-100/60">查無推薦關係。</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {referralSubTab === 'payouts' && (
            <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
              <table className="min-w-full border-collapse text-[11px]">
                <thead className="bg-slate-900/90 text-indigo-100">
                  <tr>
                    {['記錄 ID', '推薦人', '被推薦人', '觸發事件', '分潤金額', '狀態', '時間'].map(h => (
                      <th key={h} className="border-b border-indigo-600/60 px-2 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referralPayouts.map(p => (
                    <tr key={p.id} className="border-b border-indigo-600/30 text-indigo-50 last:border-b-0">
                      <td className="px-2 py-1.5 text-[10px] text-indigo-200/80">{p.id}</td>
                      <td className="px-2 py-1.5">{p.referrerName} <span className="text-[10px] text-indigo-200/60">#{p.referrerId}</span></td>
                      <td className="px-2 py-1.5">{p.refereeName} <span className="text-[10px] text-indigo-200/60">#{p.refereeId}</span></td>
                      <td className="px-2 py-1.5">{p.triggerEvent}</td>
                      <td className="px-2 py-1.5 tabular-nums">{p.payoutAmount.toLocaleString()}</td>
                      <td className="px-2 py-1.5">{payoutStatusBadge(p.status)}</td>
                      <td className="px-2 py-1.5">{p.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── 分潤矩陣 ───────────────────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <section className="space-y-3 rounded-2xl border border-violet-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Grid3x3 className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-semibold">分潤矩陣配置</span>
              <span className="text-[10px] text-slate-500">行 = 推薦人等級 · 列 = 被推薦人等級</span>
            </div>
            <button type="button" onClick={handleSaveMatrix}
              className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-violet-500">
              <CheckCircle2 className="h-3 w-3" />儲存矩陣
            </button>
          </header>
          <div className="overflow-hidden rounded-xl border border-violet-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-violet-100">
                <tr>
                  <th className="border-b border-violet-600/60 px-3 py-2 text-left">推薦人 ╲ 被推薦人</th>
                  {REFERRAL_LEVELS.map(col => (
                    <th key={col} className="border-b border-violet-600/60 px-3 py-2 text-center">
                      {TIER_LABELS[col]}（{col}）
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REFERRAL_LEVELS.map(row => (
                  <tr key={row} className="border-b border-violet-600/30 text-violet-50 last:border-b-0">
                    <td className="px-3 py-2 font-medium">{TIER_LABELS[row]}（{row}）</td>
                    {REFERRAL_LEVELS.map(col => (
                      <td key={col} className="px-2 py-1.5 text-center">
                        <input
                          type="text"
                          value={matrix[row]?.[col] ?? '1.0'}
                          onChange={e => setMatrix(prev => ({
                            ...prev,
                            [row]: { ...prev[row], [col]: e.target.value },
                          }))}
                          className="w-16 rounded-md border border-violet-600/50 bg-violet-900/30 px-2 py-1 text-center text-[11px] text-violet-50 outline-none focus:border-violet-400"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-violet-600/40 bg-violet-900/10 p-3 text-[11px] text-violet-200/80 space-y-1">
            <div className="font-medium text-violet-100">說明</div>
            <ul className="list-disc space-y-0.5 pl-4 text-[10px]">
              <li>每格數值代表分潤倍率（如 2.0 表示被推薦人充值金額的 2.0% 或 2x 固定金額）。</li>
              <li>行為推薦人等級（GOLD 最高），列為被推薦人等級。</li>
              <li>建議推薦高等級用戶時給予更高倍率，以激勵質量推薦。</li>
              <li>儲存後建議同步後端配置並產出 Audit Log 供財務核對。</li>
            </ul>
          </div>
        </section>
      )}

      {/* ── 成長任務 ───────────────────────────────────────────────────────── */}
      {activeTab === 'tasks' && (
        <section className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">成長任務</span>
            </div>
            <button type="button" onClick={openNewTaskDrawer}
              className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-sky-500">
              <PlusCircle className="h-3 w-3" />新增任務
            </button>
          </header>
          <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-sky-100">
                <tr>
                  {['任務 ID', '名稱', '類型', '週期', '目標值', '獎勵 Bonus', '受眾', '狀態', '完成人數', '操作'].map(h => (
                    <th key={h} className="border-b border-sky-600/60 px-2 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map(t => (
                  <tr key={t.id} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-[10px] text-sky-200/80">{t.id}</td>
                    <td className="px-2 py-1.5 font-medium">{t.name}</td>
                    <td className="px-2 py-1.5">{t.type}</td>
                    <td className="px-2 py-1.5">{t.period}</td>
                    <td className="px-2 py-1.5 tabular-nums">{t.targetValue.toLocaleString()}</td>
                    <td className="px-2 py-1.5">
                      {TIER_LABELS[t.rewardTierCode]}（{t.rewardTierCode}） × {t.rewardAmount}
                    </td>
                    <td className="px-2 py-1.5">{audienceBadge(t.audience)}</td>
                    <td className="px-2 py-1.5">{statusBadge(t.status)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{t.completedCount.toLocaleString()}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => showAlert(`任務詳情：${t.name}\n說明：${t.desc ?? '—'}`)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-1.5 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700">
                          <Eye className="h-3 w-3" />詳情
                        </button>
                        <button type="button" onClick={() => handleToggleTask(t)}
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${t.status === 'active' ? 'bg-amber-600/80 text-white hover:bg-amber-500' : 'bg-sky-600/80 text-white hover:bg-sky-500'}`}>
                          {t.status === 'active' ? '下架' : '上架'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedTasks.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-6 text-center text-[11px] text-sky-100/60">尚無任務。</td></tr>
                )}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-sky-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>共 {growthTasks.length} 筆</div>
              <div className="flex items-center gap-1">
                <button type="button" disabled={taskPage <= 1} onClick={() => setTaskPage(p => p - 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40">
                  <ChevronLeft className="h-3 w-3" />上一頁
                </button>
                <span>第 {taskPage} / {taskTotalPages} 頁</span>
                <button type="button" disabled={taskPage >= taskTotalPages} onClick={() => setTaskPage(p => p + 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40">
                  下一頁<ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* ── 任務進度查詢 ───────────────────────────────────────────────────── */}
      {activeTab === 'progress' && (
        <section className="space-y-3 rounded-2xl border border-teal-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center gap-1.5 text-xs text-slate-200">
            <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
            <span className="font-semibold">任務進度查詢</span>
          </header>
          <div className="flex items-center gap-2 rounded-xl border border-teal-600/50 bg-slate-900/80 p-3 text-[11px]">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input value={progressUserId} onChange={e => setProgressUserId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQueryProgress()}
              placeholder="輸入用戶 ID…"
              className="flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-500" />
            <button type="button" onClick={handleQueryProgress}
              className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-teal-500">
              查詢
            </button>
          </div>
          {progressQueried && (
            <div className="overflow-hidden rounded-xl border border-teal-600/60 bg-slate-950/80">
              <table className="min-w-full border-collapse text-[11px]">
                <thead className="bg-slate-900/90 text-teal-100">
                  <tr>
                    {['任務名稱', '目標值', '當前進度', '狀態', '完成時間', '已獲獎勵'].map(h => (
                      <th key={h} className="border-b border-teal-600/60 px-2 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {progressResults.map((r, i) => (
                    <tr key={i} className="border-b border-teal-600/30 text-teal-50 last:border-b-0">
                      <td className="px-2 py-1.5 font-medium">{r.taskName}</td>
                      <td className="px-2 py-1.5 tabular-nums">{r.targetValue.toLocaleString()}</td>
                      <td className="px-2 py-1.5 tabular-nums">
                        {r.currentProgress.toLocaleString()}
                        <span className="text-[10px] text-teal-200/60"> ({Math.round((r.currentProgress / r.targetValue) * 100)}%)</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${
                          r.status === 'completed' ? 'bg-emerald-500/30 text-emerald-50' :
                          r.status === 'expired' ? 'bg-slate-600/40 text-slate-300' :
                          'bg-sky-500/30 text-sky-50'
                        }`}>
                          {r.status === 'completed' ? '已完成' : r.status === 'expired' ? '已過期' : '進行中'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">{r.completedAt ?? '—'}</td>
                      <td className="px-2 py-1.5 tabular-nums">{r.rewardEarned > 0 ? r.rewardEarned.toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                  {progressResults.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-[11px] text-teal-100/60">查無此用戶的任務進度。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!progressQueried && (
            <div className="rounded-xl border border-teal-600/40 bg-slate-900/60 p-6 text-center text-[11px] text-teal-200/60">
              請輸入用戶 ID 並點擊查詢。
            </div>
          )}
        </section>
      )}

      {/* ── 功能清單 ───────────────────────────────────────────────────────── */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="市場營銷功能清單"
          subtitle="活動 / 優惠券 / 推薦 / 任務四大模組一體化管理。"
          items={blueprintFeatures}
        />
      )}

      {/* ── Drawer: 活動新增/編輯 ──────────────────────────────────────────── */}
      {campaignDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-emerald-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-emerald-700/60 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-emerald-100">
                <Megaphone className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-semibold">{campaignDrawer.mode === 'new' ? '新增活動' : '編輯活動'}</span>
              </div>
              <button type="button" onClick={() => setCampaignDrawer(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-700/80 bg-slate-900/80 text-emerald-200 hover:text-emerald-100">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-emerald-50">
              <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleSaveCampaign() }}>
                <div className="space-y-1">
                  <label className="block text-emerald-100">活動名稱</label>
                  <input value={campaignDrawer.data.name}
                    onChange={e => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, name: e.target.value } } : prev)}
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="請輸入活動名稱" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-emerald-100">類型</label>
                    <select value={campaignDrawer.data.type}
                      onChange={e => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, type: e.target.value as CampaignType } } : prev)}
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400">
                      <option value="充值">充值</option>
                      <option value="任務">任務</option>
                      <option value="推薦">推薦</option>
                      <option value="觀看">觀看</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-emerald-100">Bonus 等級</label>
                    <select value={campaignDrawer.data.tierCode}
                      onChange={e => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, tierCode: e.target.value as BonusTierCode } } : prev)}
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400">
                      {BONUS_TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}（{t}）</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-emerald-100">受眾</label>
                  <div className="flex gap-2">
                    {(['Player', 'Broadcaster', '全部'] as CampaignAudience[]).map(a => (
                      <button key={a} type="button"
                        onClick={() => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, audience: a } } : prev)}
                        className={['flex-1 rounded-full px-2 py-1 text-[10px]', campaignDrawer.data.audience === a ? 'bg-emerald-600 text-white' : 'border border-emerald-700/80 bg-slate-900/80 text-emerald-100'].join(' ')}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-emerald-100">開始時間</label>
                    <input value={campaignDrawer.data.startAt}
                      onChange={e => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, startAt: e.target.value } } : prev)}
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="YYYY-MM-DD" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-emerald-100">結束時間</label>
                    <input value={campaignDrawer.data.endAt}
                      onChange={e => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, endAt: e.target.value } } : prev)}
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="YYYY-MM-DD" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-emerald-100">獎勵規則</label>
                  <textarea value={campaignDrawer.data.rule}
                    onChange={e => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, rule: e.target.value } } : prev)}
                    rows={3} className="w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="描述達成條件與獎勵規則…" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-emerald-100">預估人數</label>
                    <input value={campaignDrawer.data.estimatedCount}
                      onChange={e => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, estimatedCount: e.target.value } } : prev)}
                      inputMode="numeric" className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="例如：500" />
                    {campaignDrawer.data.estimatedCount && Number(campaignDrawer.data.estimatedCount) > 0 && (
                      <p className="text-[10px] text-emerald-200/70">
                        預估 Bonus 成本：{calcEstimatedCost(campaignDrawer.data.tierCode, Number(campaignDrawer.data.estimatedCount)).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-emerald-100">發放上限</label>
                    <input value={campaignDrawer.data.capAmount}
                      onChange={e => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, capAmount: e.target.value } } : prev)}
                      inputMode="numeric" className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="例如：50000" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-emerald-100">備註（選填）</label>
                  <input value={campaignDrawer.data.note}
                    onChange={e => setCampaignDrawer(prev => prev ? { ...prev, data: { ...prev.data, note: e.target.value } } : prev)}
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="備註說明" />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setCampaignDrawer(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-emerald-100 hover:bg-slate-800/80">取消</button>
                  <button type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500">儲存</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* ── Drawer: 優惠券新增 ─────────────────────────────────────────────── */}
      {couponDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-amber-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-amber-700/60 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <Ticket className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold">新增優惠券</span>
              </div>
              <button type="button" onClick={() => setCouponDrawer(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-700/80 bg-slate-900/80 text-amber-200 hover:text-amber-100">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-amber-50">
              <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleSaveCoupon() }}>
                <div className="space-y-1">
                  <label className="block text-amber-100">券名稱</label>
                  <input value={couponDrawer.name}
                    onChange={e => setCouponDrawer(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400"
                    placeholder="請輸入券名稱" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-amber-100">類型</label>
                    <select value={couponDrawer.type}
                      onChange={e => setCouponDrawer(prev => prev ? { ...prev, type: e.target.value as CouponType } : prev)}
                      className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400">
                      <option value="折扣">折扣率</option>
                      <option value="面額">固定面額</option>
                      <option value="免費">免費體驗</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    {couponDrawer.type === '折扣' ? (
                      <>
                        <label className="block text-amber-100">折扣率（0~1）</label>
                        <input value={couponDrawer.discountRate}
                          onChange={e => setCouponDrawer(prev => prev ? { ...prev, discountRate: e.target.value } : prev)}
                          inputMode="decimal" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400"
                          placeholder="例如：0.8 = 八折" />
                      </>
                    ) : (
                      <>
                        <label className="block text-amber-100">面額（元）</label>
                        <input value={couponDrawer.faceValue}
                          onChange={e => setCouponDrawer(prev => prev ? { ...prev, faceValue: e.target.value } : prev)}
                          inputMode="numeric" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400"
                          placeholder="例如：100" />
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-amber-100">使用門檻</label>
                    <input value={couponDrawer.minSpend}
                      onChange={e => setCouponDrawer(prev => prev ? { ...prev, minSpend: e.target.value } : prev)}
                      inputMode="numeric" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400"
                      placeholder="例如：200" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-amber-100">每人限領次數</label>
                    <input value={couponDrawer.perUserLimit}
                      onChange={e => setCouponDrawer(prev => prev ? { ...prev, perUserLimit: e.target.value } : prev)}
                      inputMode="numeric" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400"
                      placeholder="1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-amber-100">有效期起</label>
                    <input value={couponDrawer.validFrom}
                      onChange={e => setCouponDrawer(prev => prev ? { ...prev, validFrom: e.target.value } : prev)}
                      className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400"
                      placeholder="YYYY-MM-DD" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-amber-100">有效期訖</label>
                    <input value={couponDrawer.validTo}
                      onChange={e => setCouponDrawer(prev => prev ? { ...prev, validTo: e.target.value } : prev)}
                      className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400"
                      placeholder="YYYY-MM-DD" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-amber-100">總發行量</label>
                  <input value={couponDrawer.totalIssued}
                    onChange={e => setCouponDrawer(prev => prev ? { ...prev, totalIssued: e.target.value } : prev)}
                    inputMode="numeric" className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400"
                    placeholder="例如：1000" />
                </div>
                <div className="space-y-1">
                  <label className="block text-amber-100">適用場景（逗號分隔）</label>
                  <input value={couponDrawer.scenes}
                    onChange={e => setCouponDrawer(prev => prev ? { ...prev, scenes: e.target.value } : prev)}
                    className="h-7 w-full rounded-md border border-amber-700/80 bg-slate-950/80 px-2 text-[11px] text-amber-50 outline-none focus:border-amber-400"
                    placeholder="充值, 禮品兌換" />
                </div>
                <div className="space-y-1">
                  <label className="block text-amber-100">受眾</label>
                  <div className="flex gap-2">
                    {(['Player', 'Broadcaster', '全部'] as CampaignAudience[]).map(a => (
                      <button key={a} type="button"
                        onClick={() => setCouponDrawer(prev => prev ? { ...prev, audience: a } : prev)}
                        className={['flex-1 rounded-full px-2 py-1 text-[10px]', couponDrawer.audience === a ? 'bg-amber-600 text-white' : 'border border-amber-700/80 bg-slate-900/80 text-amber-100'].join(' ')}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setCouponDrawer(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-amber-100 hover:bg-slate-800/80">取消</button>
                  <button type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-amber-500">建立優惠券</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* ── Drawer: 推薦方案新增 ───────────────────────────────────────────── */}
      {referralDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-indigo-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-indigo-700/60 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-indigo-100">
                <Users className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-semibold">新增推薦方案</span>
              </div>
              <button type="button" onClick={() => setReferralDrawer(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-indigo-700/80 bg-slate-900/80 text-indigo-200 hover:text-indigo-100">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-indigo-50">
              <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleSaveReferralScheme() }}>
                <div className="space-y-1">
                  <label className="block text-indigo-100">方案名稱</label>
                  <input value={referralDrawer.name}
                    onChange={e => setReferralDrawer(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400"
                    placeholder="方案名稱" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-indigo-100">觸發條件</label>
                    <select value={referralDrawer.trigger}
                      onChange={e => setReferralDrawer(prev => prev ? { ...prev, trigger: e.target.value as ReferralTrigger } : prev)}
                      className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400">
                      <option value="註冊">註冊</option>
                      <option value="首充">首充</option>
                      <option value="任務達標">任務達標</option>
                      <option value="觀看達標">觀看達標</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-indigo-100">分潤類型</label>
                    <select value={referralDrawer.payoutType}
                      onChange={e => setReferralDrawer(prev => prev ? { ...prev, payoutType: e.target.value as ReferralPayoutType } : prev)}
                      className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400">
                      <option value="百分比">百分比</option>
                      <option value="固定金額">固定金額</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-indigo-100">{referralDrawer.payoutType === '百分比' ? '分潤比例 (%)' : '固定金額'}</label>
                    <input value={referralDrawer.ratio}
                      onChange={e => setReferralDrawer(prev => prev ? { ...prev, ratio: e.target.value } : prev)}
                      inputMode="decimal" className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400"
                      placeholder={referralDrawer.payoutType === '百分比' ? '例如：5' : '例如：100'} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-indigo-100">上限金額</label>
                    <input value={referralDrawer.capAmount}
                      onChange={e => setReferralDrawer(prev => prev ? { ...prev, capAmount: e.target.value } : prev)}
                      inputMode="numeric" className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400"
                      placeholder="例如：500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-indigo-100">生效起</label>
                    <input value={referralDrawer.validFrom}
                      onChange={e => setReferralDrawer(prev => prev ? { ...prev, validFrom: e.target.value } : prev)}
                      className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400"
                      placeholder="YYYY-MM-DD" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-indigo-100">生效訖</label>
                    <input value={referralDrawer.validTo}
                      onChange={e => setReferralDrawer(prev => prev ? { ...prev, validTo: e.target.value } : prev)}
                      className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400"
                      placeholder="YYYY-MM-DD" />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setReferralDrawer(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-indigo-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-indigo-100 hover:bg-slate-800/80">取消</button>
                  <button type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500">建立方案</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* ── Drawer: 成長任務新增/編輯 ─────────────────────────────────────── */}
      {taskDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-sky-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-sky-700/60 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-sky-100">
                <Target className="h-3.5 w-3.5 text-sky-400" />
                <span className="font-semibold">{taskDrawer.mode === 'new' ? '新增成長任務' : '編輯成長任務'}</span>
              </div>
              <button type="button" onClick={() => setTaskDrawer(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-700/80 bg-slate-900/80 text-sky-200 hover:text-sky-100">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-sky-50">
              <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleSaveTask() }}>
                <div className="space-y-1">
                  <label className="block text-sky-100">任務名稱</label>
                  <input value={taskDrawer.data.name}
                    onChange={e => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, name: e.target.value } } : prev)}
                    className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                    placeholder="任務名稱" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-sky-100">類型</label>
                    <select value={taskDrawer.data.type}
                      onChange={e => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, type: e.target.value as TaskType } } : prev)}
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400">
                      <option value="首充">首充</option>
                      <option value="連登">連登</option>
                      <option value="消費">消費</option>
                      <option value="觀看">觀看</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sky-100">週期</label>
                    <select value={taskDrawer.data.period}
                      onChange={e => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, period: e.target.value as TaskPeriod } } : prev)}
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400">
                      <option value="一次性">一次性</option>
                      <option value="每日">每日</option>
                      <option value="每週">每週</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sky-100">目標值</label>
                  <input value={taskDrawer.data.targetValue}
                    onChange={e => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, targetValue: e.target.value } } : prev)}
                    inputMode="numeric" className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                    placeholder="例如：7（天）或 500（元）" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-sky-100">獎勵 Bonus 等級</label>
                    <select value={taskDrawer.data.rewardTierCode}
                      onChange={e => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, rewardTierCode: e.target.value as BonusTierCode } } : prev)}
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400">
                      {BONUS_TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}（{t}）</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sky-100">獎勵數量</label>
                    <input value={taskDrawer.data.rewardAmount}
                      onChange={e => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, rewardAmount: e.target.value } } : prev)}
                      inputMode="numeric" className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="例如：100" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sky-100">受眾</label>
                  <div className="flex gap-2">
                    {(['Player', 'Broadcaster', '全部'] as CampaignAudience[]).map(a => (
                      <button key={a} type="button"
                        onClick={() => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, audience: a } } : prev)}
                        className={['flex-1 rounded-full px-2 py-1 text-[10px]', taskDrawer.data.audience === a ? 'bg-sky-600 text-white' : 'border border-sky-700/80 bg-slate-900/80 text-sky-100'].join(' ')}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-sky-100">開始日期</label>
                    <input value={taskDrawer.data.startAt}
                      onChange={e => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, startAt: e.target.value } } : prev)}
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="YYYY-MM-DD" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sky-100">結束日期</label>
                    <input value={taskDrawer.data.endAt}
                      onChange={e => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, endAt: e.target.value } } : prev)}
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="YYYY-MM-DD" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sky-100">說明（選填）</label>
                  <textarea value={taskDrawer.data.desc}
                    onChange={e => setTaskDrawer(prev => prev ? { ...prev, data: { ...prev.data, desc: e.target.value } } : prev)}
                    rows={3} className="w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                    placeholder="任務說明" />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setTaskDrawer(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-sky-100 hover:bg-slate-800/80">取消</button>
                  <button type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-sky-500">儲存</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default MarketingPage
