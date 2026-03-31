'use client'

import type { TurnMetrics } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface LatencyChartProps {
  turns: TurnMetrics[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTooltip = (value: any): string => `${value}ms`

export function LatencyChart({ turns }: LatencyChartProps) {
  const data = turns.map((t) => ({
    turn: `#${t.turn_number}`,
    STT: Math.round(t.stt_duration_ms),
    Agent: Math.round(t.agent_duration_ms),
    TTS: Math.round(t.tts_duration_ms),
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No latency data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <XAxis
          dataKey="turn"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
          label={{
            value: 'ms',
            position: 'insideLeft',
            offset: 0,
            style: { fill: '#9ca3af', fontSize: 11 },
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 13,
          }}
          itemStyle={{ color: '#1f2937' }}
          labelStyle={{ color: '#6b7280', marginBottom: 4 }}
          formatter={formatTooltip}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Bar dataKey="STT" stackId="latency" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Agent" stackId="latency" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
        <Bar dataKey="TTS" stackId="latency" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
