import Link from 'next/link'
import { getCallTranscript, getSessionHistory } from '@/lib/api'
import { formatDuration } from '@/lib/utils'
import { TranscriptStream } from '@/components/transcript-stream'
import { MetaField } from '@/components/meta-field'

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ callSid: string }>
}) {
  const { callSid } = await params
  const detail = await getCallTranscript(callSid)

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Call not found or backend unavailable</p>
          <Link href="/calls" className="mt-2 block text-[12px] text-muted-foreground hover:text-foreground">
            Back to Calls
          </Link>
        </div>
      </div>
    )
  }

  let sessionHistory: Awaited<ReturnType<typeof getSessionHistory>> | null = null
  if (detail.session_id) {
    sessionHistory = await getSessionHistory(detail.session_id).catch(() => null)
  }

  const facts = sessionHistory?.facts ?? null
  const summary = sessionHistory?.summary ?? null
  const hasFacts = facts && Object.keys(facts).length > 0

  return (
    <div className="flex h-full">
      {/* Transcript */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex h-12 items-center border-b border-border px-6 gap-3">
          <Link href="/calls" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            Calls
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-[13px] font-medium text-foreground">
            {callSid.slice(0, 16)}...
          </span>
          {detail.is_active && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] text-muted-foreground">Active</span>
              </span>
              <Link
                href={`/calls/${callSid}/live`}
                className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
              >
                View live
              </Link>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <TranscriptStream turns={detail.turns} />
        </div>
      </div>

      {/* Details panel */}
      <div className="flex w-[280px] shrink-0 flex-col border-l border-border">
        <div className="flex h-12 items-center border-b border-border px-5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Details
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Facts — always visible */}
          <div className="border-b border-border">
            <div className="px-5 py-3 bg-muted">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Extracted Facts
              </span>
            </div>
            <div className="px-5 py-4">
              {hasFacts ? (
                <dl className="flex flex-col gap-3">
                  {Object.entries(facts!).map(([key, value]) => (
                    <MetaField
                      key={key}
                      label={key.replace(/_/g, ' ')}
                      value={typeof value === 'string' ? value : JSON.stringify(value)}
                    />
                  ))}
                </dl>
              ) : (
                <p className="text-[12px] text-muted-foreground">No facts extracted for this call</p>
              )}
            </div>
          </div>

          {/* Summary — always visible */}
          <div className="border-b border-border">
            <div className="px-5 py-3 bg-muted">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Summary
              </span>
            </div>
            <div className="px-5 py-4">
              {summary ? (
                <p className="text-[13px] leading-relaxed text-foreground">{summary}</p>
              ) : (
                <p className="text-[12px] text-muted-foreground">No summary available</p>
              )}
            </div>
          </div>

          {/* Call Info */}
          <div className="border-b border-border">
            <div className="px-5 py-3 bg-muted">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Call Info
              </span>
            </div>
            <div className="px-5 py-4">
              <dl className="flex flex-col gap-3">
                <MetaField label="Status" value={detail.is_active ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Active
                  </span>
                ) : 'Completed'} />
                <MetaField label="Turns" value={<span className="tabular-nums">{detail.turns.length}</span>} />
                <MetaField label="Started" value={new Date(detail.start_time).toLocaleString()} />
                {detail.end_time && (
                  <MetaField label="Ended" value={new Date(detail.end_time).toLocaleString()} />
                )}
                <MetaField label="Call SID" value={
                  <span className="font-mono text-[11px] break-all">{detail.call_sid}</span>
                } />
                <MetaField label="Session" value={
                  <span className="font-mono text-[11px] break-all">{detail.session_id}</span>
                } />
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

