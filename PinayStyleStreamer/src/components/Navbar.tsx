/**
 * File: src/components/Navbar.tsx
 * Description: Top navigation bar showing brand, section anchors, auth actions
 *              and user balance/notifications for the Seduction Market app.
 */

import React from 'react'
import type { AuthUser } from '../store/useUserStore'
import { useUserStore } from '../store/useUserStore'

/**
 * Props for Navbar component.
 */
interface NavbarProps {
  /** Currently logged-in user, or null if guest. */
  currentUser: AuthUser | null
  /** Current demo coin balance for the logged-in user. */
  balance: number
  /** Open auth dialog in login or register mode. */
  onOpenAuth: (mode: 'login' | 'register') => void
  /** Open notifications dialog. */
  onOpenNotifications: () => void
  /** Open account settings dialog. */
  onOpenAccount: () => void
}

/**
 * scrollToSection
 * Smoothly scrolls to a section by DOM id.
 */
function scrollToSection(id: string): void {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * Navbar
 * Main top bar with logo, navigation anchors and user/auth controls.
 */
export default function Navbar({
  currentUser,
  balance,
  onOpenAuth,
  onOpenNotifications,
  onOpenAccount,
}: NavbarProps): JSX.Element {
  const notifications = useUserStore((s) => s.notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div
          className="flex cursor-pointer items-center gap-2"
          onClick={() => scrollToSection('top')}
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 shadow-[0_0_18px_rgba(236,72,153,0.9)]" />
          <div className="leading-tight">
            <div className="text-xs font-semibold tracking-[0.22em] text-fuchsia-200">
              SEDUCTION
            </div>
            <div className="text-sm font-semibold text-slate-50">
              Neon Market Live
            </div>
          </div>
        </div>

        {/* Section anchors */}
        <nav className="hidden items-center gap-6 text-xs text-slate-300 md:flex">
          <button
            type="button"
            className="hover:text-fuchsia-300"
            onClick={() => scrollToSection('live')}
          >
            Live streams
          </button>
          <button
            type="button"
            className="hover:text-fuchsia-300"
            onClick={() => scrollToSection('markets')}
          >
            Hot markets
          </button>
        </nav>

        {/* Right side: auth / user info */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="rounded-full border border-amber-400/60 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.6)]">
                Balance:{' '}
                <span className="tabular-nums">
                  {balance.toLocaleString()} coins
                </span>
              </div>
            </div>
          )}

          {/* Notifications */}
          {currentUser && (
            <button
              type="button"
              className="relative rounded-full border border-slate-700 bg-slate-900/80 p-1.5 text-slate-200 hover:border-fuchsia-400 hover:text-fuchsia-200"
              onClick={onOpenNotifications}
            >
              <span className="block h-3 w-3 rounded-[3px] border border-fuchsia-400 bg-gradient-to-br from-fuchsia-500 to-rose-500 shadow-[0_0_10px_rgba(236,72,153,0.9)]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[9px] font-semibold text-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Auth buttons or user menu */}
          {currentUser ? (
            <button
              type="button"
              onClick={onOpenAccount}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-100 hover:border-fuchsia-400"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-500 text-[11px] font-semibold text-white">
                {currentUser.username.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[90px] truncate text-left sm:block">
                {currentUser.username}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-slate-100 hover:border-fuchsia-400 hover:text-fuchsia-200"
                onClick={() => onOpenAuth('login')}
              >
                Log in
              </button>
              <button
                type="button"
                className="rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-1.5 text-xs font-medium text-white shadow-[0_0_18px_rgba(236,72,153,0.8)] hover:from-fuchsia-400 hover:to-rose-400"
                onClick={() => onOpenAuth('register')}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}