import { Address } from "viem";

export interface Token {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

export interface TokenAmount {
  token: Token;
  amount: string;
  amountBN: bigint;
}

export interface Pool {
  address: Address;
  token0: Token;
  token1: Token;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  fee: number; // 0.3% = 30
  isStable?: boolean;
  // Optional metrics - may not be available for new/inactive pools
  tvlUSD?: number;
  volume24hUSD?: number;
  apr?: number;
}

export interface SwapQuote {
  amountIn: bigint;
  amountOut: bigint;
  priceImpact: number;
  route: Token[];
  minimumReceived: bigint;
  fee: bigint;
}

export interface AddLiquidityQuote {
  amount0: bigint;
  amount1: bigint;
  liquidity: bigint;
  shareOfPool: number;
}

export interface RemoveLiquidityQuote {
  liquidity: bigint;
  amount0: bigint;
  amount1: bigint;
}

export interface UserPosition {
  pool: Pool;
  liquidity: bigint;
  share: number;
  token0Amount: bigint;
  token1Amount: bigint;
  value?: number;
}

export interface TransactionSettings {
  slippageTolerance: number; // in basis points (50 = 0.5%)
  deadline: number; // in minutes
}

export type SwapField = "INPUT" | "OUTPUT";

export interface SwapState {
  independentField: SwapField;
  inputToken: Token | null;
  outputToken: Token | null;
  inputAmount: string;
  outputAmount: string;
}

// Portfolio types
export interface PortfolioToken {
  token: Token;
  balance: bigint;
  priceUSD: number;
  price24hAgo: number;
  valueUSD: number;
  allocation: number; // percentage
}

export interface PortfolioTransaction {
  id: string;
  type: 'swap' | 'mint' | 'burn';
  timestamp: number;
  token0: Token;
  token1: Token;
  amount0: string;
  amount1: string;
  amountUSD: number;
  hash: string;
}

export interface PortfolioHistoryPoint {
  timestamp: number;
  totalValueUSD: number;
}

// ============================================
// VOTING ESCROW (vePHASOR) TYPES - Velodrome V2
// ============================================

export interface LockedBalance {
  amount: bigint;
  end: number;
  isPermanent: boolean;
}

export interface VeNFT {
  tokenId: bigint;
  locked: LockedBalance;
  votingPower: bigint;
  voted: boolean;
}

// ============================================
// STAKING TYPES (Velodrome Gauge)
// ============================================

export interface UserStakeInfo {
  balance: bigint;
  timeMultiplier: bigint;
  pendingRewards: bigint;
  firstStakeTime: number;
}

export interface StakingPoolInfo {
  stakingToken: Address;
  rewardToken: Address;
  totalSupply: bigint;
  rewardRate: bigint;
  periodFinish: number;
  duration: number;
  rewardsLeft: bigint;
}

// ============================================
// LAUNCHPAD TYPES (VelodromeLauncher)
// ============================================

export type SaleState = 'pending' | 'active' | 'success' | 'failed' | 'finalized' | 'cancelled';

export interface SaleInfo {
  saleId: number;
  token: Address;
  baseToken: Address;
  tokenAmount: bigint;
  price: bigint;
  raised: bigint;
  softCap: bigint;
  hardCap: bigint;
  startTime: number;
  endTime: number;
  finalized: boolean;
  cancelled: boolean;
}

export interface SaleTokenMeta {
  symbol: string;
  name: string;
  decimals: number;
}

export interface UserSaleInfo {
  contribution: bigint;
  canParticipate: boolean;
}

// ============================================
// VOTING TYPES (Voter / Gauge)
// ============================================

export interface PoolVoteInfo {
  pool: Address;
  gauge: Address;
  token0Symbol: string;
  token1Symbol: string;
  isStable: boolean;
  isAlive: boolean;
  weight: bigint;
  weightPercent: number;
  userVote: bigint;
  feeAddress: Address;
  incentiveAddress: Address;
}

export interface EpochInfo {
  epochStart: number;
  epochEnd: number;
  voteStart: number;
  voteEnd: number;
}

// ============================================
// REWARDS TYPES (RewardsDistributor)
// ============================================

export interface RebaseReward {
  tokenId: bigint;
  claimable: bigint;
}
