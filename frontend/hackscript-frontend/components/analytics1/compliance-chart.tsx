"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";

interface ComplianceChartProps {
  data: any[];
  isCumulative?: boolean;
}

export function ComplianceChart({
  data,
  isCumulative = false,
}: ComplianceChartProps) {
  const chartData = useMemo(() => {
    const complianceData = [
      { name: "Compliant", value: 0 },
      { name: "Non-Compliant", value: 0 },
      { name: "Unknown", value: 0 },
    ];

    data.forEach((item) => {
      if (item.compliance_flag === true) {
        complianceData[0].value += 1;
      } else if (item.compliance_flag === false) {
        complianceData[1].value += 1;
      } else {
        complianceData[2].value += 1;
      }
    });

    return complianceData;
  }, [data]);

  const COLORS = ["#22c55e", "#ef4444", "#64748b"]; // Presentational dashboard color scheme

  if (data.length === 0) {
    return (
      <Card className="h-[300px] flex items-center justify-center bg-gray-900 text-white">
        <p className="text-gray-400">No data available for this time range</p>
      </Card>
    );
  }

  return (
    <div className="h-[300px] bg-gray-900 p-4 rounded-lg shadow-lg">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#4b5563"
          />
          <XAxis dataKey="name" stroke="#d1d5db" />
          <YAxis stroke="#d1d5db" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const total = chartData.reduce(
                  (sum, item) => sum + item.value,
                  0
                );
                const percentage =
                  total > 0
                    ? ((payload[0].value / total) * 100).toFixed(1)
                    : "0";

                return (
                  <div className="rounded-lg border bg-gray-800 text-white p-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-gray-400">
                        {payload[0].name}
                      </span>
                      <span className="font-bold text-white">
                        Count: {payload[0].value}
                      </span>
                      <span className="text-xs text-gray-400">
                        {percentage}% of total
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" isAnimationActive={true} animationDuration={500}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
