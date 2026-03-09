"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PortfolioHistoryPoint } from "@/types";
import { HistoryPeriod } from "@/hooks/usePortfolioHistory";

interface PortfolioChartProps {
  data: PortfolioHistoryPoint[];
  period: HistoryPeriod;
  onPeriodChange: (period: HistoryPeriod) => void;
  isLoading?: boolean;
}

const PERIODS: { label: string; value: HistoryPeriod }[] = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "ALL", value: "ALL" },
];

export function PortfolioChart({ data, period, onPeriodChange, isLoading }: PortfolioChartProps) {
  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data.map(point => ({
      timestamp: point.timestamp * 1000, // Convert to milliseconds
      value: point.totalValueUSD,
      formattedDate: new Date(point.timestamp * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  const chartConfig = {
    value: {
      label: "Portfolio Value",
      color: "hsl(var(--primary))",
    },
  };

  // Determine if portfolio is up or down
  const isUp = useMemo(() => {
    if (chartData.length < 2) return true;
    return chartData[chartData.length - 1].value >= chartData[0].value;
  }, [chartData]);

  return (
    <Card className="p-6">
      {/* Period Tabs */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Portfolio Value</h3>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                period === p.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[250px] md:h-[350px] lg:h-[400px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart data...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[250px] md:h-[350px] lg:h-[400px] flex items-center justify-center">
          <div className="text-muted-foreground">No historical data available</div>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[250px] md:h-[350px] lg:h-[400px]">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isUp ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isUp ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={false}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={value => `$${value.toLocaleString()}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      const timestamp = payload[0].payload.timestamp;
                      return new Date(timestamp).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      });
                    }
                    return value;
                  }}
                  formatter={(value) => [
                    `$${Number(value).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    "Value",
                  ]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isUp ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </Card>
  );
}
