/**
 * @file WithdrawalsTable.tsx
 * @description 提領申請列表（假資料示意）與審核 / 批次狀態更新的抽屜互動
 */

import { useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, Eye, XCircle } from 'lucide-react'
import { showConfirm, showPrompt } from '../../../lib/dialog'

/**
 * @interface Withdrawal
 * @description 提領申請資料模型
 */
interface Withdrawal {
  id: string
  userId: string
  username: string
  amount: number
  fee: number
  net: number
  status: 'submitted' | 'processing' | 'completed' | 'rejected' | 'cancelled'
  createdAt: string
  processedAt?: string
  note?: string
}

/**
 * @description 建立假提領申請
 * @returns Withdrawal[]
 */
function createMockWithdrawals(): Withdrawal[] {
  const now = new Date()
  const fmt = (d: Date) => d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  return [
    { id: 'W-1001', userId: '10005', username: 'ed', amount: 500, fee: 15, net: 485, status: 'submitted', createdAt: fmt(now), note: '銀行帳號: ****1234' },
    { id: 'W-1002', userId: '10002', username: 'bob', amount: 1200, fee: 36, net: 1164, status: 'processing', createdAt: fmt(new Date(now.getTime() - 3600 * 1000 * 5)), processedAt: fmt(new Date(now.getTime() - 3600 * 1000 * 2)) },
    { id: 'W-1003', userId: '10006', username: 'frank', amount: 80, fee: 2, net: 78, status: 'rejected', createdAt: fmt(new Date(now.getTime() - 86400000 * 2)), processedAt: fmt(new Date(now.getTime() - 86400000)), note: '金額低於最小值' },
    { id: 'W-1004', userId: '10001', username: 'alice', amount: 3000, fee: 90, net: 2910, status: 'completed', createdAt: fmt(new Date(now.getTime() - 86400000 * 3)), processedAt: fmt(new Date(now.getTime() - 86400000 * 1)) },
  ]
}

/**
 * @description WithdrawalDrawerProps - 抽屜需要的 props
 */
interface WithdrawalDrawerProps {
  item: Withdrawal | null
  onClose: () => void
  onUpdate: (id: string, status: Withdrawal['status'], note?: string) => void
}

/**
 * @description WithdrawalDrawer - 顯示提領細節並更新狀態
 */
function WithdrawalDrawer({ item, onClose, onUpdate }: WithdrawalDrawerProps) {
  if (!item) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-rose-700/70 bg-slate-950/95">
        <header className="flex items-center justify-between border-b border-rose-700/60 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-rose-100">
              <span className="font-semibold">提領申請詳情</span>
            </div>
            <p className="mt-0.5 text-[11px] text-rose-200/80">{item.id} · {item.username}</p>
          </div>
          <button onClick={onClose} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-700/80 bg-slate-900/80 text-rose-200 hover:border-rose-400 hover:text-rose-100">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-4 py-3 text-[12px] text-rose-50">
          <div className="space-y-2">
            <div>用戶：{item.username}（ID: {item.userId}）</div>
            <div>金額：{item.amount.toLocaleString()} Bonus</div>
            <div>手續費：{item.fee.toLocaleString()} Bonus</div>
            <div>實際撥款：{item.net.toLocaleString()} 元</div>
            <div>狀態：{item.status}</div>
            <div>建立時間：{item.createdAt}</div>
            {item.processedAt && <div>處理時間：{item.processedAt}</div>}
            <div className="text-[11px] text-rose-200/80">備註：{item.note ?? '—'}</div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={async () => {
                const ok = await showConfirm(`確認將 ${item.id} 標記為 processed（處理中）？`)
                if (!ok) return
                onUpdate(item.id, 'processing')
              }}
              className="rounded-full bg-sky-600 px-3 py-2 text-white"
            >
              標記為處理中
            </button>
            <button
              onClick={async () => {
                const ok = await showConfirm(`確認核准提領 ${item.id} 嗎？`)
                if (!ok) return
                onUpdate(item.id, 'completed')
              }}
              className="rounded-full bg-emerald-600 px-3 py-2 text-white"
            >
              核准並完成
            </button>
            <button
              onClick={async () => {
                const reason = await showPrompt('請輸入拒絕原因（將儲存到備註）')
                if (reason === null) return
                onUpdate(item.id, 'rejected', reason || undefined)
              }}
              className="rounded-full bg-rose-600 px-3 py-2 text-white"
            >
              拒絕
            </button>
            <button
              onClick={async () => {
                const ok = await showConfirm(`確認取消提領 ${item.id} 嗎？`)
                if (!ok) return
                onUpdate(item.id, 'cancelled')
              }}
              className="rounded-full bg-slate-700 px-3 py-2 text-white"
            >
              取消
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

/**
 * @description WithdrawalsTable - 顯示提領清單並提供審核 / 批次更新（依 mode 行為不同）
 */
export default function WithdrawalsTable({ mode }: { mode: 'review' | 'status' }) {
  const [rows, setRows] = useState<Withdrawal[]>(() => createMockWithdrawals())
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Withdrawal['status']>('all')
  const [page, setPage] = useState(1)
  const [drawerItem, setDrawerItem] = useState<Withdrawal | null>(null)
  const pageSize = 5

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (keyword) {
          const target = `${r.userId} ${r.username} ${r.id} ${r.note ?? ''}`.toLowerCase()
          if (!target.includes(keyword.toLowerCase())) return false
        }
        if (statusFilter !== 'all' && r.status !== statusFilter) return false
        return true
      }),
    [rows, keyword, statusFilter],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  function handleUpdate(id: string, status: Withdrawal['status'], note?: string) {
    const nowLabel = new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, status, processedAt: nowLabel, note: note ?? r.note } : r))
    setDrawerItem((d) => (d && d.id === id ? null : d))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px]">
          <input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} placeholder="搜尋 User ID / 名稱 / 提領 ID" className="bg-transparent outline-none text-slate-100 placeholder:text-slate-500" />
        </div>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1) }} className="h-8 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 text-[11px] text-slate-100">
          <option value="all">全部狀態</option>
          <option value="submitted">已提交</option>
          <option value="processing">處理中</option>
          <option value="completed">已完成</option>
          <option value="rejected">已拒絕</option>
          <option value="cancelled">已取消</option>
        </select>

        <div className="ml-auto text-[12px] text-slate-400">總筆數：{filtered.length}</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-rose-600/60 bg-slate-950/80">
        <table className="min-w-full text-[12px]">
          <thead className="bg-slate-900/90 text-rose-100">
            <tr>
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">申請 ID</th>
              <th className="px-3 py-2 text-left">用戶</th>
              <th className="px-3 py-2 text-right">金額</th>
              <th className="px-3 py-2 text-right">手續費</th>
              <th className="px-3 py-2 text-left">狀態</th>
              <th className="px-3 py-2 text-left">建立時間</th>
              <th className="px-3 py-2 text-left">備註</th>
              <th className="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, idx) => (
              <tr key={r.id} className="border-b border-rose-600/30 text-rose-50 last:border-b-0">
                <td className="px-3 py-2">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-3 py-2 font-medium">{r.id}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{r.username}</span>
                    <span className="text-[11px] text-rose-100/80">ID: {r.userId}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.fee.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className={['rounded-full px-2 py-0.5 text-[11px]', r.status === 'completed' ? 'bg-emerald-500/30 text-emerald-50' : r.status === 'processing' ? 'bg-sky-500/30 text-sky-50' : r.status === 'submitted' ? 'bg-amber-500/30 text-amber-50' : 'bg-rose-500/40 text-rose-50'].join(' ')}>{r.status}</span>
                </td>
                <td className="px-3 py-2 text-[11px] text-rose-100/80">{r.createdAt}</td>
                <td className="px-3 py-2 text-[11px] text-rose-100/80">{r.note ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setDrawerItem(r)} className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-1 text-[11px] text-rose-50 hover:bg-rose-500/30"><Eye className="h-3 w-3" /> 詳情</button>
                    {mode === 'review' && r.status === 'submitted' && (
                      <>
                        <button
                          onClick={async () => {
                            const ok = await showConfirm(`確認核准提領 ${r.id}？`)
                            if (!ok) return
                            handleInlineApprove(r.id)
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] text-white"
                        >
                          核准
                        </button>
                        <button
                          onClick={async () => {
                            const reason = await showPrompt('請輸入拒絕原因')
                            if (reason === null) return
                            handleInlineReject(r.id, reason)
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-1 text-[11px] text-white"
                        >
                          拒絕
                        </button>
                      </>
                    )}
                    {mode === 'status' && (
                      <button onClick={() => setDrawerItem(r)} className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2 py-1 text-[11px] text-white">更新狀態</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-[12px] text-rose-100/80">目前沒有符合條件的提領申請。</td>
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

      <WithdrawalDrawer item={drawerItem} onClose={() => setDrawerItem(null)} onUpdate={(id, status, note) => {
        const nowLabel = new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        setRows((prev) => prev.map((r) => r.id === id ? { ...r, status, processedAt: nowLabel, note: note ?? r.note } : r))
        setDrawerItem(null)
      }} />
    </div>
  )

  /**
   * @description 內部核准操作（立即更新資料）
   */
  function handleInlineApprove(id: string) {
    const nowLabel = new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: 'completed', processedAt: nowLabel } : r))
  }

  /**
   * @description 內部拒絕操作（立即更新資料並寫入備註）
   */
  function handleInlineReject(id: string, reason: string) {
    const nowLabel = new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected', processedAt: nowLabel, note: reason } : r))
  }
}
