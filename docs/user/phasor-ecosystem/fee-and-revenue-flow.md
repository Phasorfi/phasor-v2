---
description: >-
  This page explains where every type of revenue in the Phasor protocol
  originates, where it goes, and who earns it.
---

# Fee & Revenue Flow

<figure><img src="../.gitbook/assets/phasor-docs-fee-and-revenue-flow (2).png" alt=""><figcaption></figcaption></figure>

### Overview

Phasor generates and distributes value through four distinct channels. Each one flows to a specific group of participants, creating aligned incentives across the ecosystem.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHASOR REVENUE FLOWS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SWAP FEES (0.30% / 0.05%)                                     │
│   Traders pay when swapping                                     │
│       └──→ vePHSR voters (who voted for that pool)              │
│                                                                 │
│   PHSR EMISSIONS (weekly, decaying)                             │
│   Minted by the protocol                                        │
│       ├──→ 95% to Gauges → LP stakers (boosted by multiplier)   │
│       └──→ 5% to Team                                           │
│                                                                 │
│   REBASES (weekly)                                              │
│   Anti-dilution mechanism                                       │
│       └──→ vePHSR holders (proportional to locked supply)       │
│                                                                 │
│   BRIBES (deposited by projects)                  │
│   Vote incentives for gauges                                    │
│       └──→ vePHSR voters (who voted for that pool)              │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Channel 1: Swap Fees

| Detail  | Value                                                |
| ------- | ---------------------------------------------------- |
| Source  | Every token swap on Phasor DEX                       |
| Rate    | 0.30% (volatile pools) / 0.05% (stable pools)        |
| Paid by | Traders                                              |
| Goes to | vePHSR holders who voted for that pool's gauge       |
| Timing  | Claimable after each epoch flip (Thursday 00:00 UTC) |

Swap fees are the protocol's core revenue. Unlike most DEXs where fees go directly to LPs, Phasor routes 100% of swap fees to vePHSR voters. This is a key feature of the ve(3,3) model — it gives token lockers a direct financial incentive to participate in governance.

**Why this matters:** Voters are incentivized to direct emissions toward high-volume pools, because those pools generate the most fees. This creates a natural feedback loop where emissions flow to productive liquidity.

### Channel 2: PHSR Emissions

| Detail        | Value                                  |
| ------------- | -------------------------------------- |
| Source        | Minted weekly by the Minter contract   |
| Starting rate | 15,000,000 PHSR per week               |
| Decay         | 1% reduction each week                 |
| Goes to       | 95% to gauges (LP stakers), 5% to team |
| Timing        | Distributed at each epoch flip         |

Emissions are the primary reward for liquidity providers. Each week, the total emission is split across all active gauges based on vePHSR votes.

**For LP stakers:** Your share of emissions depends on three factors:

1. How much LP you've staked in the gauge
2. Your time multiplier (1x → 3x over 90 days)
3. How much total PHSR that gauge received from votes

### Channel 3: Rebases

| Detail  | Value                                           |
| ------- | ----------------------------------------------- |
| Source  | Minted alongside weekly emissions               |
| Goes to | All vePHSR holders                              |
| Amount  | Proportional to locked PHSR / total PHSR supply |
| Timing  | Distributed at each epoch flip                  |

Rebases protect vePHSR holders from dilution. As new PHSR is emitted each week, lockers receive additional PHSR to offset their share being diluted.

**Example:** If 60% of all PHSR is locked as vePHSR, lockers receive a rebase that offsets roughly 60% of the dilution from that week's emissions.

### Channel 4: Bribes

| Detail  | Value                                      |
| ------- | ------------------------------------------ |
| Source  | Deposited by projects, DAOs, or any wallet |
| Token   | Any ERC-20                                 |
| Goes to | vePHSR voters who voted for that gauge     |
| Timing  | Distributed at each epoch flip             |

Bribes are vote incentives that projects deposit to attract emissions to their pools. Voters who support bribed pools earn a proportional share of the bribe alongside their trading fee earnings.

Learn more: [Bribes & Vote Incentives](bribes-and-vote-incentives.md)

### Who Earns What — Summary

#### vePHSR Holders (Voters)

* Swap fees from pools they voted for
* Rebases (anti-dilution)
* Bribes from pools they voted for&#x20;
* Launchpad access (ve-gated)

#### LP Stakers

* PHSR emissions (boosted up to 3x by time multiplier)

#### Team

* 5% of weekly PHSR emissions

### The Flywheel in Action

These revenue channels don't exist in isolation — they reinforce each other:

1. **Voters direct emissions** to pools that generate the most fees (because they earn those fees)
2. **LPs stake where emissions are highest** (because that's where they earn the most PHSR)
3. **Deep liquidity attracts traders** (better prices, lower slippage)
4. **More trading generates more fees** (which flow back to voters)
5. **Projects add bribes** to compete for votes and liquidity
6. **The time multiplier keeps LPs staked** (3x advantage for staying)

The result: a self-reinforcing system where every participant is incentivized to contribute to the protocol's growth.
