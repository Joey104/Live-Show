/**
 * @file Sidebar.tsx
 * @description Collapsible and resizable left sidebar for the admin console.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../lib/i18n'
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
  Globe,
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
 * @description Left sidebar with collapse toggle and drag-to-resize behavior.
 */
export function Sidebar(props: SidebarProps) {
  const { activeId, onChange } = props
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)
  const [currentLang, setCurrentLang] = useState(i18n.language)

  const minWidth = 200
  const maxWidth = 360

  const sidebarGroups: SidebarGroup[] = [
    {
      id: 'overview',
      label: t('sidebar.groups.overview'),
      items: [
        { id: 'dashboard', label: t('sidebar.items.dashboard'), icon: LayoutDashboard },
        { id: 'revenue', label: t('sidebar.items.revenue'), icon: LineChart },
        { id: 'reports', label: t('sidebar.items.reports'), icon: ReceiptText },
      ],
    },
    {
      id: 'users',
      label: t('sidebar.groups.users'),
      items: [
        { id: 'players', label: t('sidebar.items.players'), icon: Users },
        { id: 'membership', label: t('sidebar.items.membership'), icon: UserCog },
        { id: 'broadcasterApplications', label: t('sidebar.items.broadcasterApplications'), icon: FlagTriangleRight },
      ],
    },
    {
      id: 'economy',
      label: t('sidebar.groups.economy'),
      items: [
        { id: 'bonus', label: t('sidebar.items.bonus'), icon: Coins },
        { id: 'finance', label: t('sidebar.items.finance'), icon: Wallet },
        { id: 'payments', label: t('sidebar.items.payments'), icon: Layers3 },
        { id: 'marketing', label: t('sidebar.items.marketing'), icon: Gift },
      ],
    },
    {
      id: 'content',
      label: t('sidebar.groups.content'),
      items: [
        { id: 'live', label: t('sidebar.items.live'), icon: RadioTower },
        { id: 'gifts', label: t('sidebar.items.gifts'), icon: Gift },
        { id: 'prediction', label: t('sidebar.items.prediction'), icon: LineChart },
        { id: 'moderation', label: t('sidebar.items.moderation'), icon: Shield },
      ],
    },
    {
      id: 'system_group',
      label: t('sidebar.groups.system_group'),
      items: [
        { id: 'rbac', label: t('sidebar.items.rbac'), icon: Shield },
        { id: 'system', label: t('sidebar.items.system'), icon: Settings },
      ],
    },
  ]

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

  const handleLangSwitch = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('admin-lang', lang)
    setCurrentLang(lang)
  }

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
          aria-label={collapsed ? t('topbar.expand') : t('topbar.collapse')}
          onClick={() => setCollapsed((v) => !v)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-sky-500/80 hover:text-sky-300"
        >
          <span className="text-[10px] font-semibold">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {sidebarGroups.map((group) => (
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

      {/* Language switcher */}
      <div className="border-t border-slate-800/80 px-2 py-2">
        {collapsed ? (
          <button
            type="button"
            title={t('lang.switch')}
            onClick={() => handleLangSwitch(currentLang === 'zh-TW' ? 'en' : 'zh-TW')}
            className="inline-flex w-full items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-sky-300"
          >
            <Globe className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1 px-1">
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <button
              type="button"
              onClick={() => handleLangSwitch('zh-TW')}
              className={[
                'rounded px-1.5 py-0.5 text-[10px] font-semibold transition',
                currentLang === 'zh-TW'
                  ? 'bg-sky-600/30 text-sky-300'
                  : 'text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              {t('lang.zh')}
            </button>
            <span className="text-[10px] text-slate-700">|</span>
            <button
              type="button"
              onClick={() => handleLangSwitch('en')}
              className={[
                'rounded px-1.5 py-0.5 text-[10px] font-semibold transition',
                currentLang === 'en'
                  ? 'bg-sky-600/30 text-sky-300'
                  : 'text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              {t('lang.en')}
            </button>
          </div>
        )}
      </div>

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
