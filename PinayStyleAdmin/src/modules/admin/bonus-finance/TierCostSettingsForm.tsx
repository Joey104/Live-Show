/**
 * @file TierCostSettingsForm.tsx
 * @description 等級成本設定子表單（包含範例資料、篩選與匯出）
 */

import React, { useMemo, useState } from 'react'
import { exportCsv } from './utils'
import { Layers } from 'lucide-react'

/**
 * @interface TierCost
 * @description 等級成本資料模型（示意）
 */
interface TierCost {
  id: string
  tierCode: string
  costPerBonus: number
  accountingCode: string
  notes?: string
  updatedAt: string
}

/**
 * @component TierCostSettingsForm
 * @description 為每個 Bonus 等級設定成本模型的 UI（含範例資料與匯出）
 */
export default function TierCostSettingsForm() {
  const sample: TierCost[] = [
    { id: 'TC-1', tierCode: 'GOLD', costPerBonus: 0.8, accountingCode: 'EXP-BONUS', notes: '高價等級成本', updatedAt: '2025-02-20' },
    { id: 'TC-2', tierCode: 'SILVER', costPerBonus: 0.5, accountingCode: 'EXP-BONUS', notes: '', updatedAt: '2025-02-21' },
    { id: 'TC-3', tierCode: 'BRONZE', costPerBonus: 0.3, accountingCode: 'EXP-BONUS', notes: '新手等級', updatedAt: '2025-02-22' },
  ]

  const [list, setList] = useState<TierCost[]>(sample)
  const [tierCode, setTierCode] = useState('GOLD')
  const [costPerBonus, setCostPerBonus] = useState('0.5')
  const [accountingCode, setAccountingCode] = useState('EXP-BONUS')
  const [notes, setNotes] = useState('')
  const [filterTier, setFilterTier] = useState<'ALL' | string>('ALL')

  /**
   * @description 新增或更新等級成本（示意）
   */
  function handleSave(e?: React.FormEvent) {
    e?.preventDefault()
    const cost = Number(costPerBonus)
    if (Number.isNaN(cost) || cost <= 0) {
      await showAlert('成本需為大於 0 的數字。')
      return
    }
    const existing = list.find((l) => l.tierCode === tierCode)
    if (existing) {
      setList((prev) => prev.map((l) => (l.tierCode === tierCode ? { ...l, costPerBonus: cost, accountingCode, notes, updatedAt: new Date().toISOString().slice(0, 10) } : l)))
      await showAlert('已更新等級成本（示意）。')
    } else {
      const newOne: TierCost = { id: `TC-${Date.now()}`, tierCode, costPerBonus: cost, accountingCode, notes, updatedAt: new Date().toISOString().slice(0, 10) }
      setList((p) => [newOne, ...p])
      await showAlert('已新增等級成本（示意）。')
    }
  }

  const filtered = useMemo(() => (filterTier === 'ALL' ? list : list.filter((l) => l.tierCode === filterTier)), [list, filterTier])

  /**
   * @description 匯出成本設定為 CSV
   */
  function handleExport() {
    const headers = ['ID', 'TierCode', 'CostPerBonus', 'AccountingCode', 'Notes', 'UpdatedAt']
    const rows = filtered.map((r) => [r.id, r.tierCode, r.costPerBonus, r.accountingCode, r.notes ?? '', r.updatedAt])
    exportCsv(`tier_costs_${Date.now()}.csv`, headers, rows)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-sky-400" />
          <h4 className="text-sm font-semibold text-slate-100">等級成本設定</h4>
        </div>
        <div>
          <button onClick={handleExport} className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100">匯出 CSV</button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-3 rounded-xl border border-slate-800/60 bg-slate-950/80 p-4 text-[11px]">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-slate-300">等級</label>
            <select value={tierCode} onChange={(e) => setTierCode(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100">
              <option>GOLD</option>
              <option>SILVER</option>
              <option>BRONZE</option>
              <option>IRON</option>
              <option>STONE</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-300">每 1 Bonus 成本（示意）</label>
            <input value={costPerBonus} onChange={(e) => setCostPerBonus(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-300">會計科目</label>
          <input value={accountingCode} onChange={(e) => setAccountingCode(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100" />
        </div>

        <div>
          <label className="block text-[11px] text-slate-300">備註</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100" />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { setTierCode('GOLD'); setCostPerBonus('0.5'); setAccountingCode('EXP-BONUS'); setNotes('') }} className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100">重置</button>
          <button type="submit" className="rounded-full bg-sky-600 px-3 py-1 text-[11px] font-semibold text-white">儲存成本</button>
        </div>
      </form>

      <div className="mt-3 rounded-md border border-slate-800/50 bg-slate-900/70 p-3 text-[11px]">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-slate-100">成本清單（示意）</div>
          <div>
            <select value={filterTier} onChange={(e) => setFilterTier(e.target.value as 'ALL' | string)} className="h-7 rounded-full bg-slate-900/80 px-2 text-slate-100">
              <option value="ALL">全部等級</option>
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
              <option value="BRONZE">BRONZE</option>
              <option value="IRON">IRON</option>
              <option value="STONE">STONE</option>
            </select>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-[11px]">
            <thead className="text-slate-300">
              <tr>
                <th className="text-left px-2 py-1">Tier</th>
                <th className="text-right px-2 py-1">Cost/Bonus</th>
                <th className="text-left px-2 py-1">Accounting</th>
                <th className="text-left px-2 py-1">Notes</th>
                <th className="text-left px-2 py-1">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-800/60 text-slate-100">
                  <td className="px-2 py-1">{r.tierCode}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{r.costPerBonus.toFixed(2)}</td>
                  <td className="px-2 py-1">{r.accountingCode}</td>
                  <td className="px-2 py-1">{r.notes}</td>
                  <td className="px-2 py-1">{r.updatedAt}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-slate-400">目前沒有成本設定。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}