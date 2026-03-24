/**
 * @file TransactionsTable.tsx
 * @description 交易記錄查詢（假資料示意），包含關鍵字與方向/來源篩選
 */

import { useMemo, useState } from 'react'

/**
 * @interface TxRow
 * @description 交易流水資料模型
 */
interface TxRow {
  id: string
  userId: string
  username: string
  type: 'credit' | 'debit'
  amount: number
  balanceAfter: number
  source: string
  createdAt: string
  note?: string
}

/**
 * @description 建立示意交易流水
 * @returns TxRow[]
 */
function createMockTx(): TxRow[] {
  const now = new Date()
  const fmt = (d: Date) => d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  return [
    { id: 'T-1', userId: '10001', username: 'alice', type: 'credit', amount: 500, balanceAfter: 13000, source: '任務', createdAt: fmt(now), note: '7 日登入獎勵' },
    { id: 'T-2', userId: '10002', username: 'bob', type: 'debit', amount: 200, balanceAfter: 3000, source: '兌換', createdAt: fmt(new Date(now.getTime() - 3600 * 1000)), note: '兌換 points' },
    { id: 'T-3', userId: '10004', username: 'diana', type: 'credit', amount: 1500, balanceAfter: 79500, source: '補發', createdAt: fmt(new Date(now.getTime() - 86400000)), note: 'Manually adjusted' },
    { id: 'T-4', userId: '10005', username: 'ed', type: 'debit', amount: 100, balanceAfter: 440, source: '提領', createdAt: fmt(new Date(now.getTime() - 86400000 * 3)), note: '提領手續費已扣' },
  ]
}

/**
 * @description TransactionsTable - 顯示交易紀錄，支援搜尋、來源與方向篩選
 */
export default function TransactionsTable() {
  const [rows] = useState<TxRow[]>(() => createMockTx())
  const [keyword, setKeyword] = useState('')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'credit' | 'debit'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 5

  const sources = useMemo(() => Array.from(new Set(rows.map((r) => r.source))), [rows])

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (keyword) {
          const target = `${r.userId} ${r.username} ${r.id} ${r.note ?? ''} ${r.source}`.toLowerCase()
          if (!target.includes(keyword.toLowerCase())) return false
        }
        if (directionFilter !== 'all' && r.type !== directionFilter) return false
        if (sourceFilter !== 'all' && r.source !== sourceFilter) return false
        return true
      }),
    [rows, keyword, directionFilter, sourceFilter],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px]">
          <input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} placeholder="搜尋 User ID / 名稱 / 交易 ID / 備註" className="bg-transparent outline-none text-slate-100 placeholder:text-slate-500" />
        </div>

        <select value={directionFilter} onChange={(e) => { setDirectionFilter(e.target.value as any); setPage(1) }} className="h-8 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 text-[11px] text-slate-100">
          <option value="all">全部方向</option>
          <option value="credit">收入 (credit)</option>
          <option value="debit">支出 (debit)</option>
        </select>

        <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }} className="h-8 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 text-[11px] text-slate-100">
          <option value="all">全部來源</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="text-[12px] text-slate-400 ml-auto">總筆數：{filtered.length}</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
        <table className="min-w-full text-[12px]">
          <thead className="bg-slate-900/90 text-indigo-100">
            <tr>
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">用戶</th>
              <th className="px-3 py-2 text-right">變動</th>
              <th className="px-3 py-2 text-right">異動後</th>
              <th className="px-3 py-2 text-left">來源</th>
              <th className="px-3 py-2 text-left">時間</th>
              <th className="px-3 py-2 text-left">備註</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, idx) => (
              <tr key={r.id} className="border-b border-indigo-600/30 text-indigo-50 last:border-b-0">
                <td className="px-3 py-2">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{r.username}</span>
                    <span className="text-[11px] text-indigo-100/80">ID: {r.userId} · {r.id}</span>
                  </div>
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${r.type === 'credit' ? 'text-emerald-300' : 'text-rose-300'}`}>{r.type === 'credit' ? '+' : '-'}{r.amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.balanceAfter.toLocaleString()}</td>
                <td className="px-3 py-2">{r.source}</td>
                <td className="px-3 py-2 text-[11px] text-indigo-100/80">{r.createdAt}</td>
                <td className="px-3 py-2 text-[11px] text-indigo-100/80">{r.note ?? '—'}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[12px] text-indigo-100/80">目前沒有符合條件的交易紀錄。</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 text-[11px] text-slate-300">
          <div>每頁 {pageSize} 筆</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">上一頁</button>
            <span>第 {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">下一頁</button>
          </div>
        </div>
      </div>
    </div>
  )
}