"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Search,
  Camera,
  Zap,
  Users,
  TrendingUp,
  Filter,
  ArrowLeft,
  Plus,
  MoreHorizontal,
} from "lucide-react"

// 模拟图片数据
const mockPhotos = [
  {
    id: "1",
    imageUrl: "/placeholder.jpg",
    caption: "美丽的校园风景，秋天的银杏树真是太美了！#校园风光 #秋天",
    likes: 120,
    comments: 24,
    createdAt: "2023-10-15T14:23:00Z",
    user: {
      id: "user1",
      username: "张明",
      avatar: "/placeholder-user.jpg",
    },
    tags: ["校园风光", "秋天"],
    location: "郑州大学·校园中心"
  },
  {
    id: "2",
    imageUrl: "/placeholder.jpg",
    caption: "今天的晚霞太美了，不得不拍下来分享给大家！#晚霞 #美景",
    likes: 89,
    comments: 12,
    createdAt: "2023-10-14T18:10:00Z",
    user: {
      id: "user2",
      username: "李华",
      avatar: "/placeholder-user.jpg",
    },
    tags: ["晚霞", "美景"],
    location: "郑州大学·宿舍楼顶"
  },
  {
    id: "3",
    imageUrl: "/placeholder.jpg",
    caption: "期中考试结束啦！和小伙伴们一起去庆祝！#期中考试 #庆祝 #朋友",
    likes: 76,
    comments: 8,
    createdAt: "2023-10-13T20:40:00Z",
    user: {
      id: "user3",
      username: "王芳",
      avatar: "/placeholder-user.jpg",
    },
    tags: ["期中考试", "庆祝", "朋友"],
    location: "校外·咖啡厅"
  },
  {
    id: "4",
    imageUrl: "/placeholder.jpg",
    caption: "今天的实验课很有趣，学到了很多新知识！#实验课 #学习",
    likes: 45,
    comments: 5,
    createdAt: "2023-10-12T16:20:00Z",
    user: {
      id: "user4",
      username: "刘强",
      avatar: "/placeholder-user.jpg",
    },
    tags: ["实验课", "学习"],
    location: "郑州大学·实验楼"
  },
  {
    id: "5",
    imageUrl: "/placeholder.jpg",
    caption: "校园运动会开始了！大家都很热情！#运动会 #校园活动",
    likes: 132,
    comments: 18,
    createdAt: "2023-10-11T09:15:00Z",
    user: {
      id: "user5",
      username: "陈静",
      avatar: "/placeholder-user.jpg",
    },
    tags: ["运动会", "校园活动"],
    location: "郑州大学·运动场"
  },
  {
    id: "6",
    imageUrl: "/placeholder.jpg",
    caption: "学校的樱花开了，太美了！#樱花 #春天 #校园风光",
    likes: 215,
    comments: 34,
    createdAt: "2023-10-10T14:50:00Z",
    user: {
      id: "user6",
      username: "赵倩",
      avatar: "/placeholder-user.jpg",
    },
    tags: ["樱花", "春天", "校园风光"],
    location: "郑州大学·樱花大道"
  }
]

// 主页面组件
export default function MomentsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [activeTab, setActiveTab] = useState("for-you")
  const [searchQuery, setSearchQuery] = useState("")
  const [photos, setPhotos] = useState(mockPhotos)
  
  // 模拟获取照片数据
  useEffect(() => {
    // 这里应该是从API获取数据的逻辑
    // 目前使用模拟数据
  }, [])
  
  // 模拟点赞功能
  const handleLike = (id: string) => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    setPhotos(prev =>
      prev.map(photo =>
        photo.id === id ? { ...photo, likes: photo.likes + 1 } : photo
      )
    )
  }
  
  // 过滤照片
  const filteredPhotos = photos.filter(photo => {
    if (!searchQuery) return true
    
    return (
      photo.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      photo.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })
  
  return (
    <div className="min-h-screen bg-gradient-to-tr from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">校园瞬间</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => router.push("/moments/upload")}>
                <Camera className="h-5 w-5" />
              </Button>
              {isAuthenticated && (
                <Avatar className="w-8 h-8" userId={user?.id} clickable={true}>
                  <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} />
                  <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
          
          {/* 搜索栏 */}
          <div className="mt-3 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索照片、标签或用户..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 标签页切换 */}
          <TabsList className="grid grid-cols-3 w-full mt-4">
            <TabsTrigger value="for-you">
              <Zap className="h-4 w-4 mr-2" />
              为你推荐
            </TabsTrigger>
            <TabsTrigger value="following">
              <Users className="h-4 w-4 mr-2" />
              关注
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              热门
            </TabsTrigger>
          </TabsList>
        </div>
      </header>
      
      {/* 主要内容区 */}
      <main className="container mx-auto px-4 py-6">
        <TabsContent value="for-you" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPhotos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onLike={handleLike} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="following" className="mt-0">
          {isAuthenticated ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPhotos
                .filter((_, index) => index % 2 === 0) // 模拟"关注"过滤
                .map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} onLike={handleLike} />
                ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                登录以查看关注内容
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                登录后可以关注你喜欢的用户并查看他们的最新动态
              </p>
              <Button onClick={() => router.push("/login")}>
                登录 / 注册
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...filteredPhotos]
              .sort((a, b) => b.likes - a.likes) // 按照点赞数排序
              .map((photo) => (
                <PhotoCard key={photo.id} photo={photo} onLike={handleLike} />
              ))}
          </div>
        </TabsContent>
        
        {/* 悬浮的发布按钮 */}
        <Button
          className="fixed right-6 bottom-20 md:bottom-6 z-40 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
          size="icon"
          onClick={() => router.push("/moments/upload")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </main>
      </Tabs>
    </div>
  )
}

// 照片卡片组件
function PhotoCard({ photo, onLike }: { photo: any; onLike: (id: string) => void }) {
  return (
    <Card className="overflow-hidden bg-white dark:bg-gray-800 border-none shadow-md hover:shadow-lg transition-shadow">
      <div className="p-3 flex items-center justify-between border-b dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8" userId={photo.user.id} clickable={true}>
            <AvatarImage src={photo.user.avatar} />
            <AvatarFallback>{photo.user.username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{photo.user.username}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{photo.location}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      
      <Link href={`/moments/${photo.id}`}>
        <div className="relative aspect-square">
          <Image
            src={photo.imageUrl}
            alt={photo.caption}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onLike(photo.id)}>
              <Heart className="h-5 w-5 text-gray-600 hover:text-red-500 dark:text-gray-300" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bookmark className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>
        
        <div className="mb-1 text-sm font-medium">{photo.likes} 次点赞</div>
        <div className="text-sm">
          <span className="font-medium mr-1">{photo.user.username}</span>
          <span>{photo.caption}</span>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-1">
          {photo.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              #{tag}
            </Badge>
          ))}
        </div>
        
        <Link href={`/moments/${photo.id}`}>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            查看全部 {photo.comments} 条评论
          </div>
        </Link>
        
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {new Date(photo.createdAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
        </div>
      </CardContent>
    </Card>
  )
} 