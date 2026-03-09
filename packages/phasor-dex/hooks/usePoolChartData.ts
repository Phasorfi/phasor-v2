"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { Address } from "viem";
import { GET_PAIR_DAY_DATA, GET_PAIR_CHART_DATA } from "@/lib/graphql/queries";
import { apolloClient } from "@/lib/apollo-client";

export type ChartPeriod = "1D" | "1W" | "1M" | "ALL";
export type ChartDataType = "liquidity" | "volume";

export interface PoolChartDataPoint {
  timestamp: number;
  liquidity: number;
  volume: number;
  reserve0: number;
  reserve1: number;
}

export interface UsePoolChartDataResult {
  data: PoolChartDataPoint[];
  isLoading: boolean;
  error: Error | null;
}

interface PairHourData {
  hourStartUnix: string;
  reserveUSD: string;
  hourlyVolumeUSD: string;
  reserve0: string;
  reserve1: string;
}

interface PairDayData {
  date: string;
  reserveUSD: string;
  dailyVolumeUSD: string;
  reserve0: string;
  reserve1: string;
}

interface PairChartQueryData {
  pairHourDatas?: PairHourData[];
}

interface PairDayQueryData {
  pairDayDatas?: PairDayData[];
}

const PERIOD_TO_DAYS: Record<ChartPeriod, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "ALL": 365,
};

export function usePoolChartData(
  pairAddress: Address | undefined,
  period: ChartPeriod = "1W"
): UsePoolChartDataResult {
  // Calculate start time based on period
  const startTime = useMemo(() => {
    const days = PERIOD_TO_DAYS[period];
    const now = Math.floor(Date.now() / 1000);
    return now - days * 86400;
  }, [period]);

  // Use hourly data for 1D, daily data for longer periods
  const useHourlyData = period === "1D";

  // Fetch hourly data
  const {
    data: hourlyData,
    loading: hourlyLoading,
    error: hourlyError,
  } = useQuery<PairChartQueryData>(GET_PAIR_CHART_DATA, {
    client: apolloClient,
    variables: {
      pairAddress: pairAddress?.toLowerCase(),
      startTime,
    },
    skip: !pairAddress || !useHourlyData,
    fetchPolicy: "cache-first",
  });

  // Fetch daily data
  const {
    data: dailyData,
    loading: dailyLoading,
    error: dailyError,
  } = useQuery<PairDayQueryData>(GET_PAIR_DAY_DATA, {
    client: apolloClient,
    variables: {
      pairAddress: pairAddress?.toLowerCase(),
      startTime: Math.floor(startTime / 86400) * 86400, // Round to day boundary
    },
    skip: !pairAddress || useHourlyData,
    fetchPolicy: "cache-first",
  });

  // Process the data
  const chartData = useMemo(() => {
    if (useHourlyData && hourlyData?.pairHourDatas) {
      return hourlyData.pairHourDatas.map((point) => ({
        timestamp: parseInt(point.hourStartUnix),
        liquidity: parseFloat(point.reserveUSD || "0"),
        volume: parseFloat(point.hourlyVolumeUSD || "0"),
        reserve0: parseFloat(point.reserve0 || "0"),
        reserve1: parseFloat(point.reserve1 || "0"),
      }));
    } else if (!useHourlyData && dailyData?.pairDayDatas) {
      return dailyData.pairDayDatas.map((point) => ({
        timestamp: parseInt(point.date),
        liquidity: parseFloat(point.reserveUSD || "0"),
        volume: parseFloat(point.dailyVolumeUSD || "0"),
        reserve0: parseFloat(point.reserve0 || "0"),
        reserve1: parseFloat(point.reserve1 || "0"),
      }));
    }
    return [];
  }, [useHourlyData, hourlyData, dailyData]);

  return {
    data: chartData,
    isLoading: useHourlyData ? hourlyLoading : dailyLoading,
    error: (useHourlyData ? hourlyError : dailyError) || null,
  };
}
