'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ApiStatus } from '@/components/ui/ApiStatus'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/daily', label: 'Daily' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/chat', label: 'AI Chat' },
  { href: '/scenarios', label: 'Scenarios' },
  { href: '/decisions', label: 'Decisions' },
  { href: '/insider', label: 'Insider' },
  { href: '/journal', label: 'Journal' },
  { href: '/sizing', label: 'Sizing' },
  { href: '/calendar', label: 'Calendar' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-800 px-6 py-4 sticky top-0 z-40 bg-gray-950/95 backdrop-blur">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-8">
          <Link href="/" className="text-xl font-bold text-white">
            StockMind
          </Link>
          <nav className="flex gap-3 overflow-x-auto pb-1 md:gap-4 md:flex-wrap md:overflow-visible md:pb-0">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 text-sm transition-colors ${
                  pathname === item.href
                    ? 'text-white font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <ApiStatus />
      </div>
    </header>
  )
}
