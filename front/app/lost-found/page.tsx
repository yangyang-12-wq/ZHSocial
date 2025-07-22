"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, MapPin, Clock, Phone, ArrowLeft, Eye, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LostFound() {
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showPostForm, setShowPostForm] = useState(false)

  const types = [
    { id: "all", name: "全部" },
    { id: "lost", name: "寻物启事" },
    { id: "found", name: "失物招领" },
  ]

  const statuses = [
    { id: "all", name: "全部状态" },
    { id: "active", name: "进行中" },
    { id: "resolved", name: "已解决" },
  ]

  const categories = ["电子产品", "证件卡片", "书籍文具", "衣物配饰", "钥匙", "其他"]

  const lostFoundItems = [
    {
      id: 1,
      type: "lost",
      title: "寻找丢失的学生卡",
      description: "昨天在图书馆丢失了学生卡，卡号末尾是1234，如有拾到请联系我，必有重谢！",
      category: "证件卡片",
      location: "图书馆3楼",
      time: "昨天 15:30",
      contact: "微信：abc123",
      author: {
        name: "着急的同学",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      status: "active",
      views: 89,
      comments: 5,
      createdAt: "2小时前",
      images: ["/placeholder.svg?height=200&width=200"],
    },
    {
      id: 2,
      type: "found",
      title: "在食堂捡到一部iPhone",
      description: "今天中午在二食堂捡到一部黑色iPhone 14，屏幕有轻微裂痕，失主请联系我。",
      category: "电子产品",
      location: "二食堂",
      time: "今天 12:30",
      contact: "QQ：987654321",
      author: {
        name: "热心同学",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      status: "active",
      views: 156,
      comments: 12,
      createdAt: "4小时前",
      images: ["/placeholder.svg?height=200&width=200"],
    },
    {
      id: 3,
      type: "lost",
      title: "丢失黑色双肩包",
      description: "包里有重要的课本和笔记本电脑，在体育馆附近丢失，非常着急！",
      category: "其他",
      location: "体育馆",
      time: "前天 16:00",
      contact: "电话：138****5678",
      author: {
        name: "焦急学生",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      status: "resolved",
      views: 234,
      comments: 8,
      createdAt: "2天前",
      images: ["/placeholder.svg?height=200&width=200"],
    },
  ]

  const filteredItems = lostFoundItems.filter((item) => {
    const matchesType = selectedType === "all" || item.type === selectedType
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesStatus && matchesSearch
  })

  const getTypeColor = (type: string) => {
    return type === "lost" ? "bg-red-500" : "bg-green-500"
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-blue-500" : "bg-gray-500"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Search className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-800">失物招领</h1>
              </div>
            </div>

            <Button
              onClick={() => setShowPostForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              发布信息
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索失物信息..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/70 backdrop-blur-sm border-0"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={item.author.avatar || "/placeholder.svg"} alt={item.author.name} />
                      <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-800">{item.author.name}</span>
                        <Badge className={`${getTypeColor(item.type)} text-white text-xs`}>
                          {item.type === "lost" ? "寻物" : "招领"}
                        </Badge>
                        <Badge className={`${getStatusColor(item.status)} text-white text-xs`}>
                          {item.status === "active" ? "进行中" : "已解决"}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">{item.createdAt}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{item.description}</p>
                </div>

                {item.images && item.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {item.images.map((image, index) => (
                      <Image
                        key={index}
                        src={image || "/placeholder.svg"}
                        alt={`${item.title} 图片 ${index + 1}`}
                        width={150}
                        height={100}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>{item.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-orange-500" />
                    <span>{item.contact}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{item.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{item.comments}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    联系TA
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无相关信息</h3>
            <p className="text-gray-500 mb-4">试试其他搜索条件或发布失物信息</p>
            <Button
              onClick={() => setShowPostForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              发布信息
            </Button>
          </div>
        )}
      </div>

      {/* Post Form Modal */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>发布失物信息</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowPostForm(false)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">信息类型</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">寻物启事</SelectItem>
                    <SelectItem value="found">失物招领</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">物品分类</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">标题</label>
                <Input placeholder="简要描述丢失/拾到的物品" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">详细描述</label>
                <Textarea placeholder="详细描述物品特征、丢失/拾到的时间地点等" rows={4} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">地点</label>
                <Input placeholder="丢失/拾到的具体地点" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">联系方式</label>
                <Input placeholder="微信号、QQ号或电话号码" />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowPostForm(false)}>
                  取消
                </Button>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  发布
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
