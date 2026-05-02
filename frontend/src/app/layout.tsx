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
      <body className="bg-gray-950 text-white min-h-screen">
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
