/**
 * File: src/components/NotificationsDialog.tsx
 * Description: Simple notifications dialog listing system messages triggered by
 *              actions like bets, gifts and password changes.
 */

import React from 'react'
import { useUserStore } from '../store/useUserStore'

/**
 * Props for NotificationsDialog.
 */
interface NotificationsDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Close the dialog. */
  onClose: () => void
}

/**
 * NotificationsDialog
 * Lists notifications with timestamps and read status.
 */
export default function NotificationsDialog({
  open,
  onClose,
}: NotificationsDialogProps): JSX.Element | null {
  const notifications = useUserStore((s) => s.notifications)
  const markNotificationRead = useUserStore((s) => s.markNotificationRead)

  if (!open) return null

  /**
   * Mark all notifications as read.
   */
  function handleMarkAll(): void {
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-[0_0_34px_rgba(15,23,42,0.9)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">Notifications</h2>
            <p className="text-[11px] text-slate-400">
              System messages for this demo session.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <button
              type="button"
              className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-300 hover:border-fuchsia-400 hover:text-fuchsia-200"
              onClick={handleMarkAll}
            >
              Mark all read
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-300 hover:border-fuchsia-400 hover:text-fuchsia-200"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              No notifications yet. Place a bet or send a gift to see activity
              here.
            </p>
          ) : (
            notifications
              .slice()
              .reverse()
              .map((n) => (
                <div
                  key={n.id}
                  className="rounded-md border border-slate-800 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-200"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="line-clamp-2">{n.message}</span>
                    {!n.read && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}