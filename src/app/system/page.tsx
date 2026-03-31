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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '...' : s
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function OverallStatus({ health }: { health: HealthCheck }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
      <span className={cn('h-2 w-2 rounded-full', statusDot(health.status))} />
      <span className="text-[13px] font-medium text-foreground">
        {statusLabel(health.status)}
      </span>
      <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
        {new Date(health.timestamp).toLocaleString()}
      </span>
    </div>
  )
}

function ComponentList({ checks }: { checks: HealthCheck['checks'] }) {
  const entries = Object.entries(checks)
  if (entries.length === 0) return null

  return (
    <div>
      {entries.map(([name, check]) => (
        <div key={name} className="flex items-center gap-4 px-6 py-3 border-b border-border">
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusDot(check.status))} />
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
        <div key={`${alert.code}-${i}`} className="flex items-start gap-3 px-6 py-3 border-b border-border">
          <span className={cn(
            'mt-0.5 h-1.5 w-1.5 rounded-full shrink-0',
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
  const agents = Object.entries(data.by_agent)
  if (agents.length === 0) return null

  return (
    <div>
      {agents.map(([agent, info]) => (
        <div key={agent} className="flex items-center gap-4 px-6 py-3 border-b border-border">
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusDot(info.current_state))} />
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
          <div key={name} className="flex items-center gap-4 px-6 py-2.5 border-b border-border">
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
        <div key={s.session_id} className="flex items-center gap-4 px-6 py-2.5 border-b border-border">
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
    <div className="flex items-center px-6 py-3 border-b border-border bg-[#fafafa]">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {children}
      </span>
    </div>
  )
}

function Unavailable({ label }: { label: string }) {
  return (
    <div className="px-6 py-3 text-[13px] text-muted-foreground border-b border-border">
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
      <div className="flex h-12 shrink-0 items-center border-b border-border px-6">
        <h1 className="text-[13px] font-medium text-foreground">System</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Overall Status */}
        {health ? <OverallStatus health={health} /> : <Unavailable label="Status" />}

        {/* Components */}
        <SectionHeader>Components</SectionHeader>
        {health ? <ComponentList checks={health.checks} /> : <Unavailable label="Components" />}

        {/* Alerts */}
        <SectionHeader>Alerts</SectionHeader>
        {alerts ? <AlertsList data={alerts} /> : <Unavailable label="Alerts" />}

        {/* Circuit Breakers */}
        <SectionHeader>Circuit Breakers</SectionHeader>
        {circuits ? <CircuitBreakersList data={circuits} /> : <Unavailable label="Circuit Breakers" />}

        {/* Latency */}
        <SectionHeader>Latency</SectionHeader>
        {latency ? <LatencyTable data={latency} /> : <Unavailable label="Latency" />}

        {/* Top Sessions */}
        <SectionHeader>Top Sessions</SectionHeader>
        {overview ? <TopSessions overview={overview} /> : <Unavailable label="Sessions" />}
      </div>
    </div>
  )
}
