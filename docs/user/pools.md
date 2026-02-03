# Liquidity Pools

Liquidity pools are the foundation of Phasor DEX. They enable trustless trading by holding reserves of token pairs that traders can swap against.

## What Are Liquidity Pools?

A liquidity pool is a smart contract that holds two tokens in reserve. For example, a WMON/USDC pool contains both WMON and USDC tokens.

When traders swap tokens, they:
1. Deposit one token into the pool
2. Withdraw the other token from the pool
3. Pay a 0.3% fee that stays in the pool

**Liquidity Providers (LPs)** deposit tokens into pools and receive LP tokens representing their share. In return, they earn a portion of all trading fees proportional to their pool share.

## Browsing Pools

### Pool List

Navigate to the **Pools** page to see all available trading pairs:

| Column | Description |
|--------|-------------|
| **Pool** | Token pair (e.g., WMON/USDC) |
| **TVL** | Total Value Locked — combined USD value of both tokens |
| **Volume (24h)** | Trading volume in the last 24 hours |
| **APR** | Estimated annual percentage return from fees |

### Pool Details

Click any pool to view detailed information:

- **Current Price** — Exchange rate between tokens
- **TVL** — Total liquidity in USD
- **24h Volume** — Recent trading activity
- **24h Fees** — Fees generated for LPs
- **Liquidity & Volume Charts** — Historical data (1D, 1W, 1M, ALL)
- **Transactions** — Recent swaps, adds, and removes

## Understanding Pool Metrics

### Total Value Locked (TVL)

TVL represents the total USD value of tokens deposited in the pool. Higher TVL means better prices (lower slippage) for traders and more stable returns for LPs.

### APR (Annual Percentage Rate)

APR estimates yearly returns from trading fees:

```
APR = (24h Fees × 365 / TVL) × 100%
```

**Note:** APR is based on recent activity and doesn't account for impermanent loss.

### Constant Product Formula

Phasor uses the formula `x × y = k` where x and y are token reserves. This ensures prices adjust automatically based on supply and demand.

## LP Tokens

When you add liquidity, you receive **LP tokens** representing your pool share. These can be:
- Held to earn trading fees
- Staked for additional PHASOR rewards
- Burned to withdraw your liquidity

---

**Next:** [Add Liquidity](liquidity.md) | [Staking Rewards](staking.md)
