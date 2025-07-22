"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  BookOpen,
  ShoppingBag,
  MessageCircle,
  Calendar,
  Search,
  Heart,
  Eye,
  Share2,
  Camera,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import React from "react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Post, ApiResponse } from "@/lib/types" // 引入 Post 和 ApiResponse 类型

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [isAdmin, setIsAdmin] = useState(false)
  const [communityPosts, setCommunityPosts] = useState<Post[]>([])
  const [todayHighlights, setTodayHighlights] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.role === "admin") {
      setIsAdmin(true)
    } else {
      setIsAdmin(false)
    }

    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        // 并行获取数据
        const [postsResponse, highlightsResponse] = await Promise.all([
          api.searchPosts("", { page: 1, limit: 4 }), // 获取最新的4条社区动态
          api.searchPosts("", { page: 1, limit: 3, sort: "hot" }), // 获取3条热门帖子作为今日焦点
        ])

        // Process posts response
        if (Array.isArray(postsResponse)) {
          setCommunityPosts(postsResponse)
        } else if (typeof postsResponse === 'object' && postsResponse) {
          const postsApiResponse = postsResponse as ApiResponse<Post[]>;
          if (postsApiResponse.success && Array.isArray(postsApiResponse.data)) {
            setCommunityPosts(postsApiResponse.data)
          } else {
            toast.error(postsApiResponse.message || "获取社区动态失败")
          }
        } else {
          toast.error("获取社区动态失败: 响应格式错误")
        }

        // Process highlights response
        if (Array.isArray(highlightsResponse)) {
          setTodayHighlights(highlightsResponse)
        } else if (typeof highlightsResponse === 'object' && highlightsResponse) {
          const highlightsApiResponse = highlightsResponse as ApiResponse<Post[]>;
          if (highlightsApiResponse.success && Array.isArray(highlightsApiResponse.data)) {
            setTodayHighlights(highlightsApiResponse.data)
          } else {
            toast.error(highlightsApiResponse.message || "获取今日焦点失败")
          }
        } else {
          toast.error("获取今日焦点失败: 响应格式错误")
        }
      } catch (error) {
        console.error("获取首页数据失败:", error)
        toast.error("加载数据失败，请检查网络连接")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [user])

  const features = [
    // features 数组保持不变
    {
      id: "partner",
      title: "搭子广场",
      description: "找到志同道合的学习伙伴",
      icon: Users,
      color: "from-green-500 to-emerald-600",
      href: "/partner-square",
    },
    {
      id: "courses",
      title: "课程雷达",
      description: "课程评价与选课指南",
      icon: BookOpen,
      color: "from-green-500 to-teal-600",
      href: "/course-radar",
    },
    {
      id: "marketplace",
      title: "郑大闲鱼",
      description: "校园二手物品交易",
      icon: ShoppingBag,
      color: "from-orange-500 to-red-600",
      href: "/marketplace",
    },
    {
      id: "confession",
      title: "匿名树洞",
      description: "匿名分享你的心声",
      icon: MessageCircle,
      color: "from-purple-500 to-pink-600",
      href: "/confession",
    },
    {
      id: "lost-found",
      title: "失物招领",
      description: "找回丢失的物品",
      icon: Search,
      color: "from-indigo-500 to-blue-600",
      href: "/lost-found",
    },
    {
      id: "moments",
      title: "校园瞬间",
      description: "分享校园精彩照片",
      icon: Camera,
      color: "from-blue-500 to-purple-600",
      href: "/moments",
    },
    {
      id: "events",
      title: "活动日历",
      description: "校园活动一览无余",
      icon: Calendar,
      color: "from-pink-500 to-rose-600",
      href: "/events",
    },
  ]

  const handleLike = async (postId: number) => {
    // handleLike 函数保持不变
    try {
      if (!isAuthenticated) {
        toast.error("请先登录再点赞")
        return
      }
      
      const isLiked = likedPosts.has(postId)
      
      setLikedPosts((prev) => {
        const newLiked = new Set(prev)
        if (isLiked) {
          newLiked.delete(postId)
        } else {
          newLiked.add(postId)
        }
        return newLiked
      })
      
      // 更新UI
      const updateLikes = (posts: Post[]) => posts.map(p => p.id === postId ? { ...p, stats: { ...p.stats, likes: p.stats.likes + (isLiked ? -1 : 1) } } : p);
      setCommunityPosts(updateLikes(communityPosts));
      setTodayHighlights(updateLikes(todayHighlights));

      if (isLiked) {
        await api.unlikePost(postId.toString())
      } else {
        await api.likePost(postId.toString())
      }
    } catch (error) {
      console.error("点赞失败:", error)
      toast.error("点赞失败，请稍后再试")
      // Revert UI changes on failure
      const isLiked = likedPosts.has(postId) // Re-check liked status
      const revertLikes = (posts: Post[]) => posts.map(p => p.id === postId ? { ...p, stats: { ...p.stats, likes: p.stats.likes + (isLiked ? 1 : -1) } } : p);
      setCommunityPosts(revertLikes(communityPosts));
      setTodayHighlights(revertLikes(todayHighlights));
      setLikedPosts((prev) => {
        const newLiked = new Set(prev)
        if (isLiked) {
          newLiked.add(postId)
        } else {
          newLiked.delete(postId)
        }
        return newLiked
      })
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "hot":
        return "bg-red-500"
      case "new":
        return "bg-green-500"
      case "upcoming":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "搭子广场":
        return "from-green-500 to-emerald-600"
      case "课程雷达":
        return "from-green-500 to-teal-600"
      case "郑大闲鱼":
        return "from-orange-500 to-red-600"
      case "匿名树洞":
        return "from-purple-500 to-pink-600"
      case "失物招领":
        return "from-indigo-500 to-blue-600"
      case "校园瞬间":
        return "from-blue-500 to-purple-600"
      case "活动日历":
        return "from-pink-500 to-rose-600"
      default:
        return "bg-gray-500"
    }
  }

  // formatTime function
  const formatTime = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`
    } else {
      return `${Math.floor(diffInSeconds / 86400)}天前`
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <main className="container mx-auto px-4 py-8">
        {/* TopNav and other components remain the same */}

        {/* 今日焦点 */}
        <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">今日焦点</h2>
              <Button variant="ghost" size="sm" className="text-xs">
                查看全部 <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  {/* Skeleton loader */}
                </Card>
              ))
            ) : (
              todayHighlights.map((highlight) => (
                <Card key={highlight.id} className="group overflow-hidden">
                  <div className="relative">
                    <Image
                      src={highlight.image || "/placeholder.svg?height=120&width=180"}
                      alt={highlight.title}
                      width={300}
                      height={120}
                      className="w-full h-32 object-cover"
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${getStatusColor(highlight.status)}`}
                      variant="secondary"
                    >
                      {highlight.status === "hot"
                        ? "热门"
                        : highlight.status === "new"
                        ? "最新"
                        : "即将开始"}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{highlight.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{highlight.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{highlight.category}</Badge>
                      <span className="text-xs text-muted-foreground">{formatTime(highlight.time)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* 社区动态 */}
            <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">社区动态</h2>
              <Button variant="ghost" size="sm" className="text-xs">
                查看全部 <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      {/* Skeleton loader */}
                    </Card>
                  ))
                ) : (
                  communityPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author?.avatar_url} alt={post.author?.username} />
                            <AvatarFallback>{post.author?.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                                <span className="font-medium text-sm">{post.author?.username}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                                  {post.author?.level}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{formatTime(post.time)}</span>
                            <Badge
                              variant="outline"
                              className={`bg-gradient-to-r ${getCategoryColor(post.category)} text-white border-0`}
                            >
                              {post.category}
                            </Badge>
                          </div>
                        </div>
                        <h3 className="font-bold mt-1 mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground">{post.content}</p>
                      </div>
                    </div>

                    {post.image && (
                      <div className="mt-3 mb-3">
                        <Image
                          src={post.image}
                          alt={post.title}
                          width={600}
                          height={300}
                          className="rounded-lg w-full h-auto object-cover max-h-64"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex items-center gap-1 ${
                            likedPosts.has(post.id) ? "text-red-500" : ""
                          }`}
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              likedPosts.has(post.id) ? "fill-red-500" : ""
                            }`}
                          />
                          <span className="text-xs">{post.stats.likes}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-xs">{post.stats.comments}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="text-xs">{post.stats.shares}</span>
                        </Button>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Eye className="h-3 w-3 mr-1" /> {post.stats.views} 浏览
                      </div>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                            {post.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                  ))
                )}
            </div>
            </section>
          </div>
          <aside className="space-y-8">
            {/* 热门服务 */}
            <section>
            <h2 className="text-lg font-bold mb-3">热门服务</h2>
            <div className="grid grid-cols-3 gap-3">
              {features.slice(0, 6).map((feature) => (
                <Link href={feature.href} key={feature.id}>
                  <Card className="h-24 hover:shadow-md transition-shadow">
                    <CardContent className="flex flex-col items-center justify-center h-full p-2">
                      <div className={`bg-gradient-to-r ${feature.color} p-2 rounded-full mb-1`}>
                        {React.createElement(feature.icon, {
                          className: "h-4 w-4 text-white",
                        })}
                      </div>
                      <p className="text-xs font-medium text-center">{feature.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            </section>
            {/* 热门话题 */}
            <section>
            <h2 className="text-lg font-bold mb-3">热门话题</h2>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {[
                    { tag: "期末考试", posts: 450 },
                    { tag: "校园樱花", posts: 327 },
                    { tag: "实习机会", posts: 289 },
                    { tag: "考研复习", posts: 256 },
                    { tag: "郑大生活", posts: 204 },
                  ].map((topic, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">#{topic.tag}</p>
                          <p className="text-xs text-muted-foreground">{topic.posts} 条帖子</p>
                        </div>
                      </div>
                        {/* TrendingUp icon is not imported, so it's removed */}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </section>
            {/* 通知公告 */}
            <section>
            <h2 className="text-lg font-bold mb-3">通知公告</h2>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {[
                    { title: "关于举办2023年校园文化节的通知", date: "06-10" },
                    { title: "图书馆暑假开放时间安排", date: "06-08" },
                    { title: "校园网络系统维护通知", date: "06-05" },
                    { title: "2023级新生报到流程", date: "06-01" },
                  ].map((notice, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="flex items-center">
                          {/* Megaphone icon is not imported, so it's removed */}
                        <p className="text-sm">{notice.title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{notice.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
