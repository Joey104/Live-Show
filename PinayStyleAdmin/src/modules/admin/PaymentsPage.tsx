/**
 * @file PaymentsPage.tsx
 * @description 支付管理工作台
 * 子模組：充值列表 / 第三方支付 / 匯款憑證審核 / 人工審核工作台 / 出金管理 / 手續費成本 / 交易對帳
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showAlert, showConfirm, showPrompt } from '../../lib/dialog'
import {
  CreditCard, ArrowDownCircle, ArrowUpCircle, Receipt, BarChart3,
  CheckCircle2, XCircle, AlertTriangle, Clock, Eye, PlusCircle,
  History, ChevronLeft, ChevronRight, FileDown, Search, Filter,
  RefreshCcw, Building2, Layers3, ListChecks, Wallet,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentsTabId =
  | 'overview' | 'deposits' | 'thirdparty' | 'transfer'
  | 'manual' | 'withdrawal' | 'fees' | 'reconciliation' | 'blueprint'

type DepositChannel = 'third_party' | 'transfer' | 'manual'
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected' | 'cancelled'
type ThirdPartyStatus = 'pending' | 'success' | 'failed' | 'timeout' | 'refunded'
type TransferStatus = 'pending' | 'verified' | 'rejected'
type ManualTaskStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled'
type ManualType = 'deposit' | 'withdrawal'
type WithdrawalStatus = 'submitted' | 'processing' | 'completed' | 'rejected' | 'cancelled'
type FeeType = '手續費' | '抽成' | '補貼'
type FeeDirection = '收取' | '退還'
type ReconciliationStatus = 'balanced' | 'diff' | 'pending'

interface DepositOrder {
  id: string; userId: string; username: string
  channel: DepositChannel; provider?: string
  amount: number; currency: string
  status: PaymentStatus; createdAt: string; processedAt?: string; processedBy?: string
  externalOrderId?: string; note?: string
}

interface ThirdPartyOrder {
  id: string; externalId: string; provider: string
  userId: string; username: string; amount: number
  status: ThirdPartyStatus; createdAt: string; syncedAt?: string; callbackAt?: string; note?: string
}

interface TransferReceipt {
  id: string; userId: string; username: string; amount: number
  bankName?: string; accountLast4?: string
  uploadedAt: string; status: TransferStatus
  reviewedAt?: string; reviewedBy?: string; proofFileName?: string; note?: string
}

interface ManualReviewTask {
  id: string; refId: string; userId: string; username: string
  type: ManualType; amount: number; status: ManualTaskStatus
  assignedTo?: string; createdAt: string; processedAt?: string; note?: string
}

interface WithdrawalRequest {
  id: string; userId: string; username: string
  amount: number; fee: number; net: number
  channel: 'Bank' | 'Crypto' | 'E-Wallet'
  status: WithdrawalStatus; createdAt: string; processedAt?: string; processedBy?: string; note?: string
}

interface FeeRecord {
  id: string; refId: string; refType: 'deposit' | 'withdrawal' | 'exchange'
  type: FeeType; amount: number; direction: FeeDirection
  userId: string; username: string; createdAt: string; note?: string
}

interface ReconciliationReport {
  id: string; period: string; channel: string
  totalOrders: number; matchedOrders: number; diffOrders: number
  totalAmount: number; diffAmount: number
  status: ReconciliationStatus; generatedAt: string; note?: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function ts(offsetHours = 0) {
  const d = new Date(Date.now() - offsetHours * 3_600_000)
  return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function mockDeposits(): DepositOrder[] {
  return [
    { id: 'DEP-001', userId: '10001', username: 'alice', channel: 'third_party', provider: 'Pay88', amount: 1000, currency: 'PHP', status: 'completed', createdAt: ts(72), processedAt: ts(71), processedBy: '系統', externalOrderId: 'PAY88-0301-001' },
    { id: 'DEP-002', userId: '10002', username: 'bob', channel: 'transfer', amount: 5000, currency: 'PHP', status: 'pending', createdAt: ts(48), note: '等待憑證核對' },
    { id: 'DEP-003', userId: '10003', username: 'carol', channel: 'manual', amount: 2000, currency: 'PHP', status: 'processing', createdAt: ts(24), processedBy: '財務 A' },
    { id: 'DEP-004', userId: '10005', username: 'ed', channel: 'third_party', provider: 'DragonPay', amount: 500, currency: 'PHP', status: 'failed', createdAt: ts(12), externalOrderId: 'DRP-0302-009', note: '支付超時' },
    { id: 'DEP-005', userId: '10004', username: 'dave', channel: 'transfer', amount: 3000, currency: 'PHP', status: 'completed', createdAt: ts(6), processedAt: ts(4), processedBy: '財務 B' },
    { id: 'DEP-006', userId: '10001', username: 'alice', channel: 'third_party', provider: 'Pay88', amount: 1500, currency: 'PHP', status: 'pending', createdAt: ts(2) },
  ]
}

function mockThirdParty(): ThirdPartyOrder[] {
  return [
    { id: 'TPO-001', externalId: 'PAY88-0301-001', provider: 'Pay88', userId: '10001', username: 'alice', amount: 1000, status: 'success', createdAt: ts(72), syncedAt: ts(71), callbackAt: ts(71) },
    { id: 'TPO-002', externalId: 'DRP-0302-009', provider: 'DragonPay', userId: '10005', username: 'ed', amount: 500, status: 'failed', createdAt: ts(12), syncedAt: ts(11), note: 'callback 未收到' },
    { id: 'TPO-003', externalId: 'PAY88-0303-041', provider: 'Pay88', userId: '10001', username: 'alice', amount: 1500, status: 'pending', createdAt: ts(2) },
    { id: 'TPO-004', externalId: 'GCASH-0303-007', provider: 'GCash', userId: '10006', username: 'frank', amount: 800, status: 'timeout', createdAt: ts(3), syncedAt: ts(2), note: '等待 GCash 狀態' },
  ]
}

function mockTransfer(): TransferReceipt[] {
  return [
    { id: 'TFR-001', userId: '10002', username: 'bob', amount: 5000, bankName: 'BDO Unibank', accountLast4: '8841', uploadedAt: ts(48), status: 'pending', proofFileName: 'proof_bob_20250301.jpg' },
    { id: 'TFR-002', userId: '10004', username: 'dave', amount: 3000, bankName: 'BPI', accountLast4: '2234', uploadedAt: ts(8), status: 'verified', reviewedAt: ts(4), reviewedBy: '財務 B', proofFileName: 'proof_dave_20250302.jpg' },
    { id: 'TFR-003', userId: '10007', username: 'grace', amount: 1200, bankName: 'Metrobank', accountLast4: '9901', uploadedAt: ts(1), status: 'pending', proofFileName: 'proof_grace_20250303.jpg' },
  ]
}

function mockManual(): ManualReviewTask[] {
  return [
    { id: 'MR-001', refId: 'DEP-003', userId: '10003', username: 'carol', type: 'deposit', amount: 2000, status: 'processing', assignedTo: '財務 A', createdAt: ts(24) },
    { id: 'MR-002', refId: 'WDL-003', userId: '10002', username: 'bob', type: 'withdrawal', amount: 1500, status: 'pending', createdAt: ts(6) },
    { id: 'MR-003', refId: 'DEP-006', userId: '10001', username: 'alice', type: 'deposit', amount: 1500, status: 'pending', createdAt: ts(2) },
    { id: 'MR-004', refId: 'WDL-002', userId: '10004', username: 'dave', type: 'withdrawal', amount: 800, status: 'approved', assignedTo: '財務 B', createdAt: ts(10), processedAt: ts(8) },
  ]
}

function mockWithdrawals(): WithdrawalRequest[] {
  return [
    { id: 'WDL-003', userId: '10002', username: 'bob', amount: 1500, fee: 45, net: 1455, channel: 'Bank', status: 'submitted', createdAt: ts(6), note: 'BDO ****8841' },
    { id: 'WDL-002', userId: '10004', username: 'dave', amount: 800, fee: 24, net: 776, channel: 'E-Wallet', status: 'completed', createdAt: ts(36), processedAt: ts(10), processedBy: '財務 B' },
    { id: 'WDL-001', userId: '10005', username: 'ed', amount: 3000, fee: 90, net: 2910, channel: 'Bank', status: 'processing', createdAt: ts(48), processedBy: '財務 A' },
    { id: 'WDL-004', userId: '10001', username: 'alice', amount: 500, fee: 15, net: 485, channel: 'Crypto', status: 'rejected', createdAt: ts(72), processedAt: ts(60), note: '地址驗證失敗' },
  ]
}

function mockFees(): FeeRecord[] {
  return [
    { id: 'FEE-001', refId: 'DEP-001', refType: 'deposit', type: '手續費', amount: 30, direction: '收取', userId: '10001', username: 'alice', createdAt: ts(71), note: 'Pay88 充值 3%' },
    { id: 'FEE-002', refId: 'WDL-002', refType: 'withdrawal', type: '手續費', amount: 24, direction: '收取', userId: '10004', username: 'dave', createdAt: ts(10), note: '出金手續費 3%' },
    { id: 'FEE-003', refId: 'DEP-005', refType: 'deposit', type: '手續費', amount: 90, direction: '收取', userId: '10004', username: 'dave', createdAt: ts(4), note: '轉帳充值 3%' },
    { id: 'FEE-004', refId: 'DEP-001', refType: 'deposit', type: '補貼', amount: 10, direction: '退還', userId: '10001', username: 'alice', createdAt: ts(70), note: '首次充值補貼 10 PHP' },
    { id: 'FEE-005', refId: 'WDL-001', refType: 'withdrawal', type: '手續費', amount: 90, direction: '收取', userId: '10005', username: 'ed', createdAt: ts(47), note: '出金手續費 3%' },
    { id: 'FEE-006', refId: 'DEP-006', refType: 'deposit', type: '抽成', amount: 15, direction: '收取', userId: '10001', username: 'alice', createdAt: ts(2), note: '渠道抽成 1%' },
  ]
}

function mockReconciliations(): ReconciliationReport[] {
  return [
    { id: 'RCN-001', period: '2025-03-01', channel: 'Pay88', totalOrders: 42, matchedOrders: 42, diffOrders: 0, totalAmount: 58400, diffAmount: 0, status: 'balanced', generatedAt: ts(48), note: '完全吻合，無差異。' },
    { id: 'RCN-002', period: '2025-03-02', channel: 'DragonPay', totalOrders: 18, matchedOrders: 16, diffOrders: 2, totalAmount: 22800, diffAmount: -800, status: 'diff', generatedAt: ts(24), note: '2 筆 callback 未收到，需人工確認。' },
    { id: 'RCN-003', period: '2025-03-03', channel: '銀行轉帳', totalOrders: 7, matchedOrders: 5, diffOrders: 2, totalAmount: 14500, diffAmount: -6200, status: 'diff', generatedAt: ts(2), note: '2 筆憑證審核中，暫標差異。' },
    { id: 'RCN-004', period: '2025-03-03', channel: 'GCash', totalOrders: 0, matchedOrders: 0, diffOrders: 0, totalAmount: 0, diffAmount: 0, status: 'pending', generatedAt: ts(1), note: '報表產生中。' },
  ]
}

// ─── Label / badge helpers ────────────────────────────────────────────────────

const chLabel = (ch: DepositChannel) =>
  ch === 'third_party' ? '第三方' : ch === 'transfer' ? '銀行轉帳' : '人工入帳'

const psLabel: Record<PaymentStatus, string> = {
  pending: '待處理', processing: '處理中', completed: '已完成', failed: '失敗', rejected: '已拒絕', cancelled: '已取消',
}
const tpLabel: Record<ThirdPartyStatus, string> = {
  pending: '待確認', success: '成功', failed: '失敗', timeout: '超時', refunded: '已退款',
}
const trLabel: Record<TransferStatus, string> = { pending: '待審核', verified: '已核准', rejected: '已拒絕' }
const mrLabel: Record<ManualTaskStatus, string> = {
  pending: '待審核', processing: '處理中', approved: '已核准', rejected: '已拒絕', cancelled: '已取消',
}
const wdlLabel: Record<WithdrawalStatus, string> = {
  submitted: '已提交', processing: '處理中', completed: '已完成', rejected: '已拒絕', cancelled: '已取消',
}
const rcnLabel: Record<ReconciliationStatus, string> = { balanced: '✓ 吻合', diff: '⚠ 有差異', pending: '產生中' }

const psBadge: Record<PaymentStatus, string> = {
  pending: 'bg-amber-500/30 text-amber-50', processing: 'bg-sky-500/30 text-sky-50',
  completed: 'bg-emerald-500/30 text-emerald-50', failed: 'bg-rose-500/40 text-rose-50',
  rejected: 'bg-rose-500/40 text-rose-50', cancelled: 'bg-slate-600/40 text-slate-100',
}
const tpBadge: Record<ThirdPartyStatus, string> = {
  pending: 'bg-amber-500/30 text-amber-50', success: 'bg-emerald-500/30 text-emerald-50',
  failed: 'bg-rose-500/40 text-rose-50', timeout: 'bg-orange-500/30 text-orange-50',
  refunded: 'bg-slate-600/40 text-slate-100',
}
const trBadge: Record<TransferStatus, string> = {
  pending: 'bg-amber-500/30 text-amber-50', verified: 'bg-emerald-500/30 text-emerald-50', rejected: 'bg-rose-500/40 text-rose-50',
}
const mrBadge: Record<ManualTaskStatus, string> = {
  pending: 'bg-amber-500/30 text-amber-50', processing: 'bg-sky-500/30 text-sky-50',
  approved: 'bg-emerald-500/30 text-emerald-50', rejected: 'bg-rose-500/40 text-rose-50',
  cancelled: 'bg-slate-600/40 text-slate-100',
}
const wdlBadge: Record<WithdrawalStatus, string> = {
  submitted: 'bg-amber-500/30 text-amber-50', processing: 'bg-sky-500/30 text-sky-50',
  completed: 'bg-emerald-500/30 text-emerald-50', rejected: 'bg-rose-500/40 text-rose-50',
  cancelled: 'bg-slate-600/40 text-slate-100',
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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
          className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">
          <ChevronLeft className="h-3 w-3" /> {t('common.prevPage')}
        </button>
        <span>{t('common.pageOf', { page, total: totalPages })}</span>
        <button type="button" disabled={page >= totalPages} onClick={onNext}
          className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">
          {t('common.nextPage')} <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </footer>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PaymentsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<PaymentsTabId>('overview')

  // Data
  const [deposits, setDeposits] = useState<DepositOrder[]>(mockDeposits)
  const [thirdPartyOrders, setThirdPartyOrders] = useState<ThirdPartyOrder[]>(mockThirdParty)
  const [transferReceipts, setTransferReceipts] = useState<TransferReceipt[]>(mockTransfer)
  const [manualTasks, setManualTasks] = useState<ManualReviewTask[]>(mockManual)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(mockWithdrawals)
  const [feeRecords] = useState<FeeRecord[]>(mockFees)
  const [reconciliations, setReconciliations] = useState<ReconciliationReport[]>(mockReconciliations)

  // Pagination
  const PS = 5
  const [depPage, setDepPage] = useState(1)
  const [tpPage, setTpPage] = useState(1)
  const [trPage, setTrPage] = useState(1)
  const [mrPage, setMrPage] = useState(1)
  const [wdlPage, setWdlPage] = useState(1)
  const [feePage, setFeePage] = useState(1)

  // Filters
  const [depStatusF, setDepStatusF] = useState<'all' | PaymentStatus>('all')
  const [depChannelF, setDepChannelF] = useState<'all' | DepositChannel>('all')
  const [depKeyword, setDepKeyword] = useState('')
  const [tpStatusF, setTpStatusF] = useState<'all' | ThirdPartyStatus>('all')
  const [tpProviderF, setTpProviderF] = useState('all')
  const [trStatusF, setTrStatusF] = useState<'all' | TransferStatus>('all')
  const [mrStatusF, setMrStatusF] = useState<'all' | ManualTaskStatus>('all')
  const [mrTypeF, setMrTypeF] = useState<'all' | ManualType>('all')
  const [wdlStatusF, setWdlStatusF] = useState<'all' | WithdrawalStatus>('all')
  const [wdlChannelF, setWdlChannelF] = useState('all')
  const [feeTypeF, setFeeTypeF] = useState<'all' | FeeType>('all')
  const [feeDirF, setFeeDirF] = useState<'all' | FeeDirection>('all')

  // Drawers
  const [selectedDep, setSelectedDep] = useState<DepositOrder | null>(null)
  const [newDepForm, setNewDepForm] = useState<{ userId: string; username: string; amount: string; note: string } | null>(null)
  const [selectedTp, setSelectedTp] = useState<ThirdPartyOrder | null>(null)
  const [selectedTr, setSelectedTr] = useState<TransferReceipt | null>(null)
  const [selectedMr, setSelectedMr] = useState<ManualReviewTask | null>(null)
  const [selectedWdl, setSelectedWdl] = useState<WithdrawalRequest | null>(null)
  const [rcnForm, setRcnForm] = useState<{ period: string; channel: string } | null>(null)

  // Computed
  const overview = useMemo(() => ({
    totalDeposited: deposits.filter(d => d.status === 'completed').reduce((s, d) => s + d.amount, 0),
    totalWithdrawn: withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + w.net, 0),
    pendingReviews: manualTasks.filter(m => m.status === 'pending' || m.status === 'processing').length,
    feeCollected: feeRecords.filter(f => f.direction === '收取').reduce((s, f) => s + f.amount, 0),
    subsidies: feeRecords.filter(f => f.direction === '退還').reduce((s, f) => s + f.amount, 0),
    diffRcn: reconciliations.filter(r => r.status === 'diff').length,
  }), [deposits, withdrawals, manualTasks, feeRecords, reconciliations])

  const filteredDep = useMemo(() => deposits.filter(d => {
    if (depStatusF !== 'all' && d.status !== depStatusF) return false
    if (depChannelF !== 'all' && d.channel !== depChannelF) return false
    if (depKeyword) {
      const t = `${d.id} ${d.userId} ${d.username} ${d.externalOrderId ?? ''} ${d.note ?? ''}`.toLowerCase()
      if (!t.includes(depKeyword.toLowerCase())) return false
    }
    return true
  }), [deposits, depStatusF, depChannelF, depKeyword])

  const filteredTp = useMemo(() => thirdPartyOrders.filter(o => {
    if (tpStatusF !== 'all' && o.status !== tpStatusF) return false
    if (tpProviderF !== 'all' && o.provider !== tpProviderF) return false
    return true
  }), [thirdPartyOrders, tpStatusF, tpProviderF])

  const filteredTr = useMemo(() =>
    trStatusF === 'all' ? transferReceipts : transferReceipts.filter(r => r.status === trStatusF),
    [transferReceipts, trStatusF])

  const filteredMr = useMemo(() => manualTasks.filter(m => {
    if (mrStatusF !== 'all' && m.status !== mrStatusF) return false
    if (mrTypeF !== 'all' && m.type !== mrTypeF) return false
    return true
  }), [manualTasks, mrStatusF, mrTypeF])

  const filteredWdl = useMemo(() => withdrawals.filter(w => {
    if (wdlStatusF !== 'all' && w.status !== wdlStatusF) return false
    if (wdlChannelF !== 'all' && w.channel !== wdlChannelF) return false
    return true
  }), [withdrawals, wdlStatusF, wdlChannelF])

  const filteredFee = useMemo(() => feeRecords.filter(f => {
    if (feeTypeF !== 'all' && f.type !== feeTypeF) return false
    if (feeDirF !== 'all' && f.direction !== feeDirF) return false
    return true
  }), [feeRecords, feeTypeF, feeDirF])

  const tpProviders = useMemo(() => [...new Set(thirdPartyOrders.map(o => o.provider))], [thirdPartyOrders])

  const pagedDep = filteredDep.slice((depPage - 1) * PS, depPage * PS)
  const pagedTp = filteredTp.slice((tpPage - 1) * PS, tpPage * PS)
  const pagedTr = filteredTr.slice((trPage - 1) * PS, trPage * PS)
  const pagedMr = filteredMr.slice((mrPage - 1) * PS, mrPage * PS)
  const pagedWdl = filteredWdl.slice((wdlPage - 1) * PS, wdlPage * PS)
  const pagedFee = filteredFee.slice((feePage - 1) * PS, feePage * PS)

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function approveDeposit(d: DepositOrder) {
    const ok = await showConfirm(
      `確認核准充值訂單 ${d.id}？\n用戶：${d.username}（ID: ${d.userId}）\n金額：${d.amount.toLocaleString()} ${d.currency}\n渠道：${chLabel(d.channel)}`
    )
    if (!ok) return
    const now = ts()
    setDeposits(prev => prev.map(x => x.id === d.id ? { ...x, status: 'completed', processedAt: now, processedBy: 'Demo Admin' } : x))
    setSelectedDep(null)
  }

  async function rejectDeposit(d: DepositOrder) {
    const reason = await showPrompt(`請輸入拒絕訂單 ${d.id} 的原因：`)
    if (reason === null) return
    const now = ts()
    setDeposits(prev => prev.map(x => x.id === d.id ? { ...x, status: 'rejected', processedAt: now, processedBy: 'Demo Admin', note: reason || x.note } : x))
    setSelectedDep(null)
  }

  async function submitNewDeposit() {
    if (!newDepForm) return
    if (!newDepForm.userId.trim()) { await showAlert('請填寫「用戶 ID」。'); return }
    if (!newDepForm.username.trim()) { await showAlert('請填寫「用戶名稱」。'); return }
    const amt = Number(newDepForm.amount)
    if (!amt || amt <= 0 || isNaN(amt)) { await showAlert('請輸入大於 0 的充值金額。'); return }
    const now = ts()
    const dep: DepositOrder = {
      id: `DEP-${Date.now()}`, userId: newDepForm.userId.trim(), username: newDepForm.username.trim(),
      channel: 'manual', amount: amt, currency: 'PHP', status: 'pending', createdAt: now,
      note: newDepForm.note.trim() || undefined,
    }
    setDeposits(prev => [dep, ...prev])
    setManualTasks(prev => [{
      id: `MR-${Date.now()}`, refId: dep.id, userId: dep.userId, username: dep.username,
      type: 'deposit', amount: amt, status: 'pending', createdAt: now, note: dep.note,
    }, ...prev])
    setNewDepForm(null)
    await showAlert(`已建立人工入帳訂單 ${dep.id}，已同步至人工審核工作台。`)
  }

  async function resyncThirdParty(o: ThirdPartyOrder) {
    const ok = await showConfirm(`確認重新同步訂單 ${o.externalId}（${o.provider}）？\n示意：向第三方 API 補查最新狀態。`)
    if (!ok) return
    const now = ts()
    setThirdPartyOrders(prev => prev.map(x => x.id === o.id
      ? { ...x, syncedAt: now, status: x.status === 'timeout' ? 'pending' : x.status, note: `觸發補查（${now}）` }
      : x))
    setSelectedTp(null)
    await showAlert(`已送出重新同步請求（示意）。訂單 ${o.externalId} 狀態更新中。`)
  }

  async function verifyTransfer(r: TransferReceipt) {
    const ok = await showConfirm(
      `確認核准匯款憑證 ${r.id}？\n用戶：${r.username}（ID: ${r.userId}）\n金額：${r.amount.toLocaleString()} PHP\n銀行：${r.bankName ?? '—'} ****${r.accountLast4 ?? '——'}`
    )
    if (!ok) return
    const now = ts()
    setTransferReceipts(prev => prev.map(x => x.id === r.id ? { ...x, status: 'verified', reviewedAt: now, reviewedBy: 'Demo Admin' } : x))
    setDeposits(prev => prev.map(d =>
      d.userId === r.userId && d.channel === 'transfer' && d.status === 'pending'
        ? { ...d, status: 'completed', processedAt: now, processedBy: 'Demo Admin' } : d))
    setSelectedTr(null)
    await showAlert(`已核准憑證 ${r.id}，對應充值訂單已更新為「已完成」。`)
  }

  async function rejectTransfer(r: TransferReceipt) {
    const reason = await showPrompt(`請輸入拒絕憑證 ${r.id} 的原因：`, '憑證金額或帳號不符')
    if (reason === null) return
    const now = ts()
    setTransferReceipts(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected', reviewedAt: now, reviewedBy: 'Demo Admin', note: reason || x.note } : x))
    setSelectedTr(null)
  }

  async function approveManual(m: ManualReviewTask) {
    const ok = await showConfirm(
      `確認核准人工審核任務 ${m.id}？\n類型：${m.type === 'deposit' ? '充值入帳' : '出金撥款'}\n用戶：${m.username}（ID: ${m.userId}）\n金額：${m.amount.toLocaleString()} PHP`
    )
    if (!ok) return
    const now = ts()
    setManualTasks(prev => prev.map(x => x.id === m.id ? { ...x, status: 'approved', processedAt: now } : x))
    if (m.type === 'deposit') setDeposits(prev => prev.map(d => d.id === m.refId ? { ...d, status: 'completed', processedAt: now, processedBy: 'Demo Admin' } : d))
    else setWithdrawals(prev => prev.map(w => w.id === m.refId ? { ...w, status: 'completed', processedAt: now, processedBy: 'Demo Admin' } : w))
    setSelectedMr(null)
  }

  async function rejectManual(m: ManualReviewTask) {
    const reason = await showPrompt(`請輸入拒絕任務 ${m.id} 的原因：`)
    if (reason === null) return
    const now = ts()
    setManualTasks(prev => prev.map(x => x.id === m.id ? { ...x, status: 'rejected', processedAt: now, note: reason || x.note } : x))
    setSelectedMr(null)
  }

  async function assignManual(m: ManualReviewTask) {
    const assignee = await showPrompt('請輸入指派的審核人員名稱：', m.assignedTo ?? '')
    if (assignee === null) return
    setManualTasks(prev => prev.map(x => x.id === m.id
      ? { ...x, assignedTo: assignee.trim() || undefined, status: x.status === 'pending' ? 'processing' : x.status }
      : x))
  }

  async function processWithdrawal(w: WithdrawalRequest) {
    const ok = await showConfirm(
      `確認將出金申請 ${w.id} 標記為「處理中」？\n用戶：${w.username}（ID: ${w.userId}）\n實際撥款：${w.net.toLocaleString()} PHP（手續費 ${w.fee} PHP）`
    )
    if (!ok) return
    const now = ts()
    setWithdrawals(prev => prev.map(x => x.id === w.id ? { ...x, status: 'processing', processedBy: 'Demo Admin' } : x))
    setManualTasks(prev => {
      if (prev.some(m => m.refId === w.id)) return prev.map(m => m.refId === w.id ? { ...m, status: 'processing' } : m)
      return [{ id: `MR-${Date.now()}`, refId: w.id, userId: w.userId, username: w.username, type: 'withdrawal' as ManualType, amount: w.amount, status: 'processing' as ManualTaskStatus, createdAt: now }, ...prev]
    })
    setSelectedWdl(null)
  }

  async function approveWithdrawal(w: WithdrawalRequest) {
    const ok = await showConfirm(
      `確認核准出金申請 ${w.id}？\n用戶：${w.username}（ID: ${w.userId}）\n實際撥款：${w.net.toLocaleString()} PHP\n渠道：${w.channel}`
    )
    if (!ok) return
    const now = ts()
    setWithdrawals(prev => prev.map(x => x.id === w.id ? { ...x, status: 'completed', processedAt: now, processedBy: 'Demo Admin' } : x))
    setManualTasks(prev => prev.map(m => m.refId === w.id ? { ...m, status: 'approved', processedAt: now } : m))
    setSelectedWdl(null)
    await showAlert(`已核准出金申請 ${w.id}，撥款 ${w.net.toLocaleString()} PHP 已完成（示意）。`)
  }

  async function rejectWithdrawal(w: WithdrawalRequest) {
    const reason = await showPrompt(`請輸入拒絕出金申請 ${w.id} 的原因：`)
    if (reason === null) return
    const now = ts()
    setWithdrawals(prev => prev.map(x => x.id === w.id ? { ...x, status: 'rejected', processedAt: now, processedBy: 'Demo Admin', note: reason || x.note } : x))
    setManualTasks(prev => prev.map(m => m.refId === w.id ? { ...m, status: 'rejected', processedAt: now } : m))
    setSelectedWdl(null)
  }

  async function generateReconciliation() {
    if (!rcnForm) return
    if (!rcnForm.period.trim()) { await showAlert('請填寫「對帳日期」。'); return }
    if (!rcnForm.channel.trim()) { await showAlert('請填寫「支付渠道」。'); return }
    const exists = reconciliations.find(r => r.period === rcnForm.period.trim() && r.channel === rcnForm.channel.trim())
    if (exists) { await showAlert(`對帳報表「${rcnForm.period}・${rcnForm.channel}」已存在，請選擇其他日期或渠道。`); return }
    const now = ts()
    const rep: ReconciliationReport = {
      id: `RCN-${Date.now()}`, period: rcnForm.period.trim(), channel: rcnForm.channel.trim(),
      totalOrders: 0, matchedOrders: 0, diffOrders: 0, totalAmount: 0, diffAmount: 0,
      status: 'pending', generatedAt: now, note: '報表產生中，請稍後刷新。',
    }
    setReconciliations(prev => [rep, ...prev])
    setRcnForm(null)
    await showAlert(`已建立對帳報表（${rep.period}・${rep.channel}），正式環境將排程後端批次比對後更新結果。`)
  }

  // ─── Drawer: 充值訂單詳情 ──────────────────────────────────────────────────
  const DepositDrawer = selectedDep ? (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-sky-700/70 bg-slate-950/95">
        <header className="flex items-center justify-between border-b border-sky-700/60 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-sky-100">
              <ArrowDownCircle className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">充值訂單詳情</span>
            </div>
            <p className="mt-0.5 text-[11px] text-sky-200/80">{selectedDep.id} · {selectedDep.username}</p>
          </div>
          <button onClick={() => setSelectedDep(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-700/80 bg-slate-900/80 text-sky-200 hover:border-sky-400">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-4 py-3 text-[12px] text-sky-50 space-y-2">
          <div className="space-y-1.5 rounded-xl border border-sky-700/60 bg-slate-900/80 p-3">
            <div className="flex justify-between"><span className="text-sky-200/70">訂單 ID</span><span className="font-medium">{selectedDep.id}</span></div>
            <div className="flex justify-between"><span className="text-sky-200/70">用戶</span><span>{selectedDep.username}（ID: {selectedDep.userId}）</span></div>
            <div className="flex justify-between"><span className="text-sky-200/70">金額</span><span className="font-semibold text-emerald-200">{selectedDep.amount.toLocaleString()} {selectedDep.currency}</span></div>
            <div className="flex justify-between"><span className="text-sky-200/70">渠道</span><span>{chLabel(selectedDep.channel)}{selectedDep.provider ? ` · ${selectedDep.provider}` : ''}</span></div>
            {selectedDep.externalOrderId && <div className="flex justify-between"><span className="text-sky-200/70">外部訂單</span><span className="text-[11px]">{selectedDep.externalOrderId}</span></div>}
            <div className="flex justify-between"><span className="text-sky-200/70">狀態</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${psBadge[selectedDep.status]}`}>{psLabel[selectedDep.status]}</span></div>
            <div className="flex justify-between"><span className="text-sky-200/70">建立時間</span><span>{selectedDep.createdAt}</span></div>
            {selectedDep.processedAt && <div className="flex justify-between"><span className="text-sky-200/70">處理時間</span><span>{selectedDep.processedAt}</span></div>}
            {selectedDep.processedBy && <div className="flex justify-between"><span className="text-sky-200/70">處理人員</span><span>{selectedDep.processedBy}</span></div>}
            {selectedDep.note && <div className="text-[11px] text-sky-200/70">備註：{selectedDep.note}</div>}
          </div>
          {(selectedDep.status === 'pending' || selectedDep.status === 'processing') && (
            <div className="flex flex-col gap-2">
              <button onClick={() => approveDeposit(selectedDep)} className="rounded-full bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500">
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />核准入帳
              </button>
              <button onClick={() => rejectDeposit(selectedDep)} className="rounded-full bg-rose-600 px-3 py-2 text-white hover:bg-rose-500">
                <XCircle className="inline h-3.5 w-3.5 mr-1" />拒絕訂單
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  ) : null

  // ─── Drawer: 第三方訂單詳情 ────────────────────────────────────────────────
  const ThirdPartyDrawer = selectedTp ? (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-indigo-700/70 bg-slate-950/95">
        <header className="flex items-center justify-between border-b border-indigo-700/60 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-100">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold">第三方支付詳情</span>
            </div>
            <p className="mt-0.5 text-[11px] text-indigo-200/80">{selectedTp.externalId} · {selectedTp.provider}</p>
          </div>
          <button onClick={() => setSelectedTp(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-indigo-700/80 bg-slate-900/80 text-indigo-200 hover:border-indigo-400">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-4 py-3 text-[12px] text-indigo-50 space-y-2">
          <div className="space-y-1.5 rounded-xl border border-indigo-700/60 bg-slate-900/80 p-3">
            <div className="flex justify-between"><span className="text-indigo-200/70">外部訂單 ID</span><span className="text-[11px] font-medium">{selectedTp.externalId}</span></div>
            <div className="flex justify-between"><span className="text-indigo-200/70">支付商</span><span>{selectedTp.provider}</span></div>
            <div className="flex justify-between"><span className="text-indigo-200/70">用戶</span><span>{selectedTp.username}（ID: {selectedTp.userId}）</span></div>
            <div className="flex justify-between"><span className="text-indigo-200/70">金額</span><span className="font-semibold text-emerald-200">{selectedTp.amount.toLocaleString()} PHP</span></div>
            <div className="flex justify-between"><span className="text-indigo-200/70">狀態</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${tpBadge[selectedTp.status]}`}>{tpLabel[selectedTp.status]}</span></div>
            <div className="flex justify-between"><span className="text-indigo-200/70">建立時間</span><span>{selectedTp.createdAt}</span></div>
            {selectedTp.syncedAt && <div className="flex justify-between"><span className="text-indigo-200/70">最後同步</span><span>{selectedTp.syncedAt}</span></div>}
            {selectedTp.callbackAt && <div className="flex justify-between"><span className="text-indigo-200/70">收到 callback</span><span>{selectedTp.callbackAt}</span></div>}
            {selectedTp.note && <div className="text-[11px] text-indigo-200/70">備註：{selectedTp.note}</div>}
          </div>
          {(selectedTp.status === 'pending' || selectedTp.status === 'timeout' || selectedTp.status === 'failed') && (
            <button onClick={() => resyncThirdParty(selectedTp)} className="w-full rounded-full bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500">
              <RefreshCcw className="inline h-3.5 w-3.5 mr-1" />補查 / 重新同步
            </button>
          )}
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 text-[10px] text-slate-400">
            <div className="mb-1 font-semibold text-slate-300">狀態流轉說明</div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>pending → 已送出付款請求，等待第三方 callback</li>
              <li>success → 已收到成功 callback，資金入帳</li>
              <li>failed → 付款失敗，可手動補查</li>
              <li>timeout → 超時未收到 callback，需補查後人工確認</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  ) : null

  // ─── Drawer: 匯款憑證詳情 ──────────────────────────────────────────────────
  const TransferDrawer = selectedTr ? (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-amber-700/70 bg-slate-950/95">
        <header className="flex items-center justify-between border-b border-amber-700/60 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-100">
              <FileDown className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">匯款憑證審核</span>
            </div>
            <p className="mt-0.5 text-[11px] text-amber-200/80">{selectedTr.id} · {selectedTr.username}</p>
          </div>
          <button onClick={() => setSelectedTr(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-700/80 bg-slate-900/80 text-amber-200 hover:border-amber-400">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-4 py-3 text-[12px] text-amber-50 space-y-2">
          <div className="space-y-1.5 rounded-xl border border-amber-700/60 bg-slate-900/80 p-3">
            <div className="flex justify-between"><span className="text-amber-200/70">憑證 ID</span><span className="font-medium">{selectedTr.id}</span></div>
            <div className="flex justify-between"><span className="text-amber-200/70">用戶</span><span>{selectedTr.username}（ID: {selectedTr.userId}）</span></div>
            <div className="flex justify-between"><span className="text-amber-200/70">匯款金額</span><span className="font-semibold text-emerald-200">{selectedTr.amount.toLocaleString()} PHP</span></div>
            {selectedTr.bankName && <div className="flex justify-between"><span className="text-amber-200/70">銀行</span><span>{selectedTr.bankName}{selectedTr.accountLast4 ? ` ****${selectedTr.accountLast4}` : ''}</span></div>}
            {selectedTr.proofFileName && (
              <div className="space-y-1">
                <span className="text-amber-200/70">憑證檔案</span>
                <div className="flex items-center gap-2 rounded-lg border border-amber-700/60 bg-slate-900/80 px-2 py-1.5">
                  <Receipt className="h-4 w-4 text-amber-400" />
                  <span className="text-[11px]">{selectedTr.proofFileName}</span>
                  <button onClick={async () => await showAlert('示意：開啟憑證圖片預覽（正式環境需整合 S3/CDN 圖片檢視）。')}
                    className="ml-auto rounded-full bg-amber-600/50 px-2 py-0.5 text-[10px] text-amber-50 hover:bg-amber-600">
                    <Eye className="inline h-3 w-3 mr-0.5" />預覽
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-between"><span className="text-amber-200/70">上傳時間</span><span>{selectedTr.uploadedAt}</span></div>
            <div className="flex justify-between"><span className="text-amber-200/70">狀態</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${trBadge[selectedTr.status]}`}>{trLabel[selectedTr.status]}</span></div>
            {selectedTr.reviewedAt && <div className="flex justify-between"><span className="text-amber-200/70">審核時間</span><span>{selectedTr.reviewedAt}</span></div>}
            {selectedTr.reviewedBy && <div className="flex justify-between"><span className="text-amber-200/70">審核人員</span><span>{selectedTr.reviewedBy}</span></div>}
            {selectedTr.note && <div className="text-[11px] text-amber-200/70">備註：{selectedTr.note}</div>}
          </div>
          {selectedTr.status === 'pending' && (
            <div className="flex flex-col gap-2">
              <button onClick={() => verifyTransfer(selectedTr)} className="rounded-full bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500">
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />核准憑證，更新充值訂單
              </button>
              <button onClick={() => rejectTransfer(selectedTr)} className="rounded-full bg-rose-600 px-3 py-2 text-white hover:bg-rose-500">
                <XCircle className="inline h-3.5 w-3.5 mr-1" />拒絕憑證
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  ) : null

  // ─── Drawer: 人工審核詳情 ──────────────────────────────────────────────────
  const ManualDrawer = selectedMr ? (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-violet-700/70 bg-slate-950/95">
        <header className="flex items-center justify-between border-b border-violet-700/60 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-violet-100">
              <ListChecks className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-semibold">人工審核任務</span>
            </div>
            <p className="mt-0.5 text-[11px] text-violet-200/80">{selectedMr.id} · {selectedMr.type === 'deposit' ? '充值入帳' : '出金撥款'}</p>
          </div>
          <button onClick={() => setSelectedMr(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-violet-700/80 bg-slate-900/80 text-violet-200 hover:border-violet-400">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-4 py-3 text-[12px] text-violet-50 space-y-2">
          <div className="space-y-1.5 rounded-xl border border-violet-700/60 bg-slate-900/80 p-3">
            <div className="flex justify-between"><span className="text-violet-200/70">任務 ID</span><span className="font-medium">{selectedMr.id}</span></div>
            <div className="flex justify-between"><span className="text-violet-200/70">參考訂單</span><span>{selectedMr.refId}</span></div>
            <div className="flex justify-between"><span className="text-violet-200/70">類型</span><span>{selectedMr.type === 'deposit' ? '充值入帳' : '出金撥款'}</span></div>
            <div className="flex justify-between"><span className="text-violet-200/70">用戶</span><span>{selectedMr.username}（ID: {selectedMr.userId}）</span></div>
            <div className="flex justify-between"><span className="text-violet-200/70">金額</span><span className="font-semibold text-emerald-200">{selectedMr.amount.toLocaleString()} PHP</span></div>
            <div className="flex justify-between"><span className="text-violet-200/70">狀態</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${mrBadge[selectedMr.status]}`}>{mrLabel[selectedMr.status]}</span></div>
            <div className="flex justify-between"><span className="text-violet-200/70">指派給</span><span>{selectedMr.assignedTo ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-violet-200/70">建立時間</span><span>{selectedMr.createdAt}</span></div>
            {selectedMr.processedAt && <div className="flex justify-between"><span className="text-violet-200/70">處理時間</span><span>{selectedMr.processedAt}</span></div>}
            {selectedMr.note && <div className="text-[11px] text-violet-200/70">備註：{selectedMr.note}</div>}
          </div>
          {(selectedMr.status === 'pending' || selectedMr.status === 'processing') && (
            <div className="flex flex-col gap-2">
              <button onClick={() => assignManual(selectedMr)} className="rounded-full bg-slate-700 px-3 py-2 text-white hover:bg-slate-600">
                <ListChecks className="inline h-3.5 w-3.5 mr-1" />指派審核人員
              </button>
              <button onClick={() => approveManual(selectedMr)} className="rounded-full bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500">
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />核准
              </button>
              <button onClick={() => rejectManual(selectedMr)} className="rounded-full bg-rose-600 px-3 py-2 text-white hover:bg-rose-500">
                <XCircle className="inline h-3.5 w-3.5 mr-1" />拒絕
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  ) : null

  // ─── Drawer: 出金申請詳情 ──────────────────────────────────────────────────
  const WithdrawalDrawer = selectedWdl ? (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-rose-700/70 bg-slate-950/95">
        <header className="flex items-center justify-between border-b border-rose-700/60 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-rose-100">
              <ArrowUpCircle className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold">出金申請詳情</span>
            </div>
            <p className="mt-0.5 text-[11px] text-rose-200/80">{selectedWdl.id} · {selectedWdl.username}</p>
          </div>
          <button onClick={() => setSelectedWdl(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-700/80 bg-slate-900/80 text-rose-200 hover:border-rose-400">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-4 py-3 text-[12px] text-rose-50 space-y-2">
          <div className="space-y-1.5 rounded-xl border border-rose-700/60 bg-slate-900/80 p-3">
            <div className="flex justify-between"><span className="text-rose-200/70">申請 ID</span><span className="font-medium">{selectedWdl.id}</span></div>
            <div className="flex justify-between"><span className="text-rose-200/70">用戶</span><span>{selectedWdl.username}（ID: {selectedWdl.userId}）</span></div>
            <div className="flex justify-between"><span className="text-rose-200/70">申請金額</span><span>{selectedWdl.amount.toLocaleString()} PHP</span></div>
            <div className="flex justify-between"><span className="text-rose-200/70">手續費</span><span>- {selectedWdl.fee.toLocaleString()} PHP</span></div>
            <div className="flex justify-between"><span className="text-rose-200/70">實際撥款</span><span className="font-semibold text-emerald-200">{selectedWdl.net.toLocaleString()} PHP</span></div>
            <div className="flex justify-between"><span className="text-rose-200/70">出金渠道</span><span>{selectedWdl.channel}</span></div>
            <div className="flex justify-between"><span className="text-rose-200/70">狀態</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${wdlBadge[selectedWdl.status]}`}>{wdlLabel[selectedWdl.status]}</span></div>
            <div className="flex justify-between"><span className="text-rose-200/70">申請時間</span><span>{selectedWdl.createdAt}</span></div>
            {selectedWdl.processedAt && <div className="flex justify-between"><span className="text-rose-200/70">處理時間</span><span>{selectedWdl.processedAt}</span></div>}
            {selectedWdl.processedBy && <div className="flex justify-between"><span className="text-rose-200/70">處理人員</span><span>{selectedWdl.processedBy}</span></div>}
            {selectedWdl.note && <div className="text-[11px] text-rose-200/70">備註：{selectedWdl.note}</div>}
          </div>
          {selectedWdl.status === 'submitted' && (
            <div className="flex flex-col gap-2">
              <button onClick={() => processWithdrawal(selectedWdl)} className="rounded-full bg-sky-600 px-3 py-2 text-white hover:bg-sky-500">
                <History className="inline h-3.5 w-3.5 mr-1" />標記為處理中
              </button>
              <button onClick={() => approveWithdrawal(selectedWdl)} className="rounded-full bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500">
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />核准並完成撥款
              </button>
              <button onClick={() => rejectWithdrawal(selectedWdl)} className="rounded-full bg-rose-600 px-3 py-2 text-white hover:bg-rose-500">
                <XCircle className="inline h-3.5 w-3.5 mr-1" />拒絕
              </button>
            </div>
          )}
          {selectedWdl.status === 'processing' && (
            <div className="flex flex-col gap-2">
              <button onClick={() => approveWithdrawal(selectedWdl)} className="rounded-full bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500">
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />確認撥款完成
              </button>
              <button onClick={() => rejectWithdrawal(selectedWdl)} className="rounded-full bg-rose-600 px-3 py-2 text-white hover:bg-rose-500">
                <XCircle className="inline h-3.5 w-3.5 mr-1" />拒絕
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  ) : null

  // ─── Drawer: 人工入帳新增 ──────────────────────────────────────────────────
  const NewDepositDrawer = newDepForm ? (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-sky-700/70 bg-slate-950/95">
        <header className="flex items-center justify-between border-b border-sky-700/60 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-sky-100">
              <PlusCircle className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">新增人工入帳訂單</span>
            </div>
            <p className="mt-0.5 text-[11px] text-sky-200/80">建立後自動進入人工審核佇列，由財務人員確認核准。</p>
          </div>
          <button onClick={() => setNewDepForm(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-700/80 bg-slate-900/80 text-sky-200 hover:border-sky-400">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-sky-50">
          <form className="space-y-3" onSubmit={e => { e.preventDefault(); submitNewDeposit() }}>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-sky-100">用戶 ID</label>
                <input value={newDepForm.userId} onChange={e => setNewDepForm(p => p ? { ...p, userId: e.target.value } : p)}
                  className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="例如：10001" />
              </div>
              <div className="space-y-1">
                <label className="block text-sky-100">用戶名稱</label>
                <input value={newDepForm.username} onChange={e => setNewDepForm(p => p ? { ...p, username: e.target.value } : p)}
                  className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="例如：alice" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sky-100">充值金額（PHP）</label>
              <input value={newDepForm.amount} onChange={e => setNewDepForm(p => p ? { ...p, amount: e.target.value } : p)}
                inputMode="decimal" className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="請輸入大於 0 的金額" />
            </div>
            <div className="space-y-1">
              <label className="block text-sky-100">備註 / 說明（選填）</label>
              <textarea value={newDepForm.note} onChange={e => setNewDepForm(p => p ? { ...p, note: e.target.value } : p)}
                rows={3} className="w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-sky-50 outline-none focus:border-sky-400" placeholder="輸入此次人工入帳的說明、工單 ID 或其他備註。" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setNewDepForm(null)} className="inline-flex rounded-full border border-sky-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-sky-100 hover:bg-slate-800/80">取消</button>
              <button type="submit" className="inline-flex rounded-full bg-sky-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-sky-500">建立人工入帳</button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  ) : null

  // ─── Drawer: 對帳報表新增 ──────────────────────────────────────────────────
  const RcnFormDrawer = rcnForm ? (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-teal-700/70 bg-slate-950/95">
        <header className="flex items-center justify-between border-b border-teal-700/60 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-100">
              <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
              <span className="font-semibold">產生交易對帳報表</span>
            </div>
            <p className="mt-0.5 text-[11px] text-teal-200/80">選擇日期與支付渠道，系統將排程後端批次比對。</p>
          </div>
          <button onClick={() => setRcnForm(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-teal-700/80 bg-slate-900/80 text-teal-200 hover:border-teal-400">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-teal-50">
          <form className="space-y-3" onSubmit={e => { e.preventDefault(); generateReconciliation() }}>
            <div className="space-y-1">
              <label className="block text-teal-100">對帳日期（YYYY-MM-DD）</label>
              <input value={rcnForm.period} onChange={e => setRcnForm(p => p ? { ...p, period: e.target.value } : p)}
                placeholder="例如：2025-03-04" className="h-7 w-full rounded-md border border-teal-700/80 bg-slate-950/80 px-2 text-[11px] text-teal-50 outline-none focus:border-teal-400" />
            </div>
            <div className="space-y-1">
              <label className="block text-teal-100">支付渠道</label>
              <input value={rcnForm.channel} onChange={e => setRcnForm(p => p ? { ...p, channel: e.target.value } : p)}
                placeholder="例如：Pay88 / DragonPay / 銀行轉帳" className="h-7 w-full rounded-md border border-teal-700/80 bg-slate-950/80 px-2 text-[11px] text-teal-50 outline-none focus:border-teal-400" />
            </div>
            <div className="rounded-xl border border-teal-700/60 bg-slate-900/80 p-3 text-[10px] text-slate-400">
              <div className="mb-1 font-semibold text-teal-300">對帳流程說明</div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>系統向第三方抓取當日交易明細</li>
                <li>與內部訂單資料逐筆比對，找出差異</li>
                <li>產生吻合 / 差異明細報表，支援匯出</li>
                <li>差異訂單進入人工確認流程</li>
              </ul>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setRcnForm(null)} className="inline-flex rounded-full border border-teal-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-teal-100 hover:bg-slate-800/80">取消</button>
              <button type="submit" className="inline-flex rounded-full bg-teal-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-teal-500">建立對帳報表</button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  ) : null

  // ─── Blueprint features ────────────────────────────────────────────────────
  const blueprintFeatures: FeatureItem[] = [
    { id: 59, name: '充值（存款）列表', description: '第三方 / 轉帳 / 人工入帳訂單彙總，支援多維度篩選、詳情審核與匯出。', tag: '列表' },
    { id: 60, name: '第三方支付狀態追蹤', description: '依統一狀態集合追蹤第三方訂單，支援補查 / 重新同步，並展示 callback 時序。', tag: '第三方' },
    { id: 61, name: '匯款憑證審核', description: '管理用戶上傳的匯款憑證，核對金額與帳號，核准後自動更新充值訂單。', tag: '憑證' },
    { id: 62, name: '人工審核工作台', description: '集中處理充值 / 出金的人工審核佇列，支援指派、批次操作與 Audit Log。', tag: '工作台' },
    { id: 63, name: '出金（提領）管理', description: '管理提領申請審核、狀態更新（提交→處理中→完成/拒絕），並同步到人工工作台。', tag: '出金' },
    { id: 64, name: '手續費 / 抽成 / 補貼記錄', description: '展示平台收取的手續費、渠道抽成與用戶補貼，支援稽核追溯與成本分析。', tag: '成本' },
    { id: 65, name: '交易對帳報表', description: '對第三方通道與內部訂單逐日比對，差異訂單自動進入人工確認，支援匯出。', tag: '對帳' },
    { id: 66, name: '狀態流轉 Stepper', description: '在訂單詳情中展示完整狀態流轉鏈路，讓財務與稽核一眼看出處理進度與回滾情況。', tag: 'UX' },
    { id: 67, name: 'RBAC 高風險操作保護', description: '所有審核、核准、拒絕操作須依角色授權，並支援二次確認避免誤操作。', tag: 'RBAC' },
  ]

  // ─── Render ────────────────────────────────────────────────────────────────

  const tabs: { id: PaymentsTabId; label: string; color: string }[] = [
    { id: 'overview', label: t('common.overview'), color: 'bg-slate-700' },
    { id: 'deposits', label: t('tabs.payDeposits'), color: 'bg-sky-600' },
    { id: 'thirdparty', label: t('tabs.payThirdparty'), color: 'bg-indigo-600' },
    { id: 'transfer', label: t('tabs.payTransfer'), color: 'bg-amber-600' },
    { id: 'manual', label: t('tabs.payManual'), color: 'bg-violet-600' },
    { id: 'withdrawal', label: t('tabs.payWithdrawal'), color: 'bg-rose-600' },
    { id: 'fees', label: t('tabs.payFees'), color: 'bg-orange-600' },
    { id: 'reconciliation', label: t('tabs.payReconciliation'), color: 'bg-teal-600' },
    { id: 'blueprint', label: t('common.blueprint'), color: 'bg-slate-700' },
  ]

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">支付管理</span>
          <span className="text-[10px] text-slate-500">充值 / 第三方 / 憑證審核 / 人工工作台 / 出金 / 手續費 / 對帳</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={['rounded-full px-2 py-0.5', tab === t.id ? `${t.color} text-white` : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── 總覽 ─────────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">支付系統總覽</span>
            </div>
            <span className="text-[10px] text-slate-500">各模組快速狀態一覽，點選子頁籤進入詳細管理。</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-[11px]">
            <div className="space-y-1 rounded-xl border border-emerald-600/60 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><ArrowDownCircle className="h-3.5 w-3.5 text-emerald-400" />累計充值（已完成）</div>
              <div className="text-lg font-semibold text-emerald-100">{overview.totalDeposited.toLocaleString()} PHP</div>
              <p className="text-[10px] text-emerald-200/80">所有渠道「已完成」充值訂單總和。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><ArrowUpCircle className="h-3.5 w-3.5 text-rose-400" />累計出金（已完成）</div>
              <div className="text-lg font-semibold text-rose-100">{overview.totalWithdrawn.toLocaleString()} PHP</div>
              <p className="text-[10px] text-rose-200/80">已完成出金申請的實際撥款總和（扣除手續費後）。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-amber-600/60 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><Clock className="h-3.5 w-3.5 text-amber-400" />待人工審核</div>
              <div className="text-lg font-semibold text-amber-100">{overview.pendingReviews} 筆</div>
              <p className="text-[10px] text-amber-200/80">包含待處理及處理中的充值 / 出金人工審核任務。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-orange-600/60 bg-orange-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><Receipt className="h-3.5 w-3.5 text-orange-400" />手續費收取</div>
              <div className="text-lg font-semibold text-orange-100">{overview.feeCollected.toLocaleString()} PHP</div>
              <p className="text-[10px] text-orange-200/80">平台收取的手續費與抽成合計（未扣補貼）。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-sky-600/60 bg-sky-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><Wallet className="h-3.5 w-3.5 text-sky-400" />補貼支出</div>
              <div className="text-lg font-semibold text-sky-100">{overview.subsidies.toLocaleString()} PHP</div>
              <p className="text-[10px] text-sky-200/80">發放給用戶的充值補貼總額，計入行銷成本。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><AlertTriangle className="h-3.5 w-3.5 text-rose-400" />對帳差異報表</div>
              <div className="text-lg font-semibold text-rose-100">{overview.diffRcn} 份</div>
              <p className="text-[10px] text-rose-200/80">尚有差異的對帳報表，需人工確認並追查原因。</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 text-[11px]">
            {[
              { label: '充值訂單總數', value: deposits.length, sub: `待處理：${deposits.filter(d => d.status === 'pending').length} 筆` },
              { label: '出金申請總數', value: withdrawals.length, sub: `已提交：${withdrawals.filter(w => w.status === 'submitted').length} 筆` },
              { label: '第三方訂單總數', value: thirdPartyOrders.length, sub: `成功：${thirdPartyOrders.filter(o => o.status === 'success').length} 筆` },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3">
                <div className="text-slate-400">{s.label}</div>
                <div className="text-lg font-semibold text-slate-100">{s.value}</div>
                <div className="text-[10px] text-slate-500">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 充值列表 ─────────────────────────────────────────────────────── */}
      {tab === 'deposits' && (
        <section className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <ArrowDownCircle className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">充值（存款）列表</span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-100">三方 / 銀行轉帳 / 人工入帳</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={async () => await showAlert('示意：依當前篩選條件匯出充值訂單 CSV。')}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700">
                <FileDown className="h-3 w-3" />匯出
              </button>
              <button onClick={() => setNewDepForm({ userId: '', username: '', amount: '', note: '' })}
                className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-sky-500">
                <PlusCircle className="h-3 w-3" />人工入帳
              </button>
            </div>
          </header>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input value={depKeyword} onChange={e => { setDepKeyword(e.target.value); setDepPage(1) }}
                placeholder="訂單 ID / 用戶 / 外部訂單號" className="bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-[11px]" />
            </div>
            <select value={depChannelF} onChange={e => { setDepChannelF(e.target.value as any); setDepPage(1) }}
              className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
              <option value="all">全部渠道</option>
              <option value="third_party">第三方</option>
              <option value="transfer">銀行轉帳</option>
              <option value="manual">人工入帳</option>
            </select>
            <select value={depStatusF} onChange={e => { setDepStatusF(e.target.value as any); setDepPage(1) }}
              className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
              <option value="all">全部狀態</option>
              <option value="pending">待處理</option>
              <option value="processing">處理中</option>
              <option value="completed">已完成</option>
              <option value="failed">失敗</option>
              <option value="rejected">已拒絕</option>
            </select>
            <span className="ml-auto text-[12px] text-slate-400">共 {filteredDep.length} 筆</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-sky-100">
                <tr>
                  {['#','訂單 ID','用戶','渠道 / 支付商','金額','狀態','建立時間','操作'].map(h => (
                    <th key={h} className="border-b border-sky-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedDep.map((d, i) => (
                  <tr key={d.id} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(depPage - 1) * PS + i + 1}</td>
                    <td className="px-2 py-1.5 font-medium">{d.id}</td>
                    <td className="px-2 py-1.5">
                      <div className="font-medium">{d.username}</div>
                      <div className="text-[10px] text-sky-100/80">ID: {d.userId}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div>{chLabel(d.channel)}</div>
                      {d.provider && <div className="text-[10px] text-sky-100/80">{d.provider}</div>}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums font-semibold text-emerald-200">{d.amount.toLocaleString()} {d.currency}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${psBadge[d.status]}`}>{psLabel[d.status]}</span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-sky-100/80">{d.createdAt}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedDep(d)} className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-50 hover:bg-sky-500/30">
                          <Eye className="h-3 w-3" />詳情
                        </button>
                        {(d.status === 'pending' || d.status === 'processing') && (
                          <button onClick={() => { setSelectedDep(d) }} className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500">
                            審核
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedDep.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-sky-100/80">目前沒有符合條件的充值訂單。</td></tr>}
              </tbody>
            </table>
            <Paginator page={depPage} total={filteredDep.length} pageSize={PS} borderColor="border-sky-600/60"
              onPrev={() => setDepPage(p => Math.max(1, p - 1))} onNext={() => setDepPage(p => p + 1)} />
          </div>
        </section>
      )}

      {/* ── 第三方支付 ───────────────────────────────────────────────────── */}
      {tab === 'thirdparty' && (
        <section className="space-y-3 rounded-2xl border border-indigo-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold">第三方支付訂單</span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-100">狀態追蹤 · 補查 / 重新同步</span>
            </div>
          </header>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <select value={tpProviderF} onChange={e => { setTpProviderF(e.target.value); setTpPage(1) }}
              className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
              <option value="all">全部支付商</option>
              {tpProviders.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={tpStatusF} onChange={e => { setTpStatusF(e.target.value as any); setTpPage(1) }}
              className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
              <option value="all">全部狀態</option>
              <option value="pending">待確認</option>
              <option value="success">成功</option>
              <option value="failed">失敗</option>
              <option value="timeout">超時</option>
              <option value="refunded">已退款</option>
            </select>
            <span className="ml-auto text-[12px] text-slate-400">共 {filteredTp.length} 筆</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-indigo-100">
                <tr>
                  {['#','外部訂單 ID','支付商','用戶','金額','狀態','建立時間','最後同步','操作'].map(h => (
                    <th key={h} className="border-b border-indigo-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedTp.map((o, i) => (
                  <tr key={o.id} className="border-b border-indigo-600/30 text-indigo-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(tpPage - 1) * PS + i + 1}</td>
                    <td className="px-2 py-1.5 text-[10px]">{o.externalId}</td>
                    <td className="px-2 py-1.5 font-medium">{o.provider}</td>
                    <td className="px-2 py-1.5">
                      <div>{o.username}</div>
                      <div className="text-[10px] text-indigo-100/80">ID: {o.userId}</div>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums font-semibold text-emerald-200">{o.amount.toLocaleString()}</td>
                    <td className="px-2 py-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] ${tpBadge[o.status]}`}>{tpLabel[o.status]}</span></td>
                    <td className="px-2 py-1.5 text-[10px] text-indigo-100/80">{o.createdAt}</td>
                    <td className="px-2 py-1.5 text-[10px] text-indigo-100/80">{o.syncedAt ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedTp(o)} className="inline-flex items-center gap-0.5 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-50 hover:bg-indigo-500/30">
                          <Eye className="h-3 w-3" />詳情
                        </button>
                        {(o.status === 'pending' || o.status === 'timeout' || o.status === 'failed') && (
                          <button onClick={() => resyncThirdParty(o)} className="inline-flex items-center gap-0.5 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] text-white hover:bg-indigo-500">
                            <RefreshCcw className="h-3 w-3" />補查
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedTp.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-indigo-100/80">沒有符合條件的第三方支付訂單。</td></tr>}
              </tbody>
            </table>
            <Paginator page={tpPage} total={filteredTp.length} pageSize={PS} borderColor="border-indigo-600/60"
              onPrev={() => setTpPage(p => Math.max(1, p - 1))} onNext={() => setTpPage(p => p + 1)} />
          </div>
        </section>
      )}

      {/* ── 匯款憑證審核 ─────────────────────────────────────────────────── */}
      {tab === 'transfer' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">匯款憑證審核</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100">核對金額 · 帳號 · 圖片憑證</span>
            </div>
            <select value={trStatusF} onChange={e => { setTrStatusF(e.target.value as any); setTrPage(1) }}
              className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
              <option value="all">全部狀態</option>
              <option value="pending">待審核</option>
              <option value="verified">已核准</option>
              <option value="rejected">已拒絕</option>
            </select>
          </header>
          <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-amber-100">
                <tr>
                  {['#','憑證 ID','用戶','金額','銀行 / 帳號','憑證檔案','上傳時間','狀態','操作'].map(h => (
                    <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedTr.map((r, i) => (
                  <tr key={r.id} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(trPage - 1) * PS + i + 1}</td>
                    <td className="px-2 py-1.5 font-medium">{r.id}</td>
                    <td className="px-2 py-1.5">
                      <div>{r.username}</div>
                      <div className="text-[10px] text-amber-100/80">ID: {r.userId}</div>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums font-semibold text-emerald-200">{r.amount.toLocaleString()} PHP</td>
                    <td className="px-2 py-1.5 text-[10px]">{r.bankName ?? '—'}{r.accountLast4 ? ` ****${r.accountLast4}` : ''}</td>
                    <td className="px-2 py-1.5 text-[10px] text-amber-100/80">{r.proofFileName ?? '—'}</td>
                    <td className="px-2 py-1.5 text-[10px] text-amber-100/80">{r.uploadedAt}</td>
                    <td className="px-2 py-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] ${trBadge[r.status]}`}>{trLabel[r.status]}</span></td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedTr(r)} className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-50 hover:bg-amber-500/30">
                          <Eye className="h-3 w-3" />審核
                        </button>
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => verifyTransfer(r)} className="inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500">核准</button>
                            <button onClick={() => rejectTransfer(r)} className="inline-flex rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500">拒絕</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedTr.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-amber-100/80">目前沒有符合條件的匯款憑證。</td></tr>}
              </tbody>
            </table>
            <Paginator page={trPage} total={filteredTr.length} pageSize={PS} borderColor="border-amber-600/60"
              onPrev={() => setTrPage(p => Math.max(1, p - 1))} onNext={() => setTrPage(p => p + 1)} />
          </div>
        </section>
      )}

      {/* ── 人工審核工作台 ───────────────────────────────────────────────── */}
      {tab === 'manual' && (
        <section className="space-y-3 rounded-2xl border border-violet-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-semibold">人工審核工作台</span>
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-100">充值 / 出金 · 指派 · 批次操作</span>
            </div>
            <div className="flex items-center gap-2">
              <select value={mrTypeF} onChange={e => { setMrTypeF(e.target.value as any); setMrPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部類型</option>
                <option value="deposit">充值</option>
                <option value="withdrawal">出金</option>
              </select>
              <select value={mrStatusF} onChange={e => { setMrStatusF(e.target.value as any); setMrPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部狀態</option>
                <option value="pending">待審核</option>
                <option value="processing">處理中</option>
                <option value="approved">已核准</option>
                <option value="rejected">已拒絕</option>
              </select>
            </div>
          </header>
          <div className="overflow-hidden rounded-xl border border-violet-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-violet-100">
                <tr>
                  {['#','任務 ID','類型','用戶','金額','指派給','狀態','建立時間','操作'].map(h => (
                    <th key={h} className="border-b border-violet-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedMr.map((m, i) => (
                  <tr key={m.id} className="border-b border-violet-600/30 text-violet-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(mrPage - 1) * PS + i + 1}</td>
                    <td className="px-2 py-1.5">
                      <div className="font-medium">{m.id}</div>
                      <div className="text-[10px] text-violet-100/80">→ {m.refId}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${m.type === 'deposit' ? 'bg-sky-500/30 text-sky-50' : 'bg-rose-500/30 text-rose-50'}`}>
                        {m.type === 'deposit' ? '充值' : '出金'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div>{m.username}</div>
                      <div className="text-[10px] text-violet-100/80">ID: {m.userId}</div>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums font-semibold text-emerald-200">{m.amount.toLocaleString()} PHP</td>
                    <td className="px-2 py-1.5 text-[10px] text-violet-100/80">{m.assignedTo ?? '—'}</td>
                    <td className="px-2 py-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] ${mrBadge[m.status]}`}>{mrLabel[m.status]}</span></td>
                    <td className="px-2 py-1.5 text-[10px] text-violet-100/80">{m.createdAt}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedMr(m)} className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-50 hover:bg-violet-500/30">
                          <Eye className="h-3 w-3" />詳情
                        </button>
                        {(m.status === 'pending' || m.status === 'processing') && (
                          <>
                            <button onClick={() => assignManual(m)} className="inline-flex rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-white hover:bg-slate-600">指派</button>
                            <button onClick={() => approveManual(m)} className="inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500">核准</button>
                            <button onClick={() => rejectManual(m)} className="inline-flex rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500">拒絕</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedMr.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-violet-100/80">目前沒有符合條件的人工審核任務。</td></tr>}
              </tbody>
            </table>
            <Paginator page={mrPage} total={filteredMr.length} pageSize={PS} borderColor="border-violet-600/60"
              onPrev={() => setMrPage(p => Math.max(1, p - 1))} onNext={() => setMrPage(p => p + 1)} />
          </div>
        </section>
      )}

      {/* ── 出金管理 ─────────────────────────────────────────────────────── */}
      {tab === 'withdrawal' && (
        <section className="space-y-3 rounded-2xl border border-rose-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <ArrowUpCircle className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold">出金（提領）管理</span>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100">已提交 → 處理中 → 完成 / 拒絕</span>
            </div>
            <div className="flex items-center gap-2">
              <select value={wdlChannelF} onChange={e => { setWdlChannelF(e.target.value); setWdlPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部渠道</option>
                <option value="Bank">銀行</option>
                <option value="Crypto">加密貨幣</option>
                <option value="E-Wallet">電子錢包</option>
              </select>
              <select value={wdlStatusF} onChange={e => { setWdlStatusF(e.target.value as any); setWdlPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部狀態</option>
                <option value="submitted">已提交</option>
                <option value="processing">處理中</option>
                <option value="completed">已完成</option>
                <option value="rejected">已拒絕</option>
                <option value="cancelled">已取消</option>
              </select>
              <button onClick={async () => await showAlert('示意：匯出出金申請 CSV。')}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700">
                <FileDown className="h-3 w-3" />匯出
              </button>
            </div>
          </header>
          <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-rose-100">
                <tr>
                  {['#','申請 ID','用戶','申請金額','手續費','實際撥款','渠道','狀態','申請時間','操作'].map(h => (
                    <th key={h} className="border-b border-rose-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedWdl.map((w, i) => (
                  <tr key={w.id} className="border-b border-rose-600/30 text-rose-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(wdlPage - 1) * PS + i + 1}</td>
                    <td className="px-2 py-1.5 font-medium">{w.id}</td>
                    <td className="px-2 py-1.5">
                      <div>{w.username}</div>
                      <div className="text-[10px] text-rose-100/80">ID: {w.userId}</div>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">{w.amount.toLocaleString()}</td>
                    <td className="px-2 py-1.5 tabular-nums text-rose-200/70">-{w.fee.toLocaleString()}</td>
                    <td className="px-2 py-1.5 tabular-nums font-semibold text-emerald-200">{w.net.toLocaleString()}</td>
                    <td className="px-2 py-1.5">{w.channel}</td>
                    <td className="px-2 py-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] ${wdlBadge[w.status]}`}>{wdlLabel[w.status]}</span></td>
                    <td className="px-2 py-1.5 text-[10px] text-rose-100/80">{w.createdAt}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedWdl(w)} className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-50 hover:bg-rose-500/30">
                          <Eye className="h-3 w-3" />詳情
                        </button>
                        {w.status === 'submitted' && (
                          <>
                            <button onClick={() => processWithdrawal(w)} className="inline-flex rounded-full bg-sky-600 px-2 py-0.5 text-[10px] text-white hover:bg-sky-500">處理中</button>
                            <button onClick={() => approveWithdrawal(w)} className="inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500">核准</button>
                            <button onClick={() => rejectWithdrawal(w)} className="inline-flex rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500">拒絕</button>
                          </>
                        )}
                        {w.status === 'processing' && (
                          <button onClick={() => approveWithdrawal(w)} className="inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500">確認完成</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedWdl.length === 0 && <tr><td colSpan={10} className="px-4 py-6 text-center text-rose-100/80">目前沒有符合條件的出金申請。</td></tr>}
              </tbody>
            </table>
            <Paginator page={wdlPage} total={filteredWdl.length} pageSize={PS} borderColor="border-rose-600/60"
              onPrev={() => setWdlPage(p => Math.max(1, p - 1))} onNext={() => setWdlPage(p => p + 1)} />
          </div>
        </section>
      )}

      {/* ── 手續費 / 成本記錄 */}
      {tab === 'fees' && (
        <section className="space-y-3 rounded-2xl border border-orange-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-orange-400" />
              <span className="font-semibold">手續費 / 抽成 / 補貼記錄</span>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] text-orange-100">成本追蹤 · 稽核 · 匯出</span>
            </div>
            <div className="flex items-center gap-2">
              <select value={feeTypeF} onChange={e => { setFeeTypeF(e.target.value as any); setFeePage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部類型</option>
                <option value="手續費">手續費</option>
                <option value="抽成">抽成</option>
                <option value="補貼">補貼</option>
              </select>
              <select value={feeDirF} onChange={e => { setFeeDirF(e.target.value as any); setFeePage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部方向</option>
                <option value="收取">收取（收入）</option>
                <option value="退還">退還（支出）</option>
              </select>
              <button onClick={async () => await showAlert('示意：匯出手續費 / 成本記錄 CSV。')}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700">
                <FileDown className="h-3 w-3" />匯出
              </button>
            </div>
          </header>
          <div className="grid gap-3 sm:grid-cols-3 text-[11px] mb-1">
            <div className="rounded-xl border border-orange-600/60 bg-orange-500/10 p-3">
              <div className="text-slate-400">總收取（手續費 + 抽成）</div>
              <div className="text-lg font-semibold text-orange-100">{feeRecords.filter(f => f.direction === '收取').reduce((s, f) => s + f.amount, 0).toLocaleString()} PHP</div>
            </div>
            <div className="rounded-xl border border-sky-600/60 bg-sky-500/10 p-3">
              <div className="text-slate-400">總補貼支出</div>
              <div className="text-lg font-semibold text-sky-100">{feeRecords.filter(f => f.direction === '退還').reduce((s, f) => s + f.amount, 0).toLocaleString()} PHP</div>
            </div>
            <div className="rounded-xl border border-emerald-600/60 bg-emerald-500/10 p-3">
              <div className="text-slate-400">淨收入（收取 - 補貼）</div>
              <div className="text-lg font-semibold text-emerald-100">
                {(feeRecords.filter(f => f.direction === '收取').reduce((s, f) => s + f.amount, 0)
                  - feeRecords.filter(f => f.direction === '退還').reduce((s, f) => s + f.amount, 0)).toLocaleString()} PHP
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-orange-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-orange-100">
                <tr>
                  {['#','記錄 ID','參考訂單','類型','方向','金額','用戶','建立時間','備註'].map(h => (
                    <th key={h} className="border-b border-orange-600/60 px-2 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedFee.map((f, i) => (
                  <tr key={f.id} className="border-b border-orange-600/30 text-orange-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(feePage - 1) * PS + i + 1}</td>
                    <td className="px-2 py-1.5 text-[10px]">{f.id}</td>
                    <td className="px-2 py-1.5 text-[10px] text-orange-100/80">{f.refId}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${f.type === '補貼' ? 'bg-sky-500/30 text-sky-50' : 'bg-orange-500/30 text-orange-50'}`}>{f.type}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${f.direction === '收取' ? 'bg-emerald-500/30 text-emerald-50' : 'bg-rose-500/30 text-rose-50'}`}>{f.direction}</span>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums font-semibold">{f.direction === '收取' ? '+' : '-'}{f.amount.toLocaleString()} PHP</td>
                    <td className="px-2 py-1.5">
                      <div>{f.username}</div>
                      <div className="text-[10px] text-orange-100/80">ID: {f.userId}</div>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-orange-100/80">{f.createdAt}</td>
                    <td className="px-2 py-1.5 text-[10px] text-orange-100/80">{f.note ?? '—'}</td>
                  </tr>
                ))}
                {pagedFee.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-orange-100/80">目前沒有符合條件的手續費記錄。</td></tr>}
              </tbody>
            </table>
            <Paginator page={feePage} total={filteredFee.length} pageSize={PS} borderColor="border-orange-600/60"
              onPrev={() => setFeePage(p => Math.max(1, p - 1))} onNext={() => setFeePage(p => p + 1)} />
          </div>
        </section>
      )}

      {/* ── 交易對帳報表 */}
      {tab === 'reconciliation' && (
        <section className="space-y-3 rounded-2xl border border-teal-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
              <span className="font-semibold">交易對帳報表</span>
              <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] text-teal-100">逐日比對 · 差異分析 · 人工確認</span>
            </div>
            <button onClick={() => setRcnForm({ period: '', channel: '' })}
              className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-teal-500">
              <PlusCircle className="h-3 w-3" />產生對帳報表
            </button>
          </header>
          <div className="overflow-hidden rounded-xl border border-teal-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-teal-100">
                <tr>
                  {['#','日期','渠道','總訂單','吻合','差異','總金額','差異金額','狀態','產生時間','備註','操作'].map(h => (
                    <th key={h} className="border-b border-teal-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reconciliations.map((r, i) => (
                  <tr key={r.id} className="border-b border-teal-600/30 text-teal-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                    <td className="px-2 py-1.5 font-medium">{r.period}</td>
                    <td className="px-2 py-1.5">{r.channel}</td>
                    <td className="px-2 py-1.5 tabular-nums">{r.totalOrders}</td>
                    <td className="px-2 py-1.5 tabular-nums text-emerald-200">{r.matchedOrders}</td>
                    <td className="px-2 py-1.5 tabular-nums text-rose-200">{r.diffOrders}</td>
                    <td className="px-2 py-1.5 tabular-nums">{r.totalAmount.toLocaleString()}</td>
                    <td className="px-2 py-1.5 tabular-nums">
                      <span className={r.diffAmount < 0 ? 'text-rose-300' : 'text-emerald-300'}>{r.diffAmount.toLocaleString()}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${r.status === 'balanced' ? 'bg-emerald-500/30 text-emerald-50' : r.status === 'diff' ? 'bg-rose-500/40 text-rose-50' : 'bg-amber-500/30 text-amber-50'}`}>
                        {rcnLabel[r.status]}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-teal-100/80">{r.generatedAt}</td>
                    <td className="px-2 py-1.5 text-[10px] text-teal-100/80">{r.note ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={async () => await showAlert(`示意：開啟「${r.period}・${r.channel}」差異明細，逐筆人工確認。`)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] text-teal-50 hover:bg-teal-500/30">
                          <Eye className="h-3 w-3" />明細
                        </button>
                        {r.status !== 'pending' && (
                          <button onClick={async () => await showAlert(`示意：匯出「${r.period}・${r.channel}」對帳 CSV。`)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-white hover:bg-slate-600">
                            <FileDown className="h-3 w-3" />匯出
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reconciliations.length === 0 && <tr><td colSpan={12} className="px-4 py-6 text-center text-teal-100/80">目前尚無對帳報表。</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-teal-700/60 bg-slate-900/80 p-3 text-[10px] text-slate-400">
            <div className="mb-1 font-semibold text-teal-300">對帳流程說明</div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>系統每日向第三方抓取當日交易明細，逐筆與內部訂單比對</li>
              <li>吻合訂單自動標記完成；差異訂單進入人工確認佇列</li>
              <li>銀行轉帳以人工核對憑證為主，完成後自動標記吻合</li>
              <li>差異原因：callback 未收到 / 金額不符 / 重複訂單 / 退款未對帳</li>
              <li>所有對帳操作均寫入 Audit Log，支援月結報表匯出</li>
            </ul>
          </div>
        </section>
      )}

      {/* ── 功能清單 */}
      {tab === 'blueprint' && (
        <FeatureList
          title="支付管理功能清單"
          subtitle="對齊充值渠道、人工審核工作台、出金管理、成本追蹤與對帳報表的完整鏈路。"
          items={blueprintFeatures}
        />
      )}

      {/* Drawers */}
      {DepositDrawer}
      {ThirdPartyDrawer}
      {TransferDrawer}
      {ManualDrawer}
      {WithdrawalDrawer}
      {NewDepositDrawer}
      {RcnFormDrawer}
    </div>
  )
}

export default PaymentsPage
