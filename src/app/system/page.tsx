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
import { statusDot, statusLabel, formatName, VISIBLE_COMPONENTS } from '@/lib/status'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '...' : s
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (['healthy', 'up', 'ok', 'closed'].includes(s)) return 'bg-green-50 text-green-700 border-green-200'
  if (['degraded', 'warning', 'half_open', 'half-open'].includes(s)) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  if (['unhealthy', 'down', 'critical', 'open'].includes(s)) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function OverallStatus({ health }: { health: HealthCheck }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <Badge variant="outline" className={cn('text-xs font-medium', statusBadgeClass(health.status))}>
        <span className={cn('h-2 w-2 rounded-full', statusDot(health.status))} />
        {statusLabel(health.status)}
      </Badge>
      <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
        {new Date(health.timestamp).toLocaleString()}
      </span>
    </div>
  )
}

function ComponentList({ checks }: { checks: HealthCheck['checks'] }) {
  const entries = Object.entries(checks).filter(([name]) => VISIBLE_COMPONENTS.has(name))
  if (entries.length === 0) return null

  return (
    <div>
      {entries.map(([name, check]) => (
        <div key={name} className="flex items-center gap-4 px-6 py-3 border-b border-border last:border-b-0">
          <span className={cn('h-2 w-2 rounded-full shrink-0', statusDot(check.status))} />
          <span className="text-[13px] text-foreground flex-1">{formatName(name)}</span>
          {check.latency_ms != null && (
            <span className="text-[12px] font-mono tabular-nums text-muted-foreground">
              {Math.round(check.latency_ms)} ms
            </span>
          )}
          <span className="text-[11px] text-muted-foreground w-[72px] text-right">
            {statusLabel(check.status)}
          </span>
        </div>
      ))}
    </div>
  )
}

function AlertsList({ data }: { data: HealthAlerts }) {
  if (data.alerts.length === 0) {
    return (
      <div className="px-6 py-3 text-[13px] text-muted-foreground">
        No active alerts
      </div>
    )
  }

  return (
    <div>
      {data.alerts.map((alert, i) => (
        <div key={`${alert.code}-${i}`} className="flex items-start gap-3 px-6 py-3 border-b border-border last:border-b-0">
          <span className={cn(
            'mt-0.5 h-2 w-2 rounded-full shrink-0',
            alert.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
          )} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {alert.severity}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">{alert.code}</span>
            </div>
            <p className="mt-0.5 text-[13px] text-foreground">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function CircuitBreakersList({ data }: { data: CircuitBreakers }) {
  const agents = Object.entries(data.by_agent).filter(([name]) => VISIBLE_COMPONENTS.has(name))
  if (agents.length === 0) return null

  return (
    <div>
      {agents.map(([agent, info]) => (
        <div key={agent} className="flex items-center gap-4 px-6 py-3 border-b border-border last:border-b-0">
          <span className={cn('h-2 w-2 rounded-full shrink-0', statusDot(info.current_state))} />
          <span className="text-[13px] text-foreground flex-1">{formatName(agent)}</span>
          <span className="text-[12px] font-mono tabular-nums text-muted-foreground">
            {info.recent_failures} failures
          </span>
          <span className="text-[11px] text-muted-foreground w-[72px] text-right">
            {info.current_state}
          </span>
        </div>
      ))}
    </div>
  )
}

function LatencyTable({ data }: { data: LatencyStats }) {
  const stages = Object.entries(data.stages ?? {})

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border">
        <span className="flex-1">Stage</span>
        <span className="w-[64px] text-right">Avg</span>
        <span className="w-[64px] text-right">P50</span>
        <span className="w-[64px] text-right">P95</span>
        <span className="w-[64px] text-right">P99</span>
      </div>

      {stages.map(([name, s]) => {
        const warn = s.p95_ms > 1000
        const crit = s.p99_ms > 1000
        return (
          <div key={name} className="flex items-center gap-4 px-6 py-2.5 border-b border-border last:border-b-0">
            <span className="text-[13px] text-foreground flex-1">{formatName(name)}</span>
            <span className="w-[64px] text-right font-mono text-[12px] tabular-nums text-muted-foreground">
              {Math.round(s.avg_ms)} ms
            </span>
            <span className="w-[64px] text-right font-mono text-[12px] tabular-nums text-muted-foreground">
              {Math.round(s.p50_ms)} ms
            </span>
            <span className={cn(
              'w-[64px] text-right font-mono text-[12px] tabular-nums',
              warn ? 'text-yellow-600 font-medium' : 'text-muted-foreground'
            )}>
              {Math.round(s.p95_ms)} ms
            </span>
            <span className={cn(
              'w-[64px] text-right font-mono text-[12px] tabular-nums',
              crit ? 'text-red-600 font-medium' : 'text-muted-foreground'
            )}>
              {Math.round(s.p99_ms)} ms
            </span>
          </div>
        )
      })}
    </div>
  )
}

function TopSessions({ overview }: { overview: SystemOverview }) {
  const sessions = overview.top_sessions.slice(0, 5)
  if (sessions.length === 0) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border">
        <span className="flex-1">Session</span>
        <span className="w-[72px] text-right">Cost</span>
        <span className="w-[72px] text-right">Tokens</span>
        <span className="w-[48px] text-right">Calls</span>
      </div>

      {sessions.map((s) => (
        <div key={s.session_id} className="flex items-center gap-4 px-6 py-2.5 border-b border-border last:border-b-0">
          <span className="flex-1 font-mono text-[11px] text-foreground truncate">
            {truncate(s.session_id, 24)}
          </span>
          <span className="w-[72px] text-right font-mono text-[12px] tabular-nums text-muted-foreground">
            {formatCost(s.total_cost_usd ?? s.cost_usd ?? 0)}
          </span>
          <span className="w-[72px] text-right font-mono text-[12px] tabular-nums text-muted-foreground">
            {formatTokens(s.total_tokens ?? s.tokens ?? 0)}
          </span>
          <span className="w-[48px] text-right font-mono text-[12px] tabular-nums text-muted-foreground">
            {s.num_calls ?? s.calls ?? 0}
          </span>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center px-6 py-3 border-b border-border bg-muted">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {children}
      </span>
    </div>
  )
}

function Unavailable({ label }: { label: string }) {
  return (
    <div className="px-6 py-3 text-[13px] text-muted-foreground">
      {label} — unavailable
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SystemPage() {
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center border-b border-border bg-white px-6">
        <h1 className="text-[13px] font-medium text-foreground">System</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Overall Status */}
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-border overflow-hidden">
          {health ? <OverallStatus health={health} /> : <Unavailable label="Status" />}
        </div>

        {/* Components */}
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-border overflow-hidden">
          <SectionHeader>Components</SectionHeader>
          {health ? <ComponentList checks={health.checks} /> : <Unavailable label="Components" />}
        </div>

        {/* Alerts */}
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-border overflow-hidden">
          <SectionHeader>Alerts</SectionHeader>
          {alerts ? <AlertsList data={alerts} /> : <Unavailable label="Alerts" />}
        </div>

        {/* Circuit Breakers */}
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-border overflow-hidden">
          <SectionHeader>Circuit Breakers</SectionHeader>
          {circuits ? <CircuitBreakersList data={circuits} /> : <Unavailable label="Circuit Breakers" />}
        </div>

        {/* Latency */}
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-border overflow-hidden">
          <SectionHeader>Latency</SectionHeader>
          {latency ? <LatencyTable data={latency} /> : <Unavailable label="Latency" />}
        </div>

        {/* Top Sessions */}
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-border overflow-hidden">
          <SectionHeader>Top Sessions</SectionHeader>
          {overview ? <TopSessions overview={overview} /> : <Unavailable label="Sessions" />}
        </div>
      </div>
    </div>
  )
}
