/**
 * @file GenericModuleSkeleton.tsx
 * @description Generic loading skeleton for admin modules when content is being lazy-loaded.
 */

import React from 'react'

/**
 * @description Skeleton UI shown while a non-player admin module is being loaded via React.lazy.
 */
export function GenericModuleSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-slate-700/80 animate-pulse" />
          <div className="h-3 w-32 rounded-full bg-slate-700/80 animate-pulse" />
          <div className="hidden h-3 w-40 rounded-full bg-slate-800/80 animate-pulse md:block" />
        </div>
        <div className="hidden gap-1 rounded-full border border-slate-800/80 bg-slate-900/80 px-1 py-0.5 sm:flex">
          <div className="h-4 w-16 rounded-full bg-slate-800/80 animate-pulse" />
          <div className="h-4 w-20 rounded-full bg-slate-800/80 animate-pulse" />
        </div>
      </section>

      {/* Content cards skeleton */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <div className="h-3 w-28 rounded-full bg-slate-700/80 animate-pulse" />
          <div className="h-3 w-40 rounded-full bg-slate-800/80 animate-pulse" />
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full rounded-full bg-slate-800/80 animate-pulse" />
            <div className="h-3 w-4/5 rounded-full bg-slate-800/80 animate-pulse" />
            <div className="h-3 w-3/5 rounded-full bg-slate-800/80 animate-pulse" />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <div className="h-3 w-24 rounded-full bg-slate-700/80 animate-pulse" />
          <div className="h-3 w-32 rounded-full bg-slate-800/80 animate-pulse" />
          <div className="grid gap-2 pt-2">
            <div className="h-7 rounded-lg bg-slate-900/80">
              <div className="h-full w-3/4 rounded-lg bg-slate-800/80 animate-pulse" />
            </div>
            <div className="h-7 rounded-lg bg-slate-900/80">
              <div className="h-full w-2/3 rounded-lg bg-slate-800/80 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Table / list skeleton */}
      <section className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
        <div className="flex items-center justify-between">
          <div className="h-3 w-28 rounded-full bg-slate-700/80 animate-pulse" />
          <div className="hidden h-3 w-40 rounded-full bg-slate-800/80 animate-pulse sm:block" />
        </div>
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/80">
          <div className="grid grid-cols-4 gap-2 border-b border-slate-800/80 bg-slate-900/90 px-3 py-2 text-[11px]">
            <div className="h-3 w-16 rounded-full bg-slate-800/80 animate-pulse" />
            <div className="h-3 w-20 rounded-full bg-slate-800/80 animate-pulse" />
            <div className="hidden h-3 w-20 rounded-full bg-slate-800/80 animate-pulse md:block" />
            <div className="hidden h-3 w-16 rounded-full bg-slate-800/80 animate-pulse lg:block" />
          </div>
          <div className="divide-y divide-slate-800/80">
            {Array.from({ length: 5 }).map((_, index) => (
              // skeleton 行使用 index 作 key 在此情境可接受
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="grid grid-cols-4 gap-2 px-3 py-3">
                <div className="h-3 w-16 rounded-full bg-slate-800/80 animate-pulse" />
                <div className="h-3 w-24 rounded-full bg-slate-800/80 animate-pulse" />
                <div className="hidden h-3 w-20 rounded-full bg-slate-800/80 animate-pulse md:block" />
                <div className="hidden h-3 w-16 rounded-full bg-slate-800/80 animate-pulse lg:block" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default GenericModuleSkeleton
