/**
 * File: src/components/MarketStrip.tsx
 * Description: Horizontal strip showing hot seduction-themed prediction markets (Polymarket style).
 */

import React from 'react'

/**
 * Single market item definition for the strip.
 */
interface MarketStripItem {
  id: string
  question: string
  yesProb: number
  volumeUsd: number
  tag: string
}

/**
 * MarketStrip component
 * Renders a horizontally scrollable list of hot markets in a Polymarket-like style.
 */
export default function MarketStrip(): JSX.Element {
  const items: MarketStripItem[] = [
    {
      id: 'm1',
      question: 'Will Luna&apos;s Midnight Temptation stream break 3k live viewers?',
      yesProb: 68,
      volumeUsd: 15320,
      tag: 'Viewers',
    },
    {
      id: 'm2',
      question: 'Will tonight&apos;s &quot;Heatwave in Manila&quot; stay Top 3 trending?',
      yesProb: 74,
      volumeUsd: 20480,
      tag: 'Trending',
    },
    {
      id: 'm3',
      question: 'Will Rico&apos;s &quot;Late Night Confessions&quot; unlock all flirty challenges?',
      yesProb: 59,
      volumeUsd: 9820,
      tag: 'Challenges',
    },
    {
      id: 'm4',
      question: 'Will any host reach 10k total tips during Neon Hour?',
      yesProb: 41,
      volumeUsd: 17650,
      tag: 'Tips',
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 mt-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
            Hot Seduction Markets
          </h2>
          <p className="text-xs text-slate-300/80">
            Trade on chemistry, heat, and high-stakes moments – inspired by Polymarket.
          </p>
        </div>
        <span className="hidden md:inline-flex text-[11px] px-2 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-200 border border-fuchsia-500/40">
          LIVE ODDS
        </span>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900" />
        <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent py-3 pr-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="relative min-w-[260px] max-w-xs rounded-xl border border-fuchsia-500/40 bg-gradient-to-br from-slate-900/90 via-slate-900 to-fuchsia-950/70 px-4 py-3 shadow-[0_0_25px_rgba(236,72,153,0.25)]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-fuchsia-200">
                  {item.tag}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-400/40">
                  Yes {item.yesProb}%
                </span>
              </div>
              <p className="text-xs text-slate-100 leading-snug line-clamp-2">{item.question}</p>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Volume</span>
                <span className="font-semibold text-amber-300">
                  ${item.volumeUsd.toLocaleString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
