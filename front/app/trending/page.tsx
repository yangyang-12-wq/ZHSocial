"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  MessageCircle,
  Heart,
  Share2,
  Eye,
  Loader2,
  Filter
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api"
import { toast } from "sonner"

export default function TrendingPage() {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [trendingPosts, setTrendingPosts] = useState<any[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())

  // 获取热门内容
  const fetchTrendingContent = async () => {
    setIsLoading(true)
    try {
      // 在实际应用中，这里应该调用API获取热门内容
      // const response = await apiClient.getTrendingContent(activeTab);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟数据
      const mockTrendingPosts = [
        {
          id: 1,
          title: "校园网络升级通知",
          content: "学校将于下周进行校园网络升级，届时可能会出现短暂的网络中断，请同学们提前做好准备。",
          author: {
            name: "网络中心",
            avatar: "/placeholder-user.jpg",
            verified: true,
          },
          category: "通知",
          time: new Date(Date.now() - 3600000).toISOString(),
          stats: { views: 2345, likes: 156, comments: 42, shares: 23 },
          tags: ["校园网络", "通知", "升级"],
          image: "/placeholder.jpg",
          trending: 1,
        },
        {
          id: 2,
          title: "校园歌手大赛报名开始",
          content: "第十届校园歌手大赛报名开始啦！有才艺的同学们快来报名参加吧，丰厚奖品等你来拿！",
          author: {
            name: "学生会",
            avatar: "/placeholder-user.jpg",
            verified: true,
          },
          category: "活动",
          time: new Date(Date.now() - 7200000).toISOString(),
          stats: { views: 1876, likes: 234, comments: 56, shares: 45 },
          tags: ["歌手大赛", "活动", "报名"],
          image: "/placeholder.jpg",
          trending: 2,
        },
        {
          id: 3,
          title: "食堂新增菜品投票",
          content: "食堂计划新增多种菜品，现在开放投票，选出你最想吃的新菜品！",
          author: {
            name: "后勤处",
            avatar: "/placeholder-user.jpg",
            verified: true,
          },
          category: "投票",
          time: new Date(Date.now() - 10800000).toISOString(),
          stats: { views: 3421, likes: 876, comments: 324, shares: 98 },
          tags: ["食堂", "投票", "新菜品"],
          image: "/placeholder.jpg",
          trending: 3,
        },
        {
          id: 4,
          title: "图书馆延长开放时间",
          content: "为了方便同学们复习，图书馆将在考试周期间延长开放时间至晚上11点。",
          author: {
            name: "图书馆",
            avatar: "/placeholder-user.jpg",
            verified: true,
          },
          category: "通知",
          time: new Date(Date.now() - 14400000).toISOString(),
          stats: { views: 1543, likes: 342, comments: 87, shares: 32 },
          tags: ["图书馆", "开放时间", "考试周"],
          trending: 4,
        },
        {
          id: 5,
          title: "校园摄影大赛获奖名单",
          content: "校园摄影大赛评选结果出炉，恭喜获奖的同学们！",
          author: {
            name: "摄影协会",
            avatar: "/placeholder-user.jpg",
            verified: false,
          },
          category: "活动",
          time: new Date(Date.now() - 18000000).toISOString(),
          stats: { views: 987, likes: 213, comments: 45, shares: 21 },
          tags: ["摄影", "比赛", "获奖"],
          image: "/placeholder.jpg",
          trending: 5,
        },
      ]
      
      setTrendingPosts(mockTrendingPosts)
    } catch (error) {
      console.error("获取热门内容失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingContent()
  }, [activeTab])

  // 处理点赞
  const handleLike = async (postId: number) => {
    try {
      if (!isAuthenticated) {
        toast.error("请先登录再点赞")
        return
      }
      
      const isLiked = likedPosts.has(postId)
      
      // 乐观更新UI
      setLikedPosts((prev) => {
        const newLiked = new Set(prev)
        if (isLiked) {
          newLiked.delete(postId)
          // 更新点赞数
          setTrendingPosts(posts => 
            posts.map(post => 
              post.id === postId 
                ? { ...post, stats: { ...post.stats, likes: post.stats.likes - 1 } } 
                : post
            )
          )
        } else {
          newLiked.add(postId)
          // 更新点赞数
          setTrendingPosts(posts => 
            posts.map(post => 
              post.id === postId 
                ? { ...post, stats: { ...post.stats, likes: post.stats.likes + 1 } } 
                : post
            )
          )
        }
        return newLiked
      })
      
      // 调用API
      if (isLiked) {
        await apiClient.unlikePost(postId.toString())
      } else {
        await apiClient.likePost(postId.toString())
      }
    } catch (error) {
      console.error("点赞失败:", error)
      // 如果API调用失败，恢复原状态
      setLikedPosts((prev) => {
        const newLiked = new Set(prev)
        if (newLiked.has(postId)) {
          newLiked.delete(postId)
        } else {
          newLiked.add(postId)
        }
        return newLiked
      })
      toast.error("点赞失败，请稍后再试")
    }
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}秒前`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`
    return `${Math.floor(diffInSeconds / 86400)}天前`
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">热门趋势</h1>
        </div>
        
        <Button variant="ghost" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent h-12 w-full justify-start overflow-x-auto scrollbar-hide">
          <TabsTrigger 
            value="all"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            全部
          </TabsTrigger>
          <TabsTrigger 
            value="campus"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            校园
          </TabsTrigger>
          <TabsTrigger 
            value="academic"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            学术
          </TabsTrigger>
          <TabsTrigger 
            value="activity"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            活动
          </TabsTrigger>
          <TabsTrigger 
            value="discussion"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            讨论
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {trendingPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center mr-1">
                        <Badge className="bg-primary text-white mb-2 px-2 py-1 text-xs">#{post.trending}</Badge>
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
                        </Button>
                        <span className="text-xs">{post.stats.likes}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={post.author.avatar} alt={post.author.name} />
                            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium text-sm">{post.author.name}</span>
                              {post.author.verified && (
                                <Badge variant="secondary" className="ml-1 h-4 px-1">认证</Badge>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span>{formatTime(post.time)}</span>
                              <span className="mx-1">·</span>
                              <Badge variant="outline" className="h-5 text-xs">{post.category}</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="font-bold mt-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                        
                        {post.image && (
                          <div className="mt-3">
                            <Image
                              src={post.image}
                              alt={post.title}
                              width={500}
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 