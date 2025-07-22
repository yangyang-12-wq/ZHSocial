"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Search as SearchIcon, 
  User, 
  BookOpen, 
  Calendar, 
  ShoppingBag, 
  Heart, 
  MessageCircle,
  Loader2,
  FileText,
  Clock,
  X
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import apiClient from "@/lib/api"
import { toast } from "sonner"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(query)
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>({
    all: [],
    posts: [],
    users: [],
    courses: [],
    events: [],
    market: []
  })

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    // Update URL with search query for shareable links
    const params = new URLSearchParams()
    params.set("q", searchQuery)
    router.push(`/search?${params.toString()}`)
    
    fetchSearchResults()
  }

  // Fetch search results
  const fetchSearchResults = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    try {
      if (activeTab === 'all') {
        // 使用通用搜索API
        const response = await apiClient.search({
          keyword: searchQuery,
          page: 1,
          limit: 10
        })
        
        if (response.success) {
          setResults({
            ...results,
            all: response.data.all || []
          })
        } else {
          toast.error(response.message || "搜索失败")
          // 如果API调用失败，使用模拟数据
          const mockResults = generateMockResults(searchQuery)
          setResults(mockResults)
        }
      } else {
        // 使用特定类型的搜索API
        let response
        switch (activeTab) {
          case 'users':
            response = await apiClient.searchUsers(searchQuery)
            if (response.success) {
              setResults({
                ...results,
                users: response.data
              })
            }
            break
          case 'posts':
            response = await apiClient.searchPosts(searchQuery)
            if (response.success) {
              setResults({
                ...results,
                posts: response.data
              })
            }
            break
          case 'courses':
            response = await apiClient.searchCourses(searchQuery)
            if (response.success) {
              setResults({
                ...results,
                courses: response.data
              })
            }
            break
          case 'events':
            response = await apiClient.searchEvents(searchQuery)
            if (response.success) {
              setResults({
                ...results,
                events: response.data
              })
            }
            break
          case 'market':
            response = await apiClient.searchMarketItems(searchQuery)
            if (response.success) {
              setResults({
                ...results,
                market: response.data
              })
            }
            break
          default:
            break
        }
        
        if (response && !response.success) {
          toast.error(response.message || "搜索失败")
          // 如果API调用失败，使用模拟数据
          const mockResults = generateMockResults(searchQuery)
          setResults({
            ...results,
            [activeTab]: mockResults[activeTab]
          })
        }
      }
    } catch (error) {
      console.error("搜索失败:", error)
      // 如果API调用失败，使用模拟数据
      const mockResults = generateMockResults(searchQuery)
      setResults(activeTab === 'all' ? mockResults : {
        ...results,
        [activeTab]: mockResults[activeTab]
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate mock search results based on query
  const generateMockResults = (query: string) => {
    const mockUsers = [
      { id: 'user1', username: '张明', avatar: '/placeholder-user.jpg', department: '计算机科学学院', followersCount: 241 },
      { id: 'user2', username: '李华', avatar: '/placeholder-user.jpg', department: '外国语学院', followersCount: 132 },
      { id: 'user3', username: '王芳', avatar: '/placeholder-user.jpg', department: '化学学院', followersCount: 97 },
    ]
    
    const mockPosts = [
      { 
        id: 'post1', 
        content: `关于校园网升级的通知：近期学校将对校园网进行升级维护，${query}相关工作将在本周末进行。`, 
        author: mockUsers[0],
        likesCount: 45,
        commentsCount: 12,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      { 
        id: 'post2', 
        content: `有没有同学对${query}相关的课程感兴趣？我们正在组织一个学习小组，欢迎加入！`, 
        author: mockUsers[1],
        likesCount: 23,
        commentsCount: 8,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      { 
        id: 'post3', 
        content: `刚刚在图书馆发现了一本关于${query}的好书，强烈推荐给大家！`, 
        author: mockUsers[2],
        likesCount: 56,
        commentsCount: 14,
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ]
    
    const mockCourses = [
      { 
        id: 'course1', 
        title: `${query}基础`, 
        instructor: '李教授',
        department: '计算机科学学院',
        rating: 4.8,
        studentsCount: 256,
        image: '/placeholder.svg'
      },
      { 
        id: 'course2', 
        title: `高级${query}研究方法`, 
        instructor: '张教授',
        department: '信息管理学院',
        rating: 4.5,
        studentsCount: 189,
        image: '/placeholder.svg'
      }
    ]
    
    const mockEvents = [
      { 
        id: 'event1', 
        title: `${query}学术讲座`, 
        location: '图书馆报告厅',
        date: new Date(Date.now() + 86400000 * 3).toISOString(),
        attendeesCount: 45,
        image: '/placeholder.svg'
      },
      { 
        id: 'event2', 
        title: `${query}相关技能工作坊`, 
        location: '教学楼B区301',
        date: new Date(Date.now() + 86400000 * 7).toISOString(),
        attendeesCount: 28,
        image: '/placeholder.svg'
      }
    ]
    
    const mockMarketItems = [
      { 
        id: 'item1', 
        title: `二手${query}教材`, 
        price: 25,
        condition: '9成新',
        seller: mockUsers[0],
        image: '/placeholder.svg'
      },
      { 
        id: 'item2', 
        title: `${query}学习资料`, 
        price: 15,
        condition: '全新',
        seller: mockUsers[1],
        image: '/placeholder.svg'
      }
    ]
    
    // Combined results for the "all" tab
    const allResults = [
      ...mockPosts.slice(0, 1),
      ...mockUsers.slice(0, 1),
      ...mockCourses.slice(0, 1),
      ...mockEvents.slice(0, 1),
      ...mockMarketItems.slice(0, 1)
    ]
    
    return {
      all: allResults,
      posts: mockPosts,
      users: mockUsers,
      courses: mockCourses,
      events: mockEvents,
      market: mockMarketItems
    }
  }

  // Initialize search if there's a query in URL
  useEffect(() => {
    if (query) {
      setSearchQuery(query)
      fetchSearchResults()
    }
  }, [query])

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + "年前"
    
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + "月前"
    
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + "天前"
    
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + "小时前"
    
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + "分钟前"
    
    return Math.floor(seconds) + "秒前"
  }

  // Format future time for events
  const getEventTimeDisplay = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return "今天 " + date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0')
    }
    
    // Tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === tomorrow.toDateString()) {
      return "明天 " + date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0')
    }
    
    // Within a week
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    if (date < nextWeek) {
      const days = ['日', '一', '二', '三', '四', '五', '六']
      return "周" + days[date.getDay()] + " " + date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0')
    }
    
    // More than a week
    return date.getFullYear() + "-" + 
      (date.getMonth() + 1).toString().padStart(2, '0') + "-" + 
      date.getDate().toString().padStart(2, '0') + " " +
      date.getHours().toString().padStart(2, '0') + ":" + 
      date.getMinutes().toString().padStart(2, '0')
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      {/* Search form */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索校园内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={handleSearch}>搜索</Button>
        </div>
      </div>

      {/* Search results */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            value="posts"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            动态
          </TabsTrigger>
          <TabsTrigger 
            value="users"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            用户
          </TabsTrigger>
          <TabsTrigger 
            value="courses"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            课程
          </TabsTrigger>
          <TabsTrigger 
            value="events"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            活动
          </TabsTrigger>
          <TabsTrigger 
            value="market"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            闲置
          </TabsTrigger>
        </TabsList>

        {/* Loading state */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Display results */}
            {!searchQuery.trim() ? (
              <div className="py-16 text-center">
                <SearchIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">搜索校园内容</h3>
                <p className="text-muted-foreground/70">输入关键词搜索动态、用户、课程、活动或闲置物品</p>
              </div>
            ) : results[activeTab]?.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">未找到相关结果</h3>
                <p className="text-muted-foreground/70">尝试使用其他关键词搜索</p>
              </div>
            ) : (
              <>
                {/* All tab */}
                <TabsContent value="all" className="mt-6 space-y-6">
                  {results.all.length > 0 && (
                    <div className="space-y-4">
                      {results.all.map((item: any, index: number) => {
                        // User result
                        if (item.username) {
                          return (
                            <Link href={`/profile/${item.id}`} key={`all-user-${item.id}`}>
                              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                      <AvatarImage src={item.avatar} alt={item.username} />
                                      <AvatarFallback>{item.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="font-medium">{item.username}</div>
                                      <div className="text-sm text-muted-foreground">{item.department}</div>
                                      <div className="text-xs text-muted-foreground mt-1">{item.followersCount} 粉丝</div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                      <User className="h-4 w-4 mr-1" />
                                      查看
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        }
                        
                        // Post result
                        if (item.content) {
                          return (
                            <Link href={`/post/${item.id}`} key={`all-post-${item.id}`}>
                              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={item.author.avatar} alt={item.author.username} />
                                      <AvatarFallback>{item.author.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center">
                                        <span className="font-medium">{item.author.username}</span>
                                        <span className="mx-1 text-muted-foreground">·</span>
                                        <span className="text-xs text-muted-foreground">{getRelativeTime(item.createdAt)}</span>
                                      </div>
                                      <p className="mt-1">{item.content}</p>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <MessageCircle className="h-3.5 w-3.5" />
                                          {item.commentsCount}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Heart className="h-3.5 w-3.5" />
                                          {item.likesCount}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        }
                        
                        // Course result
                        if (item.instructor) {
                          return (
                            <Link href={`/course-radar/${item.id}`} key={`all-course-${item.id}`}>
                              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex gap-3">
                                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                                      <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{item.title}</div>
                                      <div className="text-sm text-muted-foreground">{item.instructor} · {item.department}</div>
                                      <div className="flex items-center mt-1">
                                        <div className="text-amber-500">★★★★★</div>
                                        <span className="text-xs ml-1">{item.rating}</span>
                                        <span className="text-xs text-muted-foreground ml-2">{item.studentsCount} 学生</span>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                      <BookOpen className="h-4 w-4 mr-1" />
                                      查看
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        }
                        
                        // Event result
                        if (item.location) {
                          return (
                            <Link href={`/events/${item.id}`} key={`all-event-${item.id}`}>
                              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex gap-3">
                                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                                      <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{item.title}</div>
                                      <div className="text-sm text-muted-foreground">{item.location}</div>
                                      <div className="flex items-center text-xs mt-1">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                                        <span>{getEventTimeDisplay(item.date)}</span>
                                        <span className="text-muted-foreground ml-2">{item.attendeesCount} 人参与</span>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      查看
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        }
                        
                        // Market item result
                        if (item.price) {
                          return (
                            <Link href={`/marketplace/${item.id}`} key={`all-market-${item.id}`}>
                              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex gap-3">
                                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                                      <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{item.title}</div>
                                      <div className="text-sm">
                                        <span className="font-semibold text-red-600">¥{item.price}</span>
                                        <Badge variant="outline" className="ml-2">{item.condition}</Badge>
                                      </div>
                                      <div className="flex items-center text-xs mt-1">
                                        <span className="text-muted-foreground">卖家: {item.seller.username}</span>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                      <ShoppingBag className="h-4 w-4 mr-1" />
                                      查看
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        }
                        
                        return null
                      })}
                    </div>
                  )}
                </TabsContent>
                
                {/* Posts tab */}
                <TabsContent value="posts" className="mt-6 space-y-4">
                  {results.posts.map((post: any) => (
                    <Link href={`/post/${post.id}`} key={post.id}>
                      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.author.avatar} alt={post.author.username} />
                              <AvatarFallback>{post.author.username[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-medium">{post.author.username}</span>
                                <span className="mx-1 text-muted-foreground">·</span>
                                <span className="text-xs text-muted-foreground">{getRelativeTime(post.createdAt)}</span>
                              </div>
                              <p className="mt-1">{post.content}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  {post.commentsCount}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3.5 w-3.5" />
                                  {post.likesCount}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </TabsContent>
                
                {/* Users tab */}
                <TabsContent value="users" className="mt-6 space-y-4">
                  {results.users.map((user: any) => (
                    <Link href={`/profile/${user.id}`} key={user.id}>
                      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar} alt={user.username} />
                              <AvatarFallback>{user.username[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">{user.department}</div>
                              <div className="text-xs text-muted-foreground mt-1">{user.followersCount} 粉丝</div>
                            </div>
                            <Button size="sm" variant="outline">
                              <User className="h-4 w-4 mr-1" />
                              查看
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </TabsContent>
                
                {/* Courses tab */}
                <TabsContent value="courses" className="mt-6 space-y-4">
                  {results.courses.map((course: any) => (
                    <Link href={`/course-radar/${course.id}`} key={course.id}>
                      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                              <Image
                                src={course.image}
                                alt={course.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{course.title}</div>
                              <div className="text-sm text-muted-foreground">{course.instructor} · {course.department}</div>
                              <div className="flex items-center mt-1">
                                <div className="text-amber-500">★★★★★</div>
                                <span className="text-xs ml-1">{course.rating}</span>
                                <span className="text-xs text-muted-foreground ml-2">{course.studentsCount} 学生</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <BookOpen className="h-4 w-4 mr-1" />
                              查看
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </TabsContent>
                
                {/* Events tab */}
                <TabsContent value="events" className="mt-6 space-y-4">
                  {results.events.map((event: any) => (
                    <Link href={`/events/${event.id}`} key={event.id}>
                      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                              <Image
                                src={event.image}
                                alt={event.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-muted-foreground">{event.location}</div>
                              <div className="flex items-center text-xs mt-1">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                                <span>{getEventTimeDisplay(event.date)}</span>
                                <span className="text-muted-foreground ml-2">{event.attendeesCount} 人参与</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <Calendar className="h-4 w-4 mr-1" />
                              查看
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </TabsContent>
                
                {/* Market tab */}
                <TabsContent value="market" className="mt-6 space-y-4">
                  {results.market.map((item: any) => (
                    <Link href={`/marketplace/${item.id}`} key={item.id}>
                      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-sm">
                                <span className="font-semibold text-red-600">¥{item.price}</span>
                                <Badge variant="outline" className="ml-2">{item.condition}</Badge>
                              </div>
                              <div className="flex items-center text-xs mt-1">
                                <span className="text-muted-foreground">卖家: {item.seller.username}</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <ShoppingBag className="h-4 w-4 mr-1" />
                              查看
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </TabsContent>
              </>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
} 