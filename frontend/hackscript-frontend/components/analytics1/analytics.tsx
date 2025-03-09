"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "recharts";
import axios from "axios";
import { Pause, Play, Upload, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TranscriptionLogs } from "@/components/analytics1/transcription-logs";
import { SpeakingPattern } from "@/components/analytics/speaking-pattern";
import EmotionRadarVisualization from "./emotional-map/emotional-map";

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 border border-colorTwo/30 p-3 rounded-lg shadow-md">
        <p className="font-medium text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || entry.fill }}>
            {entry.name}:{" "}
            {typeof entry.value === "number"
              ? entry.value.toFixed(2)
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Audio waveform component
const AudioWaveform = ({ currentTime, duration, isInitial = false }) => {
  // Use ref to keep the bars stable between renders
  const barsRef = useRef(
    Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2)
  );

  // Calculate which bar should be highlighted based on current time
  const progressIndex = Math.floor(
    (currentTime / duration) * barsRef.current.length
  );

  if (isInitial) {
    return (
      <div className="flex items-center justify-center h-40 border-2 border-dashed border-white rounded-lg">
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-colorTwo" />
          <p className="font-mono text-lg text-white">
            Upload Voice Note for analysis
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Click to upload or drag and drop
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center h-8 gap-0.5">
      {barsRef.current.map((height, index) => (
        <div
          key={index}
          className={`w-1 rounded-sm ${
            index < progressIndex ? "bg-colorTwo" : "bg-gray-500/50"
          }`}
          style={{ height: `${height * 100}%` }}
        ></div>
      ))}
    </div>
  );
};

export default function VoiceBotAnalytics() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasFile, setHasFile] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(285); // Default duration
  const [customerEmotions, setCustomerEmotions] = useState({});
  const [botEmotions, setBotEmotions] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  const [emotionData, setEmotionData] = useState([]);
  const [speakerColors, setSpeakerColors] = useState({
    SPEAKER_00: "#8884d8",
    SPEAKER_01: "#82ca9d",
  });

  // State variables for dynamic data
  const [conversationData, setConversationData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [transcriptionData, setTranscriptionData] = useState([]);
  const [displayedTranscriptions, setDisplayedTranscriptions] = useState([]);
  const [talkTimeData, setTalkTimeData] = useState([
    { name: "Customer", value: 50 },
    { name: "Agent", value: 50 },
  ]);
  const [inappropriateLanguageCount, setInappropriateLanguageCount] =
    useState(0);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationRef = useRef(null);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Process API response data
  const processApiResponse = (data) => {
    if (!data || !data.context_analysis) return;
    
    const emotionAnalysis = data.emotional_analysis.per_utterance_analysis;
    // console.log(emotionAnalysis);
    
    setEmotionData(emotionAnalysis);

    const contextAnalysis = data.context_analysis;

    // Process for conversation timeline data
    const processedData = [];

    // Process each data point for the sentiment graph
    // contextAnalysis.forEach((item, index) => {
    //   const timeInSeconds = item.start_time;
    //   const minutes = Math.floor(timeInSeconds / 60);
    //   const seconds = timeInSeconds % 60;
    //   const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    //   // Determine speaker type based on role or speaker field
    //   const isSpeaker1 =
    //     item.speaker === "SPEAKER_00" ||
    //     item.role === "human" ||
    //     item.role === "human2";

    //   // Use normalized_score directly for sentiment (ensure it's between -1 and 1)
    //   // If it's already between -1 and 1, use it directly
    //   // If it's between 0 and 1, convert to -1 to 1 scale
    //   let sentiment = item.normalized_score;

    //   // If sentiment is not in range -1 to 1, normalize it
    //   if (sentiment < -1 || sentiment > 1) {
    //     sentiment = Math.max(-1, Math.min(1, sentiment));
    //   }

    //   const dataPoint = {
    //     time: timeLabel,
    //     timeInSeconds,
    //     customerSentiment: isSpeaker1 ? sentiment : null,
    //     botSentiment: !isSpeaker1 ? sentiment : null,
    //     isBotSpeaking: !isSpeaker1,
    //     speakingEntity: isSpeaker1 ? "Customer" : "Agent",
    //     botConfidence: !isSpeaker1 ? 0.85 + Math.random() * 0.1 : null,
    //     customerSatisfaction: isSpeaker1
    //       ? Math.max(0, (sentiment + 1) / 2)
    //       : null, // Convert to 0-1 range for satisfaction
    //     text: item.text || "",
    //   };

    //   processedData.push(dataPoint);

    //   // For continuous line chart, add extra points between segments
    //   if (index < contextAnalysis.length - 1) {
    //     const nextItem = contextAnalysis[index + 1];
    //     const nextIsSpeaker1 =
    //       nextItem.speaker === "SPEAKER_00" ||
    //       nextItem.role === "human" ||
    //       nextItem.role === "human2";

    //     // Only add interpolation point if it's the same speaker
    //     if (
    //       isSpeaker1 === nextIsSpeaker1 &&
    //       nextItem.start_time - item.end_time < 5
    //     ) {
    //       // Create a connecting point
    //       const midTimeInSeconds = item.end_time;
    //       const midMinutes = Math.floor(midTimeInSeconds / 60);
    //       const midSeconds = midTimeInSeconds % 60;
    //       const midTimeLabel = `${midMinutes}:${midSeconds
    //         .toString()
    //         .padStart(2, "0")}`;

    //       processedData.push({
    //         time: midTimeLabel,
    //         timeInSeconds: midTimeInSeconds,
    //         customerSentiment: isSpeaker1 ? sentiment : null,
    //         botSentiment: !isSpeaker1 ? sentiment : null,
    //         isBotSpeaking: !isSpeaker1,
    //         speakingEntity: isSpeaker1 ? "Customer" : "Agent",
    //         botConfidence: !isSpeaker1 ? 0.85 + Math.random() * 0.1 : null,
    //         customerSatisfaction: isSpeaker1
    //           ? Math.max(0, (sentiment + 1) / 2)
    //           : null,
    //         isInterpolated: true,
    //       });
    //     }
    //   }
    // });

    // // Sort by time to ensure correct order
    // processedData.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
    // setConversationData(processedData);

    // // Process transcription data
    // const transcriptions = contextAnalysis.map((item) => ({
    //   timestamp: formatTime(item.start_time),
    //   timeInSeconds: item.start_time,
    //   speaker:
    //     item.speaker === "SPEAKER_00" ||
    //     item.role === "human" ||
    //     item.role === "human2"
    //       ? "customer"
    //       : "bot",
    //   text: item.text || "",
    //   role: item.role || (item.speaker === "SPEAKER_00" ? "customer" : "bot"),
    // }));

    // setTranscriptionData(transcriptions);

    // Calculate talk time based on duration between start_time and end_time
    // const speaker1Time = contextAnalysis
    //   .filter(
    //     (item) =>
    //       item.speaker === "SPEAKER_00" ||
    //       item.role === "human" ||
    //       item.role === "human2"
    //   )
    //   .reduce((total, item) => total + (item.end_time - item.start_time), 0);

    // const speaker2Time = contextAnalysis
    //   .filter(
    //     (item) => item.speaker === "SPEAKER_01" || item.role === "assistant"
    //   )
    //   .reduce((total, item) => total + (item.end_time - item.start_time), 0);

    // const totalTime = speaker1Time + speaker2Time;

    // if (totalTime > 0) {
    //   setTalkTimeData([
    //     { name: "Customer", value: (speaker1Time / totalTime) * 100 },
    //     { name: "Agent", value: (speaker2Time / totalTime) * 100 },
    //   ]);
    // }

    // // Count inappropriate language (compliance flags)
    // const inappropriateCount = contextAnalysis.filter(
    //   (item) => item.compliance_flag === true
    // ).length;

    // setInappropriateLanguageCount(inappropriateCount);

    // Extract emotions from the data (using sentiment as proxy for emotions)
    const customerEmotionMap = {
      Joy: 0,
      Neutral: 0,
      Sadness: 0,
      Surprise: 0,
      Anger: 0,
      Disgust: 0,
      Fear: 0,
    };

    const botEmotionMap = {
      Joy: 0,
      Neutral: 0,
      Sadness: 0,
      Surprise: 0,
      Anger: 0,
      Disgust: 0,
      Fear: 0,
    };

    // Simplified emotion mapping based on sentiment scores
    // contextAnalysis.forEach((item) => {
    //   const score = item.normalized_score;
    //   let emotionMap;

    //   // Determine if it's customer or bot
    //   if (
    //     item.speaker === "SPEAKER_00" ||
    //     item.role === "human" ||
    //     item.role === "human2"
    //   ) {
    //     emotionMap = customerEmotionMap;
    //   } else {
    //     emotionMap = botEmotionMap;
    //   }

    //   // Map sentiment score to emotions - simplified version
    //   if (score > 0.5) {
    //     emotionMap.Joy += 0.2;
    //     emotionMap.Surprise += 0.1;
    //   } else if (score > 0) {
    //     emotionMap.Neutral += 0.2;
    //     emotionMap.Joy += 0.1;
    //   } else if (score > -0.5) {
    //     emotionMap.Neutral += 0.1;
    //     emotionMap.Sadness += 0.1;
    //     emotionMap.Fear += 0.05;
    //   } else {
    //     emotionMap.Anger += 0.15;
    //     emotionMap.Disgust += 0.1;
    //     emotionMap.Fear += 0.1;
    //     emotionMap.Sadness += 0.15;
    //   }
    // });

    // Set emotions
    setCustomerEmotions(customerEmotionMap);
    setBotEmotions(botEmotionMap);

    // Calculate total audio duration based on last end_time
    // if (contextAnalysis.length > 0) {
    //   const lastEntry = contextAnalysis[contextAnalysis.length - 1];
    //   setAudioDuration(lastEntry.end_time);
    // }
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (!hasFile) return;

    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }

    setIsPlaying(!isPlaying);
  };

  // Handle file upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection and upload
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setAudioFile(file);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://192.168.19.26:8000/process-audio",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("API Response:", response.data);
      setResponseData(response.data);

      // Process the response data
      processApiResponse(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed!");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

    // Create audio element to get duration
    const audio = new Audio(URL.createObjectURL(file));
    audio.addEventListener("loadedmetadata", () => {
      audioRef.current = audio;

      // Set up audio events
      audio.addEventListener("play", () => setIsPlaying(true));
      audio.addEventListener("pause", () => setIsPlaying(false));
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(audio.duration);
      });
      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });
    });

    setHasFile(true);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Update displayed data based on current time
  useEffect(() => {
    if (!hasFile || conversationData.length === 0) return;

    // Find the appropriate data points to display based on current time
    const currentData = conversationData.filter(
      (item) => item.timeInSeconds <= currentTime
    );

    setDisplayedData(currentData);

    // Update transcriptions based on current time
    const currentTranscriptions = transcriptionData.filter(
      (entry) => entry.timeInSeconds <= currentTime
    );

    setDisplayedTranscriptions(currentTranscriptions);
  }, [currentTime, hasFile, conversationData, transcriptionData]);

  // Prepare emotion radar chart data
  const emotionRadarData = [
    {
      emotion: "Joy",
      customer: customerEmotions["Joy"] || 0,
      bot: botEmotions["Joy"] || 0,
    },
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
    {
      emotion: "Anger",
      customer: customerEmotions["Anger"] || 0,
      bot: botEmotions["Anger"] || 0,
    },
    {
      emotion: "Disgust",
      customer: customerEmotions["Disgust"] || 0,
      bot: botEmotions["Disgust"] || 0,
    },
    {
      emotion: "Fear",
      customer: customerEmotions["Fear"] || 0,
      bot: botEmotions["Fear"] || 0,
    },
  ];

  return (
    <div className="container mx-auto p-4 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6 font-mono">
        Voice Bot Conversation Analysis
      </h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Audio Player - Top Row, Spans 8 columns */}
        <Card className="col-span-8 bg-black border-colorTwo">
          <CardHeader className="pb-2">
            <CardTitle>Conversation Recording</CardTitle>
            <CardDescription>
              {hasFile ? `${formatTime(audioDuration)} duration` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasFile ? (
              <div onClick={handleUploadClick} className="cursor-pointer">
                <AudioWaveform
                  currentTime={0}
                  duration={audioDuration}
                  isInitial={true}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="audio/*"
                  onChange={handleFileChange}
                />
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
                    <AudioWaveform
                      currentTime={currentTime}
                      duration={audioDuration}
                    />
                  </div>

                  <div className="text-white font-medium">
                    {formatTime(currentTime)}
                  </div>
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
                        audioRef.current.volume = value[0] / 100;
                      }
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Emotions Radar Charts - Top Row, Spans 4 columns */}
        {/* <Card className="col-span-4 row-span-2 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Emotional Analysis</CardTitle>
            <CardDescription>Customer vs Bot Emotions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="70%" data={emotionRadarData}>
                  <PolarGrid stroke="var(--white-black)" opacity={0.2} />
                  <PolarAngleAxis dataKey="emotion" stroke="#fff" />
                  <Radar
                    name="Customer"
                    dataKey="customer"
                    stroke="var(--color-one)"
                    fill="var(--color-one)"
                    fillOpacity={0.5}
                  />
                  <Radar 
                    name="Bot" 
                    dataKey="bot" 
                    stroke="var(--color-two)" 
                    fill="var(--color-two)" 
                    fillOpacity={0.5} 
                  />
                  <Legend />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card> */}
        <EmotionRadarVisualization
          data={emotionData}
          speakerColors={speakerColors}
        />
        {/* Sentiment Analysis - Second Row, Spans 8 columns */}
        <Card className="col-span-8 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
            <CardDescription>Positive above, negative below</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={displayedData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#fff" }}
                    tickCount={10}
                    allowDuplicatedCategory={false}
                  />
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
                    dot={(props) => {
                      const { isInterpolated, cx, cy } = props;
                      // Only show dots for real data points, not interpolated ones
                      if (isInterpolated) return null;
                      return (
                        <circle cx={cx} cy={cy} r={4} fill="var(--color-one)" />
                      );
                    }}
                    activeDot={{ r: 6, fill: "var(--color-one)" }}
                    connectNulls={true}
                  />
                  <Line
                    type="monotone"
                    dataKey="botSentiment"
                    name="Bot Sentiment"
                    stroke="var(--color-two)"
                    strokeWidth={2}
                    dot={(props) => {
                      const { isInterpolated, cx, cy } = props;
                      // Only show dots for real data points, not interpolated ones
                      if (isInterpolated) return null;
                      return (
                        <circle cx={cx} cy={cy} r={4} fill="var(--color-two)" />
                      );
                    }}
                    activeDot={{ r: 6, fill: "var(--color-two)" }}
                    connectNulls={true}
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Talk Time */}
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
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
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
                <LineChart
                  data={displayedData.filter(
                    (item) => item.botConfidence !== null
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fill: "#fff" }} tickCount={6} />
                  <YAxis
                    domain={[0.7, 1]}
                    tickFormatter={(value) => value.toFixed(1)}
                    tick={{ fill: "#fff" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="botConfidence"
                    name="Confidence"
                    stroke="var(--color-five)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--color-five)" }}
                    connectNulls={true}
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
                <LineChart
                  data={displayedData.filter(
                    (item) => item.customerSatisfaction !== null
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fill: "#fff" }} tickCount={6} />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(value) => value.toFixed(1)}
                    tick={{ fill: "#fff" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="customerSatisfaction"
                    name="Satisfaction"
                    stroke="var(--color-four)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--color-four)" }}
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fourth Row - Speaking Pattern Timeline */}
        <Card className="col-span-8 bg-black border-colorTwo">
          <SpeakingPattern data={conversationData} currentTime={currentTime} />
        </Card>

        {/* Inappropriate Language Card */}
        <Card className="col-span-4 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Inappropriate Language</CardTitle>
            <CardDescription>Detected in conversation</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[200px]">
            <div className="text-5xl font-bold text-colorThree">
              {inappropriateLanguageCount}
            </div>
            <div className="text-sm mt-2">instances detected</div>
            <div className="mt-4 text-sm">
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className="bg-colorThree h-2.5 rounded-full"
                  style={{
                    width: `${(inappropriateLanguageCount / 20) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs mt-1">
                Severity level:{" "}
                {Math.round((inappropriateLanguageCount / 20) * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transcription Logs */}
        <Card className="col-span-12 bg-black border-colorTwo">
          <CardHeader>
            <CardTitle>Transcription Logs</CardTitle>
            <CardDescription>Real-time conversation</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {displayedTranscriptions.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                No transcriptions yet...
              </div>
            ) : (
              <div className="space-y-4">
                {displayedTranscriptions.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      entry.speaker === "customer"
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-3/4 rounded-lg p-3 ${
                        entry.speaker === "customer"
                          ? "bg-gray-800 text-left"
                          : "bg-colorTwo/20 text-right"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">
                          {entry.speaker === "customer" ? "Customer" : "Agent"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {entry.timestamp}
                        </span>
                      </div>
                      <p>{entry.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
