import { Skeleton } from '@/components/ui/shimmer'

export default function AssistantShimmer() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header Shimmer */}
      <div className="border-b border-border bg-card">
        <div className="px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <Skeleton className="h-6 w-48 lg:h-8 lg:w-64" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>

      {/* Tabs Shimmer */}
      <div className="flex-1 overflow-hidden">
        <div className="border-b border-border bg-card">
          <div className="px-4 lg:px-6">
            <div className="grid w-full grid-cols-3 bg-muted/50 rounded-lg p-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            {/* Form Fields Shimmer */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-48 w-full" />
            </div>

            {/* Additional form fields */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
