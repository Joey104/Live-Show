/**
 * File: src/store/useUserStore.ts
 * Description: Global demo user store using Zustand. Handles mock auth, balance,
 *              bets, gifts, notifications and favorite markets for the viewer UI.
 */

import { create } from 'zustand'
import type { LiveMarketItem } from '../types/markets'

/**
 * AuthUser
 * Minimal representation of a logged-in user.
 */
export interface AuthUser {
  /** Unique user identifier (demo-only). */
  id: string
  /** Display username. */
  username: string
  /** Email address. */
  email: string
}

/**
 * BetRecord
 * Single prediction bet record for personal history.
 */
export interface BetRecord {
  id: string
  marketId: string
  marketLabel: string
  streamTitle?: string
  side: 'YES' | 'NO'
  amount: number
  createdAt: string
}

/**
 * NotificationItem
 * System notification entry shown in the notification list.
 */
export interface NotificationItem {
  id: string
  message: string
  createdAt: string
  read: boolean
}

/**
 * GiftRankItem
 * Aggregated gift amount per user for a specific live stream.
 */
export interface GiftRankItem {
  user: string
  amount: number
}

/**
 * UserState
 * Zustand store shape for mock auth and in-app economy.
 */
interface UserState {
  currentUser: AuthUser | null
  /** Demo-only plain-text password, never use like this in production. */
  password: string | null
  /** Gold coin balance for predictions and gifts. */
  balance: number
  /** Personal prediction bet history. */
  bets: BetRecord[]
  /** System notifications. */
  notifications: NotificationItem[]
  /** Favorite market IDs. */
  favorites: string[]
  /** Per-stream gift rankings for the current session. */
  giftRankingByStream: Record<string, GiftRankItem[]>

  /** Log in with username/email and password (demo implementation). */
  login: (identifier: string, password: string) => void
  /** Register a new demo user and auto-login. */
  register: (username: string, email: string, password: string) => void
  /** Clear current user session. */
  logout: () => void
  /** Change password; returns true when old password matches. */
  changePassword: (oldPassword: string, newPassword: string) => boolean

  /** Place a prediction bet, updating balance and history. */
  placeBet: (params: {
    market: LiveMarketItem
    side: 'YES' | 'NO'
    amount: number
    streamTitle?: string
  }) => { ok: boolean; error?: string }

  /** Send a gift in a stream, updating balance and per-stream ranking. */
  sendGift: (params: { streamId: string; amount: number }) => {
    ok: boolean
    error?: string
  }

  /** Toggle favorite status for a given market. */
  toggleFavorite: (marketId: string) => void

  /** Mark a single notification as read. */
  markNotificationRead: (id: string) => void
}

/**
 * useUserStore
 * Main Zustand store hook for user and economy state.
 */
export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  password: null,
  balance: 0,
  bets: [],
  notifications: [],
  favorites: [],
  giftRankingByStream: {},

  login: (identifier, password) => {
    const user: AuthUser = {
      id: `user-${Date.now()}`,
      username: identifier,
      email: identifier.includes('@') ? identifier : `${identifier}@demo.local`,
    }

    set((state) => ({
      currentUser: user,
      password,
      balance: state.balance > 0 ? state.balance : 1000,
      notifications: [
        {
          id: `notif-${Date.now()}`,
          message: 'Welcome back to Seduction Market — demo account activated with coins.',
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    }))
  },

  register: (username, email, password) => {
    const user: AuthUser = {
      id: `user-${Date.now()}`,
      username,
      email,
    }

    set((state) => ({
      currentUser: user,
      password,
      balance: 1200,
      notifications: [
        {
          id: `notif-${Date.now()}`,
          message: 'Registration successful — 1,200 demo coins have been added to your balance.',
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    }))
  },

  logout: () => {
    set({ currentUser: null, password: null })
  },

  changePassword: (oldPassword, newPassword) => {
    const { password } = get()
    if (!password || password !== oldPassword) {
      return false
    }

    set((state) => ({
      password: newPassword,
      notifications: [
        {
          id: `notif-${Date.now()}`,
          message: 'Your password has been updated (demo only).',
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    }))
    return true
  },

  placeBet: ({ market, side, amount, streamTitle }) => {
    const state = get()

    if (!state.currentUser) {
      return { ok: false, error: 'AUTH_REQUIRED' }
    }
    if (amount <= 0) {
      return { ok: false, error: 'INVALID_AMOUNT' }
    }
    if (amount > state.balance) {
      return { ok: false, error: 'INSUFFICIENT_BALANCE' }
    }

    const bet: BetRecord = {
      id: `bet-${Date.now()}`,
      marketId: market.id,
      marketLabel: market.label,
      streamTitle,
      side,
      amount,
      createdAt: new Date().toISOString(),
    }

    set({
      balance: state.balance - amount,
      bets: [...state.bets, bet],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          message: `You placed a ${side} bet of ${amount} coins on "${market.label}".`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })

    return { ok: true }
  },

  sendGift: ({ streamId, amount }) => {
    const state = get()

    if (!state.currentUser) {
      return { ok: false, error: 'AUTH_REQUIRED' }
    }
    if (amount <= 0) {
      return { ok: false, error: 'INVALID_AMOUNT' }
    }
    if (amount > state.balance) {
      return { ok: false, error: 'INSUFFICIENT_BALANCE' }
    }

    const sender = state.currentUser.username
    const existingRanks = state.giftRankingByStream[streamId] || []
    const index = existingRanks.findIndex((r) => r.user === sender)
    let nextRanks: GiftRankItem[]

    if (index >= 0) {
      const updated = [...existingRanks]
      updated[index] = {
        ...updated[index],
        amount: updated[index].amount + amount,
      }
      nextRanks = updated
    } else {
      nextRanks = [...existingRanks, { user: sender, amount }]
    }

    nextRanks.sort((a, b) => b.amount - a.amount)
    nextRanks = nextRanks.slice(0, 3)

    set({
      balance: state.balance - amount,
      giftRankingByStream: {
        ...state.giftRankingByStream,
        [streamId]: nextRanks,
      },
      notifications: [
        {
          id: `notif-${Date.now()}`,
          message: `You sent a gift worth ${amount} coins.`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })

    return { ok: true }
  },

  toggleFavorite: (marketId) => {
    const { favorites } = get()
    if (favorites.includes(marketId)) {
      set({ favorites: favorites.filter((id) => id !== marketId) })
    } else {
      set({ favorites: [...favorites, marketId] })
    }
  },

  markNotificationRead: (id) => {
    const { notifications } = get()
    set({
      notifications: notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })
  },
}))