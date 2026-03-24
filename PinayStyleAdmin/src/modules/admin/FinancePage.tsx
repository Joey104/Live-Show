/**
 * @file FinancePage.tsx
 * @description 財務管理主頁面 - 包含用戶點數餘額、交易紀錄、提領審核與提領狀態更新分頁
 */

import { useState } from 'react'
import { CreditCard, ListChecks, Archive, Repeat } from 'lucide-react'
import BalancesTable from './finance/BalancesTable'
import TransactionsTable from './finance/TransactionsTable'
import WithdrawalsTable from './finance/WithdrawalsTable'

/**
 * @description FinanceTabId - 分頁 id 型別
 */
type FinanceTabId = 'balances' | 'transactions' | 'withdrawals' | 'status'

/**
 * @component FinancePage
 * @description 財務管理主頁組件：提供分頁切換與對應子元件的呈現（均為同步匯入，避免 React.lazy 導致的 promise->undefined 問題）
 */
export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTabId>('balances')

  return (
    <div className="space-y-4">
      {/* Header / 子頁籤 */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-sky-400" />
          <div>
            <div className="text-sm font-semibold text-slate-100">財務管理（點數 / 交易）</div>
            <div className="text-[11px] text-slate-500">用戶點數、交易流水與提領審核工作台（假資料示意）。</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('balances')}
            className={[
              'rounded-full px-3 py-1 text-[11px]',
              activeTab === 'balances' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            用戶點數餘額
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={[
              'rounded-full px-3 py-1 text-[11px]',
              activeTab === 'transactions' ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            交易記錄查詢
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={[
              'rounded-full px-3 py-1 text-[11px]',
              activeTab === 'withdrawals' ? 'bg-rose-600 text-white' : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            提領申請審核
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={[
              'rounded-full px-3 py-1 text-[11px]',
              activeTab === 'status' ? 'bg-slate-700 text-white' : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            提領狀態更新
          </button>
        </div>
      </section>

      {/* Content */}
      <section>
        {activeTab === 'balances' && (
          <div className="rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-emerald-100">
              <ListChecks className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold">用戶點數餘額列表</span>
              <span className="text-[11px] text-emerald-200/80">展示用戶 points / bonus 餘額，支援搜尋與分頁（假資料）。</span>
            </div>
            <BalancesTable />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="rounded-2xl border border-indigo-600/70 bg-slate-950/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-indigo-100">
              <Archive className="h-4 w-4 text-indigo-400" />
              <span className="font-semibold">交易記錄查詢</span>
              <span className="text-[11px] text-indigo-200/80">全平台交易流水查詢（假資料示意），支援方向/來源篩選與分頁。</span>
            </div>
            <TransactionsTable />
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="rounded-2xl border border-rose-600/70 bg-slate-950/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-rose-100">
              <ListChecks className="h-4 w-4 text-rose-400" />
              <span className="font-semibold">提領申請審核</span>
              <span className="text-[11px] text-rose-200/80">審核介面示意：核准、拒絕、標記處理，包含審核抽屜。</span>
            </div>
            {/* mode 'review'：提供快速核准/拒絕按鈕 */}
            <WithdrawalsTable mode="review" />
          </div>
        )}

        {activeTab === 'status' && (
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-100">
              <Repeat className="h-4 w-4 text-slate-400" />
              <span className="font-semibold">提領狀態更新</span>
              <span className="text-[11px] text-slate-400/80">批次/人工更新提領狀態的工作台（示意）。</span>
            </div>
            {/* mode 'status'：打開抽屜進行狀態更新 */}
            <WithdrawalsTable mode="status" />
          </div>
        )}
      </section>
    </div>
  )
}