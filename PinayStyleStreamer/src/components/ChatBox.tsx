/**
 * File: src/components/ChatBox.tsx
 * Description: Live chat box for the live player, styled to match the neon
 *              dark theme. Guests can read messages, logged-in users can send.
 */

import React, { FormEvent, useState } from 'react'
import type { ChatMessage } from '../types/chat'

/**
 * Props for ChatBox component.
 */
interface ChatBoxProps {
  /**
   * Whether the current viewer is authenticated.
   */
  isAuthenticated: boolean
  /**
   * Called when a guest tries to send a message, to trigger auth flow.
   */
  onRequireAuth: () => void
  /**
   * Current list of chat messages to display.
   */
  messages: ChatMessage[]
  /**
   * Callback to append a new user message.
   */
  onSendMessage: (text: string) => void
}

/**
 * ChatBox
 * Shows a list of messages and allows authenticated users to send mock messages.
 * The actual message state is managed by the parent (LivePlayer) so it can be
 * shared with overlays and other components.
 */
export default function ChatBox({
  isAuthenticated,
  onRequireAuth,
  messages,
  onSendMessage,
}: ChatBoxProps): JSX.Element {
  const [input, setInput] = useState('')

  /**
   * Handle submit from the textarea. Delegates actual message creation
   * to the parent via onSendMessage.
   */
  function handleSend(e?: FormEvent<HTMLFormElement>): void {
    if (e) {
      e.preventDefault()
    }

    if (!isAuthenticated) {
      onRequireAuth()
      return
    }

    const trimmed = input.trim()
    if (!trimmed) return

    onSendMessage(trimmed)
    setInput('')
  }

  return (
    <div className="flex h-full w-full flex-col rounded-lg bg-slate-950/90 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-fuchsia-200">Live Chat</div>
        <span className="text-[10px] text-slate-500">
          {isAuthenticated ? 'You can chat.' : 'Log in to send messages.'}
        </span>
      </div>

      <div className="mb-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={[
              'max-w-[80%] rounded-md px-2 py-1 text-xs',
              m.user === 'You'
                ? 'ml-auto bg-fuchsia-500/25 text-fuchsia-50'
                : 'mr-auto bg-slate-800/80 text-slate-100',
            ].join(' ')}
          >
            <div className="text-[10px] font-medium text-slate-400">
              {m.user}
            </div>
            <div className="text-xs">{m.text}</div>
          </div>
        ))}
      </div>

      <form className="flex gap-2" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isAuthenticated ? 'Say something...' : 'Log in to chat with the room'
          }
          disabled={!isAuthenticated}
          className="flex-1 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/60"
        />
        <button
          type="submit"
          className="rounded-md bg-fuchsia-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isAuthenticated}
        >
          Send
        </button>
      </form>
    </div>
  )
}