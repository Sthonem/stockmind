'use client'

import { useQuery } from '@tanstack/react-query'

import {
  EconomicEventCard,
  type EconomicEvent,
} from '@/components/calendar/EconomicEventCard'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { marketApi } from '@/lib/api'

interface UpcomingCalendarResponse {
  days_ahead: number
  high_impact_count: number
  events: EconomicEvent[]
  warning?: string | null
}

interface WeekCalendarResponse {
  total: number
  events: EconomicEvent[]
}

export default function CalendarPage() {
  const { data: upcoming, isLoading: upcomingLoading } = useQuery<UpcomingCalendarResponse>({
    queryKey: ['calendar-upcoming'],
    queryFn: () => marketApi.calendarUpcoming().then((response) => response.data),
    staleTime: 1000 * 60 * 30,
  })

  const { data: week, isLoading: weekLoading } = useQuery<WeekCalendarResponse>({
    queryKey: ['calendar-week'],
    queryFn: () => marketApi.calendarWeek().then((response) => response.data),
    staleTime: 1000 * 60 * 30,
  })

  const upcomingEvents = upcoming?.events || []
  const weekEvents = week?.events || []

  const highImpact = weekEvents.filter((event) => event.impact === 'High')
  const otherEvents = weekEvents.filter((event) => event.impact !== 'High')

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Economic Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upcoming high-impact events that may affect your portfolio
        </p>
      </div>

      {upcoming?.warning && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-yellow-400 text-sm font-medium">{upcoming.warning}</p>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-medium text-white uppercase tracking-wider">
            Upcoming High-Impact Events
          </h2>
          <span className="text-gray-500 text-xs">
            {upcoming?.high_impact_count || 0} in next {upcoming?.days_ahead || 14} days
          </span>
        </div>

        {upcomingLoading ? (
          <LoadingSpinner size="sm" />
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">
            No high-impact events in the next 14 days
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EconomicEventCard key={`${event.title}-${event.date}`} event={event} />
            ))}
          </div>
        )}
      </section>

      {highImpact.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
            This Week - High Impact
          </h2>
          {weekLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <div className="space-y-3">
              {highImpact.map((event) => (
                <EconomicEventCard key={`high-${event.title}-${event.date}`} event={event} />
              ))}
            </div>
          )}
        </section>
      )}

      {otherEvents.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            This Week - Other Events
          </h2>
          <div className="space-y-2">
            {otherEvents.map((event) => (
              <EconomicEventCard key={`other-${event.title}-${event.date}`} event={event} />
            ))}
          </div>
        </section>
      )}

      <Card>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          How to use this
        </h2>
        <div className="space-y-2 text-sm text-gray-500">
          <p>High-impact events can significantly move markets and individual stocks.</p>
          <p>
            <span className="text-red-400">Fed/FOMC decisions</span> affect all sectors,
            especially tech, real estate, and utilities.
          </p>
          <p>
            <span className="text-yellow-400">CPI and inflation data</span> affect growth
            stocks and consumer discretionary.
          </p>
          <p>
            Consider reducing position sizes or setting tighter stop-losses
            before high-impact events.
          </p>
        </div>
      </Card>
    </div>
  )
}
