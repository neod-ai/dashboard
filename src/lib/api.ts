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

async function fetchApi<T>(path: string, revalidate?: number): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`)
  return res.json() as Promise<T>
}

// --- Audio sessions ---

export function getAudioSessions(): Promise<AudioSession[]> {
  return fetchApi<AudioSession[]>('/debug/audio/sessions')
}

// --- Latency ---

export function getLatencyCalls(): Promise<LatencyCall[]> {
  return fetchApi<LatencyCall[]>('/v1/latency/calls')
}

export function getCallLatency(callSid: string): Promise<CallLatencyDetail> {
  return fetchApi<CallLatencyDetail>(`/v1/latency/calls/${callSid}`)
}

export function getCallLatencySummary(callSid: string): Promise<CallLatencySummary> {
  return fetchApi<CallLatencySummary>(`/v1/latency/calls/${callSid}/summary`)
}

export function getLatencyStats(): Promise<LatencyStats> {
  return fetchApi<LatencyStats>('/v1/latency/stats', 30)
}

// --- Observability ---

export function getObsSessions(): Promise<ObsSession[]> {
  return fetchApi<ObsSession[]>('/v1/obs/sessions')
}

export function getObsSessionCalls(sessionId: string): Promise<LLMCall[]> {
  return fetchApi<LLMCall[]>(`/v1/obs/sessions/${sessionId}/calls`)
}

export function getSessionCost(sessionId: string): Promise<CostBreakdown> {
  return fetchApi<CostBreakdown>(`/v1/obs/sessions/${sessionId}/cost`)
}

export function getOverview(): Promise<SystemOverview> {
  return fetchApi<SystemOverview>('/v1/obs/overview', 30)
}

// --- Session history ---

export function getSessionHistory(sessionId: string): Promise<SessionHistory> {
  return fetchApi<SessionHistory>(`/v1/obs/sessions/${sessionId}/history`)
}

// --- Health ---

export function getHealthDeep(): Promise<HealthCheck> {
  return fetchApi<HealthCheck>('/health/deep')
}

export function getHealthAlerts(): Promise<HealthAlerts> {
  return fetchApi<HealthAlerts>('/health/alerts')
}

export function getCircuitBreakers(): Promise<CircuitBreakers> {
  return fetchApi<CircuitBreakers>('/health/circuit-breakers')
}
