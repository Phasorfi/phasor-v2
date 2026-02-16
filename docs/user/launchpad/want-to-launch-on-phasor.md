---
description: >-
  Phasor gives projects everything they need to go from token to tradeable asset
  in a single flow — a fair token sale, automatic liquidity creation, gauge
  emissions, and an engaged community of buyers.
---

# Want to Launch on Phasor?

### What Phasor Offers Projects

#### 1. Permissionless Launchpad

Run a transparent, on-chain token sale. No intermediaries, no complex auction mechanics. Fixed-price sales with soft cap / hard cap logic, built-in refunds if the sale doesn't succeed, and ve-gated participation that ensures your buyers are real, committed community members — not bots.

#### 2. Automatic Liquidity

After a successful sale, Phasor automatically:

* Creates a trading pool for your token
* Adds liquidity using 50% of sale tokens + raised funds
* Creates a gauge so LPs can earn PHSR emissions
* Locks the liquidity via the protocol locker

Your token is tradeable on Phasor DEX immediately after finalization. No manual LP setup needed.

#### 3. Gauge Emissions

Your pool automatically receives a gauge. vePHSR voters can direct PHSR emissions to your pool, attracting LPs and deepening liquidity over time. The more productive your pool (volume, fees), the more votes it naturally attracts.

#### 4. Bribes

Want to accelerate liquidity growth? Deposit bribe tokens to incentivize vePHSR voters to vote for your pool's gauge. This is the most capital-efficient way to bootstrap deep liquidity on Phasor — far cheaper than running your own liquidity mining program.

#### 5. Engaged Buyer Base

Because launches are ve-gated, your sale participants are vePHSR holders — people who have locked tokens in the protocol and are actively involved in the Phasor ecosystem. These aren't anonymous wallets or sniper bots. They're committed DeFi users.

### How It Works

#### Step 1: Prepare Your Token

* Deploy a standard ERC-20 token on Monad
* Ensure you have enough supply to cover both the sale allocation and liquidity (tokens are split 50/50 between buyers and LP creation)

#### Step 2: Create a Sale

The launchpad is fully permissionless. Any project can create a sale by:

1. Navigating to the Launchpad page
2. Configuring sale parameters (token, price, caps, timing)
3. Depositing your tokens into the launcher contract

See the full \[Creating a Launch →] guide for step-by-step instructions.

#### Step 3: Sale Runs

During the sale window, vePHSR holders contribute base tokens (USDC, WMON, etc.). Contributions are tracked on-chain and visible to everyone.

#### Step 4: Finalize

After the sale ends, call `finalizeAndLaunch`. The contract automatically:

* Distributes tokens to buyers
* Creates the liquidity pool
* Sets up the gauge
* Locks the LP tokens

#### Step 5: Grow Your Liquidity

Post-launch, you can deepen your pool's liquidity by:

* Adding bribes to attract vePHSR votes
* Encouraging your community to provide liquidity and stake in the gauge
* Building trading volume (which generates fees and naturally attracts voters)

### Co-Marketing & Partnership Opportunities

While the launchpad is fully permissionless, projects looking for additional support can work with the Phasor team on:

* **Co-marketed launches** — Joint announcements, featured placement, and community cross-promotion
* **Strategic bribe coordination** — Guidance on optimal bribe strategies and timing
* **Custom gauge incentives** — Coordinated emission strategies for key pools
* **Community introductions** — Access to the Phasor community of active DeFi participants and vePHSR holders
* **Technical support** — Help with token configuration, sale parameter optimization, and launch execution

### Launch Checklist

Before creating your sale, make sure you have:

* \[ ] ERC-20 token deployed on Monad
* \[ ] Token supply allocated for sale + liquidity (50/50 split)
* \[ ] Base token decided (USDC, WMON, etc.)
* \[ ] Pricing set (fixed price per token)
* \[ ] Soft cap and hard cap defined
* \[ ] Sale window (start and end times) planned
* \[ ] Post-launch liquidity strategy considered (bribes, community LP incentives)
* \[ ] Project branding and information ready for the sale listing

### Frequently Asked Questions

**Do I need permission to launch on Phasor?** No. The launchpad is fully permissionless. Any project can create a sale at any time.

**What does it cost to launch?** Only gas fees for creating the sale. Phasor does not charge a platform fee for launches. \[PLACEHOLDER — confirm if there's a protocol fee on launches]

**What base tokens can I accept?** USDC, WMON, or any other supported ERC-20 token on Monad.

**What happens if my sale doesn't reach the soft cap?** All contributions are fully refundable. Your unsold tokens are returned. No liquidity pool is created.

**Can I cancel a sale after creating it?** Yes, the sale owner can cancel before finalization. All contributed funds become refundable.

**How do I get my pool to attract more liquidity after launch?** The most effective approach is adding bribes to your gauge. This incentivizes vePHSR voters to direct emissions toward your pool, which attracts LPs. You can also encourage your community to provide liquidity and stake in the gauge to earn PHSR rewards with the time multiplier.

**Can I change sale parameters after creation?** No. Parameters are locked once the sale is created. Plan carefully.

### Get in Touch

Want to discuss a co-marketed launch, explore partnership opportunities, or get guidance on your launch strategy?

**Open a ticket in our Discord via** [**Links & Socials**](../get-in-touch/links-and-socials.md)

The Phasor team is available to help projects plan and execute successful launches on Monad.



**Ready to launch?** [Read the Full Launchpad Docs](../launchpad.md) | [Create a Sale](../creating-a-launch.md) | [Reach out](../get-in-touch/links-and-socials.md)
