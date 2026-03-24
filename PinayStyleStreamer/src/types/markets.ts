/**
 * File: src/types/markets.ts
 * Description: Shared types for live prediction markets used across the Seduction Market app.
 */

/**
 * LiveMarketItem
 * Represents a single prediction market attached to a stream.
 */
export interface LiveMarketItem {
  /** Unique identifier for the market. */
  id: string
  /** Human-readable market question. */
  label: string
  /** Implied probability for a "Yes" outcome, in percent (0-100). */
  yesProb: number
  /** Total liquidity / volume in USD for this market. */
  poolUsd: number
}
