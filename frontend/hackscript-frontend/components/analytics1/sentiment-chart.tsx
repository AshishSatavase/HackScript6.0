"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";

interface SentimentChartProps {
  data: any[];
  isCumulative?: boolean;
}

export function SentimentChart({
  data,
  isCumulative = false,
}: SentimentChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      time: item.start_time.toFixed(1),
      sentiment: item.normalized_score,
      speaker: item.speaker,
      text: item.text,
    }));
  }, [data]);

  const getGradientOffset = () => {
    const dataMax = Math.max(...data.map((i) => i.normalized_score));
    const dataMin = Math.min(...data.map((i) => i.normalized_score));

    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }

    return dataMax / (dataMax - dataMin);
  };

  const gradientOffset = getGradientOffset();

  if (data.length === 0) {
    return (
      <Card className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">
          No data available for this time range
        </p>
      </Card>
    );
  }

  return (
    <ChartContainer
      config={{
        sentiment: {
          label: "Sentiment Score",
          color: "green",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset={gradientOffset}
                stopColor="var(--chart-positive)"
                stopOpacity={0.8}
              />
              <stop
                offset={gradientOffset}
                stopColor="var(--chart-negative)"
                stopOpacity={0.8}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            label={{
              value: "Time (seconds)",
              position: "insideBottomRight",
              offset: -10,
            }}
          />
          <YAxis
            domain={[0, 1]}
            label={{
              value: "Sentiment Score",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Sentiment
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {payload[0].value?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Speaker
                        </span>
                        <span className="font-bold">
                          {payload[0].payload.speaker}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        {payload[0].payload.text}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="sentiment"
            stroke="var(--chart-positive)"
            fillOpacity={0.3}
            fill="url(#splitColor)"
            activeDot={{ r: 6 }}
            isAnimationActive={true}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
