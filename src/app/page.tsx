import Link from "next/link"
import {
  getLatencyStats,
  getHealthDeep,
  getHealthAlerts,
  getOverview,
  getLatencyCalls,
} from "@/lib/api"
import type {
  LatencyStats,
  HealthCheck,
  HealthAlerts,
  SystemOverview,
  LatencyCall,
} from "@/lib/types"
import { formatCost, formatDuration, statusColor } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function healthBadgeVariant(status: string): "default" | "destructive" | "secondary" {
  const s = status.toLowerCase()
  if (["healthy", "ok", "up"].includes(s)) return "default"
  if (["unhealthy", "critical", "down"].includes(s)) return "destructive"
  return "secondary"
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  // Fetch all data concurrently, each with independent error handling
  const [latencyStats, health, alerts, overview, calls] = await Promise.all([
    getLatencyStats().catch(() => null),
    getHealthDeep().catch(() => null),
    getHealthAlerts().catch(() => null),
    getOverview().catch(() => null),
    getLatencyCalls().catch(() => null),
  ]) as [
    LatencyStats | null,
    HealthCheck | null,
    HealthAlerts | null,
    SystemOverview | null,
    LatencyCall[] | null,
  ]

  const activeCalls = calls?.filter((c) => c.is_active) ?? []

  // Extract latency stage metrics (safe access)
  const totalTurn = latencyStats?.stages?.["total_turn"] ?? null
  const stt = latencyStats?.stages?.["stt"] ?? null
  const agent = latencyStats?.stages?.["agent"] ?? null
  const tts = latencyStats?.stages?.["tts"] ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
        Dashboard
      </h1>

      {/* ── Top metric cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Calls */}
        <Card className="bg-zinc-900 ring-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-500">Active Calls</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">
              {latencyStats !== null ? latencyStats.active_calls : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              {latencyStats !== null
                ? `${latencyStats.total_calls} total`
                : "Unavailable"}
            </p>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-zinc-900 ring-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-500">System Health</CardDescription>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              {health !== null ? (
                <>
                  <span className={cn("text-xl font-semibold capitalize", statusColor(health.status))}>
                    {health.status}
                  </span>
                  <span
                    className={cn(
                      badgeVariants({ variant: healthBadgeVariant(health.status) }),
                      "text-[10px] uppercase"
                    )}
                  >
                    {health.status}
                  </span>
                </>
              ) : (
                <span className="text-zinc-500">--</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              {health !== null
                ? `${Object.keys(health.checks).length} checks`
                : "Unavailable"}
            </p>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="bg-zinc-900 ring-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-500">Active Alerts</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">
              {alerts !== null ? alerts.alerts.length : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts !== null && alerts.alerts.length > 0 ? (
              <div className="flex items-center gap-2 text-xs">
                {alerts.alerts.filter((a) => a.severity === "critical").length > 0 && (
                  <span className="text-red-400">
                    {alerts.alerts.filter((a) => a.severity === "critical").length} critical
                  </span>
                )}
                {alerts.alerts.filter((a) => a.severity === "warning").length > 0 && (
                  <span className="text-yellow-400">
                    {alerts.alerts.filter((a) => a.severity === "warning").length} warning
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                {alerts !== null ? "All clear" : "Unavailable"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="bg-zinc-900 ring-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-500">Total Cost</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">
              {overview !== null ? formatCost(overview.total_cost_usd) : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              {overview !== null
                ? `${overview.total_calls} LLM calls`
                : "Unavailable"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Latency overview ─────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-lg font-medium text-zinc-300">Latency Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <LatencyCard label="Total Turn" stats={totalTurn} />
          <LatencyCard label="STT" stats={stt} />
          <LatencyCard label="Agent" stats={agent} />
          <LatencyCard label="TTS" stats={tts} />
        </div>
      </div>

      {/* ── Active calls list ────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-lg font-medium text-zinc-300">Active Calls</h2>
        {calls === null ? (
          <Card className="bg-zinc-900 ring-zinc-800">
            <CardContent className="py-8 text-center text-sm text-zinc-500">
              Unable to fetch call data
            </CardContent>
          </Card>
        ) : activeCalls.length === 0 ? (
          <Card className="bg-zinc-900 ring-zinc-800">
            <CardContent className="py-8 text-center text-sm text-zinc-500">
              No active calls
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCalls.map((call) => (
              <Card key={call.call_sid} className="bg-zinc-900 ring-zinc-800">
                <CardHeader>
                  <CardDescription className="truncate font-mono text-xs text-zinc-500">
                    {call.call_sid}
                  </CardDescription>
                  <CardTitle className="truncate text-sm text-zinc-200">
                    {call.session_id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {call.turn_count} turn{call.turn_count !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/calls/${call.call_sid}`}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300"
                  >
                    View Live
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Latency Card sub-component
// ---------------------------------------------------------------------------

function LatencyCard({
  label,
  stats,
}: {
  label: string
  stats: { avg_ms: number; p50_ms: number; p95_ms: number; p99_ms: number; count: number } | null
}) {
  return (
    <Card size="sm" className="bg-zinc-900 ring-zinc-800">
      <CardHeader>
        <CardDescription className="text-zinc-500">{label}</CardDescription>
      </CardHeader>
      <CardContent>
        {stats !== null ? (
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">p50</p>
              <p className="font-medium text-zinc-200">{formatDuration(stats.p50_ms)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">p95</p>
              <p className="font-medium text-zinc-200">{formatDuration(stats.p95_ms)}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Unavailable</p>
        )}
      </CardContent>
    </Card>
  )
}
