import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function SearchLoading() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      {/* Search form */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索校园内容..."
              disabled
              className="pl-10"
            />
          </div>
          <Button disabled>搜索</Button>
        </div>
      </div>

      {/* Tab skeleton */}
      <div className="border-b mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
      </div>

      {/* Results skeleton */}
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <SearchResultSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function SearchResultSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-9 w-16 rounded-md flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
} 