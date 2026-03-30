'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import type { TurnMetrics, TurnEvent, CallLatencyDetail } from '@/lib/types'
import { TranscriptView } from '@/components/calls/transcript-view'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connected: 'bg-green-500',
  reconnecting: 'bg-yellow-500 animate-pulse',
  disconnected: 'bg-red-500',
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
}

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
  const backfillApplied = useRef(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const unmountedRef = useRef(false)

  // Backfill: fetch existing turns for this call
  const { data: backfill } = useSWR<CallLatencyDetail>(
    callSid ? `/api/proxy/v1/latency/calls/${callSid}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Apply backfill once
  useEffect(() => {
    if (backfill?.turns && !backfillApplied.current) {
      backfillApplied.current = true
      setTurns(backfill.turns)
    }
  }, [backfill])

  // SSE connection
  const connect = useCallback(() => {
    if (!callSid) return

    const es = new EventSource(`/api/stream/turns?call_sid=${callSid}`)
    eventSourceRef.current = es

    es.onopen = () => {
      setStatus('connected')
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TurnEvent
        if (data.event_type === 'turn_metrics') {
          setTurns((prev) => {
            const turnNum = data.turn_number ?? prev.length + 1
            // Avoid duplicates
            if (prev.some((t) => t.turn_number === turnNum)) {
              return prev.map((t) =>
                t.turn_number === turnNum ? turnEventToMetrics(data, turnNum) : t
              )
            }
            return [...prev, turnEventToMetrics(data, turnNum)]
          })
        }
      } catch {
        // Ignore malformed events
      }
    }

    es.onerror = () => {
      setStatus('reconnecting')
      es.close()
      // Reconnect after 3 seconds, but only if still mounted
      setTimeout(() => {
        if (!unmountedRef.current) connect()
      }, 3000)
    }

    return () => {
      es.close()
    }
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/calls"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Calls
          </Link>
          <span className="text-zinc-700">/</span>
          <Link
            href={`/calls/${callSid}`}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {callSid.slice(0, 12)}...
          </Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-xl font-semibold tracking-tight">Live</h1>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          <span className="text-xs text-zinc-400">{STATUS_LABEL[status]}</span>
        </div>
      </div>

      {/* Live transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Live Transcript
            {status === 'connected' && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100vh-240px)] overflow-y-auto">
          <TranscriptView turns={turns} autoScroll />
        </CardContent>
      </Card>
    </div>
  )
}
