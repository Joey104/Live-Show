/**
 * @file SystemSettingsPage.tsx
 * @description 系統設定工作台（公告 / 敏感詞庫 / 收益配置 / 系統資訊 / 功能清單）
 */

import { useState, useMemo } from 'react'
import { showAlert, showConfirm, showPrompt } from '../../lib/dialog'
import {
  Settings, Megaphone, ShieldAlert, BadgeDollarSign, Server,
  ListChecks, PlusCircle, Trash2, Edit3, Eye, ChevronDown,
  Copy, Activity, CheckCircle2, AlertTriangle, XCircle,
  UploadCloud, ArrowRight, Clock, History,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Types ────────────────────────────────────────────────────────────────────

type SystemTabId = 'overview' | 'announcements' | 'keywords' | 'revenue' | 'system' | 'blueprint'

type AnnouncementPriority = 'high' | 'normal' | 'low'
type AnnouncementStatus = 'active' | 'scheduled' | 'expired'

interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority
  status: AnnouncementStatus
  publishedAt: string
  expiresAt?: string
}

type KeywordCategory = '色情' | '暴力' | '廣告' | '政治' | '其他'
type KeywordLevel = 1 | 2 | 3

interface SensitiveKeyword {
  id: string
  word: string
  category: KeywordCategory
  level: KeywordLevel
  createdAt: string
  createdBy: string
}

interface CommissionChangeRecord {
  id: string
  changedAt: string
  changedBy: string
  oldRate: number
  newRate: number
  effectType: '立即生效' | '下次結算生效'
  note?: string
}

interface WithdrawalFeeChangeRecord {
  id: string
  changedAt: string
  changedBy: string
  feeType: '比例' | '固定金額'
  oldValue: number
  newValue: number
}

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  responseMs: number
  checkedAt: string
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function ts(offsetHours = 0) {
  const d = new Date(Date.now() - offsetHours * 3_600_000)
  return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ANN-001',
    title: '系統維護通知',
    content: '本平台將於 2026/03/30 凌晨 02:00~04:00 進行系統維護，期間服務將暫停，敬請提前安排。感謝您的配合！',
    priority: 'high',
    status: 'active',
    publishedAt: ts(72),
    expiresAt: ts(-240),
  },
  {
    id: 'ANN-002',
    title: '新功能上線：禮物特效升級',
    content: '全新禮物特效系統正式上線！包含3D動態特效、連擊combo、以及限定節日主題禮物，歡迎主播與用戶體驗。',
    priority: 'normal',
    status: 'active',
    publishedAt: ts(48),
  },
  {
    id: 'ANN-003',
    title: '平台週年慶活動預告',
    content: '平台成立週年慶即將展開，多重好禮等你來拿！充值雙倍點數、限定徽章、以及主播收益加成活動，敬請期待。',
    priority: 'normal',
    status: 'scheduled',
    publishedAt: ts(-168),
    expiresAt: ts(-336),
  },
  {
    id: 'ANN-004',
    title: '服務條款更新公告',
    content: '根據最新法規要求，我們已更新平台服務條款第 5 條及第 12 條，主要涉及用戶隱私保護與內容責任歸屬。',
    priority: 'low',
    status: 'expired',
    publishedAt: ts(720),
    expiresAt: ts(168),
  },
]

const MOCK_KEYWORDS: SensitiveKeyword[] = [
  { id: 'KW-001', word: '私下交易', category: '廣告', level: 2, createdAt: ts(200), createdBy: 'admin' },
    { id: 'KW-002', word: '色情直播', category: '色情', level: 3, createdAt: ts(180), createdBy: 'admin' },
  { id: 'KW-003', word: '殺人', category: '暴力', level: 3, createdAt: ts(160), createdBy: 'moderator' },
  { id: 'KW-004', word: '加LINE', category: '廣告', level: 1, createdAt: ts(140), createdBy: 'moderator' },
  { id: 'KW-005', word: '台獨', category: '政治', level: 2, createdAt: ts(120), createdBy: 'admin' },
  { id: 'KW-006', word: '未成年', category: '色情', level: 3, createdAt: ts(100), createdBy: 'admin' },
  { id: 'KW-007', word: '賭博網站', category: '廣告', level: 2, createdAt: ts(80), createdBy: 'moderator' },
  { id: 'KW-008', word: '暴恐', category: '暴力', level: 3, createdAt: ts(60), createdBy: 'admin' },
]

const MOCK_COMMISSION_HISTORY: CommissionChangeRecord[] = [
  { id: 'CH-001', changedAt: ts(720), changedBy: 'superadmin', oldRate: 25, newRate: 30, effectType: '下次結算生效', note: '季度調整' },
  { id: 'CH-002', changedAt: ts(1440), changedBy: 'superadmin', oldRate: 28, newRate: 25, effectType: '立即生效', note: '促銷期間優惠' },
  { id: 'CH-003', changedAt: ts(2160), changedBy: 'admin', oldRate: 30, newRate: 28, effectType: '下次結算生效' },
]

const MOCK_FEE_HISTORY: WithdrawalFeeChangeRecord[] = [
  { id: 'FH-001', changedAt: ts(500), changedBy: 'superadmin', feeType: '比例', oldValue: 2, newValue: 1.5 },
  { id: 'FH-002', changedAt: ts(1200), changedBy: 'superadmin', feeType: '固定金額', oldValue: 50, newValue: 30 },
  { id: 'FH-003', changedAt: ts(2000), changedBy: 'admin', feeType: '比例', oldValue: 2.5, newValue: 2 },
]

const MOCK_SERVICES: ServiceStatus[] = [
  { name: 'API Gateway', status: 'healthy', responseMs: 42, checkedAt: ts(0) },
  { name: 'PostgreSQL DB', status: 'healthy', responseMs: 8, checkedAt: ts(0) },
  { name: 'Redis Cache', status: 'healthy', responseMs: 3, checkedAt: ts(0) },
  { name: 'Media CDN', status: 'degraded', responseMs: 890, checkedAt: ts(0) },
  { name: 'WebSocket Server', status: 'healthy', responseMs: 15, checkedAt: ts(0) },
]

const BLUEPRINT_FEATURES: FeatureItem[] = [
  { id: 77, name: '平台公告發布', description: '新增 / 刪除公告，支援排序與定時發布，並記錄操作人與時間。', tag: '公告' },
  { id: 78, name: '敏感詞管理', description: '新增 / 刪除 / 批量匯入敏感詞，顯示匯入結果（成功 / 失敗數量與原因）。', tag: '詞庫' },
  { id: 79, name: '抽成比例設定', description: '設定禮物平台抽成 %，需顯示生效時間（立即 / 下次結算），並與收益報表對齊。', tag: '經濟' },
  { id: 80, name: '管理員帳號管理（過渡）', description: '若 RBAC 已上線，可將此處作為旁路入口或整合視圖，避免重複配置。', tag: '過渡' },
  { id: 81, name: '系統版本資訊', description: '顯示後端版本 / Node 版本與部署資訊，方便排查問題與版本對齊。', tag: '資訊' },
  { id: 82, name: '主題切換', description: '支援亮色 / 暗色模式切換，並在全域樣式上保持可讀性與色彩對比度。', tag: '體驗' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priorityLabel(p: AnnouncementPriority) {
  if (p === 'high') return { label: '高', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' }
  if (p === 'normal') return { label: '一般', cls: 'bg-sky-500/20 text-sky-400 border border-sky-500/30' }
  return { label: '低', cls: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' }
}

function statusLabel(s: AnnouncementStatus) {
  if (s === 'active') return { label: '上架中', cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' }
  if (s === 'scheduled') return { label: '排程中', cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' }
  return { label: '已到期', cls: 'bg-slate-600/20 text-slate-500 border border-slate-600/30' }
}

function categoryColor(c: KeywordCategory) {
  const m: Record<KeywordCategory, string> = {
    色情: 'bg-pink-500/20 text-pink-400',
    暴力: 'bg-red-500/20 text-red-400',
    廣告: 'bg-orange-500/20 text-orange-400',
    政治: 'bg-purple-500/20 text-purple-400',
    其他: 'bg-slate-500/20 text-slate-400',
  }
  return m[c]
}

function levelBadge(l: KeywordLevel) {
  if (l === 3) return 'bg-red-600/30 text-red-300 border border-red-600/40'
  if (l === 2) return 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
  return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
}

function serviceStatusBadge(s: ServiceStatus['status']) {
  if (s === 'healthy') return { label: 'Healthy', cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' }
  if (s === 'degraded') return { label: 'Degraded', cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' }
  return { label: 'Down', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SystemSettingsPage() {
  const [tab, setTab] = useState<SystemTabId>('overview')

  // ── Announcements state ──
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS)
  const [showAnnDrawer, setShowAnnDrawer] = useState(false)
  const [annForm, setAnnForm] = useState({
    title: '',
    content: '',
    priority: 'normal' as AnnouncementPriority,
    publishMode: 'immediate' as 'immediate' | 'scheduled',
    scheduledAt: '',
    expiresAt: '',
  })

  // ── Keywords state ──
  const [keywords, setKeywords] = useState<SensitiveKeyword[]>(MOCK_KEYWORDS)
  const [showKwDrawer, setShowKwDrawer] = useState(false)
  const [kwForm, setKwForm] = useState({
    word: '',
    category: '其他' as KeywordCategory,
    level: 1 as KeywordLevel,
  })

  // ── Revenue state ──
  const [commissionRate, setCommissionRate] = useState(30)
  const [commissionHistory, setCommissionHistory] = useState<CommissionChangeRecord[]>(MOCK_COMMISSION_HISTORY)
  const [showCommDrawer, setShowCommDrawer] = useState(false)
  const [commForm, setCommForm] = useState({ newRate: 30, effectType: '立即生效' as '立即生效' | '下次結算生效', note: '' })

  const [withdrawalFeeType, setWithdrawalFeeType] = useState<'比例' | '固定金額'>('比例')
  const [withdrawalFeeValue, setWithdrawalFeeValue] = useState(1.5)
  const [feeHistory, setFeeHistory] = useState<WithdrawalFeeChangeRecord[]>(MOCK_FEE_HISTORY)
  const [showFeeDrawer, setShowFeeDrawer] = useState(false)
  const [feeForm, setFeeForm] = useState({ feeType: '比例' as '比例' | '固定金額', value: 1.5 })

  // ─── Overview stats ───────────────────────────────────────────────────────

  const overviewStats = useMemo(() => ({
    activeAnnouncements: announcements.filter(a => a.status === 'active').length,
    totalKeywords: keywords.length,
    commissionRate,
    version: 'v2.3.1',
    lastUpdated: ts(2),
  }), [announcements, keywords, commissionRate])

  // ─── Announcement handlers ────────────────────────────────────────────────

  async function handleAnnDetail(ann: Announcement) {
    await showAlert(`【${ann.title}】\n\n${ann.content}\n\n優先級：${priorityLabel(ann.priority).label}　狀態：${statusLabel(ann.status).label}\n發布時間：${ann.publishedAt}${ann.expiresAt ? '\n到期時間：' + ann.expiresAt : ''}`)
  }

  async function handleAnnUnpublish(ann: Announcement) {
    const ok = await showConfirm(`確定要下架公告「${ann.title}」嗎？`)
    if (!ok) return
    setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, status: 'expired' } : a))
  }

  async function handleAnnDelete(ann: Announcement) {
    const ok = await showConfirm(`確定要刪除公告「${ann.title}」？此操作不可復原。`)
    if (!ok) return
    setAnnouncements(prev => prev.filter(a => a.id !== ann.id))
  }

  async function handleAnnPublish() {
    if (!annForm.title.trim() || !annForm.content.trim()) {
      await showAlert('請填寫標題與內容')
      return
    }
    const ok = await showConfirm(`確定要發布公告「${annForm.title}」嗎？`)
    if (!ok) return
    const newAnn: Announcement = {
      id: `ANN-${String(announcements.length + 1).padStart(3, '0')}`,
      title: annForm.title,
      content: annForm.content,
      priority: annForm.priority,
      status: annForm.publishMode === 'immediate' ? 'active' : 'scheduled',
      publishedAt: annForm.publishMode === 'immediate' ? ts(0) : (annForm.scheduledAt || ts(0)),
      expiresAt: annForm.expiresAt || undefined,
    }
    setAnnouncements(prev => [newAnn, ...prev])
    setShowAnnDrawer(false)
    setAnnForm({ title: '', content: '', priority: 'normal', publishMode: 'immediate', scheduledAt: '', expiresAt: '' })
  }

  // ─── Keyword handlers ─────────────────────────────────────────────────────

  async function handleKwDelete(kw: SensitiveKeyword) {
    const ok = await showConfirm(`確定要刪除敏感詞「${kw.word}」嗎？`)
    if (!ok) return
    setKeywords(prev => prev.filter(k => k.id !== kw.id))
  }

  function handleKwLevelChange(id: string, level: KeywordLevel) {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, level } : k))
  }

  async function handleKwAdd() {
    if (!kwForm.word.trim()) {
      await showAlert('請輸入敏感詞')
      return
    }
    const ok = await showConfirm(`確定要新增敏感詞「${kwForm.word}」嗎？`)
    if (!ok) return
    const newKw: SensitiveKeyword = {
      id: `KW-${String(keywords.length + 1).padStart(3, '0')}`,
      word: kwForm.word,
      category: kwForm.category,
      level: kwForm.level,
      createdAt: ts(0),
      createdBy: 'admin',
    }
    setKeywords(prev => [newKw, ...prev])
    setShowKwDrawer(false)
    setKwForm({ word: '', category: '其他', level: 1 })
  }

  async function handleKwBulkImport() {
    const raw = await showPrompt('請輸入敏感詞（逗號分隔）：')
    if (!raw) return
    const words = raw.split(',').map(w => w.trim()).filter(Boolean)
    if (words.length === 0) return
    const newKws: SensitiveKeyword[] = words.map((w, i) => ({
      id: `KW-B${Date.now()}-${i}`,
      word: w,
      category: '其他',
      level: 1,
      createdAt: ts(0),
      createdBy: 'admin',
    }))
    setKeywords(prev => [...newKws, ...prev])
    await showAlert(`成功新增 ${words.length} 個敏感詞`)
  }

  // ─── Revenue handlers ─────────────────────────────────────────────────────

  async function handleCommissionSave() {
    if (commForm.newRate < 0 || commForm.newRate > 100) {
      await showAlert('比例需介於 0~100%')
      return
    }
    const ok = await showConfirm(`確定要將平台抽成率從 ${commissionRate}% 調整為 ${commForm.newRate}%（${commForm.effectType}）？`)
    if (!ok) return
    const record: CommissionChangeRecord = {
      id: `CH-${Date.now()}`,
      changedAt: ts(0),
      changedBy: 'admin',
      oldRate: commissionRate,
      newRate: commForm.newRate,
      effectType: commForm.effectType,
      note: commForm.note,
    }
    setCommissionHistory(prev => [record, ...prev])
    setCommissionRate(commForm.newRate)
    setShowCommDrawer(false)
  }

  async function handleFeeSave() {
    const ok = await showConfirm(`確定要將出金手續費調整為${feeForm.feeType === '比例' ? feeForm.value + '%' : feeForm.value + ' PHP'}？`)
    if (!ok) return
    const record: WithdrawalFeeChangeRecord = {
      id: `FH-${Date.now()}`,
      changedAt: ts(0),
      changedBy: 'admin',
      feeType: feeForm.feeType,
      oldValue: withdrawalFeeValue,
      newValue: feeForm.value,
    }
    setFeeHistory(prev => [record, ...prev])
    setWithdrawalFeeType(feeForm.feeType)
    setWithdrawalFeeValue(feeForm.value)
    setShowFeeDrawer(false)
  }

  async function handleCopyInfo(label: string, value: string) {
    await showAlert(`已複製 ${label}：${value}`)
  }

  async function handleGoBonusSettings() {
    await showAlert('即將跳轉至 Bonus 管理設定頁面…（示意）')
  }


  // ─── Tabs config ──────────────────────────────────────────────────────────

  const TABS: { id: SystemTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '總覽', icon: <Settings size={13} /> },
    { id: 'announcements', label: '平台公告', icon: <Megaphone size={13} /> },
    { id: 'keywords', label: '敏感詞庫', icon: <ShieldAlert size={13} /> },
    { id: 'revenue', label: '收益配置', icon: <BadgeDollarSign size={13} /> },
    { id: 'system', label: '系統資訊', icon: <Server size={13} /> },
    { id: 'blueprint', label: '功能清單', icon: <ListChecks size={13} /> },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3 p-1">

      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-1.5 text-[11px]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-colors ${
              tab === t.id
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 總覽 ── */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
            <span className="font-medium text-slate-300">系統設定總覽</span>
            <span className="text-slate-500">快速掌握平台核心配置狀態</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: '有效公告數', value: overviewStats.activeAnnouncements, unit: '則', color: 'sky' },
              { label: '敏感詞總數', value: overviewStats.totalKeywords, unit: '筆', color: 'rose' },
              { label: '平台抽成率', value: overviewStats.commissionRate, unit: '%', color: 'emerald' },
              { label: '系統版本', value: overviewStats.version, unit: '', color: 'slate' },
              { label: '最後設定更新', value: overviewStats.lastUpdated, unit: '', color: 'slate', small: true },
            ].map(card => (
              <div key={card.label} className={`rounded-2xl border border-${card.color}-600/30 bg-slate-950/80 p-4 space-y-1`}>
                <div className="text-[10px] text-slate-500">{card.label}</div>
                <div className={`font-bold text-${card.color}-400 ${card.small ? 'text-sm' : 'text-2xl'}`}>
                  {card.value}{card.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 平台公告 ── */}
      {tab === 'announcements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
            <span className="font-medium text-sky-300 flex items-center gap-1.5"><Megaphone size={12} />平台公告管理</span>
            <button
              onClick={() => setShowAnnDrawer(true)}
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1 text-white hover:bg-sky-500 transition-colors"
            >
              <PlusCircle size={11} /> 新增公告
            </button>
          </div>

          <div className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
            <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
              <table className="w-full text-[11px]">
                <thead className="bg-sky-950/60 text-sky-300">
                  <tr>
                    {['#', '公告 ID', '標題', '內容摘要', '優先級', '狀態', '發布時間', '到期時間', '操作'].map(h => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((ann, i) => {
                    const pri = priorityLabel(ann.priority)
                    const st = statusLabel(ann.status)
                    return (
                      <tr key={ann.id} className="border-t border-sky-900/30 hover:bg-sky-950/20 transition-colors">
                        <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-sky-400">{ann.id}</td>
                        <td className="px-3 py-2 text-slate-200 max-w-[120px] truncate">{ann.title}</td>
                        <td className="px-3 py-2 text-slate-400 max-w-[160px]">
                          {ann.content.length > 40 ? ann.content.slice(0, 40) + '…' : ann.content}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${pri.cls}`}>{pri.label}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{ann.publishedAt}</td>
                        <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{ann.expiresAt || '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleAnnDetail(ann)} className="rounded px-2 py-0.5 text-sky-400 hover:bg-sky-900/40 transition-colors"><Eye size={11} /></button>
                            {ann.status !== 'expired' && (
                              <button onClick={() => handleAnnUnpublish(ann)} className="rounded px-2 py-0.5 text-yellow-400 hover:bg-yellow-900/30 transition-colors text-[10px]">下架</button>
                            )}
                            <button onClick={() => handleAnnDelete(ann)} className="rounded px-2 py-0.5 text-red-400 hover:bg-red-900/30 transition-colors"><Trash2 size={11} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Announcement Drawer */}
          {showAnnDrawer && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setShowAnnDrawer(false)}>
              <aside
                className="flex h-full w-full max-w-md flex-col border-l border-sky-700/50 bg-slate-950"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-sky-800/50 px-4 py-3">
                  <span className="text-sm font-medium text-sky-300 flex items-center gap-1.5"><PlusCircle size={14} /> 新增公告</span>
                  <button onClick={() => setShowAnnDrawer(false)} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 p-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-sky-300">標題</label>
                    <input
                      className="w-full rounded-lg border border-sky-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                      placeholder="公告標題"
                      value={annForm.title}
                      onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-sky-300">內容</label>
                    <textarea
                      rows={5}
                      className="w-full rounded-lg border border-sky-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none"
                      placeholder="公告內容…"
                      value={annForm.content}
                      onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-sky-300">優先級</label>
                    <select
                      className="w-full rounded-lg border border-sky-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                      value={annForm.priority}
                      onChange={e => setAnnForm(f => ({ ...f, priority: e.target.value as AnnouncementPriority }))}
                    >
                      <option value="high">高</option>
                      <option value="normal">一般</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-sky-300">發布方式</label>
                    <div className="flex rounded-lg overflow-hidden border border-sky-700/50">
                      {(['immediate', 'scheduled'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setAnnForm(f => ({ ...f, publishMode: mode }))}
                          className={`flex-1 py-1.5 text-xs transition-colors ${annForm.publishMode === mode ? 'bg-sky-700 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                        >
                          {mode === 'immediate' ? '立即發布' : '排程'}
                        </button>
                      ))}
                    </div>
                    {annForm.publishMode === 'scheduled' && (
                      <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-sky-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                        value={annForm.scheduledAt}
                        onChange={e => setAnnForm(f => ({ ...f, scheduledAt: e.target.value }))}
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-sky-300">到期時間（選填）</label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-lg border border-sky-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                      value={annForm.expiresAt}
                      onChange={e => setAnnForm(f => ({ ...f, expiresAt: e.target.value }))}
                    />
                  </div>
                  {/* Preview */}
                  {(annForm.title || annForm.content) && (
                    <div className="rounded-xl border border-sky-700/40 bg-sky-950/30 p-3 space-y-1">
                      <div className="text-[10px] text-sky-400 font-medium">內容預覽</div>
                      {annForm.title && <div className="text-sm font-semibold text-white">{annForm.title}</div>}
                      {annForm.content && <div className="text-xs text-slate-300 whitespace-pre-wrap">{annForm.content}</div>}
                    </div>
                  )}
                </div>
                <div className="border-t border-sky-800/50 px-4 py-3">
                  <button
                    onClick={handleAnnPublish}
                    className="w-full rounded-xl bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
                  >
                    確認發布
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      )}

      {/* ── 敏感詞庫 ── */}
      {tab === 'keywords' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
            <span className="font-medium text-rose-300 flex items-center gap-1.5"><ShieldAlert size={12} />平台層級敏感詞庫</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleKwBulkImport}
                className="flex items-center gap-1 rounded-lg border border-rose-700/50 px-3 py-1 text-rose-300 hover:bg-rose-900/30 transition-colors"
              >
                <UploadCloud size={11} /> 批量匯入
              </button>
              <button
                onClick={() => setShowKwDrawer(true)}
                className="flex items-center gap-1 rounded-lg bg-rose-700 px-3 py-1 text-white hover:bg-rose-600 transition-colors"
              >
                <PlusCircle size={11} /> 新增詞彙
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-rose-600/70 bg-slate-950/80 p-4">
            <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
              <table className="w-full text-[11px]">
                <thead className="bg-rose-950/60 text-rose-300">
                  <tr>
                    {['#', '敏感詞', '類別', '敏感等級', '建立時間', '操作人', '操作'].map(h => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw, i) => (
                    <tr key={kw.id} className="border-t border-rose-900/30 hover:bg-rose-950/20 transition-colors">
                      <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold text-slate-200">{kw.word}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${categoryColor(kw.category)}`}>{kw.category}</span>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={kw.level}
                          onChange={e => handleKwLevelChange(kw.id, Number(e.target.value) as KeywordLevel)}
                          className={`rounded-full border px-2 py-0.5 text-[10px] bg-transparent cursor-pointer ${levelBadge(kw.level)}`}
                        >
                          <option value={1}>Lv.1</option>
                          <option value={2}>Lv.2</option>
                          <option value={3}>Lv.3</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{kw.createdAt}</td>
                      <td className="px-3 py-2 text-slate-400">{kw.createdBy}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleKwDelete(kw)} className="rounded px-2 py-0.5 text-red-400 hover:bg-red-900/30 transition-colors"><Trash2 size={11} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Keyword Drawer */}
          {showKwDrawer && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setShowKwDrawer(false)}>
              <aside
                className="flex h-full w-full max-w-md flex-col border-l border-rose-700/50 bg-slate-950"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-rose-800/50 px-4 py-3">
                  <span className="text-sm font-medium text-rose-300 flex items-center gap-1.5"><PlusCircle size={14} /> 新增敏感詞</span>
                  <button onClick={() => setShowKwDrawer(false)} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 p-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-rose-300">詞彙</label>
                    <input
                      className="w-full rounded-lg border border-rose-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                      placeholder="輸入敏感詞"
                      value={kwForm.word}
                      onChange={e => setKwForm(f => ({ ...f, word: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-rose-300">類別</label>
                    <select
                      className="w-full rounded-lg border border-rose-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                      value={kwForm.category}
                      onChange={e => setKwForm(f => ({ ...f, category: e.target.value as KeywordCategory }))}
                    >
                      {(['色情', '暴力', '廣告', '政治', '其他'] as KeywordCategory[]).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-rose-300">敏感等級</label>
                    <select
                      className="w-full rounded-lg border border-rose-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                      value={kwForm.level}
                      onChange={e => setKwForm(f => ({ ...f, level: Number(e.target.value) as KeywordLevel }))}
                    >
                      <option value={1}>Lv.1 一般</option>
                      <option value={2}>Lv.2 中等</option>
                      <option value={3}>Lv.3 嚴重</option>
                    </select>
                  </div>
                </div>
                <div className="border-t border-rose-800/50 px-4 py-3">
                  <button
                    onClick={handleKwAdd}
                    className="w-full rounded-xl bg-rose-700 py-2 text-sm font-medium text-white hover:bg-rose-600 transition-colors"
                  >
                    確認新增
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      )}

      {/* ── 收益配置 ── */}
      {tab === 'revenue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
            <span className="font-medium text-emerald-300 flex items-center gap-1.5"><BadgeDollarSign size={12} />收益配置</span>
            <span className="text-slate-500">禮物抽成 / 出金手續費 / Bonus 倍率</span>
          </div>

          {/* 1. 禮物平台抽成 */}
          <div className="space-y-3 rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-300">禮物平台抽成設定</span>
              <button
                onClick={() => { setCommForm({ newRate: commissionRate, effectType: '立即生效', note: '' }); setShowCommDrawer(true) }}
                className="flex items-center gap-1 rounded-lg border border-emerald-700/50 px-3 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/30 transition-colors"
              >
                <Edit3 size={11} /> 編輯
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-emerald-400">{commissionRate}</span>
              <span className="text-2xl text-emerald-500">%</span>
              <span className="text-xs text-slate-500 ml-2">當前平台禮物抽成率</span>
            </div>
            <div className="mt-2">
              <div className="mb-2 text-[11px] text-slate-500 flex items-center gap-1"><History size={11} /> 歷史變更記錄</div>
              <div className="overflow-hidden rounded-xl border border-emerald-800/40 bg-slate-950/80">
                <table className="w-full text-[11px]">
                  <thead className="bg-emerald-950/60 text-emerald-300">
                    <tr>
                      {['時間', '操作人', '變更', '生效方式', '備註'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commissionHistory.map(r => (
                      <tr key={r.id} className="border-t border-emerald-900/30">
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.changedAt}</td>
                        <td className="px-3 py-2 text-slate-300">{r.changedBy}</td>
                        <td className="px-3 py-2 text-slate-200">
                          <span className="text-slate-400">{r.oldRate}%</span>
                          <ArrowRight size={10} className="inline mx-1 text-emerald-500" />
                          <span className="text-emerald-400 font-semibold">{r.newRate}%</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{r.effectType}</td>
                        <td className="px-3 py-2 text-slate-500">{r.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Commission Drawer */}
          {showCommDrawer && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setShowCommDrawer(false)}>
              <aside className="flex h-full w-full max-w-md flex-col border-l border-emerald-700/50 bg-slate-950" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-emerald-800/50 px-4 py-3">
                  <span className="text-sm font-medium text-emerald-300 flex items-center gap-1.5"><Edit3 size={14} /> 調整平台抽成率</span>
                  <button onClick={() => setShowCommDrawer(false)} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 p-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-emerald-300">新抽成比例（0~100%）</label>
                    <input
                      type="number" min={0} max={100}
                      className="w-full rounded-lg border border-emerald-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      value={commForm.newRate}
                      onChange={e => setCommForm(f => ({ ...f, newRate: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-emerald-300">生效方式</label>
                    <select
                      className="w-full rounded-lg border border-emerald-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      value={commForm.effectType}
                      onChange={e => setCommForm(f => ({ ...f, effectType: e.target.value as '立即生效' | '下次結算生效' }))}
                    >
                      <option value="立即生效">立即生效</option>
                      <option value="下次結算生效">下次結算生效</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-emerald-300">備註（選填）</label>
                    <input
                      className="w-full rounded-lg border border-emerald-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      placeholder="調整原因…"
                      value={commForm.note}
                      onChange={e => setCommForm(f => ({ ...f, note: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="border-t border-emerald-800/50 px-4 py-3">
                  <button onClick={handleCommissionSave} className="w-full rounded-xl bg-emerald-700 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors">確認調整</button>
                </div>
              </aside>
            </div>
          )}

          {/* 2. 出金手續費 */}
          <div className="space-y-3 rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-300">出金手續費設定</span>
              <button
                onClick={() => { setFeeForm({ feeType: withdrawalFeeType, value: withdrawalFeeValue }); setShowFeeDrawer(true) }}
                className="flex items-center gap-1 rounded-lg border border-emerald-700/50 px-3 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/30 transition-colors"
              >
                <Edit3 size={11} /> 編輯
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-emerald-400">{withdrawalFeeValue}{withdrawalFeeType === '比例' ? '%' : ' PHP'}</span>
              <span className="text-xs text-slate-500 ml-2">（{withdrawalFeeType}）</span>
            </div>
            <div className="mt-2">
              <div className="mb-2 text-[11px] text-slate-500 flex items-center gap-1"><History size={11} /> 歷史變更記錄</div>
              <div className="overflow-hidden rounded-xl border border-emerald-800/40 bg-slate-950/80">
                <table className="w-full text-[11px]">
                  <thead className="bg-emerald-950/60 text-emerald-300">
                    <tr>
                      {['時間', '操作人', '費用類型', '變更'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {feeHistory.map(r => (
                      <tr key={r.id} className="border-t border-emerald-900/30">
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.changedAt}</td>
                        <td className="px-3 py-2 text-slate-300">{r.changedBy}</td>
                        <td className="px-3 py-2 text-slate-400">{r.feeType}</td>
                        <td className="px-3 py-2 text-slate-200">
                          <span className="text-slate-400">{r.oldValue}{r.feeType === '比例' ? '%' : ' PHP'}</span>
                          <ArrowRight size={10} className="inline mx-1 text-emerald-500" />
                          <span className="text-emerald-400 font-semibold">{r.newValue}{r.feeType === '比例' ? '%' : ' PHP'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Fee Drawer */}
          {showFeeDrawer && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setShowFeeDrawer(false)}>
              <aside className="flex h-full w-full max-w-md flex-col border-l border-emerald-700/50 bg-slate-950" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-emerald-800/50 px-4 py-3">
                  <span className="text-sm font-medium text-emerald-300 flex items-center gap-1.5"><Edit3 size={14} /> 調整出金手續費</span>
                  <button onClick={() => setShowFeeDrawer(false)} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 p-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-emerald-300">費用類型</label>
                    <div className="flex rounded-lg overflow-hidden border border-emerald-700/50">
                      {(['比例', '固定金額'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setFeeForm(f => ({ ...f, feeType: t }))}
                          className={`flex-1 py-1.5 text-xs transition-colors ${feeForm.feeType === t ? 'bg-emerald-700 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-emerald-300">數值（{feeForm.feeType === '比例' ? '%' : 'PHP'}）</label>
                    <input
                      type="number" min={0} step={0.1}
                      className="w-full rounded-lg border border-emerald-700/50 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      value={feeForm.value}
                      onChange={e => setFeeForm(f => ({ ...f, value: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="border-t border-emerald-800/50 px-4 py-3">
                  <button onClick={handleFeeSave} className="w-full rounded-xl bg-emerald-700 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors">確認調整</button>
                </div>
              </aside>
            </div>
          )}

          {/* 3. Bonus 兌換快速連結 */}
          <div className="space-y-3 rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
            <div className="text-sm font-semibold text-emerald-300">Bonus 兌換全域設定（快速連結）</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-emerald-400">x1.0</span>
              <span className="text-xs text-slate-500 ml-2">全域 Bonus → Points 倍率</span>
            </div>
            <p className="text-[11px] text-slate-500">各等級倍率請至 Bonus 管理設定頁面進行配置。</p>
            <button
              onClick={handleGoBonusSettings}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-700/50 px-4 py-2 text-xs text-emerald-300 hover:bg-emerald-900/30 transition-colors"
            >
              前往 Bonus 設定 <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── 系統資訊 ── */}
      {tab === 'system' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
            <span className="font-medium text-slate-300 flex items-center gap-1.5"><Server size={12} />系統資訊</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 size={13} />
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-0.5 text-xs">Healthy</span>
            </span>
          </div>

          {/* Info rows */}
          <div className="space-y-3 rounded-2xl border border-slate-700/60 bg-slate-950/80 p-4">
            <div className="text-[11px] font-medium text-slate-400 mb-2">環境資訊</div>
            {[
              { label: '後端版本', value: 'v2.3.1' },
              { label: 'Node.js 版本', value: 'v22.22.1' },
              { label: '資料庫', value: 'PostgreSQL 15.3' },
              { label: '部署環境', value: 'Production' },
              { label: '最後部署時間', value: ts(96) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                <span className="text-[11px] text-slate-500">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-200">{row.value}</span>
                  <button
                    onClick={() => handleCopyInfo(row.label, row.value)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Services table */}
          <div className="space-y-3 rounded-2xl border border-slate-700/60 bg-slate-950/80 p-4">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5"><Activity size={11} />服務狀態</div>
            <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/80">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-900/80 text-slate-400">
                  <tr>
                    {['服務名稱', '狀態', '回應時間', '最後檢查時間'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_SERVICES.map(svc => {
                    const badge = serviceStatusBadge(svc.status)
                    return (
                      <tr key={svc.name} className="border-t border-slate-800/60 hover:bg-slate-900/30 transition-colors">
                        <td className="px-3 py-2 text-slate-200 font-medium">{svc.name}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] border ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={svc.responseMs > 500 ? 'text-yellow-400' : 'text-emerald-400'}>{svc.responseMs} ms</span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{svc.checkedAt}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 功能清單 ── */}
      {tab === 'blueprint' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
            <span className="font-medium text-slate-300 flex items-center gap-1.5"><ListChecks size={12} />功能清單</span>
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-700/60 bg-slate-950/80 p-4">
            <FeatureList
              title="系統設定功能清單"
              subtitle="維運與合規相關的系統級配置。"
              items={BLUEPRINT_FEATURES}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemSettingsPage
