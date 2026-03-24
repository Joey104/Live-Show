/**
 * File: src/components/ChatOverlay.tsx
 * Description: Lightweight chat overlay that shows the latest few chat
 *              messages as floating watermark-style bubbles over the video.
 *              Each message auto-hides after a short period so the video
 *              content remains the main focus.
 */

import React, { useEffect, useMemo, useState } from 'react'
import type { ChatMessage } from '../types/chat'

/**
 * Props for ChatOverlay component.
 */
interface ChatOverlayProps {
  /**
   * Full list of chat messages; the overlay will render a recent subset.
   */
  messages: ChatMessage[]
}

/**
 * Lifetime for a message to stay visible in the overlay (ms).
 */
const OVERLAY_LIFETIME_MS = 8000

/**
 * Interval for refreshing "now" so time-based visibility updates (ms).
 */
const REFRESH_INTERVAL_MS = 1000

/**
 * ChatOverlay
 * Renders up to the last three recent messages as semi-transparent bubbles in
 * the lower-left of the video. Messages automatically disappear a few seconds
 * after they are created so the overlay stays lightweight and non-intrusive.
 *
 * Layout:
 * - Username on the first line.
 * - Message text forced to a single visual line with ellipsis if too long.
 *   This avoids breaking one sentence into two rows and keeps the overlay
 *   compact without hiding the video focus area.
 */
export default function ChatOverlay({
  messages,
}: ChatOverlayProps): JSX.Element | null {
  const [now, setNow] = useState<number>(() => Date.now())

  /**
   * Tick "now" every REFRESH_INTERVAL_MS so that messages naturally expire
   * without requiring new messages to be pushed.
   */
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now())
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(id)
    }
  }, [])

  /**
   * Only keep messages that are within the overlay lifetime, and then take
   * the last three so the video is not overwhelmed.
   */
  const recentMessages = useMemo(() => {
    const fresh = messages.filter((m) => {
      const age = now - m.createdAt
      return age >= 0 && age <= OVERLAY_LIFETIME_MS
    })

    return fresh.slice(-3)
  }, [messages, now])

  if (recentMessages.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 left-0 flex justify-start px-4 md:bottom-8 md:px-6">
      <div className="flex flex-col gap-2">
        {recentMessages.map((m) => (
          <div
            key={m.id}
            className="max-w-[24ch] rounded-2xl bg-black/55 px-3 py-2 text-xs text-slate-50 shadow-lg shadow-black/50 backdrop-blur-sm md:max-w-[32ch]"
          >
            <div className="text-[11px] font-semibold text-fuchsia-200">
              {m.user}
            </div>
            <div className="mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis text-xs leading-snug">
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}