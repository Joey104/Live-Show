import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bell, User, Menu, X, Video } from 'lucide-react'

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient hidden sm:block">LiveShow</span>
        </Link>

        {/* Search Bar */}
        <div className={`${isSearchOpen ? 'flex' : 'hidden'} md:flex flex-1 max-w-md mx-4`}>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="搜索直播、主播..."
              className="w-full bg-dark-elevated border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          <Link
            to="/profile/me"
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
          >
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary hidden sm:block">登入</span>
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-dark-card border-b border-border">
          <nav className="px-4 py-2 space-y-1">
            <Link to="/" className="block px-4 py-2 hover:bg-white/5 rounded-lg" onClick={() => setIsMenuOpen(false)}>首頁</Link>
            <Link to="/discover" className="block px-4 py-2 hover:bg-white/5 rounded-lg" onClick={() => setIsMenuOpen(false)}>發現</Link>
            <Link to="/leaderboard" className="block px-4 py-2 hover:bg-white/5 rounded-lg" onClick={() => setIsMenuOpen(false)}>排行榜</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
