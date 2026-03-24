/**
 * @file BudgetAllocationForm.tsx
 * @description 預算分配子表單元件（包含範例資料、篩選與匯出功能）
 */

import React, { useMemo, useState } from 'react'
import { exportCsv } from './utils'
import { DollarSign } from 'lucide-react'

/**
 * @interface Allocation
 * @description 預算分配資料模型（示意）
 */
interface Allocation {
  id: string
  tier: string
  period: string // YYYY-MM
  amount: number
  note?: string
  createdAt: string
}

/**
 * @component BudgetAllocationForm
 * @description 提供按 Bonus 等級 / 活動 / 時段配置預算的 UI，包含範例資料與匯出
 */
export default function BudgetAllocationForm() {
  const sampleAllocations: Allocation[] = [
    { id: 'BA-001', tier: 'GOLD', period: '2025-03', amount: 300000, note: '春季活動', createdAt: '2025-02-25' },
    { id: 'BA-002', tier: 'SILVER', period: '2025-03', amount: 200000, note: '月度推廣', createdAt: '2025-02-26' },
    { id: 'BA-003', tier: 'BRONZE', period: '2025-04', amount: 80000, note: '新手活動', createdAt: '2025-03-01' },
  ]

  const [tier, setTier] = useState('GOLD')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState('2025-03')
  const [note, setNote] = useState('')
  const [allocations, setAllocations] = useState<Allocation[]>(sampleAllocations)
  const [filterTier, setFilterTier] = useState<'ALL' | string>('ALL')
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | string>('ALL')

  /**
   * @description 建立新的分配紀錄（前端示意）
   */
  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const n = Number(amount)
    if (!n || n <= 0) {
      await showAlert('請輸入大於 0 的金額。')
      return
    }
    const newOne: Allocation = {
      id: `BA-${Date.now()}`,
      tier,
      period,
      amount: n,
      note,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setAllocations((p) => [newOne, ...p])
    setAmount('')
    setNote('')
    await showAlert('已新增預算分配（示意）。')
  }

  const filtered = useMemo(() => {
    return allocations.filter((a) => {
      if (filterTier !== 'ALL' && a.tier !== filterTier) return false
      if (filterPeriod !== 'ALL' && a.period !== filterPeriod) return false
      return true
    })
  }, [allocations, filterTier, filterPeriod])

  /**
   * @description 匯出目前篩選結果為 CSV
   */
  function handleExport() {
    const headers = ['ID', 'Tier', 'Period', 'Amount', 'Note', 'CreatedAt']
    const rows = filtered.map((r) => [r.id, r.tier, r.period, r.amount, r.note ?? '', r.createdAt])
    exportCsv(`budget_allocations_${Date.now()}.csv`, headers, rows)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-3 rounded-xl border border-slate-800/60 bg-slate-950/80 p-4 text-[11px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-amber-400" />
          <h4 className="text-sm font-semibold text-slate-100">預算分配</h4>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleExport} className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100">匯出 CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-slate-300">Bonus 等級</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100">
            <option>GOLD</option>
            <option>SILVER</option>
            <option>BRONZE</option>
            <option>IRON</option>
            <option>STONE</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-300">期間（YYYY-MM）</label>
          <input value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100" />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-slate-300">金額（示意）</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100" placeholder="例如：100000" />
      </div>

      <div>
        <label className="block text-[11px] text-slate-300">備註</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100" placeholder="可填寫使用目的或活動名稱" />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => { setAmount(''); setNote('') }} className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100">取消</button>
        <button type="submit" className="rounded-full bg-amber-600 px-3 py-1 text-[11px] font-semibold text-white">儲存分配</button>
      </div>

      <div className="mt-3 rounded-md border border-slate-800/50 bg-slate-900/70 p-3 text-[11px]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-slate-100">分配清單（示意）</div>
          <div className="flex items-center gap-2">
            <select value={filterTier} onChange={(e) => setFilterTier(e.target.value as 'ALL' | string)} className="h-7 rounded-full bg-slate-900/80 px-2 text-slate-100">
              <option value="ALL">全部等級</option>
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
              <option value="BRONZE">BRONZE</option>
              <option value="IRON">IRON</option>
              <option value="STONE">STONE</option>
            </select>
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value as 'ALL' | string)} className="h-7 rounded-full bg-slate-900/80 px-2 text-slate-100">
              <option value="ALL">全部期間</option>
              <option value="2025-03">2025-03</option>
              <option value="2025-04">2025-04</option>
            </select>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-[11px]">
            <thead className="text-slate-300">
              <tr>
                <th className="text-left px-2 py-1">ID</th>
                <th className="text-left px-2 py-1">Tier</th>
                <th className="text-left px-2 py-1">Period</th>
                <th className="text-right px-2 py-1">Amount</th>
                <th className="text-left px-2 py-1">Note</th>
                <th className="text-left px-2 py-1">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-slate-800/60 text-slate-100">
                  <td className="px-2 py-1">{a.id}</td>
                  <td className="px-2 py-1">{a.tier}</td>
                  <td className="px-2 py-1">{a.period}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{a.amount.toLocaleString()}</td>
                  <td className="px-2 py-1">{a.note}</td>
                  <td className="px-2 py-1">{a.createdAt}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-slate-400">目前沒有分配紀錄。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  )
}