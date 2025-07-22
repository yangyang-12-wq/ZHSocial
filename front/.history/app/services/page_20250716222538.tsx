"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  BookOpen,
  Library,
  Utensils,
  Bus,
  Activity,
  FileText,
  Briefcase,
  Home,
  Star,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Info
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [services, setServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 获取服务数据
  const fetchServices = async () => {
    setIsLoading(true)
    try {
      // 在实际应用中，这里应该调用API获取服务数据
      // const response = await apiClient.getServices({
      //   category: activeTab !== "all" ? activeTab : undefined,
      //   keyword: searchQuery || undefined
      // })
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟数据
      const mockServices = [
        {
          id: 1,
          title: "图书馆预约",
          description: "预约图书馆座位、研讨室和自习室",
          icon: Library,
          color: "bg-blue-100 text-blue-700",
          category: "academic",
          url: "/services/library",
          status: "可用",
          openHours: "8:00 - 22:00",
          location: "校园中心区",
          contact: "0371-6789xxxx",
          rating: 4.8
        },
        {
          id: 2,
          title: "食堂点餐",
          description: "线上预订校园食堂餐食，避免排队等待",
          icon: Utensils,
          color: "bg-orange-100 text-orange-700",
          category: "daily",
          url: "/services/dining",
          status: "可用",
          openHours: "6:30 - 20:00",
          location: "各食堂",
          contact: "0371-6789xxxx",
          rating: 4.5
        },
        {
          id: 3,
          title: "校车查询",
          description: "查询校车时刻表和实时位置",
          icon: Bus,
          color: "bg-green-100 text-green-700",
          category: "transportation",
          url: "/services/shuttle",
          status: "可用",
          openHours: "7:00 - 22:00",
          location: "校园各站点",
          contact: "0371-6789xxxx",
          rating: 4.2
        },
        {
          id: 4,
          title: "体育场馆预约",
          description: "预约篮球场、足球场、游泳馆等体育设施",
          icon: Activity,
          color: "bg-red-100 text-red-700",
          category: "sports",
          url: "/services/sports",
          status: "可用",
          openHours: "9:00 - 21:00",
          location: "体育中心",
          contact: "0371-6789xxxx",
          rating: 4.6
        },
        {
          id: 5,
          title: "教务系统",
          description: "选课、成绩查询、课表查询等教务服务",
          icon: BookOpen,
          color: "bg-purple-100 text-purple-700",
          category: "academic",
          url: "/services/academic",
          status: "可用",
          openHours: "全天",
          location: "线上服务",
          contact: "0371-6789xxxx",
          rating: 4.0
        },
        {
          id: 6,
          title: "证明文件申请",
          description: "申请各类证明文件，如在读证明、成绩单等",
          icon: FileText,
          color: "bg-indigo-100 text-indigo-700",
          category: "administrative",
          url: "/services/documents",
          status: "可用",
          openHours: "9:00 - 17:00",
          location: "行政楼一楼",
          contact: "0371-6789xxxx",
          rating: 4.3
        },
        {
          id: 7,
          title: "就业信息",
          description: "查看校园招聘信息、实习岗位等就业资讯",
          icon: Briefcase,
          color: "bg-yellow-100 text-yellow-700",
          category: "career",
          url: "/services/career",
          status: "可用",
          openHours: "全天",
          location: "线上服务",
          contact: "0371-6789xxxx",
          rating: 4.7
        },
        {
          id: 8,
          title: "宿舍报修",
          description: "提交宿舍设施维修申请",
          icon: Home,
          color: "bg-teal-100 text-teal-700",
          category: "daily",
          url: "/services/dormitory",
          status: "可用",
          openHours: "8:00 - 18:00",
          location: "各宿舍楼",
          contact: "0371-6789xxxx",
          rating: 4.1
        }
      ]
      
      setServices(mockServices)
    } catch (error) {
      console.error("获取服务数据失败:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchServices()
  }, [activeTab])
  
  // 搜索处理
  const handleSearch = () => {
    fetchServices()
  }

  // 根据搜索词和分类筛选服务
  const filteredServices = services.filter(service => {
    // 根据分类筛选
    if (activeTab !== "all" && service.category !== activeTab) {
      return false
    }
    
    // 根据搜索词筛选
    if (searchQuery && !service.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !service.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    return true
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">校园服务</h1>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索服务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
      </div>

      {/* 分类标签 */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
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
            value="academic"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            学术
          </TabsTrigger>
          <TabsTrigger 
            value="daily"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            日常
          </TabsTrigger>
          <TabsTrigger 
            value="transportation"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            交通
          </TabsTrigger>
          <TabsTrigger 
            value="sports"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            体育
          </TabsTrigger>
          <TabsTrigger 
            value="administrative"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            行政
          </TabsTrigger>
          <TabsTrigger 
            value="career"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            就业
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 服务列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const IconComponent = service.icon
          return (
            <Link href={service.url} key={service.id}>
              <Card className="h-full hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${service.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <Badge variant={service.status === "可用" ? "outline" : "secondary"}>
                      {service.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{service.openHours}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{service.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{service.contact}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium">{service.rating}</span>
                    </div>
                    <Button size="sm" variant="default">
                      立即使用
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* 无结果显示 */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Info className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">未找到相关服务</h3>
          <p className="text-muted-foreground/70 mb-4">尝试使用其他关键词搜索或切换分类</p>
        </div>
      )}
    </div>
  )
} 