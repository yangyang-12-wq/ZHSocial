"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  MessageCircle,
  Heart,
  Share2,
  Eye,
  Users,
  Search,
  Plus,
  Filter,
  Loader2,
  BookOpen,
  Calendar,
  Megaphone,
  Image as ImageIcon,
  Smile,
  PenTool
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api"
import { toast } from "sonner"

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  // 获取社区内容
  const fetchCommunityContent = async () => {
    setIsLoading(true)
    try {
      // 在实际应用中，这里应该调用API获取社区内容
      // const response = await apiClient.getCommunityPosts({
      //   category: activeTab !== "all" ? activeTab : undefined,
      //   keyword: searchQuery || undefined,
      //   page: 1,
      //   limit: 10
      // })
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟数据
      const mockPosts = [
        {
          id: 1,
          title: "图书馆学习搭子招募中",
          content: "准备考研，需要一起在图书馆学习的小伙伴，互相监督，共同进步！已有2人，还需要2人。",
          author: {
            id: "user1",
            name: "学霸小明",
            avatar: "/placeholder-user.jpg",
            level: "活跃用户",
          },
          category: "搭子广场",
          time: new Date(Date.now() - 3600000).toISOString(),
          stats: { views: 156, likes: 23, comments: 8, shares: 3 },
          tags: ["考研", "学习", "图书馆"],
          image: "/placeholder.jpg",
        },
        {
          id: 2,
          title: "数据结构课程怎么样？",
          content: "下学期想选张教授的数据结构课，有上过的同学可以分享一下经验吗？主要想了解作业量和考试难度。",
          author: {
            id: "user2",
            name: "编程新手",
            avatar: "/placeholder-user.jpg",
            level: "新用户",
          },
          category: "课程雷达",
          time: new Date(Date.now() - 7200000).toISOString(),
          stats: { views: 89, likes: 12, comments: 15, shares: 2 },
          tags: ["课程咨询", "计算机"],
        },
        {
          id: 3,
          title: "MacBook Air 出售",
          content: "毕业甩卖，MacBook Air M1 13寸，使用一年，9成新，配件齐全，价格可议。",
          author: {
            id: "user3",
            name: "即将毕业",
            avatar: "/placeholder-user.jpg",
            level: "认证用户",
          },
          category: "郑大闲鱼",
          time: new Date(Date.now() - 10800000).toISOString(),
          stats: { views: 234, likes: 45, comments: 23, shares: 8 },
          tags: ["二手", "电子产品"],
          image: "/placeholder.jpg",
        },
        {
          id: 4,
          title: "今天心情有点低落",
          content: "期末压力好大，感觉什么都学不会，有时候真的很想放弃。希望能熬过这段时间吧...",
          author: {
            id: "user4",
            name: "匿名用户",
            avatar: "/placeholder-user.jpg",
            level: "匿名",
          },
          category: "匿名树洞",
          time: new Date(Date.now() - 14400000).toISOString(),
          stats: { views: 67, likes: 34, comments: 12, shares: 1 },
          tags: ["心情", "压力"],
        },
        {
          id: 5,
          title: "校园摄影大赛开始报名",
          content: "第五届校园摄影大赛开始报名啦！主题为\"郑大四季\"，欢迎摄影爱好者参加，奖品丰厚！",
          author: {
            id: "user5",
            name: "摄影协会",
            avatar: "/placeholder-user.jpg",
            level: "官方组织",
          },
          category: "活动日历",
          time: new Date(Date.now() - 18000000).toISOString(),
          stats: { views: 312, likes: 87, comments: 34, shares: 15 },
          tags: ["摄影", "比赛", "活动"],
          image: "/placeholder.jpg",
        },
      ]
      
      setPosts(mockPosts)
    } catch (error) {
      console.error("获取社区内容失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunityContent()
  }, [activeTab])

  // 搜索处理
  const handleSearch = () => {
    fetchCommunityContent()
  }

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
          setPosts(posts => 
            posts.map(post => 
              post.id === postId 
                ? { ...post, stats: { ...post.stats, likes: post.stats.likes - 1 } } 
                : post
            )
          )
        } else {
          newLiked.add(postId)
          // 更新点赞数
          setPosts(posts => 
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

  // 获取分类颜色
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
      case "活动日历":
        return "from-pink-500 to-rose-600"
      default:
        return "from-blue-500 to-purple-600"
    }
  }

  // 根据搜索词过滤帖子
  const filteredPosts = posts.filter(post => {
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !post.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    if (activeTab !== "all" && post.category !== activeTab) {
      return false
    }
    
    return true
  })

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">社区</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Link href="/post/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              发布
            </Button>
          </Link>
        </div>
      </div>
      
      {/* 搜索栏 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索社区内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
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
            value="搭子广场"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            搭子广场
          </TabsTrigger>
          <TabsTrigger 
            value="课程雷达"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            课程雷达
          </TabsTrigger>
          <TabsTrigger 
            value="郑大闲鱼"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            郑大闲鱼
          </TabsTrigger>
          <TabsTrigger 
            value="匿名树洞"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            匿名树洞
          </TabsTrigger>
          <TabsTrigger 
            value="活动日历"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            活动日历
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">暂无相关内容</h3>
              <p className="text-muted-foreground/70 mb-4">成为第一个发布内容的人吧！</p>
              <Link href="/post/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  发布内容
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Link href={`/post/${post.id}`} key={post.id}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-sm">{post.author.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {post.author.level}
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
                            onClick={(e) => {
                              e.preventDefault()
                              handleLike(post.id)
                            }}
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
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* 快捷发布按钮 */}
      <div className="fixed bottom-20 right-4 md:right-8 flex flex-col gap-2">
        <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
          <Smile className="h-5 w-5" />
        </Button>
        <Button size="icon" className="rounded-full h-12 w-12 bg-primary shadow-lg">
          <PenTool className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
} 