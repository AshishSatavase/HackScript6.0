import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Slider } from '@/components/ui/slider';

const EmotionalAnalysisRadar = () => {
  // Extracted emotion data from the provided JSON
  const emotionalData = {
    utterances: [
      {
        index: 0,
        speaker: "SPEAKER_01",
        emotions: {
          anger: 0.005421736743301153,
          disgust: 0.0032566366717219353,
          fear: 0.002451468724757433,
          joy: 0.731741189956665,
          neutral: 0.14554856717586517,
          sadness: 0.03841809928417206,
          surprise: 0.07316237688064575
        }
      },
      {
        index: 1,
        speaker: "SPEAKER_00",
        emotions: {
          anger: 0.04744327813386917,
          disgust: 0.005704586394131184,
          fear: 0.008043368346989155,
          joy: 0.002002939349040389,
          neutral: 0.012603692710399628,
          sadness: 0.9203808903694153,
          surprise: 0.0038212023209780455
        }
      },
      {
        index: 2,
        speaker: "SPEAKER_01",
        emotions: {
          anger: 0.09145302325487137,
          disgust: 0.14803877472877502,
          fear: 0.01099846325814724,
          joy: 0.004770458675920963,
          neutral: 0.5691326856613159,
          sadness: 0.03837147355079651,
          surprise: 0.1372351199388504
        }
      },
      {
        index: 3,
        speaker: "SPEAKER_00",
        emotions: {
          anger: 0.05671811103820801,
          disgust: 0.07169034332036972,
          fear: 0.012234392575919628,
          joy: 0.0036386763677001,
          neutral: 0.14345437288284302,
          sadness: 0.6440755724906921,
          surprise: 0.06818850338459015
        }
      },
      {
        index: 4,
        speaker: "SPEAKER_01",
        emotions: {
          anger: 0.00676847156137228,
          disgust: 0.004442913923412561,
          fear: 0.002514805179089308,
          joy: 0.002858818043023348,
          neutral: 0.9724302291870117,
          sadness: 0.004061602987349033,
          surprise: 0.0069231316447257996
        }
      },
      {
        index: 5,
        speaker: "SPEAKER_00",
        emotions: {
          anger: 0.021063756197690964,
          disgust: 0.018353240564465523,
          fear: 0.0018557145958766341,
          joy: 0.5341286659240723,
          neutral: 0.3899766206741333,
          sadness: 0.00779502559453249,
          surprise: 0.026826955378055573
        }
      },
      {
        index: 6,
        speaker: "SPEAKER_01",
        emotions: {
          anger: 0.012774619273841381,
          disgust: 0.008572045713663101,
          fear: 0.012130195274949074,
          joy: 0.003743157023563981,
          neutral: 0.921661376953125,
          sadness: 0.021378837525844574,
          surprise: 0.019739754498004913
        }
      },
      {
        index: 7,
        speaker: "SPEAKER_00",
        emotions: {
          anger: 0.01882827654480934,
          disgust: 0.013148407451808453,
          fear: 0.0024367424193769693,
          joy: 0.5766851305961609,
          neutral: 0.34753432869911194,
          sadness: 0.008868723176419735,
          surprise: 0.03249850124120712
        }
      },
      {
        index: 8,
        speaker: "SPEAKER_01",
        emotions: {
          anger: 0.0038461245130747557,
          disgust: 0.0014424308901652694,
          fear: 0.008378561586141586,
          joy: 0.6989091038703918,
          neutral: 0.19985266029834747,
          sadness: 0.029988937079906464,
          surprise: 0.05758213624358177
        }
      }
    ]
  };

  const [timeIndex, setTimeIndex] = useState(8); // Start with all data visible
  const [customerEmotions, setCustomerEmotions] = useState({});
  const [botEmotions, setbotEmotions] = useState({});

  useEffect(() => {
    // Calculate average emotions up to the current time index
    const customerData = {};
    const botData = {};
    let customerCount = 0;
    let botCount = 0;

    // Process utterances up to the current time index
    emotionalData.utterances.slice(0, timeIndex + 1).forEach(utterance => {
      if (utterance.speaker === "SPEAKER_00") {
        // Process customer emotions
        Object.entries(utterance.emotions).forEach(([emotion, value]) => {
          const capitalizedEmotion = emotion.charAt(0).toUpperCase() + emotion.slice(1);
          customerData[capitalizedEmotion] = (customerData[capitalizedEmotion] || 0) + value;
        });
        customerCount++;
      } else {
        // Process bot emotions
        Object.entries(utterance.emotions).forEach(([emotion, value]) => {
          const capitalizedEmotion = emotion.charAt(0).toUpperCase() + emotion.slice(1);
          botData[capitalizedEmotion] = (botData[capitalizedEmotion] || 0) + value;
        });
        botCount++;
      }
    });

    // Calculate averages
    if (customerCount > 0) {
      Object.keys(customerData).forEach(emotion => {
        customerData[emotion] = customerData[emotion] / customerCount;
      });
    }

    if (botCount > 0) {
      Object.keys(botData).forEach(emotion => {
        botData[emotion] = botData[emotion] / botCount;
      });
    }

    setCustomerEmotions(customerData);
    setbotEmotions(botData);
  }, [timeIndex]);

  // Format tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black p-2 border border-gray-600 rounded">
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name} ${entry.dataKey}: ${(entry.value * 100).toFixed(1)}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format emotions data for the radar chart
  const emotionsData = [
    { emotion: "Joy", customer: customerEmotions["Joy"] || 0, bot: botEmotions["Joy"] || 0 },
    { emotion: "Neutral", customer: customerEmotions["Neutral"] || 0, bot: botEmotions["Neutral"] || 0 },
    { emotion: "Sadness", customer: customerEmotions["Sadness"] || 0, bot: botEmotions["Sadness"] || 0 },
    { emotion: "Surprise", customer: customerEmotions["Surprise"] || 0, bot: botEmotions["Surprise"] || 0 },
    { emotion: "Anger", customer: customerEmotions["Anger"] || 0, bot: botEmotions["Anger"] || 0 },
    { emotion: "Disgust", customer: customerEmotions["Disgust"] || 0, bot: botEmotions["Disgust"] || 0 },
    { emotion: "Fear", customer: customerEmotions["Fear"] || 0, bot: botEmotions["Fear"] || 0 }
  ];

  // Get current utterance
  const currentUtterance = timeIndex >= 0 && timeIndex < emotionalData.utterances.length 
    ? emotionalData.utterances[timeIndex] 
    : null;

  return (
    <Card className="col-span-4 row-span-2 bg-black border-colorTwo">
      <CardHeader>
        <CardTitle>Emotional Analysis</CardTitle>
        <CardDescription>
          Customer vs Bot Emotions {timeIndex < emotionalData.utterances.length 
            ? `- Utterance ${timeIndex + 1} of ${emotionalData.utterances.length}` 
            : '- Full Conversation'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius="70%" data={emotionsData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
              <PolarAngleAxis dataKey="emotion" stroke="#fff" />
              <Radar
                name="Customer"
                dataKey="customer"
                stroke="#FF6B6B"
                fill="#FF6B6B"
                fillOpacity={0.5}
              />
              <Radar 
                name="Bot" 
                dataKey="bot" 
                stroke="#4ECDC4" 
                fill="#4ECDC4" 
                fillOpacity={0.5} 
              />
              <Legend />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {currentUtterance && (
          <div className="mt-4 p-3 bg-gray-900 rounded-md">
            <p className="text-sm text-gray-400 mb-1">
              {currentUtterance.speaker === "SPEAKER_00" ? "Customer" : "Bot"}:
            </p>
            <p className="text-white">
              {emotionalData.utterances[timeIndex].text || "No text available"}
            </p>
          </div>
        )}
        
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">Conversation Timeline</p>
          <Slider
            value={[timeIndex]}
            min={0}
            max={emotionalData.utterances.length - 1}
            step={1}
            onValueChange={(value) => setTimeIndex(value[0])}
          />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Start</span>
            <span>End</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionalAnalysisRadar;