"use client";

import { useState, useMemo } from "react";
import { Pool } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, ComposedChart } from "recharts";
import { usePoolChartData, ChartPeriod } from "@/hooks/usePoolChartData";

interface PoolDetailChartProps {
  pool: Pool;
}

export function PoolDetailChart({ pool }: PoolDetailChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>("1W");
  const { data, isLoading, error } = usePoolChartData(pool.address, period);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data.map((point) => ({
      timestamp: point.timestamp * 1000, // Convert to milliseconds
      liquidity: point.liquidity,
      volume: point.volume,
      formattedDate: new Date(point.timestamp * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(period === "1D" && {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }),
    }));
  }, [data, period]);

  const chartConfig = {
    liquidity: {
      label: "Liquidity",
      color: "hsl(var(--primary))",
    },
    volume: {
      label: "Volume",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Liquidity & Volume</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as ChartPeriod)}>
            <TabsList>
              <TabsTrigger value="1D">1D</TabsTrigger>
              <TabsTrigger value="1W">1W</TabsTrigger>
              <TabsTrigger value="1M">1M</TabsTrigger>
              <TabsTrigger value="ALL">ALL</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] md:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        ) : error ? (
          <div className="h-[350px] md:h-[400px] flex items-center justify-center">
            <div className="text-destructive text-sm">
              Failed to load chart data. Please ensure the subgraph is running.
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[350px] md:h-[400px] flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">No historical data available</p>
              <p className="text-xs text-muted-foreground/70">
                Historical data will appear after swaps and liquidity events
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[350px] md:h-[400px]">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorLiquidity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickMargin={8}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                tickMargin={8}
                width={60}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                tickMargin={8}
                width={60}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        const timestamp = payload[0].payload.timestamp;
                        return new Date(timestamp).toLocaleString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          ...(period === "1D" && {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        });
                      }
                      return value;
                    }}
                    formatter={(value, name) => {
                      const numValue = Number(value);
                      return [
                        `$${numValue.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}`,
                        name === "liquidity" ? "Liquidity" : "Volume",
                      ];
                    }}
                  />
                }
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="liquidity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorLiquidity)"
              />
              <Bar yAxisId="right" dataKey="volume" fill="hsl(var(--chart-2))" opacity={0.5} radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
