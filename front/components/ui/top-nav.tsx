"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Home, Search, Bell, User, Settings, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-provider"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
  categories?: {
    label: string
    value: string
    href: string
    badge?: number
  }[]
}

export function TopNav({ categories = [], className, ...props }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  
  // Default categories if none provided
  const defaultCategories: Array<{
    label: string
    value: string
    href: string
    badge?: number
  }> = [
    { label: "推荐", value: "for-you", href: "/" },
    { label: "热门", value: "trending", href: "/trending" },
    { label: "活动", value: "events", href: "/events" },
    { label: "服务", value: "services", href: "/services" },
    { label: "社区", value: "community", href: "/community" },
  ]

  const navCategories = categories.length > 0 ? categories : defaultCategories
  const activePath = pathname === "/" ? "/" : `/${pathname.split("/")[1]}`

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("退出登录成功");
      router.push("/login");
    } catch (error) {
      console.error("退出登录失败:", error);
      toast.error("退出登录失败");
    }
  };

  // 检查用户是否为管理员
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/placeholder-logo.svg"
                alt="Logo"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="hidden font-bold md:inline-block">
                郑州大学
              </span>
            </Link>
          </div>
          
          {/* Search and actions - only on desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
            <ThemeToggle />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-primary transition-all">
                    <AvatarImage src={user?.avatar || ""} alt="User" />
                    <AvatarFallback>{user?.username?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <span className="font-medium">{user?.username || "用户"}</span>
                    <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>个人中心</span>
                    </DropdownMenuItem>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>管理面板</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">登录</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Categories tabs inspired by X's interface */}
      <div className="container overflow-x-auto scrollbar-hide">
        <Tabs 
          defaultValue={activePath} 
          className="w-full"
          value={activePath}
        >
          <TabsList className="bg-transparent h-12 w-full justify-start overflow-x-auto">
            {navCategories.map((category) => (
              <Link href={category.href} key={category.value}>
                <TabsTrigger 
                  value={category.href}
                  className={cn(
                    "px-6 relative h-12 data-[state=active]:shadow-none data-[state=active]:bg-transparent",
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-t-full after:content-[''] data-[state=active]:after:bg-primary",
                    "whitespace-nowrap"
                  )}
                >
                  {category.label}
                  {category.badge !== undefined && (
                    <Badge variant="secondary" className="ml-1 px-1">
                      {category.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              </Link>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </header>
  )
} 