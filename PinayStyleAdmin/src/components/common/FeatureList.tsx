/**
 * @file FeatureList.tsx
 * @description 通用功能清單元件。當傳入 items 為空時，會自動顯示預設的「財務管理功能」項目（方便在財務頁面或其他地方做示意）。
 */

import React from 'react'
import { CreditCard, FileText, BarChart2, ShieldCheck, Search, Clock, Download, Database } from 'lucide-react'

/**
 * @description 功能項目資料型別
 */
export interface FeatureItem {
  id: number | string
  name: string
  description: string
  tag?: string
  /**
   * @description 可傳入 icon 元素（ReactNode），若未提供會使用內建 icon 對應
   */
  icon?: React.ReactNode
}

/**
 * @description FeatureListProps：FeatureList 元件的 props
 */
export interface FeatureListProps {
  title?: string
  subtitle?: string
  items?: FeatureItem[]
}

/**
 * @component FeatureCard
 * @description 顯示單一功能項目的卡片（內部使用的小型可重用元件）
 */
function FeatureCard({ item }: { item: FeatureItem }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/80 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-slate-900/60 p-2 text-slate-100">
          {item.icon ?? <FileText className="h-5 w-5 text-amber-400" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-100">{item.name}</h4>
            {item.tag && <span className="text-[11px] text-slate-400">{item.tag}</span>}
          </div>
          <p className="mt-1 text-[12px] text-slate-300">{item.description}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * @component FeatureList
 * @description
 * 通用功能清單元件：
 * - 若 items 為空陣列或未提供，會自動顯示一組預設的「財務管理功能」項目，避免頁面空白。
 * - 支援 title 與 subtitle。
 */
export function FeatureList({ title = '功能清單', subtitle, items }: FeatureListProps) {
  /**
   * @description 若呼叫方未傳入 items 或傳入空陣列，使用預設的財務功能示意項目
   */
  const defaultFinanceItems: FeatureItem[] = [
    {
      id: 'fm-1',
      name: '用戶點數餘額列表',
      description: '展示所有用戶點數總覽，支援篩選 Bonus 餘額，方便財務與稽核檢查。',
      tag: '餘額',
      icon: <Database className="h-5 w-5 text-emerald-400" />,
    },
    {
      id: 'fm-2',
      name: '流水 / 交易查詢',
      description: '全平台交易流水查詢，支援時間、類型、用戶與金額篩選並分頁顯示。',
      tag: '流水',
      icon: <BarChart2 className="h-5 w-5 text-sky-400" />,
    },
    {
      id: 'fm-3',
      name: '提領申請審核',
      description: '提領與出金申請的審核工作台，支援批准 / 拒絕並要求填寫原因與寫入 Audit Log。',
      tag: '審核',
      icon: <ShieldCheck className="h-5 w-5 text-rose-400" />,
    },
    {
      id: 'fm-4',
      name: '交易細節與費用拆分',
      description: '顯示手續費 / 實收 / 差額等明細欄位，避免只有單一金額造成誤解。',
      tag: '費用',
      icon: <CreditCard className="h-5 w-5 text-amber-400" />,
    },
    {
      id: 'fm-5',
      name: '查核與搜尋工具',
      description: '提供快速查詢（User ID / 訂單 / 備註）與篩選條件，建議搭配快取與節流。',
      tag: '查詢',
      icon: <Search className="h-5 w-5 text-slate-200" />,
    },
    {
      id: 'fm-6',
      name: '審計（Audit）與匯出',
      description: '所有高風險操作須寫入 Audit Log，並支援匯出 CSV / 報表以便稽核。',
      tag: '合規',
      icon: <Download className="h-5 w-5 text-indigo-400" />,
    },
    {
      id: 'fm-7',
      name: '交易狀態流程（狀態機）',
      description: '統一的狀態集合（提交/處理中/成功/失敗/撤銷）並支援多階段審核流程顯示。',
      tag: '狀態',
      icon: <Clock className="h-5 w-5 text-slate-300" />,
    },
    {
      id: 'fm-8',
      name: '報表中心 / 匯總',
      description: '支援按期間、平台、等級的匯總報表，並可匯出供財務分析使用。',
      tag: '報表',
      icon: <FileText className="h-5 w-5 text-emerald-300" />,
    },
  ]

  const effectiveItems = items && items.length > 0 ? items : defaultFinanceItems

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {effectiveItems.map((it) => (
          <FeatureCard key={it.id} item={it} />
        ))}
      </div>
    </div>
  )
}

export default FeatureList
