/** Map status to background dot color class */
export function statusDot(status: string): string {
  const s = status.toLowerCase()
  if (['healthy', 'up', 'ok', 'closed'].includes(s)) return 'bg-green-500'
  if (['degraded', 'warning', 'half_open', 'half-open'].includes(s)) return 'bg-yellow-500'
  if (['unhealthy', 'down', 'critical', 'open'].includes(s)) return 'bg-red-500'
  return 'bg-gray-400'
}

/** Map status to display label */
export function statusLabel(status: string): string {
  const s = status.toLowerCase()
  if (['healthy', 'up', 'ok', 'closed'].includes(s)) return 'Healthy'
  if (['degraded', 'warning', 'half_open', 'half-open'].includes(s)) return 'Degraded'
  if (['unhealthy', 'down', 'critical', 'open'].includes(s)) return 'Unhealthy'
  return status
}

/** Format snake_case name to Title Case */
export function formatName(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Components shown in the dashboard (filters out sub-agents) */
export const VISIBLE_COMPONENTS = new Set([
  'redis',
  'telephony_edge',
  'telephony-edge',
  'ngrok',
  'central_agent',
])
