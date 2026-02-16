# PHSR Token

<figure><img src=".gitbook/assets/phasor-docs-token (2).png" alt=""><figcaption></figcaption></figure>

## What is PHSR?

PHSR is the native token of the Phasor DEX ecosystem. It serves three core purposes:

1. **Governance** — Lock PHSR to receive voting power over protocol emissions
2. **Rewards** — Distributed to liquidity providers who stake LP tokens in gauges
3. **Alignment** — The ve(3,3) model ensures that the protocol rewards participants who commit long-term

PHSR is not just a reward token — it's the mechanism that coordinates the entire ecosystem.

## The ve(3,3) Model

<figure><img src=".gitbook/assets/phasor-docs-ve3m (1).png" alt=""><figcaption></figcaption></figure>

Phasor uses a **ve(3,3) tokenomics model**, originally pioneered by Solidly and refined by Velodrome. The name comes from combining two concepts:

* **ve** (vote escrow): Lock tokens to gain voting power, similar to Curve Finance
* **(3,3)**: Game theory notation meaning "everyone benefits most when all participants cooperate" (lock rather than sell)

Here's how the cycle works:

```
Lock PHSR → Receive veNFT → Vote on pools → Earn trading fees
      ↑                                              |
      └──────── PHSR emissions reward LPs ←──────────┘
```

**In plain terms:**

* You lock PHSR to get a vote-escrowed NFT (veNFT)
* You vote on which liquidity pools should receive PHSR emissions
* In exchange for voting, you earn trading fees from the pools you voted for
* LPs who stake in those pools earn the PHSR emissions
* Everyone benefits: voters earn fees, LPs earn PHSR, traders get deep liquidity

## Emissions Schedule

PHSR tokens are emitted weekly to reward liquidity providers who stake in gauges.

| Parameter                | Value                                            |
| ------------------------ | ------------------------------------------------ |
| Starting weekly emission | 15,000,000 PHSR                                  |
| Weekly decay             | 1% (emissions decrease by 1% each week)          |
| Team allocation          | 5% of weekly emissions                           |
| Tail emissions           | Activated when weekly drops below 6,000,000 PHSR |

### How Emissions Decay

Each week, total emissions decrease by 1% from the previous week:

| Week     | Weekly Emission |
| -------- | --------------- |
| Week 1   | 15,000,000      |
| Week 10  | \~13,600,000    |
| Week 26  | \~11,600,000    |
| Week 52  | \~8,950,000     |
| Week 104 | \~5,340,000     |

This gradual decay ensures early participants are well-rewarded while maintaining long-term sustainability.

### Where Emissions Go

Each week's emissions are split across all active gauges based on how vePHSR holders voted:

* Pools with more votes receive more emissions
* Emissions flow to the gauge, where staked LPs can claim them
* 5% of each week's emissions go to the team

## Rebases (Anti-Dilution)

As new PHSR is emitted each week, existing holders could be diluted. Rebases prevent this.

vePHSR holders receive additional PHSR proportional to the ratio of locked supply to total supply. The more PHSR that is locked, the higher the rebase for lockers.

> **Simple example:** If 50% of all PHSR is locked as vePHSR, lockers receive a rebase that offsets roughly half the dilution from new emissions. If 90% is locked, they offset nearly all of it.

This means long-term lockers are protected from dilution — another reason locking is the optimal strategy.

## Epochs

The Phasor protocol operates on a weekly cycle called an **epoch**.

| Event                 | Timing             |
| --------------------- | ------------------ |
| Epoch flip            | Thursday 00:00 UTC |
| Emissions distributed | After epoch flip   |
| Votes reset           | Each new epoch     |
| Fee claims available  | After epoch flip   |

At the start of each new epoch:

1. Votes from the previous epoch are tallied
2. PHSR emissions are distributed to gauges
3. Trading fees are distributed to voters
4. Rebase tokens are distributed to vePHSR holders

***

**Next:** [vePHSR & Voting](voting-escrow.md) | [Staking Rewards](staking.md)
