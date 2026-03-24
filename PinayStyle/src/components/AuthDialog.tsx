/**
 * File: src/components/AuthDialog.tsx
 * Description: Centered modal dialog providing login and registration forms
 *              for the demo auth flow (username/email + password).
 */

import React, { FormEvent, useState } from 'react'
import { useUserStore } from '../store/useUserStore'

/**
 * Props for AuthDialog.
 */
interface AuthDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Current mode: login or register. */
  mode: 'login' | 'register'
  /** Change active mode (e.g. when switching tabs). */
  onModeChange: (mode: 'login' | 'register') => void
  /** Close the dialog. */
  onClose: () => void
}

/**
 * AuthDialog
 * Wraps login and registration forms in a neon-themed modal.
 */
export default function AuthDialog({
  open,
  mode,
  onModeChange,
  onClose,
}: AuthDialogProps): JSX.Element | null {
  const login = useUserStore((s) => s.login)
  const register = useUserStore((s) => s.register)

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  /**
   * Handle form submit depending on current mode.
   */
  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    setError(null)

    if (mode === 'login') {
      if (!identifier || !password) {
        setError('Please enter your username/email and password.')
        return
      }
      login(identifier.trim(), password)
      onClose()
      setIdentifier('')
      setPassword('')
    } else {
      if (!username || !email || !password) {
        setError('Please fill in username, email and password.')
        return
      }
      register(username.trim(), email.trim(), password)
      onClose()
      setUsername('')
      setEmail('')
      setPassword('')
    }
  }

  /**
   * Quickly log in with a demo account so users can test features fast.
   */
  function handleDemoLogin(): void {
    setError(null)
    login('demo', 'demo')
    onClose()
    setIdentifier('')
    setPassword('')
    setUsername('')
    setEmail('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-fuchsia-500/40 bg-slate-950/95 p-5 shadow-[0_0_40px_rgba(236,72,153,0.8)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              {mode === 'login' ? 'Log in' : 'Sign up'} to Seduction Market
            </h2>
            <p className="text-[11px] text-slate-400">
              Demo-only auth — no real accounts or payments.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-700 bg-slate-900/90 px-2 py-1 text-[11px] text-slate-300 hover:border-fuchsia-400 hover:text-fuchsia-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Mode tabs */}
        <div className="mb-4 flex rounded-full border border-slate-800 bg-slate-950/80 p-1 text-[11px]">
          <button
            type="button"
            className={`flex-1 rounded-full px-3 py-1 ${
              mode === 'login'
                ? 'bg-fuchsia-500 text-white shadow-[0_0_16px_rgba(236,72,153,0.8)]'
                : 'text-slate-300'
            }`}
            onClick={() => onModeChange('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full px-3 py-1 ${
              mode === 'register'
                ? 'bg-fuchsia-500 text-white shadow-[0_0_16px_rgba(236,72,153,0.8)]'
                : 'text-slate-300'
            }`}
            onClick={() => onModeChange('register')}
          >
            Register
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === 'login' ? (
            <>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">
                  Username or Email
                </label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                  placeholder="luna / luna@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                  placeholder="Enter your password"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                  placeholder="Your public name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                  placeholder="At least 6 characters (demo only)"
                />
              </div>
            </>
          )}

          {error && <div className="text-[11px] text-rose-300">{error}</div>}

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(236,72,153,0.9)] hover:from-fuchsia-400 hover:to-rose-400"
          >
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleDemoLogin}
          className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-[11px] font-medium text-slate-200 hover:border-fuchsia-400 hover:text-fuchsia-200"
        >
          Quick demo login (no email needed)
        </button>
      </div>
    </div>
  )
}