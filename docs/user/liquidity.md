# Adding & Removing Liquidity

Provide liquidity to earn trading fees. This guide covers how to add and remove liquidity from Phasor pools.

## Adding Liquidity

### Step-by-Step

1. Navigate to **Pools** and click **Add Liquidity** (or select a pool and click **Add**)
2. Select the two tokens for your pair
3. Choose pool type: **Volatile** (standard, 0.30% fee) or **Stable** (for pegged assets, 0.05% fee)
4. Enter the amount for one token — the other calculates automatically to maintain the pool ratio
5. Review the details:
   - **Pool Share** — Your percentage of the pool after deposit
   - **Rates** — Current exchange rate
6. Click **Approve** for each token (first time only)
7. Click **Supply** and confirm in your wallet

### What You Receive

After adding liquidity, you receive **LP tokens** that represent:
- Your share of the pool
- Claim to underlying tokens plus accumulated fees
- Stakeable assets for additional rewards

### Requirements

- Equal USD value of both tokens
- Sufficient MON for gas fees
- Token approval for the router contract

## Removing Liquidity

### Step-by-Step

1. Navigate to **Pools** and find your position
2. Click **Remove** on the pool
3. Select the percentage to remove (25%, 50%, 75%, or 100%)
4. Review the tokens you'll receive
5. Click **Remove** and confirm in your wallet

### What You Receive

When removing liquidity, you get back:
- Your proportional share of **both tokens** in the pool
- All accumulated trading fees
- Amounts may differ from your original deposit due to trading activity

## Impermanent Loss

When token prices change relative to when you deposited, you may experience **impermanent loss** — having less value than if you simply held the tokens.

### How It Works

| Price Change | Impermanent Loss |
|--------------|------------------|
| 1.25x (25% up) | 0.6% |
| 1.50x (50% up) | 2.0% |
| 2x (100% up) | 5.7% |
| 3x (200% up) | 13.4% |
| 5x (400% up) | 25.5% |

*Loss is the same whether price goes up or down*

### Mitigation

- **Stable pools** for pegged assets (USDC/USDT) have near-zero impermanent loss by design
- **Staking rewards** with the [time multiplier](staking.md) provide significant additional compensation
- **Trading volume** generates fees that offset IL over time
- Consider IL as the "cost" of earning rewards

### Example

You deposit $1,000: 1 WMON ($500) + 500 USDC ($500)

If WMON doubles to $1,000:
- **Holding:** 1 WMON ($1,000) + 500 USDC ($500) = **$1,500**
- **LP Position:** ~0.707 WMON ($707) + 707 USDC ($707) = **$1,414**
- **Impermanent Loss:** $86 (5.7%)

But you also earned trading fees, which may exceed this loss.

## Best Practices

1. **Start with stable pools** — Lower IL risk and fees while learning
2. **Consider correlation** — Pairs that move together have less IL
3. **Stake your LP tokens** — After adding liquidity, [stake in the pool's gauge](staking.md) to earn PHASOR rewards with a growing time multiplier (up to 3x at 90 days)
4. **Monitor your positions** — Track performance in Portfolio
5. **Long-term perspective** — The time multiplier and fee accumulation reward patience

---

**Next:** [Portfolio Tracking](portfolio.md) | [Staking Rewards](staking.md)
