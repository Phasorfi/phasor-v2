# Fair Launch

## What is the Phasor Launchpad?

The Phasor Launchpad is a platform for new projects to conduct transparent, on-chain token sales. It provides a simple, fair mechanism for distributing tokens and bootstrapping liquidity — all in a single, trustless process.

What makes Phasor's launchpad different:

- **Fixed-rate pricing** — No complex auction mechanics. One price, first-come-first-served up to the hard cap.
- **Ve-gated participation** — Only vePHASOR holders can contribute, ensuring genuine community participation.
- **Automatic liquidity** — After a successful sale, liquidity is created and staked automatically. No manual steps needed.

## Why Ve-Gating?

Most launchpads are plagued by bots, snipers, and mercenary capital. Phasor takes a different approach.

To participate in any launch, you must hold a **veNFT** — which means you've locked PHASOR tokens in the protocol. This requirement serves several purposes:

- **Skin in the game** — Participants are invested in the Phasor ecosystem, not just hunting short-term profits
- **Bot resistance** — Bots can't easily acquire veNFTs, making launches fairer for real users
- **Aligned incentives** — Sale participants are also governance participants who care about the protocol's long-term health
- **Community-first** — New projects launch to an engaged, active user base rather than anonymous wallets

> **To get started:** You need a veNFT. [Learn how to lock PHASOR →](voting-escrow.md)

## How a Launch Works

Every launch follows the same lifecycle:

### 1. Announced
A project creates a sale with a fixed token price, soft cap, hard cap, and a time window. The sale tokens are deposited into the launcher contract.

### 2. Active
During the sale window, vePHASOR holders can contribute base tokens (USDC, WMON, etc.) up to the hard cap. Contributions are tracked per user.

### 3. Ended
When the sale window closes, no more contributions are accepted.

### 4. Finalized
If the soft cap was reached, the project team finalizes the sale. This triggers an automated sequence:

1. **50% of tokens** are allocated to sale contributors (proportional to contribution)
2. **50% of tokens** + matching base tokens are added as liquidity to a new Phasor pool
3. A **gauge is auto-created** for the new pool
4. LP tokens are **staked in the gauge** and receipt tokens sent to a locker for vesting

This means the new token immediately has a live trading pool and gauge on Phasor DEX.

### 5. Claim
Contributors claim their token allocation on the launch detail page.

### 6. Refund
If the soft cap was not reached, or if the sale was cancelled, contributors can claim a **full refund** of their contribution.

## Participating in a Launch

### Prerequisites
- A wallet connected to Phasor DEX ([setup guide](getting-started.md))
- A veNFT (locked PHASOR tokens) — [How to lock](voting-escrow.md)
- Base tokens to contribute (USDC, WMON, etc.)

### Step-by-Step

1. Navigate to the **Launchpad** page
2. Browse active launches — each card shows the token, price, progress, and time remaining
3. Click a launch to view full details
4. Enter your contribution amount in the base token
5. Click **Approve** (first time only for that base token)
6. Click **Contribute** and confirm the transaction

Your contribution is now recorded on-chain. You can view your position on the launch detail page.

## Key Terms

| Term | Meaning |
|------|---------|
| **Soft Cap** | Minimum total raise for the sale to succeed. If not reached, all contributions are refunded. |
| **Hard Cap** | Maximum total raise allowed. Once reached, no more contributions are accepted. |
| **Base Token** | The token you pay with (e.g., USDC, WMON) |
| **Ve-gating** | The requirement to hold a vePHASOR NFT in order to participate |
| **Finalization** | The process of creating liquidity and distributing tokens after a successful sale |

## After the Sale

**If successful:**
- Claim your tokens on the launch detail page after finalization
- The new token has a live pool on Phasor DEX — you can trade it immediately
- A gauge exists for the pool — LPs can stake and earn PHASOR rewards
- The project's liquidity is locked via the locker, ensuring it can't be immediately pulled

**If unsuccessful (below soft cap or cancelled):**
- Claim a full refund of your contribution
- No tokens are distributed
- The project team receives their unsold tokens back

---

**Next:** [Creating a Launch](creating-a-launch.md) | [vePHASOR & Voting](voting-escrow.md)
