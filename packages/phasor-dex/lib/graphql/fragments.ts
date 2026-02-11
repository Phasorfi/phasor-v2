"use client";

import { gql } from "@apollo/client";

// Token fields fragment for Velodrome/Envio schema
export const TOKEN_FIELDS = gql`
  fragment TokenFields on Token {
    id
    address
    symbol
    name
    decimals
    chainId
    pricePerUSDNew
    lastUpdatedTimestamp
    isWhitelisted
  }
`;

// Pool fields fragment for Velodrome/Envio schema
// Uses LiquidityPoolAggregator entity
export const POOL_FIELDS = gql`
  fragment PoolFields on LiquidityPoolAggregator {
    id
    chainId
    poolAddress
    name
    token0_id
    token1_id
    token0_address
    token1_address
    isStable
    isCL
    reserve0
    reserve1
    totalLPTokenSupply
    totalLiquidityUSD
    totalVolume0
    totalVolume1
    totalVolumeUSD
    totalFeesGenerated0
    totalFeesGenerated1
    totalFeesGeneratedUSD
    numberOfSwaps
    token0Price
    token1Price
    baseFee
    currentFee
    lastUpdatedTimestamp
    lastSnapshotTimestamp
  }
`;

// Pool snapshot fields for chart data
export const POOL_SNAPSHOT_FIELDS = gql`
  fragment PoolSnapshotFields on LiquidityPoolAggregatorSnapshot {
    id
    chainId
    name
    pool
    token0_id
    token1_id
    token0_address
    token1_address
    isStable
    isCL
    reserve0
    reserve1
    totalLPTokenSupply
    totalLiquidityUSD
    totalVolume0
    totalVolume1
    totalVolumeUSD
    totalFeesGenerated0
    totalFeesGenerated1
    totalFeesGeneratedUSD
    numberOfSwaps
    token0Price
    token1Price
    timestamp
  }
`;

// User stats per pool for position tracking
export const USER_STATS_FIELDS = gql`
  fragment UserStatsFields on UserStatsPerPool {
    id
    userAddress
    poolAddress
    chainId
    currentLiquidityUSD
    lpBalance
    totalLiquidityAddedUSD
    totalLiquidityAddedToken0
    totalLiquidityAddedToken1
    totalLiquidityRemovedUSD
    totalLiquidityRemovedToken0
    totalLiquidityRemovedToken1
    totalFeesContributedUSD
    totalFeesContributed0
    totalFeesContributed1
    numberOfSwaps
    totalSwapVolumeUSD
    firstActivityTimestamp
    lastActivityTimestamp
  }
`;

// Token price snapshot fields
export const TOKEN_PRICE_SNAPSHOT_FIELDS = gql`
  fragment TokenPriceSnapshotFields on TokenPriceSnapshot {
    id
    address
    pricePerUSDNew
    chainId
    isWhitelisted
    lastUpdatedTimestamp
  }
`;

// Legacy aliases for backwards compatibility during migration
export const PAIR_FIELDS = POOL_FIELDS;
export const PAIR_DAY_DATA_FIELDS = POOL_SNAPSHOT_FIELDS;
export const PAIR_HOUR_DATA_FIELDS = POOL_SNAPSHOT_FIELDS;
