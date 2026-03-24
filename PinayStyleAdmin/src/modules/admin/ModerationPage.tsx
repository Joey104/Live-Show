/**
 * @file ModerationPage.tsx
 * @description 舉報與風控管理工作台
 * 子模組：總覽 / 舉報列表 / 封禁管理 / 敏感詞 / Audit Log / 功能清單
 */

import { useMemo, useState } from 'react'
import { showAlert, showConfirm, showPrompt } from '../../lib/dialog'
import {
  ShieldAlert, Flag, Ban, BookX, ClipboardList, ListChecks,
  CheckCircle2, XCircle, AlertTriangle, Clock, Eye,
  ChevronLeft, ChevronRight, PlusCircle, X, Trash2, Filter,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Types ────────────────────────────────────────────────────────────────────

type ModerationTabId = 'overview' | 'reports' | 'bans' | 'keywords' | 'audit' | 'blueprint'

type ReportType = '用戶' | '直播' | '訊息'
type ReportReason = '色情' | '暴力' | '詐騙' | '騷擾' | '垃圾'
type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'

type BanType = '永久' | '臨時'
type KeywordCategory = '色情' | '暴力' | '廣告' | '政治'

type AuditActionType = '封禁' | '解封' | '刪除訊息' | '新增敏感詞'

interface Report {
  id: string
  type: ReportType
  targetName: string
  reason: ReportReason
  reportCount: number
  status: ReportStatus
  createdAt: string
  description?: string
  reporters?: string[]
}

interface BanRecord {
  id: string
  username: string
  userId: string
  reason: string
  banType: BanType
  expiresAt?: string
  operatorName: string
  createdAt: string
}

interface UnbanRecord {
  id: string
  username: string
  userId: string
  unbannedAt: string
  unbannedBy: string
  note?: string
}

interface SensitiveKeyword {
  id: string
  word: string
  category: KeywordCategory
  addedAt: string
  addedBy: string
}

interface AuditLog {
  id: string
  operatedAt: string
  operatorName: string
  actionType: AuditActionType
  target: string
  detail: string
  ip: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function mockReports(): Report[] {
  return [
    { id: 'RPT-001', type: '用戶', targetName: 'baduser_99', reason: '騷擾', reportCount: 12, status: 'pending', createdAt: '2026-03-24 08:15', description: '持續在直播間發送騷擾訊息，已有多名用戶舉報。', reporters: ['alice', 'bob', 'carol', '其他 9 名用戶'] },
    { id: 'RPT-002', type: '直播', targetName: 'Alice 直播間', reason: '色情', reportCount: 5, status: 'reviewing', createdAt: '2026-03-24 10:00', description: '直播間內出現不當圖片，疑似色情內容。', reporters: ['dave', 'ed', 'frank', 'grace', 'henry'] },
    { id: 'RPT-003', type: '訊息', targetName: '訊息 ID #48920', reason: '詐騙', reportCount: 3, status: 'pending', createdAt: '2026-03-23 18:45', description: '訊息內含詐騙連結，引導用戶至可疑外部網站。', reporters: ['user_a', 'user_b', 'user_c'] },
    { id: 'RPT-004', type: '用戶', targetName: 'spammer_007', reason: '垃圾', reportCount: 8, status: 'resolved', createdAt: '2026-03-22 12:00', description: '大量發送垃圾廣告訊息。', reporters: ['多名用戶'] },
    { id: 'RPT-005', type: '直播', targetName: 'Bob 直播間', reason: '暴力', reportCount: 2, status: 'dismissed', createdAt: '2026-03-21 20:30', description: '舉報內容不具體，已查核無異常。', reporters: ['user_x', 'user_y'] },
  ]
}

function mockBans(): BanRecord[] {
  return [
    { id: 'BAN-001', username: 'baduser_99', userId: '20001', reason: '持續騷擾其他用戶', banType: '永久', operatorName: '管理員 A', createdAt: '2026-03-24 09:00' },
    { id: 'BAN-002', username: 'spammer_007', userId: '20002', reason: '大量發送垃圾廣告', banType: '臨時', expiresAt: '2026-04-07 00:00', operatorName: '管理員 B', createdAt: '2026-03-22 12:30' },
    { id: 'BAN-003', username: 'cheat_king', userId: '20003', reason: '使用外掛作弊', banType: '臨時', expiresAt: '2026-03-31 00:00', operatorName: '管理員 A', createdAt: '2026-03-20 15:00' },
    { id: 'BAN-004', username: 'fraud_acc', userId: '20004', reason: '詐騙其他用戶', banType: '永久', operatorName: '風控組', createdAt: '2026-03-18 11:00' },
  ]
}

function mockUnbans(): UnbanRecord[] {
  return [
    { id: 'UNBAN-001', username: 'old_offender', userId: '20010', unbannedAt: '2026-03-20 14:00', unbannedBy: '管理員 A', note: '已申訴成功，確認誤封' },
    { id: 'UNBAN-002', username: 'temp_banned_01', userId: '20011', unbannedAt: '2026-03-15 09:00', unbannedBy: '管理員 B', note: '臨時封禁到期自動解封' },
    { id: 'UNBAN-003', username: 'reformed_user', userId: '20012', unbannedAt: '2026-03-10 16:30', unbannedBy: '管理員 A', note: '用戶已承諾遵守社群規範' },
  ]
}

function mockKeywords(): SensitiveKeyword[] {
  return [
    { id: 'KW-001', word: '色情网站', category: '色情', addedAt: '2026-03-01 10:00', addedBy: '管理員 A' },
    { id: 'KW-002', word: '殺死你', category: '暴力', addedAt: '2026-03-05 11:00', addedBy: '管理員 B' },
    { id: 'KW-003', word: '免費點數', category: '廣告', addedAt: '2026-03-10 09:00', addedBy: '管理員 A' },
    { id: 'KW-004', word: '政府倒台', category: '政治', addedAt: '2026-03-12 14:00', addedBy: '風控組' },
    { id: 'KW-005', word: '加我微信', category: '廣告', addedAt: '2026-03-15 16:00', addedBy: '管理員 B' },
    { id: 'KW-006', word: '暴力影片', category: '暴力', addedAt: '2026-03-18 10:30', addedBy: '管理員 A' },
    { id: 'KW-007', word: '非法賭博', category: '廣告', addedAt: '2026-03-20 13:00', addedBy: '風控組' },
    { id: 'KW-008', word: '情色直播', category: '色情', addedAt: '2026-03-22 09:00', addedBy: '管理員 A' },
  ]
}

function mockAuditLogs(): AuditLog[] {
  return [
    { id: 'AUD-001', operatedAt: '2026-03-24 09:05', operatorName: '管理員 A', actionType: '封禁', target: 'baduser_99 (ID: 20001)', detail: '永久封禁：持續騷擾其他用戶', ip: '192.168.1.10' },
    { id: 'AUD-002', operatedAt: '2026-03-24 08:50', operatorName: '管理員 B', actionType: '新增敏感詞', target: '情色直播', detail: '類別：色情', ip: '192.168.1.11' },
    { id: 'AUD-003', operatedAt: '2026-03-22 12:35', operatorName: '管理員 B', actionType: '封禁', target: 'spammer_007 (ID: 20002)', detail: '臨時封禁 14 天：大量發送垃圾廣告', ip: '192.168.1.11' },
    { id: 'AUD-004', operatedAt: '2026-03-20 14:05', operatorName: '管理員 A', actionType: '解封', target: 'old_offender (ID: 20010)', detail: '已申訴成功，確認誤封', ip: '192.168.1.10' },
    { id: 'AUD-005', operatedAt: '2026-03-20 11:00', operatorName: '風控組', actionType: '刪除訊息', target: '訊息 ID #48920', detail: '訊息含詐騙連結，已刪除', ip: '10.0.0.5' },
    { id: 'AUD-006', operatedAt: '2026-03-18 11:10', operatorName: '風控組', actionType: '封禁', target: 'fraud_acc (ID: 20004)', detail: '永久封禁：詐騙其他用戶', ip: '10.0.0.5' },
  ]
}

// ─── Label / badge helpers ────────────────────────────────────────────────────

const reportStatusLabel: Record<ReportStatus, string> = {
  pending: '待處理', reviewing: '審查中', resolved: '已處理', dismissed: '已忽略',
}
const reportStatusBadge: Record<ReportStatus, string> = {
  pending: 'bg-amber-500/30 text-amber-50',
  reviewing: 'bg-sky-500/30 text-sky-50',
  resolved: 'bg-emerald-500/30 text-emerald-50',
  dismissed: 'bg-slate-600/40 text-slate-100',
}
const auditActionBadge: Record<AuditActionType, string> = {
  '封禁': 'bg-rose-500/30 text-rose-50',
  '解封': 'bg-emerald-500/30 text-emerald-50',
  '刪除訊息': 'bg-amber-500/30 text-amber-50',
  '新增敏感詞': 'bg-orange-500/30 text-orange-50',
}
const kwCategoryBadge: Record<KeywordCategory, string> = {
  '色情': 'bg-rose-500/30 text-rose-50',
  '暴力': 'bg-amber-500/30 text-amber-50',
  '廣告': 'bg-orange-500/30 text-orange-50',
  '政治': 'bg-slate-600/40 text-slate-100',
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ModerationPage() {
  const [activeTab, setActiveTab] = useState<ModerationTabId>('overview')

  const [reports, setReports] = useState<Report[]>(mockReports)
  const [bans, setBans] = useState<BanRecord[]>(mockBans)
  const [unbans, setUnbans] = useState<UnbanRecord[]>(mockUnbans)
  const [keywords, setKeywords] = useState<SensitiveKeyword[]>(mockKeywords)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs)

  // Filters
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | ReportStatus>('all')
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | ReportType>('all')
  const [banSubTab, setBanSubTab] = useState<'bans' | 'unbans'>('bans')
  const [auditActionFilter, setAuditActionFilter] = useState<'all' | AuditActionType>('all')
  const [auditPage, setAuditPage] = useState(1)
  const PAGE_SIZE = 5

  // Drawers
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [kwDrawerOpen, setKwDrawerOpen] = useState(false)
  const [kwForm, setKwForm] = useState<{ word: string; category: KeywordCategory }>({ word: '', category: '廣告' })

  const now = () => new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  function addAuditLog(actionType: AuditActionType, target: string, detail: string) {
    const entry: AuditLog = {
      id: `AUD-${Date.now()}`,
      operatedAt: now(),
      operatorName: 'Demo Admin',
      actionType,
      target,
      detail,
      ip: '127.0.0.1',
    }
    setAuditLogs(prev => [entry, ...prev])
  }

  // ─── Overview ────────────────────────────────────────────────────────────────
  const overview = useMemo(() => {
    const pending = reports.filter(r => r.status === 'pending').length
    const todayReports = reports.filter(r => r.createdAt.startsWith('2026-03-24')).length
    const weekBans = bans.filter(b => b.createdAt >= '2026-03-18').length
    const kwCount = keywords.length
    const resolved = reports.filter(r => r.status === 'resolved' || r.status === 'dismissed').length
    const resolvedRate = reports.length > 0 ? Math.round((resolved / reports.length) * 100) : 0
    return { pending, todayReports, weekBans, kwCount, resolvedRate }
  }, [reports, bans, keywords])

  // ─── Report handlers ─────────────────────────────────────────────────────────
  async function handleResolve(report: Report) {
    const ok = await showConfirm(`確認將舉報「${report.id}」標記為已處理？\n目標：${report.targetName}`)
    if (!ok) return
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r))
    addAuditLog('刪除訊息', report.targetName, `舉報已處理：${report.reason}`)
    if (selectedReport?.id === report.id) setSelectedReport(null)
  }

  async function handleDismiss(report: Report) {
    const ok = await showConfirm(`確認忽略舉報「${report.id}」？\n目標：${report.targetName}\n忽略後將不再追蹤此舉報。`)
    if (!ok) return
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'dismissed' } : r))
    if (selectedReport?.id === report.id) setSelectedReport(null)
  }

  async function handleBanFromReport(report: Report) {
    const reason = await showPrompt(`請輸入封禁「${report.targetName}」的原因：`, `舉報原因：${report.reason}`)
    if (reason === null) return
    if (!reason.trim()) { await showAlert('請填寫封禁原因。'); return }
    const ok = await showConfirm(
      `⚠️ 高風險操作確認\n\n確認封禁用戶「${report.targetName}」嗎？\n\n原因：${reason.trim()}\n\n此操作將立即生效，請謹慎操作。`
    )
    if (!ok) return
    const entry: BanRecord = {
      id: `BAN-${Date.now()}`,
      username: report.targetName,
      userId: `auto-${Date.now()}`,
      reason: reason.trim(),
      banType: '永久',
      operatorName: 'Demo Admin',
      createdAt: now(),
    }
    setBans(prev => [entry, ...prev])
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r))
    addAuditLog('封禁', `${report.targetName}`, `永久封禁，來自舉報 ${report.id}：${reason.trim()}`)
    if (selectedReport?.id === report.id) setSelectedReport(null)
    await showAlert(`已封禁用戶「${report.targetName}」，舉報已標記為已處理。`)
  }

  // ─── Ban handlers ─────────────────────────────────────────────────────────────
  async function handleUnban(ban: BanRecord) {
    const ok = await showConfirm(`確認解封用戶「${ban.username}」（ID: ${ban.userId}）嗎？\n封禁原因：${ban.reason}`)
    if (!ok) return
    const entry: UnbanRecord = {
      id: `UNBAN-${Date.now()}`,
      username: ban.username,
      userId: ban.userId,
      unbannedAt: now(),
      unbannedBy: 'Demo Admin',
      note: '管理員手動解封',
    }
    setBans(prev => prev.filter(b => b.id !== ban.id))
    setUnbans(prev => [entry, ...prev])
    addAuditLog('解封', `${ban.username} (ID: ${ban.userId})`, '管理員手動解封')
    await showAlert(`已解封用戶「${ban.username}」。`)
  }

  async function handleExtendBan(ban: BanRecord) {
    const days = await showPrompt(`請輸入延長封禁「${ban.username}」的天數：`, '7')
    if (days === null) return
    const d = parseInt(days)
    if (isNaN(d) || d <= 0) { await showAlert('請輸入大於 0 的天數。'); return }
    const base = ban.expiresAt ? new Date(ban.expiresAt) : new Date()
    base.setDate(base.getDate() + d)
    const newExpiry = base.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    setBans(prev => prev.map(b => b.id === ban.id ? { ...b, banType: '臨時', expiresAt: newExpiry } : b))
    addAuditLog('封禁', `${ban.username} (ID: ${ban.userId})`, `延長封禁 ${d} 天，到期：${newExpiry}`)
    await showAlert(`已延長封禁「${ban.username}」${d} 天，新到期時間：${newExpiry}`)
  }

  // ─── Keyword handlers ────────────────────────────────────────────────────────
  async function handleDeleteKeyword(kw: SensitiveKeyword) {
    const ok = await showConfirm(`確認刪除敏感詞「${kw.word}」（${kw.category}）嗎？`)
    if (!ok) return
    setKeywords(prev => prev.filter(k => k.id !== kw.id))
    addAuditLog('刪除訊息', kw.word, `刪除敏感詞，類別：${kw.category}`)
  }

  async function handleAddKeyword() {
    if (!kwForm.word.trim()) { await showAlert('請填寫敏感詞內容。'); return }
    const ok = await showConfirm(`確認新增敏感詞「${kwForm.word.trim()}」（${kwForm.category}）嗎？`)
    if (!ok) return
    const entry: SensitiveKeyword = {
      id: `KW-${Date.now()}`,
      word: kwForm.word.trim(),
      category: kwForm.category,
      addedAt: now(),
      addedBy: 'Demo Admin',
    }
    setKeywords(prev => [entry, ...prev])
    addAuditLog('新增敏感詞', kwForm.word.trim(), `類別：${kwForm.category}`)
    setKwDrawerOpen(false)
    setKwForm({ word: '', category: '廣告' })
  }

  async function handleBulkImportKeywords() {
    const input = await showPrompt('請輸入要批量匯入的敏感詞（以逗號分隔）：', '')
    if (input === null) return
    const words = input.split(',').map(w => w.trim()).filter(Boolean)
    if (words.length === 0) { await showAlert('未輸入任何敏感詞。'); return }
    const ok = await showConfirm(`確認批量匯入 ${words.length} 個敏感詞嗎？\n\n${words.slice(0, 5).join('、')}${words.length > 5 ? `…等 ${words.length} 個` : ''}`)
    if (!ok) return
    const newKws: SensitiveKeyword[] = words.map(w => ({
      id: `KW-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      word: w,
      category: '廣告' as KeywordCategory,
      addedAt: now(),
      addedBy: 'Demo Admin',
    }))
    setKeywords(prev => [...newKws, ...prev])
    addAuditLog('新增敏感詞', `批量匯入 ${words.length} 個`, `詞彙：${words.slice(0, 3).join('、')}…`)
    await showAlert(`已成功匯入 ${words.length} 個敏感詞。`)
  }

  // ─── Filtered / paged data ───────────────────────────────────────────────────
  const filteredReports = useMemo(() => reports.filter(r => {
    if (reportStatusFilter !== 'all' && r.status !== reportStatusFilter) return false
    if (reportTypeFilter !== 'all' && r.type !== reportTypeFilter) return false
    return true
  }), [reports, reportStatusFilter, reportTypeFilter])

  const filteredAudit = useMemo(() =>
    auditActionFilter === 'all' ? auditLogs : auditLogs.filter(a => a.actionType === auditActionFilter),
    [auditLogs, auditActionFilter])

  const auditTotalPages = Math.max(1, Math.ceil(filteredAudit.length / PAGE_SIZE))
  const pagedAudit = useMemo(() => {
    const start = (auditPage - 1) * PAGE_SIZE
    return filteredAudit.slice(start, start + PAGE_SIZE)
  }, [filteredAudit, auditPage])

  // ─── Blueprint features ─────────────────────────────────────────────────────
  const blueprintFeatures: FeatureItem[] = [
    { id: 72, name: '舉報管理', description: '集中管理所有用戶舉報，支援類型（用戶/直播/訊息）與狀態篩選，可快速標記處理或忽略。', tag: '舉報' },
    { id: 73, name: '風控封禁', description: '針對違規用戶快速封禁，支援從舉報一鍵封禁並記錄原因與操作人，寫入 Audit Log。', tag: '風控' },
    { id: 'M1', name: '封禁管理（永久/臨時封禁、自動到期解封）', description: '永久封禁適用嚴重違規，臨時封禁可設定到期時間，到期後自動解封。支援延長封禁天數與手動解封。', tag: '封禁' },
    { id: 'M2', name: '敏感詞批量管理', description: '支援單筆新增與逗號分隔批量匯入敏感詞，並可按類別（色情/暴力/廣告/政治）分類管理與刪除。', tag: '敏感詞' },
    { id: 'M3', name: 'Audit Log 查詢與匯出', description: '所有風控操作（封禁/解封/刪除訊息/新增敏感詞）皆自動寫入 Audit Log，支援按操作類型篩選與 CSV 匯出。', tag: 'Audit' },
  ]


  // ─── Render ────────────────────────────────────────────────────────────────

  const tabs: { id: ModerationTabId; label: string; color: string }[] = [
    { id: 'overview', label: '總覽', color: 'bg-slate-700' },
    { id: 'reports', label: '舉報列表', color: 'bg-rose-600' },
    { id: 'bans', label: '封禁管理', color: 'bg-amber-600' },
    { id: 'keywords', label: '敏感詞', color: 'bg-orange-600' },
    { id: 'audit', label: 'Audit Log', color: 'bg-slate-600' },
    { id: 'blueprint', label: '功能清單', color: 'bg-slate-700' },
  ]

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-xs font-semibold text-slate-100">舉報與風控</span>
          <span className="text-[10px] text-slate-500">舉報 / 封禁 / 敏感詞 / Audit Log</span>
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
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold">風控總覽</span>
            </div>
            <span className="text-[10px] text-slate-500">舉報 / 封禁 / 敏感詞快速統計。</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-[11px]">
            <div className="space-y-1 rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><AlertTriangle className="h-3.5 w-3.5 text-rose-400" />待處理舉報</div>
              <div className="text-2xl font-semibold text-rose-100">{overview.pending}</div>
              <p className="text-[10px] text-rose-200/80">狀態為 pending 的舉報。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-amber-600/60 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><Flag className="h-3.5 w-3.5 text-amber-400" />今日新增舉報</div>
              <div className="text-2xl font-semibold text-amber-100">{overview.todayReports}</div>
              <p className="text-[10px] text-amber-200/80">今日（2026-03-24）新增的舉報。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><Ban className="h-3.5 w-3.5 text-rose-400" />本週封禁人數</div>
              <div className="text-2xl font-semibold text-rose-100">{overview.weekBans}</div>
              <p className="text-[10px] text-rose-200/80">本週（2026-03-18 起）新增封禁。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-orange-600/60 bg-orange-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><BookX className="h-3.5 w-3.5 text-orange-400" />敏感詞總數</div>
              <div className="text-2xl font-semibold text-orange-100">{overview.kwCount}</div>
              <p className="text-[10px] text-orange-200/80">目前系統中的敏感詞數量。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-emerald-600/60 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />已處理舉報率</div>
              <div className="text-2xl font-semibold text-emerald-100">{overview.resolvedRate}%</div>
              <p className="text-[10px] text-emerald-200/80">已處理 + 已忽略佔總舉報比例。</p>
            </div>
          </div>
        </section>
      )}

      {/* ── 舉報列表 ─────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <section className="space-y-3 rounded-2xl border border-rose-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-semibold">舉報列表</span>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100">詳情 · 處理 · 忽略 · 封禁</span>
            </div>
            <div className="flex items-center gap-2">
              <select value={reportTypeFilter} onChange={e => setReportTypeFilter(e.target.value as any)}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部類型</option>
                <option value="用戶">用戶</option>
                <option value="直播">直播</option>
                <option value="訊息">訊息</option>
              </select>
              <select value={reportStatusFilter} onChange={e => setReportStatusFilter(e.target.value as any)}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部狀態</option>
                <option value="pending">待處理</option>
                <option value="reviewing">審查中</option>
                <option value="resolved">已處理</option>
                <option value="dismissed">已忽略</option>
              </select>
            </div>
          </header>
          <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-rose-100">
                <tr>
                  {['#', '舉報 ID', '類型', '被舉報對象', '舉報原因', '舉報人數', '狀態', '建立時間', '操作'].map(h => (
                    <th key={h} className="border-b border-rose-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r, i) => (
                  <tr key={r.id} className="border-b border-rose-600/30 text-rose-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                    <td className="px-2 py-1.5 text-[10px] text-rose-100/80">{r.id}</td>
                    <td className="px-2 py-1.5">
                      <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-100">{r.type}</span>
                    </td>
                    <td className="px-2 py-1.5 font-medium">{r.targetName}</td>
                    <td className="px-2 py-1.5">
                      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100">{r.reason}</span>
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">{r.reportCount}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${reportStatusBadge[r.status]}`}>{reportStatusLabel[r.status]}</span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-rose-100/80">{r.createdAt}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <button onClick={() => setSelectedReport(r)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-50 hover:bg-rose-500/30">
                          <Eye className="h-3 w-3" />詳情
                        </button>
                        {(r.status === 'pending' || r.status === 'reviewing') && (
                          <>
                            <button onClick={() => handleResolve(r)}
                              className="inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500">處理</button>
                            <button onClick={() => handleDismiss(r)}
                              className="inline-flex rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-white hover:bg-slate-600">忽略</button>
                            <button onClick={() => handleBanFromReport(r)}
                              className="inline-flex rounded-full bg-rose-700 px-2 py-0.5 text-[10px] text-white hover:bg-rose-600">封禁</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-rose-100/80">目前沒有符合條件的舉報。</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 封禁管理 ─────────────────────────────────────────────────────── */}
      {activeTab === 'bans' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">封禁管理</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
              <button type="button" onClick={() => setBanSubTab('bans')}
                className={['rounded-full px-2 py-0.5 text-[10px]', banSubTab === 'bans' ? 'bg-amber-600 text-white' : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
                封禁用戶
              </button>
              <button type="button" onClick={() => setBanSubTab('unbans')}
                className={['rounded-full px-2 py-0.5 text-[10px]', banSubTab === 'unbans' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}>
                解封記錄
              </button>
            </div>
          </header>

          {banSubTab === 'bans' && (
            <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-900/90 text-amber-100">
                  <tr>
                    {['#', '封禁 ID', '用戶名稱', '用戶 ID', '封禁原因', '封禁類型', '到期時間', '操作人', '建立時間', '操作'].map(h => (
                      <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bans.map((b, i) => (
                    <tr key={b.id} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                      <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                      <td className="px-2 py-1.5 text-[10px] text-amber-100/80">{b.id}</td>
                      <td className="px-2 py-1.5 font-medium">{b.username}</td>
                      <td className="px-2 py-1.5 text-[10px] text-amber-100/80">{b.userId}</td>
                      <td className="px-2 py-1.5 max-w-[120px] truncate">{b.reason}</td>
                      <td className="px-2 py-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${b.banType === '永久' ? 'bg-rose-500/40 text-rose-50' : 'bg-amber-500/30 text-amber-50'}`}>
                          {b.banType}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-[10px] text-amber-100/80">{b.expiresAt ?? '永久'}</td>
                      <td className="px-2 py-1.5 text-[10px] text-amber-100/80">{b.operatorName}</td>
                      <td className="px-2 py-1.5 text-[10px] text-amber-100/80">{b.createdAt}</td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleUnban(b)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500">
                            <CheckCircle2 className="h-3 w-3" />解封
                          </button>
                          <button onClick={() => handleExtendBan(b)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] text-white hover:bg-amber-500">
                            延長
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bans.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-6 text-center text-amber-100/80">目前沒有封禁用戶。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {banSubTab === 'unbans' && (
            <div className="overflow-hidden rounded-xl border border-emerald-600/60 bg-slate-950/80">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-900/90 text-emerald-100">
                  <tr>
                    {['#', 'ID', '用戶', '解封時間', '解封人員', '備註'].map(h => (
                      <th key={h} className="border-b border-emerald-600/60 px-2 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unbans.map((u, i) => (
                    <tr key={u.id} className="border-b border-emerald-600/30 text-emerald-50 last:border-b-0">
                      <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                      <td className="px-2 py-1.5 text-[10px] text-emerald-100/80">{u.id}</td>
                      <td className="px-2 py-1.5">
                        <div className="font-medium">{u.username}</div>
                        <div className="text-[10px] text-emerald-100/80">ID: {u.userId}</div>
                      </td>
                      <td className="px-2 py-1.5 text-[10px] text-emerald-100/80">{u.unbannedAt}</td>
                      <td className="px-2 py-1.5">{u.unbannedBy}</td>
                      <td className="px-2 py-1.5 text-[10px] text-emerald-100/80">{u.note ?? '—'}</td>
                    </tr>
                  ))}
                  {unbans.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-emerald-100/80">目前沒有解封記錄。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── 敏感詞管理 ───────────────────────────────────────────────────── */}
      {activeTab === 'keywords' && (
        <section className="space-y-3 rounded-2xl border border-orange-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <BookX className="h-3.5 w-3.5 text-orange-400" />
              <span className="font-semibold">敏感詞管理</span>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] text-orange-100">
                共 {keywords.length} 個敏感詞
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleBulkImportKeywords}
                className="inline-flex items-center gap-1 rounded-full border border-orange-600/60 bg-orange-500/10 px-2 py-1 text-[10px] text-orange-100 hover:bg-orange-500/20">
                批量匯入
              </button>
              <button onClick={() => setKwDrawerOpen(true)}
                className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-orange-500">
                <PlusCircle className="h-3 w-3" />新增敏感詞
              </button>
            </div>
          </header>
          <div className="overflow-hidden rounded-xl border border-orange-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-orange-100">
                <tr>
                  {['#', '敏感詞', '類別', '新增時間', '操作人', '操作'].map(h => (
                    <th key={h} className="border-b border-orange-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, i) => (
                  <tr key={kw.id} className="border-b border-orange-600/30 text-orange-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                    <td className="px-2 py-1.5 font-medium">{kw.word}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${kwCategoryBadge[kw.category]}`}>{kw.category}</span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-orange-100/80">{kw.addedAt}</td>
                    <td className="px-2 py-1.5 text-[10px] text-orange-100/80">{kw.addedBy}</td>
                    <td className="px-2 py-1.5 text-right">
                      <button onClick={() => handleDeleteKeyword(kw)}
                        className="inline-flex items-center gap-0.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500">
                        <Trash2 className="h-3 w-3" />刪除
                      </button>
                    </td>
                  </tr>
                ))}
                {keywords.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-orange-100/80">目前沒有敏感詞。</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Audit Log ────────────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <section className="space-y-3 rounded-2xl border border-slate-700/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold">Audit Log</span>
              <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-100">操作記錄查詢</span>
            </div>
            <div className="flex items-center gap-2">
              <select value={auditActionFilter} onChange={e => { setAuditActionFilter(e.target.value as any); setAuditPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100">
                <option value="all">全部操作</option>
                <option value="封禁">封禁</option>
                <option value="解封">解封</option>
                <option value="刪除訊息">刪除訊息</option>
                <option value="新增敏感詞">新增敏感詞</option>
              </select>
              <button onClick={async () => await showAlert('示意：依當前篩選條件匯出 Audit Log CSV。')}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700">
                匯出 CSV
              </button>
            </div>
          </header>
          <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-slate-100">
                <tr>
                  {['#', '操作時間', '操作人', '操作類型', '目標對象', '詳情', 'IP'].map(h => (
                    <th key={h} className="border-b border-slate-700/60 px-2 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedAudit.map((a, i) => (
                  <tr key={a.id} className="border-b border-slate-700/30 text-slate-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(auditPage - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-300">{a.operatedAt}</td>
                    <td className="px-2 py-1.5 font-medium">{a.operatorName}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${auditActionBadge[a.actionType]}`}>{a.actionType}</span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-200">{a.target}</td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-400 max-w-[160px] truncate">{a.detail}</td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-500">{a.ip}</td>
                  </tr>
                ))}
                {pagedAudit.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">目前沒有符合條件的 Audit Log。</td></tr>
                )}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-slate-700/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>總筆數：{filteredAudit.length} · 每頁 {PAGE_SIZE} 筆</div>
              <div className="flex items-center gap-1">
                <button type="button" disabled={auditPage <= 1} onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">
                  <ChevronLeft className="h-3 w-3" />上一頁
                </button>
                <span>第 {auditPage} / {auditTotalPages} 頁</span>
                <button type="button" disabled={auditPage >= auditTotalPages} onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">
                  下一頁<ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* ── 功能清單 ─────────────────────────────────────────────────────── */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="舉報與風控功能清單"
          subtitle="對齊舉報處理、封禁管理、敏感詞、Audit Log 的完整風控鏈路。"
          items={blueprintFeatures}
        />
      )}

      {/* ── 舉報詳情 Drawer ──────────────────────────────────────────────── */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-rose-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-rose-700/60 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-rose-100">
                  <Flag className="h-3.5 w-3.5 text-rose-400" />
                  <span className="font-semibold">舉報詳情</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-rose-200/80">{selectedReport.id} · {selectedReport.targetName}</p>
              </div>
              <button onClick={() => setSelectedReport(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-700/80 bg-slate-900/80 text-rose-200 hover:border-rose-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-rose-50 space-y-3">
              <div className="space-y-1.5 rounded-xl border border-rose-700/60 bg-slate-900/80 p-3">
                <div className="flex justify-between"><span className="text-rose-200/70">舉報 ID</span><span className="font-medium">{selectedReport.id}</span></div>
                <div className="flex justify-between"><span className="text-rose-200/70">類型</span><span>{selectedReport.type}</span></div>
                <div className="flex justify-between"><span className="text-rose-200/70">被舉報對象</span><span className="font-semibold">{selectedReport.targetName}</span></div>
                <div className="flex justify-between"><span className="text-rose-200/70">舉報原因</span>
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100">{selectedReport.reason}</span>
                </div>
                <div className="flex justify-between"><span className="text-rose-200/70">舉報人數</span><span>{selectedReport.reportCount}</span></div>
                <div className="flex justify-between"><span className="text-rose-200/70">狀態</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${reportStatusBadge[selectedReport.status]}`}>{reportStatusLabel[selectedReport.status]}</span>
                </div>
                <div className="flex justify-between"><span className="text-rose-200/70">建立時間</span><span>{selectedReport.createdAt}</span></div>
              </div>
              {selectedReport.description && (
                <div className="rounded-xl border border-rose-700/60 bg-slate-900/80 p-3">
                  <div className="text-[11px] font-semibold text-rose-100 mb-1">舉報內容描述</div>
                  <div className="text-[11px] text-rose-100/90">{selectedReport.description}</div>
                </div>
              )}
              {selectedReport.reporters && selectedReport.reporters.length > 0 && (
                <div className="rounded-xl border border-rose-700/60 bg-slate-900/80 p-3">
                  <div className="text-[11px] font-semibold text-rose-100 mb-1">舉報人列表</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedReport.reporters.map((r, idx) => (
                      <span key={idx} className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-100">{r}</span>
                    ))}
                  </div>
                </div>
              )}
              {(selectedReport.status === 'pending' || selectedReport.status === 'reviewing') && (
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleResolve(selectedReport)}
                    className="rounded-full bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-emerald-500 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />標記已處理
                  </button>
                  <button onClick={() => handleDismiss(selectedReport)}
                    className="rounded-full bg-slate-700 px-3 py-2 text-[11px] text-white hover:bg-slate-600 flex items-center justify-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />忽略舉報
                  </button>
                  <button onClick={() => handleBanFromReport(selectedReport)}
                    className="rounded-full bg-rose-700 px-3 py-2 text-[11px] text-white hover:bg-rose-600 flex items-center justify-center gap-1">
                    <Ban className="h-3.5 w-3.5" />封禁用戶（高風險）
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ── 新增敏感詞 Drawer ─────────────────────────────────────────────── */}
      {kwDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-sm flex-col border-l border-orange-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-orange-700/60 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-orange-100">
                <PlusCircle className="h-3.5 w-3.5 text-orange-400" />
                <span className="font-semibold">新增敏感詞</span>
              </div>
              <button onClick={() => { setKwDrawerOpen(false); setKwForm({ word: '', category: '廣告' }) }}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-orange-700/80 bg-slate-900/80 text-orange-200 hover:border-orange-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-orange-50">
              <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleAddKeyword() }}>
                <div className="space-y-1">
                  <label className="block text-[11px] text-orange-100">敏感詞內容</label>
                  <input value={kwForm.word} onChange={e => setKwForm(p => ({ ...p, word: e.target.value }))}
                    className="h-7 w-full rounded-md border border-orange-700/80 bg-slate-950/80 px-2 text-[11px] text-orange-50 outline-none focus:border-orange-400"
                    placeholder="輸入敏感詞" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-orange-100">類別</label>
                  <select value={kwForm.category} onChange={e => setKwForm(p => ({ ...p, category: e.target.value as KeywordCategory }))}
                    className="h-7 w-full rounded-md border border-orange-700/80 bg-slate-950/80 px-2 text-[11px] text-orange-50 outline-none focus:border-orange-400">
                    <option value="色情">色情</option>
                    <option value="暴力">暴力</option>
                    <option value="廣告">廣告</option>
                    <option value="政治">政治</option>
                  </select>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => { setKwDrawerOpen(false); setKwForm({ word: '', category: '廣告' }) }}
                    className="inline-flex rounded-full border border-orange-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-orange-100 hover:bg-slate-800/80">取消</button>
                  <button type="submit"
                    className="inline-flex rounded-full bg-orange-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-orange-500">新增</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default ModerationPage
