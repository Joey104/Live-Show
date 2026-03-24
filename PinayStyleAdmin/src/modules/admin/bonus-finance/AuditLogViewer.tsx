/**
 * @file AuditLogViewer.tsx
 * @description Audit 日誌檢視元件（示意）包含假資料、篩選與匯出
 */

import React, { useMemo, useState } from 'react'
import { exportCsv } from './utils'

/**
 * @interface AuditLog
 * @description 示意的審計日誌資料模型
 */
interface AuditLog {
  id: string
  time: string
  actor: string
  action: string
  detail: string
}

/**
 * @component AuditLogViewer
 * @description 顯示高風險操作的審計日誌（含篩選與匯出）
 */
export default function AuditLogViewer() {
  const demoLogs: AuditLog[] = [
    { id: 'A-1', time: '2025-03-20 12:01', actor: 'Admin A', action: '建立發放任務', detail: 'ISS-20250320-001' },
    { id: 'A-2', time: '2025-03-21 09:12', actor: 'Admin B', action: '核准兌換', detail: 'RED-20250320-001' },
    { id: 'A-3', time: '2025-03-22 10:05', actor: 'Admin C', action: '建立扣回任務', detail: 'RBK-20250321-001' },
  ]

  const [logs, setLogs] = useState<AuditLog[]>(demoLogs)
  const [filterActor, setFilterActor] = useState<'ALL' | string>('ALL')
  const [filterAction, setFilterAction] = useState<'ALL' | string>('ALL')
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filterActor !== 'ALL' && l.actor !== filterActor) return false
      if (filterAction !== 'ALL' && l.action !== filterAction) return false
      if (keyword.trim()) {
        const t = `${l.id} ${l.actor} ${l.action} ${l.detail}`.toLowerCase()
        if (!t.includes(keyword.toLowerCase())) return false
      }
      return true
    })
  }, [logs, filterActor, filterAction, keyword])

  /**
   * @description 匯出目前篩選結果為 CSV
   */
  function handleExport() {
    const headers = ['ID', 'Time', 'Actor', 'Action', 'Detail']
    const rows = filtered.map((r) => [r.id, r.time, r.actor, r.action, r.detail])
    exportCsv(`audit_logs_${Date.now()}.csv`, headers, rows)
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/80 p-3 text-[11px]">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-100">Audit Log（示意）</h4>
        <div className="flex items-center gap-2">
          <select value={filterActor} onChange={(e) => setFilterActor(e.target.value as 'ALL' | string)} className="h-7 rounded-full bg-slate-900/80 px-2 text-slate-100">
            <option value="ALL">全部人員</option>
            <option value="Admin A">Admin A</option>
            <option value="Admin B">Admin B</option>
            <option value="Admin C">Admin C</option>
          </select>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value as 'ALL' | string)} className="h-7 rounded-full bg-slate-900/80 px-2 text-slate-100">
            <option value="ALL">全部操作</option>
            <option value="建立發放任務">建立發放任務</option>
            <option value="核准兌換">核准兌換</option>
            <option value="建立扣回任務">建立扣回任務</option>
          </select>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="關鍵字" className="h-7 rounded-full bg-slate-900/80 px-2 text-slate-100" />
          <button onClick={handleExport} className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100">匯出 CSV</button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {filtered.map((l) => (
          <div key={l.id} className="flex items-start justify-between rounded-md border border-slate-800/50 bg-slate-900/70 p-2">
            <div>
              <div className="text-[12px] font-medium text-slate-100">{l.action} · {l.detail}</div>
              <div className="text-[11px] text-slate-400">{l.time} · {l.actor}</div>
            </div>
            <div className="text-[11px] text-slate-300">ID: {l.id}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-slate-400">目前沒有符合條件的 Audit 日誌。</div>}
      </div>
    </div>
  )
}