"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Heart, MessageSquare, ArrowLeft, Send, Smile, Frown, Meh, Angry, Laugh } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import type { Confession, ApiResponse } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface PaginatedConfessions {
  items: Confession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Confession() {
  const [newPost, setNewPost] = useState("")
  const [selectedMood, setSelectedMood] = useState("")
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [moods, setMoods] = useState<{ id: string; name: string; icon: React.ElementType; color: string }[]>([])

  const moodDetails: { [key: string]: { icon: React.ElementType; color: string } } = {
    happy: { icon: Smile, color: "bg-yellow-500" },
    sad: { icon: Frown, color: "bg-blue-500" },
    angry: { icon: Angry, color: "bg-red-500" },
    confused: { icon: Meh, color: "bg-gray-500" },
    excited: { icon: Laugh, color: "bg-green-500" },
    default: { icon: Smile, color: "bg-gray-500" },
  }

  const fetchConfessions = async () => {
    try {
      // 只有当selectedMood有值且不是空字符串时才将它作为参数传递
      const params = selectedMood ? { mood: selectedMood } : {};
      const response = await api.getConfessions(params);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        setConfessions(response);
      } else if (response && typeof response === 'object' && 'success' in response) {
        const apiResponse = response as ApiResponse<Confession[] | PaginatedConfessions>;
        if (apiResponse.success) {
          if ('items' in apiResponse.data) {
            // Handle paginated format
            setConfessions(apiResponse.data.items || []);
          } else if (Array.isArray(apiResponse.data)) {
            // Handle array format
            setConfessions(apiResponse.data);
          } else {
            toast.error("获取心声列表失败: 响应格式错误");
          }
        } else {
          toast.error("获取心声列表失败");
        }
      } else {
        toast.error("获取心声列表失败");
      }
    } catch (error) {
      console.error("获取心声列表失败:", error);
      toast.error("获取心声列表失败");
    }
  };

  const fetchMoods = async () => {
    // 不再调用后端API，直接使用硬编码的心情列表
    const defaultMoods = ["happy", "sad", "angry", "confused", "excited"];
    const formattedMoods = defaultMoods.map(mood => ({
      id: mood,
      name: mood,
      ...moodDetails[mood] || moodDetails.default,
    }));
    setMoods(formattedMoods);
  };

  useEffect(() => {
    fetchConfessions();
  }, [selectedMood]);

  useEffect(() => {
    fetchMoods();
  }, []);

  const getMoodInfo = (moodId: string) => {
    return moods.find((mood) => mood.id === moodId) || moods[0];
  };

  const handleSubmit = async () => {
    if (newPost.trim()) {
      try {
        const response = await api.createConfession({
          content: newPost,
          isAnonymous: true,
          // 前端仍然保存mood字段用于本地UI显示，但API客户端会过滤掉不支持的字段
          mood: selectedMood
        });
        
        // Handle different response formats
        if (
          (response && typeof response === 'object' && 'success' in response && response.success) ||
          (response && typeof response === 'object' && !('success' in response))
        ) {
          toast.success("发布成功！你的树洞已经发布。");
          setNewPost("");
          setSelectedMood("");
          fetchConfessions();
        } else if (response && typeof response === 'object' && 'success' in response) {
          const errorResponse = response as unknown as {success: false, message?: string};
          toast.error(errorResponse.message || "发布失败");
        } else {
          toast.error("发布失败");
        }
      } catch (error: any) {
        toast.error(error.message || "发布失败");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
                <MessageCircle className="h-6 w-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-800">匿名树洞</h1>
              </div>
            </div>

            <Badge variant="outline" className="text-purple-600 border-purple-600">
              匿名安全
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Post Creation */}
        <Card className="mb-6 bg-white/70 backdrop-blur-sm border-0">
          <CardHeader>
            <CardTitle className="text-lg">分享你的心声</CardTitle>
            <CardDescription>在这里，你可以匿名分享任何想法和感受</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="想说什么就说什么吧..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] resize-none border-2 focus:border-purple-500"
            />

            <div>
              <p className="text-sm text-gray-600 mb-2">选择心情标签（可选）：</p>
              <div className="flex flex-wrap gap-2">
                {moods.map((mood) => {
                  const IconComponent = mood.icon
                  return (
                    <Button
                      key={mood.id}
                      variant={selectedMood === mood.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMood(selectedMood === mood.id ? "" : mood.id)}
                      className={selectedMood === mood.id ? `${mood.color} text-white` : ""}
                    >
                      <IconComponent className="h-4 w-4 mr-1" />
                      {mood.name}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">{newPost.length}/500 字符</p>
              <Button
                onClick={handleSubmit}
                disabled={!newPost.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Send className="h-4 w-4 mr-2" />
                匿名发布
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confessions List */}
        <div className="space-y-4">
          {confessions.map((confession) => {
            const moodInfo = getMoodInfo(confession.mood || 'default');
            const MoodIcon = moodInfo.icon

            return (
              <Card
                key={confession.id}
                className="hover:shadow-md transition-all cursor-pointer bg-white/70 backdrop-blur-sm border-0"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className={`p-2 rounded-full ${moodInfo.color} text-white`}>
                      <MoodIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className={`${moodInfo.color} text-white border-0`}>
                          {moodInfo.name}
                        </Badge>
                        <span className="text-xs text-gray-500">{new Date(confession.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{confession.content}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm">{confession.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">{confession.comments}</span>
                      </button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                      查看评论
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {confessions.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">还没有已审核通过的心声</h3>
            <p className="text-gray-500 mb-4">新发布的帖子需要经过审核才会显示在这里</p>
            {/* 添加一个进一步的提示 */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-700 text-sm mx-auto max-w-md">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                我发布的帖子在哪里?
              </p>
              <p className="mt-1 ml-7">您发布的帖子已提交审核。审核通过后将出现在此页面。审核通常需要1-2个工作日。</p>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2">隐私保护</h4>
          <p className="text-sm text-purple-700 mb-2">
            我们承诺保护你的隐私。所有发布的内容都是完全匿名的，不会记录任何个人信息。
            请遵守社区规范，不要发布违法违规内容。
          </p>
          <p className="text-sm text-purple-700">
            <strong>提示：</strong> 所有新发布的内容都需要通过审核才会公开显示，通常审核需要1-2个工作日。
          </p>
        </div>
      </div>
    </div>
  )
}
