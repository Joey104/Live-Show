/**
 * @file AdminApp.tsx
 * @description Single-page admin console orchestrating all modules within the shared layout.
 */

import { useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminLayout } from '../../layouts/AdminLayout'
import type { AdminModuleId } from '../../components/layout/Sidebar'
import { DashboardPage } from './DashboardPage'
import { PlayersPageSkeleton } from './PlayersPageSkeleton'
import { GenericModuleSkeleton } from './GenericModuleSkeleton'

/**
 * @description 使用 React.lazy 以降低初始 bundle 大小 — 直接回傳 module default，避免 async wrapper 回傳 undefined 的問題
 */
const PlayersPageLazy = lazy(() => import('./PlayersPage'))
const MembershipPageLazy = lazy(() => import('./MembershipPage'))
const BonusPageLazy = lazy(() => import('./BonusPage'))
const MarketingPageLazy = lazy(() => import('./MarketingPage'))
const FinancePageLazy = lazy(() => import('./FinancePage'))
const PaymentsPageLazy = lazy(() => import('./PaymentsPage'))
const RevenueAnalysisPageLazy = lazy(() => import('./RevenueAnalysisPage'))
const LivePageLazy = lazy(() => import('./LivePage'))
const GiftsPageLazy = lazy(() => import('./GiftsPage'))
const ModerationPageLazy = lazy(() => import('./ModerationPage'))
const PredictionMarketPageLazy = lazy(() => import('./PredictionMarketPage'))
const RbacPageLazy = lazy(() => import('./RbacPage'))
const SystemSettingsPageLazy = lazy(() => import('./SystemSettingsPage'))
const ReportsPageLazy = lazy(() => import('./ReportsPage'))

/**
 * @description 直接同步載入 BroadcasterApplicationsPage 以避免 Demo 環境下 lazy 未正確解析導致空白
 */
import BroadcasterApplicationsPage from './BroadcasterApplicationsPage'
import { DialogHost } from '../../components/common/DialogHost'

/**
 * @description Returns human-readable metadata for each module using i18n translations.
 */
function getModuleMeta(t: ReturnType<typeof useTranslation>['t']): Record<
  AdminModuleId,
  {
    title: string
    subtitle: string
    actions: {
      showCreate?: boolean
      showExport?: boolean
      showRefresh?: boolean
      showHelp?: boolean
    }
  }
> {
  return {
    dashboard: {
      title: t('modules.dashboard.title'),
      subtitle: t('modules.dashboard.subtitle'),
      actions: { showRefresh: true, showHelp: true },
    },
    players: {
      title: t('modules.players.title'),
      subtitle: t('modules.players.subtitle'),
      actions: { showCreate: false, showExport: true, showRefresh: true, showHelp: true },
    },
    membership: {
      title: t('modules.membership.title'),
      subtitle: t('modules.membership.subtitle'),
      actions: { showCreate: true, showRefresh: true, showHelp: true },
    },
    bonus: {
      title: t('modules.bonus.title'),
      subtitle: t('modules.bonus.subtitle'),
      actions: { showCreate: true, showExport: true, showHelp: true },
    },
    marketing: {
      title: t('modules.marketing.title'),
      subtitle: t('modules.marketing.subtitle'),
      actions: { showCreate: true, showExport: true, showHelp: true },
    },
    finance: {
      title: t('modules.finance.title'),
      subtitle: t('modules.finance.subtitle'),
      actions: { showExport: true, showRefresh: true, showHelp: true },
    },
    payments: {
      title: t('modules.payments.title'),
      subtitle: t('modules.payments.subtitle'),
      actions: { showExport: true, showRefresh: true, showHelp: true },
    },
    revenue: {
      title: t('modules.revenue.title'),
      subtitle: t('modules.revenue.subtitle'),
      actions: { showExport: true, showHelp: true },
    },
    live: {
      title: t('modules.live.title'),
      subtitle: t('modules.live.subtitle'),
      actions: { showRefresh: true, showHelp: true },
    },
    gifts: {
      title: t('modules.gifts.title'),
      subtitle: t('modules.gifts.subtitle'),
      actions: { showCreate: true, showExport: true, showHelp: true },
    },
    broadcasterApplications: {
      title: t('modules.broadcasterApplications.title'),
      subtitle: t('modules.broadcasterApplications.subtitle'),
      actions: { showRefresh: true, showHelp: true },
    },
    moderation: {
      title: t('modules.moderation.title'),
      subtitle: t('modules.moderation.subtitle'),
      actions: { showExport: true, showHelp: true },
    },
    prediction: {
      title: t('modules.prediction.title'),
      subtitle: t('modules.prediction.subtitle'),
      actions: { showExport: true, showHelp: true },
    },
    rbac: {
      title: t('modules.rbac.title'),
      subtitle: t('modules.rbac.subtitle'),
      actions: { showCreate: true, showExport: true, showHelp: true },
    },
    system: {
      title: t('modules.system.title'),
      subtitle: t('modules.system.subtitle'),
      actions: { showCreate: true, showHelp: true },
    },
    reports: {
      title: t('modules.reports.title'),
      subtitle: t('modules.reports.subtitle'),
      actions: { showExport: true, showHelp: true },
    },
  }
}

/**
 * @description Top-level admin app shell anchored on module state.
 */
export function AdminApp() {
  const { t } = useTranslation()
  const MODULE_META = getModuleMeta(t)
  const [activeModule, setActiveModule] = useState<AdminModuleId>('dashboard')
  /**
   * @description 控制模組切換時的 loading overlay，記錄目前正在載入的模組。
   */
  const [loadingModule, setLoadingModule] = useState<AdminModuleId | null>(null)

  const meta = MODULE_META[activeModule]
  const loadingMeta = loadingModule ? MODULE_META[loadingModule] : null

  /**
   * @description 切換模組時顯示約 400ms 的 loading overlay，並對非 Dashboard / Players 模組採用 lazy + skeleton。
   */
  const handleModuleChange = (moduleId: AdminModuleId) => {
    // 若點擊同一個模組，不重複觸發 loading
    if (moduleId === activeModule) return

    setLoadingModule(moduleId)
    setActiveModule(moduleId)

    // 至少顯示 400ms loading 動畫，避免只閃一下；同時避免舊的 timeout 關掉新的 loading。
    window.setTimeout(() => {
      setLoadingModule((current) => (current === moduleId ? null : current))
    }, 400)
  }

  let content: JSX.Element
  switch (activeModule) {
    case 'dashboard':
      // Dashboard 作為首頁，保留非 lazy 以確保首次載入有實際內容
      content = <DashboardPage />
      break
    case 'players':
      content = (
        <Suspense fallback={<PlayersPageSkeleton />}>
          <PlayersPageLazy />
        </Suspense>
      )
      break
    case 'membership':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <MembershipPageLazy />
        </Suspense>
      )
      break
    case 'bonus':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <BonusPageLazy />
        </Suspense>
      )
      break
    case 'marketing':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <MarketingPageLazy />
        </Suspense>
      )
      break
    case 'finance':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <FinancePageLazy />
        </Suspense>
      )
      break
    case 'payments':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <PaymentsPageLazy />
        </Suspense>
      )
      break
    case 'revenue':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <RevenueAnalysisPageLazy />
        </Suspense>
      )
      break
    case 'live':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <LivePageLazy />
        </Suspense>
      )
      break
    case 'gifts':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <GiftsPageLazy />
        </Suspense>
      )
      break
    case 'broadcasterApplications':
      // 直接同步載入以保證 Demo 環境立即顯示內容
      content = <BroadcasterApplicationsPage />
      break
    case 'moderation':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <ModerationPageLazy />
        </Suspense>
      )
      break
    case 'prediction':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <PredictionMarketPageLazy />
        </Suspense>
      )
      break
    case 'rbac':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <RbacPageLazy />
        </Suspense>
      )
      break
    case 'system':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <SystemSettingsPageLazy />
        </Suspense>
      )
      break
    case 'reports':
      content = (
        <Suspense fallback={<GenericModuleSkeleton />}>
          <ReportsPageLazy />
        </Suspense>
      )
      break
    default:
      content = <DashboardPage />
  }

  return (
    <>
      <DialogHost />
      <AdminLayout
        activeModule={activeModule}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={meta.actions}
        onModuleChange={handleModuleChange}
      >
        {content}
      </AdminLayout>

      {loadingModule && loadingMeta && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/90 px-6 py-4 shadow-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            <div className="text-xs font-medium text-slate-100">載入 {loadingMeta.title} 中…</div>
            <div className="text-[10px] text-slate-400">{loadingMeta.subtitle}</div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminApp