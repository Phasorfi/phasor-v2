---
description: >-
  Phasor isn't a collection of separate features — it's an interconnected system
  where every action reinforces the whole. This page explains how the pieces fit
  together and why the protocol rewards part
---

# How Phasor Works – The Flywheel

<figure><img src="../.gitbook/assets/phasor-docs-flywheel (2).png" alt=""><figcaption></figcaption></figure>

### The Core Problem

Most DEXs suffer from the same two issues:

1. **Shallow liquidity** — Not enough tokens in pools, leading to bad prices and high slippage for traders
2. **Mercenary capital** — LPs chase the highest farm yield, pull liquidity when rewards dry up, and move to the next protocol

Phasor solves both by aligning everyone's incentives into a single, self-reinforcing cycle.

### The Flywheel

```
                    ┌─────────────────┐
                    │   LOCK PHSR     │
                    │   → vePHSR      │
                    └────────┬────────┘
                             │
                    Voting power + fee earnings
                    + rebase protection
                    + launchpad access
                             │
                             ▼
                    ┌─────────────────┐
                    │   VOTE ON       │
          ┌────────–│   POOL GAUGES   │────────┐
          │         └─────────────────┘        │
          │                                    │
   Emissions directed                   Voters earn
   to voted pools                       trading fees
          │                             + bribes
          ▼                                    │
┌─────────────────┐                   ┌────────┴────────┐
│   LPs STAKE     │                   │   MORE REASON   │
│   IN GAUGES     │                   │   TO LOCK PHSR  │
│   (1x → 3x)     │                   └────────┬────────┘
└────────┬────────┘                            │
         │                                     │
   Deep, sticky                                │
   liquidity                                   │
         │                                     │
         ▼                                     │
┌─────────────────┐                            │
│   TRADERS GET   │                            │
│   BETTER PRICES │                            │
└────────┬────────┘                            │
         │                                     │
   More volume                                 │
   → more fees ───────────────────────-────────┘
```

### Step by Step

#### 1. Lock PHSR → Get vePHSR

Users lock their PHSR tokens to receive a veNFT (vePHSR). This does four things at once:

* **Voting power** — Decide which pools receive PHSR emissions each week
* **Fee earnings** — Earn trading fees from every pool you vote for
* **Rebase protection** — Receive additional PHSR to offset dilution from emissions
* **Launchpad access** — Only vePHSR holders can participate in new token launches

The longer you lock, the more voting power you get (up to 4 years for maximum power).

#### 2. Vote on Gauges

Every week (epoch), vePHSR holders allocate their voting power across pools. Pools with more votes receive a larger share of that week's PHSR emissions.

Voters are naturally incentivized to vote for pools that generate the most trading volume — because they earn the fees from those pools. This means emissions organically flow toward productive liquidity, not dead pools.

#### 3. LPs Stake and Stay

Liquidity providers stake their LP tokens in gauges to earn PHSR emissions. Phasor adds a unique layer: the **time multiplier**.

* Day 0: 1x rewards
* Day 45: 2x rewards
* Day 90+: 3x rewards

This means LPs who stay staked earn dramatically more than those who hop in and out. The result: sticky liquidity that doesn't leave when a shinier farm appears.

Withdrawing resets the multiplier to 1x, creating a strong incentive to stay.

#### 4. Deep Liquidity → Better Trading

More staked LP means deeper pools. Deeper pools mean better prices and lower slippage for traders. Better trading attracts more volume.

#### 5. More Volume → More Fees → More Reason to Lock

Higher trading volume generates more swap fees. Those fees flow to vePHSR voters. Higher fee earnings make locking PHSR more attractive. More locked PHSR means stronger governance and more committed participants.

And the cycle continues.

### Why It Works

Each participant type benefits from the others:

| Participant       | What they do                | What they earn                    | Why they stay                      |
| ----------------- | --------------------------- | --------------------------------- | ---------------------------------- |
| **Traders**       | Swap tokens                 | Better prices from deep liquidity | Phasor has the best rates on Monad |
| **LPs**           | Provide liquidity and stake | PHSR emissions (up to 3x)         | Time multiplier rewards loyalty    |
| **vePHSR Voters** | Lock PHSR and vote          | Trading fees + bribes + rebases   | Multiple income streams compound   |
| **Projects**      | Launch tokens + add bribes  | Deep liquidity for their token    | Cheaper than running own farm      |

No one is extracting value at someone else's expense. Everyone benefits when the ecosystem grows.

### The Two Retention Mechanisms

What makes Phasor's flywheel stickier than a typical DEX:

#### For Token Holders: vePHSR Lock

Locking PHSR gives you fees, rebases, launchpad access, and governance power. Selling means giving all of that up. The more the protocol grows, the more valuable your locked position becomes — creating an increasing cost to exit.

#### For Liquidity Providers: Time Multiplier

The 3x multiplier at 90 days is a massive advantage. An LP who has been staked for 90 days earns triple the PHSR of a new staker with the same position. Leaving means restarting from 1x — a steep opportunity cost that keeps liquidity in place.

Together, these mechanisms solve the mercenary capital problem: both token holders and LPs are incentivized to commit long-term, not extract short-term.

### Adding Fuel: Bribes & Launchpad

Two additional mechanisms amplify the flywheel:

#### Bribes

Projects deposit bribe tokens to incentivize vePHSR voters to direct emissions to their pools. This creates a competitive marketplace for liquidity — projects compete for votes, voters earn additional income, and LPs benefit from increased emissions.

#### Ve-Gated Launchpad

New projects launch exclusively to vePHSR holders. This creates demand for PHSR (you need to lock to participate), gives projects an engaged buyer base, and immediately creates liquidity pools and gauges for new tokens.

Every successful launch adds a new pool to the ecosystem — more pools, more volume, more fees, more reason to lock.

### Summary

Phasor isn't just a DEX. It's a system designed so that every participant — trader, LP, voter, and project — is incentivized to contribute to the protocol's growth. The more people participate, the better it works for everyone.

**Lock → Vote → Earn → Stake → Stay.**

That's the Phasor flywheel.
