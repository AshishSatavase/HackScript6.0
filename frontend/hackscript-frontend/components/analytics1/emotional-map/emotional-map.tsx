import React, { useState, useEffect, useMemo } from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar, 
  Legend, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

// Custom rendering component for emotion labels with icons/emojis
const renderPolarAngleAxis = (props) => {
  const { payload, cx, cy } = props;
  const sin = Math.sin(-props.angle * Math.PI / 180);
  const cos = Math.cos(-props.angle * Math.PI / 180);
  const sx = cx + (cos * props.radius * 1.1);
  const sy = cy + (sin * props.radius * 1.1);
  
  // Emoji mapping for emotions
  const emojiMap = {
    "Anger": "😡",
    "Disgust": "🤢",
    "Fear": "😨",
    "Joy": "😊",
    "Neutral": "😐",
    "Sadness": "😢",
    "Surprise": "😲"
  };
  
  return (
    <g>
      <text 
        x={sx} 
        y={sy} 
        textAnchor={cos >= 0 ? 'start' : 'end'} 
        dominantBaseline="central"
        fill="#ffffff"
        fontSize="14"
      >
        {emojiMap[payload.value]} {payload.value}
      </text>
    </g>
  );
};

const EmotionRadarVisualization = ({ conversationData }) => {
  // Handle undefined props with default empty array
  const data = useMemo(() => conversationData || [], [conversationData]);
  
  // State for current timestamp index
  const [currentIndex, setCurrentIndex] = useState(0);
  // State for animation control
  const [isPlaying, setIsPlaying] = useState(false);
  // State for accumulated data
  const [cumulativeData, setCumulativeData] = useState({
    customer: {
      anger: 0,
      disgust: 0,
      fear: 0,
      joy: 0,
      neutral: 0,
      sadness: 0,
      surprise: 0,
      count: 0
    },
    bot: {
      anger: 0,
      disgust: 0,
      fear: 0,
      joy: 0,
      neutral: 0,
      sadness: 0,
      surprise: 0,
      count: 0
    }
  });
  // State for displaying summary
  const [showSummary, setShowSummary] = useState(false);
  
  // Calculated data for radar chart based on current index
  const [radarData, setRadarData] = useState([
    { emotion: "Anger", customer: 0, bot: 0 },
    { emotion: "Disgust", customer: 0, bot: 0 },
    { emotion: "Fear", customer: 0, bot: 0 },
    { emotion: "Joy", customer: 0, bot: 0 },
    { emotion: "Neutral", customer: 0, bot: 0 },
    { emotion: "Sadness", customer: 0, bot: 0 },
    { emotion: "Surprise", customer: 0, bot: 0 }
  ]);

  // Current conversation entry
  const [currentEntry, setCurrentEntry] = useState(null);

  // Reset component when new data is received
  useEffect(() => {
    handleReset();
  }, [data]);

  // Process data for current index
  useEffect(() => {
    if (data.length === 0) return;
    
    if (currentIndex < data.length) {
      const entry = data[currentIndex];
      setCurrentEntry(entry);
      
      // Update radar data based on speaker
      const newRadarData = [...radarData];
      
      if (entry.speaker === "SPEAKER_00") { // Customer
        newRadarData[0].customer = entry.anger * 100;
        newRadarData[1].customer = entry.disgust * 100;
        newRadarData[2].customer = entry.fear * 100;
        newRadarData[3].customer = entry.joy * 100;
        newRadarData[4].customer = entry.neutral * 100;
        newRadarData[5].customer = entry.sadness * 100;
        newRadarData[6].customer = entry.surprise * 100;
        
        // Update cumulative data
        setCumulativeData(prev => ({
          ...prev,
          customer: {
            anger: prev.customer.anger + entry.anger,
            disgust: prev.customer.disgust + entry.disgust,
            fear: prev.customer.fear + entry.fear,
            joy: prev.customer.joy + entry.joy,
            neutral: prev.customer.neutral + entry.neutral,
            sadness: prev.customer.sadness + entry.sadness,
            surprise: prev.customer.surprise + entry.surprise,
            count: prev.customer.count + 1
          }
        }));
      } else { // Bot
        newRadarData[0].bot = entry.anger * 100;
        newRadarData[1].bot = entry.disgust * 100;
        newRadarData[2].bot = entry.fear * 100;
        newRadarData[3].bot = entry.joy * 100;
        newRadarData[4].bot = entry.neutral * 100;
        newRadarData[5].bot = entry.sadness * 100;
        newRadarData[6].bot = entry.surprise * 100;
        
        // Update cumulative data
        setCumulativeData(prev => ({
          ...prev,
          bot: {
            anger: prev.bot.anger + entry.anger,
            disgust: prev.bot.disgust + entry.disgust,
            fear: prev.bot.fear + entry.fear,
            joy: prev.bot.joy + entry.joy,
            neutral: prev.bot.neutral + entry.neutral,
            sadness: prev.bot.sadness + entry.sadness,
            surprise: prev.bot.surprise + entry.surprise,
            count: prev.bot.count + 1
          }
        }));
      }
      
      setRadarData(newRadarData);
    } else if (currentIndex === data.length && data.length > 0) {
      // Show summary at the end
      setShowSummary(true);
      setIsPlaying(false);
      
      // Calculate average emotions for summary
      const summaryData = [
        { 
          emotion: "Anger", 
          customer: cumulativeData.customer.count ? (cumulativeData.customer.anger / cumulativeData.customer.count) * 100 : 0, 
          bot: cumulativeData.bot.count ? (cumulativeData.bot.anger / cumulativeData.bot.count) * 100 : 0 
        },
        { 
          emotion: "Disgust", 
          customer: cumulativeData.customer.count ? (cumulativeData.customer.disgust / cumulativeData.customer.count) * 100 : 0, 
          bot: cumulativeData.bot.count ? (cumulativeData.bot.disgust / cumulativeData.bot.count) * 100 : 0 
        },
        { 
          emotion: "Fear", 
          customer: cumulativeData.customer.count ? (cumulativeData.customer.fear / cumulativeData.customer.count) * 100 : 0, 
          bot: cumulativeData.bot.count ? (cumulativeData.bot.fear / cumulativeData.bot.count) * 100 : 0 
        },
        { 
          emotion: "Joy", 
          customer: cumulativeData.customer.count ? (cumulativeData.customer.joy / cumulativeData.customer.count) * 100 : 0, 
          bot: cumulativeData.bot.count ? (cumulativeData.bot.joy / cumulativeData.bot.count) * 100 : 0 
        },
        { 
          emotion: "Neutral", 
          customer: cumulativeData.customer.count ? (cumulativeData.customer.neutral / cumulativeData.customer.count) * 100 : 0, 
          bot: cumulativeData.bot.count ? (cumulativeData.bot.neutral / cumulativeData.bot.count) * 100 : 0 
        },
        { 
          emotion: "Sadness", 
          customer: cumulativeData.customer.count ? (cumulativeData.customer.sadness / cumulativeData.customer.count) * 100 : 0, 
          bot: cumulativeData.bot.count ? (cumulativeData.bot.sadness / cumulativeData.bot.count) * 100 : 0 
        },
        { 
          emotion: "Surprise", 
          customer: cumulativeData.customer.count ? (cumulativeData.customer.surprise / cumulativeData.customer.count) * 100 : 0, 
          bot: cumulativeData.bot.count ? (cumulativeData.bot.surprise / cumulativeData.bot.count) * 100 : 0 
        }
      ];
      
      setRadarData(summaryData);
    }
  }, [currentIndex, data, radarData]);

  // Auto-play logic
  useEffect(() => {
    let timer;
    if (isPlaying && currentIndex < data.length) {
      timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 2000); // 2 seconds per data point
    }
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, data]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black p-2 border border-gray-700 rounded">
          <p className="text-white">{`${payload[0].name}: ${payload[0].value.toFixed(2)}%`}</p>
          {payload[1] && <p className="text-white">{`${payload[1].name}: ${payload[1].value.toFixed(2)}%`}</p>}
        </div>
      );
    }
    return null;
  };

  // Helper function to determine most dominant emotion
  const getDominantEmotion = (emotionData) => {
    if (!emotionData || emotionData.count === 0) return "No data";
    
    const emotions = {
      Anger: emotionData.anger,
      Disgust: emotionData.disgust,
      Fear: emotionData.fear,
      Joy: emotionData.joy,
      Neutral: emotionData.neutral,
      Sadness: emotionData.sadness,
      Surprise: emotionData.surprise
    };
    
    return Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])[0][0];
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setShowSummary(false);
    setCumulativeData({
      customer: {
        anger: 0,
        disgust: 0,
        fear: 0,
        joy: 0,
        neutral: 0,
        sadness: 0,
        surprise: 0,
        count: 0
      },
      bot: {
        anger: 0,
        disgust: 0,
        fear: 0,
        joy: 0,
        neutral: 0,
        sadness: 0,
        surprise: 0,
        count: 0
      }
    });
    setRadarData([
      { emotion: "Anger", customer: 0, bot: 0 },
      { emotion: "Disgust", customer: 0, bot: 0 },
      { emotion: "Fear", customer: 0, bot: 0 },
      { emotion: "Joy", customer: 0, bot: 0 },
      { emotion: "Neutral", customer: 0, bot: 0 },
      { emotion: "Sadness", customer: 0, bot: 0 },
      { emotion: "Surprise", customer: 0, bot: 0 }
    ]);
    setCurrentEntry(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="bg-black border-blue-500 text-white mb-4">
        <CardHeader>
          <CardTitle>Emotional Analysis</CardTitle>
          <CardDescription className="text-gray-300">
            {showSummary ? "Summary - Average Emotions" : 
              data.length > 0 ? `Timestamp ${currentIndex+1} of ${data.length}` : "Waiting for data..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius="70%" data={radarData}>
                {/* Enhanced grid with higher opacity for better visibility */}
                <PolarGrid stroke="#ffffff" opacity={0.4} />
                
                {/* Custom labels with emojis */}
                <PolarAngleAxis 
                  dataKey="emotion" 
                  tick={renderPolarAngleAxis} 
                  stroke="#ffffff" 
                  tickLine={false}
                />
                
                {/* Customer radar with brighter color */}
                <Radar
                  name="Customer"
                  dataKey="customer"
                  stroke="#ff6b6b"
                  fill="#ff6b6b"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                
                {/* Bot radar with brighter color */}
                <Radar 
                  name="Bot" 
                  dataKey="bot" 
                  stroke="#4ecdc4" 
                  fill="#4ecdc4" 
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                
                <Legend />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          {!showSummary && currentEntry && (
            <div className="mt-4 p-4 border border-gray-700 rounded-md">
              <p className="font-bold mb-2">
                {currentEntry.speaker === "SPEAKER_00" ? "Customer" : "Agent"}:
              </p>
              <p className="text-sm">{currentEntry.text}</p>
              <p className="mt-2 text-sm">
                Dominant emotion: <span className="font-bold">{currentEntry.dominant_emotion}</span> 
                ({(currentEntry.dominant_score * 100).toFixed(1)}%)
              </p>
            </div>
          )}
          
          <div className="flex justify-center space-x-4 mt-4">
            {!isPlaying ? (
              <Button 
                onClick={handlePlay} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={currentIndex >= data.length || data.length === 0}
              >
                Play
              </Button>
            ) : (
              <Button 
                onClick={handlePause} 
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Pause
              </Button>
            )}
            <Button 
              onClick={handleReset} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={data.length === 0}
            >
              Reset
            </Button>
          </div>
          
          {showSummary && (
            <div className="mt-6 p-4 border border-gray-700 rounded-md">
              <h3 className="text-lg font-bold mb-2">Conversation Summary</h3>
              <p className="mb-2">
                This chart shows the average emotional patterns throughout the conversation.
              </p>
              <p className="mb-1">
                <span className="font-bold text-red-400">Customer:</span> 
                {" "}
                {cumulativeData.customer.count > 0 ? 
                  `Primary emotion: ${getDominantEmotion(cumulativeData.customer)}` : 
                  "No data"}
              </p>
              <p>
                <span className="font-bold text-teal-400">Agent:</span>
                {" "}
                {cumulativeData.bot.count > 0 ? 
                  `Primary emotion: ${getDominantEmotion(cumulativeData.bot)}` : 
                  "No data"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionRadarVisualization;