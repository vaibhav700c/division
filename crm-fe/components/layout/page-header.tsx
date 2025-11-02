import { ReactNode } from "react"
import Link from "next/link"
import Navigation from "./navigation"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
      <div className="container">
        {/* Navigation */}
        <div className="py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold text-foreground">TaskFlow CRM</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Task Management</p>
            </Link>
            <Navigation />
          </div>
        </div>
        
        {/* Page Header */}
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {children && (
              <div className="flex items-center gap-3">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}