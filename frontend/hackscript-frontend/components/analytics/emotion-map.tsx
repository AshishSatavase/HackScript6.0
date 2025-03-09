"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface EmotionMapProps {
  currentTime: number
  emotionSequence: Array<{
    time: number
    emotion: string
    entity: string
  }>
}

const emotionColors = {
  Joy: "#4ade80",
  Neutral: "#94a3b8",
  Sadness: "#60a5fa",
  Surprise: "#facc15",
  Anger: "#f87171",
  Disgust: "#a78bfa",
  Fear: "#fb923c"
}

export function EmotionMap({ currentTime, emotionSequence }: EmotionMapProps) {
  const [currentEmotions, setCurrentEmotions] = useState<{
    customer: string | null
    bot: string | null
  }>({
    customer: null,
    bot: null
  })

  useEffect(() => {
    // Find the most recent emotions for customer and bot based on current time
    const customerEmotions = emotionSequence
      .filter(item => item.time <= currentTime && item.entity === "customer")
      .sort((a, b) => b.time - a.time)

    const botEmotions = emotionSequence
      .filter(item => item.time <= currentTime && item.entity === "bot")
      .sort((a, b) => b.time - a.time)

    setCurrentEmotions({
      customer: customerEmotions.length > 0 ? customerEmotions[0].emotion : null,
      bot: botEmotions.length > 0 ? botEmotions[0].emotion : null
    })
  }, [currentTime, emotionSequence])

  return (
    <Card className="bg-black border-colorTwo">
      <CardHeader>
        <CardTitle>Current Emotions</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-around">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Customer</div>
          {currentEmotions.customer ? (
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-black font-bold text-lg"
              style={{ backgroundColor: emotionColors[currentEmotions.customer as keyof typeof emotionColors] || "#94a3b8" }}
            >
              {currentEmotions.customer}
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-white">
              No data
            </div>
          )}
        </div>
        
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Bot</div>
          {currentEmotions.bot ? (
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-black font-bold text-lg"
              style={{ backgroundColor: emotionColors[currentEmotions.bot as keyof typeof emotionColors] || "#94a3b8" }}
            >
              {currentEmotions.bot}
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-white">
              No data
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
