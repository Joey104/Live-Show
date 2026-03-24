/**
 * File: src/types/chat.ts
 * Description: Shared chat-related TypeScript types for live chat messages.
 */

export interface ChatMessage {
  /**
   * Unique identifier for this chat message.
   */
  id: string
  /**
   * Display name of the sender.
   */
  user: string
  /**
   * Plain text content of the message.
   */
  text: string
  /**
   * Unix timestamp in milliseconds when the message was created.
   * Used for ordering and lightweight recency calculations.
   */
  createdAt: number
}