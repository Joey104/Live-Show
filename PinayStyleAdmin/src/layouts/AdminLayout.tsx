/**
 * @file AdminLayout.tsx
 * @description Main admin layout with sidebar, header, global filters and content area.
 */

import type { ReactNode } from 'react'
import { Sidebar, type AdminModuleId } from '../components/layout/Sidebar'
import { TopBar, type TopBarActions } from '../components/layout/TopBar'
import { GlobalFilters } from '../components/layout/GlobalFilters'

/**
 * @description Props for AdminLayout.
 */
export interface AdminLayoutProps {
  /** Active module id for sidebar & title. */
  activeModule: AdminModuleId
  /** Human readable title for current module. */
  title: string
  /** Short description for the header. */
  subtitle?: string
  /** Actions configuration for the header. */
  actions?: TopBarActions
  /** Main content node. */
  children: ReactNode
  /** Module change handler, propagates from AdminApp. */
  onModuleChange: (id: AdminModuleId) => void
}

/**
 * @description High-level layout shell used by AdminApp.
 */
export function AdminLayout(props: AdminLayoutProps) {
  const { activeModule, title, subtitle, actions, children, onModuleChange } = props

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-50">
      <Sidebar activeId={activeModule} onChange={onModuleChange} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <GlobalFilters />
        <main className="flex-1 overflow-auto bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 p-4 md:p-6">
          <div className="mx-auto max-w-7xl space-y-4">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
