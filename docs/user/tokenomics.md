# PHASOR Token

## What is PHASOR?

PHASOR is the native token of the Phasor DEX ecosystem. It serves three core purposes:

1. **Governance** — Lock PHASOR to receive voting power over protocol emissions
2. **Rewards** — Distributed to liquidity providers who stake LP tokens in gauges
3. **Alignment** — The ve(3,3) model ensures that the protocol rewards participants who commit long-term

PHASOR is not just a reward token — it's the mechanism that coordinates the entire ecosystem.

## The ve(3,3) Model

Phasor uses a **ve(3,3) tokenomics model**, originally pioneered by Solidly and refined by Velodrome. The name comes from combining two concepts:

- **ve** (vote escrow): Lock tokens to gain voting power, similar to Curve Finance
- **(3,3)**: Game theory notation meaning "everyone benefits most when all participants cooperate" (lock rather than sell)

Here's how the cycle works:

```
Lock PHASOR → Receive veNFT → Vote on pools → Earn trading fees
      ↑                                              |
      └──────── PHASOR emissions reward LPs ←────────┘
```

**In plain terms:**
- You lock PHASOR to get a vote-escrowed NFT (veNFT)
- You vote on which liquidity pools should receive PHASOR emissions
- In exchange for voting, you earn trading fees from the pools you voted for
- LPs who stake in those pools earn the PHASOR emissions
- Everyone benefits: voters earn fees, LPs earn PHASOR, traders get deep liquidity

## Emissions Schedule

PHASOR tokens are emitted weekly to reward liquidity providers who stake in gauges.

| Parameter | Value |
|-----------|-------|
| Starting weekly emission | 15,000,000 PHASOR |
| Weekly decay | 1% (emissions decrease by 1% each week) |
| Team allocation | 5% of weekly emissions |
| Tail emissions | Activated when weekly drops below 6,000,000 PHASOR |

### How Emissions Decay

Each week, total emissions decrease by 1% from the previous week:

| Week | Weekly Emission |
|------|----------------|
| Week 1 | 15,000,000 |
| Week 10 | ~13,600,000 |
| Week 26 | ~11,600,000 |
| Week 52 | ~8,950,000 |
| Week 104 | ~5,340,000 |

This gradual decay ensures early participants are well-rewarded while maintaining long-term sustainability.

### Where Emissions Go

Each week's emissions are split across all active gauges based on how vePHASOR holders voted:

- Pools with more votes receive more emissions
- Emissions flow to the gauge, where staked LPs can claim them
- 5% of each week's emissions go to the team

## Rebases (Anti-Dilution)

As new PHASOR is emitted each week, existing holders could be diluted. Rebases prevent this.

vePHASOR holders receive additional PHASOR proportional to the ratio of locked supply to total supply. The more PHASOR that is locked, the higher the rebase for lockers.

> **Simple example:** If 50% of all PHASOR is locked as vePHASOR, lockers receive a rebase that offsets roughly half the dilution from new emissions. If 90% is locked, they offset nearly all of it.

This means long-term lockers are protected from dilution — another reason locking is the optimal strategy.

## Epochs

The Phasor protocol operates on a weekly cycle called an **epoch**.

| Event | Timing |
|-------|--------|
| Epoch flip | Thursday 00:00 UTC |
| Emissions distributed | After epoch flip |
| Votes reset | Each new epoch |
| Fee claims available | After epoch flip |

At the start of each new epoch:
1. Votes from the previous epoch are tallied
2. PHASOR emissions are distributed to gauges
3. Trading fees are distributed to voters
4. Rebase tokens are distributed to vePHASOR holders

---

**Next:** [vePHASOR & Voting](voting-escrow.md) | [Staking Rewards](staking.md)
