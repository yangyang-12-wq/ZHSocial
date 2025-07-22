"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // 检查用户是否为管理员
  useEffect(() => {
    console.log("AdminPage: 登录用户信息:", user);
    console.log("AdminPage: 用户角色:", user?.role);
    console.log("AdminPage: 本地存储的令牌:", localStorage.getItem('token'));
    
    if (!isLoading && (!user || user.role !== 'admin')) {
      toast.error("您没有权限访问此页面");
      router.push('/');
    } else if (!isLoading && user) {
      fetchAdminStats();
      fetchUsers();
    }
  }, [user, isLoading, router]);

  // 获取管理员统计数据
  const fetchAdminStats = async () => {
    try {
      console.log("开始获取管理员统计数据");
      console.log("使用的令牌:", localStorage.getItem('token'));
      
      const response = await api.getAdminStats();
      console.log("管理员统计数据响应:", response);
      
      if (response) {
        setStats({totalUsers: response.totalUsers || 0});
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
      // 静默处理错误，避免用户看到错误提示
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log("开始获取用户列表");
      
      // 先清除之前的数据避免混淆
      setUsers([]);
      
      // 添加重试机制
      let retries = 2;
      let response;
      
      while (retries >= 0) {
        response = await api.getAllUsers();
        console.log(`用户列表API响应 (尝试 ${2-retries}/2):`, response);
        
        // 如果有数据，跳出循环
        if (response && 'data' in response && response.data && Array.isArray(response.data) && response.data.length > 0) {
          break;
        }
        
        retries--;
        if (retries >= 0) {
          console.log(`未找到用户数据，${retries+1}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // 确保response是一个对象
      if (!response || typeof response !== 'object') {
        console.error("API返回值不是一个对象:", response);
        setUsers([]);
        return;
      }
      
      // 检查response中是否包含data属性
      if ('data' in response) {
        // 确保data是一个数组
        const userData = Array.isArray(response.data) ? response.data : [];
        console.log(`找到 ${userData.length} 个用户`);
        
        if (userData.length > 0) {
          console.log('用户示例:', userData[0]);
          
          // 检查用户对象的结构
          const firstUser = userData[0];
          if (firstUser) {
            console.log('用户对象字段:', Object.keys(firstUser));
            // 如果发现字段名不匹配，可以进行数据转换
          }
        }
        
        setUsers(userData);
      } else {
        // 处理没有data属性的响应
        console.log("API响应中没有data属性:", response);
        setUsers([]);
      }
    } catch (error) {
      console.error("获取用户列表失败:", error);
      setUsers([]); // 出错时设置为空数组
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // 更新用户角色
  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      await api.updateUserRole(userId, role as any);
      toast.success(`用户角色已更新为 ${role}`);
      fetchUsers(); // 刷新用户列表
    } catch (error) {
      console.error("更新用户角色失败:", error);
      toast.error("更新用户角色失败");
    }
  };

  // 更新用户状态
  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.updateUserStatus(userId, isActive);
      toast.success(`用户状态已${isActive ? '启用' : '禁用'}`);
      fetchUsers(); // 刷新用户列表
    } catch (error) {
      console.error("更新用户状态失败:", error);
      toast.error("更新用户状态失败");
    }
  };

  // 调试数据库
  const debugDatabase = async () => {
    try {
      const result = await api.debugUserDatabase();
      console.log("调试数据库结果:", result);
      
      if (result.success) {
        toast.success(`发现 ${result.count || 0} 个用户记录`);
      } else {
        toast.error(`调试失败: ${result.message}`);
      }
    } catch (error) {
      console.error("调试数据库错误:", error);
      toast.error("调试数据库失败");
    }
  };

  // 过滤用户
  const filteredUsers = searchQuery 
    ? users.filter(u => 
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  if (isLoading || !user) {
    return <div className="p-8 text-center">正在加载...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">管理员控制面板</h1>
      
      {/* 权限刷新提示 */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              如果您的权限刚刚被更新，可能需要重新登录以刷新权限令牌。
            </p>
            <div className="mt-2 flex">
              <button
                className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 py-1 px-3 text-sm rounded mr-2"
                onClick={() => {
                  api.clearToken();
                  toast.info("已清除登录信息，请重新登录");
                  router.push('/login');
                }}
              >
                重新登录
              </button>
              
              <button
                className="bg-blue-200 hover:bg-blue-300 text-blue-800 py-1 px-3 text-sm rounded"
                onClick={debugDatabase}
              >
                调试数据库
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">总用户数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* 内容审核 */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reports">举报处理</TabsTrigger>
          <TabsTrigger value="users">用户管理</TabsTrigger>
          <TabsTrigger value="settings">系统设置</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>举报处理</CardTitle>
              <CardDescription>
                处理用户举报的内容
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                举报功能正在开发中
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>用户管理</CardTitle>
              <CardDescription>
                管理用户账号和权限
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 用户搜索 */}
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="按用户名或邮箱搜索..." 
                    className="max-w-sm" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="outline" onClick={fetchUsers}>刷新</Button>
                </div>
                
                {/* 用户列表 */}
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left">用户名</th>
                        <th className="p-2 text-left">邮箱</th>
                        <th className="p-2 text-left">角色</th>
                        <th className="p-2 text-left">状态</th>
                        <th className="p-2 text-left">注册时间</th>
                        <th className="p-2 text-left">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center">加载中...</td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center">
                            暂无用户数据
                            <div className="mt-2 text-xs text-gray-400">
                              用户数组长度: {users.length} | 
                              过滤后数组长度: {filteredUsers.length} | 
                              搜索词: {searchQuery || '无'}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, index) => (
                          <tr key={user.id || index} className="border-t">
                            <td className="p-2">{user.username || '未知用户'}</td>
                            <td className="p-2">{user.email || '无邮箱'}</td>
                            <td className="p-2">
                              <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                                {user.role || 'user'}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                {user.is_active ? '已激活' : '已禁用'}
                              </Badge>
                            </td>
                            <td className="p-2">{user.created_at ? new Date(user.created_at).toLocaleString() : '未知'}</td>
                            <td className="p-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">打开菜单</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>操作</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>角色</DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => handleUpdateUserRole(String(user.id), 'user')}>
                                          普通用户
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateUserRole(String(user.id), 'moderator')}>
                                          版主
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateUserRole(String(user.id), 'admin')}>
                                          管理员
                                        </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                  {user.is_active ? (
                                    <DropdownMenuItem onClick={() => handleUpdateUserStatus(String(user.id), false)}>
                                      禁用账号
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleUpdateUserStatus(String(user.id), true)}>
                                      激活账号
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                共 {users.length} 个用户，当前显示 {filteredUsers.length}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>系统设置</CardTitle>
              <CardDescription>
                配置系统参数和审核规则
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                系统设置功能正在开发中
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
