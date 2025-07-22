'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User as UserIcon } from 'lucide-react'; // Renamed User to avoid conflict
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import chatService from '@/lib/chat';
import { api } from '@/lib/api';
import { WebsocketMessage, Conversation, Message, User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(chatService.isConnected());
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const fetchConversations = async (selectedConvoId?: number) => {
    if (!isAuthenticated) return;
    try {
      const convos = await api.getConversations();
      setConversations(convos);
      
      const convoToSelect = selectedConvoId 
        ? convos.find(c => c.id === selectedConvoId)
        : convos[0];

      if (convos.length > 0 && !activeConversation) {
        if (convoToSelect) {
          selectConversation(convoToSelect);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    }
  };

  useEffect(() => {
    const convoId = searchParams.get('session');
    fetchConversations(convoId ? parseInt(convoId) : undefined);
  }, [isAuthenticated, searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      chatService.connect();

      chatService.onConnectionOpen = () => setIsConnected(true);
      chatService.onConnectionClose = () => setIsConnected(false);
      chatService.onMessageReceived = (msg: WebsocketMessage) => {
        const receivedMessage = msg.payload as Message;
        
        setConversations(prevConvos => {
          const newConvos = [...prevConvos];
          const convoIndex = newConvos.findIndex(c => c.id === receivedMessage.conversationId);
          if (convoIndex > -1) {
            const convo = newConvos[convoIndex];
            convo.lastMessage = receivedMessage;
            if (activeConversation?.id !== receivedMessage.conversationId) {
              convo.unreadCount = (convo.unreadCount || 0) + 1;
            }
            // Move updated conversation to the top
            newConvos.splice(convoIndex, 1);
            newConvos.unshift(convo);
          }
          return newConvos;
        });

        if (activeConversation && receivedMessage.conversationId === activeConversation.id) {
          setMessages(prev => [...prev, receivedMessage]);
        }
      };

      return () => {
        chatService.disconnect();
      };
    }
  }, [isAuthenticated, user, activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && user && activeConversation) {
      const recipient = activeConversation.participants.find(p => p.id !== user.id);
      if (recipient) {
        chatService.sendPrivateMessage(recipient.id, newMessage);
        
        const optimisticMessage: Message = {
          id: Date.now(),
          conversationId: activeConversation.id,
          senderId: user.id,
          sender: user,
          content: newMessage,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
      }
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    setIsLoadingMessages(true);
    try {
      // Mark conversation as read
      if (conv.unreadCount && conv.unreadCount > 0) {
        // This is an optimistic update.
        // A proper implementation would have an API endpoint to mark as read.
        setConversations(prev => prev.map(c => 
          c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ));
      }

      const fetchedMessages = await api.getMessages(conv.id);
      // Backend returns newest first, so we reverse it for display
      setMessages(fetchedMessages.reverse());
    } catch (error) {
      console.error('Failed to fetch messages', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation): User | undefined => {
    return conversation.participants.find(p => p.id !== user?.id);
  };


  return (
    <div className="flex h-screen bg-background font-sans">
      {/* Left Panel: Conversation List */}
      <aside className="w-1/3 border-r xl:w-1/4">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Messages</h2>
          {/* Status Indicator */}
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("h-2 w-2 rounded-full", isConnected ? 'bg-green-500' : 'bg-red-500')}></span>
            <span className="text-xs text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {conversations.map((conv) => {
            const otherUser = getOtherParticipant(conv);
            return (
              <div
                key={conv.id}
                className={cn(
                  "flex items-center p-3 cursor-pointer hover:bg-muted/50",
                  activeConversation?.id === conv.id && "bg-muted"
                )}
                onClick={() => selectConversation(conv)}
              >
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={otherUser?.avatar} alt={otherUser?.username} />
                  <AvatarFallback><UserIcon /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{otherUser?.username || 'Chat'}</p>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage?.content || 'No messages yet'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {conv.lastMessage ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true }) : ''}
                  </p>
                  {conv.unreadCount && conv.unreadCount > 0 && (
                    <span className="mt-1 inline-block bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </aside>

      {/* Right Panel: Chat Window */}
      <main className="flex flex-col flex-1">
        {activeConversation && getOtherParticipant(activeConversation) ? (
          <>
            {/* Header */}
            <header className="flex items-center p-4 border-b">
              <Link href={`/users/${getOtherParticipant(activeConversation)?.id}`} className="flex items-center gap-4 hover:bg-muted/50 p-2 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getOtherParticipant(activeConversation)?.avatar_url} alt={getOtherParticipant(activeConversation)?.username} />
                  <AvatarFallback><UserIcon /></AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">{getOtherParticipant(activeConversation)?.username}</h3>
              </Link>
            </header>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <p>Loading messages...</p>
                </div>
              ) : (
                 <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.id ? 'justify-end' : 'justify-start')}>
                      {msg.senderId !== user?.id && (
                         <Avatar className="h-8 w-8">
                          <AvatarImage src={getOtherParticipant(activeConversation)?.avatar} alt={getOtherParticipant(activeConversation)?.username} />
                          <AvatarFallback><UserIcon /></AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        "max-w-xs lg:max-w-md p-3 rounded-lg",
                        msg.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        <p>{msg.content}</p>
                        <p className="text-xs mt-1 text-right opacity-70">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                      </div>
                       {msg.senderId === user?.id && (
                         <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.avatar} alt={user?.username} />
                          <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <footer className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a conversation to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
} 