'use client'

import { useEffect, useRef } from 'react'
import type { TurnMetrics } from '@/lib/types'
import { formatDuration } from '@/lib/utils'

interface TranscriptViewProps {
  turns: TurnMetrics[]
  autoScroll?: boolean
}

const GREETING = 'Hola, bienvenido a la Clinica MedAid. Soy Sofia, en que puedo ayudarte?'

export function TranscriptView({ turns, autoScroll = false }: TranscriptViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [turns.length, autoScroll])

  if (turns.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No transcript data available
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex flex-col gap-4 overflow-y-auto">
      {/* Agent greeting (turn 0 — before any user input) */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col items-end gap-1 self-end max-w-[80%]">
          <span className="px-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Agent
          </span>
          <div className="rounded-lg rounded-tr-sm bg-muted px-3.5 py-2.5 text-sm text-foreground">
            {GREETING}
          </div>
        </div>
      </div>

      {turns.map((turn) => (
        <div key={turn.turn_number} className="flex flex-col gap-2">
          {/* User message — left aligned */}
          {turn.transcript && (
            <div className="flex flex-col items-start gap-1 max-w-[80%]">
              <span className="px-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                User
              </span>
              <div className="rounded-lg rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm text-foreground">
                {turn.transcript}
              </div>
            </div>
          )}

          {/* Agent message — right aligned */}
          {turn.response && (
            <div className="flex flex-col items-end gap-1 self-end max-w-[80%]">
              <span className="px-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Agent
              </span>
              <div className="rounded-lg rounded-tr-sm bg-muted px-3.5 py-2.5 text-sm text-foreground">
                {turn.response}
              </div>
              <span className="px-1.5 text-[10px] tabular-nums text-muted-foreground">
                {formatDuration(turn.total_duration_ms)}
              </span>
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
