"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card } from "@/components/ui/card"

interface InsuranceContextChartProps {
  data: any[]
  isCumulative?: boolean
}

export function InsuranceContextChart({ data, isCumulative = false }: InsuranceContextChartProps) {
  const chartData = useMemo(() => {
    const contextData = [
      { name: "Insurance Related", value: 0 },
      { name: "Not Insurance Related", value: 0 },
    ]

    data.forEach((item) => {
      if (item.is_insurance_context === true) {
        contextData[0].value += 1
      } else if (item.is_insurance_context === false) {
        contextData[1].value += 1
      }
    })

    return contextData
  }, [data])

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--muted))"]

  if (data.length === 0) {
    return (
      <Card className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">No data available for this time range</p>
      </Card>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            isAnimationActive={true}
            animationDuration={500}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">{payload[0].name}</span>
                      <span className="font-bold text-muted-foreground">Count: {payload[0].value}</span>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

