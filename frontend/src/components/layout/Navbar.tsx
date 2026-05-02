'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      height: 56,
      background: 'rgba(8,12,20,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 32,
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, textDecoration: 'none' }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 800,
          color: '#000',
        }}>S</div>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.3 }}>StockMind</span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', gap: 2, overflowX: 'auto', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#F0F4FF' : '#8B96B0',
                background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Status dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px #22c55e',
          display: 'block',
        }} />
        <span style={{ fontSize: 11, color: '#8B96B0' }}>Live</span>
      </div>
    </header>
  )
}
