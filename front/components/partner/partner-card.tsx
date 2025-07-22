'use client';

import { Partner } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Users, Star } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PartnerCardProps {
  partner: Partner;
  onJoin?: (id: string) => void;
  onView?: (id: string) => void;
  showJoinButton?: boolean;
  className?: string;
}

export function PartnerCard({ 
  partner, 
  onJoin, 
  onView, 
  showJoinButton = true,
  className 
}: PartnerCardProps) {
  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.(partner.id);
  };

  const handleView = () => {
    onView?.(partner.id);
  };

  const isExpired = partner.expiresAt && new Date(partner.expiresAt) < new Date();
  const isFull = partner.currentParticipants >= partner.maxParticipants;
  const canJoin = !isExpired && !isFull && partner.status === 'open';

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={handleView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{partner.title}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {partner.matchScore && (
              <>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{Math.round(partner.matchScore * 100)}%</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={partner.author.avatar} />
            <AvatarFallback>
              {partner.author.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {partner.author.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {partner.author.major} · {partner.author.grade}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {partner.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary">{partner.type}</Badge>
          <Badge variant="outline">{partner.category}</Badge>
          {partner.tags?.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {partner.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{partner.location}</span>
            </div>
          )}
          
          {partner.timePreference && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{partner.timePreference}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              {partner.currentParticipants}/{partner.maxParticipants} 人
            </span>
            {isFull && <Badge variant="destructive" className="text-xs">已满</Badge>}
          </div>

          {partner.expiresAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                截止 {format(new Date(partner.expiresAt), 'MM-dd HH:mm', { locale: zhCN })}
              </span>
              {isExpired && <Badge variant="destructive" className="text-xs">已过期</Badge>}
            </div>
          )}
        </div>
      </CardContent>

      {showJoinButton && (
        <CardFooter className="pt-3">
          <Button 
            className="w-full" 
            onClick={handleJoin}
            disabled={!canJoin}
            variant={canJoin ? "default" : "secondary"}
          >
            {isExpired ? '已过期' : 
             isFull ? '已满员' : 
             partner.status === 'closed' ? '已关闭' :
             '加入搭子'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 