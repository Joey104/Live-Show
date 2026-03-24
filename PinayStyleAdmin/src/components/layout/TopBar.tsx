/**
 * @file TopBar.tsx
 * @description Shared page header with title, description and common actions.
 */

import type { ReactNode } from 'react'
import { Download, HelpCircle, Plus, RefreshCw } from 'lucide-react'

/**
 * @description Supported primary actions.
 */
export interface TopBarActions {
  showCreate?: boolean
  showExport?: boolean
  showRefresh?: boolean
  showHelp?: boolean
}

/**
 * @description Props for TopBar component.
 */
export interface TopBarProps {
  /** Page title, e.g. "Player 管理". */
  title: string
  /** Short explanation for PM / ops. */
  subtitle?: string
  /** Configuration for builtin right-side actions. */
  actions?: TopBarActions
  /** Optional extra action nodes (e.g. custom buttons). */
  extraActions?: ReactNode
}

/**
 * @description Consistent page header used across all admin pages.
 */
export function TopBar(props: TopBarProps) {
  const { title, subtitle, actions, extraActions } = props
  const { showCreate, showExport, showRefresh, showHelp } = actions || {}

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-5 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold tracking-tight text-slate-50">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        {showHelp && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-slate-200 hover:border-sky-500/80 hover:text-sky-200"
          >
            <HelpCircle className="h-3 w-3" />
            Help
          </button>
        )}
        {showRefresh && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-slate-200 hover:border-sky-500/80 hover:text-sky-200"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        )}
        {showExport && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-slate-200 hover:border-sky-500/80 hover:text-sky-200"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
        )}
        {showCreate && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-[10px] font-semibold text-white shadow-sm shadow-sky-900 hover:bg-sky-500"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        )}
      </div>
    </header>
  )
}

export default TopBar
