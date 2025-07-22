"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingBag,
  Heart,
  MessageCircle,
  ArrowLeft,
  Share2,
  Eye,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import apiClient from "@/lib/api"
import { MarketItem } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { ChatDialog } from "@/components/ui/chat-dialog"

export default function MarketItemDetail() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [item, setItem] = useState<MarketItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  
  // 模拟数据 - 实际应用中应该从API获取
  const mockItem: MarketItem = {
    id: params.id as string,
    title: "MacBook Air M1 13寸",
    description: "毕业出售，使用一年，保护很好，配件齐全。电池健康度95%，无磕碰划痕，原装充电器，赠送保护壳和屏幕膜。适合学生党使用，性能强劲，续航出色。因为已经购入新的电脑，所以出售这台，价格可小刀。",
    price: 6800,
    originalPrice: 8999,
    category: "electronics",
    condition: "9成新",
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600&text=图片2",
      "/placeholder.svg?height=400&width=600&text=图片3",
    ],
    sellerId: "user123",
    seller: {
      id: "user123",
      username: "数码达人",
      email: "digital@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      bio: "热爱数码产品，喜欢尝试各种新科技",
      isVerified: true,
      lastActiveAt: "2023-05-15T08:30:00Z",
      role: "user",
      createdAt: "2022-01-10T00:00:00Z",
      updatedAt: "2023-05-15T08:30:00Z",
    },
    location: "北校区",
    tags: ["笔记本电脑", "苹果", "M1", "轻薄本"],
    status: "available",
    views: 128,
    favorites: 25,
    createdAt: "2023-05-10T00:00:00Z",
    updatedAt: "2023-05-10T00:00:00Z",
  }

  // 相似商品数据
  const similarItems = [
    {
      id: "2",
      title: "iPad Pro 11寸 2021款",
      price: 5200,
      originalPrice: 6799,
      condition: "9成新",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "3",
      title: "MacBook Pro 14寸 M1 Pro",
      price: 12500,
      originalPrice: 14999,
      condition: "95%新",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "4",
      title: "AirPods Pro 二代",
      price: 1200,
      originalPrice: 1899,
      condition: "8成新",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  useEffect(() => {
    // 实际应用中应该从API获取数据
    // const apiClient = new ApiClient();
    // apiClient.getMarketItem(params.id as string)
    //   .then(response => {
    //     if (response.success && response.data) {
    //       setItem(response.data);
    //     } else {
    //       setError(response.message || '获取商品信息失败');
    //     }
    //   })
    //   .catch(err => {
    //     setError('获取商品信息失败: ' + err.message);
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
    
    // 使用模拟数据
    setTimeout(() => {
      setItem(mockItem);
      setLoading(false);
    }, 500);
  }, [params.id]);

  // 检查是否已收藏
  useEffect(() => {
    if (isAuthenticated && item) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, item]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await apiClient.checkFavoriteStatus(params.id as string, 'market');
      if (response.success) {
        setLiked(response.data.favorited);
      }
    } catch (error) {
      console.error("检查收藏状态失败:", error);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (item?.images.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (item?.images.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录再收藏");
      return;
    }

    try {
      // 乐观更新UI
      setLiked(!liked);
      
      // 调用API
      if (liked) {
        await apiClient.unfavoriteItem(params.id as string, 'market');
        toast.success("已取消收藏");
      } else {
        await apiClient.favoriteItem(params.id as string, 'market');
        toast.success("收藏成功");
      }
    } catch (error) {
      console.error("收藏操作失败:", error);
      
      // 如果API调用失败，恢复原状态
      setLiked(!liked);
      toast.error("操作失败，请稍后再试");
    }
  };

  const handleShare = () => {
    // 实现分享功能
    if (navigator.share) {
      navigator.share({
        title: item?.title || '商品分享',
        text: item?.description || '',
        url: window.location.href,
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  const handleContact = () => {
    if (!isAuthenticated) {
      toast.error("请先登录再联系卖家")
      return
    }
    
    setIsChatOpen(true)
  }

  const getConditionColor = (condition: string) => {
    if (condition.includes("9成") || condition.includes("95%")) return "text-green-600";
    if (condition.includes("8成")) return "text-blue-600";
    if (condition.includes("7成")) return "text-yellow-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">商品信息获取失败</h2>
          <p className="text-muted-foreground mb-6">{error || '找不到该商品信息'}</p>
          <Button onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回商品列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 pl-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧: 图片展示 */}
        <div className="lg:col-span-2">
          <div className="relative aspect-[4/3] bg-black/5 rounded-lg mb-4">
            <Image
              src={item.images[currentImageIndex]}
              alt={item.title}
              fill
              className="rounded-lg object-contain"
            />
            {item.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 h-8 w-8 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 h-8 w-8 rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* 缩略图预览 */}
          {item.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {item.images.map((image, index) => (
                <div
                  key={index}
                  className={`relative w-16 h-16 cursor-pointer rounded-md overflow-hidden ${
                    currentImageIndex === index ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <Image
                    src={image}
                    alt={`${item.title} - ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 产品详情 */}
          <div className="mt-6">
            <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
            
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-2xl font-bold text-red-600">¥{item.price}</span>
              {item.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">¥{item.originalPrice}</span>
              )}
              <Badge variant="outline" className={getConditionColor(item.condition)}>
                {item.condition}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {item.location}
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {item.views} 浏览
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(item.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <h3 className="font-medium">详情描述</h3>
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {item.description}
              </p>
            </div>

            <Separator className="my-6" />

            {/* 标签 */}
            {item.tags && item.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="mr-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧: 卖家信息与操作 */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">卖家信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 mb-4">
                <Avatar>
                  <AvatarImage src={item.seller?.avatar} alt={item.seller?.username} />
                  <AvatarFallback>{item.seller?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{item.seller?.username}</div>
                  <div className="text-xs text-muted-foreground">活跃于 {new Date(item.seller?.lastActiveAt || "").toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="mb-4 text-sm">
                <p className="text-muted-foreground">{item.seller?.bio || "这个用户很懒，还没有填写个人简介"}</p>
              </div>
              
              <Button className="w-full mb-2" onClick={handleContact}>
                <MessageCircle className="h-4 w-4 mr-2" />
                联系卖家
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleLike}>
                  <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                  {liked ? "已收藏" : "收藏"}
                </Button>
                
                <Button variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  分享
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 相似商品 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">相似商品</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {similarItems.map((item) => (
                <Link 
                  href={`/marketplace/${item.id}`} 
                  key={item.id}
                  className="flex items-center gap-3 hover:bg-accent p-2 rounded-md transition-colors"
                >
                  <div className="relative h-12 w-12 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <div className="flex items-center text-xs">
                      <span className="font-bold text-red-600 mr-1">¥{item.price}</span>
                      <span className="text-muted-foreground line-through">¥{item.originalPrice}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 聊天对话框 */}
      {item && (
        <ChatDialog
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          itemId={params.id as string}
          recipientName={item.seller?.username || "卖家"}
          recipientAvatar={item.seller?.avatar}
          itemTitle={item.title}
        />
      )}
    </div>
  );
}