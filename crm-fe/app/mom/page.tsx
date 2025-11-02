"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMeetingMinutes } from "@/hooks/useMeetingMinutes"
import PageHeader from "@/components/layout/page-header"
import { FileText, Download, Copy, Sparkles } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { MeetingMinutes } from "@/types"

export default function MOMPage() {
  const { isLoading, error, generateMinutes } = useMeetingMinutes()
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingNotes, setMeetingNotes] = useState("")
  const [generatedMinutes, setGeneratedMinutes] = useState<MeetingMinutes | null>(null)

  const handleGenerate = async () => {
    if (!meetingTitle.trim() || !meetingNotes.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide meeting title and notes",
        variant: "destructive",
      })
      return
    }
    
    try {
      const result = await generateMinutes({
        transcript: meetingNotes,
        meetingType: meetingTitle,
        date: new Date().toISOString(),
      })
      setGeneratedMinutes(result)
    } catch (err) {
      console.error('Failed to generate minutes:', err)
    }
  }

  const handleCopyMinutes = () => {
    if (generatedMinutes) {
      navigator.clipboard.writeText(JSON.stringify(generatedMinutes, null, 2))
      toast({
        title: "Copied to clipboard",
        description: "Meeting minutes have been copied to your clipboard",
      })
    }
  }

  const handleDownloadMinutes = () => {
    if (generatedMinutes) {
      const blob = new Blob([JSON.stringify(generatedMinutes, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meeting-minutes-${meetingTitle.replace(/\s+/g, '-').toLowerCase()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <PageHeader 
        title="Meeting Minutes (MOM)" 
        description="Generate structured meeting minutes with AI assistance"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Templates
        </Button>
      </PageHeader>

      <section className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Generate Minutes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Sprint Planning Meeting"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Meeting Notes</Label>
                  <textarea
                    id="notes"
                    placeholder="Paste your meeting notes here...

Example:
- Discussed current sprint progress
- John mentioned backend API issues
- Sarah suggested new UI improvements
- Need to schedule design review
- Action items: Fix API by Friday, Review designs Monday"
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!meetingTitle.trim() || !meetingNotes.trim() || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Minutes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="border-destructive/50 bg-destructive/5 mb-6">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Generating Meeting Minutes</h3>
                    <p className="text-muted-foreground">Our AI is analyzing your notes and structuring the minutes...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {generatedMinutes && !isLoading && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Generated Minutes
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyMinutes}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadMinutes}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Meeting Info */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">Meeting Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Title:</span> {generatedMinutes.title}</p>
                      <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Summary */}
                  {generatedMinutes.summary && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Summary</h3>
                      <p className="text-muted-foreground">{generatedMinutes.summary}</p>
                    </div>
                  )}

                  {/* Action Items */}
                  {generatedMinutes.actionItems && generatedMinutes.actionItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Action Items</h3>
                      <div className="space-y-2">
                        {generatedMinutes.actionItems.map((action, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground font-medium">{action.description}</p>
                              {action.ownerName && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Assigned to: <span className="font-medium">{action.ownerName}</span>
                                </p>
                              )}
                              {action.dueDate && (
                                <p className="text-xs text-muted-foreground">
                                  Due: <span className="font-medium">{action.dueDate}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decisions */}
                  {generatedMinutes.decisions && generatedMinutes.decisions.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Decisions Made</h3>
                      <div className="space-y-2">
                        {generatedMinutes.decisions.map((decision, index) => (
                          <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-foreground">{decision}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!generatedMinutes && !isLoading && !error && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Generate Minutes</h3>
                    <p className="text-muted-foreground">Enter your meeting details and notes to get started</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}