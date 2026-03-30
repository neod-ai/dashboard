import Link from 'next/link'
import { getCallLatency, getCallLatencySummary, getSessionHistory } from '@/lib/api'
import { formatDuration } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TranscriptView } from '@/components/calls/transcript-view'
import { LatencyChart } from '@/components/calls/latency-chart'

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ callSid: string }>
}) {
  const { callSid } = await params

  const detail = await getCallLatency(callSid)

  // Fetch summary and session history, but don't fail the page if they error
  let summary: Awaited<ReturnType<typeof getCallLatencySummary>> | null = null
  let history: Awaited<ReturnType<typeof getSessionHistory>> | null = null

  try {
    summary = await getCallLatencySummary(callSid)
  } catch {
    // Summary may not be available for all calls
  }

  try {
    if (detail.session_id) {
      history = await getSessionHistory(detail.session_id)
    }
  } catch {
    // Session history may not be available
  }

  const truncatedSid = callSid.slice(0, 16) + '...'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/calls"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Calls
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-semibold tracking-tight">
          Call {truncatedSid}
        </h1>
        {detail.is_active && (
          <Badge className="bg-green-900/50 text-green-400 border-green-800/50">
            Active
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transcript">
        <TabsList>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="latency">Latency</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Transcript tab */}
        <TabsContent value="transcript">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <TranscriptView turns={detail.turns} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Latency tab */}
        <TabsContent value="latency">
          <div className="mt-4 flex flex-col gap-4">
            {/* Summary card with p50/p95 */}
            {summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Latency Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Object.entries(summary.stages).map(([stage, stats]) => (
                      <div
                        key={stage}
                        className="flex flex-col gap-2 rounded-lg border border-zinc-800 p-4"
                      >
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          {stage}
                        </span>
                        <div className="flex items-baseline gap-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-600">p50</span>
                            <span className="text-lg font-semibold tabular-nums">
                              {formatDuration(stats.p50_ms)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-600">p95</span>
                            <span className="text-lg font-semibold tabular-nums text-yellow-500">
                              {formatDuration(stats.p95_ms)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-600">avg</span>
                            <span className="text-sm tabular-nums text-zinc-400">
                              {formatDuration(stats.avg_ms)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-600">
                          {stats.count} samples
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Per-turn stacked bar chart */}
            <Card>
              <CardHeader>
                <CardTitle>Per-Turn Latency Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-500" />
                    STT
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-violet-500" />
                    Agent
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    TTS
                  </span>
                </div>
                <LatencyChart turns={detail.turns} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details tab */}
        <TabsContent value="details">
          <div className="mt-4 flex flex-col gap-4">
            {/* Call metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Call Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Call SID
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs text-zinc-300 break-all">
                      {detail.call_sid}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Session ID
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs text-zinc-300 break-all">
                      {detail.session_id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Status
                    </dt>
                    <dd className="mt-0.5 text-sm">
                      {detail.is_active ? (
                        <span className="text-green-400">Active</span>
                      ) : (
                        <span className="text-zinc-400">Completed</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Turns
                    </dt>
                    <dd className="mt-0.5 text-sm tabular-nums">{detail.turns.length}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Start Time
                    </dt>
                    <dd className="mt-0.5 text-sm text-zinc-400">
                      {new Date(detail.start_time).toLocaleString()}
                    </dd>
                  </div>
                  {detail.end_time && (
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        End Time
                      </dt>
                      <dd className="mt-0.5 text-sm text-zinc-400">
                        {new Date(detail.end_time).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Facts from session history */}
            {history && history.facts && Object.keys(history.facts).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Facts</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Object.entries(history.facts).map(([key, value]) => (
                      <div key={key} className="flex flex-col rounded-md border border-zinc-800 p-3">
                        <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                          {key}
                        </dt>
                        <dd className="mt-0.5 text-sm text-zinc-300">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Session summary */}
            {history && history.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {history.summary}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
