import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { LiveRoom } from './pages/LiveRoom'
import { Profile } from './pages/Profile'
import { Discover } from './pages/Discover'
import { Leaderboard } from './pages/Leaderboard'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:id" element={<LiveRoom />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </Layout>
  )
}

export default App
