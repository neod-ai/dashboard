import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format milliseconds to human-readable duration: "350ms", "1.2s", "2m 15s" */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1000)
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

/** Format USD cost: "$0.0042", "$1.23" */
export function formatCost(usd: number): string {
  if (usd === 0) return '$0.00'
  if (usd < 0.01) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(2)}`
}

/** Format token count: "845", "1.2K", "45.3K" */
export function formatTokens(n: number): string {
  if (n < 1000) return n.toString()
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}

/** Format ISO timestamp: "10:32:15" for today, "Mar 30, 10:32" for other days */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Map status strings to Tailwind color classes */
export function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (['healthy', 'up', 'ok', 'closed'].includes(s)) return 'text-green-500'
  if (['degraded', 'warning', 'half_open', 'half-open'].includes(s)) return 'text-yellow-500'
  if (['unhealthy', 'down', 'critical', 'open'].includes(s)) return 'text-red-500'
  return 'text-muted-foreground'
}
