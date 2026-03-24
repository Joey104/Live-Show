/**
 * File: src/pages/Home.tsx
 * Description: Landing page for the Seduction Market Host Studio.
 *              Provides a neon hero section and a "Go live" entry
 *              that opens the pre-live configuration dialog and then
 *              launches the full-screen HostStudio interface.
 */

import React, { useState } from 'react'
import HostStudio, { HostStudioConfig } from '../components/host/HostStudio'
import StartLiveDialog from '../components/host/StartLiveDialog'

/**
 * Home
 * Main entry for creators to start a live session. Shows a neon-styled
 * hero with explanation of the host studio, and wires the "Go live"
 * button to the StartLiveDialog / HostStudio flow.
 */
export default function Home(): JSX.Element {
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [hostConfig, setHostConfig] = useState<HostStudioConfig | null>(null)

  return (
    <div
      id="top"
      className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50"
    >
      {/* Top brand bar + quick start button */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-fuchsia-500 to-emerald-400 shadow-lg shadow-fuchsia-500/40" />
          <div>
            <div className="text-sm font-semibold tracking-wide text-fuchsia-100">
              Seduction Market
            </div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Creator Studio
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsStartDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(236,72,153,0.7)] transition hover:bg-fuchsia-400 hover:shadow-[0_0_26px_rgba(236,72,153,0.9)] focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
        >
          <span className="text-base leading-none">+</span>
          <span>Go live</span>
        </button>
      </header>

      {/* Hero section: explanation + preview */}
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-6 md:flex-row md:items-center">
        <section className="md:w-1/2">
          <h1 className="bg-gradient-to-r from-fuchsia-300 via-emerald-200 to-sky-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl">
            Launch your midnight show
            <br className="hidden md:block" />
            and control every second of heat and revenue.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
            A host-only live control room. Track viewers, network quality, gifts
            and prediction markets in real time—start, steer and analyse every
            session from a single neon dashboard.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2 rounded-full border border-fuchsia-500/40 bg-slate-950/70 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Live viewer count &amp; network health monitoring</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-slate-950/70 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
              <span>Chat moderation, mute tools &amp; moderator roles</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-sky-400/40 bg-slate-950/70 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Prediction markets and earnings dashboards</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIsStartDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(236,72,153,0.7)] transition hover:bg-fuchsia-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.9)] focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
            >
              <span className="text-base leading-none">+</span>
              <span>Go live</span>
            </button>
            <p className="text-[11px] text-slate-400">
              Set a title, cover and category, then jump straight into the Host Studio.
              This is a visual demo only—no real streaming or payouts.
            </p>
          </div>
        </section>

        <section className="md:w-1/2">
          <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/40 bg-slate-950/80 p-4 shadow-[0_0_40px_rgba(236,72,153,0.6)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Host Studio preview</span>
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-50">
                  Live preview, chat tools and earnings analytics
                </h2>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Preview your camera and screen on the left, while keeping full control
                  over chat, audience, prediction markets and earnings on the right.
                  Every control is designed around a single late-night session.
                </p>
              </div>
              <div className="hidden h-24 w-32 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 sm:block">
                <img
                  src="https://pub-cdn.sider.ai/u/U0VEHZKRVNE/web-coder/69c1391b1946bb370a2ee637/resource/28160d04-f958-4fde-911c-cb505fcb804e.jpg"
                  alt="Creator studio preview"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-lg border border-fuchsia-500/40 bg-slate-950/90 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-300">
                  Live metrics
                </div>
                <p className="mt-1 text-slate-300">
                  Viewer count, network quality, RTT, bitrate and FPS updated every second
                  so you can focus on performance, not technical issues.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-400/40 bg-slate-950/90 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Chat &amp; safety
                </div>
                <p className="mt-1 text-slate-300">
                  Announcements, pinned messages, slow mode and fast moderation controls
                  to keep your room safe and high-energy.
                </p>
              </div>
              <div className="rounded-lg border border-sky-400/40 bg-slate-950/90 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                  Markets &amp; goals
                </div>
                <p className="mt-1 text-slate-300">
                  Create and settle yes/no prediction markets, track live pools and align
                  them with your on-stream goals.
                </p>
              </div>
              <div className="rounded-lg border border-amber-400/50 bg-slate-950/90 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                  Host-first experience
                </div>
                <p className="mt-1 text-slate-300">
                  Beauty, filters, quality, background and screen share in a single panel,
                  designed so you can manage everything without leaving the shot.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Pre-live configuration dialog */}
      {isStartDialogOpen && (
        <StartLiveDialog
          isOpen={isStartDialogOpen}
          onClose={() => setIsStartDialogOpen(false)}
          onStart={(config) => {
            setHostConfig(config)
            setIsStartDialogOpen(false)
          }}
        />
      )}

      {/* Full-screen host studio when a stream is active */}
      {hostConfig && (
        <HostStudio
          title={hostConfig.title}
          coverImageUrl={hostConfig.coverImageUrl}
          category={hostConfig.category}
          tags={hostConfig.tags}
          visibility={hostConfig.visibility}
          onEndStream={() => {
            setHostConfig(null)
          }}
        />
      )}
    </div>
  )
}
