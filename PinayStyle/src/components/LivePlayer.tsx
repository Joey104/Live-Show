/**
 * File: src/components/LivePlayer.tsx
 * Description: Modal live player that shows embedded video, live seduction
 *              markets, gifts and chat. Includes viewer count and stream meta.
 */

import React, { useState } from 'react'
import { X } from 'lucide-react'
import ChatBox from './ChatBox'
import LiveMarkets from './LiveMarkets'
import GiftPanel from './GiftPanel'
import ChatOverlay from './ChatOverlay'
import type { LiveMarketItem } from '../types/markets'
import type { ChatMessage } from '../types/chat'
import { useUserStore } from '../store/useUserStore'

/**
 * Props for LivePlayer.
 */
interface LivePlayerProps {
  /** ID of the currently opened stream; null means closed. */
  id: string | null
  /** Optional stream title for display. */
  title?: string
  /** Optional streamer name. */
  streamer?: string
  /** Optional category label (entertainment/game/music…). */
  category?: string
  /** Optional current viewer count. */
  viewerCount?: number
  /** Optional list of markets tied to this stream. */
  markets?: LiveMarketItem[]
  /** Optional video URL for this stream (YouTube embed, etc.). */
  videoUrl?: string
  /** Callback when the modal should be closed. */
  onClose: () => void
  /** Trigger auth flow when a guest attempts login-only actions. */
  onRequireAuth: () => void
}

/**
 * LivePlayer
 * Shows a modal with an embedded player, live markets, gifts and chat.
 * Layout is constrained to viewport height; inner columns scroll independently
 * so that growing chat history will not break the overall structure.
 *
 * The chat message state is centralized here so both the side chat and the
 * floating overlay above the video can stay in sync.
 */
export default function LivePlayer({
  id,
  title,
  streamer,
  category,
  viewerCount,
  markets,
  videoUrl,
  onClose,
  onRequireAuth,
}: LivePlayerProps): JSX.Element | null {
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const currentUser = useUserStore((s) => s.currentUser)

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const now = Date.now()
    return [
      { id: '1', user: 'Anna', text: 'Hello from Manila!', createdAt: now },
      { id: '2', user: 'Jay', text: 'Nice stream 🔥', createdAt: now + 1 },
    ]
  })

  if (!id) return null

  // Fallback nightlife / club B-roll if no specific videoUrl is provided.
  const effectiveVideoUrl =
    videoUrl ||
    'https://www.youtube.com/embed/VF9_dCo6R8k?autoplay=1&mute=1&rel=0'

  const isAuthenticated = !!currentUser

  // Derived stats for the left-bottom info cards.
  const safeViewerCount = typeof viewerCount === 'number' ? viewerCount : 0
  const heatIndex = Math.min(
    100,
    Math.max(40, Math.round((safeViewerCount || 800) / 40)),
  )
  const activeMarketsCount =
    markets && markets.length > 0 ? markets.length : 3

  /**
   * Append a new user-authored chat message to the shared chat state.
   * Limits history length to keep memory usage predictable.
   */
  function handleSendMessage(text: string): void {
    const trimmed = text.trim()
    if (!trimmed) return

    const next: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user: 'You',
      text: trimmed,
      createdAt: Date.now(),
    }

    setMessages((prev) => [...prev, next].slice(-100))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-fuchsia-500/40 bg-slate-950 shadow-[0_0_50px_rgba(236,72,153,0.8)] md:mx-0">
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-3">
          {/* Left: video and mobile extras */}
          <div className="relative flex min-h-0 flex-col overflow-y-auto md:col-span-2">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3">
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm font-semibold text-slate-50">
                  {title || 'Seduction Market Live Session'}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  {streamer && <span>Host: {streamer}</span>}
                  {category && (
                    <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200">
                      {category}
                    </span>
                  )}
                  {typeof viewerCount === 'number' && (
                    <span className="rounded-full border border-emerald-400/60 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200">
                      {viewerCount.toLocaleString()} watching
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 text-slate-200 hover:bg-slate-900/90"
              >
                <X className="text-fuchsia-300" />
              </button>
            </div>

            {/* Scrollable content: video + info + (mobile) side panels */}
            <div className="flex-1 overflow-y-auto">
              {/* Video */}
              <div className="p-4 pb-3">
                <div className="relative aspect-video h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-black shadow-inner">
                  <iframe
                    title="live-player"
                    src={effectiveVideoUrl}
                    allow="autoplay; encrypted-media; fullscreen"
                    className="h-full w-full"
                    onLoad={() => setIsVideoLoading(false)}
                  />

                  {/* Floating chat overlay on top of the video, lower-left. */}
                  <ChatOverlay messages={messages} />

                  {isVideoLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
                      <p className="mt-3 text-[11px] text-slate-300">
                        Connecting to tonight&apos;s neon stream…
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-[11px] text-slate-300">
                  Watch the tension build and trade on every tempting moment –
                  simulated only, no real-money trading in this demo.
                </div>

                {/* Session info cards to fill left-bottom space */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] md:grid-cols-3">
                  <div className="rounded-lg border border-fuchsia-500/40 bg-slate-950/80 p-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-300">
                      Heat index
                    </div>
                    <div className="mt-1 text-sm font-semibold text-fuchsia-100">
                      {heatIndex}%
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Blended from viewers and neon-night vibes.
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-400/40 bg-slate-950/80 p-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Active markets
                    </div>
                    <div className="mt-1 text-sm font-semibold text-emerald-100">
                      {activeMarketsCount}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Yes/No seduction markets live for this room.
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-400/50 bg-slate-950/80 p-2 md:block">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                      Tonight&apos;s goal
                    </div>
                    <div className="mt-1 text-sm font-semibold text-amber-100">
                      Shot every 100 tips
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Chat can push the host over the edge with gifts &amp; tips.
                    </p>
                  </div>
                </div>
              </div>

              {/* Markets, gifts and chat on mobile (stacked under video) */}
              <div className="space-y-3 px-4 pb-4 md:hidden">
                <LiveMarkets
                  streamId={id}
                  streamTitle={title}
                  markets={markets}
                  onRequireAuth={onRequireAuth}
                />
                <GiftPanel
                  streamId={id}
                  streamerName={streamer}
                  onRequireAuth={onRequireAuth}
                />
                <div className="rounded-lg border border-slate-800 bg-slate-950/90">
                  <ChatBox
                    isAuthenticated={isAuthenticated}
                    onRequireAuth={onRequireAuth}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column (desktop): gifts + markets on top, chat fixed at bottom */}
          <div className="hidden min-h-0 flex-col border-l border-slate-800 bg-slate-950/95 md:flex">
            {/* Top: scrollable gifts & markets */}
            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-3 pb-2">
              <GiftPanel
                streamId={id}
                streamerName={streamer}
                onRequireAuth={onRequireAuth}
              />
              <LiveMarkets
                streamId={id}
                streamTitle={title}
                markets={markets}
                onRequireAuth={onRequireAuth}
              />
            </div>

            {/* Bottom: chat fixed at right-bottom with its own scroll for messages */}
            <div className="border-t border-slate-800 bg-slate-950/98 p-3">
              <div className="h-64">
                <ChatBox
                  isAuthenticated={isAuthenticated}
                  onRequireAuth={onRequireAuth}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}