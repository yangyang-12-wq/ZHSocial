"use client"

import { useState, useCallback, useEffect, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { X, Upload, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  maxFiles?: number
  maxSize?: number // in bytes
  value?: File[]
  onChange?: (files: File[]) => void
  onImageUrlsChange?: (urls: string[]) => void
}

export function ImageUpload({
  maxFiles = 9,
  maxSize = 5 * 1024 * 1024, // 5MB default
  value = [],
  onChange,
  onImageUrlsChange,
}: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>(value)
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  // 生成预览URL
  const generatePreviews = useCallback((newFiles: File[]) => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') return
    
    // 释放之前的预览URL
    previews.forEach(url => URL.revokeObjectURL(url))
    
    // 创建新的预览URL
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setPreviews(newPreviews)
    
    // 如果有回调函数，传递预览URL
    if (onImageUrlsChange) {
      onImageUrlsChange(newPreviews)
    }
  }, [previews, onImageUrlsChange])

  // 初始化时生成预览
  useEffect(() => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') return
    
    if (value.length > 0) {
      generatePreviews(value)
    }
    
    // 组件卸载时清理预览URL
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url))
    }
  }, []) // 仅在组件挂载时执行一次

  // 处理文件上传
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') return
    
    setError(null)
    
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    
    const selectedFiles = Array.from(e.target.files)
    
    // 验证文件类型
    const invalidFiles = selectedFiles.filter(file => {
      const fileType = file.type.toLowerCase()
      return !fileType.startsWith('image/')
    })
    
    if (invalidFiles.length > 0) {
      setError(`只能上传图片文件`)
      return
    }
    
    // 验证文件大小
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      setError(`图片大小不能超过 ${Math.round(maxSize / (1024 * 1024))}MB`)
      return
    }
    
    // 检查文件数量限制
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`最多只能上传${maxFiles}张图片`)
      return
    }
    
    // 更新文件列表
    const newFiles = [...files, ...selectedFiles]
    setFiles(newFiles)
    generatePreviews(newFiles)
    
    // 调用外部onChange回调
    if (onChange) {
      onChange(newFiles)
    }
    
    // 重置input，允许重复选择相同文件
    e.target.value = ''
  }

  // 移除图片
  const removeImage = (index: number) => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') return
    
    // 释放被移除图片的URL
    URL.revokeObjectURL(previews[index])
    
    // 更新状态
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    
    setFiles(newFiles)
    setPreviews(newPreviews)
    
    // 调用外部回调
    if (onChange) {
      onChange(newFiles)
    }
    
    if (onImageUrlsChange) {
      onImageUrlsChange(newPreviews)
    }
  }

  // 拖放相关事件处理
  const handleDragEnter = (e: React.DragEvent) => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') return
    
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') return
    
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') return
    
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') return
    
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      
      // 验证是否为图片
      const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'))
      
      if (imageFiles.length === 0) {
        setError('请上传图片文件')
        return
      }
      
      // 验证文件大小
      const validSizeFiles = imageFiles.filter(file => file.size <= maxSize)
      
      if (validSizeFiles.length < imageFiles.length) {
        setError(`图片大小不能超过 ${Math.round(maxSize / (1024 * 1024))}MB`)
      }
      
      // 检查文件数量限制
      if (files.length + validSizeFiles.length > maxFiles) {
        const allowedCount = maxFiles - files.length
        const newValidFiles = validSizeFiles.slice(0, allowedCount)
        
        setError(`已达到最大上传数量，只添加了 ${newValidFiles.length} 张图片`)
        
        // 更新文件列表
        const newFiles = [...files, ...newValidFiles]
        setFiles(newFiles)
        generatePreviews(newFiles)
        
        // 调用外部onChange回调
        if (onChange) {
          onChange(newFiles)
        }
      } else {
        // 更新文件列表
        const newFiles = [...files, ...validSizeFiles]
        setFiles(newFiles)
        generatePreviews(newFiles)
        
        // 调用外部onChange回调
        if (onChange) {
          onChange(newFiles)
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* 图片预览区域 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((previewUrl, index) => (
            <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
              <Image
                src={previewUrl}
                alt={`上传图片 ${index + 1}`}
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 上传区域 */}
      {files.length < maxFiles && (
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input 
            id="file-upload"
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleFileChange} 
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            {isDragActive ? (
              <>
                <Upload className="h-10 w-10 text-primary animate-bounce" />
                <p className="text-primary font-medium">松开鼠标上传图片</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-gray-400" />
                <div>
                  <p className="text-gray-600 font-medium">拖放图片到此处，或点击上传</p>
                  <p className="text-gray-500 text-sm mt-1">
                    支持 JPG, PNG, GIF, WEBP 格式，每张图片不超过 {Math.round(maxSize / (1024 * 1024))}MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}

      {/* 上传状态 */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>
          已上传 {files.length} / {maxFiles} 张图片
        </span>
        {files.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              // 确保在客户端环境中执行
              if (typeof window === 'undefined') return
              
              // 释放所有预览URL
              previews.forEach(url => URL.revokeObjectURL(url))
              
              // 重置状态
              setFiles([])
              setPreviews([])
              setError(null)
              
              // 调用外部回调
              if (onChange) {
                onChange([])
              }
              
              if (onImageUrlsChange) {
                onImageUrlsChange([])
              }
            }}
          >
            清空全部
          </Button>
        )}
      </div>
    </div>
  )
}