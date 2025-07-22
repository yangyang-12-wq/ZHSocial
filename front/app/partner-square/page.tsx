'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Partner, SearchParams, ApiResponse } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import {api} from '@/lib/api';
import { PartnerCard } from '@/components/partner/partner-card';
import { LoginForm } from '@/components/auth/login-form';

// 定义分页信息接口
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}


export default function PartnerSquare() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  // 获取搭子列表
  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params: SearchParams = {};
      
      if (searchQuery) params.keyword = searchQuery;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedType !== 'all') params.type = selectedType;
      
      const response = await api.getPartners(params);
      
      // 我们重构后的api.ts，对于分页的端点会直接返回完整的ApiResponse
      // 所以我们在这里直接使用 response.data 和 response.pagination
      if (response && response.data) {
        setPartners(response.data);
        if(response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setPartners([]);
        toast.error('获取搭子列表失败: 数据格式不正确');
      }
    } catch (error) {
      setPartners([]);
      console.error('获取搭子列表失败:', error);
      toast.error('获取搭子列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [catRes, typeRes] = await Promise.all([
        api.getPartnerCategories(),
        api.getPartnerTypes(),
      ]);

      // Handle both direct array response and ApiResponse object
      const processCategories = (response: any): string[] => {
        if (Array.isArray(response)) {
          return response;
        } else if (response && typeof response === 'object' && 'success' in response) {
          const apiResponse = response as ApiResponse<string[]>;
          if (apiResponse.success) {
            return apiResponse.data;
          }
        }
        return [];
      };

      setCategories(['全部', ...processCategories(catRes)]);
      setTypes(['全部类型', ...processCategories(typeRes)]);
    } catch (error) {
      console.error('获取筛选条件失败:', error);
      toast.error('获取筛选条件失败');
    }
  };

  // 加入搭子
  const handleJoinPartner = async (partnerId: string) => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }

    try {
      // Check if token exists in localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('登录已过期，请重新登录');
        setShowLoginDialog(true);
        return;
      }

      // Ensure token is set in API client
      api.setToken(token);
      
      await api.joinPartner(partnerId);
      toast.success('成功加入搭子！');
      fetchPartners(); // 刷新列表
    } catch (error: any) {
      if (error.message && error.message.includes('Authorization header')) {
        toast.error('登录已过期，请重新登录');
        setShowLoginDialog(true);
      } else {
        toast.error(error.message || '加入搭子失败');
      }
    }
  };

  // 查看搭子详情
  const handleViewPartner = (partnerId: string) => {
    router.push(`/partner-square/${partnerId}`);
  };

  // 创建新搭子
  const handleCreatePartner = () => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    router.push('/partner-square/create');
  };

  // 搜索处理
  const handleSearch = () => {
    fetchPartners();
  };

  // 初始化加载
  useEffect(() => {
    fetchPartners();
    fetchFilters();
  }, []);

  // 监听筛选条件变化
  useEffect(() => {
    fetchPartners();
  }, [selectedCategory, selectedType]);

  return (
    <div className="min-h-screen bg-background">
      {/* 头部导航 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 mr-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">搭子广场</span>
          </Link>
          
          <div className="flex-1 flex items-center gap-4">
            {/* 搜索框 */}
            <div className="flex-1 max-w-md flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索搭子..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button size="sm" onClick={handleSearch}>
                搜索
              </Button>
            </div>

            {/* 筛选器 */}
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category === '全部' ? 'all' : category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type === '全部类型' ? 'all' : type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 发布按钮 */}
            <Button onClick={handleCreatePartner} className="gap-2">
              <Plus className="h-4 w-4" />
              发布搭子
            </Button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container py-6">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">暂无搭子信息</div>
            <Button onClick={handleCreatePartner} variant="outline">
              发布第一个搭子
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onJoin={handleJoinPartner}
                onView={handleViewPartner}
                showJoinButton={isAuthenticated}
              />
            ))}
          </div>
        )}
      </main>

      {/* 登录对话框 */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>请先登录</DialogTitle>
          </DialogHeader>
          <LoginForm
            onSuccess={() => setShowLoginDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
