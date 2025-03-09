"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TranscriptionEntry {
  timestamp: string
  speaker: "customer" | "bot"
  text: string
}

interface TranscriptionLogsProps {
  entries: TranscriptionEntry[]
  isPlaying: boolean
}

export function TranscriptionLogs({ entries, isPlaying }: TranscriptionLogsProps) {
  const logsRef = useRef<HTMLDivElement>(null)
  const [displayedTexts, setDisplayedTexts] = useState<Record<number, string>>({})

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (logsRef.current && isPlaying) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [entries, isPlaying])

  // Typewriter effect
  useEffect(() => {
    const newDisplayedTexts = { ...displayedTexts }
    
    entries.forEach((entry, index) => {
      if (!displayedTexts[index] || displayedTexts[index].length < entry.text.length) {
        // If entry is new or not fully typed, start/continue typing
        const typeNextChar = () => {
          setDisplayedTexts(prev => {
            const currentText = prev[index] || ""
            if (currentText.length < entry.text.length) {
              const newText = entry.text.substring(0, currentText.length + 1)
              return { ...prev, [index]: newText }
            }
            return prev
          })
        }
        
        // Only animate if playing
        if (isPlaying) {
          const timeout = setTimeout(typeNextChar, 50)
          return () => clearTimeout(timeout)
        } else if (!displayedTexts[index]) {
          // If not playing but entry is new, show first character
          newDisplayedTexts[index] = entry.text.substring(0, 1)
        }
      }
    })
    
    // Initialize new entries with first character
    if (Object.keys(newDisplayedTexts).length > Object.keys(displayedTexts).length) {
      setDisplayedTexts(newDisplayedTexts)
    }
  }, [entries, displayedTexts, isPlaying])

  return (
    <Card className="bg-black border-colorTwo">
      <CardHeader>
        <CardTitle>Transcription Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-sm">
          <div
            ref={logsRef}
            className="h-[300px] overflow-y-auto space-y-3 custom-scrollbar"
            style={{
              scrollBehavior: "smooth",
            }}
          >
            {entries.map((entry, index) => (
              <div key={index} className="whitespace-pre-wrap break-words">
                <span className="text-gray-500">[{entry.timestamp}] </span>
                <span className={entry.speaker === "customer" ? "text-colorOne" : "text-colorTwo"}>
                  {entry.speaker === "customer" ? "Customer>" : "Bot>"}{" "}
                </span>
                <span className="text-white">{displayedTexts[index] || ""}</span>
                {isPlaying && displayedTexts[index] && displayedTexts[index].length < entry.text.length && (
                  <span className="animate-pulse">|</span>
                )}
              </div>
            ))}
            <div className="h-2" /> {/* Extra space at bottom for better scrolling */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
