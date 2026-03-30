import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <Skeleton className="h-8 w-40 bg-zinc-800" />

      {/* Top metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-zinc-900 ring-zinc-800">
            <CardHeader>
              <Skeleton className="h-4 w-24 bg-zinc-800" />
              <Skeleton className="h-9 w-16 bg-zinc-800" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-20 bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latency overview */}
      <div>
        <Skeleton className="mb-3 h-6 w-40 bg-zinc-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} size="sm" className="bg-zinc-900 ring-zinc-800">
              <CardHeader>
                <Skeleton className="h-4 w-20 bg-zinc-800" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-8 bg-zinc-800" />
                    <Skeleton className="h-5 w-14 bg-zinc-800" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-8 bg-zinc-800" />
                    <Skeleton className="h-5 w-14 bg-zinc-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active calls */}
      <div>
        <Skeleton className="mb-3 h-6 w-32 bg-zinc-800" />
        <Card className="bg-zinc-900 ring-zinc-800">
          <CardContent className="py-8 flex justify-center">
            <Skeleton className="h-4 w-32 bg-zinc-800" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
