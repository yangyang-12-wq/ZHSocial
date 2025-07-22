 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api';
import { CreatePartnerRequest } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

const partnerSchema = z.object({
  title: z.string().min(5, '标题至少需要5个字符').max(100, '标题不能超过100个字符'),
  description: z.string().min(10, '描述至少需要10个字符').max(2000, '描述不能超过2000个字符'),
  category: z.string().nonempty('请选择一个分类'),
  type: z.string().nonempty('请选择一个类型'),
  location: z.string().optional(),
  maxParticipants: z.coerce.number().int().min(2, '至少需要2名参与者').default(2),
  tags: z.string().optional(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

export default function CreatePartnerPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      type: '',
      location: '',
      maxParticipants: 2,
      tags: '',
    },
  });

  const onSubmit = async (data: PartnerFormData) => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }

    setLoading(true);

    const requestData: CreatePartnerRequest = {
      ...data,
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
    };

    try {
      const response = await apiClient.createPartner(requestData);
      if (response.success) {
        toast.success('搭子发布成功！');
        router.push('/partner-square');
      } else {
        toast.error(response.message || '发布失败，请重试');
      }
    } catch (error: any) {
      toast.error(error.message || '发布失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>发布新搭子</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：一起备战期末考" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>详细描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="介绍一下你的搭子需求，比如目标、期望、时间安排等"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>分类</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择搭子分类" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="学习">学习</SelectItem>
                          <SelectItem value="运动">运动</SelectItem>
                          <SelectItem value="娱乐">娱乐</SelectItem>
                          <SelectItem value="生活">生活</SelectItem>
                          <SelectItem value="其他">其他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>类型</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择搭子类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="线上">线上</SelectItem>
                          <SelectItem value="线下">线下</SelectItem>
                          <SelectItem value="不限">不限</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>招募人数</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>地点 (线下时填写)</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：图书馆、体育馆" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标签 (选填)</FormLabel>
                    <FormControl>
                      <Input placeholder="用逗号分隔，例如：自习, 考研, 编程" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? '发布中...' : '确认发布'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 