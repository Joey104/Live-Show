/**
 * File: src/components/GiftPanel.tsx
 * Description: Gift sending and gift leaderboard panel for the live player.
 *              Allows logged-in users to send demo gifts and shows Top 3 gifters.
 */

import React, { useMemo, useState } from 'react'
import { useUserStore } from '../store/useUserStore'

/**
 * Props for GiftPanel component.
 */
interface GiftPanelProps {
  /** Current stream identifier used for per-stream rankings. */
  streamId: string
  /** Display name of the streamer for copy. */
  streamerName?: string
  /** Trigger auth flow when a guest attempts to send gifts. */
  onRequireAuth: () => void
}

/**
 * Gift option definition used in the selection grid.
 */
interface GiftOption {
  id: string
  name: string
  /** Short label describing the visual effect. */
  label: string
  /** Cost in demo coins. */
  amount: number
}

/**
 * GiftPanel
 * Shows a selectable list of gifts plus current session Top 3 gifters.
 */
export default function GiftPanel({
  streamId,
  streamerName,
  onRequireAuth,
}: GiftPanelProps): JSX.Element {
  const { currentUser, balance, sendGift, giftRankingByStream } = useUserStore()
  const [selectedGiftId, setSelectedGiftId] = useState<string>('rose')
  const [status, setStatus] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(false)

  const isAuthenticated = !!currentUser

  const giftOptions: GiftOption[] = [
    { id: 'rose', name: 'Neon Rose', label: 'soft glow', amount: 10 },
    { id: 'heart', name: 'Neon Heart', label: 'heart burst', amount: 50 },
    { id: 'shower', name: 'Star Shower', label: 'full-screen', amount: 200 },
  ]

  const selectedGift = giftOptions.find((g) => g.id === selectedGiftId) ?? giftOptions[0]

  const ranking = useMemo(
    () => giftRankingByStream[streamId] || [],
    [giftRankingByStream, streamId],
  )

  /**
   * Trigger a gift send when authenticated; otherwise request auth.
   */
  function handleSendGift(): void {
    setStatus(null)
    if (!isAuthenticated) {
      onRequireAuth()
      return
    }
    const result = sendGift({ streamId, amount: selectedGift.amount })
    if (!result.ok) {
      if (result.error === 'INSUFFICIENT_BALANCE') {
        setStatus('Not enough coins. Try a smaller gift or top up via demo login.')
      } else {
        setStatus('Unable to send gift in this demo state.')
      }
      return
    }
    setStatus(
      `You sent ${selectedGift.name} to ${streamerName || 'the host'} (+${
        selectedGift.amount
      } coins).`,
    )
    if (selectedGift.amount >= 200) {
      setHighlight(true)
      setTimeout(() => setHighlight(false), 1200)
    }
  }

  return (
    <section className="space-y-2 rounded-lg border border-amber-400/50 bg-slate-950/80 p-3 shadow-[0_0_24px_rgba(251,191,36,0.4)]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-amber-200">Gifts &amp; ranking</h3>
        <span className="text-[10px] text-slate-400">
          {isAuthenticated ? 'Send gifts with demo coins.' : 'Log in to send gifts.'}
        </span>
      </div>

      {/* Gift selection */}
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {giftOptions.map((gift) => (
          <button
            key={gift.id}
            type="button"
            className={[
              'flex flex-col items-start rounded-lg border px-2 py-1.5 text-left transition-colors',
              selectedGiftId === gift.id
                ? 'border-amber-400 bg-amber-500/20 text-amber-50 shadow-[0_0_14px_rgba(251,191,36,0.7)]'
                : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:border-amber-400/70',
            ].join(' ')}
            onClick={() => setSelectedGiftId(gift.id)}
          >
            <span className="text-[10px] uppercase tracking-[0.18em] text-amber-300">
              {gift.label}
            </span>
            <span className="text-[11px] font-semibold">{gift.name}</span>
            <span className="mt-0.5 text-[10px] text-amber-200">
              {gift.amount.toLocaleString()} coins
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSendGift}
        className="mt-1 w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-[0_0_22px_rgba(251,191,36,0.8)] hover:from-amber-300 hover:to-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAuthenticated
          ? `Send ${selectedGift.name}${
              streamerName ? ` to ${streamerName}` : ''
            }`
          : 'Log in to send gifts'}
      </button>

      {status && <p className="mt-1 text-[10px] text-amber-200">{status}</p>}

      <div className="mt-2 rounded-md border border-slate-800 bg-slate-950/90 p-2 text-[11px]">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Top gifters
          </span>
          <span className="text-[10px] text-slate-500">
            {ranking.length === 0 ? 'No gifts yet' : 'Live for this session'}
          </span>
        </div>
        {ranking.length === 0 ? (
          <p className="text-[10px] text-slate-500">
            Be the first to light up the night with a gift.
          </p>
        ) : (
          <ul className="space-y-1">
            {ranking.map((r, index) => (
              <li
                key={r.user}
                className="flex items-center justify-between rounded-sm bg-slate-900/80 px-2 py-1"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                      index === 0
                        ? 'bg-amber-400 text-slate-900'
                        : index === 1
                          ? 'bg-slate-300 text-slate-900'
                          : 'bg-amber-700 text-amber-50',
                    ].join(' ')}
                  >
                    {index + 1}
                  </span>
                  <span className="text-[11px] text-slate-100">{r.user}</span>
                </div>
                <span className="text-[11px] font-semibold text-amber-300">
                  {r.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Simple highlight overlay for big gifts */}
      {highlight && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="h-40 w-40 rounded-full bg-gradient-to-br from-amber-400 via-fuchsia-500 to-rose-500 opacity-30 blur-3xl" />
        </div>
      )}

      {isAuthenticated && (
        <p className="mt-1 text-[10px] text-slate-500">
          Current balance:{' '}
          <span className="font-semibold text-amber-300">
            {balance.toLocaleString()} coins
          </span>
        </p>
      )}
    </section>
  )
}