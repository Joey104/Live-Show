/**
 * @file LivePage.tsx
 * @description 直播管理工作台（監控、聊天審核、收益統計、風控工作台）
 */

import { showConfirm, showPrompt } from '../../lib/dialog'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RadioTower,
  Video,
  MessageSquare,
  DollarSign,
  ShieldAlert,
  ListChecks,
  Eye,
  StopCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Mic2,
  Trash2,
  Clock,
  Users,
  Gift,
  Trophy,
  Ban,
  Flag,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Types ────────────────────────────────────────────────────────────────────

type LiveTabId = 'overview' | 'streams' | 'chat' | 'earnings' | 'moderation' | 'blueprint'

type StreamStatus = 'live' | 'ended' | 'forced_end'
type ChatMsgStatus = 'normal' | 'deleted' | 'flagged'
type ReportReason = '色情' | '暴力' | '詐騙' | '垃圾'
type ReportStatus = 'pending' | 'reviewed' | 'dismissed'
type ModerationSubTab = 'reports' | 'mutes'

interface StreamRecord {
  id: string
  hostName: string
  hostId: string
  hostLevel: number
  title: string
  viewers: number
  viewersPeak: number
  status: StreamStatus
  startTime: string
  durationMin: number
  giftIncome: number
  platformCut: number
  hostNet: number
  chatTotal: number
  chatDeleted: number
  chatMuted: number
}

interface ChatMessage {
  id: string
  streamId: string
  time: string
  userId: string
  userName: string
  content: string
  status: ChatMsgStatus
  mutedUntil?: string
}

interface EarningsRow {
  streamId: string
  hostName: string
  startTime: string
  durationMin: number
  giftIncome: number
  platformCut: number
  hostNet: number
  giftTypes: number
  topGift: string
}

interface ReportRecord {
  id: string
  streamId: string
  streamTitle: string
  targetUser: string
  reason: ReportReason
  reportCount: number
  status: ReportStatus
  createdAt: string
}

interface MuteRecord {
  id: string
  userId: string
  userName: string
  streamId: string
  reason: string
  muteMin: number
  mutedUntil: string
  operator: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ts(offsetHours = 0) {
  const d = new Date(Date.now() - offsetHours * 3_600_000)
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function muteUntilStr(minutes: number): string {
  const d = new Date(Date.now() + minutes * 60_000)
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STREAMS: StreamRecord[] = [
  {
    id: 'LS-001',
    hostName: 'Maria Santos',
    hostId: 'H-1001',
    hostLevel: 8,
    title: '今晚唱歌 🎤 來打call！',
    viewers: 342,
    viewersPeak: 420,
    status: 'live',
    startTime: ts(1.5),
    durationMin: 90,
    giftIncome: 12500,
    platformCut: 3750,
    hostNet: 8750,
    chatTotal: 1120,
    chatDeleted: 3,
    chatMuted: 1,
  },
  {
    id: 'LS-002',
    hostName: 'Jenny Cruz',
    hostId: 'H-1002',
    hostLevel: 5,
    title: 'DJ Night with Jenny 🎧',
    viewers: 187,
    viewersPeak: 230,
    status: 'live',
    startTime: ts(0.8),
    durationMin: 48,
    giftIncome: 6800,
    platformCut: 2040,
    hostNet: 4760,
    chatTotal: 542,
    chatDeleted: 0,
    chatMuted: 0,
  },
  {
    id: 'LS-003',
    hostName: 'Rose Reyes',
    hostId: 'H-1003',
    hostLevel: 6,
    title: '好久不見！分享旅遊照',
    viewers: 0,
    viewersPeak: 165,
    status: 'ended',
    startTime: ts(5),
    durationMin: 125,
    giftIncome: 4300,
    platformCut: 1290,
    hostNet: 3010,
    chatTotal: 389,
    chatDeleted: 2,
    chatMuted: 1,
  },
  {
    id: 'LS-004',
    hostName: 'Ana Dela Cruz',
    hostId: 'H-1004',
    hostLevel: 3,
    title: 'Chill Sunday Vibes 🌙',
    viewers: 0,
    viewersPeak: 78,
    status: 'ended',
    startTime: ts(8),
    durationMin: 60,
    giftIncome: 1800,
    platformCut: 540,
    hostNet: 1260,
    chatTotal: 212,
    chatDeleted: 0,
    chatMuted: 0,
  },
  {
    id: 'LS-005',
    hostName: 'Liza Gomez',
    hostId: 'H-1005',
    hostLevel: 4,
    title: '（違規強制結束）',
    viewers: 0,
    viewersPeak: 95,
    status: 'forced_end',
    startTime: ts(12),
    durationMin: 22,
    giftIncome: 650,
    platformCut: 195,
    hostNet: 455,
    chatTotal: 88,
    chatDeleted: 15,
    chatMuted: 3,
  },
]

const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  // LS-001
  { id: 'CM-001', streamId: 'LS-001', time: ts(1.4), userId: 'U-2001', userName: 'fan_king88', content: '妳的歌聲好好聽！加油！', status: 'normal' },
  { id: 'CM-002', streamId: 'LS-001', time: ts(1.3), userId: 'U-2002', userName: 'pinoy_love', content: '送禮物！！！希望妳唱那首！', status: 'normal' },
  { id: 'CM-003', streamId: 'LS-001', time: ts(1.2), userId: 'U-2003', userName: 'spam_bot01', content: '【廣告】加LINE賺大錢 XXXXX', status: 'flagged' },
  { id: 'CM-004', streamId: 'LS-001', time: ts(1.1), userId: 'U-2004', userName: 'troll99', content: '（已刪除訊息）', status: 'deleted' },
  { id: 'CM-005', streamId: 'LS-001', time: ts(1.0), userId: 'U-2005', userName: 'sweetfan', content: 'Beautiful! Ganda mo!', status: 'normal' },
  { id: 'CM-006', streamId: 'LS-001', time: ts(0.9), userId: 'U-2006', userName: 'nightwatcher', content: '幾點結束直播呀？', status: 'normal' },
  { id: 'CM-007', streamId: 'LS-001', time: ts(0.8), userId: 'U-2007', userName: 'gifter_vip', content: '送玫瑰 x100！！', status: 'normal' },
  { id: 'CM-008', streamId: 'LS-001', time: ts(0.7), userId: 'U-2008', userName: 'rude_user', content: '（違規內容已刪除）', status: 'deleted' },
  // LS-002
  { id: 'CM-009', streamId: 'LS-002', time: ts(0.75), userId: 'U-3001', userName: 'dj_lover', content: 'Grabe ang ganda ng music!', status: 'normal' },
  { id: 'CM-010', streamId: 'LS-002', time: ts(0.65), userId: 'U-3002', userName: 'bass_head', content: '加音量！！聽不清楚', status: 'normal' },
  { id: 'CM-011', streamId: 'LS-002', time: ts(0.55), userId: 'U-3003', userName: 'spam_again', content: '【詐騙】免費鑽石點這裡', status: 'flagged' },
  { id: 'CM-012', streamId: 'LS-002', time: ts(0.45), userId: 'U-3004', userName: 'chill_fan', content: '週日晚上最適合這種音樂 🎶', status: 'normal' },
  { id: 'CM-013', streamId: 'LS-002', time: ts(0.35), userId: 'U-3005', userName: 'night_owl', content: '什麼時候唱歌？', status: 'normal' },
  { id: 'CM-014', streamId: 'LS-002', time: ts(0.25), userId: 'U-3006', userName: 'vip_member', content: '送火箭！繼續播！', status: 'normal' },
  // LS-003
  { id: 'CM-015', streamId: 'LS-003', time: ts(4.9), userId: 'U-4001', userName: 'travelfan', content: '好羨慕！去哪裡旅遊？', status: 'normal' },
  { id: 'CM-016', streamId: 'LS-003', time: ts(4.8), userId: 'U-4002', userName: 'old_friend', content: '好久不見！妳回來了！', status: 'normal' },
  { id: 'CM-017', streamId: 'LS-003', time: ts(4.7), userId: 'U-4003', userName: 'hate_user', content: '（已刪除的不當言論）', status: 'deleted' },
  { id: 'CM-018', streamId: 'LS-003', time: ts(4.6), userId: 'U-4004', userName: 'sweet_comment', content: 'Miss you so much! 🥰', status: 'normal' },
  { id: 'CM-019', streamId: 'LS-003', time: ts(4.5), userId: 'U-4005', userName: 'curious_fan', content: '下次什麼時候直播？', status: 'normal' },
  { id: 'CM-020', streamId: 'LS-003', time: ts(4.4), userId: 'U-4006', userName: 'gift_fan', content: '送愛心！繼續分享', status: 'normal' },
  // LS-004
  { id: 'CM-021', streamId: 'LS-004', time: ts(7.9), userId: 'U-5001', userName: 'chill_user', content: '今天天氣真好呢', status: 'normal' },
  { id: 'CM-022', streamId: 'LS-004', time: ts(7.8), userId: 'U-5002', userName: 'night_fan', content: '好放鬆的音樂 😌', status: 'normal' },
  { id: 'CM-023', streamId: 'LS-004', time: ts(7.7), userId: 'U-5003', userName: 'random_user', content: '第一次看妳直播！', status: 'normal' },
  { id: 'CM-024', streamId: 'LS-004', time: ts(7.6), userId: 'U-5004', userName: 'regular_fan', content: '支持妳！', status: 'normal' },
  { id: 'CM-025', streamId: 'LS-004', time: ts(7.5), userId: 'U-5005', userName: 'gift_giver', content: '小禮物！加油 Ana！', status: 'normal' },
  // LS-005
  { id: 'CM-026', streamId: 'LS-005', time: ts(11.9), userId: 'U-6001', userName: 'viol_user1', content: '（已刪除：暴力言論）', status: 'deleted' },
  { id: 'CM-027', streamId: 'LS-005', time: ts(11.8), userId: 'U-6002', userName: 'viol_user2', content: '（已刪除：色情內容）', status: 'deleted' },
  { id: 'CM-028', streamId: 'LS-005', time: ts(11.7), userId: 'U-6003', userName: 'warn_user', content: '【舉報】這個直播有問題！', status: 'flagged' },
  { id: 'CM-029', streamId: 'LS-005', time: ts(11.6), userId: 'U-6004', userName: 'viewer_a', content: '怎麼了？發生什麼事？', status: 'normal' },
  { id: 'CM-030', streamId: 'LS-005', time: ts(11.5), userId: 'U-6005', userName: 'viewer_b', content: 'Report!', status: 'normal' },
  { id: 'CM-031', streamId: 'LS-005', time: ts(11.4), userId: 'U-6006', userName: 'spam_post', content: '（已刪除：垃圾訊息）', status: 'deleted' },
]

const MOCK_REPORTS: ReportRecord[] = [
  { id: 'RPT-001', streamId: 'LS-005', streamTitle: '（違規強制結束）', targetUser: 'Liza Gomez', reason: '色情', reportCount: 12, status: 'reviewed', createdAt: ts(11) },
  { id: 'RPT-002', streamId: 'LS-001', streamTitle: '今晚唱歌 🎤 來打call！', targetUser: 'spam_bot01', reason: '垃圾', reportCount: 3, status: 'pending', createdAt: ts(1.2) },
  { id: 'RPT-003', streamId: 'LS-002', streamTitle: 'DJ Night with Jenny 🎧', targetUser: 'spam_again', reason: '詐騙', reportCount: 5, status: 'pending', createdAt: ts(0.55) },
  { id: 'RPT-004', streamId: 'LS-003', streamTitle: '好久不見！分享旅遊照', targetUser: 'hate_user', reason: '暴力', reportCount: 2, status: 'dismissed', createdAt: ts(4.7) },
]

const MOCK_MUTES: MuteRecord[] = [
  { id: 'MUT-001', userId: 'U-2003', userName: 'spam_bot01', streamId: 'LS-001', reason: '垃圾廣告訊息', muteMin: 30, mutedUntil: muteUntilStr(30), operator: 'Admin A' },
  { id: 'MUT-002', userId: 'U-6001', userName: 'viol_user1', streamId: 'LS-005', reason: '暴力言論', muteMin: 1440, mutedUntil: muteUntilStr(1440), operator: 'Admin B' },
  { id: 'MUT-003', userId: 'U-6002', userName: 'viol_user2', streamId: 'LS-005', reason: '色情內容', muteMin: 4320, mutedUntil: muteUntilStr(4320), operator: 'Admin B' },
  { id: 'MUT-004', userId: 'U-3003', userName: 'spam_again', streamId: 'LS-002', reason: '詐騙連結', muteMin: 60, mutedUntil: muteUntilStr(60), operator: 'Admin A' },
]

// ─── Earnings mock ────────────────────────────────────────────────────────────

const MOCK_EARNINGS: EarningsRow[] = MOCK_STREAMS.map((s) => ({
  streamId: s.id,
  hostName: s.hostName,
  startTime: s.startTime,
  durationMin: s.durationMin,
  giftIncome: s.giftIncome,
  platformCut: s.platformCut,
  hostNet: s.hostNet,
  giftTypes: Math.floor(Math.random() * 5) + 2,
  topGift: ['玫瑰花', '火箭', '愛心', '皇冠', '鑽石'][Math.floor(Math.random() * 5)],
}))

// ─── Paginator ────────────────────────────────────────────────────────────────

function Paginator({
  page,
  totalPages,
  onPrev,
  onNext,
  color = 'slate',
}: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  color?: string
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrev}
        className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
      >
        <ChevronLeft className="h-3 w-3" />
        上一頁
      </button>
      <span className="text-[10px] text-slate-300">
        第 {page} / {totalPages} 頁
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
        className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
      >
        下一頁
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Blueprint features ───────────────────────────────────────────────────────

const blueprintFeatures: import('../../components/common/FeatureList').FeatureItem[] = [
  {
    id: 39,
    name: '查看所有直播',
    description: '以列表或卡片方式顯示目前與歷史直播：主播、標題、觀眾數、時長與狀態。',
    tag: '列表',
  },
  {
    id: 40,
    name: '狀態篩選',
    description: '支援進行中 / 已結束 / 全部切換，快速鎖定需要關注的直播房間。',
    tag: '篩選',
  },
  {
    id: 41,
    name: '觀眾數排序',
    description: '依觀眾數排序，方便運營關注熱門直播與異常高流量房間。',
    tag: '排序',
  },
  {
    id: 42,
    name: '查看直播詳情',
    description: '以抽屜或側邊面板顯示直播詳情，包含主播資訊、實時統計與收益概覽。',
    tag: '抽屜',
  },
  {
    id: 43,
    name: '查看聊天記錄',
    description: '支援關鍵字搜尋聊天訊息，並能快速跳轉至上下文段落，輔助風控審核。',
    tag: '聊天',
  },
  {
    id: 44,
    name: '刪除違規訊息',
    description: '後台管理員可刪除違規訊息，需顯示被刪除內容 / 摘要與後續狀態，並記錄 Audit Log。',
    tag: '風控',
  },
  {
    id: 45,
    name: '禁言聊天用戶',
    description: '指定禁言時長（分鐘），顯示禁言結果與剩餘時間，並防止重複提交。',
    tag: '風控',
  },
  {
    id: 46,
    name: '強制結束直播',
    description: '高風險操作，需二次確認與影響摘要（如強制結束後收益結算邏輯），必須記錄 Audit Log。',
    tag: '高風險',
  },
  {
    id: 47,
    name: '查看直播收益',
    description: '展示本場禮物總收入，可拆成平台抽成 / 主播淨收入，並連結到財務報表。',
    tag: '收益',
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export function LivePage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<LiveTabId>('overview')

  // streams
  const [streams, setStreams] = useState<StreamRecord[]>(MOCK_STREAMS)
  const [streamFilter, setStreamFilter] = useState<'all' | StreamStatus>('all')
  const [streamSearch, setStreamSearch] = useState('')
  const [drawerStream, setDrawerStream] = useState<StreamRecord | null>(null)

  // chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES)
  const [chatStreamId, setChatStreamId] = useState<string>('LS-001')
  const [chatSearch, setChatSearch] = useState('')
  const [chatStatusFilter, setChatStatusFilter] = useState<'all' | ChatMsgStatus>('all')
  const [chatPage, setChatPage] = useState(1)
  const chatPageSize = 8

  // earnings
  const [earningsPage, setEarningsPage] = useState(1)
  const earningsPageSize = 5

  // moderation
  const [reports, setReports] = useState<ReportRecord[]>(MOCK_REPORTS)
  const [mutes, setMutes] = useState<MuteRecord[]>(MOCK_MUTES)
  const [modSubTab, setModSubTab] = useState<ModerationSubTab>('reports')

  // ── stream handlers ──

  const filteredStreams = useMemo(() => {
    return streams.filter((s) => {
      if (streamFilter !== 'all' && s.status !== streamFilter) return false
      if (streamSearch) {
        const q = streamSearch.toLowerCase()
        if (!s.hostName.toLowerCase().includes(q) && !s.title.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [streams, streamFilter, streamSearch])

  const handleForceEnd = async (s: StreamRecord) => {
    const ok = await showConfirm(
      `⚠️ 確認強制結束直播？\n\n主播：${s.hostName}（${s.hostId}）\n標題：${s.title}\n目前觀眾：${s.viewers} 人\n\n` +
        `收益影響摘要：\n禮物收入 PHP ${s.giftIncome.toLocaleString()}（強制結束後將按當前金額結算）\n平台抽成 PHP ${s.platformCut.toLocaleString()}，主播淨收入 PHP ${s.hostNet.toLocaleString()}\n\n` +
        `此操作無法復原，請確認後再執行。`,
    )
    if (!ok) return
    setStreams((prev) =>
      prev.map((st) =>
        st.id === s.id ? { ...st, status: 'forced_end', viewers: 0 } : st,
      ),
    )
    if (drawerStream?.id === s.id) {
      setDrawerStream((d) => (d ? { ...d, status: 'forced_end', viewers: 0 } : d))
    }
  }

  // ── chat handlers ──

  const filteredChat = useMemo(() => {
    return chatMessages.filter((m) => {
      if (m.streamId !== chatStreamId) return false
      if (chatStatusFilter !== 'all' && m.status !== chatStatusFilter) return false
      if (chatSearch) {
        const q = chatSearch.toLowerCase()
        if (
          !m.content.toLowerCase().includes(q) &&
          !m.userName.toLowerCase().includes(q) &&
          !m.userId.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [chatMessages, chatStreamId, chatSearch, chatStatusFilter])

  const chatTotalPages = Math.max(1, Math.ceil(filteredChat.length / chatPageSize))
  const paginatedChat = useMemo(() => {
    const start = (chatPage - 1) * chatPageSize
    return filteredChat.slice(start, start + chatPageSize)
  }, [filteredChat, chatPage])

  const handleDeleteMsg = async (msg: ChatMessage) => {
    const preview = msg.content.slice(0, 30)
    const ok = await showConfirm(`確認刪除此訊息？\n\n用戶：${msg.userName}（${msg.userId}）\n訊息摘要：「${preview}…」\n\n此操作將記錄 Audit Log。`)
    if (!ok) return
    setChatMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, status: 'deleted' } : m)),
    )
  }

  const handleMuteUser = async (msg: ChatMessage) => {
    const input = await showPrompt(
      `禁言用戶：${msg.userName}（${msg.userId}）\n\n請輸入禁言分鐘數（例如：30）：`,
      '30',
    )
    if (input === null) return
    const minutes = parseInt(input, 10)
    if (isNaN(minutes) || minutes <= 0) return
    const until = muteUntilStr(minutes)
    setChatMessages((prev) =>
      prev.map((m) =>
        m.userId === msg.userId && m.streamId === msg.streamId
          ? { ...m, mutedUntil: until }
          : m,
      ),
    )
    // add to mute records
    const newMute: MuteRecord = {
      id: `MUT-${Date.now()}`,
      userId: msg.userId,
      userName: msg.userName,
      streamId: msg.streamId,
      reason: '管理員手動禁言',
      muteMin: minutes,
      mutedUntil: until,
      operator: 'Admin',
    }
    setMutes((prev) => [newMute, ...prev])
  }

  // ── earnings ──

  const earningsTotalPages = Math.max(1, Math.ceil(MOCK_EARNINGS.length / earningsPageSize))
  const paginatedEarnings = useMemo(() => {
    const start = (earningsPage - 1) * earningsPageSize
    return MOCK_EARNINGS.slice(start, start + earningsPageSize)
  }, [earningsPage])

  const totalGiftIncome = MOCK_EARNINGS.reduce((s, r) => s + r.giftIncome, 0)
  const totalPlatformCut = MOCK_EARNINGS.reduce((s, r) => s + r.platformCut, 0)
  const totalHostNet = MOCK_EARNINGS.reduce((s, r) => s + r.hostNet, 0)
  const maxSingleIncome = Math.max(...MOCK_EARNINGS.map((r) => r.giftIncome))
  const avgIncome = Math.round(totalGiftIncome / MOCK_EARNINGS.length)

  const top5Hosts = useMemo(() => {
    const map = new Map<string, number>()
    MOCK_EARNINGS.forEach((r) => {
      map.set(r.hostName, (map.get(r.hostName) ?? 0) + r.giftIncome)
    })
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, income], i) => ({ rank: i + 1, name, income }))
  }, [])

  // ── moderation handlers ──

  const handleMarkReviewed = async (r: ReportRecord) => {
    const ok = await showConfirm(
      `確認標記舉報「${r.id}」為已處理？\n\n被舉報用戶：${r.targetUser}\n原因：${r.reason}\n舉報人數：${r.reportCount}`,
    )
    if (!ok) return
    setReports((prev) => prev.map((rp) => (rp.id === r.id ? { ...rp, status: 'reviewed' } : rp)))
  }

  const handleDismissReport = async (r: ReportRecord) => {
    const ok = await showConfirm(
      `確認忽略舉報「${r.id}」？\n\n被舉報用戶：${r.targetUser}\n原因：${r.reason}\n\n此操作將記錄為已忽略。`,
    )
    if (!ok) return
    setReports((prev) => prev.map((rp) => (rp.id === r.id ? { ...rp, status: 'dismissed' } : rp)))
  }

  const handleUnmute = async (m: MuteRecord) => {
    const ok = await showConfirm(
      `確認解除禁言？\n\n用戶：${m.userName}（${m.userId}）\n直播房間：${m.streamId}\n禁言原因：${m.reason}`,
    )
    if (!ok) return
    setMutes((prev) => prev.filter((mu) => mu.id !== m.id))
  }

  // ── overview stats ──
  const liveCount = streams.filter((s) => s.status === 'live').length
  const todayStreams = streams.length
  const todayViewers = streams.reduce((s, r) => s + r.viewersPeak, 0)
  const todayIncome = streams.reduce((s, r) => s + r.giftIncome, 0)
  const pendingReports = reports.filter((r) => r.status === 'pending').length
  const forcedEndCount = streams.filter((s) => s.status === 'forced_end').length


  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Tab Header */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <RadioTower className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">直播管理</span>
          <span className="text-[10px] text-slate-500">監控、聊天審核、收益統計與風控工作台。</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {(
            [
              { id: 'overview', label: t('common.overview') },
              { id: 'streams', label: t('tabs.liveStreams') },
              { id: 'chat', label: t('tabs.liveChat') },
              { id: 'earnings', label: t('tabs.liveEarnings') },
              { id: 'moderation', label: t('tabs.liveModeration') },
              { id: 'blueprint', label: t('common.blueprint') },
            ] as { id: LiveTabId; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'rounded-full px-2 py-0.5',
                activeTab === tab.id
                  ? tab.id === 'streams' ? 'bg-sky-600 text-white'
                    : tab.id === 'chat' ? 'bg-rose-600 text-white'
                    : tab.id === 'earnings' ? 'bg-emerald-600 text-white'
                    : tab.id === 'moderation' ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 text-white'
                  : 'text-slate-200 hover:bg-slate-800/80',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── 總覽 ── */}
      {activeTab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center gap-1.5 text-xs text-slate-200">
            <RadioTower className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-semibold">直播監控總覽</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-[11px]">
            <div className="space-y-1 rounded-xl border border-sky-600/60 bg-sky-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-300"><Video className="h-3.5 w-3.5 text-sky-400" />目前直播中</div>
              <div className="text-2xl font-bold text-sky-100">{liveCount}</div>
              <div className="text-[10px] text-sky-200/70">場直播正在進行中</div>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-600/60 bg-slate-800/30 p-3">
              <div className="flex items-center gap-1.5 text-slate-300"><ListChecks className="h-3.5 w-3.5 text-slate-400" />今日總直播場次</div>
              <div className="text-2xl font-bold text-slate-100">{todayStreams}</div>
              <div className="text-[10px] text-slate-400">包含進行中、已結束與強制結束</div>
            </div>
            <div className="space-y-1 rounded-xl border border-indigo-600/60 bg-indigo-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-300"><Users className="h-3.5 w-3.5 text-indigo-400" />今日累計觀眾數</div>
              <div className="text-2xl font-bold text-indigo-100">{todayViewers.toLocaleString()}</div>
              <div className="text-[10px] text-indigo-200/70">各場峰值觀眾總和</div>
            </div>
            <div className="space-y-1 rounded-xl border border-emerald-600/60 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-300"><Gift className="h-3.5 w-3.5 text-emerald-400" />今日禮物收入（PHP）</div>
              <div className="text-2xl font-bold text-emerald-100">{todayIncome.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-200/70">所有場次禮物收入總和</div>
            </div>
            <div className="space-y-1 rounded-xl border border-amber-600/60 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-300"><Flag className="h-3.5 w-3.5 text-amber-400" />待處理違規舉報</div>
              <div className="text-2xl font-bold text-amber-100">{pendingReports}</div>
              <div className="text-[10px] text-amber-200/70">尚未審核的舉報案件</div>
            </div>
            <div className="space-y-1 rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-300"><StopCircle className="h-3.5 w-3.5 text-rose-400" />強制結束場次（本週）</div>
              <div className="text-2xl font-bold text-rose-100">{forcedEndCount}</div>
              <div className="text-[10px] text-rose-200/70">因違規被強制終止的直播</div>
            </div>
          </div>
        </section>
      )}

      {/* ── 直播列表 ── */}
      {activeTab === 'streams' && (
        <section className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">直播列表</span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-100">
                共 {filteredStreams.length} 場
              </span>
            </div>
          </header>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="flex min-w-[200px] flex-1 items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={streamSearch}
                onChange={(e) => setStreamSearch(e.target.value)}
                placeholder="搜尋主播名稱 / 標題"
                className="h-6 flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value as 'all' | StreamStatus)}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100"
              >
                <option value="all">全部狀態</option>
                <option value="live">直播中</option>
                <option value="ended">已結束</option>
                <option value="forced_end">強制結束</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-sky-100">
                <tr>
                  {['直播 ID', '主播名稱', '標題', '觀眾數', '狀態', '開始時間', '時長', '禮物收入', '操作'].map((h) => (
                    <th key={h} className="border-b border-sky-600/60 px-2 py-2 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStreams.map((s) => (
                  <tr key={s.id} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                    <td className="px-2 py-1.5 font-mono text-[10px] text-slate-300">{s.id}</td>
                    <td className="px-2 py-1.5 font-medium">{s.hostName}</td>
                    <td className="px-2 py-1.5 max-w-[160px] truncate text-sky-100/80">{s.title}</td>
                    <td className="px-2 py-1.5 tabular-nums">{s.viewers.toLocaleString()}</td>
                    <td className="px-2 py-1.5">
                      <span className={[
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]',
                        s.status === 'live' ? 'bg-sky-500/30 text-sky-50'
                          : s.status === 'ended' ? 'bg-slate-600/50 text-slate-200'
                          : 'bg-rose-500/30 text-rose-100',
                      ].join(' ')}>
                        {s.status === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />}
                        {s.status === 'live' ? '直播中' : s.status === 'ended' ? '已結束' : '強制結束'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[10px] text-slate-300">{s.startTime}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{fmtDuration(s.durationMin)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-emerald-300">PHP {s.giftIncome.toLocaleString()}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDrawerStream(s)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/25 px-2 py-0.5 text-[10px] text-sky-50 hover:bg-sky-500/40"
                        >
                          <Eye className="h-3 w-3" />
                          詳情
                        </button>
                        {s.status === 'live' && (
                          <button
                            type="button"
                            onClick={() => handleForceEnd(s)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-rose-600/80 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500"
                          >
                            <StopCircle className="h-3 w-3" />
                            強制結束
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStreams.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-[11px] text-sky-100/60">
                      沒有符合條件的直播紀錄。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 聊天審核 ── */}
      {activeTab === 'chat' && (
        <section className="space-y-3 rounded-2xl border border-rose-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center gap-1.5 text-xs text-slate-200">
            <MessageSquare className="h-3.5 w-3.5 text-rose-400" />
            <span className="font-semibold">聊天審核</span>
          </header>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <select
              value={chatStreamId}
              onChange={(e) => { setChatStreamId(e.target.value); setChatPage(1) }}
              className="h-7 rounded-full border border-rose-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100"
            >
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.hostName}（{s.status === 'live' ? '直播中' : s.status === 'ended' ? '已結束' : '強制結束'}）
                </option>
              ))}
            </select>

            <div className="flex min-w-[180px] flex-1 items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={chatSearch}
                onChange={(e) => { setChatSearch(e.target.value); setChatPage(1) }}
                placeholder="搜尋用戶 / 訊息內容"
                className="h-6 flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>

            <select
              value={chatStatusFilter}
              onChange={(e) => { setChatStatusFilter(e.target.value as 'all' | ChatMsgStatus); setChatPage(1) }}
              className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100"
            >
              <option value="all">全部狀態</option>
              <option value="normal">正常</option>
              <option value="deleted">已刪除</option>
              <option value="flagged">標記違規</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-rose-100">
                <tr>
                  {['#', '時間', '用戶 ID', '用戶名稱', '訊息內容', '狀態', '操作'].map((h) => (
                    <th key={h} className="border-b border-rose-600/60 px-2 py-2 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedChat.map((msg, i) => (
                  <tr key={msg.id} className="border-b border-rose-600/30 text-rose-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-400">{(chatPage - 1) * chatPageSize + i + 1}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[10px] text-slate-300">{msg.time}</td>
                    <td className="px-2 py-1.5 font-mono text-[10px] text-slate-300">{msg.userId}</td>
                    <td className="px-2 py-1.5 font-medium">{msg.userName}</td>
                    <td className="px-2 py-1.5 max-w-[220px]">
                      <span className={msg.status === 'deleted' ? 'text-slate-500 line-through' : ''}>
                        {msg.content.slice(0, 40)}{msg.content.length > 40 ? '…' : ''}
                      </span>
                      {msg.mutedUntil && (
                        <div className="text-[10px] text-amber-300">🔇 禁言至 {msg.mutedUntil}</div>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={[
                        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px]',
                        msg.status === 'normal' ? 'bg-emerald-500/20 text-emerald-100'
                          : msg.status === 'deleted' ? 'bg-slate-600/50 text-slate-300'
                          : 'bg-amber-500/25 text-amber-100',
                      ].join(' ')}>
                        {msg.status === 'normal' ? '正常' : msg.status === 'deleted' ? '已刪除' : '標記違規'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        {msg.status !== 'deleted' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMsg(msg)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-rose-600/70 px-2 py-0.5 text-[10px] text-white hover:bg-rose-500"
                          >
                            <Trash2 className="h-3 w-3" />
                            刪除
                          </button>
                        )}
                        {!msg.mutedUntil && (
                          <button
                            type="button"
                            onClick={() => handleMuteUser(msg)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-amber-600/70 px-2 py-0.5 text-[10px] text-white hover:bg-amber-500"
                          >
                            <Ban className="h-3 w-3" />
                            禁言
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedChat.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-[11px] text-rose-100/60">
                      此房間沒有符合條件的聊天紀錄。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-rose-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <span>共 {filteredChat.length} 筆訊息 · 每頁 {chatPageSize} 筆</span>
              <Paginator
                page={chatPage}
                totalPages={chatTotalPages}
                onPrev={() => setChatPage((p) => Math.max(1, p - 1))}
                onNext={() => setChatPage((p) => Math.min(chatTotalPages, p + 1))}
              />
            </footer>
          </div>
        </section>
      )}

      {/* ── 收益統計 ── */}
      {activeTab === 'earnings' && (
        <section className="space-y-3 rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center gap-1.5 text-xs text-slate-200">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold">收益統計</span>
          </header>

          {/* 今日收益卡片 */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-[11px]">
            {[
              { label: '今日禮物收入', value: `PHP ${totalGiftIncome.toLocaleString()}`, color: 'emerald' },
              { label: '平台抽成（30%）', value: `PHP ${totalPlatformCut.toLocaleString()}`, color: 'slate' },
              { label: '主播淨收入', value: `PHP ${totalHostNet.toLocaleString()}`, color: 'sky' },
              { label: '最高單場收益', value: `PHP ${maxSingleIncome.toLocaleString()}`, color: 'amber' },
              { label: '平均每場收益', value: `PHP ${avgIncome.toLocaleString()}`, color: 'indigo' },
            ].map((card) => (
              <div
                key={card.label}
                className={`space-y-1 rounded-xl border border-${card.color}-600/60 bg-${card.color}-500/10 p-3`}
              >
                <div className="text-slate-400">{card.label}</div>
                <div className={`text-lg font-bold text-${card.color}-100`}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* 各場收益表格 */}
          <div className="overflow-hidden rounded-xl border border-emerald-600/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-emerald-100">
                <tr>
                  {['直播 ID', '主播', '開始時間', '時長', '禮物收入', '平台抽成', '主播淨收入', '禮物種類', 'Top 禮物'].map((h) => (
                    <th key={h} className="border-b border-emerald-600/60 px-2 py-2 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedEarnings.map((row) => (
                  <tr key={row.streamId} className="border-b border-emerald-600/30 text-emerald-50 last:border-b-0">
                    <td className="px-2 py-1.5 font-mono text-[10px] text-slate-300">{row.streamId}</td>
                    <td className="px-2 py-1.5 font-medium">{row.hostName}</td>
                    <td className="px-2 py-1.5 text-[10px] whitespace-nowrap text-slate-300">{row.startTime}</td>
                    <td className="px-2 py-1.5">{fmtDuration(row.durationMin)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-emerald-200">PHP {row.giftIncome.toLocaleString()}</td>
                    <td className="px-2 py-1.5 tabular-nums text-slate-300">PHP {row.platformCut.toLocaleString()}</td>
                    <td className="px-2 py-1.5 tabular-nums text-sky-200">PHP {row.hostNet.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-center">{row.giftTypes}</td>
                    <td className="px-2 py-1.5">
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100">
                        <Gift className="h-2.5 w-2.5" />{row.topGift}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-emerald-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <span>共 {MOCK_EARNINGS.length} 筆 · 每頁 {earningsPageSize} 筆</span>
              <Paginator
                page={earningsPage}
                totalPages={earningsTotalPages}
                onPrev={() => setEarningsPage((p) => Math.max(1, p - 1))}
                onNext={() => setEarningsPage((p) => Math.min(earningsTotalPages, p + 1))}
              />
            </footer>
          </div>

          {/* Top 5 主播排行 */}
          <div className="space-y-2 rounded-xl border border-emerald-600/60 bg-slate-950/80 p-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-100">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">主播收益排行（Top 5）</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {top5Hosts.map((h) => (
                <div
                  key={h.name}
                  className={[
                    'flex flex-col items-center gap-1 rounded-xl border p-3 text-[11px]',
                    h.rank === 1
                      ? 'border-amber-500/70 bg-amber-500/15'
                      : h.rank === 2
                      ? 'border-slate-400/50 bg-slate-700/20'
                      : h.rank === 3
                      ? 'border-orange-700/50 bg-orange-900/15'
                      : 'border-slate-700/50 bg-slate-900/30',
                  ].join(' ')}
                >
                  <span className={[
                    'text-xl font-bold',
                    h.rank === 1 ? 'text-amber-300' : h.rank === 2 ? 'text-slate-300' : h.rank === 3 ? 'text-orange-400' : 'text-slate-400',
                  ].join(' ')}>
                    #{h.rank}
                  </span>
                  <span className="text-center font-medium text-slate-100">{h.name}</span>
                  <span className="text-emerald-300">PHP {h.income.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 風控工作台 ── */}
      {activeTab === 'moderation' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">風控工作台</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-amber-700/70 bg-slate-900/80 p-0.5">
              <button
                type="button"
                onClick={() => setModSubTab('reports')}
                className={[
                  'rounded-full px-2 py-0.5 text-[10px]',
                  modSubTab === 'reports' ? 'bg-amber-600 text-white' : 'text-slate-200 hover:bg-slate-800/80',
                ].join(' ')}
              >
                舉報列表
              </button>
              <button
                type="button"
                onClick={() => setModSubTab('mutes')}
                className={[
                  'rounded-full px-2 py-0.5 text-[10px]',
                  modSubTab === 'mutes' ? 'bg-amber-600 text-white' : 'text-slate-200 hover:bg-slate-800/80',
                ].join(' ')}
              >
                禁言記錄
              </button>
            </div>
          </header>

          {modSubTab === 'reports' && (
            <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
              <table className="min-w-full border-collapse text-[11px]">
                <thead className="bg-slate-900/90 text-amber-100">
                  <tr>
                    {['舉報 ID', '被舉報直播', '被舉報用戶', '原因', '舉報人數', '狀態', '時間', '操作'].map((h) => (
                      <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                      <td className="px-2 py-1.5 font-mono text-[10px] text-slate-300">{r.id}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-slate-400">{r.streamId}</span>
                          <span className="text-[10px] text-amber-100/80 max-w-[120px] truncate">{r.streamTitle}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 font-medium">{r.targetUser}</td>
                      <td className="px-2 py-1.5">
                        <span className={[
                          'rounded-full px-1.5 py-0.5 text-[10px]',
                          r.reason === '色情' ? 'bg-pink-500/30 text-pink-100'
                            : r.reason === '暴力' ? 'bg-rose-500/30 text-rose-100'
                            : r.reason === '詐騙' ? 'bg-orange-500/30 text-orange-100'
                            : 'bg-slate-600/50 text-slate-200',
                        ].join(' ')}>
                          {r.reason}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 tabular-nums text-center">{r.reportCount}</td>
                      <td className="px-2 py-1.5">
                        <span className={[
                          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px]',
                          r.status === 'pending' ? 'bg-amber-500/30 text-amber-100'
                            : r.status === 'reviewed' ? 'bg-emerald-500/25 text-emerald-100'
                            : 'bg-slate-600/40 text-slate-300',
                        ].join(' ')}>
                          {r.status === 'pending' ? <Clock className="h-2.5 w-2.5" /> : r.status === 'reviewed' ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                          {r.status === 'pending' ? '待審核' : r.status === 'reviewed' ? '已處理' : '已忽略'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-[10px] whitespace-nowrap text-slate-300">{r.createdAt}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          {r.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMarkReviewed(r)}
                                className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600/70 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                已處理
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDismissReport(r)}
                                className="inline-flex items-center gap-0.5 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-600"
                              >
                                <XCircle className="h-3 w-3" />
                                忽略
                              </button>
                            </>
                          )}
                          {r.status !== 'pending' && (
                            <span className="text-[10px] text-slate-500">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-[11px] text-amber-100/60">目前沒有舉報記錄。</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {modSubTab === 'mutes' && (
            <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
              <table className="min-w-full border-collapse text-[11px]">
                <thead className="bg-slate-900/90 text-amber-100">
                  <tr>
                    {['禁言 ID', '用戶', '直播房間', '禁言原因', '禁言分鐘', '禁言到期時間', '操作人', '操作'].map((h) => (
                      <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mutes.map((m) => (
                    <tr key={m.id} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                      <td className="px-2 py-1.5 font-mono text-[10px] text-slate-300">{m.id}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col">
                          <span className="font-medium">{m.userName}</span>
                          <span className="text-[10px] text-slate-400">{m.userId}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[10px] text-slate-400">{m.streamId}</td>
                      <td className="px-2 py-1.5 text-amber-100/80">{m.reason}</td>
                      <td className="px-2 py-1.5 tabular-nums text-center">{m.muteMin}</td>
                      <td className="px-2 py-1.5 text-[10px] whitespace-nowrap text-slate-300">{m.mutedUntil}</td>
                      <td className="px-2 py-1.5 text-slate-300">{m.operator}</td>
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => handleUnmute(m)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-amber-600/70 px-2 py-0.5 text-[10px] text-white hover:bg-amber-500"
                        >
                          <Mic2 className="h-3 w-3" />
                          解除禁言
                        </button>
                      </td>
                    </tr>
                  ))}
                  {mutes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-[11px] text-amber-100/60">目前沒有禁言記錄。</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── 功能清單 ── */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="直播管理功能清單"
          subtitle="涵蓋直播監控、聊天風控與單場收益視角。"
          items={blueprintFeatures}
        />
      )}

      {/* ── 直播詳情 Drawer ── */}
      {drawerStream && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-sky-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-sky-700/60 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-sky-100">
                  <Video className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-semibold">直播詳情</span>
                  <span className={[
                    'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px]',
                    drawerStream.status === 'live' ? 'bg-sky-500/30 text-sky-50'
                      : drawerStream.status === 'ended' ? 'bg-slate-600/50 text-slate-200'
                      : 'bg-rose-500/30 text-rose-100',
                  ].join(' ')}>
                    {drawerStream.status === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />}
                    {drawerStream.status === 'live' ? '直播中' : drawerStream.status === 'ended' ? '已結束' : '強制結束'}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-sky-200/80">{drawerStream.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerStream(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-700/80 bg-slate-900/80 text-sky-200 hover:border-sky-400 hover:text-sky-100"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-3 space-y-4 text-[11px] text-sky-50">
              {/* 主播資訊 */}
              <div className="space-y-2 rounded-xl border border-sky-700/60 bg-sky-500/10 p-3">
                <div className="text-xs font-semibold text-sky-200">主播資訊</div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><div className="text-slate-400">名稱</div><div className="font-medium">{drawerStream.hostName}</div></div>
                  <div><div className="text-slate-400">主播 ID</div><div>{drawerStream.hostId}</div></div>
                  <div><div className="text-slate-400">等級</div><div className="text-amber-300">Lv. {drawerStream.hostLevel}</div></div>
                </div>
              </div>

              {/* 直播資訊 */}
              <div className="space-y-2 rounded-xl border border-sky-700/60 bg-slate-900/40 p-3">
                <div className="text-xs font-semibold text-sky-200">直播資訊</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><div className="text-slate-400">開始時間</div><div>{drawerStream.startTime}</div></div>
                  <div><div className="text-slate-400">時長</div><div>{fmtDuration(drawerStream.durationMin)}</div></div>
                  <div><div className="text-slate-400">當前觀眾</div><div className="text-sky-200">{drawerStream.viewers.toLocaleString()}</div></div>
                  <div><div className="text-slate-400">峰值觀眾</div><div className="text-indigo-200">{drawerStream.viewersPeak.toLocaleString()}</div></div>
                </div>
              </div>

              {/* 收益概覽 */}
              <div className="space-y-2 rounded-xl border border-emerald-700/60 bg-emerald-500/10 p-3">
                <div className="text-xs font-semibold text-emerald-200">收益概覽</div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><div className="text-slate-400">禮物總收入</div><div className="text-emerald-200">PHP {drawerStream.giftIncome.toLocaleString()}</div></div>
                  <div><div className="text-slate-400">平台抽成</div><div className="text-slate-300">PHP {drawerStream.platformCut.toLocaleString()}</div></div>
                  <div><div className="text-slate-400">主播淨收入</div><div className="text-sky-200">PHP {drawerStream.hostNet.toLocaleString()}</div></div>
                </div>
              </div>

              {/* 聊天統計 */}
              <div className="space-y-2 rounded-xl border border-rose-700/60 bg-rose-500/10 p-3">
                <div className="text-xs font-semibold text-rose-200">聊天統計</div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><div className="text-slate-400">訊息總數</div><div>{drawerStream.chatTotal.toLocaleString()}</div></div>
                  <div><div className="text-slate-400">已刪除</div><div className="text-rose-300">{drawerStream.chatDeleted}</div></div>
                  <div><div className="text-slate-400">禁言人數</div><div className="text-amber-300">{drawerStream.chatMuted}</div></div>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex items-center gap-2">
                {drawerStream.status === 'live' && (
                  <button
                    type="button"
                    onClick={() => handleForceEnd(drawerStream)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-500"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    強制結束直播
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setChatStreamId(drawerStream.id)
                    setActiveTab('chat')
                    setDrawerStream(null)
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-rose-700/70 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-200 hover:bg-rose-500/20"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  前往聊天審核
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default LivePage
