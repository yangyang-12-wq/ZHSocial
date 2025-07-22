"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"
import apiClient from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface ChatDialogProps {
  isOpen: boolean
  onClose: () => void
  sessionId?: string
  recipientId?: string
  recipientName: string
  recipientAvatar?: string
  itemId?: string
  itemTitle?: string
}

export function ChatDialog({
  isOpen,
  onClose,
  sessionId: initialSessionId,
  recipientId,
  recipientName,
  recipientAvatar,
  itemId,
  itemTitle,
}: ChatDialogProps) {
  const { user, isAuthenticated } = useAuth()
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId)
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 初始化聊天会话
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      if (sessionId) {
        // 如果已有会话ID，加载消息
        loadMessages(sessionId)
      } else if (recipientId) {
        // 如果有接收者ID，创建新会话
        createChatSession()
      } else if (itemId) {
        // 如果有商品ID，联系卖家
        contactSeller()
      }
    }
  }, [isOpen, isAuthenticated, sessionId, recipientId, itemId])

  // 滚动到最新消息
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 创建聊天会话
  const createChatSession = async () => {
    if (!recipientId) return
    
    setIsLoading(true)
    try {
      const response = await apiClient.createChatSession(recipientId)
      if (response.success) {
        setSessionId(response.data.sessionId)
        loadMessages(response.data.sessionId)
      } else {
        toast.error("创建聊天会话失败")
      }
    } catch (error) {
      console.error("创建聊天会话失败:", error)
      toast.error("创建聊天会话失败，请稍后再试")
    } finally {
      setIsLoading(false)
    }
  }

  // 联系卖家
  const contactSeller = async () => {
    if (!itemId) return
    
    setIsLoading(true)
    try {
      const response = await apiClient.contactSeller(itemId)
      if (response.success) {
        setSessionId(response.data.sessionId)
        loadMessages(response.data.sessionId)
      } else {
        toast.error("联系卖家失败")
      }
    } catch (error) {
      console.error("联系卖家失败:", error)
      toast.error("联系卖家失败，请稍后再试")
    } finally {
      setIsLoading(false)
    }
  }

  // 加载消息
  const loadMessages = async (sid: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.getChatMessages(sid)
      if (response.success) {
        setMessages(response.data)
        // 标记为已读
        await apiClient.markChatAsRead(sid)
      } else {
        toast.error("加载消息失败")
      }
    } catch (error) {
      console.error("加载消息失败:", error)
      toast.error("加载消息失败，请稍后再试")
    } finally {
      setIsLoading(false)
    }
  }

  // 发送消息
  const sendMessage = async () => {
    if (!sessionId || !inputValue.trim()) return
    
    setIsSending(true)
    try {
      // 乐观更新UI
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content: inputValue,
        senderId: user?.id,
        createdAt: new Date().toISOString(),
        status: 'sending',
      }
      setMessages([...messages, tempMessage])
      setInputValue("")
      
      // 发送消息
      const response = await apiClient.sendChatMessage(sessionId, inputValue)
      if (response.success) {
        // 更新消息状态
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? response.data : msg
          )
        )
      } else {
        // 标记消息发送失败
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? { ...msg, status: 'failed' } : msg
          )
        )
        toast.error("发送消息失败")
      }
    } catch (error) {
      console.error("发送消息失败:", error)
      // 标记消息发送失败
      setMessages(prev => 
        prev.map(msg => 
          msg.id === `temp-${Date.now()}` ? { ...msg, status: 'failed' } : msg
        )
      )
      toast.error("发送消息失败，请稍后再试")
    } finally {
      setIsSending(false)
    }
  }

  // 处理输入框按回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={recipientAvatar} alt={recipientName} />
              <AvatarFallback>{recipientName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{recipientName}</span>
          </DialogTitle>
          {itemTitle && (
            <p className="text-xs text-muted-foreground">关于: {itemTitle}</p>
          )}
        </DialogHeader>
        
        <div className="flex flex-col h-[50vh]">
          {/* 消息区域 */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    开始聊天吧！
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === user?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-right mt-1 opacity-70">
                            {formatTime(message.createdAt)}
                            {message.status === 'sending' && ' · 发送中'}
                            {message.status === 'failed' && ' · 发送失败'}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
          
          {/* 输入区域 */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="输入消息..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!sessionId || isSending}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || !sessionId || isSending}
                size="icon"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 