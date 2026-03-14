import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Settings, Edit3 } from 'lucide-react'

const userStats = {
  following: 125,
  followers: 12,
  likes: '3.2k',
  videos: 8,
}

const recentWatched = [
  { id: '1', title: '王者榮耀上分', streamer: '主播A', thumbnail: '/api/placeholder/320/180' },
  { id: '2', title: '深夜聊天室', streamer: '主播B', thumbnail: '/api/placeholder/320/180' },
  { id: '3', title: '吉他彈唱', streamer: '主播C', thumbnail: '/api/placeholder/320/180' },
  { id: '4', title: '美食製作', streamer: '主播D', thumbnail: '/api/placeholder/320/180' },
]

export function Profile() {
  const { id } = useParams()
  const isMe = id === 'me'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="relative">
        {/* Cover */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl"></div>

        {/* Avatar & Info */}
        <div className="px-4 -mt-12 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl border-4 border-dark-bg">
              👤
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">用戶名稱</h1>
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">Lv.12</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">ID: 12345678</p>
              <p className="text-sm">簽名：熱愛生活，熱愛直播</p>
            </div>

            <div className="flex gap-2">
              {isMe ? (
                <>
                  <button className="flex items-center gap-1 px-4 py-2 bg-dark-elevated hover:bg-white/5 rounded-full transition-colors">
                    <Edit3 className="w-4 h-4" />
                    編輯資料
                  </button>
                  <button className="p-2 bg-dark-elevated hover:bg-white/5 rounded-full transition-colors">
                    <Settings className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button className="px-6 py-2 bg-primary hover:bg-primary-dark rounded-full transition-colors">
                  關注
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="text-center">
          <div className="text-2xl font-bold">{userStats.following}</div>
          <div className="text-sm text-muted-foreground">關注</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{userStats.followers}</div>
          <div className="text-sm text-muted-foreground">粉絲</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{userStats.likes}</div>
          <div className="text-sm text-muted-foreground">獲贊</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{userStats.videos}</div>
          <div className="text-sm text-muted-foreground">作品</div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bg-dark-card rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-4">📊 數據概覽</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">觀看時長</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">128 小時</span>
              <span className="text-xs text-primary">本周 +12 小時</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">打賞金額</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">¥1,250</span>
              <span className="text-xs text-primary">本月 Top 10%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">連續簽到</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">15 天</span>
              <span className="text-xs text-muted-foreground">再簽到 5 天領大獎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Watched */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">📜 最近觀看</h2>
          <button className="text-sm text-primary hover:underline">查看全部</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentWatched.map((item) => (
            <Link key={item.id} to={`/room/${item.id}`} className="group">
              <div className="relative aspect-video bg-dark-elevated rounded-lg overflow-hidden mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-elevated to-dark-card" />
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-medium text-sm truncate">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.streamer}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
