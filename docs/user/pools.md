# Liquidity Pools

Liquidity pools are the foundation of Phasor DEX. They hold reserves of token pairs that traders can swap against, enabling trustless, on-chain trading.

## What Are Liquidity Pools?

A liquidity pool is a smart contract that holds two tokens in reserve. For example, a WMON/USDC pool contains both WMON and USDC tokens.

When traders swap tokens, they:
1. Deposit one token into the pool
2. Withdraw the other token from the pool
3. Pay a trading fee (0.30% for volatile pools, 0.05% for stable pools)

**Liquidity Providers (LPs)** deposit tokens into pools and receive LP tokens representing their share. LPs earn PHASOR rewards by staking their LP tokens in gauges, while trading fees are distributed to vePHASOR holders who voted for that pool.

## Pool Types

Phasor supports two pool types, each optimized for different trading pairs:

### Volatile Pools

| | |
|---|---|
| **Formula** | x × y = k (constant product) |
| **Fee** | 0.30% |
| **Best for** | Tokens with uncorrelated prices |
| **Examples** | WMON/USDC, WMON/WBTC, PHASOR/WMON |

Standard AMM pools. Prices adjust based on the ratio of reserves. Works well for most token pairs but can have higher slippage for large trades.

### Stable Pools

| | |
|---|---|
| **Formula** | x³y + y³x = k (StableSwap curve) |
| **Fee** | 0.05% |
| **Best for** | Tokens that trade near 1:1 |
| **Examples** | USDC/USDT, DAI/USDC |

Optimized for assets that should maintain a similar price. The StableSwap curve concentrates liquidity around the 1:1 ratio, resulting in dramatically lower slippage and fees for traders.

### Comparison

| Feature | Volatile | Stable |
|---------|----------|--------|
| Trading fee | 0.30% | 0.05% |
| Slippage | Higher for large trades | Very low near 1:1 |
| Impermanent loss | Higher with price divergence | Minimal for pegged assets |
| Best use case | General token pairs | Stablecoins, wrapped assets |

## Browsing Pools

### Pool List

Navigate to the **Pools** page to see all available trading pairs:

| Column | Description |
|--------|-------------|
| **Pool** | Token pair and type indicator (volatile/stable) |
| **TVL** | Total Value Locked — combined USD value of both tokens |
| **Volume (24h)** | Trading volume in the last 24 hours |
| **APR** | Estimated annual return from gauge emissions and fees |

### Pool Details

Click any pool to view detailed information:

- **Current Price** — Exchange rate between tokens
- **TVL** — Total liquidity in USD
- **24h Volume** — Recent trading activity
- **24h Fees** — Fees generated for vePHASOR voters
- **Liquidity & Volume Charts** — Historical data (1D, 1W, 1M, ALL)
- **Transactions** — Recent swaps, adds, and removes

## Understanding Pool Metrics

### Total Value Locked (TVL)

TVL represents the total USD value of tokens deposited in the pool. Higher TVL means better prices (lower slippage) for traders.

### APR (Annual Percentage Rate)

APR estimates yearly returns and can include:
- **Gauge emissions** — PHASOR rewards for staked LPs (boosted by [time multiplier](staking.md))
- **External incentives** — Additional rewards added by projects

```
Emissions APR = (Weekly PHASOR emissions × 52 / Staked TVL) × 100%
```

**Note:** APR varies based on vePHASOR voting, your staking multiplier, and total staked liquidity.

## LP Tokens

When you add liquidity, you receive **LP tokens** representing your pool share. These can be:
- **Staked in gauges** to earn PHASOR rewards with a [1x to 3x time multiplier](staking.md)
- **Held** to maintain your pool position
- **Burned** to withdraw your liquidity

---

**Next:** [Add Liquidity](liquidity.md) | [Staking Rewards](staking.md)
