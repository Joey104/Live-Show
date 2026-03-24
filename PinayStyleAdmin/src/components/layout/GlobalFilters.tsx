/**
 * @file GlobalFilters.tsx
 * @description Shared global filter strip below header (time range, status, role/type).
 */

import { useState } from 'react'

/**
 * @description Time range options for the global filter.
 */
const TIME_RANGES = ['今日', '近7日', '近30日', '本月'] as const

/**
 * @description Status options for global filter.
 */
const STATUS_OPTIONS = ['全部狀態', '正常', '封禁', '待審核', '異常'] as const

/**
 * @description Role / type options.
 */
const ROLE_OPTIONS = ['全部角色', 'Player', 'Broadcaster', '管理員'] as const

/**
 * @description Stateless UI + minimal internal state. In real app, this should lift state up.
 */
export function GlobalFilters() {
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>('近7日')
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('全部狀態')
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>('全部角色')

  return (
    <section className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 bg-slate-950/80 px-5 py-2 text-[11px] text-slate-200">
      <div className="flex items-center gap-1">
        <span className="text-slate-400">時間範圍</span>
        <div className="flex rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {TIME_RANGES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTimeRange(item)}
              className={[
                'rounded-full px-2 py-0.5 transition',
                item === timeRange
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800/80',
              ].join(' ')}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-slate-400">狀態</span>
        <select
          className="h-6 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100 outline-none"
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
        >
          {STATUS_OPTIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-slate-400">角色 / 類型</span>
        <select
          className="h-6 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100 outline-none"
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof ROLE_OPTIONS)[number])}
        >
          {ROLE_OPTIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="ml-auto text-[10px] text-slate-500">
        篩選條件為示意，實際查詢建議加上快取 / 節流。
      </div>
    </section>
  )
}

export default GlobalFilters
