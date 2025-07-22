"use client"

import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Bell, 
  MessageCircle, 
  Heart, 
  User, 
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api"
import { toast } from "sonner"

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [activeTab, isAuthenticated])

  const fetchNotifications = async () => {
    if (!isAuthenticated) return
    
    setIsLoading(true)
    try {
      // 在实际应用中，这里应该调用API获取通知
      const response = await apiClient.getNotifications({
        page: 1,
        limit: 20,
        read: undefined // 所有通知，无论已读未读
      })
      
      // 根据标签过滤通知
      let notifData = []
      if (Array.isArray(response.data)) {
        notifData = response.data
      } else if (response.data && typeof response.data === 'object' && 'items' in response.data) {
        notifData = response.data.items
      }
      
      // 根据活动标签过滤
      if (activeTab !== "all") {
        notifData = notifData.filter(notif => notif.type === activeTab)
      }
      
      if (response.success) {
        setNotifications(notifData || [])
      } else {
        toast.error(response.message || "获取通知失败")
        // 如果API调用失败，使用模拟数据
        setNotifications(mockNotifications)
      }
    } catch (error) {
      console.error("获取通知失败:", error)
      toast.error("获取通知失败，请稍后再试")
      // 如果API调用失败，使用模拟数据
      setNotifications(mockNotifications)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      // 乐观更新UI
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
      )
      
      // 调用API
      const response = await apiClient.markNotificationRead(id)
      
      if (response.success) {
        toast.success("已标记为已读")
      } else {
        // 如果API调用失败，恢复原状态
        setNotifications(prev => 
          prev.map(notif => notif.id === id ? { ...notif, read: false } : notif)
        )
        toast.error(response.message || "标记已读失败")
      }
    } catch (error) {
      console.error("标记通知已读失败:", error)
      // 如果API调用失败，恢复原状态
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, read: false } : notif)
      )
      toast.error("标记已读失败，请稍后再试")
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      // 乐观更新UI
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      
      // 调用API
      const response = await apiClient.deleteNotification(id)
      
      if (response.success) {
        toast.success("通知已删除")
      } else {
        // 如果API调用失败，恢复原状态
        fetchNotifications() // 重新获取通知列表
        toast.error(response.message || "删除通知失败")
      }
    } catch (error) {
      console.error("删除通知失败:", error)
      // 如果API调用失败，恢复原状态
      fetchNotifications() // 重新获取通知列表
      toast.error("删除通知失败，请稍后再试")
    }
  }

  const markAllAsRead = async () => {
    try {
      // 乐观更新UI
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
      
      // 调用API
      const response = await apiClient.markAllNotificationsRead()
      
      if (response.success) {
        toast.success("已全部标记为已读")
      } else {
        // 如果API调用失败，恢复原状态
        fetchNotifications() // 重新获取通知列表
        toast.error(response.message || "标记全部已读失败")
      }
    } catch (error) {
      console.error("标记全部已读失败:", error)
      // 如果API调用失败，恢复原状态
      fetchNotifications() // 重新获取通知列表
      toast.error("标记全部已读失败，请稍后再试")
    }
  }

  // Generate mock notifications if there's no API
  const mockNotifications = [
    {
      id: "1",
      type: "message",
      content: "李明给你发送了一条私信",
      sender: {
        id: "user1",
        username: "李明",
        avatar: "/placeholder-user.jpg"
      },
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      type: "like",
      content: "王芳点赞了你的帖子 \"关于校园网络升级的建议\"",
      sender: {
        id: "user2",
        username: "王芳",
        avatar: "/placeholder-user.jpg"
      },
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "3",
      type: "system",
      content: "你的帖子已经通过审核，感谢你的参与！",
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "4",
      type: "comment",
      content: "赵强在你的帖子 \"学校食堂满意度调查\" 中发表了评论",
      sender: {
        id: "user3",
        username: "赵强",
        avatar: "/placeholder-user.jpg"
      },
      read: true,
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ]

  // Use mock data if empty (for development)
  useEffect(() => {
    if (!isLoading && notifications.length === 0) {
      setNotifications(mockNotifications)
    }
  }, [isLoading])

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(notif => notif.type === activeTab)

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">您需要登录才能查看通知</p>
          <Button asChild>
            <Link href="/login">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">通知</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            disabled={notifications.every(n => n.read)}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            全部已读
          </Button>
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
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
            value="message"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            消息
          </TabsTrigger>
          <TabsTrigger 
            value="like"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            点赞
          </TabsTrigger>
          <TabsTrigger 
            value="comment"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            评论
          </TabsTrigger>
          <TabsTrigger 
            value="system"
            className="px-4 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full 
                      after:content-[''] data-[state=active]:after:bg-primary"
          >
            系统
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">暂无通知</h3>
              <p className="text-muted-foreground/70">当有新通知时，我们会在这里通知你</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`border-0 shadow-sm hover:bg-accent/50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  {/* Notification icon */}
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    notification.type === 'message' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                    notification.type === 'like' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 
                    notification.type === 'comment' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                    'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                  }`}>
                    {notification.type === 'message' && <MessageCircle className="h-4 w-4" />}
                    {notification.type === 'like' && <Heart className="h-4 w-4" />}
                    {notification.type === 'comment' && <MessageCircle className="h-4 w-4" />}
                    {notification.type === 'system' && <Bell className="h-4 w-4" />}
                  </div>
                  
                  {/* Sender avatar for non-system messages */}
                  {notification.sender && (
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={notification.sender.avatar} alt={notification.sender.username} />
                      <AvatarFallback>{notification.sender.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.createdAt), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {!notification.read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 