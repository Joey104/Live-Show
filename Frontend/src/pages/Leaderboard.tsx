import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Flame, Gift, Users } from 'lucide-react'

const tabs = [
  { id: 'streamers', label: '🏆 主播榜', icon: Trophy },
  { id: 'gifts', label: '💰 打賞榜', icon: Gift },
  { id: 'popular', label: '🔥 人氣榜', icon: Flame },
  { id: 'rising', label: '🆕 新星榜', icon: Users },
]

const top3 = [
  { rank: 2, name: '主播B', score: '2,450萬', avatar: '👤' },
  { rank: 1, name: '主播A', score: '3,280萬', avatar: '👤' },
  { rank: 3, name: '主播C', score: '1,890萬', avatar: '👤' },
]

const leaderboard = [
  { rank: 4, name: '主播D', score: '1,250萬', change: 'up' },
  { rank: 5, name: '主播E', score: '1,180萬', change: 'same' },
  { rank: 6, name: '主播F', score: '1,050萬', change: 'down' },
  { rank: 7, name: '主播G', score: '980萬', change: 'up' },
  { rank: 8, name: '主播H', score: '920萬', change: 'same' },
  { rank: 9, name: '主播I', score: '850萬', change: 'up' },
  { rank: 10, name: '主播J', score: '780萬', change: 'down' },
]

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState('streamers')

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center mb-6">排行榜</h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-dark-elevated hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-3xl mb-2">
            {top3[0].avatar}
          </div>
          <div className="text-2xl mb-1">🥈</div>
          <div className="font-medium">{top3[0].name}</div>
          <div className="text-sm text-primary">{top3[0].score}</div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center -mt-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-4xl mb-2 ring-4 ring-yellow-400/30">
            {top3[1].avatar}
          </div>
          <div className="text-3xl mb-1">🥇</div>
          <div className="font-bold text-lg">{top3[1].name}</div>
          <div className="text-sm text-primary font-medium">{top3[1].score}</div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-3xl mb-2">
            {top3[2].avatar}
          </div>
          <div className="text-2xl mb-1">🥉</div>
          <div className="font-medium">{top3[2].name}</div>
          <div className="text-sm text-primary">{top3[2].score}</div>
        </div>
      </div>

      {/* Ranking List */}
      <div className="bg-dark-card rounded-xl overflow-hidden">
        {leaderboard.map((item, _index) => (
          <Link
            key={item.rank}
            to={`/profile/${item.rank}`}
            className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-border last:border-0"
          >
            <div className="w-8 text-center font-bold text-muted-foreground">
              {item.rank}
            </div>

            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-xl">
              👤
            </div>

            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">{item.score} 熱度</div>
            </div>

            <div className="text-lg">
              {item.change === 'up' && '↗️'}
              {item.change === 'down' && '↘️'}
              {item.change === 'same' && '➡️'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
