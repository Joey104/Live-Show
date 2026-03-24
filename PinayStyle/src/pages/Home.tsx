/**
 * File: src/pages/Home.tsx
 * Description: Home page for the Seduction Market live platform with Filipino
 *              neon seduction style and Polymarket-inspired prediction markets.
 *              Implements viewer-facing features: live list, filters, entry
 *              into streams, markets, gifts and basic auth flow.
 */

import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import FilterBar from '../components/FilterBar'
import StreamCard from '../components/StreamCard'
import LivePlayer from '../components/LivePlayer'
import MarketStrip from '../components/MarketStrip'
import AuthDialog from '../components/AuthDialog'
import AccountSettingsDialog from '../components/AccountSettingsDialog'
import NotificationsDialog from '../components/NotificationsDialog'
import { useUserStore } from '../store/useUserStore'
import { DEMO_STREAMS } from '../config/streams'

/**
 * Home
 * Assembles the homepage: navbar, hero, markets strip, filters,
 * grid of streams and live player modal, plus auth-related dialogs.
 */
export default function Home(): JSX.Element {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [openStream, setOpenStream] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const currentUser = useUserStore((s) => s.currentUser)
  const balance = useUserStore((s) => s.balance)

  // Auth-related UI state.
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [accountOpen, setAccountOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  /**
   * Simulate initial loading state for live streams.
   */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  /**
   * Active streams collection. In this demo it is static, but it could
   * easily be replaced by a live API response.
   */
  const streams = DEMO_STREAMS

  /**
   * Collect unique tags across streams.
   */
  const tags = useMemo(() => {
    const set = new Set<string>()
    streams.forEach((s) => s.tags.forEach((t) => set.add(t)))
    return Array.from(set)
  }, [streams])

  /**
   * Collect unique categories across streams.
   */
  const categories = useMemo(() => {
    const set = new Set<string>()
    streams.forEach((s) => set.add(s.category))
    return Array.from(set)
  }, [streams])

  /**
   * Filters streams by query, active tag and active category.
   */
  const filtered = streams.filter((s) => {
    const q = query.trim().toLowerCase()
    const matchQuery =
      q === '' ||
      s.title.toLowerCase().includes(q) ||
      s.streamer.toLowerCase().includes(q) ||
      s.tags.join(' ').toLowerCase().includes(q)

    const matchTag = !activeTag || s.tags.includes(activeTag)
    const matchCategory = !activeCategory || s.category === activeCategory

    return matchQuery && matchTag && matchCategory
  })

  /**
   * Currently opened stream object, derived from ID.
   */
  const currentStream = useMemo(
    () => streams.find((x) => x.id === openStream) || null,
    [streams, openStream],
  )

  /**
   * Open auth dialog in a specific mode when a guest attempts a login-only feature.
   */
  function handleRequireAuth(): void {
    setAuthMode('login')
    setAuthOpen(true)
  }

  return (
    <div
      id="top"
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50"
    >
      <Navbar
        currentUser={currentUser}
        balance={balance}
        onOpenAuth={(mode) => {
          setAuthMode(mode)
          setAuthOpen(true)
        }}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <main className="py-8">
        {/* Hero section */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
          <div className="md:col-span-3 rounded-2xl border border-fuchsia-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-fuchsia-950/60 p-6 shadow-[0_0_50px_rgba(236,72,153,0.5)] md:p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-3 md:col-span-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 md:text-3xl">
                  Neon Seduction · Live in the Philippines
                </h1>
                <p className="max-w-xl text-sm text-slate-300">
                  Discover hosts who turn every glance into a wager. Watch,
                  flirt and play on Polymarket-inspired prediction markets – all
                  wrapped in a tropical Manila night.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-fuchsia-500/40 bg-fuchsia-500/20 px-3 py-1 text-fuchsia-200">
                    24/7 Temptation Streams
                  </span>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-emerald-200">
                    Polymarket-style Odds
                  </span>
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-amber-200">
                    No real money — demo only
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="relative w-full max-w-xs">
                  <div className="absolute inset-0 rounded-2xl bg-fuchsia-500/40 blur-2xl" />
                  <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90">
                    <img
                      src="https://pub-cdn.sider.ai/u/U0VEHZKRVNE/web-coder/69c1391b1946bb370a2ee637/resource/8c406b77-d39d-4fbf-9577-5037fe2b1279.jpg"
                      className="h-32 w-full object-cover"
                      alt="Neon seduction"
                    />
                    <div className="space-y-2 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-200">
                          Tonight&apos;s Heat Index
                        </span>
                        <span className="font-semibold text-amber-300">
                          87%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Markets are pricing in a record-breaking Manila neon
                        night.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hot markets polymarket strip */}
        <div id="markets">
          <MarketStrip />
        </div>

        {/* Filters */}
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          tags={tags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Streams grid */}
        <section id="live" className="mx-auto max-w-7xl px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Live Temptation Streams
            </h2>
            <span className="text-[11px] text-slate-400">
              {isLoading
                ? 'Loading live sessions…'
                : `${filtered.length} sessions · filtered by your taste`}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    // Skeleton card while loading
                    key={idx}
                    className="h-60 animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/80"
                  />
                ))
              : filtered.map((s) => (
                  <StreamCard
                    key={s.id}
                    id={s.id}
                    title={s.title}
                    streamer={s.streamer}
                    viewers={s.viewers}
                    thumbnail={s.thumbnail}
                    category={s.category}
                    tags={s.tags}
                    onOpen={(id) => setOpenStream(id)}
                  />
                ))}
          </div>
        </section>
      </main>

      <LivePlayer
        id={openStream}
        title={currentStream?.title}
        streamer={currentStream?.streamer}
        category={currentStream?.category}
        viewerCount={currentStream?.viewers}
        markets={currentStream?.markets}
        videoUrl={currentStream?.videoUrl}
        onClose={() => setOpenStream(null)}
        onRequireAuth={handleRequireAuth}
      />

      <AuthDialog
        open={authOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setAuthOpen(false)}
      />
      <AccountSettingsDialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
      />
      <NotificationsDialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <footer className="mt-12 border-t border-slate-800 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} Seduction Market — Manila Neon Demo ·
          Inspired by Polymarket · No real-money trading.
        </div>
      </footer>
    </div>
  )
}