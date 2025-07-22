"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Event, ApiResponse } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface PaginatedEvents {
  items: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Events() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTime, setSelectedTime] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Ensure current date is set only on client to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  const timeFilters = [
    { id: "all", name: "全部时间" },
    { id: "today", name: "今天" },
    { id: "week", name: "本周" },
    { id: "month", name: "本月" },
  ]

  const fetchEvents = async () => {
    try {
      const response = await api.getEvents({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        keyword: searchQuery || undefined,
      });
      if (response.success) {
        const data = response.data as unknown as PaginatedEvents;
        setEvents(data.items || []);
      } else {
        toast.error("获取活动列表失败");
      }
    } catch (error) {
      console.error("获取活动列表失败:", error);
      toast.error("获取活动列表失败");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.getEventCategories();
      // Handle response as a direct string array
      if (Array.isArray(response)) {
        setCategories(["全部活动", ...response]);
      } else if (response && typeof response === 'object' && 'success' in response) {
        // Fallback for API response object format
        const apiResponse = response as ApiResponse<string[]>;
        if (apiResponse.success) {
          setCategories(["全部活动", ...apiResponse.data]);
        }
      } else {
        toast.error("获取分类列表失败");
      }
    } catch (error) {
      console.error("获取分类列表失败:", error);
      toast.error("获取分类列表失败");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, searchQuery, selectedTime]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "bg-blue-500"
      case "cultural":
        return "bg-purple-500"
      case "sports":
        return "bg-orange-500"
      case "social":
        return "bg-pink-500"
      case "career":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "text-green-600"
      case "ongoing":
        return "text-blue-600"
      case "ended":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
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
                <Calendar className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-800">活动日历</h1>
              </div>
            </div>

            {currentDate && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-green-500 text-white" : ""}
                  >
                    列表
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                    className={viewMode === "calendar" ? "bg-green-500 text-white" : ""}
                  >
                    日历
                  </Button>
                </div>
              </div>
            )}
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              发布活动
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
                placeholder="搜索活动..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category === '全部活动' ? 'all' : category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="选择时间" />
              </SelectTrigger>
              <SelectContent>
                {timeFilters.map((filter) => (
                  <SelectItem key={filter.id} value={filter.id}>
                    {filter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category.toLowerCase() ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.toLowerCase())}
                className={selectedCategory === category.toLowerCase() ? "bg-green-500 text-white" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Events List */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="flex flex-col md:flex-row overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="md:w-1/3">
                  <img
                    src={Array.isArray(event.images) ? event.images[0] : '/placeholder.jpg'}
                    alt={event.title}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-2/3">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
                      <Badge variant="outline" className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>
                          {event.enrolled} / {event.capacity}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={event.organizerUser?.avatar} alt={event.organizer} />
                          <AvatarFallback>{(event.organizer || "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{event.organizer}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex space-x-4">
                        <Button variant="ghost" size="sm">
                          <Heart className="h-4 w-4 mr-2" /> {event.likes || 0}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4 mr-2" /> {event.shares || 0}
                        </Button>
                      </div>
                      <Button asChild>
                        <Link href={`/events/${event.id}`}>查看详情</Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Card className="bg-white/70 backdrop-blur-sm border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {currentDate ? `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月` : ""}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => (
                  <div key={i} className="aspect-square border rounded-lg p-2 hover:bg-gray-50 cursor-pointer">
                    <div className="text-sm text-gray-600">{((i % 31) + 1).toString()}</div>
                    {i % 7 === 3 && (
                      <div className="mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无相关活动</h3>
            <p className="text-gray-500 mb-4">试试其他搜索条件或发布新活动</p>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              发布活动
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
