// Active audio sessions
export interface AudioSession {
  call_sid: string
  stream_sid: string
  session_id: string
  sample_rate: number
  encoding: string
  packets_received: number
  bytes_received: number
  last_sequence: number
  is_active: boolean
}

// Latency call list item
export interface LatencyCall {
  call_sid: string
  session_id: string
  is_active: boolean
  start_time: string
  end_time: string | null
  duration_ms: number | null
  turn_count: number
}

// Turn metrics within a call
export interface TurnMetrics {
  turn_number: number
  start_time: string
  end_time: string
  transcript: string
  response: string
  stt_duration_ms: number
  agent_duration_ms: number
  tts_duration_ms: number
  total_duration_ms: number
}

// Full call latency detail
export interface CallLatencyDetail {
  call_sid: string
  session_id: string
  is_active: boolean
  start_time: string
  end_time: string | null
  turns: TurnMetrics[]
  stages: Record<
    string,
    { count: number; total_ms: number; avg_ms: number; min_ms: number; max_ms: number }
  >
}

// Call latency summary (p50/p95/p99)
export interface CallLatencySummary {
  call_sid: string
  session_id: string
  turn_count: number
  stages: Record<
    string,
    { avg_ms: number; p50_ms: number; p95_ms: number; p99_ms: number; count: number }
  >
  turns: TurnMetrics[]
}

// System-wide latency stats
export interface LatencyStats {
  total_calls: number
  active_calls: number
  stages: Record<
    string,
    { avg_ms: number; p50_ms: number; p95_ms: number; p99_ms: number; count: number }
  >
  bottlenecks: Array<{ stage: string; avg_ms: number; p95_ms: number; count: number }>
}

// Observability session
export interface ObsSession {
  session_id: string
  call_count?: number
}

// LLM call record
export interface LLMCall {
  call_id: string
  session_id: string
  request_id: string
  endpoint: string
  purpose: string
  model: string
  started_at_ms: number
  latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
}

// Cost breakdown
export interface CostBreakdown {
  session_id: string
  total_cost_usd: number
  total_tokens: number
  by_model: Record<string, { cost_usd: number; tokens: number; calls: number }>
  by_purpose: Record<string, { cost_usd: number; tokens: number; calls: number }>
}

// System overview
export interface SystemOverview {
  total_cost_usd: number
  total_tokens: number
  total_calls: number
  top_sessions: Array<{
    session_id: string
    cost_usd: number
    tokens: number
    calls: number
  }>
}

// Health check
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: Record<
    string,
    {
      status: 'up' | 'degraded' | 'down'
      latency_ms?: number
      circuit_state?: string
      details?: Record<string, unknown>
    }
  >
}

// Health alerts
export interface HealthAlerts {
  status: 'ok' | 'warning' | 'critical'
  generated_at: string
  alerts: Array<{
    severity: 'critical' | 'warning'
    code: string
    message: string
    sub_agent?: string
  }>
  signals: {
    turn_latency_p99_ms: number
    active_calls: number
    redis_latency_ms: number
    overall_health: string
  }
}

// Circuit breakers
export interface CircuitBreakers {
  enabled: boolean
  events_total: number
  current_state_totals: Record<string, number>
  by_agent: Record<
    string,
    {
      current_state: string
      last_transition_ms: number
      transitions_total: number
      last_reason: string
      recent_failures: number
    }
  >
}

// Session history
export interface SessionHistory {
  session_id: string
  messages: Array<{
    role: 'human' | 'ai' | 'system' | 'tool'
    content: string
    tool_calls?: unknown[]
    tool_call_id?: string
  }>
  facts: Record<string, unknown>
  summary: string
  turn_count: number
}

// SSE turn event (from Redis Stream)
export interface TurnEvent {
  event_type: 'turn_metrics' | 'call_summary'
  call_sid: string
  session_id: string
  turn_number?: number
  total_duration_ms?: number
  stt_duration_ms?: number
  agent_duration_ms?: number
  tts_duration_ms?: number
  transcript?: string
  response?: string
}
