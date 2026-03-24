/**
 * @file FeatureDetails.tsx
 * @description 展開的財務功能清單說明元件
 */

import React from 'react'
import { FileText, Layers, PieChart, ListChecks } from 'lucide-react'

/**
 * @description 單一功能項目
 */
interface DetailItem {
  id: string
  title: string
  description: string
  tag?: string
  icon?: React.ReactNode
}

/**
 * @component FeatureDetails
 * @description 顯示財務功能清單與每項目的說明（供 PM / 財務對齊）
 */
export default function FeatureDetails() {
  const items: DetailItem[] = [
    {
      id: 'budget',
      title: '預算分配（Budget Allocation）',
      description:
        '依 Bonus 等級與活動類型分配運營預算，支援按等級/活動/時段分配並產生使用追蹤報表。',
      tag: '預算',
      icon: <FileText className="h-4 w-4 text-amber-400" />,
    },
    {
      id: 'tier-cost',
      title: '等級成本設定（Tier Cost）',
      description:
        '為每個 Bonus 等級定義成本模型（每 1 Bonus 對應成本、折損率、會計科目），並支援版本管理。',
      tag: '成本',
      icon: <Layers className="h-4 w-4 text-sky-400" />,
    },
    {
      id: 'redeem-report',
      title: '兌換成本報表（Redemption Cost）',
      description:
        '按等級彙總兌換發生的成本與點數流出，支援時間區間、平台、主播與活動篩選。',
      tag: '報表',
      icon: <PieChart className="h-4 w-4 text-emerald-400" />,
    },
    {
      id: 'audit',
      title: '高風險操作 Audit Log',
      description:
        '所有發放 / 扣回 / 例外核准等高風險操作均寫入 Audit Log，並支援異常檢索與匯出。',
      tag: 'Audit',
      icon: <ListChecks className="h-4 w-4 text-rose-400" />,
    },
  ]

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">財務功能說明</h3>
          <p className="text-[11px] text-slate-400">依 Bonus 深度展開的財務模組功能清單。</p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl border border-slate-800/60 bg-slate-950/80 p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{it.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-100">{it.title}</h4>
                  <span className="text-[10px] text-slate-400">{it.tag}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">{it.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
