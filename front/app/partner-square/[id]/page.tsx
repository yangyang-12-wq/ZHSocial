'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Partner, User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, CalendarDays, Clock, LocateIcon, MessageSquare, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function PartnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuth();

  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (id) {
      const fetchPartner = async () => {
        try {
          setLoading(true);
          const response = await api.getPartner(id);
          // The API client is configured to return the `data` field directly
          // but let's handle both cases for robustness.
          if (response && (response as any).success !== undefined) {
            const partnerData = (response as any).data as Partner;
            // The author might not be included in the participants list by default, add them if they are not
            if (partnerData.author && !partnerData.participants?.some(p => p.id === partnerData.author.id)) {
              partnerData.participants = [partnerData.author, ...(partnerData.participants || [])];
            }
            setPartner(partnerData);
          } else {
            setPartner(response);
          }
        } catch (err) {
          setError('Failed to load partner details. It might have been deleted or does not exist.');
          toast.error('加载搭子信息失败');
        } finally {
          setLoading(false);
        }
      };
      fetchPartner();
    }
  }, [id]);

  const handleJoin = async () => {
    if (!isAuthenticated || !partner) {
      toast.info('请先登录再加入');
      // Optionally, redirect to login
      router.push('/login');
      return;
    }
    
    if (!id) {
        toast.error("无效的页面ID");
        return;
    }

    try {
      await api.joinPartner(partner.id);
      toast.success('成功加入！');
      // Refresh partner data
      const updatedPartner = await api.getPartner(id);
       if (updatedPartner.author && !updatedPartner.participants?.some(p => p.id === updatedPartner.author.id)) {
          updatedPartner.participants = [updatedPartner.author, ...(updatedPartner.participants || [])];
        }
      setPartner(updatedPartner);
    } catch (err: any) {
      toast.error(err.message || '加入失败，请稍后再试');
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated || !partner) {
        toast.info('请先登录再开始聊天');
        router.push('/login');
        return;
    }

    if (partner.author.id === user?.id) {
        toast.info('你不能和自己聊天');
        return;
    }

    try {
        // Ensure the author ID is a string for the API call
        const { sessionId } = await api.createChatSession(String(partner.author.id));
        if (sessionId) {
            router.push(`/chat?session=${sessionId}`);
        } else {
            toast.error('无法获取会话ID，请稍后重试');
        }
    } catch (err: any) {
        toast.error(err.message || '无法开启聊天会话');
    }
  };
  
  if (loading) {
    return <PartnerDetailSkeleton />;
  }

  if (error || !partner) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">出错啦！</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-6">
          <Link href="/partner-square">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回搭子广场
          </Link>
        </Button>
      </div>
    );
  }
  
  const isAuthor = isAuthenticated && user?.id === partner.author.id;
  const hasJoined = partner.participants?.some(p => p.id === user?.id);
  const isFull = partner.currentParticipants >= partner.maxParticipants;
  const canJoin = isAuthenticated && !isAuthor && !hasJoined && !isFull;

  const getJoinButton = () => {
    if (isAuthor) return <Button disabled>你是发起人</Button>;
    if (hasJoined) return <Button disabled variant="secondary">已加入</Button>;
    if (isFull) return <Button disabled variant="secondary">已满员</Button>;
    if (!canJoin) return <Button disabled>无法加入</Button>

    return <Button onClick={handleJoin}><UserPlus className="mr-2 h-4 w-4" />加入搭子</Button>;
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
        <div className="container mx-auto max-w-5xl py-8">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    返回
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap gap-2 mb-2">
                                <Badge variant="secondary">{partner.type}</Badge>
                                <Badge variant="outline">{partner.category}</Badge>
                                {partner.tags?.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                            </div>
                            <CardTitle className="text-3xl font-bold">{partner.title}</CardTitle>
                            <div className="text-sm text-muted-foreground pt-2">
                                发布于 {format(new Date(partner.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base whitespace-pre-wrap leading-relaxed">{partner.description}</p>
                            
                            <div className="mt-8 space-y-4">
                                <div className="flex items-center text-sm">
                                    <LocateIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                                    <strong>地点:</strong><span className="ml-2">{partner.location || '未指定'}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                                    <strong>偏好时间:</strong><span className="ml-2">{partner.timePreference || '未指定'}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground" />
                                    <strong>截止日期:</strong><span className="ml-2">{partner.expiresAt ? format(new Date(partner.expiresAt), 'yyyy-MM-dd HH:mm', { locale: zhCN }) : '长期有效'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Participants Section */}
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="mr-2 h-5 w-5"/>
                                当前成员 ({partner.currentParticipants}/{partner.maxParticipants})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                {(partner.participants && partner.participants.length > 0) ? partner.participants.map(p => (
                                    <Link href={`/users/${p.id}`} key={p.id} className="flex flex-col items-center space-y-1 group">
                                        <Avatar className="h-12 w-12 transition-transform duration-200 ease-in-out group-hover:scale-110">
                                            <AvatarImage src={p.avatar} alt={p.username} />
                                            <AvatarFallback>{p.username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground group-hover:text-primary">{p.username}</span>
                                    </Link>
                                )) : <p className="text-sm text-muted-foreground">还没有人加入，快来加入吧！</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                             <Link href={`/users/${partner.author.id}`} className="group">
                                <Avatar className="h-16 w-16 transition-transform duration-200 ease-in-out group-hover:scale-110">
                                    <AvatarImage src={partner.author.avatar} />
                                    <AvatarFallback>{partner.author.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div>
                                <Link href={`/users/${partner.author.id}`} className="group">
                                    <p className="font-semibold text-lg group-hover:text-primary">{partner.author.username}</p>
                                </Link>
                                <p className="text-sm text-muted-foreground">{partner.author.major} · {partner.author.grade}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col space-y-3">
                            {getJoinButton()}
                            <Button variant="outline" onClick={handleStartChat} disabled={isAuthor}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                和TA聊天
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
}

function PartnerDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl py-8">
        <div className="mb-6">
            <Skeleton className="h-8 w-24 mb-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex gap-2 mb-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                        <div className="mt-8 space-y-4">
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-6 w-1/2" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <div className="flex flex-col items-center space-y-1">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
} 