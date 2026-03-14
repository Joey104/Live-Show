export interface User {
  id: string
  username: string
  email: string
  role: 'viewer' | 'streamer' | 'admin'
  verified: boolean
  avatarUrl: string | null
  createdAt: string
}

export interface Stream {
  id: string
  streamerId: string
  title: string
  description: string | null
  category: string
  status: 'pending' | 'live' | 'ended'
  startTime: string | null
  endTime: string | null
  thumbnailUrl: string | null
  viewerCount: number
  durationSeconds: number | null
  revenue: number | null
}

export interface ChatMessage {
  id: string
  streamId: string
  userId: string
  userName: string
  message: string
  type: 'text' | 'emoji' | 'sticker' | 'system' | 'gift'
  createdAt: string
}

export interface Gift {
  id: string
  name: string
  icon: string
  price: number
  animation: string | null
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  streamCount: number
}
