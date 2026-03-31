import Link from 'next/link'
import { getCallTranscript, getSessionHistory } from '@/lib/api'
import { formatDuration } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TranscriptView } from '@/components/calls/transcript-view'

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ callSid: string }>
}) {
  const { callSid } = await params

  const detail = await getCallTranscript(callSid)

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-zinc-500">Call not found or backend unavailable</p>
        <a href="/calls" className="text-sm text-blue-400 hover:underline">Back to Calls</a>
      </div>
    )
  }

  // Fetch session history for facts/summary (non-critical)
  let history: Awaited<ReturnType<typeof getSessionHistory>> | null = null
  if (detail.session_id) {
    history = await getSessionHistory(detail.session_id).catch(() => null)
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
        {detail.is_active && (
          <Link
            href={`/calls/${callSid}/live`}
            className="text-xs text-green-400 hover:underline ml-auto"
          >
            View Live
          </Link>
        )}
      </div>

      {/* Transcript (primary content) */}
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto">
          <TranscriptView turns={detail.turns} />
        </CardContent>
      </Card>

      {/* Call metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
  )
}
