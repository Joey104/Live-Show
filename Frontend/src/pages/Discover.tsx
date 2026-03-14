import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, TrendingUp } from 'lucide-react'

const hotSearches = ['王者榮耀', '音樂現場', '深夜聊天', '美食製作', '健身直播']

const hotStreamers = [
  { id: '1', name: '主播A', avatar: '👤', status: 'live', viewers: '10.2k' },
  { id: '2', name: '主播B', avatar: '👤', status: 'offline' },
  { id: '3', name: '主播C', avatar: '👤', status: 'live', viewers: '5.8k' },
  { id: '4', name: '主播D', avatar: '👤', status: 'live', viewers: '3.2k' },
]

const categories = [
  { id: 'gaming', name: '遊戲', icon: '🎮', count: 234 },
  { id: 'music', name: '音樂', icon: '🎵', count: 156 },
  { id: 'chat', name: '聊天', icon: '💬', count: 89 },
  { id: 'outdoor', name: '戶外', icon: '🏃', count: 67 },
  { id: 'food', name: '美食', icon: '🍳', count: 45 },
  { id: 'sports', name: '運動', icon: '⚽', count: 78 },
  { id: 'art', name: '手工', icon: '🎨', count: 34 },
  { id: 'study', name: '學習', icon: '📚', count: 23 },
  { id: 'movie', name: '電影', icon: '🎬', count: 12 },
]

export function Discover() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Search */}
      <section>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索主播、直播內容..."
            className="w-full bg-dark-elevated border border-border rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </div>
      </section>

      {/* Hot Searches */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">熱搜</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {hotSearches.map((tag) => (
            <button
              key={tag}
              className="px-4 py-2 bg-dark-elevated hover:bg-white/5 rounded-full text-sm transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {/* Hot Streamers */}
      <section>
        <h2 className="font-semibold mb-4">🎯 熱門主播</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {hotStreamers.map((streamer) => (
            <Link
              key={streamer.id}
              to={`/profile/${streamer.id}`}
              className="flex flex-col items-center min-w-[80px]"
            >
              <div className="relative w-16 h-16 mb-2">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl"
003e
                  {streamer.avatar}
                </div>
                {streamer.status === 'live' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    LIVE
                  </span>
                )}
              </div>
              <span className="text-sm font-medium">{streamer.name}</span>
              {streamer.viewers && (
                <span className="text-xs text-muted-foreground">{streamer.viewers}</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="font-semibold mb-4">📂 全部分類</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="p-4 bg-dark-elevated hover:bg-white/5 rounded-xl transition-colors text-center"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="font-medium">{cat.name}</div>
              <div className="text-xs text-muted-foreground">{cat.count} 個直播</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
