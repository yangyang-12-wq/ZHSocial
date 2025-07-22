"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ArrowLeft,
  Send,
  MoreHorizontal,
} from "lucide-react"

// 模拟图片数据
const mockPhotoDetails = {
  id: "1",
  imageUrl: "/placeholder.jpg",
  caption: "美丽的校园风景，秋天的银杏树真是太美了！#校园风光 #秋天",
  likes: 120,
  comments: [
    {
      id: "c1",
      text: "太美了！这是在哪个校区拍的？",
      user: {
        id: "user2",
        username: "李华",
        avatar: "/placeholder-user.jpg",
      },
      createdAt: "2023-10-15T14:30:00Z",
      likes: 3,
    },
    {
      id: "c2",
      text: "我也想去看看，银杏树真的太漂亮了",
      user: {
        id: "user3",
        username: "王芳",
        avatar: "/placeholder-user.jpg",
      },
      createdAt: "2023-10-15T15:05:00Z",
      likes: 2,
    },
    {
      id: "c3",
      text: "拍得真好，角度很巧妙",
      user: {
        id: "user4",
        username: "刘强",
        avatar: "/placeholder-user.jpg",
      },
      createdAt: "2023-10-15T16:20:00Z",
      likes: 1,
    },
  ],
  createdAt: "2023-10-15T14:23:00Z",
  user: {
    id: "user1",
    username: "张明",
    avatar: "/placeholder-user.jpg",
  },
  tags: ["校园风光", "秋天"],
  location: "郑州大学·校园中心",
  isLiked: false,
  isSaved: false,
}

export default function MomentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [photoDetails, setPhotoDetails] = useState(mockPhotoDetails)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // 模拟获取照片详情数据
  useEffect(() => {
    // 这里应该是从API获取数据的逻辑
    // 目前使用模拟数据
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [params.id])
  
  // 处理点赞功能
  const handleLike = () => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    setPhotoDetails(prev => ({
      ...prev,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
      isLiked: !prev.isLiked
    }))
  }
  
  // 处理收藏功能
  const handleSave = () => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    setPhotoDetails(prev => ({
      ...prev,
      isSaved: !prev.isSaved
    }))
  }
  
  // 添加评论
  const handleAddComment = () => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    if (!comment.trim()) return
    
    const newComment = {
      id: `c${photoDetails.comments.length + 1}`,
      text: comment,
      user: {
        id: user?.id || "current-user",
        username: user?.username || "当前用户",
        avatar: user?.avatar || "/placeholder-user.jpg",
      },
      createdAt: new Date().toISOString(),
      likes: 0,
    }
    
    setPhotoDetails(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }))
    
    setComment("")
  }
  
  // 计算时间差
  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const past = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return "刚刚"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}分钟前`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}小时前`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}天前`
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-32 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-4"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">照片详情</h1>
            </div>
            
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* 主要内容区 */}
      <main className="container mx-auto px-0 md:px-4 py-0 md:py-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900">
          {/* 桌面端布局 */}
          <div className="hidden md:grid md:grid-cols-5 gap-0 border dark:border-gray-800 rounded-lg overflow-hidden">
            {/* 左侧图片 */}
            <div className="col-span-3">
              <div className="relative aspect-square">
                <Image
                  src={photoDetails.imageUrl}
                  alt={photoDetails.caption}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            {/* 右侧信息和评论 */}
            <div className="col-span-2 flex flex-col">
              {/* 顶部用户信息 */}
              <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8" userId={photoDetails.user.id} clickable={true}>
                    <AvatarImage src={photoDetails.user.avatar} />
                    <AvatarFallback>{photoDetails.user.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{photoDetails.user.username}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{photoDetails.location}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 评论区 */}
              <div className="flex-grow overflow-y-auto p-4">
                {/* 照片说明 */}
                <div className="flex space-x-2 mb-4">
                  <Avatar className="w-8 h-8" userId={photoDetails.user.id} clickable={true}>
                    <AvatarImage src={photoDetails.user.avatar} />
                    <AvatarFallback>{photoDetails.user.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm">
                      <span className="font-medium mr-1">{photoDetails.user.username}</span>
                      <span>{photoDetails.caption}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {getTimeAgo(photoDetails.createdAt)}
                    </div>
                  </div>
                </div>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {photoDetails.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                
                {/* 分隔线 */}
                <div className="border-t dark:border-gray-800 my-4"></div>
                
                {/* 评论列表 */}
                {photoDetails.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2 mb-4">
                    <Avatar className="w-8 h-8" userId={comment.user.id} clickable={true}>
                      <AvatarImage src={comment.user.avatar} />
                      <AvatarFallback>{comment.user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm">
                        <span className="font-medium mr-1">{comment.user.username}</span>
                        <span>{comment.text}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getTimeAgo(comment.createdAt)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {comment.likes > 0 && `${comment.likes}个赞`}
                        </span>
                        <button className="text-xs text-gray-500 dark:text-gray-400">
                          回复
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 底部操作区域 */}
              <div className="border-t dark:border-gray-800 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleLike}
                      className={photoDetails.isLiked ? "text-red-500" : ""}
                    >
                      <Heart className={`h-6 w-6 ${photoDetails.isLiked ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-6 w-6" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleSave}
                    className={photoDetails.isSaved ? "text-yellow-500" : ""}
                  >
                    <Bookmark className={`h-6 w-6 ${photoDetails.isSaved ? "fill-current" : ""}`} />
                  </Button>
                </div>
                <div className="font-medium text-sm">{photoDetails.likes} 次点赞</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(photoDetails.createdAt).toLocaleDateString('zh-CN', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </div>
                
                {/* 评论框 */}
                <div className="flex items-center space-x-2 pt-2">
                  {isAuthenticated && (
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} />
                      <AvatarFallback>{user?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  )}
                  <Input
                    placeholder="添加评论..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleAddComment}
                    disabled={!comment.trim()}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 移动端布局 */}
          <div className="md:hidden">
            {/* 用户信息 */}
            <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8" userId={photoDetails.user.id} clickable={true}>
                  <AvatarImage src={photoDetails.user.avatar} />
                  <AvatarFallback>{photoDetails.user.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{photoDetails.user.username}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{photoDetails.location}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 图片 */}
            <div className="relative aspect-square">
              <Image
                src={photoDetails.imageUrl}
                alt={photoDetails.caption}
                fill
                className="object-cover"
              />
            </div>
            
            {/* 操作按钮 */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex space-x-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLike}
                    className={photoDetails.isLiked ? "text-red-500" : ""}
                  >
                    <Heart className={`h-6 w-6 ${photoDetails.isLiked ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-6 w-6" />
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSave}
                  className={photoDetails.isSaved ? "text-yellow-500" : ""}
                >
                  <Bookmark className={`h-6 w-6 ${photoDetails.isSaved ? "fill-current" : ""}`} />
                </Button>
              </div>
              <div className="font-medium text-sm mb-1">{photoDetails.likes} 次点赞</div>
              
              {/* 照片说明 */}
              <div className="mb-2">
                <div className="text-sm">
                  <span className="font-medium mr-1">{photoDetails.user.username}</span>
                  <span>{photoDetails.caption}</span>
                </div>
              </div>
              
              {/* 标签 */}
              <div className="flex flex-wrap gap-1 mb-2">
                {photoDetails.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {new Date(photoDetails.createdAt).toLocaleDateString('zh-CN', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </div>
              
              {/* 分隔线 */}
              <div className="border-t dark:border-gray-800 mb-4"></div>
              
              {/* 评论列表 */}
              <div className="space-y-4">
                {photoDetails.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <Avatar className="w-8 h-8" userId={comment.user.id} clickable={true}>
                      <AvatarImage src={comment.user.avatar} />
                      <AvatarFallback>{comment.user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm">
                        <span className="font-medium mr-1">{comment.user.username}</span>
                        <span>{comment.text}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getTimeAgo(comment.createdAt)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {comment.likes > 0 && `${comment.likes}个赞`}
                        </span>
                        <button className="text-xs text-gray-500 dark:text-gray-400">
                          回复
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 底部评论框 */}
            <div className="fixed bottom-0 left-0 right-0 border-t dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center space-x-2">
                {isAuthenticated && (
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} />
                    <AvatarFallback>{user?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                )}
                <Input
                  placeholder="添加评论..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1"
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 