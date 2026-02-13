import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, parseUnits, Address } from "viem";
import { Token } from "@/types";

// ============================================
// CLASS NAME UTILITIES
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// NUMBER FORMATTING
// ============================================

export function formatTokenAmount(
  amount: bigint | string,
  decimals: number,
  displayDecimals: number = 6
): string {
  const value = typeof amount === "string" ? amount : formatUnits(amount, decimals);
  const num = parseFloat(value);
  
  if (num === 0) return "0";
  if (num < 0.000001) return "<0.000001";
  if (num < 1) return num.toFixed(displayDecimals);
  if (num < 1000) return num.toFixed(4);
  if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(2)}M`;
  return `${(num / 1000000000).toFixed(2)}B`;
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    // Handle empty or invalid input
    if (!amount || amount === "" || amount === ".") return BigInt(0);
    
    // Clean the input
    const cleanAmount = amount.replace(/,/g, "");
    
    return parseUnits(cleanAmount, decimals);
  } catch {
    return BigInt(0);
  }
}

// ============================================
// ADDRESS UTILITIES
// ============================================

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function areAddressesEqual(a: Address, b: Address): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

// ============================================
// PRICE CALCULATIONS
// ============================================

export function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) return 0;
  
  // Spot price before swap
  const spotPrice = Number(reserveOut) / Number(reserveIn);
  
  // Execution price
  const executionPrice = Number(amountOut) / Number(amountIn);
  
  // Price impact as percentage
  const priceImpact = ((spotPrice - executionPrice) / spotPrice) * 100;
  
  return Math.max(0, priceImpact);
}

export function calculateMinimumReceived(
  amountOut: bigint,
  slippageBps: number
): bigint {
  // slippageBps is in basis points (50 = 0.5%)
  return (amountOut * BigInt(10000 - slippageBps)) / BigInt(10000);
}

export function calculateMaximumSent(
  amountIn: bigint,
  slippageBps: number
): bigint {
  return (amountIn * BigInt(10000 + slippageBps)) / BigInt(10000);
}

// ============================================
// UNISWAP V2 MATH
// ============================================

export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (amountIn === BigInt(0)) return BigInt(0);
  if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) return BigInt(0);
  
  const amountInWithFee = amountIn * BigInt(997);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * BigInt(1000) + amountInWithFee;
  
  return numerator / denominator;
}

export function getAmountIn(
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (amountOut === BigInt(0)) return BigInt(0);
  if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) return BigInt(0);
  if (amountOut >= reserveOut) return BigInt(0);
  
  const numerator = reserveIn * amountOut * BigInt(1000);
  const denominator = (reserveOut - amountOut) * BigInt(997);
  
  return numerator / denominator + BigInt(1);
}

export function quote(
  amountA: bigint,
  reserveA: bigint,
  reserveB: bigint
): bigint {
  if (amountA === BigInt(0)) return BigInt(0);
  if (reserveA === BigInt(0) || reserveB === BigInt(0)) return BigInt(0);
  
  return (amountA * reserveB) / reserveA;
}

// ============================================
// TOKEN SORTING
// ============================================

export function sortTokens(tokenA: Address, tokenB: Address): [Address, Address] {
  return tokenA.toLowerCase() < tokenB.toLowerCase()
    ? [tokenA, tokenB]
    : [tokenB, tokenA];
}

// ============================================
// DEADLINE CALCULATION
// ============================================

export function getDeadline(minutes: number): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
}

// ============================================
// LIQUIDITY CALCULATIONS
// ============================================

export function calculatePoolShare(
  userLiquidity: bigint,
  totalSupply: bigint
): number {
  if (totalSupply === BigInt(0)) return 0;
  return (Number(userLiquidity) / Number(totalSupply)) * 100;
}

export function calculateTokenAmounts(
  liquidity: bigint,
  totalSupply: bigint,
  reserve0: bigint,
  reserve1: bigint
): { amount0: bigint; amount1: bigint } {
  if (totalSupply === BigInt(0)) {
    return { amount0: BigInt(0), amount1: BigInt(0) };
  }

  return {
    amount0: (liquidity * reserve0) / totalSupply,
    amount1: (liquidity * reserve1) / totalSupply,
  };
}

// ============================================
// GAS ESTIMATION
// ============================================

export function formatGasEstimate(gasEstimate: bigint): string {
  const gasNumber = Number(gasEstimate);
  if (gasNumber >= 1_000_000) {
    return `${(gasNumber / 1_000_000).toFixed(2)}M`;
  }
  if (gasNumber >= 1_000) {
    return `${(gasNumber / 1_000).toFixed(0)}K`;
  }
  return gasNumber.toLocaleString();
}

export function calculateGasCost(
  gasEstimate: bigint,
  gasPrice: bigint,
  nativeTokenPrice?: number
): {
  gasEstimate: bigint;
  gasPriceGwei: string;
  costInNative: string;
  costInUSD?: string;
} {
  // Calculate cost in native token (ETH/MON)
  const costInWei = gasEstimate * gasPrice;
  const costInNative = formatUnits(costInWei, 18);

  // Calculate USD cost if native token price is provided
  const costInUSD = nativeTokenPrice
    ? formatUSD(parseFloat(costInNative) * nativeTokenPrice)
    : undefined;

  // Format gas price in Gwei
  const gasPriceGwei = formatUnits(gasPrice, 9);

  return {
    gasEstimate,
    gasPriceGwei,
    costInNative,
    costInUSD,
  };
}
