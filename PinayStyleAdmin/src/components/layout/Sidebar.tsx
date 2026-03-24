/**
 * @file Sidebar.tsx
 * @description Collapsible and resizable left sidebar for the admin console.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Gift,
  Wallet,
  LineChart,
  Shield,
  Settings,
  ReceiptText,
  RadioTower,
  Coins,
  Layers3,
  FlagTriangleRight,
  UserCog,
} from 'lucide-react'

/**
 * @description Available top-level admin modules.
 */
export type AdminModuleId =
  | 'dashboard'
  | 'players'
  | 'membership'
  | 'bonus'
  | 'marketing'
  | 'finance'
  | 'payments'
  | 'revenue'
  | 'live'
  | 'gifts'
  | 'broadcasterApplications'
  | 'moderation'
  | 'prediction'
  | 'rbac'
  | 'system'
  | 'reports'

/**
 * @description Single module item in the sidebar.
 */
export interface SidebarModuleItem {
  id: AdminModuleId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * @description Group of sidebar modules with a caption.
 */
export interface SidebarGroup {
  id: string
  label: string
  items: SidebarModuleItem[]
}

/**
 * @description Props for Sidebar component.
 */
export interface SidebarProps {
  /** Currently active module. */
  activeId: AdminModuleId
  /** Called when user selects another module. */
  onChange: (id: AdminModuleId) => void
}

/**
 * @description Static sidebar configuration – covers all requested modules.
 */
export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    id: 'overview',
    label: '總覽',
    items: [
      { id: 'dashboard', label: '儀表板 Dashboard', icon: LayoutDashboard },
      { id: 'revenue', label: '收益分析', icon: LineChart },
      { id: 'reports', label: '報表中心', icon: ReceiptText },
    ],
  },
  {
    id: 'users',
    label: '用戶 & 等級',
    items: [
      { id: 'players', label: 'Player / 用戶管理', icon: Users },
      { id: 'membership', label: '會員等級管理', icon: UserCog },
      { id: 'broadcasterApplications', label: '主播申請審核', icon: FlagTriangleRight },
    ],
  },
  {
    id: 'economy',
    label: '經濟系統',
    items: [
      { id: 'bonus', label: 'Bonus 管理', icon: Coins },
      { id: 'finance', label: '財務管理 (點數/交易)', icon: Wallet },
      { id: 'payments', label: '支付管理 (通道/提領)', icon: Layers3 },
      { id: 'marketing', label: '市場營銷 (活動/券/推薦/任務)', icon: Gift },
    ],
  },
  {
    id: 'content',
    label: '內容 & 直播',
    items: [
      { id: 'live', label: '直播管理', icon: RadioTower },
      { id: 'gifts', label: '禮物管理', icon: Gift },
      { id: 'prediction', label: '預測市場', icon: LineChart },
      { id: 'moderation', label: '舉報 / 風控稽核', icon: Shield },
    ],
  },
  {
    id: 'system',
    label: '權限 & 系統',
    items: [
      { id: 'rbac', label: '權限管理 (RBAC)', icon: Shield },
      { id: 'system', label: '系統設定 / 公告', icon: Settings },
    ],
  },
]

/**
 * @description Left sidebar with collapse toggle and drag-to-resize behavior.
 */
export function Sidebar(props: SidebarProps) {
  const { activeId, onChange } = props
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)

  const minWidth = 200
  const maxWidth = 360

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isResizing || collapsed) return
      const nextWidth = Math.min(Math.max(event.clientX, minWidth), maxWidth)
      setWidth(nextWidth)
    },
    [collapsed, isResizing],
  )

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return
    setIsResizing(false)
  }, [isResizing])

  useEffect(() => {
    if (!isResizing) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp, isResizing])

  return (
    <aside
      className="relative flex h-full flex-col border-r border-slate-800/80 bg-slate-950/95"
      style={{ width: collapsed ? 72 : width }}
    >
      {/* Brand / Collapse toggle */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800/80 px-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-sky-500 bg-gradient-to-br from-sky-400 to-indigo-500" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-xs font-semibold tracking-wide text-slate-100">
                Streaming Admin
              </div>
              <div className="text-[10px] text-slate-500">Control Center</div>
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label={collapsed ? '展開側邊欄' : '收合側邊欄'}
          onClick={() => setCollapsed((v) => !v)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-sky-500/80 hover:text-sky-300"
        >
          <span className="text-[10px] font-semibold">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            {!collapsed && (
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={collapsed ? item.label : undefined}
                    onClick={() => onChange(item.id)}
                    className={[
                      'group flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs transition',
                      isActive
                        ? 'bg-sky-600/20 text-sky-200 shadow-inner shadow-sky-900'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-sky-100',
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'mr-2 h-4 w-4 flex-shrink-0',
                        isActive ? 'text-sky-300' : 'text-slate-400 group-hover:text-sky-200',
                      ].join(' ')}
                    />
                    {!collapsed && (
                      <span className="truncate text-[11px]">{item.label}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Resize handle – only when expanded */}
      {!collapsed && (
        <div
          onMouseDown={() => setIsResizing(true)}
          className={[
            'absolute inset-y-0 right-0 w-1 cursor-col-resize select-none',
            isResizing ? 'bg-sky-500/70' : 'bg-slate-800/80 hover:bg-sky-500/40',
          ].join(' ')}
        />
      )}
    </aside>
  )
}

export default Sidebar
