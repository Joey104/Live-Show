/**
 * File: src/components/AccountSettingsDialog.tsx
 * Description: Account settings modal for changing password and viewing simple
 *              personal statistics like total bets and demo win rate placeholder.
 */

import React, { FormEvent, useMemo, useState } from 'react'
import { useUserStore } from '../store/useUserStore'

/**
 * Props for AccountSettingsDialog.
 */
interface AccountSettingsDialogProps {
  /** Whether the dialog is currently visible. */
  open: boolean
  /** Close the dialog. */
  onClose: () => void
}

/**
 * AccountSettingsDialog
 * Shows basic profile info, balance, betting stats and a change password form.
 */
export default function AccountSettingsDialog({
  open,
  onClose,
}: AccountSettingsDialogProps): JSX.Element | null {
  const { currentUser, balance, bets, changePassword, logout } = useUserStore()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

  const stats = useMemo(() => {
    const totalBets = bets.length
    const totalStaked = bets.reduce((sum, b) => sum + b.amount, 0)
    // Demo placeholder: treat half of bets as "wins".
    const wins = Math.floor(totalBets / 2)
    const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0
    return { totalBets, totalStaked, wins, winRate }
  }, [bets])

  if (!open) return null

  /**
   * Handle password change submission.
   */
  function handlePasswordSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    setPasswordMessage(null)
    if (!oldPassword || !newPassword) {
      setPasswordMessage('Please enter both current and new password.')
      return
    }
    const ok = changePassword(oldPassword, newPassword)
    if (!ok) {
      setPasswordMessage('Current password is incorrect (demo check).')
    } else {
      setPasswordMessage('Password updated successfully.')
      setOldPassword('')
      setNewPassword('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-[0_0_34px_rgba(15,23,42,0.9)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              Account settings
            </h2>
            <p className="text-[11px] text-slate-400">
              Manage your demo profile, password and prediction stats.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {currentUser && (
              <button
                type="button"
                className="rounded-full border border-rose-400/70 bg-rose-500/10 px-3 py-1 text-rose-200 hover:bg-rose-500/20"
                onClick={logout}
              >
                Log out
              </button>
            )}
            <button
              type="button"
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300 hover:border-fuchsia-400 hover:text-fuchsia-200"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {!currentUser ? (
          <div className="text-sm text-slate-300">
            You are not logged in. Please log in to view your profile and stats.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Profile summary */}
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/90 p-3">
              <h3 className="text-xs font-semibold text-fuchsia-200">
                Profile
              </h3>
              <div className="text-[11px] text-slate-300">
                <div className="mb-1">
                  <span className="text-slate-400">Username: </span>
                  <span>{currentUser.username}</span>
                </div>
                <div className="mb-1">
                  <span className="text-slate-400">Email: </span>
                  <span>{currentUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-400">Balance: </span>
                  <span className="font-semibold text-amber-300">
                    {balance.toLocaleString()} coins
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Prediction stats (demo)
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                  <div>
                    <div className="text-slate-400">Total bets</div>
                    <div className="text-sm font-semibold">
                      {stats.totalBets}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Total staked</div>
                    <div className="text-sm font-semibold text-amber-300">
                      {stats.totalStaked.toLocaleString()} coins
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Demo wins</div>
                    <div className="text-sm font-semibold text-emerald-300">
                      {stats.wins}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Win rate</div>
                    <div className="text-sm font-semibold text-emerald-300">
                      {stats.winRate}%
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  Win rate and wins are simulated for this demo; no real
                  settlement happens.
                </p>
              </div>
            </div>

            {/* Change password + recent bets */}
            <div className="space-y-3">
              <form
                className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/90 p-3"
                onSubmit={handlePasswordSubmit}
              >
                <h3 className="text-xs font-semibold text-fuchsia-200">
                  Change password (demo)
                </h3>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                  />
                </div>
                {passwordMessage && (
                  <div className="text-[11px] text-amber-300">
                    {passwordMessage}
                  </div>
                )}
                <button
                  type="submit"
                  className="mt-1 w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-2 text-sm font-semibold text-white hover:from-fuchsia-400 hover:to-rose-400"
                >
                  Update password
                </button>
              </form>

              <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/90 p-3">
                <h3 className="text-xs font-semibold text-fuchsia-200">
                  Recent bets
                </h3>
                {bets.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    You have not placed any predictions yet.
                  </p>
                ) : (
                  bets
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((b) => (
                      <div
                        key={b.id}
                        className="rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-[11px] text-slate-200"
                      >
                        <div className="line-clamp-1">
                          {b.marketLabel}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            {b.side} · {b.amount.toLocaleString()} coins
                          </span>
                          <span>
                            {new Date(b.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}