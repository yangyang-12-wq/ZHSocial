'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // 使用useEffect进行重定向，避免渲染期间更新Router组件
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);
  
  // 如果已登录，可以返回null或加载指示器
  if (isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">正在重定向...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回首页按钮 */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>

        {/* 切换按钮 */}
        <div className="flex mb-6 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm">
          <Button
            variant={isLogin ? "default" : "ghost"}
            size="sm"
            className={`flex-1 ${isLogin ? "bg-green-600 hover:bg-green-700" : ""}`}
            onClick={() => setIsLogin(true)}
          >
            登录
          </Button>
          <Button
            variant={!isLogin ? "default" : "ghost"}
            size="sm"
            className={`flex-1 ${!isLogin ? "bg-green-600 hover:bg-green-700" : ""}`}
            onClick={() => setIsLogin(false)}
          >
            注册
          </Button>
        </div>

        {/* 表单 */}
        {isLogin ? (
          <LoginForm 
            onSuccess={() => router.push('/')}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm 
            onSuccess={() => {
              setIsLogin(true);
              // 注册成功后切换到登录页面
            }}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
} 