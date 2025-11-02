import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Navigation from "@/components/layout/navigation"
import Footer from "@/components/layout/footer"

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container">
          {/* Navigation */}
          <div className="py-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">TaskFlow CRM</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Task Management</p>
              </div>
              <Navigation />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold text-foreground mb-4">Intelligent Task Assignment & Approval Workflow</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Streamline team collaboration with AI-assisted task suggestions, real-time workload tracking, and approval
            workflows.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="primary" size="lg">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/mom">
              <Button variant="outline" size="lg" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                Meeting Minutes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-16 bg-gradient-to-r bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">AI-Powered Features</h3>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Leverage artificial intelligence to optimize team productivity and streamline workflows
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link href="/ai/suggestions">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <span className="text-2xl">🧠</span>
                    Task Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">Get intelligent task assignment recommendations based on team skills and workload</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/mom">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <span className="text-2xl">📝</span>
                    Meeting Minutes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">Automatically generate structured meeting minutes from discussion topics</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/ai/workload">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <span className="text-2xl">📊</span>
                    Workload Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">Analyze team capacity and identify potential burnout risks with AI insights</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-16">
        <h3 className="text-2xl font-semibold text-foreground mb-8">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Create, assign, and track tasks with priority levels, time estimates, and location tagging.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Role-based approval queues with escalation paths and detailed audit trails.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Assistance</CardTitle>
            </CardHeader>
            <CardContent>
              <p>AI-powered task suggestions, meeting minute generation, and burnout detection.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workload Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Real-time workload heatmaps and team capacity planning tools.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Sync with Google Calendar and view scheduled tasks in context.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Admin, Team Leader, and Team Member roles with granular permissions.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
