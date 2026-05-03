'use client'

import { useQuery } from '@tanstack/react-query'

import { type EconomicEvent } from '@/components/calendar/EconomicEventCard'
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

const typeIcons: Record<string, string> = {
  macro: '📊',
  fed: '🏦',
  earnings: '💰',
  conference: '🎤',
  default: '📅',
}


function getEventType(event: EconomicEvent): string {
  const title = event.title.toLowerCase()
  if (title.includes('earnings') || title.includes('q1') || title.includes('q2') || title.includes('q3') || title.includes('q4')) return 'earnings'
  if (title.includes('fed') || title.includes('fomc') || title.includes('powell') || title.includes('rate')) return 'fed'
  if (title.includes('conference') || title.includes('summit') || title.includes('wwdc') || title.includes('gtc')) return 'conference'
  return 'macro'
}

function formatDateGroup(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
  } catch {
    return dateStr
  }
}

function isToday(dateStr: string): boolean {
  try {
    const date = new Date(dateStr)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  } catch {
    return false
  }
}

function groupEventsByDate(events: EconomicEvent[]): Record<string, EconomicEvent[]> {
  const groups: Record<string, EconomicEvent[]> = {}
  for (const event of events) {
    const key = event.date.slice(0, 10)
    if (!groups[key]) groups[key] = []
    groups[key].push(event)
  }
  return groups
}

export default function CalendarPage() {
  const { data: upcoming, isLoading: upcomingLoading } = useQuery<UpcomingCalendarResponse>({
    queryKey: ['calendar-upcoming'],
    queryFn: () => marketApi.calendarUpcoming().then((r) => r.data),
    staleTime: 1000 * 60 * 30,
  })

  const { data: week, isLoading: weekLoading } = useQuery<WeekCalendarResponse>({
    queryKey: ['calendar-week'],
    queryFn: () => marketApi.calendarWeek().then((r) => r.data),
    staleTime: 1000 * 60 * 30,
  })

  const isLoading = upcomingLoading && weekLoading
  const allEvents = [...(upcoming?.events || []), ...(week?.events || [])]
  const uniqueEvents = allEvents.filter((e, i, arr) => arr.findIndex((x) => x.title === e.title && x.date === e.date) === i)
  const grouped = groupEventsByDate(uniqueEvents)
  const sortedDates = Object.keys(grouped).sort()

  const cardStyle = {
    background: '#0E1420',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '12px 16px',
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 4 }}>
            Economic Calendar
          </h1>
          <p style={{ fontSize: 13, color: '#8B96B0' }}>
            Upcoming events relevant to your portfolio
          </p>
        </div>
        {/* Type legend */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {Object.entries(typeIcons).filter(([k]) => k !== 'default').map(([type, icon]) => (
            <div key={type} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 20,
              background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontSize: 12 }}>{icon}</span>
              <span style={{ fontSize: 11, color: '#8B96B0', textTransform: 'capitalize' }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {upcoming?.warning && (
        <div style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
        }}>
          <p style={{ fontSize: 13, color: '#f59e0b', fontWeight: 500 }}>{upcoming.warning}</p>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <LoadingSpinner />
        </div>
      ) : sortedDates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 14, color: '#4A5568' }}>No upcoming events found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sortedDates.map((date) => {
            const dayEvents = grouped[date]
            const todayFlag = isToday(date)
            const dateLabel = formatDateGroup(date)

            return (
              <div key={date}>
                {/* Date label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>📅</span>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#8B96B0' }}>{dateLabel}</p>
                  {todayFlag && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 9px', borderRadius: 99,
                      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
                      background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                    }}>
                      Today
                    </span>
                  )}
                </div>

                {/* Events */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayEvents.map((event, i) => {
                    const eventType = getEventType(event)
                    const icon = typeIcons[eventType] || typeIcons.default
                    const impactColor = event.impact === 'High' ? '#f43f5e'
                      : event.impact === 'Medium' ? '#f59e0b' : '#8B96B0'
                    const impactBg = event.impact === 'High' ? 'rgba(244,63,94,0.1)'
                      : event.impact === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.06)'

                    const timeStr = (() => {
                      try {
                        const d = new Date(event.date)
                        if (!Number.isNaN(d.getTime())) {
                          // If time is midnight (00:00) the event has no scheduled time
                          if (d.getHours() === 0 && d.getMinutes() === 0) return ''
                          return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                        }
                      } catch { /* */ }
                      return ''
                    })()

                    return (
                      <div key={`${event.title}-${i}`} style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF' }}>{event.title}</span>
                              {event.country && event.country !== 'US' && (
                                <span style={{
                                  fontSize: 11, fontWeight: 700, color: '#8B96B0',
                                  background: '#141C2B', border: '1px solid rgba(255,255,255,0.07)',
                                  padding: '1px 7px', borderRadius: 5,
                                }}>
                                  {event.country}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                              {timeStr && <p style={{ fontSize: 11, color: '#4A5568' }}>{timeStr} ET</p>}
                              {event.forecast && event.forecast !== 'N/A' && (
                                <p style={{ fontSize: 11, color: '#4A5568' }}>Forecast: <span style={{ color: '#8B96B0' }}>{event.forecast}</span></p>
                              )}
                              {event.previous && event.previous !== 'N/A' && (
                                <p style={{ fontSize: 11, color: '#4A5568' }}>Prev: <span style={{ color: '#8B96B0' }}>{event.previous}</span></p>
                              )}
                            </div>
                            {event.affected_sectors?.length > 0 && (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                {event.affected_sectors.slice(0, 3).map((s) => (
                                  <span key={s} style={{
                                    fontSize: 10, color: '#4A5568',
                                    background: '#141C2B', padding: '1px 6px', borderRadius: 4,
                                  }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Impact badge */}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '2px 9px', borderRadius: 99,
                            fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
                            background: impactBg, color: impactColor,
                            flexShrink: 0,
                          }}>
                            {event.impact}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
