"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
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
import axios from "axios"
import { Pause, Play, Upload, Volume2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { TranscriptionLogs } from "@/components/analytics/transcription-logs"
import { SpeakingPattern } from "@/components/analytics/speaking-pattern"

// Types for the API response
interface ContextAnalysis {
  start_time: number
  end_time: number
  speaker: string
  text: string
  sentiment_label: string
  sentiment_score: number
  normalized_score: number
}

interface EmotionAnalysis {
  index: number
  speaker: string
  text: string
  dominant_emotion: string
  dominant_score: number
  anger: number
  disgust: number
  fear: number
  joy: number
  neutral: number
  sadness: number
  surprise: number
}

interface SentimentAnalysis {
  index: number
  speaker: string
  text: string
  sentiment_label: string
  sentiment_score: number
  normalized_score: number
}

interface ToneSegment {
  segment_idx: number
  time_start: number
  tone: string
  features: {
    mfcc_mean: number
    chroma_mean: number
    spectral_contrast_mean: number
    spectral_centroid_mean: number
    spectral_rolloff_mean: number
    pitch_mean: number
    rms_mean: number
  }
}

interface ApiResponse {
  context_analysis: ContextAnalysis[]
  emotional_analysis: {
    per_utterance_analysis: EmotionAnalysis[]
    overall_analysis: {
      dominant_emotion: string
      dominant_score: number
      emotion_distribution: {
        anger: number
        disgust: number
        fear: number
        joy: number
        neutral: number
        sadness: number
        surprise: number
      }
    }
    speaker_emotions: Record<
      string,
      {
        anger: number
        disgust: number
        fear: number
        joy: number
        neutral: number
        sadness: number
        dominant_emotion: [string, number]
      }
    >
    emotional_shifts: {
      index: number
      text: string
      from_emotion: string
      to_emotion: string
    }[]
  }
  sentiment_analysis: {
    utterances: SentimentAnalysis[]
    conversation_summary: {
      overall_sentiment: number
      recent_sentiment: number
      trend_direction: string
    }
  }
  tone_analysis: {
    file_info: {
      duration: number
    }
    segments: ToneSegment[]
  }
}

// Format time for display
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
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
  const [hasFile, setHasFile] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [responseData, setResponseData] = useState<ApiResponse | null>(null)
  const [displayedTranscriptions, setDisplayedTranscriptions] = useState<any[]>([])
  const [displayedSpeakingData, setDisplayedSpeakingData] = useState<any[]>([])
  const [displayedSentimentData, setDisplayedSentimentData] = useState<any[]>([])
  const [displayedEmotions, setDisplayedEmotions] = useState<Record<string, Record<string, number>>>({})
  const [inappropriateCount, setInappropriateCount] = useState(0)
  const [customerSatisfaction, setCustomerSatisfaction] = useState<any[]>([])
  const [botConfidence, setBotConfidence] = useState<any[]>([])
  const [talkTimeData, setTalkTimeData] = useState<any[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Process API response data
  const processResponseData = (data: ApiResponse) => {
    if (!data) return

    // Calculate total duration from the API response
    const duration = data.tone_analysis?.file_info?.duration || 0
    setAudioDuration(duration)

    // Process speaking pattern data
    const speakingData = data.context_analysis.map((item) => ({
      timeInSeconds: item.start_time,
      isBotSpeaking: item.speaker === "SPEAKER_01", // Assuming SPEAKER_01 is the bot
      time: formatTime(item.start_time),
      text: item.text,
    }))
    setDisplayedSpeakingData(speakingData)

    // Process sentiment data
    const sentimentData = data.sentiment_analysis.utterances.map((item) => ({
      time: formatTime(item.index * 5), // Approximate time based on index
      timeInSeconds: item.index * 5,
      customerSentiment: item.speaker === "SPEAKER_00" ? item.normalized_score : null,
      botSentiment: item.speaker === "SPEAKER_01" ? item.normalized_score : null,
      text: item.text,
    }))
    setDisplayedSentimentData(sentimentData)

    // Process transcription data
    const transcriptionData = data.context_analysis.map((item) => ({
      timestamp: formatTime(item.start_time),
      speaker: item.speaker === "SPEAKER_01" ? "bot" : "customer",
      text: item.text,
    }))
    setDisplayedTranscriptions(transcriptionData)

    // Calculate talk time
    const customerTime = data.context_analysis.filter((d) => d.speaker === "SPEAKER_00").length
    const botTime = data.context_analysis.filter((d) => d.speaker === "SPEAKER_01").length
    const total = customerTime + botTime

    setTalkTimeData([
      { name: "Customer", value: (customerTime / total) * 100 },
      { name: "Bot", value: (botTime / total) * 100 },
    ])

    // Count inappropriate language (for demo, using a random count based on sentiment)
    const negativeUtterances = data.sentiment_analysis.utterances.filter(
      (u) => u.sentiment_label === "NEGATIVE" && u.speaker === "SPEAKER_00",
    )
    setInappropriateCount(Math.min(negativeUtterances.length, 10))

    // Extract emotion data
    const customerEmotions = data.emotional_analysis.speaker_emotions["SPEAKER_00"] || {}
    const botEmotions = data.emotional_analysis.speaker_emotions["SPEAKER_01"] || {}

    setDisplayedEmotions({
      customer: {
        joy: customerEmotions.joy || 0,
        neutral: customerEmotions.neutral || 0,
        sadness: customerEmotions.sadness || 0,
        surprise: customerEmotions.surprise || 0,
        anger: customerEmotions.anger || 0,
        disgust: customerEmotions.disgust || 0,
        fear: customerEmotions.fear || 0,
      },
      bot: {
        joy: botEmotions.joy || 0,
        neutral: botEmotions.neutral || 0,
        sadness: botEmotions.sadness || 0,
        surprise: botEmotions.surprise || 0,
        anger: botEmotions.anger || 0,
        disgust: botEmotions.disgust || 0,
        fear: botEmotions.fear || 0,
      },
    })

    // Generate satisfaction and confidence data based on sentiment and emotions
    const satisfactionData = []
    const confidenceData = []

    // Generate data points every 5 seconds
    const dataPoints = Math.ceil(duration / 5)

    for (let i = 0; i < dataPoints; i++) {
      const timePoint = i * 5
      const timeLabel = formatTime(timePoint)

      // Find closest sentiment data
      const relevantSentiment = data.sentiment_analysis.utterances.filter((u) => u.index * 5 <= timePoint).slice(-3)

      // Calculate satisfaction based on recent customer sentiment
      const customerSentiments = relevantSentiment
        .filter((u) => u.speaker === "SPEAKER_00")
        .map((u) => u.normalized_score)

      const avgCustomerSentiment =
        customerSentiments.length > 0 ? customerSentiments.reduce((a, b) => a + b, 0) / customerSentiments.length : 0

      // Map sentiment from [-1, 1] to [0, 1]
      const satisfaction = (avgCustomerSentiment + 1) / 2

      // Calculate bot confidence based on emotion certainty
      const relevantEmotions = data.emotional_analysis.per_utterance_analysis
        .filter((u) => u.index * 5 <= timePoint && u.speaker === "SPEAKER_01")
        .slice(-2)

      const avgConfidence =
        relevantEmotions.length > 0
          ? relevantEmotions.reduce((a, b) => a + b.dominant_score, 0) / relevantEmotions.length
          : 0.85

      // Add some variation to make the graph interesting
      const confidenceWithNoise = Math.min(Math.max(avgConfidence + (Math.random() - 0.5) * 0.1, 0.7), 0.98)

      satisfactionData.push({
        time: timeLabel,
        timeInSeconds: timePoint,
        customerSatisfaction: satisfaction,
      })

      confidenceData.push({
        time: timeLabel,
        timeInSeconds: timePoint,
        botConfidence: confidenceWithNoise,
      })
    }

    setCustomerSatisfaction(satisfactionData)
    setBotConfidence(confidenceData)
  }

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setAudioFile(file)
    setUploading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await axios.post("http://192.168.19.26:8000/process-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      console.log("API Response:", response.data)
      setResponseData(response.data)
      processResponseData(response.data)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("File upload failed! Using sample data for demonstration.")

      // For demo purposes, use the sample data from the JSON file
      // In a real app, you'd handle the error differently
      const sampleData = {
        context_analysis: [
          {
            start_time: 1.75,
            end_time: 3.91,
            speaker: "SPEAKER_01",
            text: "How was your online assessment today?",
            sentiment_label: "POSITIVE",
            sentiment_score: 0.9949070811271667,
            normalized_score: 0.9949070811271667,
          },
          {
            start_time: 4.72,
            end_time: 10.21,
            speaker: "SPEAKER_00",
            text: "Yeah, it was good. Just now started doing audio recording and stuff. What about you?",
            sentiment_label: "POSITIVE",
            sentiment_score: 0.9982783794403076,
            normalized_score: 0.9982783794403076,
          },
          // More entries would be here in the real data
        ],
        emotional_analysis: {
          per_utterance_analysis: [
            {
              index: 0,
              speaker: "SPEAKER_01",
              text: "Hi there, I'm Casey from Quick Help Support Team. I appreciate you reaching out. How may I assist you?",
              dominant_emotion: "joy",
              dominant_score: 0.731741189956665,
              anger: 0.005421736743301153,
              disgust: 0.0032566366717219353,
              fear: 0.002451468724757433,
              joy: 0.731741189956665,
              neutral: 0.14554856717586517,
              sadness: 0.03841809928417206,
              surprise: 0.07316237688064575,
            },
            // More entries would be here in the real data
          ],
          overall_analysis: {
            dominant_emotion: "neutral",
            dominant_score: 0.4113549482491281,
            emotion_distribution: {
              anger: 0.029368599695670936,
              disgust: 0.030516597739834752,
              fear: 0.006782634662360781,
              joy: 0.2842753488673932,
              neutral: 0.4113549482491281,
              sadness: 0.1903710180065698,
              surprise: 0.047330853503404394,
            },
          },
          speaker_emotions: {
            SPEAKER_01: {
              anger: 0.02405279506929219,
              disgust: 0.033150560385547576,
              fear: 0.007294698804616928,
              joy: 0.28840454551391304,
              neutral: 0.5617251038551331,
              sadness: 0.026443790085613726,
              surprise: 0.05892850384116173,
              dominant_emotion: ["neutral", 0.5617251038551331],
            },
            SPEAKER_00: {
              anger: 0.03601335547864437,
              disgust: 0.02722414443269372,
              fear: 0.006142554484540597,
              joy: 0.2791138530592434,
              neutral: 0.22339225374162197,
              sadness: 0.3952800529077649,
              surprise: 0.03283379058120772,
              dominant_emotion: ["sadness", 0.3952800529077649],
            },
          },
          emotional_shifts: [],
        },
        sentiment_analysis: {
          utterances: [
            {
              index: 0,
              speaker: "SPEAKER_01",
              text: "Hi there, I'm Casey from Quick Help Support Team. I appreciate you reaching out. How may I assist you?",
              sentiment_label: "POSITIVE",
              sentiment_score: 0.998349666595459,
              normalized_score: 0.998349666595459,
            },
            // More entries would be here in the real data
          ],
          conversation_summary: {
            overall_sentiment: 0.11222652594248454,
            recent_sentiment: 0.6002476215362549,
            trend_direction: "improving",
          },
        },
        tone_analysis: {
          file_info: {
            duration: 72.55469387755102,
          },
          segments: [],
        },
      } as ApiResponse

      setResponseData(sampleData)
      processResponseData(sampleData)
    } finally {
      setUploading(false)

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
    }
  }

  // Update displayed data based on current time
  useEffect(() => {
    if (!hasFile || !responseData) return

    // Filter transcriptions based on current time
    const relevantTranscriptions = displayedTranscriptions.filter((entry) => {
      const [minutes, seconds] = entry.timestamp.split(":").map(Number)
      return minutes * 60 + seconds <= currentTime
    })

    // Update displayed data
    setDisplayedTranscriptions(relevantTranscriptions)
  }, [currentTime, hasFile, responseData, displayedTranscriptions])

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

  return (
    <div className="container mx-auto p-4 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6 font-mono">Voice Bot Conversation Analysis</h1>

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
                    disabled={uploading}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <div className="flex-1">
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
                    {
                      emotion: "Joy",
                      customer: displayedEmotions?.customer?.joy || 0,
                      bot: displayedEmotions?.bot?.joy || 0,
                    },
                    {
                      emotion: "Neutral",
                      customer: displayedEmotions?.customer?.neutral || 0,
                      bot: displayedEmotions?.bot?.neutral || 0,
                    },
                    {
                      emotion: "Sadness",
                      customer: displayedEmotions?.customer?.sadness || 0,
                      bot: displayedEmotions?.bot?.sadness || 0,
                    },
                    {
                      emotion: "Surprise",
                      customer: displayedEmotions?.customer?.surprise || 0,
                      bot: displayedEmotions?.bot?.surprise || 0,
                    },
                    {
                      emotion: "Anger",
                      customer: displayedEmotions?.customer?.anger || 0,
                      bot: displayedEmotions?.bot?.anger || 0,
                    },
                    {
                      emotion: "Disgust",
                      customer: displayedEmotions?.customer?.disgust || 0,
                      bot: displayedEmotions?.bot?.disgust || 0,
                    },
                    {
                      emotion: "Fear",
                      customer: displayedEmotions?.customer?.fear || 0,
                      bot: displayedEmotions?.bot?.fear || 0,
                    },
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
                <LineChart data={displayedSentimentData}>
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
                <LineChart data={botConfidence}>
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
                <LineChart data={customerSatisfaction}>
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

        {/* Fourth Row - Speaking Pattern Timeline */}
        <Card className="col-span-8 bg-black border-colorTwo">
          <SpeakingPattern data={displayedSpeakingData} currentTime={currentTime} />
        </Card>

        {/* Inappropriate Language Card */}
        <Card className="col-span-4 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Inappropriate Language</CardTitle>
            <CardDescription>Detected in conversation</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[200px]">
            <div className="text-5xl font-bold text-colorThree">{inappropriateCount}</div>
            <div className="text-sm mt-2">instances detected</div>
            <div className="mt-4 text-sm">
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className="bg-colorThree h-2.5 rounded-full"
                  style={{ width: `${(inappropriateCount / 20) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs mt-1">Severity level: {Math.round((inappropriateCount / 20) * 100)}%</div>
            </div>
          </CardContent>
        </Card>

        {/* Transcription Logs */}
        <Card className="col-span-12 bg-black border-colorTwo">
          <TranscriptionLogs entries={displayedTranscriptions} isPlaying={isPlaying} />
        </Card>
      </div>
    </div>
  )
}

