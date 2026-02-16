# Bribes & Vote Incentives

### What Are Bribes?

Bribes (also called vote incentives) are rewards that projects deposit to encourage vePHSR holders to vote for their pool's gauge. When a pool receives more votes, it gets a larger share of weekly PHSR emissions — which attracts more liquidity providers, deepens liquidity, and improves trading for that token.

In simple terms: projects pay vePHSR voters to direct emissions toward their pools.

This is a core feature of the ve(3,3) model and one of the primary revenue streams for vePHSR holders.

### How Bribes Work

#### The Flow

1. A project deposits bribe tokens (any ERC-20) into a pool's bribe contract
2. vePHSR holders see the available bribes when deciding where to vote
3. Voters who allocate votes to that pool earn a proportional share of the bribes
4. Bribes are distributed at the end of each epoch alongside trading fees

#### Who Can Add Bribes?

Anyone. Bribes are permissionless — any wallet can deposit incentives for any gauge. In practice, bribes are most commonly added by:

* **Projects** wanting deeper liquidity for their token pairs
* **DAOs and treasuries** looking to bootstrap trading activity
* **Protocols** seeking to attract LPs to strategic pools

#### What Tokens Can Be Used?

Any ERC-20 token can be deposited as a bribe. Common choices include stablecoins (USDC), the project's own token, or PHSR itself.

### Why Bribes Matter

#### For Projects

Bribes are the most capital-efficient way to bootstrap liquidity on Phasor. Instead of running a separate liquidity mining program, projects can deposit incentives directly into the Phasor gauge system — leveraging the existing flywheel of voters, emissions, and LPs.

**Example:** A project deposits $10,000 in bribes for its TOKEN/WMON pool. vePHSR voters direct emissions to that pool. LPs stake there to earn PHSR rewards. The pool deepens, trading improves, and the project gets sustainable liquidity without managing its own farm.

#### For vePHSR Holders

Bribes are a direct income stream on top of trading fees and rebases. The more protocols that compete for votes, the more valuable your vePHSR position becomes.

**Your earnings as a vePHSR voter:**

* Trading fees from pools you voted for
* Bribe rewards from projects incentivizing those pools
* Rebase protection against dilution

#### For the Ecosystem

Bribes create a competitive marketplace for liquidity. Pools that generate value (volume, fees, bribes) attract votes, which attract LPs, which deepen liquidity — reinforcing the flywheel.

### How to Earn Bribes (For Voters)

1. Lock PHSR to receive a veNFT (vePHSR)
2. Go to the **Governance** page
3. Review available gauges — pools with active bribes will display the bribe amounts and tokens
4. Allocate your voting power to pools with bribes (and/or high trading volume)
5. After the epoch flips (Thursday 00:00 UTC), claim your share of bribes

Your bribe share is proportional to your voting power relative to the total votes that pool received.

**Example:**

* Pool X has $5,000 in USDC bribes this epoch
* Total votes for Pool X: 100,000 vePHSR
* Your votes for Pool X: 10,000 vePHSR (10%)
* Your bribe earnings: $500 USDC

### How to Add Bribes (For Projects)

> Detailed step-by-step instructions will be available when bribes go live.

#### Overview

1. Navigate to the **Governance** page
2. Find the gauge for your pool (or create a pool first if one doesn't exist)
3. Click **Add Incentive** on the gauge
4. Select the bribe token (any ERC-20)
5. Enter the amount to deposit
6. Approve the token and confirm the transaction

Bribes deposited during an epoch are distributed to voters at the end of that epoch. You can add bribes at any point during the epoch.

#### Best Practices for Projects

* **Consistency matters** — Regular weekly bribes attract more reliable voting support than one-off deposits
* **Pair with a launch** — If you're using the Phasor Launchpad, adding bribes for your pool immediately after launch helps bootstrap early liquidity
* **Use stablecoins for clarity** — While any ERC-20 works, stablecoin bribes make it easy for voters to calculate their expected returns
* **Monitor efficiency** — Track how much liquidity your bribes attract relative to cost. The Phasor dashboard will show bribe-to-TVL ratios

### Bribes vs. Traditional Liquidity Mining

|                           | Bribes (Phasor)                                 | Traditional Farm                                |
| ------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| **Who manages it?**       | Phasor protocol                                 | The project itself                              |
| **Infrastructure needed** | None — deposit and go                           | Deploy contracts, build UI, manage rewards      |
| **Liquidity stickiness**  | High — LPs earn PHSR + time multiplier          | Low — mercenary capital leaves when rewards end |
| **Capital efficiency**    | $1 in bribes can attract multiples in liquidity | $1 in rewards attracts \~$1 in liquidity        |
| **Composability**         | Plugs into the full Phasor flywheel             | Isolated from broader ecosystem                 |

### FAQ

**Can I bribe for a pool that doesn't have a gauge yet?** No. The pool must exist and have an active gauge. If you've launched a token through the Phasor Launchpad, a gauge is created automatically.

**When are bribes distributed?** At the start of each new epoch (Thursday 00:00 UTC), alongside trading fees.

**Can I withdraw bribes after depositing them?** No. Once deposited, bribes are committed for that epoch and will be distributed to voters.

**Is there a minimum bribe amount?** No minimum. However, very small bribes may not attract meaningful votes.

