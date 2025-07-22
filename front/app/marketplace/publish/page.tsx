"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, X, Upload, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import apiClient from "@/lib/api"
import { CreateMarketItemRequest } from "@/lib/types"
import { ImageUpload } from "@/components/ui/image-upload"

// 表单验证模式
const formSchema = z.object({
  title: z.string().min(2, "标题至少需要2个字符").max(100, "标题不能超过100个字符"),
  description: z.string().min(10, "描述至少需要10个字符").max(1000, "描述不能超过1000个字符"),
  price: z.coerce.number().min(0, "价格不能为负数"),
  originalPrice: z.coerce.number().min(0, "原价不能为负数").optional(),
  category: z.string().min(1, "请选择商品分类"),
  condition: z.string().min(1, "请选择商品新旧程度"),
  location: z.string().min(1, "请选择交易地点"),
  tags: z.string().optional(),
})

export default function PublishMarketItem() {
  const router = useRouter()
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [conditionValue, setConditionValue] = useState<number[]>([80])

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      originalPrice: 0,  // Change from undefined to 0
      category: "",
      condition: "8成新",
      location: "",
      tags: "",
    },
  })

  // 处理图片变更
  const handleImagesChange = (files: File[]) => {
    setImages(files)
  }
  
  // 处理图片URL变更
  const handleImageUrlsChange = (urls: string[]) => {
    setImageUrls(urls)
  }

  // 添加标签
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags(prev => [...prev, tagInput.trim()])
      setTagInput("")
      form.setValue("tags", [...tags, tagInput.trim()].join(","))
    }
  }

  // 移除标签
  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag)
    setTags(newTags)
    form.setValue("tags", newTags.join(","))
  }

  // 处理标签输入框按键事件
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    }
  }

  // 更新新旧程度
  const updateCondition = (value: number[]) => {
    setConditionValue(value)
    let conditionText = "";
    const val = value[0];
    
    if (val >= 95) conditionText = "全新";
    else if (val >= 90) conditionText = "9.5成新";
    else if (val >= 80) conditionText = "8成新";
    else if (val >= 70) conditionText = "7成新";
    else if (val >= 60) conditionText = "6成新";
    else conditionText = "5成新及以下";
    
    form.setValue("condition", conditionText);
  }

  // 获取新旧程度对应的颜色
  const getConditionColor = (value: number) => {
    if (value >= 90) return "bg-green-500";
    if (value >= 80) return "bg-blue-500";
    if (value >= 70) return "bg-yellow-500";
    if (value >= 60) return "bg-orange-500";
    return "bg-red-500";
  }

  // 表单提交
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (images.length === 0) {
      alert("请至少上传一张商品图片")
      return
    }

    setUploading(true)

    try {
      // 上传图片
      const uploadedImageUrls: string[] = [];
      
      for (const image of images) {
        try {
          const formData = new FormData();
          formData.append('file', image);
          formData.append('type', 'marketplace');
          
          const response = await apiClient.uploadFile(image, 'marketplace');
          if (response.success && response.data) {
            uploadedImageUrls.push(response.data.url);
          }
        } catch (uploadError) {
          console.error("上传图片失败:", uploadError);
          // 继续处理下一张图片，不中断整个上传流程
        }
      }
      
      // 如果没有成功上传图片使用已有的图片URL
      const finalImageUrls = uploadedImageUrls.length > 0 ? uploadedImageUrls : imageUrls;
      
      // 创建商品请求
      const marketItemRequest: CreateMarketItemRequest = {
        title: values.title,
        description: values.description,
        price: values.price,
        originalPrice: values.originalPrice,
        category: values.category,
        condition: values.condition,
        location: values.location,
        tags: tags,
        images: finalImageUrls,
      }

      // 发送创建商品请求
      const createResponse = await apiClient.createMarketItem(marketItemRequest);
      if (createResponse.success) {
        router.push(`/marketplace/${createResponse.data.id}`);
      } else {
        alert(`创建商品失败: ${createResponse.message}`);
      }
    } catch (error) {
      console.error("发布商品失败:", error);
      setUploading(false);
      alert("发布商品失败，请稍后重试");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/marketplace">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">发布闲置</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* 图片上传区域 */}
                <div className="space-y-2">
                  <FormLabel>商品图片</FormLabel>
                  <ImageUpload 
                    maxFiles={9}
                    maxSize={5 * 1024 * 1024} // 5MB
                    value={images}
                    onChange={handleImagesChange}
                    onImageUrlsChange={handleImageUrlsChange}
                  />
                  <FormDescription>
                    最多上传9张图片，第一张将作为商品主图，建议使用清晰的实物照片
                  </FormDescription>
                </div>

                <Separator />

                {/* 基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>商品标题</FormLabel>
                          <FormControl>
                            <Input placeholder="简洁描述您的商品" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>售价 (¥)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="originalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>原价 (¥)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" placeholder="选填" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>商品分类</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择分类" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="electronics">电子产品</SelectItem>
                            <SelectItem value="books">图书教材</SelectItem>
                            <SelectItem value="clothing">服饰鞋包</SelectItem>
                            <SelectItem value="daily">日用百货</SelectItem>
                            <SelectItem value="sports">运动户外</SelectItem>
                            <SelectItem value="beauty">美妆护肤</SelectItem>
                            <SelectItem value="furniture">家具家电</SelectItem>
                            <SelectItem value="tickets">票券卡劵</SelectItem>
                            <SelectItem value="others">其他闲置</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>交易地点</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择地点" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="north">北校区</SelectItem>
                            <SelectItem value="south">南校区</SelectItem>
                            <SelectItem value="east">东校区</SelectItem>
                            <SelectItem value="west">西校区</SelectItem>
                            <SelectItem value="center">中心校区</SelectItem>
                            <SelectItem value="other">校外</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>新旧程度</FormLabel>
                          <div className="space-y-4">
                            <div className="pt-4">
                              <Slider
                                defaultValue={conditionValue}
                                max={100}
                                min={50}
                                step={5}
                                onValueChange={updateCondition}
                                className={getConditionColor(conditionValue[0])}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>5成新及以下</span>
                              <span>6成新</span>
                              <span>7成新</span>
                              <span>8成新</span>
                              <span>9成新</span>
                              <span>全新</span>
                            </div>
                            <FormControl>
                              <Input {...field} className="hidden" readOnly />
                            </FormControl>
                            <div className="text-center font-medium text-lg">
                              {form.getValues().condition}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>商品描述</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="详细描述商品的品牌、型号、使用情况、入手渠道、转手原因等信息"
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>标签</FormLabel>
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="px-3 py-1">
                                  {tag}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1"
                                    onClick={() => removeTag(tag)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                              {tags.length < 5 && (
                                <div className="flex items-center">
                                  <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="添加标签"
                                    className="w-32 h-8"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 ml-1"
                                    onClick={addTag}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <FormControl>
                              <Input {...field} className="hidden" readOnly />
                            </FormControl>
                            <FormDescription>
                              最多添加5个标签，按回车或逗号确认添加
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/marketplace")}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        发布中...
                      </>
                    ) : (
                      <>发布商品</>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}