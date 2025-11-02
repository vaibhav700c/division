"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import PageHeader from "@/components/layout/page-header"
import Link from "next/link"
import { FileText, ArrowLeft } from "lucide-react"

export default function MeetingMinutesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to MOM page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/mom')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <main className="min-h-screen bg-background">
      <PageHeader 
        title="AI Meeting Minutes" 
        description="This feature has been moved to the MOM page"
      >
        <Link href="/mom">
          <Button variant="primary" className="gap-2">
            <FileText className="h-4 w-4" />
            Go to MOM
          </Button>
        </Link>
      </PageHeader>

      <section className="container py-8">
        <Card className="max-w-2xl mx-auto text-center">
          <CardContent className="py-12">
            <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Meeting Minutes</h2>
            <p className="text-muted-foreground mb-6">
              This feature has been moved to our new Meeting Minutes (MOM) page with enhanced AI capabilities.
              You will be redirected automatically in a few seconds.
            </p>
            <Link href="/mom">
              <Button variant="primary" size="lg" className="gap-2">
                <FileText className="h-4 w-4" />
                Go to Meeting Minutes Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
