'use client'

import { useEffect, useRef } from 'react'
import { User, Bot } from 'lucide-react'
import type { TurnMetrics } from '@/lib/types'
import { formatDuration } from '@/lib/utils'

interface TranscriptStreamProps {
  turns: TurnMetrics[]
  autoScroll?: boolean
  greeting?: string
}

const DEFAULT_GREETING = 'Hola, bienvenido a la Clinica MedAid. Soy Sofia, en que puedo ayudarte?'

export function TranscriptStream({
  turns,
  autoScroll = false,
  greeting = DEFAULT_GREETING,
}: TranscriptStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [turns.length, autoScroll])

  // Also scroll to bottom on initial load for completed calls
  useEffect(() => {
    if (!autoScroll && bottomRef.current && turns.length > 0) {
      // Small delay to ensure DOM is rendered
      const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
      return () => clearTimeout(t)
    }
  }, [turns.length > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  if (turns.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        No transcript data
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-6">
      {/* Agent greeting */}
      <AgentBubble text={greeting} />

      {turns.map((turn) => (
        <div key={turn.turn_number} className="flex flex-col gap-3 animate-[fade-in_0.3s_ease-out]">
          {turn.transcript && <UserBubble text={turn.transcript} />}
          {turn.response && (
            <AgentBubble text={turn.response} duration={turn.total_duration_ms} />
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 justify-start">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-5">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="max-w-[70%]">
        <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
          Caller
        </span>
        <div className="rounded-lg rounded-tl-sm border border-border bg-white px-4 py-2.5">
          <p className="text-sm leading-relaxed text-foreground">{text}</p>
        </div>
      </div>
    </div>
  )
}

function AgentBubble({ text, duration }: { text: string; duration?: number }) {
  return (
    <div className="flex items-start gap-2.5 justify-end">
      <div className="max-w-[70%]">
        <span className="mb-1 block text-right text-[11px] font-medium text-muted-foreground">
          Sofia
        </span>
        <div className="rounded-lg rounded-tr-sm bg-brand-50 px-4 py-2.5">
          <p className="text-sm leading-relaxed text-foreground">{text}</p>
        </div>
        {duration != null && duration > 0 && (
          <span className="mt-1 block text-right text-[10px] tabular-nums text-muted-foreground">
            {formatDuration(duration)}
          </span>
        )}
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-5">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
    </div>
  )
}
