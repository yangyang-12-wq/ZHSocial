"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, MessageSquare, Award, Edit, Save, ArrowLeft, Eye, ThumbsUp, Star, Bell, Trash2, Image as ImageIcon, BookOpen, MoreHorizontal, Heart, MessageCircle, Share2, Link as LinkIcon, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

export default function Profile() {
  const { user, isAuthenticated, updateUser, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [userInfo, setUserInfo] = useState({
    username: "",
    studentId: "",
    major: "",
    grade: "",
    bio: "",
    avatar: "",
  })
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  // Initialize user info from auth context
  useEffect(() => {
    if (user) {
      setUserInfo({
        username: user.username || "",
        studentId: user.studentId || "",
        major: user.major || "",
        grade: user.grade || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
      })
    }
  }, [user])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated || !user) {
        // 如果用户未认证或用户数据不存在，不获取通知
        return;
      }
      
      try {
        setNotificationsLoading(true);
        
        // 先检查令牌是否存在
        const token = localStorage.getItem('token');
        if (!token) {
          console.log("获取通知失败: 未找到登录令牌");
          return;
        }
        
        const response = await api.getNotifications();
        
        // 直接使用 response，它应该是一个数组或者有 items 属性的对象
        let notifData = [];
        if (Array.isArray(response)) {
          notifData = response;
        } else if (response && typeof response === 'object' && 'items' in response) {
          notifData = response.items;
        }
        setNotifications(notifData || []);
      } catch (error) {
        console.error("获取通知失败:", error);
        // 不在UI上显示错误，静默处理
      } finally {
        setNotificationsLoading(false);
      }
    };

    // 只有当用户认证状态和用户对象都存在时才获取通知
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

  const handleSave = async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      const response = await api.updateProfile({
        major: userInfo.major,
        grade: userInfo.grade,
        bio: userInfo.bio,
        studentId: userInfo.studentId,
      })

        toast.success("个人信息更新成功")
        setIsEditing(false)
        refreshProfile() // 刷新用户数据
    } catch (error) {
      toast.error("更新个人信息失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const response = await api.uploadFile(file, 'avatar')
      
        // 更新头像URL
        await api.updateProfile({
        avatar: response.url,
        })
        
        setUserInfo(prev => ({
          ...prev,
        avatar: response.url,
        }))
        
        toast.success("头像上传成功")
        refreshProfile() // 刷新用户数据
    } catch (error) {
      toast.error("头像上传失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id)
        setNotifications(prev => 
          prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
        )
    } catch (error) {
      console.error("标记通知已读失败:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id)
        setNotifications(prev => prev.filter(notif => notif.id !== id))
        toast.success("通知已删除")
    } catch (error) {
      console.error("删除通知失败:", error)
      toast.error("删除通知失败")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "sold":
        return "bg-gray-500"
      case "closed":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "进行中"
      case "sold":
        return "已售出"
      case "closed":
        return "已关闭"
      default:
        return "未知"
    }
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">您需要登录才能访问个人中心</p>
          <Button asChild>
            <Link href="/login">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await api.logout()
      toast.success("退出登录成功")
      window.location.href = "/" // 跳转到首页
    } catch (error) {
      toast.error("退出登录失败")
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleAvatarChange}
      />
      
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
                <User className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-800">个人中心</h1>
              </div>
            </div>

            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              disabled={loading}
            >
              {loading ? (
                "处理中..."
              ) : isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑资料
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="w-full mb-6">
          <div className="relative bg-gradient-to-r from-green-400 to-emerald-600 h-48 rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-end p-6">
              <div className="flex items-end">
                <div className="relative">
                  <Avatar className={`w-28 h-28 border-4 border-white ${isEditing ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
                    <AvatarImage src={userInfo.avatar || "/placeholder-user.jpg"} alt={userInfo.username} />
                    <AvatarFallback className="text-3xl">{userInfo.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600"
                      onClick={handleAvatarClick}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="ml-4 mb-2">
                  <h2 className="text-2xl font-bold text-white">{userInfo.username}</h2>
                  <div className="flex items-center text-white/80">
                    <Badge variant="secondary" className="mr-2 bg-white/20 text-white border-0">
                      {userInfo.grade || "未设置年级"}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {userInfo.major || "未设置专业"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            {isEditing && (
              <Button
                size="sm"
                variant="outline"
                className="absolute top-4 right-4 bg-white/30 backdrop-blur-sm border-white/40 text-white hover:bg-white/40"
                onClick={() => alert('修改封面图片')}
              >
                <ImageIcon className="h-4 w-4 mr-2" /> 更换封面
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Profile Stats & Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Info Card */}
            <Card className="bg-white/70 backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">个人信息</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">学号</label>
                      <Input
                        value={userInfo.studentId}
                        onChange={(e) => setUserInfo({ ...userInfo, studentId: e.target.value })}
                        placeholder="输入学号"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">专业</label>
                      <Input
                        value={userInfo.major}
                        onChange={(e) => setUserInfo({ ...userInfo, major: e.target.value })}
                        placeholder="输入专业"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">年级</label>
                      <Input
                        value={userInfo.grade}
                        onChange={(e) => setUserInfo({ ...userInfo, grade: e.target.value })}
                        placeholder="输入年级"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">个人简介</label>
                      <Textarea
                        value={userInfo.bio}
                        onChange={(e) => setUserInfo({ ...userInfo, bio: e.target.value })}
                        placeholder="介绍一下你自己"
                        className="resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">学号</div>
                        <div className="text-gray-600">{userInfo.studentId || "未设置"}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">专业</div>
                        <div className="text-gray-600">{userInfo.major || "未设置"}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">年级</div>
                        <div className="text-gray-600">{userInfo.grade || "未设置"}</div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">个人简介</div>
                      <p className="text-gray-600 whitespace-pre-line">{userInfo.bio || "这个人很懒，还没有填写个人简介..."}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-white/70 backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">我的统计</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">24</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">发布的帖子</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">参与的活动</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">闲置商品</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">36</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">获得点赞</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges & Achievements */}
            <Card className="bg-white/70 backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">成就徽章</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 border-0 py-2 px-3">
                    <Star className="h-3 w-3 mr-1" />
                    活跃用户
                  </Badge>
                  <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 border-0 py-2 px-3">
                    <BookOpen className="h-3 w-3 mr-1" />
                    学习达人
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 border-0 py-2 px-3">
                    <Award className="h-3 w-3 mr-1" />
                    帮助之星
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area - Tabs */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="w-full bg-white/70 backdrop-blur-sm rounded-lg mb-6">
                <TabsTrigger value="activity" className="flex-1">我的动态</TabsTrigger>
                <TabsTrigger value="market" className="flex-1">我的闲置</TabsTrigger>
                <TabsTrigger value="notifications" className="flex-1">通知消息</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">设置</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-6">
                {/* Post Form */}
                <Card className="bg-white/70 backdrop-blur-sm border-0">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={userInfo.avatar || "/placeholder-user.jpg"} />
                        <AvatarFallback>{userInfo.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="分享你的想法..."
                          className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-0"
                          rows={3}
                        />
                        <div className="flex items-center justify-between pt-2 mt-2 border-t">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost">
                              <ImageIcon className="h-4 w-4 mr-1" />
                              图片
                            </Button>
                            <Button size="sm" variant="ghost">
                              <LinkIcon className="h-4 w-4 mr-1" />
                              链接
                            </Button>
                          </div>
                          <Button size="sm">
                            发布
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Timeline */}
                <div className="space-y-4">
                  {/* Activity Item 1 */}
                  <Card className="bg-white/70 backdrop-blur-sm border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={userInfo.avatar || "/placeholder-user.jpg"} />
                            <AvatarFallback>{userInfo.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{userInfo.username}</div>
                            <div className="text-xs text-gray-500">2天前</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mb-3">
                        <p className="text-gray-800">
                          终于拿到计算机网络课的A+了！这学期的努力没有白费。感谢所有帮助过我的同学们！
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex space-x-4">
                          <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                            <span>28</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                            <MessageCircle className="h-4 w-4" />
                            <span>12</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-start space-x-2 mb-3">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback>CL</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                              <div className="font-medium text-sm">陈亮</div>
                              <p className="text-sm">恭喜！你的笔记帮了我大忙</p>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <span className="mr-2">1天前</span>
                              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                                回复
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Add comment */}
                        <div className="flex items-center space-x-2 mt-3">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={userInfo.avatar || "/placeholder-user.jpg"} />
                            <AvatarFallback>{userInfo.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <Input placeholder="写下你的评论..." className="bg-gray-100 dark:bg-gray-800 border-0" />
                          <Button size="sm">发送</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Item 2 */}
                  <Card className="bg-white/70 backdrop-blur-sm border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={userInfo.avatar || "/placeholder-user.jpg"} />
                            <AvatarFallback>{userInfo.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{userInfo.username}</div>
                            <div className="text-xs text-gray-500">上周</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mb-3">
                        <p className="text-gray-800 mb-3">
                          校园里今天的日落真美，分享给大家！
                        </p>
                        <div className="rounded-lg overflow-hidden mb-2">
                          <Image
                            src="/placeholder.jpg"
                            width={600}
                            height={400}
                            alt="校园日落"
                            className="w-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex space-x-4">
                          <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                            <Heart className="h-4 w-4" />
                            <span>56</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                            <MessageCircle className="h-4 w-4" />
                            <span>8</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="market" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Market Item 1 */}
                  <Card className="bg-white/70 backdrop-blur-sm border-0 overflow-hidden">
                    <div className="relative">
                      <Image
                        src="/placeholder.jpg"
                        width={300}
                        height={200}
                        alt="商品图片"
                        className="w-full h-40 object-cover"
                      />
                      <Badge className="absolute top-2 left-2">在售</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">经济学原理第八版</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-red-600">¥40</span>
                        <Badge variant="outline">9成新</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>2023-04-15</span>
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>56次浏览</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Market Item 2 */}
                  <Card className="bg-white/70 backdrop-blur-sm border-0 overflow-hidden">
                    <div className="relative">
                      <Image
                        src="/placeholder.jpg"
                        width={300}
                        height={200}
                        alt="商品图片"
                        className="w-full h-40 object-cover"
                      />
                      <Badge className="absolute top-2 left-2" variant="secondary">已售出</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">自行车</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-red-600">¥300</span>
                        <Badge variant="outline">7成新</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>2023-03-20</span>
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>124次浏览</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                {notificationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-gray-500">加载通知中...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <Card className="bg-white/70 backdrop-blur-sm border-0">
                    <CardContent className="p-8 text-center">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-700 mb-1">暂无通知</h3>
                      <p className="text-gray-500">当有新通知时，我们会在这里通知你</p>
                    </CardContent>
                  </Card>
                ) : (
                  notifications.map((notification: any) => (
                    <Card key={notification.id} className={`bg-white/70 backdrop-blur-sm border-0 ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                      <CardContent className="p-4 flex justify-between items-start">
                        <div className="flex space-x-3">
                          {notification.type === 'system' && (
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                              <Bell className="h-4 w-4" />
                            </div>
                          )}
                          {notification.type === 'message' && (
                            <div className="bg-green-100 text-green-600 p-2 rounded-full">
                              <MessageCircle className="h-4 w-4" />
                            </div>
                          )}
                          {notification.type === 'like' && (
                            <div className="bg-red-100 text-red-600 p-2 rounded-full">
                              <Heart className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="text-gray-800">{notification.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.createdAt ? format(new Date(notification.createdAt), 'yyyy-MM-dd HH:mm') : '未知时间'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <Button size="sm" variant="ghost" onClick={() => markNotificationAsRead(notification.id)}>
                              标为已读
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => deleteNotification(notification.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="bg-white/70 backdrop-blur-sm border-0">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">账号设置</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">电子邮箱</label>
                        <Input value={user?.email} disabled />
                        <p className="text-xs text-gray-500 mt-1">电子邮箱无法修改</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">用户名</label>
                        <Input defaultValue={userInfo.username} />
                      </div>
                      <div>
                        <Button className="mr-2">修改密码</Button>
                        <Button variant="outline">更换绑定手机</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-sm border-0">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">隐私设置</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">谁可以看到我的资料</h4>
                          <p className="text-sm text-gray-500">控制谁可以查看你的个人资料信息</p>
                        </div>
                        <Select defaultValue="everyone">
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="选择可见性" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="everyone">所有人</SelectItem>
                            <SelectItem value="friends">仅好友</SelectItem>
                            <SelectItem value="none">仅自己</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">谁可以给我发消息</h4>
                          <p className="text-sm text-gray-500">控制谁可以给你发送私信</p>
                        </div>
                        <Select defaultValue="everyone">
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="选择可见性" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="everyone">所有人</SelectItem>
                            <SelectItem value="friends">仅好友</SelectItem>
                            <SelectItem value="none">禁止所有人</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-sm border-0">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">通知设置</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">私信通知</h4>
                          <p className="text-sm text-gray-500">当有人给你发送私信时通知你</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">点赞通知</h4>
                          <p className="text-sm text-gray-500">当有人点赞你的内容时通知你</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">评论通知</h4>
                          <p className="text-sm text-gray-500">当有人评论你的内容时通知你</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">系统通知</h4>
                          <p className="text-sm text-gray-500">接收平台的系统通知和更新</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 退出登录按钮 */}
                <Card className="bg-white/70 backdrop-blur-sm border-0">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">账号操作</h3>
                    <div className="space-y-4">
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        退出登录
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
