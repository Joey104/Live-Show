/**
 * @file BalancesTable.tsx
 * @description 用戶點數餘額列表（假資料示意），包含分頁與關鍵字搜尋
 */

import { useMemo, useState } from 'react'

/**
 * @interface BalanceRow
 * @description 用戶餘額資料模型
 */
interface BalanceRow {
  id: string
  userId: string
  username: string
  points: number
  bonus: number
  lastActive: string
  note?: string
}

/**
 * @description 建立示意用戶餘額資料
 * @returns BalanceRow[]
 */
function createMockBalances(): BalanceRow[] {
  const now = new Date()
  const fmt = (d: Date) =>
    d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
  return [
    { id: 'B-1', userId: '10001', username: 'alice', points: 12500, bonus: 500, lastActive: fmt(now), note: 'VIP' },
    { id: 'B-2', userId: '10002', username: 'bob', points: 3200, bonus: 120, lastActive: fmt(new Date(now.getTime() - 86400000 * 2)) },
    { id: 'B-3', userId: '10003', username: 'charlie', points: 0, bonus: 0, lastActive: fmt(new Date(now.getTime() - 86400000 * 10)), note: '停權' },
    { id: 'B-4', userId: '10004', username: 'diana', points: 78000, bonus: 1500, lastActive: fmt(new Date(now.getTime() - 86400000)) },
    { id: 'B-5', userId: '10005', username: 'ed', points: 540, bonus: 30, lastActive: fmt(new Date(now.getTime() - 86400000 * 30)) },
    { id: 'B-6', userId: '10006', username: 'frank', points: 2300, bonus: 0, lastActive: fmt(new Date(now.getTime() - 3600000 * 5)) },
  ]
}

/**
 * @description BalancesTable - 顯示多筆用戶餘額，支援搜尋與分頁
 */
export default function BalancesTable() {
  const [rows] = useState<BalanceRow[]>(() => createMockBalances())
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!keyword) return true
        const target = `${r.userId} ${r.username} ${r.note ?? ''}`.toLowerCase()
        return target.includes(keyword.toLowerCase())
      }),
    [rows, keyword],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px]">
          <input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} placeholder="搜尋 User ID / 名稱 / 標記" className="bg-transparent outline-none text-slate-100 placeholder:text-slate-500" />
        </div>
        <div className="text-[12px] text-slate-400">總筆數：{filtered.length}</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-600/60 bg-slate-950/80">
        <table className="min-w-full text-[12px]">
          <thead className="bg-slate-900/90 text-emerald-100">
            <tr>
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">用戶</th>
              <th className="px-3 py-2 text-right">points</th>
              <th className="px-3 py-2 text-right">bonus</th>
              <th className="px-3 py-2 text-left">最近活動</th>
              <th className="px-3 py-2 text-left">備註</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, idx) => (
              <tr key={r.id} className="border-b border-emerald-600/30 text-emerald-50 last:border-b-0">
                <td className="px-3 py-2">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{r.username}</span>
                    <span className="text-[11px] text-emerald-200/80">ID: {r.userId}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.points.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.bonus.toLocaleString()}</td>
                <td className="px-3 py-2 text-[11px] text-emerald-200/80">{r.lastActive}</td>
                <td className="px-3 py-2 text-[11px] text-emerald-200/80">{r.note ?? '—'}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[12px] text-emerald-100/80">目前沒有符合條件的用戶餘額。</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 text-[11px] text-slate-300">
          <div>每頁 {pageSize} 筆</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">上一頁</button>
            <span>第 {page} / {totalPages} 頁</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40">下一頁</button>
          </div>
        </div>
      </div>
    </div>
  )
}