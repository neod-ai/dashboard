import {
  getHealthDeep,
  getHealthAlerts,
  getCircuitBreakers,
  getLatencyStats,
  getOverview,
} from '@/lib/api'
import type {
  HealthCheck,
  HealthAlerts,
  CircuitBreakers,
  LatencyStats,
  SystemOverview,
} from '@/lib/types'
import { cn, formatCost, formatTokens } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBg(status: string): string {
  const s = status.toLowerCase()
  if (['healthy', 'up', 'ok', 'closed'].includes(s)) return 'bg-green-500/15 text-green-400 border-green-500/30'
  if (['degraded', 'warning', 'half_open', 'half-open'].includes(s)) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  if (['unhealthy', 'down', 'critical', 'open'].includes(s)) return 'bg-red-500/15 text-red-400 border-red-500/30'
  return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

function statusBorder(status: string): string {
  const s = status.toLowerCase()
  if (['healthy', 'up', 'ok', 'closed'].includes(s)) return 'border-l-green-500'
  if (['degraded', 'warning', 'half_open', 'half-open'].includes(s)) return 'border-l-yellow-500'
  if (['unhealthy', 'down', 'critical', 'open'].includes(s)) return 'border-l-red-500'
  return 'border-l-zinc-500'
}

function bannerColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'healthy') return 'bg-green-500/10 border-green-500/30 text-green-400'
  if (s === 'degraded') return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
  return 'bg-red-500/10 border-red-500/30 text-red-400'
}

function bannerDot(status: string): string {
  const s = status.toLowerCase()
  if (s === 'healthy') return 'bg-green-400'
  if (s === 'degraded') return 'bg-yellow-400'
  return 'bg-red-400'
}

function bannerLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === 'healthy') return 'System Healthy'
  if (s === 'degraded') return 'System Degraded'
  return 'System Unhealthy'
}

function formatName(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '...' : s
}

function Unavailable({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-6 text-center text-sm text-zinc-500">
      {label} -- Unavailable
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function OverallBanner({ health }: { health: HealthCheck }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border px-5 py-4', bannerColor(health.status))}>
      <span className={cn('h-3 w-3 rounded-full animate-pulse', bannerDot(health.status))} />
      <span className="text-lg font-semibold">{bannerLabel(health.status)}</span>
      <span className="ml-auto text-xs text-zinc-500">{new Date(health.timestamp).toLocaleString()}</span>
    </div>
  )
}

function ComponentHealthGrid({ checks }: { checks: HealthCheck['checks'] }) {
  const entries = Object.entries(checks)
  if (entries.length === 0) return <p className="text-sm text-zinc-500">No component checks available.</p>

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([name, check]) => (
        <Card key={name} className={cn('border-l-4', statusBorder(check.status))}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{formatName(name)}</span>
              <Badge className={cn('text-[11px]', statusBg(check.status))}>{check.status.toUpperCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {check.latency_ms != null && (
                <>
                  <dt className="text-zinc-500">Latency</dt>
                  <dd className="text-right font-mono">{Math.round(check.latency_ms)} ms</dd>
                </>
              )}
              {check.circuit_state && (
                <>
                  <dt className="text-zinc-500">Circuit</dt>
                  <dd className={cn('text-right font-mono', statusBg(check.circuit_state))}>{check.circuit_state}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AlertsList({ data }: { data: HealthAlerts }) {
  if (data.alerts.length === 0) {
    return (
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
        No active alerts
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.alerts.map((alert, i) => (
        <div
          key={`${alert.code}-${i}`}
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
            alert.severity === 'critical'
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-yellow-500/30 bg-yellow-500/5'
          )}
        >
          <Badge
            className={cn(
              'mt-0.5 shrink-0 text-[11px]',
              alert.severity === 'critical'
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            )}
          >
            {alert.severity.toUpperCase()}
          </Badge>
          <div className="min-w-0">
            <span className="font-mono text-xs text-zinc-400">{alert.code}</span>
            <p className="text-zinc-200">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function CircuitBreakersGrid({ data }: { data: CircuitBreakers }) {
  const agents = Object.entries(data.by_agent)
  if (agents.length === 0) return <p className="text-sm text-zinc-500">No circuit breaker data.</p>

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map(([agent, info]) => (
        <Card key={agent} className={cn('border-l-4', statusBorder(info.current_state))}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{formatName(agent)}</span>
              <Badge className={cn('text-[11px]', statusBg(info.current_state))}>{info.current_state.toUpperCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-zinc-500">Recent failures</dt>
              <dd className="text-right font-mono">{info.recent_failures}</dd>
              {info.last_reason && (
                <>
                  <dt className="text-zinc-500">Last reason</dt>
                  <dd className="col-span-2 mt-1 truncate text-zinc-400">{info.last_reason}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LatencyStatsTable({ data }: { data: LatencyStats }) {
  const stages = Object.entries(data.stages)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Stage</th>
              <th className="px-4 py-2 text-right font-medium">Avg</th>
              <th className="px-4 py-2 text-right font-medium">P50</th>
              <th className="px-4 py-2 text-right font-medium">P95</th>
              <th className="px-4 py-2 text-right font-medium">P99</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {stages.map(([name, s]) => {
              const highlight = s.p95_ms > 1000
              return (
                <tr key={name} className={highlight ? 'bg-yellow-500/5' : ''}>
                  <td className="px-4 py-2 font-medium">{formatName(name)}</td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-300">{Math.round(s.avg_ms)} ms</td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-300">{Math.round(s.p50_ms)} ms</td>
                  <td className={cn('px-4 py-2 text-right font-mono', highlight ? 'text-yellow-400 font-semibold' : 'text-zinc-300')}>
                    {Math.round(s.p95_ms)} ms
                  </td>
                  <td className={cn('px-4 py-2 text-right font-mono', s.p99_ms > 1000 ? 'text-red-400 font-semibold' : 'text-zinc-300')}>
                    {Math.round(s.p99_ms)} ms
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {data.bottlenecks && data.bottlenecks.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Bottlenecks</h4>
          <div className="flex flex-wrap gap-2">
            {data.bottlenecks.map((b) => (
              <Badge key={b.stage} className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">
                {formatName(b.stage)} -- P95: {Math.round(b.p95_ms)} ms
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TopSessionsTable({ overview }: { overview: SystemOverview }) {
  const sessions = overview.top_sessions.slice(0, 5)
  if (sessions.length === 0) return <p className="text-sm text-zinc-500">No session data.</p>

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500">
          <tr>
            <th className="px-4 py-2 font-medium">Session</th>
            <th className="px-4 py-2 text-right font-medium">Cost</th>
            <th className="px-4 py-2 text-right font-medium">Tokens</th>
            <th className="px-4 py-2 text-right font-medium">Calls</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {sessions.map((s) => (
            <tr key={s.session_id}>
              <td className="px-4 py-2 font-mono text-xs text-zinc-300">{truncate(s.session_id, 20)}</td>
              <td className="px-4 py-2 text-right font-mono text-zinc-300">{formatCost(s.cost_usd)}</td>
              <td className="px-4 py-2 text-right font-mono text-zinc-300">{formatTokens(s.tokens)}</td>
              <td className="px-4 py-2 text-right font-mono text-zinc-300">{s.calls}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-zinc-200">{children}</h2>
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SystemPage() {
  // Fetch all data in parallel, each independently fallible
  const [healthResult, alertsResult, circuitResult, latencyResult, overviewResult] = await Promise.allSettled([
    getHealthDeep(),
    getHealthAlerts(),
    getCircuitBreakers(),
    getLatencyStats(),
    getOverview(),
  ])

  const health = healthResult.status === 'fulfilled' ? healthResult.value : null
  const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value : null
  const circuits = circuitResult.status === 'fulfilled' ? circuitResult.value : null
  const latency = latencyResult.status === 'fulfilled' ? latencyResult.value : null
  const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">System Health</h1>

      {/* Overall Status Banner */}
      {health ? <OverallBanner health={health} /> : <Unavailable label="Overall Status" />}

      {/* Component Health Grid */}
      <section className="space-y-3">
        <SectionTitle>Component Health</SectionTitle>
        {health ? <ComponentHealthGrid checks={health.checks} /> : <Unavailable label="Component Health" />}
      </section>

      {/* Active Alerts */}
      <section className="space-y-3">
        <SectionTitle>Active Alerts</SectionTitle>
        {alerts ? <AlertsList data={alerts} /> : <Unavailable label="Alerts" />}
      </section>

      {/* Circuit Breakers */}
      <section className="space-y-3">
        <SectionTitle>Circuit Breakers</SectionTitle>
        {circuits ? <CircuitBreakersGrid data={circuits} /> : <Unavailable label="Circuit Breakers" />}
      </section>

      {/* Latency Stats */}
      <section className="space-y-3">
        <SectionTitle>Latency Stats</SectionTitle>
        {latency ? <LatencyStatsTable data={latency} /> : <Unavailable label="Latency Stats" />}
      </section>

      {/* Top Sessions by Cost */}
      <section className="space-y-3">
        <SectionTitle>Top Sessions by Cost</SectionTitle>
        {overview ? <TopSessionsTable overview={overview} /> : <Unavailable label="Top Sessions" />}
      </section>
    </div>
  )
}
