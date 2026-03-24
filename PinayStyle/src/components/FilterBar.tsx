/**
 * File: src/components/FilterBar.tsx
 * Description: Search and filtering bar for live streams, supporting text query,
 *              tags and high-level categories such as entertainment, game, music.
 */

import React from 'react'

/**
 * Props for FilterBar component.
 */
interface FilterBarProps {
  /** Text query for title/host/tag search. */
  query: string
  /** Callback when query changes. */
  onQueryChange: (value: string) => void
  /** Tag filters extracted from streams. */
  tags: string[]
  /** Currently active tag, or null for "all". */
  activeTag: string | null
  /** Change active tag. */
  onTagChange: (tag: string | null) => void
  /** List of available stream categories. */
  categories: string[]
  /** Currently active category. */
  activeCategory: string | null
  /** Change active category. */
  onCategoryChange: (cat: string | null) => void
}

/**
 * FilterBar
 * Renders search box plus category and tag chips to filter live streams.
 */
export default function FilterBar({
  query,
  onQueryChange,
  tags,
  activeTag,
  onTagChange,
  categories,
  activeCategory,
  onCategoryChange,
}: FilterBarProps): JSX.Element {
  return (
    <section className="mx-auto mt-6 max-w-7xl px-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-[0_0_24px_rgba(15,23,42,0.9)]">
        {/* Search input */}
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by host, title or vibe…"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="mr-1 text-slate-400">Category:</span>
            <button
              type="button"
              className={[
                'rounded-full px-3 py-1 border transition-colors',
                !activeCategory
                  ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-50 shadow-[0_0_14px_rgba(236,72,153,0.7)]'
                  : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-fuchsia-400/70',
              ].join(' ')}
              onClick={() => onCategoryChange(null)}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={[
                  'rounded-full px-3 py-1 border transition-colors',
                  activeCategory === cat
                    ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-50 shadow-[0_0_14px_rgba(236,72,153,0.7)]'
                    : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-fuchsia-400/70',
                ].join(' ')}
                onClick={() => onCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="mr-1 text-slate-400">Tags:</span>
            <button
              type="button"
              className={[
                'rounded-full px-3 py-1 border transition-colors',
                !activeTag
                  ? 'border-emerald-400 bg-emerald-500/15 text-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                  : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-emerald-400/70',
              ].join(' ')}
              onClick={() => onTagChange(null)}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={[
                  'rounded-full px-3 py-1 border transition-colors',
                  activeTag === tag
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                    : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-emerald-400/70',
                ].join(' ')}
                onClick={() => onTagChange(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}