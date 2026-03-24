/**
 * File: src/components/host/HostStudio.tsx
 * Description: Full-screen host studio interface for streamers. Provides
 *              live preview, device controls, network stats, chat
 *              moderation, audience management, prediction markets and
 *              earnings dashboard.
 */

import React, { useEffect, useState } from 'react'
import HostTopBar from './HostTopBar'
import HostStreamPreview from './HostStreamPreview'
import HostControlSidebar from './HostControlSidebar'

/**
 * Network statistics for the current stream session.
 */
export interface NetworkStats {
  /** Round-trip time in milliseconds. */
  rttMs: number
  /** Estimated encoder output bitrate in kbps. */
  bitrateKbps: number
  /** Video frame rate in frames per second. */
  fps: number
  /** Estimated end-to-end live latency in milliseconds. */
  liveLatencyMs: number
  /** High-level quality label derived from metrics. */
  qualityLabel: 'Good' | 'Fair' | 'Poor'
}

/**
 * HostStudioConfig
 * Base configuration set in the pre-live dialog.
 */
export interface HostStudioConfig {
  /** Stream title shown to viewers and in the studio header. */
  title: string
  /** Optional cover image URL used in the preview panel. */
  coverImageUrl?: string
  /** Human-readable category label. */
  category: string
  /** Up to 5 tags to describe the stream. */
  tags: string[]
  /** Visibility level for the room. */
  visibility: 'public' | 'fans' | 'private'
}

/**
 * Props for the HostStudio root component.
 */
interface HostStudioProps extends HostStudioConfig {
  /** Called when the host clicks "End Stream". */
  onEndStream: () => void
}

/**
 * HostStudio
 * High-level layout for the creator control room. Handles time,
 * simulated viewer count and network stats, and delegates visual
 * sections to dedicated components.
 */
export default function HostStudio({
  title: initialTitle,
  coverImageUrl,
  category,
  tags,
  visibility,
  onEndStream,
}: HostStudioProps): JSX.Element {
  const [title, setTitle] = useState(initialTitle)
  const [isLive, setIsLive] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const [elapsedMs, setElapsedMs] = useState(0)

  const [viewerCount, setViewerCount] = useState(1320)

  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    rttMs: 48,
    bitrateKbps: 4200,
    fps: 30,
    liveLatencyMs: 2600,
    qualityLabel: 'Good',
  })

  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [selectedCamera, setSelectedCamera] =
    useState<'front' | 'back'>('front')
  const [quality, setQuality] = useState<'720p' | '1080p'>('1080p')
  const [volume, setVolume] = useState(80)
  const [beautyEnabled, setBeautyEnabled] = useState(true)
  const [beautyLevel, setBeautyLevel] = useState(60)
  const [filter, setFilter] =
    useState<'vivid' | 'warm' | 'cool' | 'mono'>('vivid')
  const [backgroundEffect, setBackgroundEffect] =
    useState<'none' | 'blur' | 'neon' | 'green'>('blur')

  /**
   * Tick the session timer once per second while live.
   */
  useEffect(() => {
    if (!isLive) return
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt)
    }, 1000)
    return () => window.clearInterval(id)
  }, [isLive, startedAt])

  /**
   * Simulate viewer count and network stats updates every 2 seconds.
   * In a real implementation, these would come from WebRTC stats or
   * server-side metrics.
   */
  useEffect(() => {
    const id = window.setInterval(() => {
      setViewerCount((prev) => {
        const delta = Math.round((Math.random() - 0.3) * 40)
        const base = Math.max(0, prev + delta)
        return base
      })

      setNetworkStats((prev) => {
        const nextRtt = Math.max(
          18,
          Math.min(180, prev.rttMs + (Math.random() - 0.5) * 20),
        )
        const nextBitrate = Math.max(
          800,
          Math.min(6500, prev.bitrateKbps + (Math.random() - 0.5) * 600),
        )
        const nextFps = Math.max(
          18,
          Math.min(60, prev.fps + (Math.random() - 0.5) * 6),
        )
        const nextLatency = Math.max(
          1500,
          Math.min(6000, prev.liveLatencyMs + (Math.random() - 0.5) * 800),
        )

        let qualityLabel: NetworkStats['qualityLabel'] = 'Fair'
        if (nextRtt <= 70 && nextBitrate >= 2800 && nextLatency <= 3200) {
          qualityLabel = 'Good'
        } else if (
          nextRtt >= 130 ||
          nextBitrate < 1600 ||
          nextLatency > 4500
        ) {
          qualityLabel = 'Poor'
        }

        return {
          rttMs: Math.round(nextRtt),
          bitrateKbps: Math.round(nextBitrate),
          fps: Math.round(nextFps),
          liveLatencyMs: Math.round(nextLatency),
          qualityLabel,
        }
      })
    }, 2000)

    return () => window.clearInterval(id)
  }, [])

  /**
   * Pause or resume the outgoing stream.
   */
  function handleTogglePause(): void {
    if (!isLive) return
    setIsPaused((prev) => !prev)
  }

  /**
   * End the stream and close the studio.
   */
  function handleEndStream(): void {
    setIsLive(false)
    onEndStream()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-50">
      <HostTopBar
        title={title}
        onTitleChange={setTitle}
        category={category}
        tags={tags}
        visibility={visibility}
        isLive={isLive}
        isPaused={isPaused}
        elapsedMs={elapsedMs}
        viewerCount={viewerCount}
        networkStats={networkStats}
        onTogglePause={handleTogglePause}
        onEndStream={handleEndStream}
      />

      <div className="flex min-h-0 flex-1 gap-0 border-t border-slate-900">
        <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <HostStreamPreview
            coverImageUrl={coverImageUrl}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            selectedCamera={selectedCamera}
            quality={quality}
            volume={volume}
            beautyEnabled={beautyEnabled}
            beautyLevel={beautyLevel}
            filter={filter}
            backgroundEffect={backgroundEffect}
            networkStats={networkStats}
            onToggleCamera={() => setIsCameraOn((v) => !v)}
            onToggleMic={() => setIsMicOn((v) => !v)}
            onToggleScreenShare={() => setIsScreenSharing((v) => !v)}
            onChangeCamera={setSelectedCamera}
            onChangeQuality={setQuality}
            onChangeVolume={setVolume}
            onToggleBeauty={() => setBeautyEnabled((v) => !v)}
            onChangeBeautyLevel={setBeautyLevel}
            onChangeFilter={setFilter}
            onChangeBackgroundEffect={setBackgroundEffect}
          />
        </div>

        <div className="hidden w-full max-w-md border-l border-slate-900 bg-slate-950/98 md:block">
          <HostControlSidebar />
        </div>
      </div>

      <div className="block border-t border-slate-900 bg-slate-950/98 md:hidden">
        <HostControlSidebar mobile />
      </div>
    </div>
  )
}
