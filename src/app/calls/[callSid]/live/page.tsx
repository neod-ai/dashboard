'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import type { TurnMetrics, TurnEvent, CallLatencyDetail } from '@/lib/types'
import { TranscriptStream } from '@/components/transcript-stream'

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

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

export default function LiveCallPage() {
  const { callSid } = useParams<{ callSid: string }>()
  const [turns, setTurns] = useState<TurnMetrics[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const eventSourceRef = useRef<EventSource | null>(null)
  const unmountedRef = useRef(false)

  // Poll turns as fallback (SSE may miss events)
  const { data: backfill } = useSWR<CallLatencyDetail>(
    callSid ? `/api/proxy/v1/obs/latency/call/${callSid}` : null,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: false }
  )

  // Keep turns in sync with polled data
  useEffect(() => {
    if (backfill?.turns && backfill.turns.length > 0) {
      setTurns((prev) => {
        if (backfill.turns.length > prev.length) {
          return backfill.turns
        }
        return prev
      })
    }
  }, [backfill])

  const connect = useCallback(() => {
    if (!callSid) return
    const es = new EventSource(`/api/stream/turns?call_sid=${callSid}`)
    eventSourceRef.current = es

    es.onopen = () => setStatus('connected')
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TurnEvent
        if (data.event_type === 'turn_metrics') {
          setTurns((prev) => {
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
      setStatus('reconnecting')
      es.close()
      setTimeout(() => { if (!unmountedRef.current) connect() }, 3000)
    }
    return () => { es.close() }
  }, [callSid])

  useEffect(() => {
    unmountedRef.current = false
    const cleanup = connect()
    return () => {
      unmountedRef.current = true
      cleanup?.()
      eventSourceRef.current?.close()
    }
  }, [connect])

  return (
    <div className="flex h-full">
      {/* Transcript */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex h-12 items-center border-b border-border px-6 gap-3">
          <Link href="/calls" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            Calls
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-[13px] font-medium text-foreground">Live</span>
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${
              status === 'connected' ? 'bg-green-500' :
              status === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-[11px] text-muted-foreground">
              {status === 'connected' ? 'Connected' : status === 'reconnecting' ? 'Reconnecting' : 'Disconnected'}
            </span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TranscriptStream turns={turns} autoScroll />
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
          <div className="p-5">
            <dl className="flex flex-col gap-4">
              <MetaField label="Status" value={
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active
                </span>
              } />
              <MetaField label="Turns" value={<span className="tabular-nums">{turns.length}</span>} />
              <MetaField label="Connection" value={<span className="capitalize">{status}</span>} />
            </dl>
          </div>

          {/* IDs */}
          <div className="border-t border-border p-5">
            <dl className="flex flex-col gap-3">
              <MetaField label="Call SID" value={
                <span className="font-mono text-[11px] break-all">{callSid}</span>
              } />
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-foreground">{value}</dd>
    </div>
  )
}
