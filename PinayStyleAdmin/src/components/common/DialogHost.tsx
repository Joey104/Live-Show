/**
 * @file DialogHost.tsx
 * @description 全域 Dialog 宿主元件 — 掛載在 App 根節點，顯示 showAlert / showConfirm / showPrompt 觸發的對話框。
 * 風格對齊專案整體深色設計系統（border-slate / bg-slate-950）。
 */

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from 'lucide-react'
import { _registerDialogPush, type AnyDialog } from '../../lib/dialog'

export function DialogHost() {
  const [queue, setQueue] = useState<AnyDialog[]>([])
  const [promptValue, setPromptValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 注冊推送函數
  useEffect(() => {
    _registerDialogPush((dialog) => {
      setQueue((prev) => [...prev, dialog])
    })
  }, [])

  // 當有 prompt 對話框出現時，重置 input
  const current = queue[0] ?? null
  useEffect(() => {
    if (current?.type === 'prompt') {
      setPromptValue(current.defaultValue)
      // 下一 tick 聚焦
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [current])

  if (!current) return null

  // ── 關閉（resolve 後移出 queue）──────────────────────────────────────────

  function closeAlert() {
    if (current?.type !== 'alert') return
    current.resolve()
    setQueue((prev) => prev.slice(1))
  }

  function closeConfirm(ok: boolean) {
    if (current?.type !== 'confirm') return
    current.resolve(ok)
    setQueue((prev) => prev.slice(1))
  }

  function closePrompt(submit: boolean) {
    if (current?.type !== 'prompt') return
    current.resolve(submit ? promptValue : null)
    setQueue((prev) => prev.slice(1))
  }

  // ── 判斷訊息類型，決定 icon 與顏色 ──────────────────────────────────────

  const isWarning = /錯誤|失敗|不可|不能|警告|注意|必填|請填|請輸入|請確認|請選擇|不符|已存在|需大於|不可為負|需為/.test(
    current.message,
  )
  const isSuccess = /已完成|已核准|已更新|已新增|已建立|已刪除|已重置|已匯出|成功/.test(
    current.message,
  )

  const iconClass = isWarning
    ? 'text-rose-400'
    : isSuccess
    ? 'text-emerald-400'
    : 'text-amber-400'

  const Icon = isWarning ? AlertTriangle : isSuccess ? CheckCircle2 : HelpCircle

  const borderClass = isWarning
    ? 'border-rose-600/60'
    : isSuccess
    ? 'border-emerald-600/60'
    : 'border-slate-700/80'

  const confirmBtnClass = isWarning
    ? 'bg-rose-600 hover:bg-rose-500'
    : isSuccess
    ? 'bg-emerald-600 hover:bg-emerald-500'
    : 'bg-sky-600 hover:bg-sky-500'

  // 把訊息中的 \n 轉換為段落
  const lines = current.message.split('\n').filter((l) => l.trim() !== '' || true)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={[
          'relative w-full max-w-sm rounded-2xl border bg-slate-950/98 shadow-2xl',
          borderClass,
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-800/80 px-5 py-4">
          <Icon className={['mt-0.5 h-4 w-4 shrink-0', iconClass].join(' ')} />
          <div className="flex-1 space-y-1.5 text-[11px]">
            {lines.map((line, i) => {
              // 第一行作為標題，其餘作為說明
              if (i === 0) {
                return (
                  <p key={i} className="font-semibold leading-snug text-slate-100">
                    {line}
                  </p>
                )
              }
              // 縮排對齊行（以「·」或「　」開頭）
              if (line.startsWith('·') || line.startsWith('　') || line.startsWith(' ')) {
                return (
                  <p key={i} className="pl-2 text-slate-400 leading-relaxed">
                    {line.trimStart()}
                  </p>
                )
              }
              return (
                <p key={i} className="text-slate-300 leading-relaxed">
                  {line}
                </p>
              )
            })}
          </div>
        </div>

        {/* Prompt input */}
        {current.type === 'prompt' && (
          <div className="px-5 pt-3 pb-1">
            <input
              ref={inputRef}
              type="text"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') closePrompt(true)
                if (e.key === 'Escape') closePrompt(false)
              }}
              className="h-8 w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 text-[11px] text-slate-100 outline-none focus:border-sky-500"
              placeholder="請輸入…"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 px-5 py-4">
          {current.type === 'alert' && (
            <button
              type="button"
              autoFocus
              onClick={closeAlert}
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-semibold text-white',
                confirmBtnClass,
              ].join(' ')}
            >
              確認
            </button>
          )}

          {current.type === 'confirm' && (
            <>
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 px-4 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800/80"
              >
                <XCircle className="h-3 w-3" />
                取消
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => closeConfirm(true)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-semibold text-white',
                  confirmBtnClass,
                ].join(' ')}
              >
                <CheckCircle2 className="h-3 w-3" />
                確認
              </button>
            </>
          )}

          {current.type === 'prompt' && (
            <>
              <button
                type="button"
                onClick={() => closePrompt(false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 px-4 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800/80"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => closePrompt(true)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-semibold text-white',
                  confirmBtnClass,
                ].join(' ')}
              >
                確認
              </button>
            </>
          )}
        </div>

        {/* 剩餘 queue 數量提示 */}
        {queue.length > 1 && (
          <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white shadow-md">
            {queue.length}
          </div>
        )}
      </div>
    </div>
  )
}

export default DialogHost
