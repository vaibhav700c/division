import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, User, AlertTriangle, CheckCircle, Timer, Pause } from "lucide-react"
import { useState } from "react"
import { useTimeLogging } from "@/hooks/useTimeLogging"
import { toast } from "@/hooks/use-toast"

interface TimeTrackerProps {
  taskId: string
  taskTitle: string
  estimatedHours?: number
  loggedHours?: number
}

export function TimeTracker({ taskId, taskTitle, estimatedHours, loggedHours = 0 }: TimeTrackerProps) {
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const { logTime, startTimer, stopTimer, isLoading } = useTimeLogging()

  const handleStartTimer = async () => {
    try {
      await startTimer(taskId)
      setIsTimerActive(true)
      setStartTime(new Date())
      toast({
        title: "Timer Started",
        description: `Timer started for "${taskTitle}"`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      })
    }
  }

  const handleStopTimer = async () => {
    try {
      await stopTimer(taskId)
      setIsTimerActive(false)
      setStartTime(null)
      toast({
        title: "Timer Stopped",
        description: "Time has been automatically logged",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      })
    }
  }

  const handleManualLog = async () => {
    const hours = window.prompt("Enter hours to log:")
    const hoursNum = parseFloat(hours || "0")
    
    if (hoursNum > 0) {
      try {
        await logTime({
          taskId,
          hoursLogged: hoursNum,
          description: "Manual time entry"
        })
        toast({
          title: "Time Logged",
          description: `${hoursNum} hours logged successfully`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to log time",
          variant: "destructive",
        })
      }
    }
  }

  const progressPercentage = estimatedHours ? Math.min((loggedHours / estimatedHours) * 100, 100) : 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{taskTitle}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {loggedHours}h logged
              </span>
              {estimatedHours && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {estimatedHours}h estimated
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {progressPercentage > 100 && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            {progressPercentage === 100 && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <Badge variant={progressPercentage > 100 ? "error" : "default"}>
              {Math.round(progressPercentage)}%
            </Badge>
          </div>
        </div>

        {estimatedHours && (
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage > 100
                  ? "bg-red-500"
                  : progressPercentage === 100
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        )}

        <div className="flex gap-2">
          {!isTimerActive ? (
            <Button
              onClick={handleStartTimer}
              disabled={isLoading}
              size="sm"
              className="flex items-center gap-2"
            >
              <Timer className="h-4 w-4" />
              Start Timer
            </Button>
          ) : (
            <Button
              onClick={handleStopTimer}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Stop Timer
              {startTime && (
                <span className="text-xs">
                  ({Math.round((Date.now() - startTime.getTime()) / 60000)}m)
                </span>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleManualLog}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            Log Time
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}