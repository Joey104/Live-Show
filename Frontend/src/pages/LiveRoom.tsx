import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Heart, Share2, Flag, Send, Smile, Gift } from 'lucide-react'

const chatMessages = [
  { id: 1, user: '用戶A', message: '主播好厲害！', type: 'text' },
  { id: 2, user: '用戶B', message: '666666', type: 'text' },
  { id: 3, user: '系統', message: '🎁 用戶C 送出火箭 x1', type: 'gift' },
  { id: 4, user: '用戶D', message: '求帶飛', type: 'text' },
  { id: 5, user: '用戶E', message: '主播聲音好聽', type: 'text' },
]

const giftList = [
  { id: 'rose', name: '郃鮮', icon: '🌹', price: 1 },
  { id: 'beer', name: '啤酒', icon: '🍺', price: 10 },
  { id: 'lollipop', name: '棒棒糖', icon: '🍭', price: 50 },
  { id: 'balloon', name: '氣球', icon: '🎈', price: 100 },
  { id: 'car', name: '跑車', icon: '🚗', price: 500 },
  { id: 'rocket', name: '火箭', icon: '🚀', price: 1000 },
]

export function LiveRoom() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('chat')
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Video Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-4xl">📹</span>
                </div>
                <p className="text-muted-foreground">直播視頻區域</p>
              </div>
            </div>

            {/* Live Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded animate-pulse">LIVE</span>
              <span className="px-2 py-1 bg-black/60 text-white text-xs rounded">1.2k 觀看</span>
            </div>
          </div>

          {/* Stream Info */}
          <div className="bg-dark-card rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl">
                  👤
                </div>
                <div>
                  <h1 className="text-lg font-semibold">今天一起打排位！</h1>
                  <p className="text-sm text-muted-foreground">主播A · 遊戲 · 直播了 2 小時</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary-dark rounded-full transition-colors">
                  <Heart className="w-4 h-4" />
                  關注
                </button>
                <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <Flag className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="bg-dark-card rounded-lg overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {['chat', 'gifts', 'users'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {tab === 'chat' && '💬 聊天'}
                {tab === 'gifts' && '🎁 禮物'}
                {tab === 'users' && '👥 在線'}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`text-sm ${
                msg.type === 'gift' ? 'text-primary' : ''
              }`}>
                <span className="text-muted-foreground">{msg.user}: </span>
                <span>{msg.message}</span>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="輸入消息..."
                className="flex-1 bg-dark-elevated border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowGiftModal(true)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <Gift className="w-5 h-5 text-primary" />
              </button>
              <button className="p-2 bg-primary hover:bg-primary-dark rounded-full transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-dark-card rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🎁 送禮物</h3>
              <button
                onClick={() => setShowGiftModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {giftList.map((gift) => (
                <button
                  key={gift.id}
                  className="p-3 bg-dark-elevated hover:bg-white/5 rounded-lg transition-colors text-center"
                >
                  <div className="text-2xl mb-1">{gift.icon}</div>
                  <div className="text-xs">{gift.name}</div>
                  <div className="text-xs text-primary">{gift.price} 幣</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">我的餘額: 1,250 金幣</span>
              <button className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-full text-sm transition-colors">
                充值
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
