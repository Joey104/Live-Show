/**
 * @file dialog.ts
 * @description 全域 Dialog 工具 — 取代 window.alert / window.confirm / window.prompt。
 * 使用方式：
 *   import { showAlert, showConfirm, showPrompt } from '../lib/dialog'
 *   await showAlert('提示訊息')
 *   const ok = await showConfirm('確認嗎？')
 *   const val = await showPrompt('請輸入', '預設值')
 */

export type AlertDialog = {
  type: 'alert'
  message: string
  resolve: () => void
}

export type ConfirmDialog = {
  type: 'confirm'
  message: string
  resolve: (ok: boolean) => void
}

export type PromptDialog = {
  type: 'prompt'
  message: string
  defaultValue: string
  resolve: (value: string | null) => void
}

export type AnyDialog = AlertDialog | ConfirmDialog | PromptDialog

/** 由 DialogHost 在 mount 時注冊，讓 push 指向真正的狀態更新函數 */
let _push: (dialog: AnyDialog) => void = (d) => {
  // Fallback: 若 DialogHost 尚未掛載，降級至原生 API
  if (d.type === 'alert') { window.alert(d.message); d.resolve() }
  else if (d.type === 'confirm') { d.resolve(window.confirm(d.message)) }
  else { d.resolve(window.prompt(d.message, d.defaultValue)) }
}

/** 由 DialogHost 呼叫，注冊推送函數 */
export function _registerDialogPush(fn: typeof _push) {
  _push = fn
}

/** 顯示訊息提示（取代 window.alert） */
export function showAlert(message: string): Promise<void> {
  return new Promise<void>((resolve) => {
    _push({ type: 'alert', message, resolve })
  })
}

/** 顯示確認對話框（取代 window.confirm），回傳 true / false */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    _push({ type: 'confirm', message, resolve })
  })
}

/** 顯示輸入對話框（取代 window.prompt），回傳輸入字串或 null（取消） */
export function showPrompt(message: string, defaultValue = ''): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    _push({ type: 'prompt', message, defaultValue, resolve })
  })
}
