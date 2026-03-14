import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Gamepad2, Music, MessageCircle, UtensilsCrossed, Trophy, ChevronRight } from 'lucide-react'

const categories = [
  { id: 'gaming', name: '遊戲', icon: Gamepad2, color: 'from-purple-500 to-purple-700' },
  { id: 'music', name: '音樂', icon: Music, color: 'from-pink-500 to-pink-700' },
  { id: 'chat', name: '聊天', icon: MessageCircle, color: 'from-blue-500 to-blue-700' },
  { id: 'food', name: '美食', icon: UtensilsCrossed, color: 'from-orange-500 to-orange-700' },
  { id: 'sports', name: '運動', icon: Trophy, color: 'from-green-500 to-green-700' },
]

const featuredStreams = [
  { id: '1', title: '今天一起打排位！', streamer: '主播A', viewers: '10.2k', category: '遊戲', thumbnail: '/api/placeholder/640/360' },
  { id: '2', title: '深夜聊天室', streamer: '主播B', viewers: '5.8k', category: '聊天', thumbnail: '/api/placeholder/640/360' },
  { id: '3', title: '吉他彈唱時間', streamer: '主播C', viewers: '3.2k', category: '音樂', thumbnail: '/api/placeholder/640/360' },
]

const liveStreams = [
  { id: '1', title: '王者榮耀上分之路', streamer: '主播A', viewers: '5.2k', category: '遊戲' },
  { id: '2', title: '深夜聊天室', streamer: '主播B', viewers: '3.1k', category: '聊天' },
  { id: '3', title: '吉他彈唱時間', streamer: '主播C', viewers: '8.7k', category: '音樂' },
  { id: '4', title: '美食製作教學', streamer: '主播D', viewers: '1.2k', category: '美食' },
  { id: '5', title: '健身直播', streamer: '主播E', viewers: '2.5k', category: '運動' },
  { id: '6', title: '遊戲實況', streamer: '主播F', viewers: '4.3k', category: '遊戲' },
  { id: '7', title: '唱歌給你聽', streamer: '主播G', viewers: '6.1k', category: '音樂' },
  { id: '8', title: '戶外探險', streamer: '主播H', viewers: '1.8k', category: '戶外' },
]

export function Home() {
  const [activeCategory, setActiveCategory] = useState('all')

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Featured Stream */}
      <section className="relative rounded-2xl overflow-hidden">
        <div className="aspect-video md:aspect-[21/9] bg-gradient-to-br from-primary/20 to-secondary/20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">LIVE</span>
              <span className="flex items-center gap-1 text-sm">
                <Flame className="w-4 h-4 text-primary" />
                熱門直播
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">今天一起打排位！</h1>
            <p className="text-muted-foreground mb-4">主播A · 10.2k 觀看</p>
            
            <Link
              to="/room/1"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark rounded-full font-medium transition-colors"
            >
              立即觀看
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-lg font-semibold mb-4">熱門分類</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-dark-elevated hover:bg-white/5'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-dark-elevated hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            )
          })}
        </div>
      </section>

      {/* Live Streams Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">🔴 正在直播</h2>
          <Link to="/discover" className="text-sm text-primary hover:underline">查看全部</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {liveStreams.map((stream) => (
            <Link
              key={stream.id}
              to={`/room/${stream.id}`}
              className="group"
            >
              <div className="relative aspect-video bg-dark-elevated rounded-lg overflow-hidden mb-2">
                {/* Thumbnail Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-dark-elevated to-dark-card" />
                
                {/* Live Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">LIVE</span>
                </div>

                {/* Viewer Count */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs bg-black/60 px-2 py-0.5 rounded">
                  {stream.viewers}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{stream.title}</h3>
              <p className="text-sm text-muted-foreground">{stream.streamer}</p>
              <p className="text-xs text-muted-foreground">{stream.category}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
