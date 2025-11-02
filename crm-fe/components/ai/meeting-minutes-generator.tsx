import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Upload, Download, Mic, MicOff } from "lucide-react"
import { useState, useRef } from "react"
import { useMeetingMinutes } from "@/hooks/useMeetingMinutes"
import { toast } from "@/hooks/use-toast"

interface MeetingMinutesGeneratorProps {
  teamId?: string
  onMinutesGenerated?: (minutes: any) => void
}

export function MeetingMinutesGenerator({ teamId, onMinutesGenerated }: MeetingMinutesGeneratorProps) {
  const [transcript, setTranscript] = useState("")
  const [meetingType, setMeetingType] = useState("")
  const [attendees, setAttendees] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [generatedMinutes, setGeneratedMinutes] = useState<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const { generateMinutes, isLoading } = useMeetingMinutes(teamId)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        // Here you would typically send the audio to a speech-to-text service
        // For now, we'll just show a placeholder
        setTranscript(prev => prev + "\n[Audio recorded - would be transcribed here]")
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      toast({
        title: "Recording Started",
        description: "Audio is being recorded for transcription",
      })
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not start audio recording",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast({
        title: "Recording Stopped",
        description: "Audio has been processed",
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setTranscript(content)
        toast({
          title: "File Uploaded",
          description: "Transcript loaded successfully",
        })
      }
      reader.readAsText(file)
    }
  }

  const handleGenerateMinutes = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Missing Transcript",
        description: "Please provide a meeting transcript",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await generateMinutes({
        transcript,
        meetingType: meetingType || "Team Meeting",
        attendees: attendees.split(',').map(a => a.trim()).filter(Boolean),
        date: new Date().toISOString()
      })
      
      setGeneratedMinutes(result)
      onMinutesGenerated?.(result)
      
      toast({
        title: "Minutes Generated",
        description: "Meeting minutes have been created successfully",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate meeting minutes",
        variant: "destructive",
      })
    }
  }

  const exportMinutes = () => {
    if (!generatedMinutes) return
    
    const content = `
# ${generatedMinutes.title || 'Meeting Minutes'}

**Date:** ${new Date(generatedMinutes.createdAt).toLocaleDateString()}
**Type:** ${meetingType || 'Team Meeting'}
**Attendees:** ${attendees || 'Not specified'}

## Summary
${generatedMinutes.summary}

## Key Points
${generatedMinutes.keyPoints?.map((point: string) => `- ${point}`).join('\n') || 'No key points'}

## Action Items
${generatedMinutes.actionItems?.map((item: any) => 
  `- **${item.task}** (Owner: ${item.owner}, Due: ${item.dueDate})`
).join('\n') || 'No action items'}
    `.trim()
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-minutes-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meeting Minutes Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meetingType">Meeting Type</Label>
              <Input
                id="meetingType"
                placeholder="e.g., Sprint Planning, Standup, Review"
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees (comma-separated)</Label>
              <Input
                id="attendees"
                placeholder="John Doe, Jane Smith, Bob Johnson"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcript">Meeting Transcript</Label>
            <Textarea
              id="transcript"
              placeholder="Paste your meeting transcript here or use the recording/upload options below..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={10}
              className="min-h-[200px]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Transcript
              </Button>
            </div>
          </div>

          <Button
            onClick={handleGenerateMinutes}
            disabled={isLoading || !transcript.trim()}
            className="w-full"
          >
            {isLoading ? "Generating..." : "Generate Meeting Minutes"}
          </Button>
        </CardContent>
      </Card>

      {generatedMinutes && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Generated Minutes</CardTitle>
            <Button
              onClick={exportMinutes}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{generatedMinutes.title}</h3>
              <p className="text-muted-foreground mb-4">{generatedMinutes.summary}</p>
            </div>

            {generatedMinutes.keyPoints?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Key Points</h4>
                <ul className="list-disc list-inside space-y-1">
                  {generatedMinutes.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="text-sm">{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {generatedMinutes.actionItems?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Action Items</h4>
                <div className="space-y-2">
                  {generatedMinutes.actionItems.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-medium">{item.task}</span>
                      <div className="text-xs text-muted-foreground">
                        {item.owner} • {item.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}