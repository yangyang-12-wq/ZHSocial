"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  MessageCircle,
  Heart,
  Share2,
  Eye,
  Users,
  Search,
  Plus,
  Filter,
  Loader2,
  BookOpen,
  Calendar,
  Megaphone,
  Image as ImageIcon,
  Smile,
  PenTool
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Post, ApiResponse } from "@/lib/types"

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  // 获取社区内容
  const fetchCommunityContent = async () => {
    setIsLoading(true);
    try {
      const response = await api.searchPosts(searchQuery, {
        page: 1,
        limit: 20,
      });

      // Handle the response correctly based on the API structure
      if (response && Array.isArray(response)) {
        // If response is already an array, use it directly
        setPosts(response);
      } else if (response && typeof response === 'object') {
        // If response is an ApiResponse object
        const apiResponse = response as ApiResponse<Post[]>;
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          setPosts(apiResponse.data);
        } else {
          setPosts([]);
          toast.error(apiResponse.message || "获取社区内容失败");
        }
      } else {
        // Handle unexpected response format
        setPosts([]);
        toast.error("获取社区内容失败: 响应格式错误");
      }
    } catch (error) {
      console.error("获取社区内容失败:", error);
      toast.error("获取社区内容失败，请检查网络连接");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityContent();
  }, [activeTab]);

  // 搜索处理
  const handleSearch = () => {
    fetchCommunityContent();
  };

  // 处理点赞
  const handleLike = async (postId: number) => {
    try {
      if (!isAuthenticated) {
        toast.error("请先登录再点赞");
        return;
      }

      const isLiked = likedPosts.has(postId);

      setLikedPosts((prev) => {
        const newLiked = new Set(prev);
        if (isLiked) {
          newLiked.delete(postId);
        } else {
          newLiked.add(postId);
        }
        return newLiked;
      });

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                stats: { ...post.stats, likes: isLiked ? post.stats.likes - 1 : post.stats.likes + 1 },
              }
            : post
        )
      );

      if (isLiked) {
        await api.unlikePost(String(postId));
      } else {
        await api.likePost(String(postId));
      }
    } catch (error) {
      console.error("点赞失败:", error);
      toast.error("点赞失败，请稍后再试");
      // Revert UI changes on failure
      setLikedPosts((prev) => {
        const newLiked = new Set(prev);
        if (newLiked.has(postId)) {
          newLiked.delete(postId);
        } else {
          newLiked.add(postId);
        }
        return newLiked;
      });
      fetchCommunityContent(); // Refetch to get latest state
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "搭子广场":
        return "from-green-500 to-emerald-600"
      case "课程雷达":
        return "from-green-500 to-teal-600"
      case "郑大闲鱼":
        return "from-orange-500 to-red-600"
      case "匿名树洞":
        return "from-purple-500 to-pink-600"
      case "失物招领":
        return "from-indigo-500 to-blue-600"
      case "活动日历":
        return "from-pink-500 to-rose-600"
      default:
        return "from-blue-500 to-purple-600"
    }
  }

  // 根据搜索词过滤帖子
  const filteredPosts = posts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">社区动态</h1>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="搜索帖子..."
                  className="w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button size="sm" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="搭子广场">搭子广场</TabsTrigger>
                <TabsTrigger value="课程雷达">课程雷达</TabsTrigger>
                <TabsTrigger value="郑大闲鱼">郑大闲鱼</TabsTrigger>
                <TabsTrigger value="匿名树洞">匿名树洞</TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="space-y-4">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={post.author.avatar_url} />
                          <AvatarFallback>
                            {post.author.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{post.author.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(post.time)}
                              </p>
                            </div>
                            <Badge variant="secondary">{post.category}</Badge>
                          </div>
                          <h2 className="text-lg font-semibold my-2">
                            {post.title}
                          </h2>
                          <p className="text-sm text-muted-foreground mb-3">
                            {post.content}
                          </p>
                          {post.image && (
                            <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                              <Image
                                src={post.image}
                                alt={post.title}
                                layout="fill"
                                objectFit="cover"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <button
                                className={`flex items-center gap-1 ${
                                  likedPosts.has(post.id) ? "text-red-500" : ""
                                }`}
                                onClick={() => handleLike(post.id)}
                              >
                                <Heart className="h-4 w-4" /> {post.stats.likes}
                              </button>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />{" "}
                                {post.stats.comments}
                              </div>
                              <div className="flex items-center gap-1">
                                <Share2 className="h-4 w-4" /> {post.stats.shares}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" /> {post.stats.views}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>热门话题</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  热门话题功能正在开发中...
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>通知公告</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  暂无最新通知。
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
} 