import { getRedisClient, STREAM_KEY } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const callSidFilter = url.searchParams.get('call_sid')

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Create a dedicated Redis client for blocking reads
      const redis = getRedisClient().duplicate()
      let lastId = '$' // Start from newest
      let cancelled = false

      request.signal.addEventListener('abort', () => {
        cancelled = true
        redis.disconnect()
      })

      try {
        while (!cancelled) {
          const results = await redis.xread('COUNT', 10, 'BLOCK', 5000, 'STREAMS', STREAM_KEY, lastId)
          if (!results) continue

          for (const [, entries] of results) {
            for (const [id, fields] of entries) {
              lastId = id
              // Convert flat field array to object
              const event: Record<string, string> = {}
              for (let i = 0; i < fields.length; i += 2) {
                event[fields[i]] = fields[i + 1]
              }

              // Filter by call_sid if specified
              if (callSidFilter && event.call_sid !== callSidFilter) continue

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: String(e) })}\n\n`))
        }
      } finally {
        redis.disconnect()
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    }
  })
}
