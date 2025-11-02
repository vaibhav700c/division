import { ReactNode } from "react"
import PageHeader from "./page-header"

interface AppLayoutProps {
  title: string
  description?: string
  children: ReactNode
  headerActions?: ReactNode
}

export default function AppLayout({ title, description, children, headerActions }: AppLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      <PageHeader title={title} description={description}>
        {headerActions}
      </PageHeader>
      
      <div className="container py-8">
        {children}
      </div>
    </main>
  )
}