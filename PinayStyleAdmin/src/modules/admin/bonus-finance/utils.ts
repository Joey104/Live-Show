/**
 * @file utils.ts
 * @description 通用小工具：CSV 匯出等前端輔助功能
 */

/**
 * @description 將資料轉換為 CSV 並觸發下載
 * @param filename 檔案名稱（例如：report.csv）
 * @param headers CSV 標頭陣列
 * @param rows 二維陣列：每列為一筆資料，元素順序需對應 headers
 */
export function exportCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escapeCsv = (v: string | number) => {
    const s = String(v ?? '')
    // 若包含逗號或換行或雙引號，需以雙引號包裹並將雙引號跳脫
    if (/[",\n\r]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const csv = [headers.map(escapeCsv).join(',')]
    .concat(rows.map((r) => r.map(escapeCsv).join(',')))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}