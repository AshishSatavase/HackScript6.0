"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Pause, Play, Upload, Volume2 } from 'lucide-react'
import { Slider } from "@/components/ui/slider"
import { TranscriptionLogs } from "@/components/analytics/transcription-logs"
import { SpeakingPattern } from "./speaking-pattern"

// Full conversation data (4min 45sec = 285 seconds, with data points every 5 seconds = 57 data points)
const fullConversationData = Array.from({ length: 57 }, (_, i) => {
  const timeInSeconds = i * 5
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = timeInSeconds % 60
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`

  // Generate realistic-looking sentiment data that fluctuates
  const baseSentiment = Math.sin(i * 0.2) * 0.5
  const randomFactor = (Math.random() - 0.5) * 0.3
  const customerSentiment = Math.max(Math.min(baseSentiment + randomFactor, 1), -1)

  // Generate bot sentiment (slightly different pattern)
  const botBaseSentiment = Math.sin(i * 0.25) * 0.4 + 0.1
  const botRandomFactor = (Math.random() - 0.5) * 0.2
  const botSentiment = Math.max(Math.min(botBaseSentiment + botRandomFactor, 1), -1)

  // Generate speaking data (who is speaking at this time)
  const isBotSpeaking = i % 8 >= 4 // Alternate every 20 seconds

  // Generate confidence data for the bot
  const baseConfidence = 0.85 + Math.sin(i * 0.3) * 0.1
  const confidenceRandomFactor = Math.random() * 0.05
  const confidence = Math.min(Math.max(baseConfidence + confidenceRandomFactor, 0.7), 0.98)

  // Generate customer satisfaction data
  const baseSatisfaction = 0.5 + Math.sin(i * 0.15) * 0.3
  const satisfactionRandomFactor = (Math.random() - 0.5) * 0.1
  const satisfaction = Math.max(Math.min(baseSatisfaction + satisfactionRandomFactor, 1), 0)

  return {
    time: timeLabel,
    timeInSeconds,
    customerSentiment,
    botSentiment,
    isBotSpeaking,
    speakingEntity: isBotSpeaking ? "Bot" : "Customer",
    botConfidence: confidence,
    customerSatisfaction: satisfaction,
  }
})

// Emotion data for the entire conversation
const emotionsData = [
  { emotion: "Joy", customer: 0.4, bot: 0.5 },
  { emotion: "Neutral", customer: 0.3, bot: 0.4 },
  { emotion: "Sadness", customer: 0.2, bot: 0.1 },
  { emotion: "Surprise", customer: 0.3, bot: 0.2 },
  { emotion: "Anger", customer: 0.35, bot: 0.15 },
  { emotion: "Disgust", customer: 0.25, bot: 0.1 },
  { emotion: "Fear", customer: 0.2, bot: 0.05 },
]

// Emotion sequence for demonstration
const emotionSequence = [
  { time: 15, emotion: "Neutral", entity: "customer" },
  { time: 30, emotion: "Joy", entity: "bot" },
  { time: 45, emotion: "Anger", entity: "customer" },
  { time: 60, emotion: "Surprise", entity: "bot" },
  { time: 75, emotion: "Sadness", entity: "customer" },
  { time: 90, emotion: "Neutral", entity: "bot" },
  { time: 105, emotion: "Fear", entity: "customer" },
  { time: 120, emotion: "Joy", entity: "bot" },
  { time: 135, emotion: "Disgust", entity: "customer" },
  { time: 150, emotion: "Surprise", entity: "bot" },
  { time: 165, emotion: "Anger", entity: "customer" },
  { time: 180, emotion: "Neutral", entity: "bot" },
  { time: 195, emotion: "Joy", entity: "customer" },
  { time: 210, emotion: "Sadness", entity: "bot" },
  { time: 225, emotion: "Neutral", entity: "customer" },
  { time: 240, emotion: "Joy", entity: "bot" },
  { time: 255, emotion: "Surprise", entity: "customer" },
  { time: 270, emotion: "Neutral", entity: "bot" },
]

const transcriptionData = [
  {
    timestamp: "00:00",
    speaker: "bot",
    text: "Hello! How can I assist you today?",
  },
  {
    timestamp: "00:03",
    speaker: "customer",
    text: "Hi, I'm having trouble with my internet connection.",
  },
  {
    timestamp: "00:07",
    speaker: "bot",
    text: "I'm sorry to hear that. Let me help you troubleshoot. First, could you tell me if your router is powered on?",
  },
  {
    timestamp: "00:12",
    speaker: "customer",
    text: "Yes, the router is on and all the lights are normal.",
  },
  {
    timestamp: "00:15",
    speaker: "bot",
    text: "Great. Have you tried restarting your router in the last 24 hours?",
  },
  {
    timestamp: "00:19",
    speaker: "customer",
    text: "No, I haven't tried that yet.",
  },
  {
    timestamp: "00:22",
    speaker: "bot",
    text: "Okay, let's try that first. Please unplug your router, wait for 30 seconds, and then plug it back in.",
  },
  {
    timestamp: "00:28",
    speaker: "customer",
    text: "Alright, I'll do that now.",
  },
  {
    timestamp: "00:45",
    speaker: "customer",
    text: "Ok, I've restarted the router and waited for it to boot up.",
  },
  {
    timestamp: "00:49",
    speaker: "bot",
    text: "Perfect. Please check if your internet connection is working now.",
  },
] as const

// Calculate talk time from the conversation data
const calculateTalkTime = (data) => {
  const customerTime = data.filter((d) => !d.isBotSpeaking).length
  const botTime = data.filter((d) => d.isBotSpeaking).length
  const total = customerTime + botTime

  return [
    { name: "Customer", value: (customerTime / total) * 100 },
    { name: "Bot", value: (botTime / total) * 100 },
  ]
}

// Count inappropriate language instances
const inappropriateLanguageCount = 7

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 border border-colorTwo/30 p-3 rounded-lg shadow-md">
        <p className="font-medium text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color || entry.fill }}>
            {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Audio waveform component
const AudioWaveform = ({ currentTime, duration, isInitial = false }) => {
  // Use ref to keep the bars stable between renders
  const barsRef = useRef(Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2))

  // Calculate which bar should be highlighted based on current time
  const progressIndex = Math.floor((currentTime / duration) * barsRef.current.length)

  if (isInitial) {
    return (
      <div className="flex items-center justify-center h-40 border-2 border-dashed border-white rounded-lg">
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-colorTwo" />
          <p className="font-mono text-lg text-white">Upload Voice Note for analysis</p>
          <p className="text-sm text-gray-400 mt-2">Click to upload or drag and drop</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center h-8 gap-0.5">
      {barsRef.current.map((height, index) => (
        <div
          key={index}
          className={`w-1 rounded-sm ${index < progressIndex ? "bg-colorTwo" : "bg-gray-500/50"}`}
          style={{ height: `${height * 100}%` }}
        ></div>
      ))}
    </div>
  )
}

export default function VoiceBotAnalytics() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [displayedData, setDisplayedData] = useState<typeof fullConversationData>([])
  const [hasFile, setHasFile] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioDuration, setAudioDuration] = useState(285) // Default duration
  const [customerEmotions, setCustomerEmotions] = useState<Record<string, number>>({})
  const [botEmotions, setBotEmotions] = useState<Record<string, number>>({})
  const [displayedTranscriptions, setDisplayedTranscriptions] = useState<typeof transcriptionData>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const animationRef = useRef<number | null>(null)

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Handle play/pause
  const togglePlayback = () => {
    if (!hasFile) return

    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play()
    }

    setIsPlaying(!isPlaying)
  }

  // Handle file upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setAudioFile(file)

    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://127.0.0.1:8000/upload-audio", {
        method: "POST",
        body: formData,
      })
  
      if (!response.ok) {
        throw new Error("Failed to upload file")
      }
  
      const result = await response.json()
      console.log("Upload successful:", result)
    } catch (error) {
      console.error("Error uploading file:", error)
    }
  
    

    // Create audio element to get duration
    const audio = new Audio(URL.createObjectURL(file))
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(audio.duration)
      audioRef.current = audio

      // Set up audio events
      audio.addEventListener("play", () => setIsPlaying(true))
      audio.addEventListener("pause", () => setIsPlaying(false))
      audio.addEventListener("ended", () => {
        setIsPlaying(false)
        setCurrentTime(audio.duration)
      })
      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime)
      })
    })

    setHasFile(true)
    setCurrentTime(0)
    setIsPlaying(false)
    setCustomerEmotions({})
    setBotEmotions({})

    // Reset data when file is uploaded
    setDisplayedData([fullConversationData[0]])
  }

  // Handle seeking in the audio
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasFile || !audioRef.current) return

    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * audioDuration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Update displayed data based on current time
  useEffect(() => {
    if (!hasFile) return

    // Find the appropriate data points to display based on current time
    const dataIndex = Math.min(Math.floor(currentTime / 5), fullConversationData.length - 1)

    setDisplayedData(fullConversationData.slice(0, dataIndex + 1))

    // Update transcriptions based on current time
    const currentTimeInSeconds = Math.floor(currentTime)
    const relevantTranscriptions = transcriptionData.filter(entry => {
      const [minutes, seconds] = entry.timestamp.split(":").map(Number)
      return (minutes * 60 + seconds) <= currentTimeInSeconds
    })
    setDisplayedTranscriptions(relevantTranscriptions)

    // Update emotions based on the emotion sequence
    const relevantEmotions = emotionSequence.filter((item) => item.time <= currentTime)

    // Process customer emotions
    const customerEmotionMap: Record<string, number> = {}
    const botEmotionMap: Record<string, number> = {}

    relevantEmotions.forEach((item) => {
      if (item.entity === "customer") {
        customerEmotionMap[item.emotion] = 0.5
      } else {
        botEmotionMap[item.emotion] = 0.5
      }
    })

    setCustomerEmotions(customerEmotionMap)
    setBotEmotions(botEmotionMap)
  }, [currentTime, hasFile])

  // Calculate talk time based on current displayed data
  const talkTimeData = calculateTalkTime(displayedData)

  return (
    <div className="container mx-auto p-4 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">Voice Bot Conversation Analysis</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Audio Player - Top Row, Spans 8 columns */}
        <Card className="col-span-8 bg-black border-colorTwo">
          <CardHeader className="pb-2">
            <CardTitle>Conversation Recording</CardTitle>
            <CardDescription>{hasFile ? `${formatTime(audioDuration)} duration` : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasFile ? (
              <div onClick={handleUploadClick} className="cursor-pointer">
                <AudioWaveform currentTime={0} duration={audioDuration} isInitial={true} />
                <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileChange} />
              </div>
            ) : (
              <>
                <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-4">
                  <button
                    onClick={togglePlayback}
                    className="w-10 h-10 bg-colorTwo rounded-full flex items-center justify-center text-black"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <div className="flex-1 cursor-pointer" onClick={handleSeek}>
                    <AudioWaveform currentTime={currentTime} duration={audioDuration} />
                  </div>

                  <div className="text-white font-medium">{formatTime(currentTime)}</div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Volume2 size={18} />
                  <Slider
                    defaultValue={[80]}
                    max={100}
                    step={1}
                    className="w-32"
                    onValueChange={(value) => {
                      if (audioRef.current) {
                        audioRef.current.volume = value[0] / 100
                      }
                    }}
                  />
                  <div
                    className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden ml-4 cursor-pointer"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full bg-colorTwo"
                      style={{ width: `${(currentTime / audioDuration) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Emotions Radar Charts - Top Row, Spans 4 columns */}
        <Card className="col-span-4 row-span-2 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Emotional Analysis</CardTitle>
            <CardDescription>Customer vs Bot Emotions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  outerRadius="70%"
                  data={[
                    { emotion: "Joy", customer: customerEmotions["Joy"] || 0, bot: botEmotions["Joy"] || 0 },
                    {
                      emotion: "Neutral",
                      customer: customerEmotions["Neutral"] || 0,
                      bot: botEmotions["Neutral"] || 0,
                    },
                    {
                      emotion: "Sadness",
                      customer: customerEmotions["Sadness"] || 0,
                      bot: botEmotions["Sadness"] || 0,
                    },
                    {
                      emotion: "Surprise",
                      customer: customerEmotions["Surprise"] || 0,
                      bot: botEmotions["Surprise"] || 0,
                    },
                    { emotion: "Anger", customer: customerEmotions["Anger"] || 0, bot: botEmotions["Anger"] || 0 },
                    {
                      emotion: "Disgust",
                      customer: customerEmotions["Disgust"] || 0,
                      bot: botEmotions["Disgust"] || 0,
                    },
                    { emotion: "Fear", customer: customerEmotions["Fear"] || 0, bot: botEmotions["Fear"] || 0 },
                  ]}
                >
                  <PolarGrid stroke="var(--white-black)" opacity={0.2} />
                  <PolarAngleAxis dataKey="emotion" stroke="#fff" />
                  <Radar
                    name="Customer"
                    dataKey="customer"
                    stroke="var(--color-one)"
                    fill="var(--color-one)"
                    fillOpacity={0.5}
                  />
                  <Radar name="Bot" dataKey="bot" stroke="var(--color-two)" fill="var(--color-two)" fillOpacity={0.5} />
                  <Legend />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Analysis - Second Row, Spans 8 columns */}
        <Card className="col-span-8 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
            <CardDescription>Positive above, negative below</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayedData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fill: "#fff" }} tickCount={10} />
                  <YAxis
                    domain={[-1, 1]}
                    tickCount={5}
                    tick={{ fill: "#fff" }}
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#fff" strokeOpacity={0.5} />
                  <Line
                    type="monotone"
                    dataKey="customerSentiment"
                    name="Customer Sentiment"
                    stroke="var(--color-one)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "var(--color-one)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="botSentiment"
                    name="Bot Sentiment"
                    stroke="var(--color-two)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "var(--color-two)" }}
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Third Row - 3 charts */}
        <Card className="col-span-4 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Talk Time</CardTitle>
            <CardDescription>Speaking distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={talkTimeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill="var(--color-one)" />
                    <Cell fill="var(--color-two)" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bot Confidence Level */}
        <Card className="col-span-4 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Bot Confidence</CardTitle>
            <CardDescription>Throughout the conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayedData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fill: "#fff" }} tickCount={6} />
                  <YAxis domain={[0.7, 1]} tickFormatter={(value) => value.toFixed(1)} tick={{ fill: "#fff" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="botConfidence"
                    name="Confidence"
                    stroke="var(--color-five)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--color-five)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Satisfaction */}
        <Card className="col-span-4 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
            <CardDescription>Real-time rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayedData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fill: "#fff" }} tickCount={6} />
                  <YAxis domain={[0, 1]} tickFormatter={(value) => value.toFixed(1)} tick={{ fill: "#fff" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="customerSatisfaction"
                    name="Satisfaction"
                    stroke="var(--color-four)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--color-four)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fourth Row - 2 charts */}
         {/* Fourth Row - Speaking Pattern Timeline (replaced area chart) */}
         <Card className="col-span-8 bg-black border-colorTwo">
          <SpeakingPattern data={fullConversationData} currentTime={currentTime} />
        </Card>

        {/* Cuss Words Card */}
        <Card className="col-span-4 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Inappropriate Language</CardTitle>
            <CardDescription>Detected in conversation</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[200px]">
            <div className="text-5xl font-bold text-colorThree">{inappropriateLanguageCount}</div>
            <div className="text-sm mt-2">instances detected</div>
            <div className="mt-4 text-sm">
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className="bg-colorThree h-2.5 rounded-full"
                  style={{ width: `${(inappropriateLanguageCount / 20) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs mt-1">Severity level: {Math.round((inappropriateLanguageCount / 20) * 100)}%</div>
            </div>
          </CardContent>
        
        </Card>
        <Card className="col-span-12 bg-black border-colorTwo">
          <TranscriptionLogs entries={displayedTranscriptions} isPlaying={isPlaying} />
        </Card>
      </div>
    </div>
  )
}
