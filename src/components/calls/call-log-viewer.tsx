'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import type { CallLogsResponse, CallLogEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ServiceFilter = 'all' | 'telephony-edge' | 'central_agent'
type LevelFilter = 'all' | 'INFO' | 'WARN' | 'ERROR'

const SERVICE_COLORS: Record<string, string> = {
  'telephony-edge': 'bg-blue-50 text-blue-700 border-blue-200',
  'central_agent': 'bg-purple-50 text-purple-700 border-purple-200',
}

const LEVEL_COLORS: Record<string, string> = {
  'DEBUG': 'text-muted-foreground',
  'INFO': 'text-foreground',
  'WARN': 'text-yellow-700',
  'ERROR': 'text-red-600 font-medium',
}

const LEVEL_BADGE_COLORS: Record<string, string> = {
  'DEBUG': 'bg-muted text-muted-foreground',
  'INFO': 'bg-muted text-muted-foreground',
  'WARN': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'ERROR': 'bg-red-50 text-red-600 border-red-200',
}

function formatLogTime(iso: string): string {
  try {
    const d = new Date(iso)
    const hh = String(d.getUTCHours()).padStart(2, '0')
    const mm = String(d.getUTCMinutes()).padStart(2, '0')
    const ss = String(d.getUTCSeconds()).padStart(2, '0')
    const ms = String(d.getUTCMilliseconds()).padStart(3, '0')
    return `${hh}:${mm}:${ss}.${ms}`
  } catch {
    return iso
  }
}

interface CallLogViewerProps {
  callSid: string
  isActive: boolean
}

export function CallLogViewer({ callSid, isActive }: CallLogViewerProps) {
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useSWR<CallLogsResponse>(
    `/api/proxy/v1/obs/calls/${callSid}/logs`,
    fetcher,
    {
      refreshInterval: isActive ? 5000 : 0,
      revalidateOnFocus: false,
    }
  )

  const allLogs = data?.logs ?? []

  const filtered = allLogs.filter((entry) => {
    if (serviceFilter !== 'all' && entry.service !== serviceFilter) return false
    if (levelFilter !== 'all' && entry.level !== levelFilter) return false
    return true
  })

  // Auto-scroll on new logs for active calls
  useEffect(() => {
    if (isActive && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [filtered.length, isActive])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Loading logs...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-2.5">
        {/* Service filter */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Source</span>
          {(['all', 'telephony-edge', 'central_agent'] as ServiceFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => setServiceFilter(v)}
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                serviceFilter === v
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {v === 'all' ? 'All' : v === 'telephony-edge' ? 'Edge' : 'Agent'}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Level filter */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Level</span>
          {(['all', 'INFO', 'WARN', 'ERROR'] as LevelFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => setLevelFilter(v)}
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                levelFilter === v
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {v === 'all' ? 'All' : v}
            </button>
          ))}
        </div>

        <div className="ml-auto text-[11px] tabular-nums text-muted-foreground">
          {filtered.length}/{allLogs.length} entries
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            {allLogs.length === 0 ? 'No logs available for this call' : 'No logs match the current filters'}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((entry) => (
              <LogRow key={`${entry.timestamp}-${entry.service}-${entry.message.slice(0, 32)}`} entry={entry} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}

function LogRow({ entry }: { entry: CallLogEntry }) {
  return (
    <div className="flex items-start gap-2 px-5 py-1.5 hover:bg-muted/30 transition-colors">
      {/* Timestamp */}
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground pt-px">
        {formatLogTime(entry.timestamp)}
      </span>

      {/* Service badge */}
      <span
        className={cn(
          'shrink-0 rounded border px-1.5 py-px text-[10px] font-medium',
          SERVICE_COLORS[entry.service] ?? 'bg-muted text-muted-foreground'
        )}
      >
        {entry.service === 'telephony-edge' ? 'edge' : 'agent'}
      </span>

      {/* Level badge */}
      <span
        className={cn(
          'shrink-0 rounded border px-1 py-px text-[10px] font-medium',
          LEVEL_BADGE_COLORS[entry.level] ?? 'bg-muted text-muted-foreground'
        )}
      >
        {entry.level}
      </span>

      {/* Logger name */}
      {entry.logger && (
        <span className="shrink-0 text-[11px] text-muted-foreground/60 pt-px">
          {entry.logger.replace('agent_api.', '')}
        </span>
      )}

      {/* Message */}
      <span className={cn('font-mono text-[12px] leading-relaxed break-all min-w-0', LEVEL_COLORS[entry.level])}>
        {entry.message}
      </span>
    </div>
  )
}
