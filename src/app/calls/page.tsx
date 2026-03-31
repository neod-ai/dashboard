'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import useSWR from 'swr'
import type { CallHistoryItem, CallHistoryResponse, TurnMetrics, TurnEvent, CallLatencyDetail, SessionHistory } from '@/lib/types'
import { formatDuration, formatTimestamp } from '@/lib/utils'
import { TranscriptStream } from '@/components/transcript-stream'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function turnEventToMetrics(event: TurnEvent, turnNumber: number): TurnMetrics {
  return {
    turn_number: event.turn_number ?? turnNumber,
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    transcript: event.transcript ?? '',
    response: event.response ?? '',
    stt_duration_ms: event.stt_duration_ms ?? 0,
    agent_duration_ms: event.agent_duration_ms ?? 0,
    tts_duration_ms: event.tts_duration_ms ?? 0,
    total_duration_ms: event.total_duration_ms ?? 0,
  }
}

export default function WorkspacePage() {
  const [selectedCallSid, setSelectedCallSid] = useState<string | null>(null)
  const [liveTurns, setLiveTurns] = useState<TurnMetrics[]>([])
  const [sseStatus, setSseStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected')
  const eventSourceRef = useRef<EventSource | null>(null)
  const unmountedRef = useRef(false)

  // Fetch call list (poll faster when there are active calls)
  const { data: history } = useSWR<CallHistoryResponse>(
    '/api/proxy/v1/obs/calls/history?offset=0&limit=50',
    fetcher,
    { refreshInterval: 3000 }
  )

  const calls = history?.calls ?? []
  const activeCalls = calls.filter((c) => c.is_active)
  const recentCalls = calls.filter((c) => !c.is_active)
  const selectedCall = calls.find((c) => c.call_sid === selectedCallSid) ?? null
  const isLive = selectedCall?.is_active ?? false

  // Fetch static transcript for completed calls
  const { data: staticDetail } = useSWR<CallLatencyDetail>(
    selectedCallSid && !isLive ? `/api/proxy/v1/obs/calls/${selectedCallSid}/transcript` : null,
    fetcher,
  )

  // Fetch session history (facts + summary) for completed calls
  const sessionId = isLive ? null : (staticDetail?.session_id ?? selectedCall?.session_id ?? null)
  const { data: sessionHistory } = useSWR<SessionHistory>(
    sessionId ? `/api/proxy/v1/sessions/${sessionId}/history` : null,
    fetcher,
  )

  // Fetch/poll turns for live calls (SSE + polling fallback)
  const { data: liveBackfill } = useSWR<CallLatencyDetail>(
    selectedCallSid && isLive ? `/api/proxy/v1/obs/latency/call/${selectedCallSid}` : null,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: false }
  )

  // Keep live turns in sync with polled data
  useEffect(() => {
    if (liveBackfill?.turns && liveBackfill.turns.length > 0) {
      setLiveTurns((prev) => {
        // Merge: use polled data if it has more turns than current state
        if (liveBackfill.turns.length > prev.length) {
          return liveBackfill.turns
        }
        return prev
      })
    }
  }, [liveBackfill])

  // SSE for live calls
  const connectSSE = useCallback(() => {
    if (!selectedCallSid || !isLive) return
    const es = new EventSource(`/api/stream/turns?call_sid=${selectedCallSid}`)
    eventSourceRef.current = es

    es.onopen = () => setSseStatus('connected')
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TurnEvent
        if (data.event_type === 'turn_metrics') {
          setLiveTurns((prev) => {
            const turnNum = data.turn_number ?? prev.length + 1
            if (prev.some((t) => t.turn_number === turnNum)) {
              return prev.map((t) => t.turn_number === turnNum ? turnEventToMetrics(data, turnNum) : t)
            }
            return [...prev, turnEventToMetrics(data, turnNum)]
          })
        }
      } catch { /* ignore */ }
    }
    es.onerror = () => {
      setSseStatus('reconnecting')
      es.close()
      setTimeout(() => { if (!unmountedRef.current) connectSSE() }, 3000)
    }
    return () => { es.close() }
  }, [selectedCallSid, isLive])

  useEffect(() => {
    unmountedRef.current = false
    const cleanup = connectSSE()
    return () => {
      unmountedRef.current = true
      cleanup?.()
      eventSourceRef.current?.close()
    }
  }, [connectSSE])

  // Reset live state when changing calls
  useEffect(() => {
    setLiveTurns([])
    setSseStatus('disconnected')
    eventSourceRef.current?.close()
  }, [selectedCallSid])

  // Auto-select first active call, or first recent call
  useEffect(() => {
    if (!selectedCallSid && calls.length > 0) {
      setSelectedCallSid(activeCalls.length > 0 ? activeCalls[0].call_sid : calls[0].call_sid)
    }
  }, [activeCalls, calls, selectedCallSid])

  const turns = isLive ? liveTurns : (staticDetail?.turns ?? [])
  const facts = sessionHistory?.facts ?? null
  const summary = sessionHistory?.summary ?? null
  const hasFacts = facts && Object.keys(facts).length > 0

  return (
    <div className="flex h-full">
      {/* LEFT — Call List */}
      <div className="flex w-[280px] shrink-0 flex-col border-r border-border">
        <div className="flex h-12 items-center border-b border-border px-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Calls
          </span>
          {activeCalls.length > 0 && (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] tabular-nums text-muted-foreground">{activeCalls.length}</span>
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeCalls.length > 0 && (
            <div>
              {activeCalls.map((call) => (
                <CallRow
                  key={call.call_sid}
                  call={call}
                  isSelected={call.call_sid === selectedCallSid}
                  onSelect={() => setSelectedCallSid(call.call_sid)}
                />
              ))}
              <div className="border-b border-border" />
            </div>
          )}

          {recentCalls.map((call) => (
            <CallRow
              key={call.call_sid}
              call={call}
              isSelected={call.call_sid === selectedCallSid}
              onSelect={() => setSelectedCallSid(call.call_sid)}
            />
          ))}

          {calls.length === 0 && (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              No calls yet
            </div>
          )}
        </div>
      </div>

      {/* CENTER — Transcript Stream */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex h-12 items-center border-b border-border px-6">
          {selectedCall ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-foreground">Transcript</span>
              {isLive && (
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    sseStatus === 'connected' ? 'bg-green-500' :
                    sseStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  <span className="text-[11px] text-muted-foreground">
                    {sseStatus === 'connected' ? 'Live' : sseStatus === 'reconnecting' ? 'Reconnecting' : 'Disconnected'}
                  </span>
                </span>
              )}
            </div>
          ) : (
            <span className="text-[13px] text-muted-foreground">Select a call</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedCall ? (
            <TranscriptStream turns={turns} autoScroll />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Select a call to view transcript
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Context Panel */}
      <div className="flex w-[280px] shrink-0 flex-col border-l border-border">
        <div className="flex h-12 items-center border-b border-border px-5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Details
          </span>
        </div>

        {selectedCall ? (
          <div className="flex-1 overflow-y-auto">
            {/* Facts — always visible, primary section */}
            <div className="border-b border-border">
              <div className="px-5 py-3 bg-[#fafafa]">
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
                  <p className="text-[12px] text-muted-foreground">
                    {isLive ? 'Facts will appear after the call ends' : 'No facts extracted for this call'}
                  </p>
                )}
              </div>
            </div>

            {/* Summary — always visible */}
            <div className="border-b border-border">
              <div className="px-5 py-3 bg-[#fafafa]">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Summary
                </span>
              </div>
              <div className="px-5 py-4">
                {summary ? (
                  <p className="text-[13px] leading-relaxed text-foreground">
                    {summary}
                  </p>
                ) : (
                  <p className="text-[12px] text-muted-foreground">
                    {isLive ? 'Summary will appear after the call ends' : 'No summary available'}
                  </p>
                )}
              </div>
            </div>

            {/* Call metadata */}
            <div className="border-b border-border">
              <div className="px-5 py-3 bg-[#fafafa]">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Call Info
                </span>
              </div>
              <div className="px-5 py-4">
                <dl className="flex flex-col gap-3">
                  <MetaField label="Status" value={
                    selectedCall.is_active ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span>Active</span>
                      </span>
                    ) : 'Completed'
                  } />
                  <MetaField label="Turns" value={
                    <span className="tabular-nums">{isLive ? turns.length : selectedCall.turn_count}</span>
                  } />
                  <MetaField label="Duration" value={
                    <span className="tabular-nums">
                      {selectedCall.duration_ms != null ? formatDuration(selectedCall.duration_ms) : '—'}
                    </span>
                  } />
                  <MetaField label="Started" value={formatTimestamp(selectedCall.start_time)} />
                  {selectedCall.end_time && (
                    <MetaField label="Ended" value={formatTimestamp(selectedCall.end_time!)} />
                  )}
                  <MetaField label="Call SID" value={
                    <span className="font-mono text-[11px] break-all">{selectedCall.call_sid}</span>
                  } />
                  {selectedCall.session_id && (
                    <MetaField label="Session" value={
                      <span className="font-mono text-[11px] break-all">{selectedCall.session_id}</span>
                    } />
                  )}
                </dl>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
            No call selected
          </div>
        )}
      </div>
    </div>
  )
}

function CallRow({ call, isSelected, onSelect }: {
  call: CallHistoryItem
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
        isSelected ? 'bg-[#f3f4f6]' : 'hover:bg-[#fafafa]'
      }`}
    >
      <div className="flex items-center gap-2">
        {call.is_active && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500 animate-pulse" />
        )}
        <span className="truncate text-[13px] text-foreground">
          {call.transcript_preview || call.call_sid.slice(0, 16) + '...'}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="tabular-nums">{formatTimestamp(call.start_time)}</span>
        <span className="text-border">·</span>
        <span className="tabular-nums">{call.turn_count} turns</span>
        {call.duration_ms != null && (
          <>
            <span className="text-border">·</span>
            <span className="tabular-nums">{formatDuration(call.duration_ms)}</span>
          </>
        )}
      </div>
    </button>
  )
}

function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-[13px] text-foreground">
        {value}
      </dd>
    </div>
  )
}
