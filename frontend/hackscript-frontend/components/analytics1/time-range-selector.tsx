"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayCircle, PauseCircle, SkipForward, SkipBack } from "lucide-react"

interface TimeRangeSelectorProps {
  timeRange: { start: number; end: number }
  setTimeRange: (range: { start: number; end: number }) => void
  maxTime: number
  step?: number
  windowSize?: number
}

export function TimeRangeSelector({
  timeRange,
  setTimeRange,
  maxTime,
  step = 0.5,
  windowSize = 5,
}: TimeRangeSelectorProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [sliderValue, setSliderValue] = useState(timeRange.start)

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying) {
      interval = setInterval(() => {
        setSliderValue((prev) => {
          const newValue = prev + step
          if (newValue + windowSize > maxTime) {
            setIsPlaying(false)
            return prev
          }
          return newValue
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isPlaying, maxTime, step, windowSize])

  // Update time range when slider changes
  useEffect(() => {
    setTimeRange({
      start: sliderValue,
      end: sliderValue + windowSize,
    })
  }, [sliderValue, setTimeRange, windowSize])

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0])
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSkipForward = () => {
    const newValue = Math.min(sliderValue + windowSize, maxTime - windowSize)
    setSliderValue(newValue)
  }

  const handleSkipBack = () => {
    const newValue = Math.max(sliderValue - windowSize, 0)
    setSliderValue(newValue)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Range Selection</CardTitle>
        <CardDescription>Select a time window to analyze conversation data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Current: {timeRange.start.toFixed(1)}s - {timeRange.end.toFixed(1)}s
          </span>
          <span className="text-sm text-muted-foreground">Total Duration: {maxTime.toFixed(1)}s</span>
        </div>

        <div className="pt-4 pb-2">
          <Slider
            value={[sliderValue]}
            min={0}
            max={maxTime - windowSize}
            step={step}
            onValueChange={handleSliderChange}
          />
        </div>

        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="icon" onClick={handleSkipBack}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handlePlayPause}>
            {isPlaying ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={handleSkipForward}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

