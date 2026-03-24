/**
 * File: src/components/host/HostStreamPreview.tsx
 * Description: Main preview area for the host studio, including the
 *              simulated camera / screen output and controls for
 *              camera, microphone, quality, beauty, filters and
 *              background effects.
 */

import React from 'react'
import {
  Camera,
  Computer,
  Mic,
  MicOff,
  MonitorUp,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { NetworkStats } from './HostStudio'

/**
 * Props for HostStreamPreview component.
 */
interface HostStreamPreviewProps {
  /** Optional cover image URL to show behind controls. */
  coverImageUrl?: string
  /** Whether the camera is currently enabled. */
  isCameraOn: boolean
  /** Whether the microphone is currently enabled. */
  isMicOn: boolean
  /** Whether screen sharing is active. */
  isScreenSharing: boolean
  /** Selected camera position. */
  selectedCamera: 'front' | 'back'
  /** Selected output quality. */
  quality: '720p' | '1080p'
  /** Output volume percentage. */
  volume: number
  /** Whether beauty filter is enabled. */
  beautyEnabled: boolean
  /** Beauty intensity from 0 to 100. */
  beautyLevel: number
  /** Selected color filter. */
  filter: 'vivid' | 'warm' | 'cool' | 'mono'
  /** Selected background effect. */
  backgroundEffect: 'none' | 'blur' | 'neon' | 'green'
  /** Current network statistics. */
  networkStats: NetworkStats
  /** Toggle camera on/off. */
  onToggleCamera: () => void
  /** Toggle microphone on/off. */
  onToggleMic: () => void
  /** Toggle screen sharing on/off. */
  onToggleScreenShare: () => void
  /** Change camera (front/back). */
  onChangeCamera: (value: 'front' | 'back') => void
  /** Change quality (720p/1080p). */
  onChangeQuality: (value: '720p' | '1080p') => void
  /** Change output volume. */
  onChangeVolume: (value: number) => void
  /** Toggle beauty enabled. */
  onToggleBeauty: () => void
  /** Change beauty strength. */
  onChangeBeautyLevel: (value: number) => void
  /** Change color filter. */
  onChangeFilter: (value: 'vivid' | 'warm' | 'cool' | 'mono') => void
  /** Change background effect. */
  onChangeBackgroundEffect: (
    value: 'none' | 'blur' | 'neon' | 'green',
  ) => void
}

/**
 * HostStreamPreview
 * Shows a stylised preview frame that responds to the configured
 * filters and provides a toolbar for all visual/audio controls.
 */
export default function HostStreamPreview({
  coverImageUrl,
  isCameraOn,
  isMicOn,
  isScreenSharing,
  selectedCamera,
  quality,
  volume,
  beautyEnabled,
  beautyLevel,
  filter,
  backgroundEffect,
  networkStats,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onChangeCamera,
  onChangeQuality,
  onChangeVolume,
  onToggleBeauty,
  onChangeBeautyLevel,
  onChangeFilter,
  onChangeBackgroundEffect,
}: HostStreamPreviewProps): JSX.Element {
  const showMutedOverlay = !isMicOn
  const showCameraOff = !isCameraOn && !isScreenSharing

  let filterClass = ''
  if (filter === 'vivid') filterClass = 'saturate-150 contrast-110'
  if (filter === 'warm') filterClass = 'saturate-125 contrast-105 hue-rotate-15'
  if (filter === 'cool') {
    filterClass = 'saturate-120 contrast-105 hue-rotate-[-15deg]'
  }
  if (filter === 'mono') filterClass = 'grayscale contrast-110'

  let backgroundLabel = 'Original background'
  if (backgroundEffect === 'blur') backgroundLabel = 'Background blur'
  if (backgroundEffect === 'neon') backgroundLabel = 'Neon haze'
  if (backgroundEffect === 'green') backgroundLabel = 'Green screen'

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 md:p-4">
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
        <div className="absolute inset-0">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt="Stream preview"
              className={`h-full w-full object-cover transition duration-300 ${filterClass}`}
            />
          ) : (
            <img
              src="https://pub-cdn.sider.ai/u/U0VEHZKRVNE/web-coder/69c1391b1946bb370a2ee637/resource/ca511b7f-7d01-4b7e-960f-9cd0212cdb14.jpg"
              alt="Stream preview fallback"
              className={`h-full w-full object-cover transition duration-300 ${filterClass}`}
            />
          )}

          {backgroundEffect === 'blur' && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-md" />
          )}
          {backgroundEffect === 'neon' && (
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/20 via-transparent to-sky-400/25 mix-blend-screen backdrop-blur-sm" />
          )}
          {backgroundEffect === 'green' && (
            <div className="absolute inset-0 bg-emerald-600/40 mix-blend-multiply" />
          )}
        </div>

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between p-3 md:p-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[11px] text-slate-100 backdrop-blur-sm">
              <Camera className="h-3.5 w-3.5 text-fuchsia-300" />
              <span>
                {isScreenSharing
                  ? 'Screen sharing'
                  : isCameraOn
                    ? 'Camera preview'
                    : 'Camera off'}
              </span>
              <span className="mx-1 h-1 w-1 rounded-full bg-slate-500" />
              <span>{quality}</span>
            </div>

            <div className="flex flex-col items-end gap-1 text-[10px]">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-slate-100 backdrop-blur-sm">
                <MonitorUp className="h-3.5 w-3.5 text-sky-300" />
                <span>RTT {networkStats.rttMs} ms</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>{networkStats.bitrateKbps} kbps</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>{networkStats.fps} fps</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-slate-200 backdrop-blur-sm">
                <Computer className="h-3 w-3 text-emerald-300" />
                <span>
                  End-to-end latency{' '}
                  {Math.round((networkStats.liveLatencyMs / 1000) * 10) / 10} s
                </span>
              </div>
            </div>
          </div>

          {showCameraOff && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70">
              <Camera className="mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm font-medium text-slate-200">
                Camera is off
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Turn on your camera or start screen sharing so viewers can see
                you.
              </p>
            </div>
          )}

          {showMutedOverlay && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-20">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1 text-[11px] text-amber-100 backdrop-blur-sm">
                <MicOff className="h-3.5 w-3.5 text-amber-300" />
                <span>
                  Microphone muted – viewers cannot hear you while muted.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/95 p-3 text-[11px] md:p-4 md:text-xs">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={onToggleCamera}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
              isCameraOn
                ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
                : 'border-slate-700 bg-slate-900 text-slate-200'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={onToggleMic}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
              isMicOn
                ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
                : 'border-slate-700 bg-slate-900 text-slate-200'
            }`}
          >
            {isMicOn ? (
              <Mic className="h-3.5 w-3.5" />
            ) : (
              <MicOff className="h-3.5 w-3.5" />
            )}
            <span>Microphone</span>
          </button>

          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
              isScreenSharing
                ? 'border-sky-400/60 bg-sky-500/20 text-sky-100'
                : 'border-slate-700 bg-slate-900 text-slate-200'
            }`}
          >
            <MonitorUp className="h-3.5 w-3.5" />
            <span>Screen share</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5">
            <span className="text-[10px] text-slate-400">Camera</span>
            <select
              value={selectedCamera}
              onChange={(e) =>
                onChangeCamera(e.target.value === 'front' ? 'front' : 'back')
              }
              className="bg-transparent text-xs text-slate-100 outline-none"
            >
              <option value="front">Front camera</option>
              <option value="back">Back camera</option>
            </select>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5">
            <span className="text-[10px] text-slate-400">Quality</span>
            <select
              value={quality}
              onChange={(e) =>
                onChangeQuality(e.target.value === '720p' ? '720p' : '1080p')
              }
              className="bg-transparent text-xs text-slate-100 outline-none"
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5">
            {volume > 0 ? (
              <Volume2 className="h-3.5 w-3.5 text-slate-200" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-400" />
            )}
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              className="h-1 w-20 cursor-pointer accent-fuchsia-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onToggleBeauty}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
              beautyEnabled
                ? 'border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-100'
                : 'border-slate-700 bg-slate-900 text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Beauty</span>
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5">
            <span className="text-[10px] text-slate-400">Intensity</span>
            <input
              type="range"
              min={0}
              max={100}
              value={beautyLevel}
              onChange={(e) => onChangeBeautyLevel(Number(e.target.value))}
              disabled={!beautyEnabled}
              className="h-1 w-24 cursor-pointer accent-fuchsia-500 disabled:opacity-40"
            />
            <span className="text-[10px] text-slate-300">
              {beautyLevel}%
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-300" />
            <select
              value={filter}
              onChange={(e) =>
                onChangeFilter(e.target.value as 'vivid' | 'warm' | 'cool' | 'mono')
              }
              className="bg-transparent text-xs text-slate-100 outline-none"
            >
              <option value="vivid">Vivid</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
              <option value="mono">Mono</option>
            </select>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5">
            <span className="text-[10px] text-slate-400">Background</span>
            <select
              value={backgroundEffect}
              onChange={(e) =>
                onChangeBackgroundEffect(
                  e.target.value as 'none' | 'blur' | 'neon' | 'green',
                )
              }
              className="bg-transparent text-xs text-slate-100 outline-none"
            >
              <option value="none">Original</option>
              <option value="blur">Background blur</option>
              <option value="neon">Neon haze</option>
              <option value="green">Green screen</option>
            </select>
            <span className="text-[10px] text-slate-400">
              {backgroundLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
