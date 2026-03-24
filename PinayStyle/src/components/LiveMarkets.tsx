/**
 * File: src/components/LiveMarkets.tsx
 * Description: Vertical list of prediction markets associated with the current
 *              live stream. Allows authenticated users to choose Yes/No and
 *              place demo coin bets, and to favorite markets.
 */

import React, { useMemo, useState } from 'react'
import type { LiveMarketItem } from '../types/markets'
import { useUserStore } from '../store/useUserStore'

/**
 * Props for LiveMarkets component.
 */
interface LiveMarketsProps {
  /** Optional title of the current stream, used for contextual copy. */
  streamTitle?: string
  /** Optional stream identifier for tracking favorites or bets. */
  streamId?: string
  /** Optional list of markets for this particular stream. */
  markets?: LiveMarketItem[]
  /** Trigger auth flow when a guest attempts to bet or favorite. */
  onRequireAuth?: () => void
}

/**
 * Internal map of selected outcome per market.
 */
type SelectedSideMap = Record<string, 'YES' | 'NO'>

/**
 * StakeMap
 * Per-market stake amount in demo coins.
 */
type StakeMap = Record<string, number>

/**
 * ErrorMap
 * Per-market status / error message for user feedback.
 */
type ErrorMap = Record<string, string | null>

/**
 * LiveMarkets
 * Shows Polymarket-style markets tied to the current live session, and lets
 * authenticated users place demo positions with coins.
 */
export default function LiveMarkets({
  streamTitle,
  streamId,
  markets,
  onRequireAuth,
}: LiveMarketsProps): JSX.Element {
  const { currentUser, balance, favorites, toggleFavorite, placeBet } =
    useUserStore()

  const isAuthenticated = !!currentUser

  const [selectedSideById, setSelectedSideById] = useState<SelectedSideMap>({})
  const [stakeById, setStakeById] = useState<StakeMap>({})
  const [errorById, setErrorById] = useState<ErrorMap>({})

  /**
   * Default demo markets used when no specific markets are passed in.
   */
  const fallbackMarkets: LiveMarketItem[] = [
    {
      id: 'lm1',
      label: 'Will this session reach 2.5k concurrent viewers?',
      yesProb: 63,
      poolUsd: 11240,
    },
    {
      id: 'lm2',
      label: 'Will the "neon flirt" challenge bar be completed?',
      yesProb: 57,
      poolUsd: 8420,
    },
    {
      id: 'lm3',
      label: 'Will tips cross $5k before the final song?',
      yesProb: 48,
      poolUsd: 13210,
    },
  ]

  /**
   * Choose the list of markets, preferring the per-stream markets when present.
   */
  const effectiveMarkets = useMemo<LiveMarketItem[]>(
    () => (markets && markets.length > 0 ? markets : fallbackMarkets),
    [markets],
  )

  /**
   * Update stake for a given market.
   */
  function handleStakeChange(id: string, raw: string): void {
    const value = Number(raw)
    if (Number.isNaN(value)) return
    setStakeById((prev) => ({ ...prev, [id]: value }))
  }

  /**
   * Toggle the simulated position for a given market.
   * Clicking the same side twice clears the position.
   */
  function handleToggleSide(id: string, side: 'YES' | 'NO'): void {
    setSelectedSideById((prev) => {
      const current = prev[id]
      const next = current === side ? undefined : side
      const nextMap: SelectedSideMap = { ...prev }
      if (next) {
        nextMap[id] = next
      } else {
        delete nextMap[id]
      }
      return nextMap
    })
    setErrorById((prev) => ({ ...prev, [id]: null }))
  }

  /**
   * Place a bet using the current stake and side for the market.
   */
  function handlePlaceBet(market: LiveMarketItem): void {
    const side = selectedSideById[market.id]
    const amount = stakeById[market.id] ?? 0

    if (!side) {
      setErrorById((prev) => ({
        ...prev,
        [market.id]: 'Choose Yes or No first.',
      }))
      return
    }

    if (!isAuthenticated) {
      onRequireAuth?.()
      return
    }

    const result = placeBet({ market, side, amount, streamTitle })
    if (!result.ok) {
      const msg =
        result.error === 'INSUFFICIENT_BALANCE'
          ? 'Not enough coins for this bet.'
          : result.error === 'INVALID_AMOUNT'
            ? 'Enter a valid stake amount.'
            : 'Unable to place this bet in demo mode.'
      setErrorById((prev) => ({ ...prev, [market.id]: msg }))
      return
    }

    setErrorById((prev) => ({
      ...prev,
      [market.id]: `Placed ${side} bet of ${amount} coins.`,
    }))
  }

  return (
    <section className="rounded-lg border border-fuchsia-500/40 bg-slate-950/70 p-3 shadow-[0_0_25px_rgba(236,72,153,0.25)]">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-fuchsia-200">
            Live Seduction Markets
          </h3>
          <p className="line-clamp-1 text-[11px] text-slate-400">
            {streamTitle
              ? `Trade on tonight's tension for "${streamTitle}".`
              : 'Trade on tonight’s chemistry in real time.'}
          </p>
        </div>
        <div className="text-right">
          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
            REAL-TIME
          </span>
          {isAuthenticated && (
            <div className="mt-1 text-[10px] text-slate-400">
              Balance:{' '}
              <span className="font-semibold text-amber-300">
                {balance.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <ul className="mt-1 space-y-2">
        {effectiveMarkets.map((m) => {
          const selectedSide = selectedSideById[m.id]
          const noProb = Math.max(0, Math.min(100, 100 - m.yesProb))
          const stake = stakeById[m.id] ?? 10
          const isFavorite = favorites.includes(m.id)
          const error = errorById[m.id]

          return (
            <li
              key={m.id}
              className="rounded-md border border-slate-800/80 bg-slate-900/80 px-2 py-2 transition-colors hover:border-fuchsia-500/60 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-[11px] text-slate-100 leading-tight">
                  {m.label}
                </p>
                <button
                  type="button"
                  className={`mt-0.5 rounded-full border px-1.5 py-0.5 text-[10px] ${
                    isFavorite
                      ? 'border-amber-400 bg-amber-500/20 text-amber-50'
                      : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-amber-400/70'
                  }`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      onRequireAuth?.()
                      return
                    }
                    toggleFavorite(m.id)
                  }}
                >
                  {isFavorite ? '★ Saved' : '☆ Save'}
                </button>
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] text-amber-300">
                  Pool ${m.poolUsd.toLocaleString()}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleSide(m.id, 'YES')}
                    className={[
                      'rounded-full border px-2 py-1 text-[10px] transition-colors focus:outline-none focus:ring-1 focus:ring-fuchsia-400/60',
                      selectedSide === 'YES'
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-emerald-400/70 hover:text-emerald-200',
                    ].join(' ')}
                  >
                    Yes {m.yesProb}%
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleSide(m.id, 'NO')}
                    className={[
                      'rounded-full border px-2 py-1 text-[10px] transition-colors focus:outline-none focus:ring-1 focus:ring-fuchsia-400/60',
                      selectedSide === 'NO'
                        ? 'border-rose-400 bg-rose-500/20 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                        : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-rose-400/70 hover:text-rose-100',
                    ].join(' ')}
                  >
                    No {noProb}%
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-300">
                  <span>Stake</span>
                  <input
                    type="number"
                    min={1}
                    value={stake}
                    onChange={(e) => handleStakeChange(m.id, e.target.value)}
                    className="w-16 rounded border border-slate-700 bg-slate-950/90 px-1 py-0.5 text-right text-[10px] text-slate-50 outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                  />
                  <span>coins</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlaceBet(m)}
                  className="rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-1 text-[10px] font-semibold text-white shadow-[0_0_14px_rgba(236,72,153,0.6)] hover:from-fuchsia-400 hover:to-rose-400"
                >
                  Place bet
                </button>
              </div>

              {error && (
                <p className="mt-1 text-[10px] text-amber-200">{error}</p>
              )}

              {selectedSide && !error && (
                <p className="mt-1 text-[10px] text-fuchsia-200">
                  {selectedSide === 'YES'
                    ? 'You are long YES on this temptation.'
                    : 'You are long NO, fading tonight’s heat.'}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}