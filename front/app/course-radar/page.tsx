'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Search, ArrowLeft, TrendingUp, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Course, SearchParams, ApiResponse } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import {api} from '@/lib/api';
import { CourseCard } from '@/components/course/course-card';
import { LoginForm } from '@/components/auth/login-form';

// 定义分页响应接口
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CourseRadar() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);

  const sortOptions = [
    { id: 'rating', name: '评分最高' },
    { id: 'popularity', name: '最受欢迎' },
    { id: 'difficulty', name: '难度排序' },
    { id: 'latest', name: '最新发布' },
  ];

  // 获取课程列表
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: SearchParams = {};
      
      if (searchQuery) params.keyword = searchQuery;
      if (selectedDepartment !== 'all') params.category = selectedDepartment;
      if (sortBy) params.sort = sortBy;
      
      const response = await api.getCourses(params);
      if (response.success) {
        // 检查response.data是否为分页格式
        const responseData = response.data as Course[] | PaginatedResponse<Course>;
        if ('items' in responseData && Array.isArray(responseData.items)) {
          // 处理分页格式
          setCourses(responseData.items);
        } else if (Array.isArray(responseData)) {
          // 处理数组格式
          setCourses(responseData);
        } else {
          setCourses([]);
          console.error('课程数据格式异常:', responseData);
          toast.error('课程数据格式异常');
        }
      } else {
        setCourses([]); 
        toast.error('获取课程列表失败');
      }
    } catch (error) {
      setCourses([]);
      console.error('获取课程列表失败:', error);
      toast.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取筛选选项
  const fetchFilterOptions = async () => {
    try {
      const [deptRes, semesterRes] = await Promise.all([
        api.getCourseDepartments(),
        api.getCourseSemesters(),
      ]);

      // Handle responses as either arrays or API response objects
      if (Array.isArray(deptRes)) {
        setDepartments(['全部院系', ...deptRes]);
      } else if (deptRes && typeof deptRes === 'object' && 'success' in deptRes) {
        const apiResponse = deptRes as ApiResponse<string[]>;
        if (apiResponse.success) {
          setDepartments(['全部院系', ...apiResponse.data]);
        }
      } else {
        toast.error('获取院系列表失败');
      }

      if (Array.isArray(semesterRes)) {
        setSemesters(['全部学期', ...semesterRes]);
      } else if (semesterRes && typeof semesterRes === 'object' && 'success' in semesterRes) {
        const apiResponse = semesterRes as ApiResponse<string[]>;
        if (apiResponse.success) {
          setSemesters(['全部学期', ...apiResponse.data]);
        }
      } else {
        toast.error('获取学期列表失败');
      }
    } catch (error) {
      console.error('获取筛选选项失败:', error);
      toast.error('获取筛选选项失败');
    }
  };

  // 获取推荐课程
  const fetchRecommendedCourses = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.getCourseRecommendations();
      
      // Handle response as either direct Course[] or ApiResponse
      let courseData: Course[] | PaginatedResponse<Course> = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        courseData = response;
      } else if (response && typeof response === 'object' && 'success' in response) {
        // ApiResponse format
        const apiResponse = response as ApiResponse<Course[] | PaginatedResponse<Course>>;
        if (apiResponse.success) {
          courseData = apiResponse.data;
        } else {
          setRecommendedCourses([]);
          return;
        }
      } else {
        setRecommendedCourses([]);
        console.error('推荐课程数据格式异常:', response);
        return;
      }
      
      // Process course data
      if ('items' in courseData && Array.isArray(courseData.items)) {
        // 处理分页格式
        setRecommendedCourses(courseData.items);
      } else if (Array.isArray(courseData)) {
        // 处理数组格式
        setRecommendedCourses(courseData);
      } else {
        setRecommendedCourses([]);
        console.error('推荐课程数据格式异常:', courseData);
      }
    } catch (error) {
      console.error("获取推荐课程失败:", error);
      setRecommendedCourses([]);
    }
  };

  // 查看课程详情
  const handleViewCourse = (courseId: string) => {
    router.push(`/course-radar/${courseId}`);
  };

  // 写课程评价
  const handleWriteReview = (courseId: string) => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    router.push(`/course-radar/${courseId}/review`);
  };

  // 搜索处理
  const handleSearch = () => {
    fetchCourses();
  };

  // 初始化加载
  useEffect(() => {
    fetchCourses();
    fetchFilterOptions();
    if (isAuthenticated) {
      fetchRecommendedCourses();
    }
  }, [isAuthenticated]);

  // 监听筛选条件变化
  useEffect(() => {
    fetchCourses();
  }, [selectedDepartment, selectedSemester, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* 头部导航 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 mr-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">课程雷达</span>
              </Link>
          
          <div className="flex-1 flex items-center gap-4">
            {/* 搜索框 */}
            <div className="flex-1 max-w-md flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索课程名称、教师、课程代码..."
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
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept === '全部院系' ? 'all' : dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester} value={semester === '全部学期' ? 'all' : semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container py-6">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              全部课程
            </TabsTrigger>
            <TabsTrigger value="recommended" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              推荐课程
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              热门课程
            </TabsTrigger>
          </TabsList>

          {/* 全部课程 */}
          <TabsContent value="all" className="space-y-6">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
          </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">暂无课程信息</div>
        </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={handleViewCourse}
                    onWriteReview={handleWriteReview}
                  />
                      ))}
                    </div>
            )}
          </TabsContent>

          {/* 推荐课程 */}
          <TabsContent value="recommended" className="space-y-6">
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">登录后查看个性化推荐</div>
                <Button onClick={() => setShowLoginDialog(true)}>
                  立即登录
                </Button>
              </div>
            ) : recommendedCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">暂无推荐课程</div>
                  </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recommendedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={handleViewCourse}
                    onWriteReview={handleWriteReview}
                  />
                ))}
                    </div>
            )}
          </TabsContent>

          {/* 热门课程 */}
          <TabsContent value="trending" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses
                .filter(course => course.popularityScore && course.popularityScore > 0.7)
                .map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={handleViewCourse}
                    onWriteReview={handleWriteReview}
                  />
                ))}
          </div>
          </TabsContent>
        </Tabs>
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
