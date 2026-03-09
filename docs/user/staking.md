# Staking Rewards

## Overview

After providing liquidity, you can **stake your LP tokens** in a pool's gauge to earn PHASOR emission rewards. Gauges are reward contracts — each pool has one, and the amount of PHASOR emissions it receives depends on how vePHASOR holders vote.

Phasor takes this a step further with a unique **time-based multiplier**: the longer you keep your LP staked, the more you earn — up to **3x** your base rewards.

## Time Multiplier

> This is a Phasor-exclusive feature not found in standard Velodrome.

When you stake LP tokens in a gauge, your reward multiplier starts at **1x** and grows linearly to **3x** over **90 days** of continuous staking.

| Days Staked | Multiplier |
|-------------|------------|
| Day 0 | 1.00x |
| Day 15 | 1.33x |
| Day 30 | 1.67x |
| Day 45 | 2.00x |
| Day 60 | 2.33x |
| Day 75 | 2.67x |
| Day 90+ | 3.00x |

### How It Affects Rewards

Your effective reward share = your LP stake × your current multiplier. A staker at 3x earns three times the PHASOR rewards compared to a brand-new staker with the same LP position.

> **Example:** You and another user each stake 1,000 LP tokens. You've been staked for 90 days (3x), they just started (1x). You earn 3x as much PHASOR from that gauge this week.

### Important

- **Withdrawing resets your multiplier back to 1x.** Unstaking and re-staking starts the 90-day clock over.
- **Claiming rewards does NOT reset your multiplier.** You can claim freely without losing progress.
- Your multiplier is tracked per gauge. Staking in a different gauge starts a separate multiplier.

## How to Stake

### Step 1: Get LP Tokens

First, add liquidity to a pool to receive LP tokens. [How to add liquidity →](liquidity.md)

### Step 2: Stake in Gauge

1. Navigate to the **Staking** page
2. Find the pool you provided liquidity for
3. Enter the amount of LP tokens to stake
4. Click **Approve** (first time only)
5. Click **Stake** and confirm the transaction

Your LP tokens are now earning PHASOR rewards with your multiplier growing each day.

## Claiming Rewards

1. Go to the **Staking** page
2. View your pending PHASOR rewards (reflecting your current multiplier)
3. Click **Claim** and confirm

Rewards accumulate continuously. You can claim at any time — there's no lockup on earned PHASOR.

## Unstaking

1. Go to the **Staking** page
2. Click **Unstake** on the position you want to withdraw
3. Enter the amount of LP tokens to withdraw
4. Click **Unstake** and confirm

You'll receive your LP tokens back along with any unclaimed rewards. Remember: unstaking resets your time multiplier for that gauge.

After unstaking, you can [remove liquidity](liquidity.md) to get your underlying tokens back, or re-stake to start building your multiplier again.

## Strategy Tips

- **Stake early and stay staked** — The 3x multiplier at 90 days is a significant advantage over new stakers
- **Claim rewards regularly** — It doesn't affect your multiplier, so there's no reason to wait
- **Choose high-emission pools** — Pools with more vePHASOR votes receive more PHASOR rewards
- **Combine with vePHASOR** — Lock your earned PHASOR to vote for the pools you're staked in, creating a positive feedback loop
- **Avoid unnecessary unstaking** — Even a brief withdrawal resets your 90-day clock

---

**Next:** [Launchpad](launchpad.md) | [vePHASOR & Voting](voting-escrow.md)
