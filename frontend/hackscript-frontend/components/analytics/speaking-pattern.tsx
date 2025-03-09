"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRef, useEffect } from "react"

interface SpeakingPatternProps {
  currentTime: number
  data: Array<{
    timeInSeconds: number
    isBotSpeaking: boolean
    time: string
  }>
}

export function SpeakingPattern({ currentTime, data }: SpeakingPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Generate time markers every second from 0:00 to 1:00
  const timeMarkers = Array.from({ length: 60 }, (_, i) => {
    const seconds = i
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  })

  // Calculate visible window based on current time
  useEffect(() => {
    if (containerRef.current && timelineRef.current) {
      const containerWidth = containerRef.current.clientWidth
      const timelineWidth = timelineRef.current.scrollWidth

      // Calculate position based on current time
      const position = (currentTime / (data.length * 5)) * timelineWidth

      // Calculate scroll position to keep the current time in view
      // We want the current time to be visible in the middle of the container when possible
      const scrollPosition = Math.max(0, position - containerWidth / 2)

      // Scroll the container
      containerRef.current.scrollLeft = scrollPosition
    }
  }, [currentTime, data.length])

  return (
    <Card className="bg-black border-colorTwo">
      <CardHeader>
        <CardTitle>Diarization</CardTitle>
        <p className="text-sm text-gray-400">Who is speaking when</p>
      </CardHeader>
      <CardContent>
        <div className="relative" ref={containerRef} style={{ overflowX: "auto", overflowY: "hidden" }}>
          <div ref={timelineRef} style={{ minWidth: "100%", width: "max-content" }}>
            {/* Time markers */}
            <div className="flex mb-2">
              {timeMarkers.map((time, i) => (
                <div key={i} className="w-10 text-xs text-gray-400 text-center">
                  {time}
                </div>
              ))}
            </div>

            {/* Labels for customer and bot */}
            <div className="flex mb-1">
              <div className="w-20 text-xs text-gray-400">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-[#6366f1] mr-1"></span>
                  Customer
                </span>
              </div>
            </div>

            {/* Customer speaking pattern */}
            <div className="flex h-16 mb-2 gap-0.5">
              {data.map((item, i) => (
                <div
                  key={i}
                  className={`w-10 rounded-sm ${
                    !item.isBotSpeaking && i * 5 <= currentTime
                      ? "bg-[#6366f1]" // Purple/blue color matching the image
                      : "bg-gray-800"
                  }`}
                  style={{ height: "100%" }}
                />
              ))}
            </div>

            {/* Label for bot */}
            <div className="flex mb-1">
              <div className="w-20 text-xs text-gray-400">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 mr-1"></span>
                  Voice Bot
                </span>
              </div>
            </div>

            {/* Bot speaking pattern */}
            <div className="flex h-16 gap-0.5">
              {data.map((item, i) => (
                <div
                  key={i}
                  className={`w-10 rounded-sm ${
                    item.isBotSpeaking && i * 5 <= currentTime
                      ? "bg-emerald-500" // Green color for bot
                      : "bg-gray-800"
                  }`}
                  style={{ height: "100%" }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div
                className="h-full bg-white"
                style={{
                  width: `${Math.min((currentTime / (data.length * 5)) * 100, 100)}%`,
                  transition: "width 0.1s linear",
                  maxWidth: "100%",
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

