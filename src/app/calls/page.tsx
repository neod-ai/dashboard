import Link from 'next/link'
import { getCallHistory } from '@/lib/api'
import { formatDuration, formatTimestamp } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const limit = 30
  const offset = (page - 1) * limit

  const history = await getCallHistory(offset, limit)
  const calls = history?.calls ?? []
  const total = history?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Call History</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total > 0 ? `${total} calls` : 'All voice calls processed by the system'}
        </p>
      </div>

      {calls.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-zinc-800 py-20 text-sm text-zinc-500">
          No calls recorded yet
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call SID</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead className="text-right">Turns</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call.call_sid}>
                    <TableCell>
                      <Link
                        href={`/calls/${call.call_sid}`}
                        className="font-mono text-xs text-blue-400 hover:underline"
                      >
                        {call.call_sid.slice(0, 12)}...
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {formatTimestamp(call.start_time)}
                    </TableCell>
                    <TableCell>
                      {call.is_active ? (
                        <span className="inline-flex items-center gap-2">
                          <Badge className="bg-green-900/50 text-green-400 border-green-800/50">
                            Active
                          </Badge>
                          <Link
                            href={`/calls/${call.call_sid}/live`}
                            className="text-xs text-green-400 hover:underline"
                          >
                            Live
                          </Link>
                        </span>
                      ) : (
                        <Badge variant="secondary">Completed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <span className="block truncate text-xs text-zinc-400">
                        {call.transcript_preview || (
                          <span className="text-zinc-600 italic">—</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {call.turn_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-400">
                      {call.duration_ms != null
                        ? formatDuration(call.duration_ms)
                        : '\u2014'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              {page > 1 && (
                <Link
                  href={`/calls?page=${page - 1}`}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/calls?page=${page + 1}`}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
