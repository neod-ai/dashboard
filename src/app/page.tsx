import Link from "next/link"
import { getCallHistory } from "@/lib/api"
import type { CallHistoryResponse } from "@/lib/types"
import { formatDuration, formatTimestamp } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const history = await getCallHistory(0, 30).catch(() => null)

  const calls = history?.calls ?? []
  const activeCalls = calls.filter((c) => c.is_active)
  const recentCalls = calls.filter((c) => !c.is_active).slice(0, 15)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Dashboard
        </h1>
        {activeCalls.length > 0 && (
          <Badge className="bg-green-900/50 text-green-400 border-green-800/50">
            {activeCalls.length} active
          </Badge>
        )}
      </div>

      {/* Active Calls */}
      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-300">
          Active Calls
        </h2>
        {activeCalls.length === 0 ? (
          <Card className="bg-zinc-900 ring-zinc-800">
            <CardContent className="py-8 text-center text-sm text-zinc-500">
              No active calls
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCalls.map((call) => (
              <Link key={call.call_sid} href={`/calls/${call.call_sid}/live`}>
                <Card className="bg-zinc-900 ring-zinc-800 hover:ring-zinc-700 transition-all cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription className="truncate font-mono text-xs text-zinc-500">
                        {call.call_sid.slice(0, 16)}...
                      </CardDescription>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-green-400">Live</span>
                      </span>
                    </div>
                    <CardTitle className="text-sm text-zinc-200">
                      {call.turn_count} turn{call.turn_count !== 1 ? "s" : ""}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {call.transcript_preview && (
                      <div className="rounded bg-zinc-800/50 px-2.5 py-1.5 text-xs text-zinc-400">
                        <span className="text-zinc-500">User: </span>
                        {call.transcript_preview}
                      </div>
                    )}
                    {call.response_preview && (
                      <div className="rounded bg-indigo-900/30 px-2.5 py-1.5 text-xs text-zinc-400">
                        <span className="text-zinc-500">Agent: </span>
                        {call.response_preview}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Calls */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-zinc-300">Recent Calls</h2>
          <Link
            href="/calls"
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            View all
          </Link>
        </div>
        {recentCalls.length === 0 ? (
          <Card className="bg-zinc-900 ring-zinc-800">
            <CardContent className="py-8 text-center text-sm text-zinc-500">
              No call history yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentCalls.map((call) => (
              <Link key={call.call_sid} href={`/calls/${call.call_sid}`}>
                <Card className="bg-zinc-900 ring-zinc-800 hover:ring-zinc-700 transition-all cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-3">
                    {/* Timestamp */}
                    <span className="shrink-0 text-xs tabular-nums text-zinc-500 w-20">
                      {formatTimestamp(call.start_time)}
                    </span>

                    {/* Transcript preview */}
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
                      {call.transcript_preview || (
                        <span className="text-zinc-600 italic">No transcript</span>
                      )}
                    </span>

                    {/* Meta */}
                    <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                      {call.turn_count} turn{call.turn_count !== 1 ? "s" : ""}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-zinc-500 w-16 text-right">
                      {call.duration_ms != null
                        ? formatDuration(call.duration_ms)
                        : "\u2014"}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
