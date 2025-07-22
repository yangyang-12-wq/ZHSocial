"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Heart,
  MessageCircle,
  BookOpen,
  Laptop,
  Bike,
  Home,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import apiClient from "@/lib/api"
import { MarketItem, ApiResponse } from "@/lib/types"

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marketItems, setMarketItems] = useState<MarketItem[]>([])

  const categories = [
    { id: "all", name: "全部", icon: ShoppingBag, color: "bg-gray-500" },
    { id: "books", name: "书籍", icon: BookOpen, color: "bg-blue-500" },
    { id: "electronics", name: "电子产品", icon: Laptop, color: "bg-green-500" },
    { id: "bikes", name: "自行车", icon: Bike, color: "bg-orange-500" },
    { id: "daily", name: "生活用品", icon: Home, color: "bg-purple-500" },
  ]

  // 搜索处理
  const handleSearch = () => {
    fetchMarketItems();
  };

  // 获取闲置物品数据
  const fetchMarketItems = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getMarketItems({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        keyword: searchQuery || undefined,
      })
      
      if (response.success) {
        // 处理不同的API响应格式
        let items: MarketItem[] = [];
        
        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // 使用类型断言处理可能包含items属性的对象
          const dataWithItems = response.data as { items?: MarketItem[] };
          if (dataWithItems.items && Array.isArray(dataWithItems.items)) {
            items = dataWithItems.items;
          } else {
            // 尝试将整个对象作为单个MarketItem处理
            items = [response.data as unknown as MarketItem];
          }
        }
        
        setMarketItems(items);
        setError(null);
      } else {
        setError("获取闲置物品列表失败")
        console.error("获取闲置物品失败:", response.message)
      }
    } catch (err) {
      setError("获取闲置物品列表失败")
      console.error("获取闲置物品出错:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    fetchMarketItems()
  }, [selectedCategory])

  // 过滤商品列表
  const filteredItems = marketItems.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) {
      return false
    }
    
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    return true
  })

  const getConditionColor = (condition: string) => {
    if (condition.includes("9成")) return "text-green-600"
    if (condition.includes("8成")) return "text-blue-600"
    if (condition.includes("7成")) return "text-yellow-600"
    return "text-gray-600"
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page title and publish button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">闲置市场</h1>
        </div>

        <Link href="/marketplace/publish">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            发布闲置
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索闲置物品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button size="sm" onClick={handleSearch}>
            搜索
          </Button>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? `${category.color} text-white` : ""}
              >
                <IconComponent className="h-4 w-4 mr-1" />
                {category.name}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载闲置物品中...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <p className="text-red-500 font-medium mb-2">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            重试
          </Button>
        </div>
      )}

      {/* Items Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Link href={`/marketplace/${item.id}`} key={item.id}>
              <Card
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
              >
              <div className="relative">
                <Image
                  src={item.images?.[0] || "/placeholder.svg"}
                  alt={item.title}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-white/80 hover:bg-white">
                  <Heart className="h-4 w-4" />
                </Button>
                <Badge className="absolute top-2 left-2 bg-white/90 text-gray-800">{item.location}</Badge>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{item.title}</h3>

                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl font-bold text-red-600">¥{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">¥{item.originalPrice}</span>
                  )}
                  <Badge variant="outline" className={getConditionColor(item.condition)}>
                    {item.condition}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={item.seller?.avatar || "/placeholder-user.jpg"} alt={item.seller?.username || "卖家"} />
                      <AvatarFallback className="text-xs">{(item.seller?.username || "卖家")[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">{item.seller?.username || "匿名卖家"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-3">
                    <span>{item.favorites || 0} 喜欢</span>
                    <span>{item.views || 0} 浏览</span>
                  </div>
                  <span>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>

                <Button className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  联系卖家
                </Button>
              </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">暂无相关物品</h3>
          <p className="text-muted-foreground/70 mb-4">试试其他搜索条件或发布你的闲置物品</p>
          <Link href="/marketplace/publish">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              发布闲置
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
