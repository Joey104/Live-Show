/**
 * @file DashboardPage.tsx
 * @description High-level dashboard with stat cards, 7-day trends and todo workspace.
 */

import { useEffect, useState } from 'react'
import { LineChart as LineChartIcon, Users, Wallet, Gift, AlertTriangle } from 'lucide-react'

/**
 * @description Single stat card model.
 */
interface StatCard {
  id: string
  label: string
  value: string
  unit: string
  trend: 'up' | 'down' | 'flat'
  trendText: string
}

/**
 * @description Simulated refreshing dashboard; only numbers update to avoid full layout flicker.
 */
export function DashboardPage() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 10_000)
    return () => clearInterval(timer)
  }, [])

  const baseValue = 1000 + (tick % 7) * 13

  const stats: StatCard[] = [
    {
      id: 'users',
      label: '總用戶數',
      value: (baseValue + 231).toLocaleString(),
      unit: '人',
      trend: 'up',
      trendText: '+3.2% vs 昨日',
    },
    {
      id: 'live',
      label: '當前直播房間',
      value: String(38 + (tick % 5)),
      unit: '間',
      trend: 'flat',
      trendText: '穩定',
    },
    {
      id: 'online',
      label: '當前在線',
      value: (3200 + (tick % 9) * 17).toLocaleString(),
      unit: '人',
      trend: 'up',
      trendText: '+5.8% vs 昨日',
    },
    {
      id: 'revenue',
      label: '今日收入（禮物 / 抽成 / Bonus 成本）',
      value: `$ ${(56_320 + (tick % 11) * 129).toLocaleString()}`,
      unit: '收入',
      trend: 'up',
      trendText: '含平台抽成與 Bonus 成本',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-lg shadow-slate-950/30"
          >
            <div className="mb-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>{item.label}</span>
              <span
                className={[
                  'rounded-full px-2 py-0.5 font-medium',
                  item.trend === 'up'
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : item.trend === 'down'
                    ? 'bg-rose-500/10 text-rose-300'
                    : 'bg-slate-700/60 text-slate-200',
                ].join(' ')}
              >
                {item.trendText}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-semibold tracking-tight text-slate-50">
                  {item.value}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">{item.unit}</div>
              </div>
              <div className="h-10 w-20 rounded-lg bg-gradient-to-tr from-sky-500/40 via-sky-400/10 to-transparent opacity-60" />
            </div>
          </article>
        ))}
      </section>

      {/* Trends area */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* 7-day user growth */}
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div>
              <h2 className="flex items-center gap-1 text-xs font-semibold">
                <Users className="h-3.5 w-3.5 text-sky-400" />
                7 日用戶增長
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                新增 / 活躍切換可在實作時改為 Tab 或 Select。
              </p>
            </div>
            <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-300">
              模擬資料 · 近 7 日
            </span>
          </header>
          <div className="flex h-40 items-end justify-between gap-1 rounded-xl bg-slate-900/70 p-3">
            {[40, 55, 60, 48, 62, 70, 66].map((h, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-full bg-gradient-to-t from-sky-500 to-emerald-400"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[9px] text-slate-500">D{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-day gift revenue */}
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div>
              <h2 className="flex items-center gap-1 text-xs font-semibold">
                <Gift className="h-3.5 w-3.5 text-sky-400" />
                7 日禮物收入 / 抽成
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                長條圖可在實作時切換「平台抽成 / 淨收入」。
              </p>
            </div>
            <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-300">
              模擬資料 · 近 7 日
            </span>
          </header>
          <div className="flex h-40 items-end justify-between gap-1 rounded-xl bg-slate-900/70 p-3">
            {[30, 42, 38, 55, 60, 72, 68].map((h, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-3/4 rounded-t-md bg-gradient-to-t from-violet-500 to-sky-400"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[9px] text-slate-500">D{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-day transaction trend */}
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div>
              <h2 className="flex items-center gap-1 text-xs font-semibold">
                <LineChartIcon className="h-3.5 w-3.5 text-sky-400" />
                7 日交易趨勢
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                充值 / 提領 / 兌現 / 消費 可用圖例或 Tab 切換顯示。
              </p>
            </div>
            <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-300">
              模擬資料 · 近 7 日
            </span>
          </header>
          <div className="flex h-40 flex-col justify-between rounded-xl bg-slate-900/70 p-3">
            <div className="flex flex-1 items-center justify-center text-[10px] text-slate-500">
              這裡預留給實際折線圖元件（recharts / ECharts）。
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span className="text-emerald-300">● 充值</span>
              <span className="text-sky-300">● 消費</span>
              <span className="text-amber-300">● 兌現 / 提領</span>
            </div>
          </div>
        </div>
      </section>

      {/* Todo workspace */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 lg:col-span-2">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div>
              <h2 className="text-xs font-semibold">待辦工作台</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                集中顯示待審核提領 / 兌現、異常充值、需處理支付工單。
              </p>
            </div>
            <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-300">
              示例
            </span>
          </header>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-amber-100">
                <span>待審核提領 / 兌現</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold">
                  18 筆
                </span>
              </div>
              <p className="text-[11px] text-amber-100/80">
                建議按照金額降序 + 申請時間排序，方便財務批次處理。
              </p>
            </div>
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-rose-100">
                <span>異常充值 / 支付失敗率飆升</span>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold">
                  3 個通道
                </span>
              </div>
              <p className="text-[11px] text-rose-100/80">
                建議跳轉至「支付管理」工作台，逐通道檢查與鎖定。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <h2 className="text-xs font-semibold">異常警示</h2>
            </div>
          </header>
          <ul className="space-y-1 text-[11px] text-slate-300">
            <li className="flex justify-between rounded-lg bg-slate-900/80 px-2 py-1.5">
              <span>提領失敗率 &gt; 5%</span>
              <span className="text-amber-300">需人工確認</span>
            </li>
            <li className="flex justify-between rounded-lg bg-slate-900/80 px-2 py-1.5">
              <span>充值失敗率 / 第三方回調延遲</span>
              <span className="text-amber-300">關注通道健康度</span>
            </li>
            <li className="flex justify-between rounded-lg bg-slate-900/80 px-2 py-1.5">
              <span>高風險操作提醒</span>
              <span className="text-slate-400">一律需二次確認 + Audit Log</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
