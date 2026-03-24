/**
 * @file PlayersPageSkeleton.tsx
 * @description Loading skeleton for the Player / user management workspace when lazily loading.
 */

/**
 * @description Skeleton UI shown while PlayersPage is being loaded via React.lazy.
 */
export function PlayersPageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-slate-700/80 animate-pulse" />
          <div className="h-3 w-28 rounded-full bg-slate-700/80 animate-pulse" />
          <div className="h-3 w-48 rounded-full bg-slate-800/80 animate-pulse" />
        </div>
        <div className="flex gap-1 rounded-full border border-slate-800/80 bg-slate-900/80 px-1 py-0.5">
          <div className="h-4 w-16 rounded-full bg-slate-800/80 animate-pulse" />
          <div className="h-4 w-20 rounded-full bg-slate-800/80 animate-pulse" />
          <div className="hidden h-4 w-20 rounded-full bg-slate-800/80 animate-pulse md:block" />
        </div>
      </section>

      {/* Filters skeleton */}
      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
        <div className="flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full bg-slate-700/80 animate-pulse" />
            <div className="h-3 w-24 rounded-full bg-slate-700/80 animate-pulse" />
          </div>
          <div className="h-3 w-40 rounded-full bg-slate-800/80 animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/80 px-2 py-1">
            <div className="h-3.5 w-3.5 rounded-full bg-slate-700/80 animate-pulse" />
            <div className="h-3 w-full rounded-full bg-slate-800/80 animate-pulse" />
          </div>
          <div className="h-7 w-28 rounded-full border border-slate-800/80 bg-slate-900/80">
            <div className="h-full w-full rounded-full bg-slate-800/80 animate-pulse" />
          </div>
          <div className="h-7 w-28 rounded-full border border-slate-800/80 bg-slate-900/80">
            <div className="h-full w-full rounded-full bg-slate-800/80 animate-pulse" />
          </div>
          <div className="hidden h-7 w-28 rounded-full border border-slate-800/80 bg-slate-900/80 md:block">
            <div className="h-full w-full rounded-full bg-slate-800/80 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Table skeleton */}
      <section className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-28 rounded-full bg-slate-700/80 animate-pulse" />
            <div className="h-3 w-40 rounded-full bg-slate-800/80 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-32 rounded-full bg-emerald-700/80 animate-pulse" />
            <div className="h-6 w-24 rounded-full bg-slate-800/80 animate-pulse" />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/80">
          <div className="grid grid-cols-10 gap-2 border-b border-slate-800/80 bg-slate-900/90 px-3 py-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                // index 作為 key 在 skeleton 這種固定短列表是可接受的
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="h-3 rounded-full bg-slate-800/80 animate-pulse"
              />
            ))}
          </div>

          <div className="divide-y divide-slate-800/80">
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <div
                // skeleton 行使用 index 作 key 即可
                // eslint-disable-next-line react/no-array-index-key
                key={rowIndex}
                className="grid grid-cols-10 gap-2 px-3 py-3"
              >
                <div className="col-span-1 flex items-center">
                  <div className="h-3 w-3 rounded bg-slate-800/80 animate-pulse" />
                </div>
                <div className="col-span-3 space-y-1">
                  <div className="h-3 w-24 rounded-full bg-slate-700/80 animate-pulse" />
                  <div className="h-2 w-32 rounded-full bg-slate-800/80 animate-pulse" />
                </div>
                <div className="col-span-1">
                  <div className="h-3 w-14 rounded-full bg-slate-800/80 animate-pulse" />
                </div>
                <div className="col-span-1">
                  <div className="h-4 w-16 rounded-full bg-slate-800/80 animate-pulse" />
                </div>
                <div className="col-span-1">
                  <div className="h-3 w-16 rounded-full bg-slate-800/80 animate-pulse" />
                </div>
                <div className="col-span-1">
                  <div className="h-3 w-10 rounded-full bg-slate-800/80 animate-pulse" />
                </div>
                <div className="col-span-1">
                  <div className="h-3 w-20 rounded-full bg-slate-800/80 animate-pulse" />
                </div>
                <div className="col-span-1">
                  <div className="h-3 w-20 rounded-full bg-slate-800/80 animate-pulse" />
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <div className="h-4 w-10 rounded-full bg-slate-800/80 animate-pulse" />
                  <div className="hidden h-4 w-12 rounded-full bg-slate-800/80 animate-pulse md:block" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900/80 px-3 py-2">
            <div className="h-3 w-40 rounded-full bg-slate-800/80 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 rounded-full bg-slate-800/80 animate-pulse" />
              <div className="h-3 w-20 rounded-full bg-slate-800/80 animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-slate-800/80 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PlayersPageSkeleton
