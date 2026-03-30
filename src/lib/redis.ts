import Redis from 'ioredis'

let client: Redis | null = null

export function getRedisClient(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/0', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  }
  return client
}

export const STREAM_KEY = process.env.LATENCY_STREAM_KEY || 'latency:metrics'
