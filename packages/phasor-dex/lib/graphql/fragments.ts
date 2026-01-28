"use client";

import { gql } from "@apollo/client";

export const TOKEN_FIELDS = gql`
  fragment TokenFields on Token {
    id
    symbol
    name
    decimals
    derivedETH
    tradeVolume
    tradeVolumeUSD
    untrackedVolumeUSD
    totalLiquidity
    txCount
  }
`;

export const PAIR_FIELDS = gql`
  fragment PairFields on Pair {
    id
    token0 {
      ...TokenFields
    }
    token1 {
      ...TokenFields
    }
    reserve0
    reserve1
    reserveUSD
    totalSupply
    trackedReserveETH
    reserveETH
    volumeUSD
    untrackedVolumeUSD
    token0Price
    token1Price
    createdAtTimestamp
    createdAtBlockNumber
    txCount
  }
  ${TOKEN_FIELDS}
`;

export const PAIR_DAY_DATA_FIELDS = gql`
  fragment PairDayDataFields on PairDayData {
    id
    date
    pairAddress
    token0 {
      id
      symbol
    }
    token1 {
      id
      symbol
    }
    reserve0
    reserve1
    totalSupply
    reserveUSD
    dailyVolumeToken0
    dailyVolumeToken1
    dailyVolumeUSD
    dailyTxns
  }
`;

export const PAIR_HOUR_DATA_FIELDS = gql`
  fragment PairHourDataFields on PairHourData {
    id
    hourStartUnix
    pair {
      id
    }
    reserve0
    reserve1
    totalSupply
    reserveUSD
    hourlyVolumeToken0
    hourlyVolumeToken1
    hourlyVolumeUSD
    hourlyTxns
  }
`;
