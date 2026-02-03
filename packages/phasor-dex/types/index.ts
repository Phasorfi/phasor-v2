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
// VOTING ESCROW (vePHASOR) TYPES
// ============================================

export interface LockedBalance {
  amount: bigint;
  start: number;
  end: number;
}

export interface VeNFT {
  tokenId: bigint;
  locked: LockedBalance;
  votingPower: bigint;
}

// ============================================
// STAKING TYPES
// ============================================

export interface StakeDeposit {
  amount: bigint;
  timestamp: number;
}

export interface UserStakeInfo {
  balance: bigint;
  effectiveBalance: bigint;
  deposits: StakeDeposit[];
  timeMultiplier: bigint;
  veBoost: bigint;
  totalMultiplier: bigint;
  pendingRewards: bigint;
  veTokenId: bigint;
}

export interface StakingPoolInfo {
  stakingToken: Address;
  rewardsToken: Address;
  totalSupply: bigint;
  totalEffectiveSupply: bigint;
  rewardRate: bigint;
  periodFinish: number;
  rewardsDuration: number;
}

// ============================================
// LAUNCHPAD TYPES
// ============================================

export interface SaleInfo {
  saleToken: Address;
  paymentToken: Address;
  totalTokens: bigint;
  startTime: number;
  endTime: number;
  softCap: bigint;
  hardCap: bigint;
  vestingDuration: number;
  vestingCliff: number;
}

export interface SaleStatus {
  totalRaised: bigint;
  totalParticipants: number;
  finalized: boolean;
  cancelled: boolean;
}

export type LaunchState = 'pending' | 'active' | 'success' | 'failed' | 'finalized' | 'cancelled';

export interface LaunchInfo {
  address: Address;
  creator: Address;
  saleInfo: SaleInfo;
  saleStatus: SaleStatus;
  liquidityBps: number;
  tokensForLiquidity: bigint;
  state: LaunchState;
  saleTokenSymbol?: string;
  saleTokenName?: string;
  saleTokenDecimals?: number;
  paymentTokenSymbol?: string;
  paymentTokenDecimals?: number;
}

export interface UserLaunchInfo {
  commitment: bigint;
  allocation: bigint;
  claimed: boolean;
  vestingWallet: Address | null;
}

export interface CreateLaunchParams {
  saleToken: Address;
  paymentToken: Address;
  totalTokens: bigint;
  tokensForLiquidity: bigint;
  startTime: number;
  endTime: number;
  softCap: bigint;
  hardCap: bigint;
  vestingDuration: number;
  vestingCliff: number;
  liquidityBps: number;
}
