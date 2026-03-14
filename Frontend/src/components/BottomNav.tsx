import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, Trophy, User } from 'lucide-react'

const navItems = [
  { path: '/', label: '首頁', icon: Home },
  { path: '/discover', label: '發現', icon: Compass },
  { path: '/leaderboard', label: '排行', icon: Trophy },
  { path: '/profile/me', label: '我的', icon: User },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
