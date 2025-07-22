'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User as UserIcon, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api';
import { User } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = Number(params.id);

  useEffect(() => {
    if (userId) {
      const fetchUserProfile = async () => {
        setIsLoading(true);
        try {
          const userProfileData = await apiClient.getUser(userId);
          setProfileUser(userProfileData);
        } catch (error) {
          console.error('Failed to fetch user profile', error);
          toast.error('Failed to load profile.');
          router.push('/'); // Redirect home on error
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserProfile();
    }
  }, [userId, router]);

  const handleFollow = async () => {
    if (!isAuthenticated || !profileUser) return;
    try {
      await apiClient.followUser(profileUser.id);
      setProfileUser(prev => prev ? { ...prev, isFollowing: true, followerCount: prev.followerCount + 1 } : null);
      toast.success(`Followed ${profileUser.username}`);
    } catch (error) {
      toast.error('Failed to follow user.');
    }
  };

  const handleUnfollow = async () => {
    if (!isAuthenticated || !profileUser) return;
    try {
      await apiClient.unfollowUser(profileUser.id);
      setProfileUser(prev => prev ? { ...prev, isFollowing: false, followerCount: prev.followerCount - 1 } : null);
      toast.success(`Unfollowed ${profileUser.username}`);
    } catch (error) {
      toast.error('Failed to unfollow user.');
    }
  };
  
  const handleStartChat = () => {
    if (!profileUser) return;
    // This is a placeholder. In a real app, you'd either have a dedicated
    // API to start a conversation or navigate to the chat page with the user's ID.
    toast.info(`Starting chat with ${profileUser.username}`);
    router.push('/chat'); 
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading profile...</div>;
  }

  if (!profileUser) {
    return <div className="container mx-auto p-4 text-center">User not found.</div>;
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
       <Link href="/" className="inline-flex items-center gap-2 mb-4 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
      </Link>
      <div className="bg-card p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary">
            <AvatarImage src={profileUser.avatar_url} alt={profileUser.username} />
            <AvatarFallback><UserIcon size={48} /></AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold">{profileUser.username}</h1>
            <p className="text-muted-foreground">{profileUser.fullName}</p>
            <p className="mt-4 text-card-foreground">{profileUser.bio || 'No bio yet.'}</p>
            
            <div className="flex justify-center sm:justify-start gap-6 mt-4">
              <div>
                <span className="font-bold text-lg">{profileUser.followerCount}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-lg">{profileUser.followingCount}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          {isOwnProfile ? (
            <Button className="flex-1" variant="outline">Edit Profile</Button>
          ) : (
            <>
              {profileUser.isFollowing ? (
                <Button className="flex-1" variant="outline" onClick={handleUnfollow}>Unfollow</Button>
              ) : (
                <Button className="flex-1" onClick={handleFollow}>Follow</Button>
              )}
              <Button className="flex-1" onClick={handleStartChat}>Message</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 