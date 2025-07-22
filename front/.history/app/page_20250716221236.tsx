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
  Bell,
  TrendingUp,
  Megaphone,
  Heart,
  Eye,
  Share2,
  User,
  Camera,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import React from "react"; // Added missing import for React
import { toast } from "sonner"
import apiClient from "@/lib/api"

// Fixed timestamp for server/client rendering consistency
const FIXED_TIMESTAMP = "2023-06-15T12:00:00Z";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user?.role === "admin") {
      setIsAdmin(true)
    }
  }, [user])

  const features = [
    {
      id: "partner",
      title: "搭子广场",
      description: "找到志同道合的学习伙伴",
      icon: Users,
      color: "from-green-500 to-emerald-600",
      href: "/partner-square",
      stats: { active: 156, total: 1240 },
    },
    {
      id: "courses",
      title: "课程雷达",
      description: "课程评价与选课指南",
      icon: BookOpen,
      color: "from-green-500 to-teal-600",
      href: "/course-radar",
      stats: { active: 89, total: 2340 },
    },
    {
      id: "marketplace",
      title: "郑大闲鱼",
      description: "校园二手物品交易",
      icon: ShoppingBag,
      color: "from-orange-500 to-red-600",
      href: "/marketplace",
      stats: { active: 234, total: 890 },
    },
    {
      id: "confession",
      title: "匿名树洞",
      description: "匿名分享你的心声",
      icon: MessageCircle,
      color: "from-purple-500 to-pink-600",
      href: "/confession",
      stats: { active: 67, total: 3450 },
    },
    {
      id: "lost-found",
      title: "失物招领",
      description: "找回丢失的物品",
      icon: Search,
      color: "from-indigo-500 to-blue-600",
      href: "/lost-found",
      stats: { active: 23, total: 156 },
    },
    {
      id: "moments",
      title: "校园瞬间",
      description: "分享校园精彩照片",
      icon: Camera,
      color: "from-blue-500 to-purple-600",
      href: "/moments",
      stats: { active: 45, total: 780 },
    },
    {
      id: "events",
      title: "活动日历",
      description: "校园活动一览无余",
      icon: Calendar,
      color: "from-pink-500 to-rose-600",
      href: "/events",
      stats: { active: 12, total: 78 },
    },
  ]

  const todayHighlights = [
    {
      id: 1,
      title: "期末考试周来临",
      description: "图书馆座位紧张，建议提前预约",
      image: "/placeholder.svg?height=120&width=180",
      category: "学习",
      time: FIXED_TIMESTAMP,
      status: "hot",
    },
    {
      id: 2,
      title: "春季招聘会开启",
      description: "500+企业参与，机会难得",
      image: "/placeholder.svg?height=120&width=180",
      category: "就业",
      time: FIXED_TIMESTAMP,
      status: "new",
    },
    {
      id: 3,
      title: "樱花节活动预告",
      description: "下周校园樱花盛开，摄影大赛开始",
      image: "/placeholder.svg?height=120&width=180",
      category: "活动",
      time: FIXED_TIMESTAMP,
      status: "upcoming",
    },
  ]

  const communityPosts = [
    {
      id: 1,
      title: "图书馆学习搭子招募中",
      content: "准备考研，需要一起在图书馆学习的小伙伴，互相监督，共同进步！已有2人，还需要2人。",
      author: {
        name: "学霸小明",
        avatar: "/placeholder.svg?height=40&width=40",
        level: "活跃用户",
      },
      category: "搭子广场",
      time: FIXED_TIMESTAMP,
      stats: { views: 156, likes: 23, comments: 8, shares: 3 },
      tags: ["考研", "学习", "图书馆"],
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 2,
      title: "数据结构课程怎么样？",
      content: "下学期想选张教授的数据结构课，有上过的同学可以分享一下经验吗？主要想了解作业量和考试难度。",
      author: {
        name: "编程新手",
        avatar: "/placeholder.svg?height=40&width=40",
        level: "新用户",
      },
      category: "课程雷达",
      time: FIXED_TIMESTAMP,
      stats: { views: 89, likes: 12, comments: 15, shares: 2 },
      tags: ["课程咨询", "计算机"],
    },
    {
      id: 3,
      title: "MacBook Air 出售",
      content: "毕业甩卖，MacBook Air M1 13寸，使用一年，9成新，配件齐全，价格可议。",
      author: {
        name: "即将毕业",
        avatar: "/placeholder.svg?height=40&width=40",
        level: "认证用户",
      },
      category: "郑大闲鱼",
      time: FIXED_TIMESTAMP,
      stats: { views: 234, likes: 45, comments: 23, shares: 8 },
      tags: ["二手", "电子产品"],
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 4,
      title: "今天心情有点低落",
      content: "期末压力好大，感觉什么都学不会，有时候真的很想放弃。希望能熬过这段时间吧...",
      author: {
        name: "匿名用户",
        avatar: "/placeholder.svg?height=40&width=40",
        level: "匿名",
      },
      category: "匿名树洞",
      time: FIXED_TIMESTAMP,
      stats: { views: 67, likes: 34, comments: 12, shares: 1 },
      tags: ["心情", "压力"],
    },
  ]

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
        } else {
          newLiked.add(postId)
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

  const getStatusColor = (status: string) => {
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
      case "活动日历":
        return "from-pink-500 to-rose-600"
      default:
        return "from-blue-500 to-purple-600"
    }
  }

  return (
    <div className="container pb-20">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 py-4">
          {/* Today's highlights */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">今日焦点</h2>
              <Button variant="ghost" size="sm" className="text-xs">
                查看全部 <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {todayHighlights.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="relative">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={300}
                      height={120}
                      className="w-full h-32 object-cover"
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${getStatusColor(item.status)}`}
                      variant="secondary"
                    >
                      {item.status === "hot"
                        ? "热门"
                        : item.status === "new"
                        ? "最新"
                        : "即将开始"}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{item.category}</Badge>
                      <span className="text-xs text-muted-foreground">2小时前</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Community posts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">社区动态</h2>
              <Button variant="ghost" size="sm" className="text-xs">
                查看全部 <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-4">
              {communityPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
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
                            <span className="text-xs text-muted-foreground">2小时前</span>
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
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full md:w-80 shrink-0 py-4">
          {/* Services grid */}
          <div className="mb-6">
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
          </div>
          
          {/* Trending topics */}
          <div className="mb-6">
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
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Announcements */}
          <div>
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
                        <Megaphone className="h-4 w-4 mr-2 text-orange-500" />
                        <p className="text-sm">{notice.title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{notice.date}</span>
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
