'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Navbar } from '@/components/layout/Navbar'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ background: '#080C14', color: '#F0F4FF', minHeight: '100vh' }}>
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <main>
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </QueryClientProvider>
      </body>
    </html>
  )
}
