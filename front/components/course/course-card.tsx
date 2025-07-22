'use client';

import { Course } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Users, BookOpen, Award, TrendingUp } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onViewDetails?: (id: string) => void;
  onWriteReview?: (id: string) => void;
  showActions?: boolean;
  className?: string;
}

export function CourseCard({ 
  course, 
  onViewDetails, 
  onWriteReview,
  showActions = true,
  className 
}: CourseCardProps) {
  const handleViewDetails = () => {
    onViewDetails?.(course.id);
  };

  const handleWriteReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWriteReview?.(course.id);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-600';
    if (difficulty <= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 2) return '简单';
    if (difficulty <= 3.5) return '中等';
    return '困难';
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={handleViewDetails}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-1">
              {course.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {course.code} · {course.instructor}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground ml-2">
            <Award className="h-4 w-4" />
            <span>{course.credit}学分</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 课程基础信息 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span>{course.department}</span>
          </div>
          <Badge variant="outline">
            {course.semester}
          </Badge>
        </div>

        {/* 评分和难度 */}
        <div className="space-y-3">
          {/* 综合评分 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">综合评分</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(course.avgRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">
                {course.avgRating.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">
                {course.reviewCount} 评价
              </div>
            </div>
          </div>

          {/* 难度评分 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">课程难度</span>
            <div className="text-right">
              <div className={`font-semibold ${getDifficultyColor(course.avgDifficulty)}`}>
                {getDifficultyText(course.avgDifficulty)}
              </div>
              <div className="text-xs text-muted-foreground">
                {course.avgDifficulty.toFixed(1)}/5
              </div>
            </div>
          </div>

          {/* 选课热度 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">选课热度</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.enrollmentCount} 人选课</span>
              </div>
            </div>
            <Progress 
              value={Math.min((course.enrollmentCount / 200) * 100, 100)} 
              className="h-2"
            />
          </div>
        </div>

        {/* 课程描述 */}
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}

        {/* 先修课程 */}
        {course.prerequisites && Object.keys(course.prerequisites).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">先修课程:</p>
            <div className="flex flex-wrap gap-1">
              {Object.values(course.prerequisites).slice(0, 3).map((prereq: any, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {prereq}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 人气趋势 */}
        {course.popularityScore && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>热门课程</span>
            <Badge variant="secondary" className="text-xs">
              推荐指数 {Math.round(course.popularityScore * 100)}%
            </Badge>
          </div>
        )}

        {/* 操作按钮 */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleViewDetails}
            >
              查看详情
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={handleWriteReview}
            >
              写评价
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 