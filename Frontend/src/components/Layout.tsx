import { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
