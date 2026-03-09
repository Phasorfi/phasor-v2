# Creating a Launch

## Overview

Project teams can use the Phasor Launchpad to conduct transparent, on-chain token sales. After a successful sale, liquidity is automatically created and staked — no manual setup required.

## Requirements

Before creating a launch, you need:

- An **ERC-20 token** to sell
- A **base token** for payment (USDC, WMON, or another supported token)
- Sufficient token supply to cover both the sale allocation and liquidity creation (tokens are split 50/50)

## Sale Parameters

When creating a sale, you configure the following:

| Parameter | Description |
|-----------|-------------|
| **Token** | Your project's ERC-20 token address |
| **Base Token** | Payment token (USDC, WMON, etc.) |
| **Token Amount** | Total tokens to allocate (split between sale + liquidity) |
| **Price** | Fixed price per token in base token units |
| **Soft Cap** | Minimum raise required for the sale to succeed |
| **Hard Cap** | Maximum raise allowed |
| **Start Time** | When contributions open |
| **End Time** | When contributions close |

## How It Works

1. **Approve** your token for transfer to the launcher contract
2. **Create the sale** with your parameters — tokens are transferred to the contract and held in escrow
3. **Sale runs** for the specified period — vePHASOR holders contribute base tokens
4. **After end time**, call `finalizeAndLaunch` if the soft cap was reached

## What Happens at Finalization

When you finalize a successful sale, the contract automatically:

1. Allocates **50% of tokens** to sale contributors (proportional to their contribution)
2. Pairs the remaining **50% of tokens** with matching base tokens to create a **volatile liquidity pool** on Phasor DEX
3. Creates a **gauge** for the new pool so LPs can earn PHASOR rewards
4. Stakes the LP tokens in the gauge and sends receipt tokens to the protocol **locker** for vesting
5. Sends any remaining base tokens (after liquidity creation) to the project team

> The liquidity is locked — it cannot be immediately withdrawn. This protects buyers and builds trust.

## Token Distribution Example

A project creates a sale with 1,000,000 tokens at $0.10 per token, with a hard cap of $50,000:

| Allocation | Tokens | Value |
|------------|--------|-------|
| Sale contributors | 500,000 | Proportional to contribution |
| Liquidity pool | 500,000 + $50,000 USDC | Locked via locker |

Contributors who put in $100 would receive: ($100 / $50,000) × 500,000 = **1,000 tokens**

## Cancellation

The sale owner can cancel before finalization:
- All contributed funds become refundable to participants
- Unsold tokens are returned to the project team
- No liquidity pool is created

## Important Notes

- **Ve-gating** is enabled by default — only vePHASOR holders can participate in your sale
- Liquidity is created as a **volatile pool** (x × y = k)
- The **locker address** holds gauge receipt tokens for protocol-level vesting of the liquidity
- Sale parameters cannot be changed after creation
- The sale creator must call `finalizeAndLaunch` after the sale ends — it does not happen automatically

## Need Help?

If you're a project looking to launch on Phasor, reach out to the team via Discord for guidance on setting up your sale parameters.

<!-- TODO: Add Discord link -->

---

**Next:** [Fair Launch Overview](launchpad.md) | [Contracts & Security](contracts.md)
