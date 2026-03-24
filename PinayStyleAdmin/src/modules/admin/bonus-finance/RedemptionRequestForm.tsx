/**
 * @file RedemptionRequestForm.tsx
 * @description 建立 / 編輯兌換申請的表單元件（前端示意）
 */

import React, { useEffect, useState } from 'react'
import { XCircle } from 'lucide-react'

/**
 * @interface RedemptionRequestModel
 * @description 兌換申請資料模型（示意）
 */
export interface RedemptionRequestModel {
  id: string
  userId: string
  username: string
  bonusAmount: number
  tierCode: string
  channel: 'Points' | 'Coupon'
  targetHost?: string
  targetPlatform?: string
  note?: string
  status?: 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled'
  createdAt?: string
}

/**
 * @interface RedemptionRequestFormProps
 * @description 建表單需要的 props
 */
export interface RedemptionRequestFormProps {
  initial?: RedemptionRequestModel | null
  onClose: () => void
  onSave: (payload: RedemptionRequestModel) => void
}

/**
 * @component RedemptionRequestForm
 * @description 建立或編輯兌換申請的抽屜表單（示意）
 */
export default function RedemptionRequestForm({
  initial = null,
  onClose,
  onSave,
}: RedemptionRequestFormProps) {
  const [form, setForm] = useState<RedemptionRequestModel>(
    initial ?? {
      id: '',
      userId: '',
      username: '',
      bonusAmount: 0,
      tierCode: 'STONE',
      channel: 'Points',
      targetHost: '',
      targetPlatform: '',
      note: '',
      status: 'pending',
      createdAt: '',
    },
  )

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  /**
   * @description 建立現在時間字串
   */
  function nowLabel() {
    return new Date().toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * @description 驗證並提交表單
   */
  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!form.userId.trim() || !form.username.trim()) {
      await showAlert('請填寫用戶 ID 與用戶名稱。')
      return
    }
    if (!form.bonusAmount || form.bonusAmount <= 0) {
      await showAlert('請輸入大於 0 的 Bonus 金額。')
      return
    }
    if (!form.tierCode.trim()) {
      await showAlert('請選擇 Bonus 等級。')
      return
    }

    const payload: RedemptionRequestModel = {
      ...form,
      id: form.id || `REQ-${Date.now()}`,
      createdAt: form.createdAt || nowLabel(),
      status: form.status ?? 'pending',
    }
    onSave(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-indigo-600/70 bg-slate-950/95">
        <header className="flex items-center justify-between border-b border-indigo-600/60 px-4 py-3">
          <div>
            <div className="text-xs font-semibold text-indigo-100">{initial ? '編輯兌換申請' : '建立兌換申請'}</div>
            <div className="text-[11px] text-indigo-300">{initial ? `ID: ${initial?.id}` : '建立新的兌換申請，支援指定主播 / 平台。'}</div>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-indigo-700/80 bg-slate-900/80 text-indigo-200 hover:border-indigo-400 hover:text-indigo-100">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-indigo-50">
          <form className="space-y-3" onSubmit={(e) => handleSubmit(e)}>
            <div>
              <label className="block text-[11px] text-indigo-100">用戶 ID</label>
              <input value={form.userId} onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-indigo-100" placeholder="例如：10001" />
            </div>

            <div>
              <label className="block text-[11px] text-indigo-100">用戶名稱</label>
              <input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-indigo-100" placeholder="例如：demo_player" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-indigo-100">Bonus 等級</label>
                <select value={form.tierCode} onChange={(e) => setForm((p) => ({ ...p, tierCode: e.target.value }))} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-indigo-100">
                  <option value="GOLD">GOLD</option>
                  <option value="SILVER">SILVER</option>
                  <option value="BRONZE">BRONZE</option>
                  <option value="IRON">IRON</option>
                  <option value="STONE">STONE</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-indigo-100">兌換渠道</label>
                <select value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value as 'Points' | 'Coupon' }))} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-indigo-100">
                  <option value="Points">Points</option>
                  <option value="Coupon">Coupon</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-indigo-100">欲兌換 Bonus 數量</label>
                <input value={String(form.bonusAmount)} onChange={(e) => setForm((p) => ({ ...p, bonusAmount: Number(e.target.value || '0') }))} inputMode="numeric" className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-indigo-100" />
              </div>
              <div>
                <label className="block text-[11px] text-indigo-100">目標平台（選填）</label>
                <input value={form.targetPlatform ?? ''} onChange={(e) => setForm((p) => ({ ...p, targetPlatform: e.target.value }))} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-indigo-100" placeholder="例如：Slot" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-indigo-100">目標主播（選填）</label>
              <input value={form.targetHost ?? ''} onChange={(e) => setForm((p) => ({ ...p, targetHost: e.target.value }))} className="mt-1 h-8 w-full rounded-md bg-slate-900/80 px-2 text-indigo-100" placeholder="例如：主播A" />
            </div>

            <div>
              <label className="block text-[11px] text-indigo-100">備註</label>
              <textarea value={form.note ?? ''} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} rows={3} className="mt-1 w-full rounded-md bg-slate-900/80 px-2 py-1 text-indigo-100" placeholder="補充說明（示意）" />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-full border border-indigo-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-indigo-100">取消</button>
              <button type="submit" className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white">儲存申請</button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  )
}