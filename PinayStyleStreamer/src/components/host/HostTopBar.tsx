/**
 * File: src/components/host/HostTopBar.tsx
 * Description: Top header bar of the host studio with live status,
 *              editable title, key stream metrics and primary actions
 *              such as pause and end stream.
 */

import React from 'react'
import {
  Activity,
  Eye,
  Pause,
  Play,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Users,
} from 'lucide-react'
import type { NetworkStats } from './HostStudio'

/**
 * Props for HostTopBar component.
 */
interface HostTopBarProps {
  /** Current editable stream title. */
  title: string
  /** Update callback for stream title. */
  onTitleChange: (title: string) => void
  /** Category label shown next to title. */
  category: string
  /** Stream tags. */
  tags: string[]
  /** Visibility level. */
  visibility: 'public' | 'fans' | 'private'
  /** Whether the stream is currently live. */
  isLive: boolean
  /** Whether the stream is paused. */
  isPaused: boolean
  /** Elapsed time in milliseconds since start. */
  elapsedMs: number
  /** Simulated current viewer count. */
  viewerCount: number
  /** Network quality metrics. */
  networkStats: NetworkStats
  /** Toggle pause / resume streaming. */
  onTogglePause: () => void
  /** End the stream and exit studio. */
  onEndStream: () => void
}

/**
 * Format elapsed milliseconds as HH:mm:ss.
 */
function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0')
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0')
  return `${h}:${m}:${s}`
}

/**
 * HostTopBar
 * Displays the key session information and primary controls at the
 * top of the studio.
 */
export default function HostTopBar({
  title,
  onTitleChange,
  category,
  tags,
  visibility,
  isLive,
  isPaused,
  elapsedMs,
  viewerCount,
  networkStats,
  onTogglePause,
  onEndStream,
}: HostTopBarProps): JSX.Element {
  const elapsedLabel = formatElapsed(elapsedMs)
  const qualityIcon =
    networkStats.qualityLabel === 'Good'
      ? SignalHigh
      : networkStats.qualityLabel === 'Fair'
        ? SignalMedium
        : SignalLow

  const QualityIcon = qualityIcon

  const visibilityLabel =
    visibility === 'public'
      ? 'Public'
      : visibility === 'fans'
        ? 'Fans only'
        : 'Private'

  const statusLabel = !isLive ? 'Offline' : isPaused ? 'Paused' : 'LIVE'
  const statusColor = !isLive || isPaused ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-900 bg-slate-950/98 px-4 py-3 md:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] text-slate-200">
            <span
              className={`h-2 w-2 rounded-full ${statusColor} shadow-[0_0_12px_rgba(248,113,113,0.8)]`}
            />
            <span className="font-semibold">{statusLabel}</span>
            <span className="ml-1 text-[10px] text-slate-500">
              {elapsedLabel}
            </span>
          </div>

          <span className="hidden rounded-full border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[10px] text-slate-300 sm:inline">
            {category}
          </span>

          <div className="hidden items-center gap-1 text-[10px] text-slate-400 md:flex">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-fuchsia-500/40 bg-slate-950/80 px-2 py-0.5 text-[10px] text-fuchsia-200"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-slate-500">+{tags.length - 3}</span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/90 px-2 py-0.5 text-[10px] text-slate-300">
            <Eye className="h-3 w-3 text-slate-500" />
            {visibilityLabel}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, 50))}
            className="min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-50 outline-none placeholder:text-slate-600 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
            placeholder="Edit stream title (updates for viewers in real time)"
          />
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 text-[11px]">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/90 px-2.5 py-1 text-[11px] text-slate-200">
            <Users className="h-3.5 w-3.5 text-emerald-300" />
            <span className="font-semibold text-emerald-200">
              {viewerCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">viewers</span>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-950/90 px-2.5 py-1 text-[10px] text-slate-300 sm:flex">
            <QualityIcon className="h-3.5 w-3.5 text-sky-300" />
            <span>{networkStats.qualityLabel}</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span>RTT {networkStats.rttMs} ms</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span>{networkStats.bitrateKbps} kbps</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span>{networkStats.fps} fps</span>
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={onTogglePause}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5 text-emerald-300" />
                <span>Resume stream</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-300" />
                <span>Pause stream</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onEndStream}
            className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(248,113,113,0.7)] hover:bg-rose-500 hover:shadow-[0_0_26px_rgba(248,113,113,0.9)] focus:outline-none focus:ring-2 focus:ring-rose-400/70"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>End stream</span>
          </button>
        </div>
      </div>
    </header>
  )
}
