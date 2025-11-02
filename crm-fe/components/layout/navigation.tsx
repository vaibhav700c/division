"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Home, 
  CheckSquare, 
  FileCheck, 
  Users, 
  Calendar, 
  FileText,
  LogIn,
  BarChart3
} from "lucide-react"

interface NavigationProps {
  className?: string
}

export default function Navigation({ className }: NavigationProps) {
  const pathname = usePathname()
  
  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/tasks",
      label: "Tasks", 
      icon: CheckSquare,
    },
    {
      href: "/approvals",
      label: "Approvals",
      icon: FileCheck,
    },
    {
      href: "/teams",
      label: "Teams",
      icon: Users,
    },
    {
      href: "/calendar",
      label: "Calendar",
      icon: Calendar,
    },
    {
      href: "/mom",
      label: "Meeting Minutes",
      icon: FileText,
    },
  ]

  return (
    <nav className={cn("flex items-center gap-2", className)}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
        
        return (
          <Link key={item.href} href={item.href}>
            <Button 
              variant={isActive ? "primary" : "ghost"}
              size="sm"
              className={cn(
                "h-9 px-3 gap-2 transition-colors",
                isActive && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        )
      })}
      
      <div className="ml-auto">
        <Link href="/auth/login">
          <Button variant="outline" size="sm" className="h-9 px-3 gap-2">
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        </Link>
      </div>
    </nav>
  )
}