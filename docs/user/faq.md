# FAQ

## General

**What blockchain is Phasor on?**
Monad (currently testnet, chain ID 10143). Monad is a high-performance EVM-compatible blockchain with fast transactions and low gas fees.

**Is Phasor a Uniswap fork?**
No. Phasor is built on Velodrome V2, which itself evolved from Solidly (originally by Andre Cronje). It uses a ve(3,3) tokenomics model that goes beyond Uniswap's simple AMM design — adding voting, emissions, and aligned incentives.

**What wallets does Phasor support?**
MetaMask and any WalletConnect-compatible wallet. See the [Getting Started](getting-started.md) guide for setup instructions.

---

## Swapping

**What are the trading fees?**
- **0.30%** for volatile pools (standard token pairs)
- **0.05%** for stable pools (pegged assets like USDC/USDT)

Fees are distributed to vePHASOR holders who voted for that pool's gauge. [Learn more →](tokenomics.md)

**Why did my swap fail?**
Common causes:
- Price moved beyond your slippage tolerance — try increasing it slightly
- Insufficient MON for gas fees
- Token approval not yet confirmed — wait and retry
- The token may require special handling (fee-on-transfer tokens)

**How does the router choose a swap route?**
The router automatically evaluates all available paths through both volatile and stable pools, finding the route that gives you the best output amount after fees.

---

## Liquidity

**What is the difference between stable and volatile pools?**
- **Volatile pools** use the standard x × y = k formula with a 0.30% fee. Best for tokens with uncorrelated prices.
- **Stable pools** use a StableSwap curve optimized for tokens that trade near 1:1, with a 0.05% fee and much lower slippage.

[Learn more →](pools.md)

**What is impermanent loss?**
When token prices change after you've added liquidity, your position may be worth less than if you simply held the tokens. The larger the price divergence, the greater the loss. Stable pools have minimal impermanent loss for pegged assets. See the [detailed explanation](liquidity.md).

**Where do trading fees go?**
Trading fees go to vePHASOR holders who voted for that pool's gauge — not directly to LPs. LPs earn PHASOR emission rewards by staking their LP tokens in gauges instead.

---

## Staking

**How does the time multiplier work?**
When you stake LP tokens in a gauge, your reward multiplier starts at 1x and grows linearly to 3x over 90 days of continuous staking. This is a Phasor-exclusive feature. See the [full multiplier schedule](staking.md).

**Does claiming rewards reset my multiplier?**
No. Claiming PHASOR rewards does not affect your time multiplier. You can claim freely.

**Does withdrawing reset my multiplier?**
Yes. Unstaking your LP tokens resets your multiplier back to 1x. If you re-stake, the 90-day clock starts over.

**Which pools have the highest rewards?**
Pools that receive the most vePHASOR votes get the largest share of weekly PHASOR emissions. Check the Staking page for current APRs.

---

## vePHASOR & Voting

**What is the maximum lock duration?**
4 years. This gives you the maximum voting power per PHASOR locked. You can also choose a permanent lock, which maintains full voting power indefinitely.

**Can I unlock early?**
No. Locks are fixed-duration and cannot be broken early. Choose a lock period you're comfortable with. Permanent locks can be converted back to standard locks, after which the normal countdown begins.

**What are rebases?**
Extra PHASOR distributed to vePHASOR holders each epoch, proportional to the ratio of locked PHASOR to total supply. Rebases protect lockers from dilution caused by weekly emissions. [Learn more →](tokenomics.md)

**Do I need to vote every epoch?**
Your previous vote carries over if you don't change it, but actively reviewing and adjusting your votes each epoch ensures you're directing emissions to the most productive pools.

---

## Launchpad

**Why do I need vePHASOR to participate in launches?**
Ve-gating ensures that launch participants are committed members of the Phasor ecosystem. It reduces bot activity, prevents sniping, and aligns the interests of new token buyers with the broader community. [Learn more →](launchpad.md)

**What happens if a sale doesn't reach its soft cap?**
You can claim a full refund of your contribution. No tokens are distributed, and no liquidity pool is created.

**Where does the liquidity go after a successful launch?**
50% of the sale tokens and matching base tokens are added as liquidity to a new volatile pool on Phasor DEX. The LP tokens are staked in an auto-created gauge, and gauge receipts are sent to a locker for vesting. This ensures the liquidity can't be immediately pulled.

**Can I trade the new token right after a launch?**
Yes. Once a sale is finalized, a trading pool exists on Phasor DEX and anyone can swap the token immediately.
