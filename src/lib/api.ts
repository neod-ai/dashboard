import type {
  AudioSession,
  LatencyCall,
  CallLatencyDetail,
  CallLatencySummary,
  LatencyStats,
  ObsSession,
  LLMCall,
  CostBreakdown,
  SystemOverview,
  SessionHistory,
  HealthCheck,
  HealthAlerts,
  CircuitBreakers,
  CallHistoryResponse,
  CallLogsResponse,
} from './types'

const BASE_URL = process.env.CENTRAL_AGENT_URL || 'http://localhost:8000'

async function fetchApi<T>(path: string, revalidate?: number): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' }),
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

// --- Audio sessions ---

export function getAudioSessions(): Promise<AudioSession[] | null> {
  return fetchApi<AudioSession[]>('/v1/audio/sessions')
}

// --- Latency ---

// Response is { calls: [...], total_calls, active_calls }
export async function getLatencyCalls(): Promise<LatencyCall[] | null> {
  const data = await fetchApi<{ calls: LatencyCall[]; total_calls: number; active_calls: number }>('/v1/obs/latency/calls')
  return data?.calls ?? null
}

export function getCallLatency(callSid: string): Promise<CallLatencyDetail | null> {
  return fetchApi<CallLatencyDetail>(`/v1/obs/latency/call/${callSid}`)
}

export function getCallLatencySummary(callSid: string): Promise<CallLatencySummary | null> {
  return fetchApi<CallLatencySummary>(`/v1/obs/latency/call/${callSid}/summary`)
}

export function getLatencyStats(): Promise<LatencyStats | null> {
  return fetchApi<LatencyStats>('/v1/obs/latency/stats', 30)
}

// --- Observability ---

// Response is { enabled, sessions: [{ session_id }] }
export async function getObsSessions(): Promise<ObsSession[] | null> {
  const data = await fetchApi<{ enabled: boolean; sessions: string[] }>('/v1/obs/sessions')
  if (!data) return null
  return data.sessions.map(id => typeof id === 'string' ? { session_id: id } : id as unknown as ObsSession)
}

export function getObsSessionCalls(sessionId: string): Promise<LLMCall[] | null> {
  return fetchApi<LLMCall[]>(`/v1/obs/session/${sessionId}`)
}

export function getSessionCost(sessionId: string): Promise<CostBreakdown | null> {
  return fetchApi<CostBreakdown>(`/v1/obs/session/${sessionId}/cost`)
}

export function getOverview(): Promise<SystemOverview | null> {
  return fetchApi<SystemOverview>('/v1/obs/overview', 30)
}

// --- Session history ---

export function getSessionHistory(sessionId: string): Promise<SessionHistory | null> {
  return fetchApi<SessionHistory>(`/v1/sessions/${sessionId}/history`)
}

// --- Health ---

export function getHealthDeep(): Promise<HealthCheck | null> {
  return fetchApi<HealthCheck>('/health/deep')
}

export function getHealthAlerts(): Promise<HealthAlerts | null> {
  return fetchApi<HealthAlerts>('/health/alerts')
}

export function getCircuitBreakers(): Promise<CircuitBreakers | null> {
  return fetchApi<CircuitBreakers>('/v1/obs/subagents/circuit-breakers')
}

// --- Call transcript history (persistent) ---

export async function getCallHistory(offset = 0, limit = 50): Promise<CallHistoryResponse | null> {
  return fetchApi<CallHistoryResponse>(`/v1/obs/calls/history?offset=${offset}&limit=${limit}`)
}

export function getCallTranscript(callSid: string): Promise<CallLatencyDetail | null> {
  return fetchApi<CallLatencyDetail>(`/v1/obs/calls/${callSid}/transcript`)
}

export function getCallLogs(
  callSid: string,
  service?: string,
  level?: string,
): Promise<CallLogsResponse | null> {
  const params = new URLSearchParams()
  if (service) params.set('service', service)
  if (level) params.set('level', level)
  const qs = params.toString()
  return fetchApi<CallLogsResponse>(`/v1/obs/calls/${callSid}/logs${qs ? `?${qs}` : ''}`)
}
