"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Search, Bell, User, MessageCircle, Camera } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MobileNavProps extends React.HTMLAttributes<HTMLElement> {
  className?: string
}

export function MobileNav({ className, ...props }: MobileNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: "首页",
      icon: Home,
      active: pathname === "/",
      badge: 0,
    },
    {
      href: "/search",
      label: "搜索",
      icon: Search,
      active: pathname === "/search",
      badge: 0,
    },
    {
      href: "/moments",
      label: "瞬间",
      icon: Camera,
      active: pathname.startsWith("/moments"),
      badge: 0,
    },
    {
      href: "/notifications",
      label: "通知",
      icon: Bell,
      active: pathname === "/notifications",
      badge: 3, // Example notification count
    },
    {
      href: "/profile",
      label: "我的",
      icon: User,
      active: pathname.startsWith("/profile"),
      badge: 0,
    }
  ]

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background/95 backdrop-blur md:hidden",
        className
      )}
      {...props}
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-1 flex-col items-center justify-center py-2.5 text-xs relative",
            item.active
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <div className="relative">
            {React.createElement(item.icon, {
              className: cn("h-6 w-6 mb-0.5", item.active && "text-primary"),
            })}
            {item.badge > 0 && (
              <Badge 
                className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white" 
                variant="destructive"
              >
                {item.badge > 9 ? "9+" : item.badge}
              </Badge>
            )}
          </div>
          <span className="text-[10px] mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
} 