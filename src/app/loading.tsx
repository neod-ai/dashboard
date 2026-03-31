import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-6">
        <Skeleton className="h-3 w-20" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Metrics strip */}
        <div className="grid grid-cols-4 border-b border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`px-6 py-5 ${i < 3 ? 'border-r border-border' : ''}`}>
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="mt-3 h-5 w-12" />
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 border-b border-border">
          <div className="border-r border-border">
            <div className="px-6 py-3 bg-muted border-b border-border">
              <Skeleton className="h-2.5 w-20" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-2.5 border-b border-border">
                <Skeleton className="h-1.5 w-1.5 rounded-full" />
                <Skeleton className="h-3 flex-1 max-w-[120px]" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
          <div>
            <div className="px-6 py-3 bg-muted border-b border-border">
              <Skeleton className="h-2.5 w-12" />
            </div>
            <div className="px-6 py-4">
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>

        {/* Recent calls */}
        <div>
          <div className="px-6 py-3 bg-muted border-b border-border">
            <Skeleton className="h-2.5 w-24" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-border">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 flex-1 max-w-[60%]" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
