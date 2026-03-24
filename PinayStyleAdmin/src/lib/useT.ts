import { useTranslation } from 'react-i18next'

/**
 * 輕量 hook，回傳 t 函數與當前語言 code。
 * 在頁面組件的頂層呼叫一次，避免每個子元件都 import useTranslation。
 */
export function useT() {
  const { t, i18n } = useTranslation()
  return { t, lang: i18n.language }
}
