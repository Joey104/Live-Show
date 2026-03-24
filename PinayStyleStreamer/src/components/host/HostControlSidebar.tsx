/**
 * File: src/components/host/HostControlSidebar.tsx
 * Description: Right-hand control sidebar of the host studio providing
 *              chat moderation, audience management, prediction markets
 *              and earnings dashboard in tabbed panels.
 */

import React, { FormEvent, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Hash,
  MessageCircle,
  ShieldCheck,
  Timer,
  Users,
  Zap,
} from 'lucide-react'
import type { ChatMessage } from '../../types/chat'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'

/**
 * Audience member metadata shown in the management panel.
 */
interface AudienceMember {
  id: string
  name: string
  level: number
  isVip: boolean
  isModerator: boolean
  totalSpent: number
  status: 'normal' | 'muted' | 'kicked'
}

/**
 * Prediction market entry controlled by the host.
 */
interface HostMarket {
  id: string
  question: string
  pool: number
  yesRatio: number
  noRatio: number
  status: 'OPEN' | 'SETTLED'
  settledSide?: 'YES' | 'NO'
}

/**
 * Props for HostControlSidebar.
 * The optional "mobile" flag toggles a more compact padding.
 */
interface HostControlSidebarProps {
  /** When true, renders in mobile layout at the bottom. */
  mobile?: boolean
}

/**
 * HostControlSidebar
 * Handles all non-device controls: chat, audience, prediction markets
 * and revenue analytics via a simple tabbed interface.
 */
export default function HostControlSidebar({
  mobile,
}: HostControlSidebarProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<
    'chat' | 'audience' | 'markets' | 'earnings'
  >('chat')

  // --- Chat state ---

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const now = Date.now()
    return [
      {
        id: 'm1',
        user: 'Luna · Host',
        text: 'Tonight’s prediction: will chat hit 50 🌹 in 10 minutes?',
        createdAt: now - 30_000,
      },
      {
        id: 'm2',
        user: 'demo_vip',
        text: 'Got a few Star Showers ready 🔥',
        createdAt: now - 20_000,
      },
      {
        id: 'm3',
        user: 'guest_1024',
        text: 'First time here, chat is wild!',
        createdAt: now - 12_000,
      },
    ]
  })
  const [chatInput, setChatInput] = useState('')
  const [pinnedMessage, setPinnedMessage] = useState(
    'Welcome to Midnight Heat — gifts and prediction markets are demo-only.',
  )
  const [announcement, setAnnouncement] = useState('')
  const [slowModeEnabled, setSlowModeEnabled] = useState(false)
  const [slowModeInterval, setSlowModeInterval] = useState<5 | 30 | 60>(5)
  const [chatClosed, setChatClosed] = useState(false)

  const quickReplies: string[] = [
    'Thank you for the gifts, you’re on fire tonight!',
    'Predictions are demo-only — play for fun, not for money.',
    'If you’re new here, say hi in chat 👋',
    'Please keep the chat friendly and respectful.',
  ]

  // --- Audience state ---

  const [audience, setAudience] = useState<AudienceMember[]>([
    {
      id: 'a1',
      name: 'demo_vip',
      level: 35,
      isVip: true,
      isModerator: false,
      totalSpent: 9820,
      status: 'normal',
    },
    {
      id: 'a2',
      name: 'nightwalker',
      level: 22,
      isVip: false,
      isModerator: true,
      totalSpent: 4210,
      status: 'normal',
    },
    {
      id: 'a3',
      name: 'guest_1024',
      level: 5,
      isVip: false,
      isModerator: false,
      totalSpent: 0,
      status: 'normal',
    },
  ])
  const [audienceSearch, setAudienceSearch] = useState('')

  // --- Markets state ---

  const [markets, setMarkets] = useState<HostMarket[]>([
    {
      id: 'mk1',
      question: 'Will chat send 50 🌹 within the next 10 minutes?',
      pool: 18420,
      yesRatio: 0.72,
      noRatio: 0.28,
      status: 'OPEN',
    },
    {
      id: 'mk2',
      question: 'Will peak concurrent viewers break 3.5k this session?',
      pool: 13210,
      yesRatio: 0.64,
      noRatio: 0.36,
      status: 'OPEN',
    },
  ])
  const [marketQuestion, setMarketQuestion] = useState('')

  // --- Earnings state ---

  const [sessionEarnings] = useState(3920)
  const [todayEarnings] = useState(12840)
  const [weekEarnings] = useState(65210)
  const [monthEarnings] = useState(212480)

  const earningsTrend = useMemo(
    () => [
      { day: 'Mon', value: 7800 },
      { day: 'Tue', value: 9200 },
      { day: 'Wed', value: 10400 },
      { day: 'Thu', value: 8600 },
      { day: 'Fri', value: 13200 },
      { day: 'Sat', value: 14800 },
      { day: 'Sun', value: 9800 },
    ],
    [],
  )

  const mvpList = [
    { name: 'demo_vip', amount: 9820 },
    { name: 'nightwalker', amount: 4210 },
    { name: 'aurora_fan', amount: 3100 },
  ]

  const giftBreakdown = [
    { name: 'Neon Rose', value: 42 },
    { name: 'Neon Heart', value: 33 },
    { name: 'Star Shower', value: 25 },
  ]

  // --- Chat handlers ---

  /**
   * Send a chat message from host.
   */
  function handleSendChat(e?: FormEvent): void {
    if (e) e.preventDefault()
    if (!chatInput.trim() || chatClosed) return
    const now = Date.now()
    const msg: ChatMessage = {
      id: `host-${now}`,
      user: 'Luna · Host',
      text: chatInput.trim(),
      createdAt: now,
    }
    setChatMessages((prev) => [...prev, msg])
    setChatInput('')
  }

  /**
   * Fill input with a quick reply.
   */
  function handleSendQuickReply(text: string): void {
    setChatInput(text)
  }

  /**
   * Delete a single message from the moderation list.
   */
  function handleDeleteMessage(id: string): void {
    setChatMessages((prev) => prev.filter((m) => m.id !== id))
  }

  /**
   * Pin a new announcement to the top of the chat.
   */
  function handlePin(): void {
    if (!announcement.trim()) return
    setPinnedMessage(announcement.trim())
    setAnnouncement('')
  }

  // --- Audience handlers ---

  /**
   * Update audience member fields.
   */
  function updateAudienceStatus(
    id: string,
    patch: Partial<AudienceMember>,
  ): void {
    setAudience((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    )
  }

  /**
   * Toggle moderator role.
   */
  function handleToggleModerator(id: string): void {
    setAudience((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, isModerator: !a.isModerator } : a,
      ),
    )
  }

  const filteredAudience = useMemo(
    () =>
      audience.filter((a) =>
        a.name.toLowerCase().includes(audienceSearch.toLowerCase()),
      ),
    [audience, audienceSearch],
  )

  // --- Market handlers ---

  /**
   * Create a new prediction market.
   */
  function handleCreateMarket(e: FormEvent): void {
    e.preventDefault()
    const trimmed = marketQuestion.trim()
    if (!trimmed) return
    const id = `mk-${Date.now()}`
    const seed = 8000 + Math.round(Math.random() * 6000)
    const yesRatioRaw = 0.5 + (Math.random() - 0.5) * 0.2
    const clampedYes = Math.min(0.85, Math.max(0.15, yesRatioRaw))
    const noRatio = 1 - clampedYes

    const market: HostMarket = {
      id,
      question: trimmed,
      pool: seed,
      yesRatio: clampedYes,
      noRatio,
      status: 'OPEN',
    }

    setMarkets((prev) => [market, ...prev])
    setMarketQuestion('')
  }

  /**
   * Settle an existing market with a given side.
   */
  function handleSettleMarket(id: string, side: 'YES' | 'NO'): void {
    setMarkets((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'SETTLED',
              settledSide: side,
            }
          : m,
      ),
    )
  }

  // --- Derived metrics ---

  const activeAudienceCount = audience.filter(
    (a) => a.status !== 'kicked',
  ).length
  const vipCount = audience.filter(
    (a) => a.status !== 'kicked' && a.isVip,
  ).length
  const modCount = audience.filter(
    (a) => a.status !== 'kicked' && a.isModerator,
  ).length

  const containerPadding = mobile ? 'p-3' : 'p-4'
  const containerHeight = mobile
    ? 'h-[360px] overflow-y-auto'
    : 'h-full'

  return (
    <div
      className={`htc flex flex-col ${containerHeight} ${containerPadding} text-[11px] md:text-xs`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-100">
          {activeTab === 'chat' && (
            <MessageCircle className="h-3.5 w-3.5 text-fuchsia-300" />
          )}
          {activeTab === 'audience' && (
            <Users className="h-3.5 w-3.5 text-emerald-300" />
          )}
          {activeTab === 'markets' && (
            <Hash className="h-3.5 w-3.5 text-sky-300" />
          )}
          {activeTab === 'earnings' && (
            <BarChart3 className="h-3.5 w-3.5 text-amber-300" />
          )}
          <span>
            {activeTab === 'chat' && 'Chat moderation'}
            {activeTab === 'audience' && 'Audience'}
            {activeTab === 'markets' && 'Prediction markets'}
            {activeTab === 'earnings' && 'Earnings dashboard'}
          </span>
        </div>
        <div className="flex gap-1 rounded-full bg-slate-900/80 p-0.5 text-[10px] text-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`rounded-full px-2 py-0.5 ${
              activeTab === 'chat'
                ? 'bg-fuchsia-500 text-white'
                : 'hover:bg-slate-800'
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audience')}
            className={`rounded-full px-2 py-0.5 ${
              activeTab === 'audience'
                ? 'bg-emerald-500 text-white'
                : 'hover:bg-slate-800'
            }`}
          >
            Audience
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('markets')}
            className={`rounded-full px-2 py-0.5 ${
              activeTab === 'markets'
                ? 'bg-sky-500 text-white'
                : 'hover:bg-slate-800'
            }`}
          >
            Markets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`rounded-full px-2 py-0.5 ${
              activeTab === 'earnings'
                ? 'bg-amber-500 text-slate-950'
                : 'hover:bg-slate-800'
            }`}
          >
            Earnings
          </button>
        </div>
      </div>

      {activeTab === 'chat' && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {mobile ? (
            <div className="rounded-lg border border-fuchsia-500/40 bg-slate-950/95 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-fuchsia-200">
                  Pinned message
                </span>
                <span className="text-[10px] text-slate-500">
                  Always shown at the top of chat
                </span>
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] text-fuchsia-50">
                {pinnedMessage}
              </div>
            </div>
          ) : (
            <div className="space-y-2 rounded-lg border border-fuchsia-500/40 bg-slate-950/95 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-fuchsia-200">
                  Pinned message
                </span>
                <span className="text-[10px] text-slate-500">
                  Always shown at the top of chat
                </span>
              </div>
              <div className="rounded-md border border-fuchsia-500/40 bg-fuchsia-500/10 px-2.5 py-1.5 text-[11px] text-fuchsia-50">
                {pinnedMessage}
              </div>
              <div className="mt-1 flex gap-2">
                <input
                  value={announcement}
                  onChange={(e) =>
                    setAnnouncement(e.target.value.slice(0, 120))
                  }
                  placeholder="Type a new announcement to pin…"
                  className="flex-1 rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                />
                <button
                  type="button"
                  onClick={handlePin}
                  disabled={!announcement.trim()}
                  className="rounded-md bg-fuchsia-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Update
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/95 px-2.5 py-2">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] text-slate-200">
                <input
                  type="checkbox"
                  className="h-3 w-3 border-slate-600 bg-slate-900 text-fuchsia-500"
                  checked={slowModeEnabled}
                  onChange={() => setSlowModeEnabled((v) => !v)}
                />
                <Timer className="h-3.5 w-3.5 text-fuchsia-300" />
                <span>Slow mode</span>
                <select
                  value={slowModeInterval}
                  onChange={(e) =>
                    setSlowModeInterval(Number(e.target.value) as 5 | 30 | 60)
                  }
                  className="ml-1 bg-transparent text-[10px] text-slate-100 outline-none"
                >
                  <option value={5}>Every 5s</option>
                  <option value={30}>Every 30s</option>
                  <option value={60}>Every 60s</option>
                </select>
              </label>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] text-slate-200">
                <input
                  type="checkbox"
                  className="h-3 w-3 border-slate-600 bg-slate-900 text-fuchsia-500"
                  checked={chatClosed}
                  onChange={() => setChatClosed((v) => !v)}
                />
                <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                <span>Close chat</span>
              </label>
            </div>
            <span className="text-[10px] text-slate-500">
              {chatClosed
                ? 'Chat is temporarily closed for all viewers'
                : slowModeEnabled
                  ? `Slow mode enabled (1 message every ${slowModeInterval}s)`
                  : 'Normal chat mode'}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-800 bg-slate-950/95">
            <div className="flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className="group rounded-md border border-slate-800 bg-slate-900/90 px-2 py-1.5 text-[11px] text-slate-100"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-fuchsia-200">
                      {m.user}
                    </span>
                    <div className="hidden gap-1 text-[10px] text-slate-400 group-hover:flex">
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(m.id)}
                        className="rounded-full bg-slate-800 px-1.5 py-0.5 hover:bg-rose-500/20 hover:text-rose-200"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-slate-800 px-1.5 py-0.5 hover:bg-amber-500/20 hover:text-amber-200"
                      >
                        Mute
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-slate-800 px-1.5 py-0.5 hover:bg-rose-500/20 hover:text-rose-200"
                      >
                        Kick
                      </button>
                    </div>
                  </div>
                  <p className="mt-0.5 text-slate-200">{m.text}</p>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <p className="py-4 text-center text-[11px] text-slate-500">
                  No chat messages yet.
                </p>
              )}
            </div>

            <div className="border-t border-slate-800 px-2.5 py-2">
              <div className="mb-1 flex flex-wrap gap-1.5 text-[10px]">
                {quickReplies.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => handleSendQuickReply(text)}
                    className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-200 hover:border-fuchsia-400/70 hover:text-fuchsia-100"
                  >
                    {text}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) =>
                    setChatInput(e.target.value.slice(0, 180))
                  }
                  disabled={chatClosed}
                  placeholder={
                    chatClosed
                      ? 'Chat is currently closed'
                      : 'Type a message, use @username to mention a viewer…'
                  }
                  className="flex-1 rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-50 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                />
                <button
                  type="submit"
                  disabled={chatClosed || !chatInput.trim()}
                  className="inline-flex items-center gap-1 rounded-md bg-fuchsia-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audience' && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-slate-950/95 px-2.5 py-2">
            <div className="flex flex-wrap items-center gap-3 text-[10px]">
              <span>Active {activeAudienceCount}</span>
              <span className="text-emerald-300">VIP {vipCount}</span>
              <span className="text-sky-300">Mods {modCount}</span>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
          </div>

          <div className="flex items-center gap-2">
            <input
              value={audienceSearch}
              onChange={(e) => setAudienceSearch(e.target.value)}
              placeholder="Search viewers…"
              className="flex-1 rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-50 outline-none placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/60"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
            {filteredAudience.map((a) => (
              <div
                key={a.id}
                className="rounded-md border border-slate-800 bg-slate-950/95 px-2.5 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-semibold text-slate-100">
                        {a.name}
                      </span>
                      <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                        Lv.{a.level}
                      </span>
                      {a.isVip && (
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-200">
                          VIP
                        </span>
                      )}
                      {a.isModerator && (
                        <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-200">
                          Mod
                        </span>
                      )}
                      {a.status === 'muted' && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                          Muted
                        </span>
                      )}
                      {a.status === 'kicked' && (
                        <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-200">
                          Kicked
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      Gifts this session {a.totalSpent.toLocaleString()} coins
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleToggleModerator(a.id)}
                      className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-100 hover:bg-sky-500/30 hover:text-sky-50"
                    >
                      {a.isModerator ? 'Remove mod' : 'Make mod'}
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateAudienceStatus(a.id, { status: 'muted' })
                        }
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-amber-100 hover:bg-amber-500/25"
                      >
                        Mute
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateAudienceStatus(a.id, { status: 'kicked' })
                        }
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-rose-100 hover:bg-rose-500/25"
                      >
                        Kick
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredAudience.length === 0 && (
              <p className="py-4 text-center text-[11px] text-slate-500">
                No viewers match your search.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'markets' && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <form
            onSubmit={handleCreateMarket}
            className="space-y-2 rounded-lg border border-sky-500/40 bg-slate-950/95 px-2.5 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-sky-200">
                Create new prediction market
              </span>
              <span className="text-[10px] text-slate-500">
                All questions are Yes / No
              </span>
            </div>
            <input
              value={marketQuestion}
              onChange={(e) =>
                setMarketQuestion(e.target.value.slice(0, 80))
              }
              placeholder="e.g. Will concurrent viewers break 4,000 this stream?"
              className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-50 outline-none placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/60"
            />
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-slate-500">
                New markets appear instantly in the viewer prediction panel.
              </span>
              <button
                type="submit"
                disabled={!marketQuestion.trim()}
                className="inline-flex items-center gap-1 rounded-md bg-sky-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Hash className="h-3.5 w-3.5" />
                <span>Create</span>
              </button>
            </div>
          </form>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {markets.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-slate-800 bg-slate-950/95 px-2.5 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-100">
                      {m.question}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-slate-300">
                        Pool {m.pool.toLocaleString()} coins
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
                        Yes {Math.round(m.yesRatio * 100)}%
                      </span>
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-200">
                        No {Math.round(m.noRatio * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px]">
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        m.status === 'OPEN'
                          ? 'bg-sky-500/20 text-sky-200'
                          : 'bg-emerald-500/20 text-emerald-200'
                      }`}
                    >
                      {m.status === 'OPEN' ? 'Open' : 'Settled'}
                    </span>
                    {m.status === 'SETTLED' && m.settledSide && (
                      <span className="text-[10px] text-slate-400">
                        Correct side:{' '}
                        {m.settledSide === 'YES' ? 'Yes' : 'No'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-slate-500">
                    After settlement, rewards are distributed using demo
                    rules only.
                  </span>
                  {m.status === 'OPEN' ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSettleMarket(m.id, 'YES')}
                        className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-100 hover:bg-emerald-500/30"
                      >
                        Settle as YES
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSettleMarket(m.id, 'NO')}
                        className="rounded-full bg-rose-500/20 px-2 py-0.5 text-rose-100 hover:bg-rose-500/30"
                      >
                        Settle as NO
                      </button>
                    </div>
                  ) : (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-slate-400">
                      This market is already settled
                    </span>
                  )}
                </div>
              </div>
            ))}
            {markets.length === 0 && (
              <p className="py-4 text-center text-[11px] text-slate-500">
                No prediction markets created yet.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-amber-500/40 bg-slate-950/95 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-amber-200">
                  This session
                </span>
                <DollarSign className="h-3.5 w-3.5 text-amber-300" />
              </div>
              <p className="mt-1 text-sm font-semibold text-amber-100">
                {sessionEarnings.toLocaleString()} coins
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/95 px-2.5 py-2">
              <span className="text-[10px] font-semibold text-slate-200">
                Today
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {todayEarnings.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-300">
                +18% vs yesterday
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/95 px-2.5 py-2">
              <span className="text-[10px] font-semibold text-slate-200">
                This week
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {weekEarnings.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/95 px-2.5 py-2">
              <span className="text-[10px] font-semibold text-slate-200">
                This month
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {monthEarnings.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-950/95 px-2.5 py-2">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-semibold text-slate-200">
                  Weekly earnings trend
                </span>
                <Zap className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningsTrend}>
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#facc15"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/95 px-2.5 py-2">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-semibold text-slate-200">
                  MVP leaderboard
                </span>
                <Users className="h-3.5 w-3.5 text-amber-300" />
              </div>
              <ol className="space-y-1 text-[11px]">
                {mvpList.map((item, idx) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between rounded-md bg-slate-900/80 px-2 py-1"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-700 text-slate-100'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-slate-100">
                        {item.name}
                      </span>
                    </span>
                    <span className="text-amber-200">
                      {item.amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/95 px-2.5 py-2">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-semibold text-slate-200">
                  Gift breakdown
                </span>
                <DollarSign className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <div className="space-y-1.5 text-[11px]">
                {giftBreakdown.map((g) => (
                  <div key={g.name}>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200">{g.name}</span>
                      <span className="text-slate-400">
                        {g.value}%
                      </span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-amber-300 to-emerald-300"
                        style={{ width: `${g.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
