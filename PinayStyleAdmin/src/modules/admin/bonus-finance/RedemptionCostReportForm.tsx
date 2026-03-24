/**
 * @file RedemptionCostReportForm.tsx
 * @description 兌換成本報表子表單（包含假資料、篩選、匯出與簡易彙總）
 */

import React, { useMemo, useState } from 'react'
import { exportCsv } from './utils'
import { FileText } from 'lucide-react'

/**
 * @interface RedemptionRecord
 * @description 兌換紀錄示意資料模型
 */
interface RedemptionRecord {
  id: string
  date: string // YYYY-MM-DD
  tierCode: string
  bonusAmount: number
  pointsEstimated: number
  estimatedCost: number
  channel: string
}

/**
 * @component RedemptionCostReportForm
 * @description 提供時間與等級篩選，顯示簡易兌換成本摘要（含假資料與匯出）
 */
export default function RedemptionCostReportForm({
  initialRequests = [],
  onEditRequest,
  onDeleteRequest,
}: {
  /** 初始的兌換申請（可為 FinancePanel 傳入的共享 demo 列表） */
  initialRequests?: RedemptionRecord[]
  onEditRequest?: (r: RedemptionRecord) => void
  onDeleteRequest?: (id: string) => void
}) {
  const sample: RedemptionRecord[] = [
    { id: 'RED-001', date: '2025-03-20', tierCode: 'SILVER', bonusAmount: 500, pointsEstimated: 650, estimatedCost: 500 * 0.5, channel: 'Points' },
    { id: 'RED-002', date: '2025-03-21', tierCode: 'BRONZE', bonusAmount: 150, pointsEstimated: 165, estimatedCost: 150 * 0.3, channel: 'Coupon' },
    { id: 'RED-003', date: '2025-03-22', tierCode: 'GOLD', bonusAmount: 1200, pointsEstimated: 1920, estimatedCost: 1200 * 0.8, channel: 'Points' },
    { id: 'RED-004', date: '2025-04-02', tierCode: 'STONE', bonusAmount: 80, pointsEstimated: 72, estimatedCost: 80 * 0.15, channel: 'Points' },
  ]

  const [from, setFrom] = useState('2025-03-01')
  const [to, setTo] = useState('2025-03-31')
  const [tier, setTier] = useState<'ALL' | string>('ALL')
  const [data, setData] = useState<RedemptionRecord[]>([...sample, ...initialRequests])

  /**
   * @description 以日期與等級篩選資料
   */
  const filtered = useMemo(() => {
    const fromTime = new Date(from).getTime()
    const toTime = new Date(to).getTime()
    return data.filter((r) => {
      const t = new Date(r.date).getTime()
      if (isNaN(fromTime) || isNaN(toTime)) return true
      if (t < fromTime || t > toTime) return false
      if (tier !== 'ALL' && r.tierCode !== tier) return false
      return true
    })
  }, [data, from, to, tier])

  const summary = useMemo(() => {
    const totalBonus = filtered.reduce((s, r) => s + r.bonusAmount, 0)
    const totalCost = filtered.reduce((s, r) => s + r.estimatedCost, 0)
    return { totalBonus, totalCost }
  }, [filtered])

  /**
   * @description 匯出目前篩選結果為 CSV
   */
  function handleExport() {
    const headers = ['ID', 'Date', 'Tier', 'BonusAmount', 'PointsEstimated', 'EstimatedCost', 'Channel']
    const rows = filtered.map((r) => [r.id, r.date, r.tierCode, r.bonusAmount, r.pointsEstimated, r.estimatedCost.toFixed(2), r.channel])
    exportCsv(`redemption_costs_${Date.now()}.csv`, headers, rows)
  }

  /**
   * @description 示意：加入假資料測試
   */
  function addDemoRecord() {
    const newOne: RedemptionRecord = {
      id: `RED-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      tierCode: 'BRONZE',
      bonusAmount: 200,
      pointsEstimated: 220,
      estimatedCost: 200 * 0.3,
      channel: 'Points',
    }
    setData((p) => [newOne, ...p])
  }

  /**
   * @description 編輯示意：在本地更新資料並呼叫外部回調（若存在）
   */
  function handleEdit(record: RedemptionRecord) {
    const edited = { ...record, date: record.date || new Date().toISOString().slice(0, 10) }
    setData((p) => p.map((r) => (r.id === edited.id ? edited : r)))
    if (onEditRequest) onEditRequest(edited)
    await showAlert(`已編輯兌換紀錄（示意）：${edited.id}`)
  }

  /**
   * @description 刪除示意：在本地刪除並呼叫外部回調（若存在）
   */
  function handleDelete(id: string) {
    if (!await showConfirm(`確認刪除紀錄 ${id}？`)) return
    setData((p) => p.filter((r) => r.id !== id))
    if (onDeleteRequest) onDeleteRequest(id)
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/80 p-4 text-[11px] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-400" />
          <div>
            <h4 className="text-sm font-semibold text-slate-100">兌換成本報表（示意）</h4>
            <p className="text-[11px] text-slate-400">可篩選日期 / 等級，並匯出 CSV。</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={addDemoRecord} className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100">新增測試紀錄</button>
          <button onClick={handleExport} className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white">匯出 CSV</button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault() }}>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] text-slate-300">起始日期</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-300">結束日期</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-300">等級</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as 'ALL' | string)} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-slate-100">
              <option value="ALL">全部</option>
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
              <option value="BRONZE">BRONZE</option>
              <option value="IRON">IRON</option>
              <option value="STONE">STONE</option>
            </select>
          </div>
        </div>
      </form>

      <div className="rounded-md border border-slate-800/50 bg-slate-900/70 p-3 text-[11px] text-slate-300">
        <div className="font-medium text-slate-100">報表示意</div>
        <div className="mt-2 text-[12px]">- 兌換總量（篩選內）：{summary.totalBonus.toLocaleString()} Bonus</div>
        <div className="text-[12px]">- 估計成本（篩選內）：NT$ {summary.totalCost.toFixed(2)}</div>
      </div>

      <div className="overflow-auto rounded-md border border-slate-800/50 bg-slate-900/70 p-2 text-[11px]">
        <table className="min-w-full">
          <thead className="text-slate-300">
            <tr>
              <th className="px-2 py-1 text-left">ID</th>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Tier</th>
              <th className="px-2 py-1 text-right">Bonus</th>
              <th className="px-2 py-1 text-right">Points</th>
              <th className="px-2 py-1 text-right">Est Cost</th>
              <th className="px-2 py-1 text-left">Channel</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-slate-800/60 text-slate-100">
                <td className="px-2 py-1">{r.id}</td>
                <td className="px-2 py-1">{r.date}</td>
                <td className="px-2 py-1">{r.tierCode}</td>
                <td className="px-2 py-1 text-right tabular-nums">{r.bonusAmount.toLocaleString()}</td>
                <td className="px-2 py-1 text-right tabular-nums">{r.pointsEstimated.toLocaleString()}</td>
                <td className="px-2 py-1 text-right tabular-nums">NT$ {r.estimatedCost.toFixed(2)}</td>
                <td className="px-2 py-1">{r.channel}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-slate-400">目前沒有符合條件的紀錄。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}