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
  return fetchApi<AudioSession[]>('/debug/audio/sessions')
}

// --- Latency ---

export function getLatencyCalls(): Promise<LatencyCall[] | null> {
  return fetchApi<LatencyCall[]>('/v1/latency/calls')
}

export function getCallLatency(callSid: string): Promise<CallLatencyDetail | null> {
  return fetchApi<CallLatencyDetail>(`/v1/latency/calls/${callSid}`)
}

export function getCallLatencySummary(callSid: string): Promise<CallLatencySummary | null> {
  return fetchApi<CallLatencySummary>(`/v1/latency/calls/${callSid}/summary`)
}

export function getLatencyStats(): Promise<LatencyStats | null> {
  return fetchApi<LatencyStats>('/v1/latency/stats', 30)
}

// --- Observability ---

export function getObsSessions(): Promise<ObsSession[] | null> {
  return fetchApi<ObsSession[]>('/v1/obs/sessions')
}

export function getObsSessionCalls(sessionId: string): Promise<LLMCall[] | null> {
  return fetchApi<LLMCall[]>(`/v1/obs/sessions/${sessionId}/calls`)
}

export function getSessionCost(sessionId: string): Promise<CostBreakdown | null> {
  return fetchApi<CostBreakdown>(`/v1/obs/sessions/${sessionId}/cost`)
}

export function getOverview(): Promise<SystemOverview | null> {
  return fetchApi<SystemOverview>('/v1/obs/overview', 30)
}

// --- Session history ---

export function getSessionHistory(sessionId: string): Promise<SessionHistory | null> {
  return fetchApi<SessionHistory>(`/v1/obs/sessions/${sessionId}/history`)
}

// --- Health ---

export function getHealthDeep(): Promise<HealthCheck | null> {
  return fetchApi<HealthCheck>('/health/deep')
}

export function getHealthAlerts(): Promise<HealthAlerts | null> {
  return fetchApi<HealthAlerts>('/health/alerts')
}

export function getCircuitBreakers(): Promise<CircuitBreakers | null> {
  return fetchApi<CircuitBreakers>('/health/circuit-breakers')
}
