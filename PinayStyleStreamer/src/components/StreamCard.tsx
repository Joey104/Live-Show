/**
 * File: src/components/StreamCard.tsx
 * Description: Single stream card used in the streams grid, styled with
 *              seductive neon look and market-inspired stats, including
 *              category label and hover animations.
 */

import React, { useEffect, useState } from 'react'
import { Play, TrendingUp } from 'lucide-react'

/**
 * Props for StreamCard.
 */
export interface StreamCardProps {
  /** Unique stream identifier. */
  id: string
  /** Stream title. */
  title: string
  /** Host / streamer display name. */
  streamer: string
  /** Current concurrent viewers. */
  viewers: number
  /** Thumbnail image URL. */
  thumbnail: string
  /** Stream category (entertainment, game, music…). */
  category: string
  /** Optional list of descriptive tags. */
  tags?: string[]
  /** Callback when the card is opened. */
  onOpen: (id: string) => void
}

/**
 * StreamCard
 * Displays thumbnail, title, streamer, viewers and a market-style "Yes %" stat.
 */
export default function StreamCard({
  id,
  title,
  streamer,
  viewers,
  thumbnail,
  category,
  tags = [],
  onOpen,
}: StreamCardProps): JSX.Element {
  /** Local mounted state used to play a simple entrance animation. */
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(timer)
  }, [])

  // Simple heuristic to derive a "Yes %" from current viewers.
  const marketYesProb = Math.min(95, Math.max(35, Math.round(viewers / 50)))

  return (
    <article
      className={[
        'rounded-2xl border border-slate-800/80 bg-slate-950/80',
        'shadow-[0_0_25px_rgba(15,23,42,0.9)] overflow-hidden',
        'transition-all duration-300 transform-gpu',
        'hover:border-fuchsia-500/70 hover:shadow-[0_0_40px_rgba(236,72,153,0.7)]',
        'hover:-translate-y-1 hover:scale-[1.01]',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      ].join(' ')}
    >
      <div className="relative cursor-pointer" onClick={() => onOpen(id)}>
        <img src={thumbnail} alt={title} className="h-44 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 px-2 py-1 text-[10px] text-white shadow-[0_0_12px_rgba(236,72,153,0.8)]">
            LIVE
          </span>
          <span className="flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/80 px-2 py-1 text-xs text-slate-100">
            <Play size={10} className="text-emerald-400" />
            <span>{viewers.toLocaleString()}</span>
          </span>
        </div>

        <div className="absolute top-3 right-3 rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-100">
          {category}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-200/80">
              Temptation odds
            </span>
            <span className="text-xs font-semibold text-emerald-300">
              Yes {marketYesProb}%
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-amber-400/50 bg-slate-900/80 px-2 py-1 text-[11px] text-amber-200">
            <TrendingUp size={12} />
            <span>Hot Market</span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-fuchsia-500/60 bg-black/40 p-3 shadow-[0_0_30px_rgba(236,72,153,0.6)]">
            <Play className="text-fuchsia-300" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-50">
          {title}
        </h3>
        <div className="mt-1 text-xs text-slate-400">by {streamer}</div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300">
          <span className="text-slate-400">Seduction pool</span>
          <span className="font-semibold text-amber-300">
            ${Math.round(viewers * 3.2).toLocaleString()}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-1 text-[11px] text-fuchsia-200"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}