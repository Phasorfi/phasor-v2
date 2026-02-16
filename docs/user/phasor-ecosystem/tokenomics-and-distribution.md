# Tokenomics & Distribution

### Token Overview

| Parameter             | Value                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| Token Name            | PHSR                                                                           |
| Token Type            | ERC-20 (Mintable, controlled by Minter contract)                               |
| Locked Version        | vePHSR (veNFT — ERC-721)                                                       |
| Chain                 | Monad                                                                          |
| Initial Supply at TGE | \[PLACEHOLDER — Suggested: 1,000,000,000 PHSR]                                 |
| Supply Hard Cap       | None — PHSR is inflationary by design (weekly emissions, decaying 1% per week) |
| Contract Address      | [Contracts & Security](../contracts.md)                                        |

PHSR is the native governance and rewards token of the Phasor ecosystem. It serves three core purposes: governance (lock to vote on emissions), rewards (distributed to LPs who stake), and alignment (the ve(3,3) model rewards long-term commitment over short-term extraction).

PHSR is mintable. New tokens are minted weekly through emissions (rewarding LPs) and rebases (protecting vePHSR holders from dilution). Emission decay and the rebase mechanism ensure inflation slows over time and long-term lockers are not diluted.

### Initial Distribution

| Allocation                     | % of Total Supply                 | Tokens | Vesting                                                                      |
| ------------------------------ | --------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Community & Ecosystem          | \[PLACEHOLDER — Suggested: 40%]   | \[TBD] | Distributed via emissions over time                                          |
| Liquidity Bootstrap            | \[PLACEHOLDER — Suggested: 7.5%]  | \[TBD] | 100% unlocked at TGE                                                         |
| Marketing & Growth             | \[PLACEHOLDER — Suggested: 10%]   | \[TBD] | 20% unlocked at TGE, 80% released over 12 months                             |
| Team & Contributors            | \[PLACEHOLDER — Suggested: 12.5%] | \[TBD] | 6-month cliff, then 12-month linear vest                                     |
| Treasury (Protocol Reserve)    | \[PLACEHOLDER — Suggested: 5%]    | \[TBD] | 6-month cliff, governed by multisig                                          |
| Early Supporters               | \[PLACEHOLDER — Suggested: 10%]   | \[TBD] | 25% unlocked at TGE, 3-month cliff, then 6-month linear vest                 |
| Public Round                   | \[PLACEHOLDER — Suggested: 10%]   | \[TBD] | 100% unlocked at TGE                                                         |
| Airdrop / Community Incentives | \[PLACEHOLDER — Suggested: 5%]    | \[TBD] | Unlocked at TGE (distributed based on testnet & early mainnet participation) |

> **Note:** The community & ecosystem allocation is the largest share by design. The majority of PHSR enters circulation through emissions — rewarding active participants, not passive holders.

### Vesting Schedules

#### Team & Contributors

* **Cliff:** 6 months — no tokens unlock before this period
* **Vest:** 12 months linear after cliff
* **Total lock:** 18 months from TGE

#### Early Supporters

* **TGE unlock:** 25% — available immediately so early supporters can participate in the ecosystem (provide liquidity, lock vePHSR, vote)
* **Cliff:** 3 months after TGE
* **Vest:** 6 months linear after cliff
* **Total duration:** \~9 months from TGE
* **Rationale:** Immediate ecosystem participation + long enough cliff to demonstrate commitment, manageable vest to reward early conviction

#### Public Round

* **Unlock:** 100% at TGE
* **Rationale:** Public participants receive full liquidity in exchange for taking on launch-day price risk

#### Marketing & Growth

* **TGE unlock:** 20% — available immediately for launch campaigns and initial partnerships
* **Remaining 80%:** Released linearly over 12 months
* **Usage:** Community campaigns, partnerships, exchange listings, awareness initiatives, ongoing growth efforts
* **Rationale:** Lean launch budget with sustained runway for ongoing marketing as the protocol scales

#### Airdrop / Community Incentives

* **Unlock:** 100% at TGE
* **Usage:** Rewarding testnet participants, early mainnet users, and ecosystem contributors
* **Rationale:** Distributes tokens to active users who helped bootstrap the protocol

#### Treasury (Protocol Reserve)

* **Cliff:** 6 months — cannot be touched before this period
* **Controlled by:** Multisig (transitioning to DAO governance)
* **Usage:** Bug bounties, security audits, emergency reserves, future DAO seed
* **Spending:** Subject to governance approval as the protocol decentralizes

### Emissions Schedule

PHSR tokens are emitted weekly to reward liquidity providers who stake LP tokens in gauges.

| Parameter                | Value                                            |
| ------------------------ | ------------------------------------------------ |
| Starting weekly emission | 15,000,000 PHSR                                  |
| Weekly decay             | 1% (emissions decrease by 1% each week)          |
| Team allocation          | 5% of weekly emissions                           |
| Tail emissions           | Activated when weekly drops below 6,000,000 PHSR |

#### Emissions Decay

| Week     | Weekly Emission |
| -------- | --------------- |
| Week 1   | 15,000,000      |
| Week 10  | \~13,600,000    |
| Week 26  | \~11,600,000    |
| Week 52  | \~8,950,000     |
| Week 104 | \~5,340,000     |

This gradual decay ensures early participants are well-rewarded while maintaining long-term sustainability. As emissions decrease, the protocol becomes increasingly reliant on trading fees — creating a natural transition to sustainable, real yield.

#### Where Emissions Go

Each week's emissions are split across all active gauges based on how vePHSR holders voted:

* Pools with more votes receive more emissions
* Emissions flow to the gauge, where staked LPs can claim them
* 5% of each week's emissions go to the team

#### Rebases (Anti-Dilution)

vePHSR holders receive additional PHSR each epoch proportional to the ratio of locked supply to total supply. The more PHSR that is locked, the higher the rebase for lockers.

**Example:** If 50% of all PHSR is locked as vePHSR, lockers receive a rebase that offsets roughly half the dilution from new emissions. If 90% is locked, they offset nearly all of it.

This means long-term lockers are protected from dilution — another reason locking is the optimal strategy.

### Token Utility Summary

#### PHSR

* Stake LP tokens in gauges → earn PHSR emissions
* Lock PHSR → create vePHSR
* Trade freely on Phasor DEX and other markets

#### vePHSR (Locked PHSR)

* **Vote** on which pools receive emissions each epoch
* **Earn trading fees** from pools you voted for
* **Rebase protection** against dilution from emissions
* **Launchpad access** — only vePHSR holders can participate in token launches

The dual-token design creates a clear incentive: the more you participate and commit, the more value you capture from the protocol's growth.

### Epochs

The protocol operates on a weekly cycle:

| Event                 | Timing             |
| --------------------- | ------------------ |
| Epoch flip            | Thursday 00:00 UTC |
| Emissions distributed | After epoch flip   |
| Votes tallied         | Each new epoch     |
| Fee claims available  | After epoch flip   |
| Rebases distributed   | After epoch flip   |
