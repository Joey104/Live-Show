/**
 * File: src/components/host/StartLiveDialog.tsx
 * Description: Modal dialog for configuring a new live stream before
 *              entering the host studio. Handles title, cover image,
 *              category, tags, and visibility.
 */

import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react'
import type { HostStudioConfig } from './HostStudio'

/**
 * Props for StartLiveDialog component.
 */
interface StartLiveDialogProps {
  /** Whether the dialog is visible. */
  isOpen: boolean
  /** Close the dialog without starting a stream. */
  onClose: () => void
  /** Called with the final config when user confirms start. */
  onStart: (config: HostStudioConfig) => void
}

/**
 * Simple list of human-readable categories (English locale).
 */
const CATEGORIES: string[] = [
  'Entertainment',
  'Gaming',
  'Music',
  'Chat',
  'Education',
  'IRL',
  'Movie',
  'Other',
]

/**
 * StartLiveDialog
 * Provides a simple form to set up the basic information for a new stream.
 * In this demo, uploaded cover image is previewed via an object URL only.
 */
export default function StartLiveDialog({
  isOpen,
  onClose,
  onStart,
}: StartLiveDialogProps): JSX.Element | null {
  const [title, setTitle] = useState('Midnight Heat: Manila live interaction')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [tags, setTags] = useState<string[]>(['Midnight', 'Interactive', 'Neon'])
  const [tagInput, setTagInput] = useState('')
  const [visibility, setVisibility] =
    useState<HostStudioConfig['visibility']>('public')
  const [coverPreview, setCoverPreview] = useState<string | undefined>()
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  /**
   * Clean up object URL when dialog unmounts or file changes.
   */
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  if (!isOpen) return null

  /**
   * Add a single tag from the input, enforcing a max of 5 tags.
   */
  function handleAddTag(): void {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    if (tags.length >= 5) return
    if (tags.includes(trimmed)) {
      setTagInput('')
      return
    }
    setTags((prev) => [...prev, trimmed])
    setTagInput('')
  }

  /**
   * Remove a tag by value.
   */
  function handleRemoveTag(tag: string): void {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  /**
   * Handle cover image file input; only one file is used for preview.
   */
  function handleCoverChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
    }
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    setCoverPreview(url)
  }

  /**
   * Submit final configuration and start stream.
   */
  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const config: HostStudioConfig = {
      title: trimmedTitle.slice(0, 50),
      coverImageUrl: coverPreview,
      category,
      tags,
      visibility,
    }

    onStart(config)
  }

  const titleLength = title.length

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xl overflow-hidden rounded-2xl border border-fuchsia-500/40 bg-slate-950 shadow-[0_0_40px_rgba(236,72,153,0.8)]">
        <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-50">
              Set up your live stream
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Add a title, cover and category before entering the Host Studio.
              This is a demo only—no real streaming or payouts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-900 hover:text-slate-50"
          >
            Close
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4 text-sm">
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-slate-200">
              <span>Stream title</span>
              <span className={titleLength > 50 ? 'text-red-400' : 'text-slate-500'}>
                {titleLength}/50
              </span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="Type the title viewers will see for this stream"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr_3fr]">
            <div>
              <label className="text-xs font-medium text-slate-200">
                Cover image
              </label>
              <div className="mt-1 flex flex-col gap-2">
                <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-700 bg-slate-900/80">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Stream cover preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-4 text-[11px] text-slate-500">
                      Upload a cover image to show in the left preview inside the Host Studio.
                    </span>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800">
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-200">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-200">
                  Tags (max 5)
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value.slice(0, 16))}
                    placeholder="Type a tag and click Add"
                    className="flex-1 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-50 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                    className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="inline-flex items-center gap-1 rounded-full border border-fuchsia-500/40 bg-slate-950/80 px-2 py-1 text-fuchsia-100 hover:border-fuchsia-300 hover:text-fuchsia-50"
                    >
                      <span>#{tag}</span>
                      <span className="text-[10px]">×</span>
                    </button>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-slate-500">No tags added yet</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-200">
                  Visibility
                </label>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-200">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      className="h-3 w-3 border-slate-600 bg-slate-900 text-fuchsia-500"
                      checked={visibility === 'public'}
                      onChange={() => setVisibility('public')}
                    />
                    <span>Public</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      className="h-3 w-3 border-slate-600 bg-slate-900 text-fuchsia-500"
                      checked={visibility === 'fans'}
                      onChange={() => setVisibility('fans')}
                    />
                    <span>Fans only</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      className="h-3 w-3 border-slate-600 bg-slate-900 text-fuchsia-500"
                      checked={visibility === 'private'}
                      onChange={() => setVisibility('private')}
                    />
                    <span>Private</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
            <p className="text-slate-500">
              You can still edit the title and visibility from the Host Studio after going live.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="rounded-md bg-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_rgba(236,72,153,0.7)] hover:bg-fuchsia-400 hover:shadow-[0_0_24px_rgba(236,72,153,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Go live
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
