"use client";

import { gql } from "@apollo/client";
import {
  POOL_FIELDS,
  POOL_SNAPSHOT_FIELDS,
  USER_STATS_FIELDS,
  TOKEN_FIELDS,
  TOKEN_PRICE_SNAPSHOT_FIELDS,
} from "./fragments";

// Get all pools (LiquidityPoolAggregator entities)
export const GET_POOLS = gql`
  query GetPools($chainId: Int!, $limit: Int = 100, $offset: Int = 0) {
    LiquidityPoolAggregator(
      limit: $limit
      offset: $offset
      order_by: { totalLiquidityUSD: desc }
      where: { chainId: { _eq: $chainId } }
    ) {
      ...PoolFields
    }
  }
  ${POOL_FIELDS}
`;

// Get single pool by ID
export const GET_POOL = gql`
  query GetPool($id: String!) {
    LiquidityPoolAggregator_by_pk(id: $id) {
      ...PoolFields
    }
  }
  ${POOL_FIELDS}
`;

// Get pool by address and chainId
export const GET_POOL_BY_ADDRESS = gql`
  query GetPoolByAddress($poolAddress: String!, $chainId: Int!) {
    LiquidityPoolAggregator(
      where: {
        poolAddress: { _eq: $poolAddress }
        chainId: { _eq: $chainId }
      }
      limit: 1
    ) {
      ...PoolFields
    }
  }
  ${POOL_FIELDS}
`;

// Get pool snapshots for chart data
export const GET_POOL_SNAPSHOTS = gql`
  query GetPoolSnapshots($poolAddress: String!, $chainId: Int!, $startTime: timestamptz!) {
    LiquidityPoolAggregatorSnapshot(
      limit: 1000
      order_by: { timestamp: asc }
      where: {
        pool: { _eq: $poolAddress }
        chainId: { _eq: $chainId }
        timestamp: { _gte: $startTime }
      }
    ) {
      ...PoolSnapshotFields
    }
  }
  ${POOL_SNAPSHOT_FIELDS}
`;

// Get user stats for all pools (replaces GET_USER_POSITIONS)
export const GET_USER_STATS = gql`
  query GetUserStats($userAddress: String!, $chainId: Int!) {
    UserStatsPerPool(
      where: {
        userAddress: { _eq: $userAddress }
        chainId: { _eq: $chainId }
      }
      order_by: { currentLiquidityUSD: desc }
    ) {
      ...UserStatsFields
    }
  }
  ${USER_STATS_FIELDS}
`;

// Get user stats for a specific pool
export const GET_USER_POOL_STATS = gql`
  query GetUserPoolStats($userAddress: String!, $poolAddress: String!, $chainId: Int!) {
    UserStatsPerPool(
      where: {
        userAddress: { _eq: $userAddress }
        poolAddress: { _eq: $poolAddress }
        chainId: { _eq: $chainId }
      }
      limit: 1
    ) {
      ...UserStatsFields
    }
  }
  ${USER_STATS_FIELDS}
`;

// Get all tokens
export const GET_TOKENS = gql`
  query GetTokens($chainId: Int!, $limit: Int = 100, $offset: Int = 0) {
    Token(
      limit: $limit
      offset: $offset
      where: { chainId: { _eq: $chainId } }
      order_by: { pricePerUSDNew: desc }
    ) {
      ...TokenFields
    }
  }
  ${TOKEN_FIELDS}
`;

// Get tokens by addresses
export const GET_TOKENS_BY_ADDRESSES = gql`
  query GetTokensByAddresses($addresses: [String!]!, $chainId: Int!) {
    Token(
      where: {
        address: { _in: $addresses }
        chainId: { _eq: $chainId }
      }
    ) {
      ...TokenFields
    }
  }
  ${TOKEN_FIELDS}
`;

// Get token by ID (chainId-address format)
export const GET_TOKEN = gql`
  query GetToken($id: String!) {
    Token_by_pk(id: $id) {
      ...TokenFields
    }
  }
  ${TOKEN_FIELDS}
`;

// Get token price history
export const GET_TOKEN_PRICE_HISTORY = gql`
  query GetTokenPriceHistory($address: String!, $chainId: Int!, $startTime: timestamptz!) {
    TokenPriceSnapshot(
      where: {
        address: { _eq: $address }
        chainId: { _eq: $chainId }
        lastUpdatedTimestamp: { _gte: $startTime }
      }
      order_by: { lastUpdatedTimestamp: asc }
      limit: 1000
    ) {
      ...TokenPriceSnapshotFields
    }
  }
  ${TOKEN_PRICE_SNAPSHOT_FIELDS}
`;

// Get current token prices
export const GET_TOKEN_PRICES = gql`
  query GetTokenPrices($addresses: [String!]!, $chainId: Int!) {
    Token(
      where: {
        address: { _in: $addresses }
        chainId: { _eq: $chainId }
      }
    ) {
      id
      address
      symbol
      name
      decimals
      pricePerUSDNew
    }
  }
`;

// Get multiple pools by addresses (batch query)
export const GET_POOLS_BY_ADDRESSES = gql`
  query GetPoolsByAddresses($poolAddresses: [String!]!, $chainId: Int!) {
    LiquidityPoolAggregator(
      where: {
        poolAddress: { _in: $poolAddresses }
        chainId: { _eq: $chainId }
      }
    ) {
      ...PoolFields
    }
  }
  ${POOL_FIELDS}
`;

// Get price history for multiple tokens
export const GET_MULTI_TOKEN_PRICE_HISTORY = gql`
  query GetMultiTokenPriceHistory($addresses: [String!]!, $chainId: Int!, $startTime: timestamptz!) {
    TokenPriceSnapshot(
      where: {
        address: { _in: $addresses }
        chainId: { _eq: $chainId }
        lastUpdatedTimestamp: { _gte: $startTime }
      }
      order_by: { lastUpdatedTimestamp: asc }
      limit: 5000
    ) {
      ...TokenPriceSnapshotFields
    }
  }
  ${TOKEN_PRICE_SNAPSHOT_FIELDS}
`;

// Legacy query aliases for backwards compatibility
// Note: These return empty arrays as individual event entities don't exist in Velodrome schema

// Get user positions (now uses UserStatsPerPool)
export const GET_USER_POSITIONS = gql`
  query GetUserPositions($user: String!, $chainId: Int!) {
    UserStatsPerPool(
      where: {
        userAddress: { _eq: $user }
        chainId: { _eq: $chainId }
        lpBalance: { _gt: "0" }
      }
      order_by: { lastActivityTimestamp: desc }
    ) {
      ...UserStatsFields
    }
  }
  ${USER_STATS_FIELDS}
`;

// Get user transactions - returns user activity stats
// Note: Individual transaction history is not available in Velodrome indexer
export const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions($user: String!, $chainId: Int!) {
    UserStatsPerPool(
      where: {
        userAddress: { _eq: $user }
        chainId: { _eq: $chainId }
      }
      order_by: { lastActivityTimestamp: desc }
      limit: 50
    ) {
      id
      poolAddress
      chainId
      numberOfSwaps
      totalSwapVolumeUSD
      totalLiquidityAddedUSD
      totalLiquidityRemovedUSD
      firstActivityTimestamp
      lastActivityTimestamp
    }
  }
`;

// Get user's liquidity positions (pools where user has LP balance)
export const GET_USER_LIQUIDITY_POSITIONS = gql`
  query GetUserLiquidityPositions($user: String!, $chainId: Int!) {
    UserStatsPerPool(
      where: {
        userAddress: { _eq: $user }
        chainId: { _eq: $chainId }
        lpBalance: { _gt: "0" }
      }
    ) {
      id
      userAddress
      poolAddress
      chainId
      lpBalance
      currentLiquidityUSD
    }
  }
`;

// Chart data queries - use pool snapshots
export const GET_PAIR_CHART_DATA = GET_POOL_SNAPSHOTS;
export const GET_PAIR_DAY_DATA = GET_POOL_SNAPSHOTS;

// Protocol stats - aggregate from pools
export const GET_PROTOCOL_DATA = gql`
  query GetProtocolData($chainId: Int!) {
    LiquidityPoolAggregator_aggregate(
      where: { chainId: { _eq: $chainId } }
    ) {
      aggregate {
        count
        sum {
          totalLiquidityUSD
          totalVolumeUSD
          numberOfSwaps
        }
      }
    }
  }
`;

// Note: These queries are stubs since Velodrome indexer doesn't store individual events
// The frontend will need to be updated to work without individual transaction lists
// or use RPC calls to fetch recent events

export const GET_PAIR_SWAPS = gql`
  query GetPairSwaps($pairId: String!, $chainId: Int!) {
    LiquidityPoolAggregator(
      where: {
        poolAddress: { _eq: $pairId }
        chainId: { _eq: $chainId }
      }
      limit: 1
    ) {
      id
      poolAddress
      numberOfSwaps
      totalVolumeUSD
    }
  }
`;

export const GET_PAIR_MINTS = GET_PAIR_SWAPS;
export const GET_PAIR_BURNS = GET_PAIR_SWAPS;

// Bundle query (not available in Velodrome schema - uses token prices directly)
export const GET_BUNDLE = gql`
  query GetBundle {
    Token(limit: 1) {
      id
    }
  }
`;

// Get tokens by IDs
export const GET_TOKENS_BY_IDS = gql`
  query GetTokensByIds($ids: [String!]!) {
    Token(where: { id: { _in: $ids } }) {
      ...TokenFields
    }
  }
  ${TOKEN_FIELDS}
`;
