import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function PublishMarketItemLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Header Skeleton */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* 图片上传区域 Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-24 mb-2" />
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {Array(4).fill(0).map((_, index) => (
                    <Skeleton key={index} className="aspect-square rounded-md" />
                  ))}
                </div>
              </div>

              <Skeleton className="h-px w-full" />

              {/* 基本信息 Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div className="md:col-span-2">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-32 w-full" />
                </div>

                <div className="md:col-span-2">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <div className="flex flex-wrap gap-2">
                    {Array(3).fill(0).map((_, index) => (
                      <Skeleton key={index} className="h-8 w-20 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}