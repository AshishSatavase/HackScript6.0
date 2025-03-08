"use client"

import { useEffect, useRef } from "react"
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

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (logsRef.current && isPlaying) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [entries, isPlaying])

  return (
    <Card className="bg-black border-colorTwo">
      <CardHeader>
        <CardTitle>Transcription Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-sm">
          <div className="text-gray-500 border-b border-gray-800 pb-2 mb-2">
            Microsoft Windows [Version 10.0.26100.3194]
            <br />
            (c) Microsoft Corporation. All rights reserved.
          </div>
          <div
            ref={logsRef}
            className="h-[300px] overflow-y-auto space-y-1 custom-scrollbar"
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
                <span className="text-white">{entry.text}</span>
              </div>
            ))}
            <div className="h-2" /> {/* Extra space at bottom for better scrolling */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
