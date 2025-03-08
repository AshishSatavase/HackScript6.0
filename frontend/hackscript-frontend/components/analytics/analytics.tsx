"use client"

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
import { Pause, Play, Upload, Volume2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"

// Full conversation data (4min 45sec = 285 seconds, with data points every 5 seconds = 57 data points)
const fullConversationData = Array.from({ length: 57 }, (_, i) => {
  const timeInSeconds = i * 5
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = timeInSeconds % 60
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`

  // Generate realistic-looking sentiment data that fluctuates
  const baseSentiment = Math.sin(i * 0.2) * 0.5
  const randomFactor = (Math.random() - 0.5) * 0.3
  const sentiment = Math.max(Math.min(baseSentiment + randomFactor, 1), -1)

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
    sentiment,
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
      <div className="flex items-center justify-center h-40 border-2 border-dashed border-colorTwo/50 rounded-lg">
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
  const [playbackRate, setPlaybackRate] = useState(1)
  const [displayedData, setDisplayedData] = useState<typeof fullConversationData>([])
  const [hasFile, setHasFile] = useState(false)
  const animationRef = useRef<number | null>(null)

  // Total duration in seconds
  const duration = 285 // 4min 45sec

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Handle play/pause
  const togglePlayback = () => {
    if (!hasFile) return
    setIsPlaying(!isPlaying)
  }

  // Handle file upload
  const handleFileUpload = () => {
    setHasFile(true)
    setCurrentTime(0)
    setIsPlaying(false)

    // Reset data when file is uploaded
    setDisplayedData([fullConversationData[0]])
  }

  // Animation effect to gradually add data points
  useEffect(() => {
    if (!hasFile) return

    // Animation function to add data points
    const animate = () => {
      setDisplayedData((prev) => {
        if (prev.length >= fullConversationData.length) {
          return prev
        }
        return fullConversationData.slice(0, prev.length + 1)
      })
    }

    // Start animation with 1 second interval
    const interval = setInterval(animate, 1000)

    // Cleanup
    return () => clearInterval(interval)
  }, [hasFile])

  // Update current time when playing
  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - currentTime * 1000

      const updateTime = () => {
        const elapsed = ((Date.now() - startTime) * playbackRate) / 1000
        if (elapsed >= duration) {
          setCurrentTime(duration)
          setIsPlaying(false)
          return
        }

        setCurrentTime(elapsed)
        animationRef.current = requestAnimationFrame(updateTime)
      }

      animationRef.current = requestAnimationFrame(updateTime)
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [isPlaying, playbackRate, currentTime, duration])

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
            <CardDescription>{hasFile ? "4:45 duration" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasFile ? (
              <div onClick={handleFileUpload} className="cursor-pointer">
                <AudioWaveform currentTime={0} duration={duration} isInitial={true} />
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

                  <div className="flex-1">
                    <AudioWaveform currentTime={currentTime} duration={duration} />
                  </div>

                  <div className="text-white font-medium">{formatTime(currentTime)}</div>

                  <div className="bg-gray-800 rounded-full px-3 py-1 text-white font-medium">{playbackRate}x</div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Volume2 size={18} />
                  <Slider defaultValue={[80]} max={100} step={1} className="w-32" />
                  <div className="ml-auto flex gap-2">
                    {[0.5, 1, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-2 py-1 rounded ${playbackRate === rate ? "bg-colorTwo text-black" : "bg-gray-800"}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Emotions Radar Chart - Top Row, Spans 4 columns */}
        <Card className="col-span-4 row-span-2 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Emotional Analysis</CardTitle>
            <CardDescription>Customer vs Bot Emotions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="70%" data={emotionsData}>
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
                    dataKey="sentiment"
                    name="Sentiment"
                    stroke="var(--color-two)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "var(--color-two)" }}
                  />
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
        <Card className="col-span-8 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Speaking Pattern</CardTitle>
            <CardDescription>Who is speaking when</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayedData}>
                  <defs>
                    <linearGradient id="colorCustomer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-one)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-one)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorBot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-two)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-two)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fill: "#fff" }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="stepAfter"
                    dataKey={(data) => (data.isBotSpeaking ? 0 : 1)}
                    name="Customer Speaking"
                    stroke="var(--color-one)"
                    fillOpacity={0.8}
                    fill="url(#colorCustomer)"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey={(data) => (data.isBotSpeaking ? 1 : 0)}
                    name="Bot Speaking"
                    stroke="var(--color-two)"
                    fillOpacity={1}
                    fill="url(#colorBot)"
                    stackId="1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
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
      </div>
    </div>
  )
}

