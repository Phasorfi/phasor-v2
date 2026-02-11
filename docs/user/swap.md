# Swap

The Swap feature is the core of Phasor DEX, allowing you to exchange one token for another instantly and trustlessly.

## How Swaps Work

Phasor DEX uses an **Automated Market Maker (AMM)** model. Instead of matching buyers and sellers, trades execute against liquidity pools—reserves of token pairs deposited by liquidity providers.

When you swap:
1. You send Token A to the pool
2. The pool calculates the exchange rate using the **constant product formula**
3. You receive Token B from the pool
4. A trading fee is deducted — **0.30%** for volatile pools or **0.05%** for stable pools

## Making a Swap

### Step 1: Select Tokens

1. Navigate to the **Swap** page
2. Click the top token selector to choose your **input token** (what you're selling)
3. Click the bottom token selector to choose your **output token** (what you're buying)

**Tip:** Click the ↓ arrow between tokens to quickly reverse the swap direction.

### Step 2: Enter Amount

Enter the amount you want to swap in either field:
- **Input amount** — How much you want to sell
- **Output amount** — How much you want to receive

The other field calculates automatically based on current pool rates.

### Step 3: Review Details

Before confirming, review the swap details:

| Field | Description |
|-------|-------------|
| **Rate** | Exchange rate between the two tokens |
| **Price Impact** | How much your trade affects the pool price |
| **Minimum Received** | Guaranteed minimum after slippage |
| **Fee** | Trading fee (0.30% volatile / 0.05% stable) |

### Step 4: Approve & Swap

1. If this is your first time trading this token, click **Approve** to allow Phasor to access it
2. Wait for the approval transaction to confirm
3. Click **Swap** to execute the trade
4. Confirm the transaction in your wallet
5. Wait for confirmation (usually a few seconds)

## Understanding Swap Mechanics

### Exchange Rate

The exchange rate is determined by the ratio of tokens in the pool:

```
Price of Token A = Reserve of Token B / Reserve of Token A
```

As trades occur, this ratio shifts, causing prices to change.

### Price Impact

Price impact shows how much your trade will move the market price. Larger trades relative to pool size have higher price impact.

| Price Impact | Indication |
|--------------|------------|
| < 0.5% | Excellent — minimal market impact |
| 0.5% - 1% | Good — acceptable for most trades |
| 1% - 3% | Moderate — consider splitting into smaller trades |
| > 3% | High — significant impact, review carefully |
| > 10% | Very High — trade may be unfavorable |

**Tip:** For large trades, consider splitting into multiple smaller swaps or providing liquidity first.

### Slippage Tolerance

Slippage is the difference between expected and actual execution price. It occurs because:
- Pool prices can change between when you submit and when your transaction confirms
- Other transactions may execute before yours

**Setting Slippage Tolerance:**

1. Click the ⚙️ settings icon on the Swap page
2. Enter your slippage tolerance (default: 0.5%)
3. Higher tolerance = more likely to execute, but potentially worse price
4. Lower tolerance = better price protection, but may fail if price moves

**Recommended Settings:**

| Situation | Suggested Slippage |
|-----------|-------------------|
| Stable pairs (USDC/USDT) | 0.1% - 0.5% |
| Major pairs (WMON/USDC) | 0.5% - 1% |
| Volatile tokens | 1% - 3% |
| Low liquidity pools | 3% - 5% |

### Trading Fees

Swap fees depend on the pool type:

| Pool Type | Fee | Best For |
|-----------|-----|----------|
| Volatile | 0.30% | Most token pairs (WMON/USDC, PHASOR/WMON) |
| Stable | 0.05% | Pegged assets (USDC/USDT, DAI/USDC) |

Trading fees are distributed to **vePHASOR holders** who voted for that pool's gauge. This is part of the [ve(3,3) model](tokenomics.md) — voters direct emissions and earn fees in return.

## Swap Routes

For tokens without a direct pool, Phasor automatically routes through intermediate tokens:

```
Example: SOL → USDC (no direct pool)
Route: SOL → WMON → USDC
```

The router finds the optimal path to give you the best rate, considering:
- Available pools (both volatile and stable)
- Liquidity depth
- Total fees across hops

## Wrapping MON

The native MON token needs to be "wrapped" into WMON (an ERC-20 token) to trade on Phasor:

1. Select **MON** as input
2. Select **WMON** as output
3. Enter amount and confirm

Wrapping is a 1:1 conversion with no fees (only gas).

**Why wrap?**
- Native tokens can't be used directly in smart contracts
- WMON is required for pool operations and advanced features
- You can unwrap WMON back to MON anytime

## Tips for Better Swaps

### 1. Check Liquidity First
Before large swaps, visit the [Pools](pools.md) page to check available liquidity. Low-liquidity pools have higher price impact.

### 2. Time Your Trades
During high network activity, gas prices increase. Consider waiting for calmer periods for non-urgent trades.

### 3. Use Appropriate Slippage
Don't set slippage too high (vulnerable to MEV) or too low (transactions fail). Adjust based on token volatility.

### 4. Split Large Orders
For substantial trades, splitting into multiple smaller swaps can reduce overall price impact.

### 5. Compare Routes
For large amounts, the automatic router typically finds the best path, but verify the quoted rate seems reasonable.

## Common Issues

### "Insufficient Liquidity"
The pool doesn't have enough tokens for your trade. Try:
- Reducing trade size
- Trading a different pair
- Waiting for more liquidity

### "Price Impact Too High"
Your trade would move the price significantly. Try:
- Reducing trade size
- Increasing slippage tolerance (if you accept the impact)
- Splitting into smaller trades

### "Transaction Failed"
The transaction couldn't execute. Common causes:
- Price moved beyond slippage tolerance
- Insufficient gas
- Token requires special handling

### "Approval Pending"
Wait for the approval transaction to confirm before swapping. This only needs to be done once per token.

---

## Next Steps

- **[Explore Liquidity Pools](pools.md)** — See available trading pairs and their stats
- **[Provide Liquidity](liquidity.md)** — Earn fees by adding to pools
- **[Track Your Activity](portfolio.md)** — Monitor your swap history
