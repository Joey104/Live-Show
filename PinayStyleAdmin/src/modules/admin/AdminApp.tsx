/**
 * @file AdminApp.tsx
 * @description Single-page admin console orchestrating all modules within the shared layout.
 */

import { useState, lazy, Suspense } from 'react'
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
 * @description Human-readable metadata for each module, used for header text and loading overlay.
 */
const MODULE_META: Record<
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
> = {
  dashboard: {
    title: '儀表板 Dashboard',
    subtitle: '總覽用戶、直播、收入與待辦工作台狀態。',
    actions: { showRefresh: true, showHelp: true },
  },
  players: {
    title: 'Player / 用戶管理',
    subtitle: '搜尋、篩選與管理 Player / Broadcaster 帳號與點數。',
    actions: { showCreate: false, showExport: true, showRefresh: true, showHelp: true },
  },
  membership: {
    title: '會員等級管理',
    subtitle: '定義會員等級門檻、提成倍率與權益。',
    actions: { showCreate: true, showRefresh: true, showHelp: true },
  },
  bonus: {
    title: 'Bonus 管理',
    subtitle: '管理 Bonus 餘額、等級、兌換率與發放 / 回滾。',
    actions: { showCreate: true, showExport: true, showHelp: true },
  },
  marketing: {
    title: '市場營銷（活動 / 優惠券 / 推薦 / 任務）',
    subtitle: '一站式管理成長與促活相關行銷模組。',
    actions: { showCreate: true, showExport: true, showHelp: true },
  },
  finance: {
    title: '財務管理（點數 / 交易）',
    subtitle: '用戶餘額、交易流水與提領審核工作台。',
    actions: { showExport: true, showRefresh: true, showHelp: true },
  },
  payments: {
    title: '支付管理（通道 / 對帳）',
    subtitle: '充值通道、人工審核與對帳報表統一入口。',
    actions: { showExport: true, showRefresh: true, showHelp: true },
  },
  revenue: {
    title: '收益分析',
    subtitle: '平台總收益、Top 主播與禮物銷售分析。',
    actions: { showExport: true, showHelp: true },
  },
  live: {
    title: '直播管理',
    subtitle: '實時監控直播狀態、聊天與單場收益。',
    actions: { showRefresh: true, showHelp: true },
  },
  gifts: {
    title: '禮物管理',
    subtitle: '配置禮物目錄、價格與銷售統計。',
    actions: { showCreate: true, showExport: true, showHelp: true },
  },
  broadcasterApplications: {
    title: '主播申請審核',
    subtitle: '管理主播申請與審核結果，串聯 Player 與 RBAC。',
    actions: { showRefresh: true, showHelp: true },
  },
  moderation: {
    title: '舉報 / 風控稽核',
    subtitle: '處理舉報與封禁，保障內容與平台安全。',
    actions: { showExport: true, showHelp: true },
  },
  prediction: {
    title: '預測市場管理',
    subtitle: '管理預測市場與押注記錄，配合風控。',
    actions: { showExport: true, showHelp: true },
  },
  rbac: {
    title: '權限管理（RBAC）',
    subtitle: '管理管理員、角色與細粒度操作許可。',
    actions: { showCreate: true, showExport: true, showHelp: true },
  },
  system: {
    title: '系統設定與公告',
    subtitle: '公告、敏感詞、抽成比例與主題切換。',
    actions: { showCreate: true, showHelp: true },
  },
  reports: {
    title: '報表中心',
    subtitle: '日常運營與財務稽核所需的各類報表入口。',
    actions: { showExport: true, showHelp: true },
  },
}

/**
 * @description Top-level admin app shell anchored on module state.
 */
export function AdminApp() {
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