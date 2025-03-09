"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ConversationStatsProps {
  currentData: any[];
  cumulativeData: any[];
}

export function ConversationStats({
  currentData,
  cumulativeData,
}: ConversationStatsProps) {
  const stats = useMemo(() => {
    if (currentData.length === 0) return null;

    const avgSentiment =
      currentData.reduce((sum, item) => sum + item.normalized_score, 0) /
      currentData.length;
    const totalDuration = currentData.reduce(
      (sum, item) => sum + (item.end_time - item.start_time),
      0
    );

    const speakerMap = new Map();
    currentData.forEach((item) => {
      const speaker = item.speaker;
      if (!speakerMap.has(speaker)) {
        speakerMap.set(speaker, 0);
      }
      speakerMap.set(speaker, speakerMap.get(speaker) + 1);
    });

    const dominantSpeaker =
      Array.from(speakerMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "None";

    return {
      avgSentiment,
      totalDuration,
      messageCount: currentData.length,
      dominantSpeaker,
    };
  }, [currentData]);

  const chartData = useMemo(() => {
    if (!stats) return [];

    return [
      { name: "Current", sentiment: stats.avgSentiment },
      {
        name: "Cumulative",
        sentiment:
          cumulativeData.length > 0
            ? cumulativeData.reduce(
                (sum, item) => sum + item.normalized_score,
                0
              ) / cumulativeData.length
            : 0,
      },
    ];
  }, [stats, cumulativeData]);

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversation Statistics</CardTitle>
          <CardDescription>
            Key metrics for the selected time range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Average Sentiment
              </p>
              <p className="text-2xl font-bold">
                {stats.avgSentiment.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Total Duration
              </p>
              <p className="text-2xl font-bold">
                {stats.totalDuration.toFixed(2)}s
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Message Count
              </p>
              <p className="text-2xl font-bold">{stats.messageCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Dominant Speaker
              </p>
              <p className="text-2xl font-bold">{stats.dominantSpeaker}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sentiment Comparison</CardTitle>
          <CardDescription>Current vs. Cumulative Sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Sentiment
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].value?.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="sentiment"
                  fill="hsl(var(--chart-1))"
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
