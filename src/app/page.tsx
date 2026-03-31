import Link from 'next/link'
import {
  getHealthDeep,
  getHealthAlerts,
  getCallHistory,
  getLatencyStats,
  getOverview,
} from '@/lib/api'
import { cn, formatDuration, formatTimestamp, formatCost, formatTokens } from '@/lib/utils'

function statusDot(status: string): string {
  const s = status.toLowerCase()
  if (['healthy', 'up', 'ok', 'closed'].includes(s)) return 'bg-green-500'
  if (['degraded', 'warning', 'half_open', 'half-open'].includes(s)) return 'bg-yellow-500'
  if (['unhealthy', 'down', 'critical', 'open'].includes(s)) return 'bg-red-500'
  return 'bg-gray-400'
}

function statusLabel(status: string): string {
  const s = status.toLowerCase()
  if (['healthy', 'up', 'ok', 'closed'].includes(s)) return 'Healthy'
  if (['degraded', 'warning', 'half_open', 'half-open'].includes(s)) return 'Degraded'
  if (['unhealthy', 'down', 'critical', 'open'].includes(s)) return 'Unhealthy'
  return status
}

function formatName(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function OverviewPage() {
  const [healthResult, alertsResult, callsResult, latencyResult, overviewResult] = await Promise.allSettled([
    getHealthDeep(),
    getHealthAlerts(),
    getCallHistory(0, 5),
    getLatencyStats(),
    getOverview(),
  ])

  const health = healthResult.status === 'fulfilled' ? healthResult.value : null
  const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value : null
  const calls = callsResult.status === 'fulfilled' ? callsResult.value : null
  const latency = latencyResult.status === 'fulfilled' ? latencyResult.value : null
  const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null

  const totalCalls = calls?.total ?? 0
  const activeCalls = alerts?.signals?.active_calls ?? 0
  const recentCalls = calls?.calls ?? []
  const systemStatus = health?.status ?? 'unknown'
  const components = health?.checks ?? {}
  const activeAlerts = alerts?.alerts ?? []

  // Compute average latency from stages
  let avgLatency: number | null = null
  if (latency?.stages) {
    const stageValues = Object.values(latency.stages)
    if (stageValues.length > 0) {
      avgLatency = Math.round(stageValues.reduce((sum, s) => sum + s.avg_ms, 0))
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center border-b border-border px-6">
        <h1 className="text-[13px] font-medium text-foreground">Overview</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Status + Metrics strip */}
        <div className="grid grid-cols-4 border-b border-border">
          <div className="px-6 py-5 border-r border-border">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              System
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', statusDot(systemStatus))} />
              <span className="text-[20px] font-medium tabular-nums text-foreground">
                {statusLabel(systemStatus)}
              </span>
            </div>
          </div>

          <div className="px-6 py-5 border-r border-border">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total Calls
            </span>
            <div className="mt-2">
              <span className="text-[20px] font-medium tabular-nums text-foreground">
                {totalCalls}
              </span>
            </div>
          </div>

          <div className="px-6 py-5 border-r border-border">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Active Now
            </span>
            <div className="mt-2 flex items-center gap-2">
              {activeCalls > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              )}
              <span className="text-[20px] font-medium tabular-nums text-foreground">
                {activeCalls}
              </span>
            </div>
          </div>

          <div className="px-6 py-5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Avg Response
            </span>
            <div className="mt-2">
              <span className="text-[20px] font-medium tabular-nums text-foreground">
                {avgLatency != null ? `${avgLatency} ms` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Two-column: Components + Alerts */}
        <div className="grid grid-cols-2 border-b border-border">
          {/* Components */}
          <div className="border-r border-border">
            <div className="px-6 py-3 bg-[#fafafa] border-b border-border">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Components
              </span>
            </div>
            {Object.keys(components).length > 0 ? (
              Object.entries(components).map(([name, check]) => (
                <div key={name} className="flex items-center gap-3 px-6 py-2.5 border-b border-border last:border-b-0">
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusDot(check.status))} />
                  <span className="text-[13px] text-foreground flex-1">{formatName(name)}</span>
                  {check.latency_ms != null && (
                    <span className="text-[12px] font-mono tabular-nums text-muted-foreground">
                      {Math.round(check.latency_ms)} ms
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground w-[60px] text-right">
                    {statusLabel(check.status)}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-[12px] text-muted-foreground">
                No component data
              </div>
            )}
          </div>

          {/* Alerts */}
          <div>
            <div className="px-6 py-3 bg-[#fafafa] border-b border-border">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Alerts
              </span>
            </div>
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert, i) => (
                <div key={`${alert.code}-${i}`} className="flex items-start gap-3 px-6 py-2.5 border-b border-border last:border-b-0">
                  <span className={cn(
                    'mt-1 h-1.5 w-1.5 rounded-full shrink-0',
                    alert.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                  )} />
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {alert.severity}
                    </span>
                    <p className="text-[13px] text-foreground">{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-[12px] text-muted-foreground">
                No active alerts
              </div>
            )}
          </div>
        </div>

        {/* Recent Calls */}
        <div>
          <div className="flex items-center px-6 py-3 bg-[#fafafa] border-b border-border">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent Calls
            </span>
            <Link
              href="/calls"
              className="ml-auto text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>

          {recentCalls.length > 0 ? (
            recentCalls.map((call) => (
              <Link
                key={call.call_sid}
                href={call.is_active ? `/calls/${call.call_sid}/live` : `/calls/${call.call_sid}`}
                className="flex items-center gap-4 px-6 py-3 border-b border-border transition-colors hover:bg-[#fafafa]"
              >
                <span className="w-[90px] shrink-0 text-[12px] tabular-nums text-muted-foreground">
                  {formatTimestamp(call.start_time)}
                </span>

                {call.is_active && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500 animate-pulse" />
                )}

                <span className="flex-1 min-w-0 truncate text-[13px] text-foreground">
                  {call.transcript_preview || (
                    <span className="text-muted-foreground italic">No transcript</span>
                  )}
                </span>

                <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
                  {call.turn_count} turns
                </span>

                <span className="w-[60px] shrink-0 text-right text-[12px] tabular-nums text-muted-foreground">
                  {call.duration_ms != null ? formatDuration(call.duration_ms) : '—'}
                </span>
              </Link>
            ))
          ) : (
            <div className="px-6 py-4 text-[12px] text-muted-foreground">
              No calls recorded yet
            </div>
          )}
        </div>

        {/* Latency Stats */}
        {latency?.stages && Object.keys(latency.stages).length > 0 && (
          <div>
            <div className="px-6 py-3 bg-[#fafafa] border-b border-border">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Latency
              </span>
            </div>
            <div className="flex items-center gap-4 px-6 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border">
              <span className="flex-1">Stage</span>
              <span className="w-[56px] text-right">Avg</span>
              <span className="w-[56px] text-right">P95</span>
              <span className="w-[56px] text-right">P99</span>
            </div>
            {Object.entries(latency.stages).map(([name, s]) => (
              <div key={name} className="flex items-center gap-4 px-6 py-2.5 border-b border-border">
                <span className="text-[13px] text-foreground flex-1">{formatName(name)}</span>
                <span className="w-[56px] text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                  {Math.round(s.avg_ms)} ms
                </span>
                <span className={cn(
                  'w-[56px] text-right font-mono text-[12px] tabular-nums',
                  s.p95_ms > 1000 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'
                )}>
                  {Math.round(s.p95_ms)} ms
                </span>
                <span className={cn(
                  'w-[56px] text-right font-mono text-[12px] tabular-nums',
                  s.p99_ms > 1000 ? 'text-red-600 font-medium' : 'text-muted-foreground'
                )}>
                  {Math.round(s.p99_ms)} ms
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
