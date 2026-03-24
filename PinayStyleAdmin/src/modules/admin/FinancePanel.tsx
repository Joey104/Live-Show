/**
 * @file FinancePanel.tsx
 * @description Bonus 財務管理主面板（已移除所有 window.confirm / window.prompt / window.alert，改以 sonner toast 顯示）
 */

import React, { useEffect, useState } from 'react'
import FeatureDetails from './FeatureDetails'
import BudgetAllocationForm from './BudgetAllocationForm'
import TierCostSettingsForm from './TierCostSettingsForm'
import RedemptionCostReportForm from './RedemptionCostReportForm'
import AuditLogViewer from './AuditLogViewer'
import RedemptionRequestForm from './RedemptionRequestForm'
import { BarChart, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

/**
 * @description 審計日誌模型（示意）
 */
interface AuditLog {
  id: string
  time: string
  actor: string
  action: string
  detail: string
}

/**
 * @component FinancePanel
 * @description 財務管理面板，提供快速統計、功能列表、兌換申請 CRUD 與 Audit 顯示（含 localStorage 儲存 demo 資料）
 */
export default function FinancePanel() {
  const [active, setActive] = useState<'overview' | 'budget' | 'cost' | 'report' | 'audit'>('overview')

  /**
   * @description localStorage keys for persistence
   */
  const LS_KEYS = {
    REQUESTS: 'demo.redemptionRequests.v1',
    AUDITS: 'demo.auditLogs.v1',
  }

  /**
   * @description demo: redemption requests 列表（供建立 / 管理示意）
   */
  const sampleRequests = [
    {
      id: 'REQ-20250320-001',
      userId: '10001',
      username: 'demo_player',
      bonusAmount: 500,
      tierCode: 'SILVER',
      channel: 'Points',
      targetHost: '主播A',
      targetPlatform: 'Slot',
      note: '示意申請（SILVER）',
      status: 'pending',
      createdAt: '2025-03-20 12:00',
    },
  ]

  const [redemptionRequests, setRedemptionRequests] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.REQUESTS)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      // ignore parse errors
    }
    return sampleRequests
  })

  /**
   * @description demo: audit logs（由 panel 管理並傳入 AuditLogViewer）
   */
  const sampleAuditLogs: AuditLog[] = [
    { id: 'A-1', time: '2025-03-20 12:01', actor: 'Admin A', action: '建立發放任務', detail: 'ISS-20250320-001' },
    { id: 'A-2', time: '2025-03-21 09:12', actor: 'Admin B', action: '核准兌換', detail: 'RED-20250320-001' },
  ]

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.AUDITS)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      // ignore
    }
    return sampleAuditLogs
  })

  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [editingRequest, setEditingRequest] = useState<any | null>(null)

  /**
   * @description 當 redemptionRequests 或 auditLogs 改變時，同步寫回 localStorage（persist demo state）
   */
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.REQUESTS, JSON.stringify(redemptionRequests))
    } catch (e) {
      // ignore storage errors
    }
  }, [redemptionRequests])

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.AUDITS, JSON.stringify(auditLogs))
    } catch (e) {
      // ignore storage errors
    }
  }, [auditLogs])

  /**
   * @description 新增或更新 redemption request（由 RedemptionRequestForm 呼叫）
   * @param r redemption request payload
   */
  function upsertRequest(r: any) {
    setRedemptionRequests((prev) => {
      const exist = prev.find((p) => p.id === r.id)
      if (exist) {
        // 更新 request 並新增一筆 audit log
        const updatedList = prev.map((p) => (p.id === r.id ? r : p))
        setAuditLogs((al) => [
          { id: `A-${Date.now()}`, time: new Date().toLocaleString(), actor: 'System', action: '更新兌換申請', detail: r.id },
          ...al,
        ])
        toast.success(`已更新示意申請 ${r.id}`)
        return updatedList
      }
      // 新增 request 並新增一筆 audit log
      const newList = [r, ...prev]
      setAuditLogs((al) => [
        { id: `A-${Date.now()}`, time: new Date().toLocaleString(), actor: 'System', action: '建立兌換申請', detail: r.id },
        ...al,
      ])
      toast.success(`已建立示意申請 ${r.id}`)
      return newList
    })
  }

  /**
   * @description 刪除示意（已移除原本的 confirm），會同步產生 Audit 並儲存
   * @param id request id
   */
  function deleteRequest(id: string) {
    // 直接執行刪除（示意），並在 UI 顯示 toast
    setRedemptionRequests((p) => p.filter((r) => r.id !== id))
    setAuditLogs((al) => [{ id: `A-${Date.now()}`, time: new Date().toLocaleString(), actor: 'System', action: '刪除兌換申請', detail: id }, ...al])
    toast.success(`已刪除示意申請 ${id}`)
  }

  /**
   * @description 當從列表點選「編輯」時，填入 editingRequest 並開啟抽屜
   * @param request 要編輯的 request
   */
  function handleOpenEdit(request: any) {
    setEditingRequest(request)
    setShowCreateDrawer(true)
  }

  /**
   * @description 清除 demo 資料（移除 confirm，直接重置並提示）
   */
  function clearDemoData() {
    localStorage.removeItem(LS_KEYS.REQUESTS)
    localStorage.removeItem(LS_KEYS.AUDITS)
    setRedemptionRequests([...sampleRequests])
    setAuditLogs([...sampleAuditLogs])
    toast.success('已重置 demo 資料（localStorage 已清除）。')
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart className="h-5 w-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">財務總覽（按 Bonus 等級深度）</h3>
            <p className="text-[11px] text-slate-400">統整預算、成本與兌換成本的檢視與設定，包含建立/管理兌換申請示意。</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setActive('overview')} className={`rounded-full px-2 py-1 text-[11px] ${active === 'overview' ? 'bg-slate-700 text-white' : 'bg-slate-900/80 text-slate-200'}`}>總覽</button>
          <button onClick={() => setActive('budget')} className={`rounded-full px-2 py-1 text-[11px] ${active === 'budget' ? 'bg-amber-600 text-white' : 'bg-slate-900/80 text-slate-200'}`}>預算分配</button>
          <button onClick={() => setActive('cost')} className={`rounded-full px-2 py-1 text-[11px] ${active === 'cost' ? 'bg-sky-600 text-white' : 'bg-slate-900/80 text-slate-200'}`}>等級成本</button>
          <button onClick={() => setActive('report')} className={`rounded-full px-2 py-1 text-[11px] ${active === 'report' ? 'bg-emerald-600 text-white' : 'bg-slate-900/80 text-slate-200'}`}>成本報表</button>
          <button onClick={() => setActive('audit')} className={`rounded-full px-2 py-1 text-[11px] ${active === 'audit' ? 'bg-rose-600 text-white' : 'bg-slate-900/80 text-slate-200'}`}>Audit</button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2">
        <div />
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowCreateDrawer(true); setEditingRequest(null) }} className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white">建立兌換申請</button>
          <button onClick={() => { const csvName = `redemption_snapshot_${Date.now()}.csv`; toast('示意：匯出所有兌換申請為 ' + csvName); }} className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100">匯出所有申請</button>
          <button onClick={clearDemoData} className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100">清除 demo 資料</button>
        </div>
      </div>

      {active === 'overview' && (
        <section className="rounded-xl border border-slate-800/60 bg-slate-950/80 p-4 text-[11px]">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800/50 bg-slate-900/70 p-3">
              <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-amber-400" /><div className="text-sm font-semibold text-slate-100">預算總額（示意）</div></div>
              <div className="mt-2 text-lg font-semibold text-amber-100">NT$ 1,200,000</div>
              <div className="text-[11px] text-slate-400 mt-1">已分配 / 可用（示意）</div>
            </div>

            <div className="rounded-lg border border-slate-800/50 bg-slate-900/70 p-3">
              <div className="text-sm font-semibold text-slate-100">本月兌換成本（估）</div>
              <div className="mt-2 text-lg font-semibold text-emerald-100">NT$ 62,400</div>
              <div className="text-[11px] text-slate-400 mt-1">按等級與實際兌換計算</div>
            </div>

            <div className="rounded-lg border border-slate-800/50 bg-slate-900/70 p-3">
              <div className="text-sm font-semibold text-slate-100">高風險操作（24h）</div>
              <div className="mt-2 text-lg font-semibold text-rose-100">3 筆</div>
              <div className="text-[11px] text-slate-400 mt-1">需審核與匯出 Audit</div>
            </div>
          </div>
        </section>
      )}

      {active === 'budget' && (
        <div className="grid gap-3 md:grid-cols-2">
          <BudgetAllocationForm />
          <FeatureDetails />
        </div>
      )}

      {active === 'cost' && (
        <div className="grid gap-3 md:grid-cols-2">
          <TierCostSettingsForm />
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/80 p-4">
            <h4 className="text-sm font-semibold text-slate-100">成本版本管理（示意）</h4>
            <p className="text-[11px] text-slate-400 mt-2">支援建立不同生效版本與回溯查詢。</p>
          </div>
        </div>
      )}

      {active === 'report' && (
        <div>
          <RedemptionCostReportForm initialRequests={redemptionRequests} onEditRequest={(r) => handleOpenEdit(r)} onDeleteRequest={deleteRequest} />
        </div>
      )}

      {active === 'audit' && (
        <div>
          <AuditLogViewer initialLogs={auditLogs} />
        </div>
      )}

      {/* 建立 / 編輯兌換申請的抽屜（直接掛入） */}
      {showCreateDrawer && (
        <RedemptionRequestForm
          initial={editingRequest}
          onClose={() => {
            setShowCreateDrawer(false)
            setEditingRequest(null)
          }}
          onSave={(payload) => {
            upsertRequest(payload)
            setShowCreateDrawer(false)
            setEditingRequest(null)
          }}
        />
      )}
    </div>
  )
}