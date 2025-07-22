import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
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
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 商品图片 Skeleton */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur-sm border-0 overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 flex space-x-2 overflow-x-auto">
                {Array(4).fill(0).map((_, index) => (
                  <Skeleton key={index} className="w-16 h-16 rounded-md" />
                ))}
              </div>
            </Card>

            {/* 商品详情 Skeleton */}
            <Card className="mt-6 bg-white/70 backdrop-blur-sm border-0">
              <CardHeader>
                <Skeleton className="h-8 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <div className="space-y-4 mt-4">
                    {Array(5).fill(0).map((_, index) => (
                      <Skeleton key={index} className="h-4 w-full" />
                    ))}
                  </div>
                  <div className="mt-6">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <div className="flex flex-wrap gap-2">
                      {Array(4).fill(0).map((_, index) => (
                        <Skeleton key={index} className="h-8 w-20 rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 价格和卖家信息 Skeleton */}
          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <div className="mb-4">
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-10 w-1/2" />
                </div>

                <Skeleton className="h-px w-full my-4" />

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>

                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-48" />

                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>

                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>

            {/* 卖家信息 Skeleton */}
            <Card className="bg-white/70 backdrop-blur-sm border-0">
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>

                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>

            {/* 相似商品 Skeleton */}
            <Card className="bg-white/70 backdrop-blur-sm border-0">
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2">
                      <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}