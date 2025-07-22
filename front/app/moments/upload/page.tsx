"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  X,
  Camera,
  ImageIcon,
  MapPin,
  Tag,
  Smile,
  Filter as FilterIcon,
  Image as ImagePlus,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

const filters = [
  { id: 'original', name: '原图' },
  { id: 'clarendon', name: '清晰' },
  { id: 'gingham', name: '柔和' },
  { id: 'moon', name: '月光' },
  { id: 'lark', name: '云雀' },
  { id: 'reyes', name: '复古' },
  { id: 'juno', name: '鲜艳' },
]

const locations = [
  { id: 'campus-center', name: '校园中心' },
  { id: 'library', name: '图书馆' },
  { id: 'cafeteria', name: '食堂' },
  { id: 'dorm', name: '宿舍区' },
  { id: 'sports-center', name: '体育中心' },
  { id: 'teaching-building', name: '教学楼' },
  { id: 'lab-building', name: '实验楼' },
  { id: 'off-campus', name: '校外' },
]

export default function MomentUploadPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [location, setLocation] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("original")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 处理图片选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImage(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 处理标签输入
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    }
  }
  
  // 添加标签
  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    }
  }
  
  // 移除标签
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }
  
  // 提交图片
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录")
      router.push("/login")
      return
    }
    
    if (!image) {
      toast.error("请选择一张图片")
      return
    }
    
    if (!caption) {
      toast.error("请添加图片说明")
      return
    }
    
    try {
      setIsUploading(true)
      
      // 这里应该是上传图片到服务器的逻辑
      // 模拟上传过程
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success("图片上传成功！")
      router.push("/moments")
    } catch (error) {
      console.error("上传失败", error)
      toast.error("上传失败，请重试")
    } finally {
      setIsUploading(false)
    }
  }
  
  // 如果用户未登录，重定向到登录页
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Camera className="h-12 w-12 mx-auto text-blue-500 mb-2" />
              <h2 className="text-xl font-semibold mb-2">分享校园瞬间</h2>
              <p className="text-gray-500 dark:text-gray-400">登录后开始分享你的校园生活</p>
            </div>
            <Button className="w-full" onClick={() => router.push("/login")}>
              登录 / 注册
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">发布新照片</h1>
            </div>
            
            <Button 
              disabled={!image || !caption || isUploading} 
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中
                </>
              ) : "发布"}
            </Button>
          </div>
        </div>
      </header>
      
      {/* 主要内容区 */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* 图片上传区域 */}
          {!image ? (
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageChange}
              />
              <ImagePlus className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">点击上传照片</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">支持 JPG, PNG, WEBP 格式</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 已选择的图片 */}
              <div className="relative">
                <div className={`relative aspect-square rounded-lg overflow-hidden ${selectedFilter}`}>
                  <Image
                    src={image}
                    alt="Selected image"
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={() => setImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 滤镜选择区 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">滤镜</label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {filters.map((filter) => (
                    <div 
                      key={filter.id} 
                      className={`text-center cursor-pointer ${selectedFilter === filter.id ? 'ring-2 ring-blue-500 rounded-md' : ''}`}
                      onClick={() => setSelectedFilter(filter.id)}
                    >
                      <div className={`h-16 w-full ${filter.id} bg-gray-200 dark:bg-gray-700 rounded-md mb-1`}></div>
                      <span className="text-xs">{filter.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 说明和标签区域 */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="caption" className="block text-sm font-medium mb-1">说明</label>
                  <Textarea
                    id="caption"
                    placeholder="分享你的校园瞬间..."
                    rows={3}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">标签（最多5个）</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <div key={tag} className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full pl-3 pr-1 py-1">
                        <span className="text-sm mr-1">{tag}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5" 
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {tags.length < 5 && (
                    <div className="flex">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="添加标签..."
                          className="pl-9"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                        />
                      </div>
                      <Button variant="outline" className="ml-2" onClick={addTag}>添加</Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">按回车或点击添加按钮添加标签</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">位置</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="选择位置" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 