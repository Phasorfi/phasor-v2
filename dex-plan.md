Phasor DEX 2-Week MVP Sprint: Farming Launch
Executive Summary
Timeline: 2 weeks (14 days)
Solo Engineer: You
Priority: Ship farming with PHASOR rewards to drive TVL growth
Strategy: Fork battle-tested code, minimal custom logic, iterate post-launch

Week 1: Smart Contracts
Day 1-2: PHASOR token (OpenZeppelin fork) + tests
Day 3-5: MasterChef V2 (SushiSwap fork) + tests
Day 6-7: Deploy to testnet, configure Safe multisig, test flows
Week 2: Frontend + Launch
Day 8-10: Build /farms page + hooks (copy existing patterns)
Day 11-12: Merkle airdrop UI, integration testing
Day 13: Deploy mainnet, seed liquidity, enable farms
Day 14: Monitor, fix bugs, announce launch
Post-MVP Roadmap: Staking (xPHASOR) in week 3-4, Launchpad in week 5-6

1. PHASOR Token Design (Simplified for 2-Week MVP)
Token Specification
Name: Phasor Token
Symbol: PHASOR
Total Supply: 1,000,000,000 PHASOR (1 billion, fixed supply)
Decimals: 18
Base Contract: OpenZeppelin ERC20 + ERC20Permit + Ownable
NOT MINTABLE: Fixed supply to avoid security risk (can add minting later if needed)
MVP Token Distribution (Simplified)

Total: 1,000,000,000 PHASOR (minted once at deployment)

├─ Safe Multisig (Treasury): 450M (45%) - Team, advisors, partnerships
├─ MasterChef (Farming): 400M (40%) - 4-year emissions
├─ Airdrop Contract: 100M (10%) - Early LP rewards (merkle)
└─ Initial DEX Liquidity: 50M (5%) - WMON-PHASOR pair
Rationale:

No vesting contracts (add later) - saves 3-4 days of dev time
Safe controls treasury - manual distributions OK for MVP
Merkle airdrop instead of claiming UI (gas efficient, proven)
Fixed supply = no minting governance needed yet
Emission Schedule (MVP)

400M PHASOR over 4 years from MasterChef
Constant rate: ~274K PHASOR/day (~11.4K/hour)

Simplification: Linear emission (no decay)
- Easier to reason about
- Can adjust via pool allocations
- MasterChef.setRewardPerBlock() if needed (Safe only)
Smart Contract Required
PhasorToken.sol (Copy OpenZeppelin)


// Location: packages/core/contracts/PhasorToken.sol
// Base: OpenZeppelin v4.9.0 or v5.0.0
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PhasorToken is ERC20, ERC20Permit, Ownable {
    constructor(
        address initialOwner
    ) ERC20("Phasor Token", "PHASOR") ERC20Permit("Phasor Token") Ownable(initialOwner) {
        // Mint total supply to owner (will be your Safe)
        _mint(initialOwner, 1_000_000_000 * 10**18);
    }

    // No mint function = fixed supply
    // Owner = Safe multisig for potential future upgrades
}
Time to implement: 1 hour (it's literally OpenZeppelin copy-paste)
Testing: 2 hours (basic transfer, permit, allowance tests)
Security: Battle-tested OZ code, minimal risk

2. Yield Farming (MasterChef v2 - Fork with Minimal Changes)
Battle-Tested Source
Fork: SushiSwap MasterChef V2
Repo: https://github.com/sushiswap/sushiswap/blob/master/protocols/masterchef/contracts/MasterChefV2.sol
Audits: Multiple (Quantstamp, PeckShield)
Changes: Minimal - just constructor params and owner functions

Why MasterChef V2 (not V1)?
V2 has better accounting (no reentrancy issues)
Supports complex rewarders (for future dual rewards)
More flexible pool management
Used by Sushi, Trader Joe, PancakeSwap V2
Smart Contract (Copy SushiSwap)
MasterChef.sol


// Location: packages/core/contracts/MasterChef.sol
// Base: SushiSwap MasterChef V2 (99% copy, 1% customization)

// CHANGES FROM SUSHI:
// 1. Constructor takes Safe address as owner
// 2. PHASOR token address instead of SUSHI
// 3. Remove SUSHI-specific rewarder logic (add later)
// 4. Add Pausable from OpenZeppelin (emergency stop)

// KEY STATE:
struct PoolInfo {
    uint128 accRewardPerShare; // Accumulated rewards per share
    uint64 lastRewardBlock;    // Last block rewards calculated
    uint64 allocPoint;         // Pool weight (share of emissions)
}

struct UserInfo {
    uint256 amount;     // LP tokens staked
    int256 rewardDebt;  // Rewards already accounted for
}

// SAFE-CONTROLLED FUNCTIONS (onlyOwner):
function add(uint256 allocPoint, IERC20 _lpToken) external onlyOwner
function set(uint256 _pid, uint256 _allocPoint) external onlyOwner
function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner
function pause() external onlyOwner  // Emergency stop
function unpause() external onlyOwner

// USER FUNCTIONS:
function deposit(uint256 pid, uint256 amount, address to) external
function withdraw(uint256 pid, uint256 amount, address to) external
function harvest(uint256 pid, address to) external
function withdrawAndHarvest(uint256 pid, uint256 amount, address to) external
function emergencyWithdraw(uint256 pid, address to) external

// VIEW FUNCTIONS:
function pendingReward(uint256 _pid, address _user) external view returns (uint256)
function poolLength() external view returns (uint256)
Deployment Parameters:

_rewardToken: PHASOR token address
_rewardPerBlock: 11,415 * 10^18 (11.4K PHASOR per block)
_startBlock: Current block + 100 (~30 mins buffer)
Time to implement: 6-8 hours

2 hours: Copy + modify constructor
2 hours: Add Pausable
2 hours: Write tests
2 hours: Integration testing
Initial Farm Pools (Start Simple)
Launch with 4 pools only (can add more via Safe later):

WMON-USDC - 40% allocation (most liquid, stablecoin)
WMON-PHASOR - 35% allocation (bootstrap token liquidity)
WMON-USDT - 20% allocation (second stablecoin)
WMON-WETH - 5% allocation (major pair)
Rationale:

Focus on high-volume pairs
WMON-PHASOR gets heavy incentives (we need deep liquidity)
Can add more pools with Safe.add() after launch
4 pools = simpler frontend, less testing
NO Boosted Rewards (MVP)
Removed from MVP:

xPHASOR staking
Boosted farm yields
Fee distribution
Why: Each adds 5+ days of dev time
Post-MVP: Add staking in week 3-4 after farming is live and stable

3. Airdrop (Merkle-Based, Gas Efficient)
Why Merkle Airdrop?
Gas Efficient: Users claim (they pay gas), not you
Battle-Tested: Used by Uniswap, ENS, Optimism
Simple: One contract, one merkle root, done
No UI needed: Can use existing tools (https://app.uniswap.org/claim style)
Smart Contract (Copy Uniswap)
MerkleDistributor.sol


// Location: packages/core/contracts/MerkleDistributor.sol
// Base: Uniswap Merkle Distributor
// Repo: https://github.com/Uniswap/merkle-distributor

// EXACT COPY - don't change anything, it's audited

contract MerkleDistributor {
    address public immutable token;
    bytes32 public immutable merkleRoot;

    mapping(uint256 => uint256) private claimedBitMap;

    function isClaimed(uint256 index) external view returns (bool)
    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external
}
Deployment:

Deploy with PHASOR token address
Generate merkle tree from CSV of addresses + amounts
Set merkle root in constructor
Transfer 100M PHASOR to contract
Tool for Merkle Tree:


# Use Uniswap's merkle generator
npx @uniswap/merkle-distributor-cli generate-merkle-root \
  --input airdrop.json \
  --output merkle-tree.json
Airdrop Recipients (Who gets PHASOR?):


Criteria: Historical LP providers on your DEX
Data source: Your subgraph (query Mint events)

Distribution example:
- Users who added liquidity in last 30 days
- Proportional to LP value * time held
- Minimum: 100 PHASOR
- Maximum: 50,000 PHASOR per address
Time to implement: 3-4 hours

1 hour: Copy contract
1 hour: Generate merkle tree from subgraph data
1 hour: Write claim UI component (optional, can skip)
1 hour: Testing
4. Safe Multisig Configuration
Safe Roles & Permissions
Safe Address: Your existing Safe multisig
Signers: 3-5 team members (recommend 3-of-5 for speed)

Contracts Owned by Safe:

PhasorToken - Owner (for potential future mint role)
MasterChef - Owner (add/modify pools, adjust emissions, pause)
MerkleDistributor - No owner needed (immutable once deployed)
Critical Functions Safe Controls:


// PhasorToken (minimal - it's fixed supply)
- transferOwnership() - Transfer to DAO later

// MasterChef (active management)
- add(allocPoint, lpToken) - Add new farm pools
- set(pid, allocPoint) - Adjust pool rewards
- setRewardPerBlock(amount) - Adjust emission rate
- pause() - Emergency stop all farms
- unpause() - Resume farms

// Future: Enable protocol fees
- factory.setFeeTo(address) - Start collecting fees
Safe Setup Checklist
Before Deploy:

✅ Deploy Safe on Monad testnet (if not already)
✅ Add 3-5 signers with threshold (3-of-5 recommended)
✅ Test Safe can execute transactions
✅ Fund Safe with MON for gas
During Deploy:

Deploy PHASOR with Safe as initialOwner
Deploy MasterChef with Safe as owner
Safe transfers 400M PHASOR to MasterChef
Safe calls MasterChef.add() for each pool
Deploy MerkleDistributor (no owner)
Safe transfers 100M PHASOR to MerkleDistributor
After Deploy:

Verify all contracts on explorer
Test deposit/withdraw on testnet
Generate airdrop merkle tree
Create WMON-PHASOR liquidity (50M PHASOR from Safe)
5. Staking & Launchpad (Post-MVP, Week 3+)
REMOVED FROM 2-WEEK SPRINT

These features each add 5-7 days of dev time:

xPHASOR staking contract
Fee distribution mechanism
Boosted farm rewards
Launchpad contracts (fair launch, LBP, etc.)
Trading fee discounts
Why Remove:

Farming alone drives TVL
Can iterate after launch
Less security risk (smaller attack surface)
Faster time to market
Post-MVP Plan:

Week 3: Add xPHASOR staking + fee share
Week 4: Enable protocol fees (factory.setFeeTo)
Week 5-6: Build launchpad (start with fair launch only)
Week 7+: Add boosted rewards, LBP, governance
5. Launchpad
Launch Models Supported
The launchpad must support 4 launch types with composable features:

A. Fair Launch (Fixed Price Sale)
Fixed token price (e.g., 1 PHASOR = 100 NEW_TOKEN)
Individual purchase caps (min/max per wallet)
Total raise cap
Overflow refund if oversubscribed
Whitelist support (optional)
B. Liquidity Bootstrapping Pool (LBP/Dutch Auction)
Descending price auction (starts high, drops over time)
Price discovery mechanism
Weight changes: 95/5 → 50/50 over 72 hours
Discourages bots and whales
Based on Balancer V1 LBP design
C. Tiered/Whitelist Sales
Multiple sale rounds:
Tier 1: Whitelist (guaranteed allocation)
Tier 2: PHASOR stakers (proportional allocation)
Tier 3: Public FCFS (first come first served)
Different prices per tier
Allocation based on xPHASOR holdings
D. Token Vesting/Lockup
Linear vesting schedule (e.g., 10% TGE, 90% over 6 months)
Cliff period (e.g., 1-month cliff then monthly unlock)
Vesting applies to purchased tokens
Users claim unlocked tokens periodically
Smart Contracts Required
1. LaunchpadFactory.sol (New)


// Location: packages/core/contracts/launchpad/LaunchpadFactory.sol
// Purpose: Create and manage multiple token launches

// Functions:
// - createLaunch(params) - Deploy new launch contract
// - getLaunches() - Query all launches
// - setFeeReceiver(address) - Platform fee destination
2. FairLaunch.sol (New)


// Location: packages/core/contracts/launchpad/FairLaunch.sol
// Purpose: Fixed-price token sales with caps

// Configuration:
// - Token being sold
// - Price (in PHASOR, USDC, or MON)
// - Hard cap (max raise)
// - Soft cap (min raise for success)
// - Individual min/max purchase
// - Sale duration (start/end timestamps)
// - Whitelist merkle root (optional)

// Functions:
// - contribute(amount) - Buy tokens
// - claim() - Claim purchased tokens (after sale ends)
// - refund() - Get refund if sale fails or oversubscribed
// - finalize() - Project owner finalizes sale, receives funds
3. LBPLaunch.sol (New)


// Location: packages/core/contracts/launchpad/LBPLaunch.sol
// Base: Simplified Balancer V1 LBP

// Configuration:
// - Token pair (PROJECT_TOKEN / PHASOR)
// - Initial weights (e.g., 95% / 5%)
// - Final weights (e.g., 50% / 50%)
// - Weight change duration (e.g., 72 hours)
// - Starting balances

// Mechanism:
// - Acts as AMM pool with changing weights
// - Price = (reserveOut/weightOut) / (reserveIn/weightIn)
// - As weight shifts, price drops even without buys
// - Built-in slippage protection
4. TieredLaunch.sol (New)


// Location: packages/core/contracts/launchpad/TieredLaunch.sol
// Purpose: Multi-tier sales with allocation based on stake

// Tiers:
// 1. Whitelist: Merkle proof verification
// 2. Staker: Allocation = (user_xPHASOR / total_xPHASOR) * pool
// 3. Public: FCFS with individual caps

// Functions:
// - contributeWhitelist(proof, amount) - Tier 1 purchase
// - contributeStaker(amount) - Tier 2 purchase (checks xPHASOR)
// - contributePublic(amount) - Tier 3 purchase
// - progressToNextTier() - Advance sale stage
5. VestingVault.sol (New)


// Location: packages/core/contracts/launchpad/VestingVault.sol
// Purpose: Hold and vest purchased tokens

// Configuration per user:
// - Total purchased amount
// - TGE (token generation event) unlock %
// - Cliff duration
// - Vesting duration
// - Vesting interval (daily/weekly/monthly)

// Functions:
// - getClaimable(user) - Calculate unlocked tokens
// - claim() - Withdraw unlocked tokens
// - schedule(user) - View vesting schedule
Launchpad Fee Structure
Platform Fee: 2% of funds raised (paid in raise currency)
Token Requirement: Project must provide 5% of supply to PHASOR treasury
Liquidity Lock: 50% of raise must go to DEX liquidity (locked 6 months)
6. Frontend Implementation (Week 2)
Philosophy: Copy Existing Patterns
Your codebase already has great patterns:

useSwap.ts - Perfect template for farm hooks
SwapCard.tsx - Copy for FarmCard.tsx
AddLiquidityCard.tsx - Copy for StakeModal.tsx
Strategy: Don't reinvent, duplicate and modify.

New Pages/Routes
A. /farms - Yield Farming Dashboard (ONLY page needed for MVP)


Components (MVP - Keep it simple):
├─ FarmList.tsx - Table of 4 farms with APR, TVL, your stake
├─ FarmCard.tsx - Expandable row with deposit/withdraw/harvest
└─ (No separate modals - inline forms are faster to build)

Hooks (Copy from useSwap.ts pattern):
├─ useFarms.ts - Fetch 4 pools from MasterChef
├─ useUserFarmPositions.ts - User's staked amounts
├─ useFarmActions.ts - deposit(), withdraw(), harvest() combined
└─ usePendingRewards.ts - Claimable PHASOR per pool
Implementation Time: Day 8-10 (3 days)

Day 8: Build FarmList + FarmCard components
Day 9: Write farm hooks (copy useSwap patterns)
Day 10: Integration, styling, testing
What to Copy:


// packages/phasor-dex/hooks/useSwap.ts:37-95
// This is PERFECT template for farm hooks
// Replace:
// - inputToken/outputToken → lpToken
// - swap() → deposit()/withdraw()
// - quote → pendingRewards
B. (OPTIONAL) /airdrop - Claim Page


Optional - users can claim via Etherscan
If time permits (Day 11):
├─ ClaimAirdrop.tsx - Merkle proof verification + claim button
└─ useAirdropClaim.ts - Check eligibility, claim function
C. NO OTHER PAGES FOR MVP

No /stake (not building xPHASOR yet)
No /launchpad (post-MVP feature)
No /governance (way post-MVP)
Navigation Updates
File: packages/phasor-dex/components/layout/Header.tsx

Add to NAV_ITEMS (30 seconds):


{ label: "Farms", href: "/farms" },
// That's it for MVP
Configuration Updates (Critical Files)
File: packages/phasor-dex/config/chains.ts


export const CONTRACTS = {
  FACTORY: "0x1780bCf4103D3F501463AD3414c7f4b654bb7aFd", // existing
  ROUTER: "0x...", // existing
  WMON: "0x...", // existing
  // NEW for MVP:
  PHASOR: "0x...", // Deploy day 2
  MASTER_CHEF: "0x...", // Deploy day 5
  MERKLE_DISTRIBUTOR: "0x...", // Deploy day 3 (optional)
};
File: packages/phasor-dex/config/abis.ts


// NEW - Add these 2 ABIs only
export const PHASOR_ABI = erc20Abi; // It's just ERC20, use viem's built-in
export const MASTER_CHEF_ABI = [...]; // Copy from MasterChef.sol after compile
File: packages/phasor-dex/types/index.ts


// NEW types for MVP (minimal)
export interface Farm {
  pid: number;
  lpToken: Address;
  token0: Token;
  token1: Token;
  allocPoint: bigint;
  totalStaked: bigint;
  apr: number; // calculated client-side
}

export interface UserFarmPosition {
  pid: number;
  stakedAmount: bigint;
  pendingReward: bigint;
}

// That's it - no Launch types, no Vesting types (not building those yet)
Token List Update
File: packages/phasor-dex/public/tokenlist.json

Add PHASOR (after deploy):


{
  "chainId": 10143,
  "address": "0x...", // Fill in after deployment
  "name": "Phasor Token",
  "symbol": "PHASOR",
  "decimals": 18,
  "logoURI": "ipfs://..." // Or host on your domain
}
7. Subgraph Extensions (Optional for MVP)
MVP Decision: SKIP SUBGRAPH INITIALLY
Why Skip:

Adds 2-3 days of work
Frontend can query contracts directly (your existing pattern)
Subgraph is for UX optimization, not required functionality
Can add in week 3 after launch
What You Lose:

Historical farm APR charts
Total value locked aggregation
User position history
What Still Works:

Real-time farm data (query MasterChef directly)
User positions (query userInfo)
APR calculation (client-side from emissions + TVL)
Post-MVP (Week 3):
Add minimal subgraph entities:


type Farm @entity {
  id: ID!
  pid: BigInt!
  lpToken: Bytes!
  allocPoint: BigInt!
  totalStaked: BigDecimal!
}

type FarmPosition @entity {
  id: ID! # user-pid
  user: Bytes!
  farm: Farm!
  amount: BigDecimal!
  rewardsEarned: BigDecimal!
}
Mappings: Just Deposit, Withdraw, Harvest events from MasterChef

Deployment: Use existing packages/v2-subgraph/scripts/deploy-local.sh pattern

8. 2-Week Deployment Strategy
WEEK 1: Smart Contracts (Day 1-7)
Day 1-2: PHASOR Token
Tasks:

Create packages/core/contracts/PhasorToken.sol
Copy OpenZeppelin ERC20 + ERC20Permit + Ownable
Write basic tests (packages/core/test/PhasorToken.t.sol)
Deploy to Anvil local, test transfers/approvals/permits
Deliverable: Working token contract with tests passing

Day 3-5: MasterChef
Tasks:

Fork SushiSwap MasterChef V2 into packages/core/contracts/MasterChef.sol
Modify constructor (PHASOR address, Safe as owner)
Add Pausable from OpenZeppelin
Write comprehensive tests (packages/core/test/MasterChef.t.sol):
Deposit LP tokens
Withdraw LP tokens
Harvest rewards
Multiple users, multiple pools
Emergency withdraw
Owner functions (add/set pool, pause)
Deploy to Anvil, test full flows
Deliverable: Working MasterChef with tests passing

Day 6: Testnet Deployment
Tasks:

Update cannonfile.toml with PHASOR + MasterChef
Deploy to Monad testnet
Setup Safe multisig (if not already)
Safe transfers 400M PHASOR to MasterChef
Safe calls MasterChef.add() for 4 pools:
WMON-USDC (40%)
WMON-PHASOR (35%)
WMON-USDT (20%)
WMON-WETH (5%)
Create WMON-PHASOR liquidity (50M PHASOR from Safe)
Deliverable: Contracts live on testnet, farms active

Day 7: Testing & Merkle Tree
Tasks:

Test deposit/withdraw/harvest on testnet with your own wallet
Query subgraph for historical LP holders
Generate airdrop eligibility list (CSV)
Create merkle tree with @uniswap/merkle-distributor-cli
Deploy MerkleDistributor (optional)
Write down all contract addresses for frontend config
Deliverable: Tested contracts, airdrop ready (optional)

WEEK 2: Frontend (Day 8-14)
Day 8-9: Farm Components
Tasks:

Create packages/phasor-dex/app/farms/page.tsx
Create packages/phasor-dex/components/farm/FarmList.tsx
Create packages/phasor-dex/components/farm/FarmCard.tsx
Copy-paste patterns from SwapCard.tsx and AddLiquidityCard.tsx
Add "Farms" to navigation in Header.tsx
Deliverable: UI components rendering (no data yet)

Day 10: Farm Hooks
Tasks:

Create packages/phasor-dex/hooks/useFarms.ts
Query MasterChef.poolLength()
Query MasterChef.poolInfo(pid) for each pool
Fetch LP token addresses, get pair data
Calculate TVL from reserves
Create packages/phasor-dex/hooks/useUserFarmPositions.ts
Query MasterChef.userInfo(pid, userAddress)
Query MasterChef.pendingReward(pid, userAddress)
Create packages/phasor-dex/hooks/useFarmActions.ts
deposit(pid, amount)
withdraw(pid, amount)
harvest(pid)
Handle approvals (LP token → MasterChef)
Calculate APR client-side:

const yearlyRewards = rewardPerBlock * blocksPerYear * poolAllocPoint / totalAllocPoint
const rewardValue = yearlyRewards * phasorPrice
const apr = (rewardValue / poolTVL) * 100
Deliverable: Working farm interactions (deposit/withdraw/harvest)

Day 11-12: Integration & Testing
Tasks:

Update packages/phasor-dex/config/chains.ts with contract addresses
Update packages/phasor-dex/config/abis.ts with MasterChef ABI
Add PHASOR to packages/phasor-dex/public/tokenlist.json
Add types to packages/phasor-dex/types/index.ts
End-to-end testing on testnet:
Connect wallet
See 4 farms with APRs
Deposit LP tokens (you need existing LP positions)
Harvest rewards
Withdraw LP tokens
Fix bugs, polish UI, add loading states
Mobile responsive check
Deliverable: Fully functional /farms page on testnet

Day 13: Mainnet Deployment
Tasks:

Final security review of contracts
Deploy PHASOR to Monad mainnet
Deploy MasterChef to mainnet
Verify contracts on Monad explorer
Safe transfers 400M PHASOR to MasterChef
Safe adds 4 farm pools
Safe creates WMON-PHASOR liquidity (50M PHASOR)
Deploy MerkleDistributor with 100M PHASOR (optional)
Update frontend config with mainnet addresses
Deploy frontend to production (Vercel/your hosting)
Test on mainnet with small amounts
Deliverable: Live on mainnet!

Day 14: Launch & Monitor
Tasks:

Announce launch on Twitter/Discord
Share PHASOR contract address
Share farms link
Monitor for bugs, user feedback
Watch TVL grow
Be ready to pause via Safe if issues arise
Collect metrics (users, deposits, APRs)
Deliverable: Successful MVP launch, live farms earning yield

Emergency Procedures
If Critical Bug Found:

Safe calls MasterChef.pause() immediately
Assess impact, develop fix
Deploy new MasterChef (keep PHASOR same)
Safe transfers PHASOR to new MasterChef
Communicate with users, migrate positions
If Gas Costs Too High:

Optimize batch operations (updatePool before mass deposits)
Consider gas rebates from treasury
Document gas costs in UI
If APRs Too Low/High:

Safe calls MasterChef.setRewardPerBlock() to adjust
Safe calls MasterChef.set(pid, newAllocPoint) to rebalance pools
Monitor for 24h, iterate
9. Testing Strategy (Minimal for Speed)
Smart Contract Tests (Foundry)
Priority Tests (must pass before deploy):


packages/core/test/
├─ PhasorToken.t.sol - Transfer, approve, permit (1 hour)
└─ MasterChef.t.sol - Deposit, withdraw, harvest, rewards math (4 hours)
Test Focus:

PhasorToken: Basic ERC20 + permit functionality
MasterChef: Core scenarios:
Single user deposits → harvests → withdraws
Multiple users, reward distribution is proportional
Adding pools, changing allocations
Emergency withdraw (user loses pending rewards)
Pause/unpause by owner
Run Tests:


cd packages/core
forge test -vvv
Gas Benchmarks:

Deposit: ~100-150k gas
Withdraw: ~80-120k gas
Harvest: ~60-100k gas
Emergency Withdraw: ~50k gas
Frontend Testing (Manual Only for MVP)
Skip automated E2E tests - they take 2 days to setup

Manual Testing Checklist:

 Connect wallet on testnet
 See 4 farms with correct token pairs
 Approve LP token
 Deposit LP tokens
 See staked balance update
 See pending rewards increase over time
 Harvest rewards, receive PHASOR
 Withdraw LP tokens
 Emergency withdraw works
 Test on mobile (responsive)
Time: 2-3 hours of manual testing on Day 11

10. Security Considerations (MVP Focus)
Why MVP is Lower Risk
No custom math: Using SushiSwap's proven MasterChef
Fixed supply token: No minting = no supply manipulation
No oracles: Rewards are time-based, no external price feeds
No flash loan surface: Can't borrow LP tokens
Simple architecture: Token + staking contract only
Critical Security Checks
Before Deployment:

✅ Solidity 0.8.20+: Built-in overflow protection
✅ OpenZeppelin imports: Battle-tested base contracts
✅ Safe as owner: No EOA with admin rights
✅ Pausable: Emergency stop mechanism
✅ Fixed supply: Token can't be minted after deployment
MasterChef Specific:

✅ Reward debt prevents double-claiming (SushiSwap's math)
✅ Emergency withdraw doesn't depend on calculations
✅ Owner functions protected by onlyOwner (Safe)
✅ No delegatecall (safer)
Known Risks (Acceptable for MVP):

No audit: MasterChef is SushiSwap's code (audited), but our deployment isn't
Mitigation: Start with low TVL, monitor closely
Safe key management: If Safe compromised, attacker can drain MasterChef
Mitigation: Use hardware wallets, geographic distribution of signers
Contract bugs: Even forks can have integration issues
Mitigation: Comprehensive testing, pause function, start small
Post-Launch Monitoring
Day 1-7 Watch List:

Unexpected reward distributions
Users unable to withdraw
Gas costs exceeding estimates
Exploits discovered in SushiSwap MasterChef (monitor their Discord)
Safe Actions Available:

pause() - Stop all deposits/withdraws
setRewardPerBlock(0) - Stop emissions
Transfer remaining PHASOR out of MasterChef (if needed)
Audit Plan (Post-MVP)
Week 3-4: Get professional audit

Recommended: Sherlock, Code4rena (competitive audits, $5-15K)
Alternative: Internal review by experienced Solidity dev
Publish report publicly
Until audit: Keep TVL <$500K, make users aware it's unaudited MVP

11. Success Metrics (2 Weeks Post-Launch)
Target Goals (Realistic for MVP)
Primary Metrics:

TVL: $250K-$1M across all farms (depends on PHASOR price)
Unique Farmers: 50-200 users
PHASOR Price: $0.01-$0.05 (depends on initial liquidity depth)
Daily Harvest Transactions: 20-100
Health Indicators:

Zero critical bugs
<5% user complaints about UX
Gas costs within acceptable range (<$2 per transaction)
APRs competitive with other farms (100-500%)
Simple Monitoring (No Fancy Dashboards Needed)
Manual Daily Checks:

Open /farms page
Check TVL is increasing
Check APRs are reasonable
Scan Discord/Twitter for bug reports
Check Safe has enough MON for gas
On-Chain Checks (via Etherscan-style explorer):


MasterChef.totalAllocPoint() - should be 100
MasterChef.rewardPerBlock() - should be ~11.4K PHASOR
PHASOR.balanceOf(MasterChef) - should be decreasing as rewards paid
Week 2-4: Add basic analytics (Dune or custom subgraph)

12. Go-to-Market (Simple MVP Launch)
Pre-Launch (Day 12-13)
Minimal Marketing (you're solo, keep it simple):

Tweet announcing launch date
Post in relevant Monad/DeFi communities
Share contract addresses once deployed
Document: "Farms launching [date], 4 pools, 400M PHASOR over 4 years"
Launch Day (Day 14)
Announcement:


🚀 Phasor Farms are LIVE!

Earn PHASOR by staking LP tokens:
- WMON-USDC: 40% APR
- WMON-PHASOR: 35% APR
- WMON-USDT: 20% APR
- WMON-WETH: 5% APR

[Link to farms]

⚠️ Unaudited MVP - start with small amounts
Launch Checklist:

 Contracts deployed and verified
 Frontend live
 Tweet sent
 Monitoring active
 Safe signers ready for emergency actions
First Week Post-Launch
Respond to user feedback
Fix minor UI bugs
Share TVL milestones
Thank early farmers
Monitor for security issues
NO big marketing yet - you want to find bugs with small TVL first

13. Post-MVP Roadmap (Week 3+)
Week 3-4: Staking (xPHASOR)
Goal: Let users stake PHASOR to earn fee share

Contracts:

xPHASOR.sol (fork SushiBar)
FeeDistributor.sol
Enable factory.setFeeTo()
Frontend:

/stake page
Stake/unstake PHASOR
View claimable fees
Value: Revenue sharing attracts long-term holders

Week 5-6: Launchpad (Fair Launch Only)
Goal: First token launch on platform

Contracts:

LaunchpadFactory.sol
FairLaunch.sol (fixed price model)
VestingVault.sol
Frontend:

/launchpad page
Create launch (admin)
Participate in sale (users)
Claim tokens with vesting
Value: Platform revenue (2% fee), attracts projects

Week 7-8: Boosted Rewards
Goal: Reward PHASOR stakers with higher farm yields

Logic: Add boost calculation to MasterChef:


boostedReward = baseReward * min(2.5, 1 + staked_PHASOR / (LP_value * 0.4))
Value: Incentivizes PHASOR staking, reduces sell pressure

Week 9-10: Audit & Optimization
Goal: Get security audit, optimize gas

Actions:

Professional audit (Sherlock/Code4rena)
Fix findings
Gas optimization pass
Expand TVL cap
Value: Trust, safety, readiness to scale

Week 11-12: Advanced Features
Liquidity bootstrapping pools (LBP)
Tiered launchpad sales
Trading fee discounts for stakers
Governance (snapshot voting)
14. Risks & Mitigation (MVP)
MVP-Specific Risks
Risk	Impact	Likelihood	Mitigation
Unaudited contracts	Critical	Medium	Start with low TVL cap ($500K), monitor closely, audit in week 3
Solo dev burnout	High	High	Ruthlessly prioritize, ask for help, iterate post-launch
Low user adoption	Medium	Medium	Market in Monad community, competitive APRs, good UX
Safe key loss	Critical	Low	Multiple signers, hardware wallets, backup recovery process
PHASOR dump after airdrop	Medium	High	Lock airdrop for 1 week, smaller initial airdrop, focus on farmers
Gas costs prohibitive	Medium	Low	Monad is fast/cheap, but batch operations in MasterChef
Missing 2-week deadline	High	Medium	Cut scope aggressively, delay airdrop, skip subgraph
14. Post-MVP Roadmap
Phase 2 Features (3-6 months post-launch)
Governance: Snapshot voting for parameter changes
Limit Orders: Off-chain order book
Concentrated Liquidity: Uniswap V3 style pools
Cross-chain Bridge: Expand to other L1s/L2s
Leveraged Farming: Borrow to farm (with collateral)
Phase 3 Features (6-12 months)
Options Trading: DOPEX-style options vaults
NFT Marketplace: Trade NFTs, use as collateral
Perpetual Swaps: Leverage trading with funding rates
Insurance Fund: Protect against smart contract failures
15. Critical Files (2-Week MVP Only)
New Smart Contracts

packages/core/contracts/
├─ PhasorToken.sol (Day 1-2)
├─ MasterChef.sol (Day 3-5)
└─ MerkleDistributor.sol (Day 7, optional)
New Tests

packages/core/test/
├─ PhasorToken.t.sol (Day 2)
└─ MasterChef.t.sol (Day 3-5)
Frontend - New Page

packages/phasor-dex/app/
└─ farms/page.tsx (Day 8-9)
Frontend - New Components

packages/phasor-dex/components/
└─ farm/
    ├─ FarmList.tsx (Day 8)
    └─ FarmCard.tsx (Day 9)
Frontend - New Hooks

packages/phasor-dex/hooks/
├─ useFarms.ts (Day 10)
├─ useUserFarmPositions.ts (Day 10)
└─ useFarmActions.ts (Day 10)
Frontend - Config Updates

packages/phasor-dex/
├─ config/chains.ts (MODIFY - add PHASOR, MASTER_CHEF)
├─ config/abis.ts (MODIFY - add MASTER_CHEF_ABI)
├─ types/index.ts (MODIFY - add Farm types)
├─ public/tokenlist.json (MODIFY - add PHASOR)
└─ components/layout/Header.tsx (MODIFY - add Farms link)
Deployment Files (Modify Existing)

cannonfile.toml or cannonfile.local.toml (MODIFY)
script/deploy-local.sh (reference for deployment flow)
Total New Files: ~10-12 files
Modified Files: ~5 files
Lines of Code: ~1500-2000 (mostly copy-paste from SushiSwap/OZ)

16. Day-by-Day Execution Plan
WEEK 1: Contracts
Day 1 (Monday):

 Setup: Fork SushiSwap MasterChef repo locally
 Create PhasorToken.sol (copy OpenZeppelin)
 Write basic tests for PhasorToken
 Deploy to Anvil, test locally
Deliverable: Working PHASOR token
Day 2 (Tuesday):

 Copy MasterChef.sol from SushiSwap
 Modify constructor (PHASOR address, Safe owner)
 Add Pausable from OpenZeppelin
 Remove SushiSwap-specific features (rewarders, complex rewards)
Deliverable: Modified MasterChef.sol
Day 3 (Wednesday):

 Write MasterChef tests (deposit, withdraw)
 Test reward calculations
 Test multiple users
 Test owner functions
Deliverable: Passing tests
Day 4 (Thursday):

 Test emergency withdraw
 Test pause/unpause
 Gas optimization pass
 Review security checklist
Deliverable: Production-ready contracts
Day 5 (Friday):

 Deploy PHASOR to Monad testnet
 Deploy MasterChef to testnet
 Verify contracts on explorer
 Document all addresses
Deliverable: Testnet deployment
Day 6 (Saturday):

 Setup Safe multisig (if not done)
 Safe transfers 400M PHASOR to MasterChef
 Get existing LP token addresses for 4 pairs
 Safe calls MasterChef.add() for 4 pools
 Create WMON-PHASOR liquidity (50M PHASOR)
Deliverable: Farms configured on testnet
Day 7 (Sunday):

 Test deposit/withdraw with your wallet
 Test harvest rewards
 Verify APR calculations manually
 (Optional) Generate airdrop merkle tree
 (Optional) Deploy MerkleDistributor
Deliverable: Tested, working farms
WEEK 2: Frontend
Day 8 (Monday):

 Create /app/farms/page.tsx
 Create FarmList component (table layout)
 Create FarmCard component (expandable row)
 Add "Farms" to Header navigation
 Basic styling (copy from pools page)
Deliverable: UI rendering (no data)
Day 9 (Tuesday):

 Create useFarms.ts hook
 Query MasterChef for pool info
 Fetch LP token details for each pool
 Calculate TVL from reserves
 Display farms in UI
Deliverable: Farms displaying with data
Day 10 (Wednesday):

 Create useUserFarmPositions.ts hook
 Create useFarmActions.ts hook (deposit/withdraw/harvest)
 Implement approval flow for LP tokens
 Calculate APR client-side
 Add deposit/withdraw forms to FarmCard
Deliverable: Full farming functionality
Day 11 (Thursday):

 Update config/chains.ts with mainnet addresses (TBD)
 Update config/abis.ts with MasterChef ABI
 Add PHASOR to tokenlist.json
 Add types to types/index.ts
 End-to-end testing on testnet
 Fix bugs, polish UI
Deliverable: Ready for mainnet
Day 12 (Friday):

 More testing, edge cases
 Mobile responsive check
 Add loading states, error handling
 Add tooltips, help text
 Performance check (slow queries?)
Deliverable: Polished UI
Day 13 (Saturday - DEPLOY DAY):

 Final security review
 Deploy PHASOR to Monad mainnet
 Deploy MasterChef to mainnet
 Verify contracts
 Safe transfers 400M PHASOR to MasterChef
 Safe adds 4 farm pools
 Safe creates WMON-PHASOR liquidity
 Update frontend config with mainnet addresses
 Deploy frontend to production
 Test with small amounts
Deliverable: LIVE ON MAINNET
Day 14 (Sunday - LAUNCH DAY):

 Final testing
 Announce launch on Twitter
 Share links in communities
 Monitor for bugs
 Watch TVL grow
 Respond to user feedback
 Celebrate! 🎉
Deliverable: Successful MVP launch
17. Quick Reference: What We're Building
MVP Scope (2 Weeks)
✅ PHASOR Token - Fixed supply ERC20 with permit
✅ MasterChef Farming - 4 pools, LP staking, PHASOR rewards
✅ Frontend - /farms page, deposit/withdraw/harvest
✅ Safe Integration - Multisig controls pools and emissions

NOT in MVP (Post-Launch)
❌ xPHASOR staking
❌ Fee distribution
❌ Boosted rewards
❌ Launchpad
❌ Governance
❌ Subgraph (initially)
❌ Professional audit (week 3-4)

Key Decisions
Fork Strategy: SushiSwap MasterChef V2 (audited, proven)
Token Supply: 1B fixed (no minting)
Initial Pools: 4 only (WMON pairs)
Distribution: Safe controls 450M, MasterChef has 400M, airdrop 100M, liquidity 50M
Timeline: 7 days contracts, 7 days frontend
Launch Strategy: Soft launch, find bugs with low TVL, scale after audit
18. Resources & Battle-Tested Code
Must Copy From These Repos
1. PhasorToken.sol


Source: OpenZeppelin Contracts v5.0.0
File: contracts/token/ERC20/ERC20.sol
      contracts/token/ERC20/extensions/ERC20Permit.sol
      contracts/access/Ownable.sol
URL: https://github.com/OpenZeppelin/openzeppelin-contracts
2. MasterChef.sol


Source: SushiSwap MasterChef V2
File: contracts/MasterChefV2.sol
URL: https://github.com/sushiswap/sushiswap/blob/master/protocols/masterchef/contracts/MasterChefV2.sol
Audit: Quantstamp, PeckShield
3. MerkleDistributor.sol (Optional)


Source: Uniswap Merkle Distributor
File: contracts/MerkleDistributor.sol
URL: https://github.com/Uniswap/merkle-distributor
Tool: @uniswap/merkle-distributor-cli
Testing References
SushiSwap MasterChef tests
OpenZeppelin test suite
Your existing useSwap.ts pattern for frontend hooks
19. Emergency Contacts & Contingencies
If You Get Stuck
Smart Contracts:

OpenZeppelin forum: https://forum.openzeppelin.com/
SushiSwap Discord: https://discord.gg/sushiswap
Foundry TG: https://t.me/foundry_rs
Frontend:

wagmi GitHub discussions
Your existing codebase (great patterns already!)
Deployment:

Cannon documentation
Your existing deploy scripts work great
If You Need to Delay Launch
Acceptable to Skip:

Airdrop (can do after launch)
4th farm pool (start with 3)
Perfect UI polish
Subgraph integration
NOT Acceptable to Skip:

Testing (must work on testnet)
Security review (at least basic checklist)
Safe multisig setup
Contract verification
Backup Plan: 1-Week Delay
If you need 3 weeks instead of 2:

Week 1-2: Contracts (same)
Week 3: Frontend + deploy
Gives buffer for testing and bug fixes
20. Final Checklist (Pre-Launch)
Contracts ✓
 PhasorToken compiles, tests pass
 MasterChef compiles, tests pass
 Deployed to testnet
 Verified on explorer
 Safe is owner of both
 400M PHASOR in MasterChef
 4 pools added with correct allocations
 WMON-PHASOR liquidity created (50M)
Frontend ✓
 /farms page renders
 Farms display with data
 Deposit works
 Withdraw works
 Harvest works
 APRs calculate correctly
 Mobile responsive
 Config updated with mainnet addresses
Security ✓
 No private keys in code
 Safe has 3+ signers
 Safe signers tested transaction approval
 Pause function tested
 Emergency procedures documented
 Users warned about unaudited status
Launch ✓
 Tweet drafted
 Community posts ready
 Monitoring plan in place
 Safe signers available for 24h
 Backup plan if bugs found
Summary
This is an aggressive but achievable 2-week sprint to launch farming on Phasor DEX. Success depends on:

Ruthless prioritization - Only PHASOR + MasterChef + basic UI
Copy battle-tested code - Don't reinvent, fork SushiSwap/OZ
Safe integration - Multisig controls everything critical
Iterate post-launch - Ship MVP, add features weekly after
You have the skills (Solidity, deployment, React), the infrastructure (working DEX, Safe, testnet), and now the plan. Let's ship it! 🚀

Ready to Start?
When you're ready to begin implementation, we'll work together day-by-day following this plan. I can help with:

Writing the smart contracts (PhasorToken, MasterChef)
Creating tests
Setting up deployment scripts
Building frontend components
Writing hooks
Debugging issues
Optimizing gas costs
Let's ship this MVP in 2 weeks! 💪

Phasor DEX 2-Week MVP Sprint: Farming Launch
Executive Summary
Timeline: 2 weeks (14 days)
Solo Engineer: You
Priority: Ship farming with PHASOR rewards to drive TVL growth
Strategy: Fork battle-tested code, minimal custom logic, iterate post-launch

Week 1: Smart Contracts
Day 1-2: PHASOR token (OpenZeppelin fork) + tests
Day 3-5: MasterChef V2 (SushiSwap fork) + tests
Day 6-7: Deploy to testnet, configure Safe multisig, test flows
Week 2: Frontend + Launch
Day 8-10: Build /farms page + hooks (copy existing patterns)
Day 11-12: Merkle airdrop UI, integration testing
Day 13: Deploy mainnet, seed liquidity, enable farms
Day 14: Monitor, fix bugs, announce launch
Post-MVP Roadmap: Staking (xPHASOR) in week 3-4, Launchpad in week 5-6

1. PHASOR Token Design (Simplified for 2-Week MVP)
Token Specification
Name: Phasor Token
Symbol: PHASOR
Total Supply: 1,000,000,000 PHASOR (1 billion, fixed supply)
Decimals: 18
Base Contract: OpenZeppelin ERC20 + ERC20Permit + Ownable
NOT MINTABLE: Fixed supply to avoid security risk (can add minting later if needed)
MVP Token Distribution (Simplified)

Total: 1,000,000,000 PHASOR (minted once at deployment)

├─ Safe Multisig (Treasury): 450M (45%) - Team, advisors, partnerships
├─ MasterChef (Farming): 400M (40%) - 4-year emissions
├─ Airdrop Contract: 100M (10%) - Early LP rewards (merkle)
└─ Initial DEX Liquidity: 50M (5%) - WMON-PHASOR pair
Rationale:

No vesting contracts (add later) - saves 3-4 days of dev time
Safe controls treasury - manual distributions OK for MVP
Merkle airdrop instead of claiming UI (gas efficient, proven)
Fixed supply = no minting governance needed yet
Emission Schedule (MVP)

400M PHASOR over 4 years from MasterChef
Constant rate: ~274K PHASOR/day (~11.4K/hour)

Simplification: Linear emission (no decay)
- Easier to reason about
- Can adjust via pool allocations
- MasterChef.setRewardPerBlock() if needed (Safe only)
Smart Contract Required
PhasorToken.sol (Copy OpenZeppelin)


// Location: packages/core/contracts/PhasorToken.sol
// Base: OpenZeppelin v4.9.0 or v5.0.0
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PhasorToken is ERC20, ERC20Permit, Ownable {
    constructor(
        address initialOwner
    ) ERC20("Phasor Token", "PHASOR") ERC20Permit("Phasor Token") Ownable(initialOwner) {
        // Mint total supply to owner (will be your Safe)
        _mint(initialOwner, 1_000_000_000 * 10**18);
    }

    // No mint function = fixed supply
    // Owner = Safe multisig for potential future upgrades
}
Time to implement: 1 hour (it's literally OpenZeppelin copy-paste)
Testing: 2 hours (basic transfer, permit, allowance tests)
Security: Battle-tested OZ code, minimal risk

2. Yield Farming (MasterChef v2 - Fork with Minimal Changes)
Battle-Tested Source
Fork: SushiSwap MasterChef V2
Repo: https://github.com/sushiswap/sushiswap/blob/master/protocols/masterchef/contracts/MasterChefV2.sol
Audits: Multiple (Quantstamp, PeckShield)
Changes: Minimal - just constructor params and owner functions

Why MasterChef V2 (not V1)?
V2 has better accounting (no reentrancy issues)
Supports complex rewarders (for future dual rewards)
More flexible pool management
Used by Sushi, Trader Joe, PancakeSwap V2
Smart Contract (Copy SushiSwap)
MasterChef.sol


// Location: packages/core/contracts/MasterChef.sol
// Base: SushiSwap MasterChef V2 (99% copy, 1% customization)

// CHANGES FROM SUSHI:
// 1. Constructor takes Safe address as owner
// 2. PHASOR token address instead of SUSHI
// 3. Remove SUSHI-specific rewarder logic (add later)
// 4. Add Pausable from OpenZeppelin (emergency stop)

// KEY STATE:
struct PoolInfo {
    uint128 accRewardPerShare; // Accumulated rewards per share
    uint64 lastRewardBlock;    // Last block rewards calculated
    uint64 allocPoint;         // Pool weight (share of emissions)
}

struct UserInfo {
    uint256 amount;     // LP tokens staked
    int256 rewardDebt;  // Rewards already accounted for
}

// SAFE-CONTROLLED FUNCTIONS (onlyOwner):
function add(uint256 allocPoint, IERC20 _lpToken) external onlyOwner
function set(uint256 _pid, uint256 _allocPoint) external onlyOwner
function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner
function pause() external onlyOwner  // Emergency stop
function unpause() external onlyOwner

// USER FUNCTIONS:
function deposit(uint256 pid, uint256 amount, address to) external
function withdraw(uint256 pid, uint256 amount, address to) external
function harvest(uint256 pid, address to) external
function withdrawAndHarvest(uint256 pid, uint256 amount, address to) external
function emergencyWithdraw(uint256 pid, address to) external

// VIEW FUNCTIONS:
function pendingReward(uint256 _pid, address _user) external view returns (uint256)
function poolLength() external view returns (uint256)
Deployment Parameters:

_rewardToken: PHASOR token address
_rewardPerBlock: 11,415 * 10^18 (11.4K PHASOR per block)
_startBlock: Current block + 100 (~30 mins buffer)
Time to implement: 6-8 hours

2 hours: Copy + modify constructor
2 hours: Add Pausable
2 hours: Write tests
2 hours: Integration testing
Initial Farm Pools (Start Simple)
Launch with 4 pools only (can add more via Safe later):

WMON-USDC - 40% allocation (most liquid, stablecoin)
WMON-PHASOR - 35% allocation (bootstrap token liquidity)
WMON-USDT - 20% allocation (second stablecoin)
WMON-WETH - 5% allocation (major pair)
Rationale:

Focus on high-volume pairs
WMON-PHASOR gets heavy incentives (we need deep liquidity)
Can add more pools with Safe.add() after launch
4 pools = simpler frontend, less testing
NO Boosted Rewards (MVP)
Removed from MVP:

xPHASOR staking
Boosted farm yields
Fee distribution
Why: Each adds 5+ days of dev time
Post-MVP: Add staking in week 3-4 after farming is live and stable

3. Airdrop (Merkle-Based, Gas Efficient)
Why Merkle Airdrop?
Gas Efficient: Users claim (they pay gas), not you
Battle-Tested: Used by Uniswap, ENS, Optimism
Simple: One contract, one merkle root, done
No UI needed: Can use existing tools (https://app.uniswap.org/claim style)
Smart Contract (Copy Uniswap)
MerkleDistributor.sol


// Location: packages/core/contracts/MerkleDistributor.sol
// Base: Uniswap Merkle Distributor
// Repo: https://github.com/Uniswap/merkle-distributor

// EXACT COPY - don't change anything, it's audited

contract MerkleDistributor {
    address public immutable token;
    bytes32 public immutable merkleRoot;

    mapping(uint256 => uint256) private claimedBitMap;

    function isClaimed(uint256 index) external view returns (bool)
    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external
}
Deployment:

Deploy with PHASOR token address
Generate merkle tree from CSV of addresses + amounts
Set merkle root in constructor
Transfer 100M PHASOR to contract
Tool for Merkle Tree:


# Use Uniswap's merkle generator
npx @uniswap/merkle-distributor-cli generate-merkle-root \
  --input airdrop.json \
  --output merkle-tree.json
Airdrop Recipients (Who gets PHASOR?):


Criteria: Historical LP providers on your DEX
Data source: Your subgraph (query Mint events)

Distribution example:
- Users who added liquidity in last 30 days
- Proportional to LP value * time held
- Minimum: 100 PHASOR
- Maximum: 50,000 PHASOR per address
Time to implement: 3-4 hours

1 hour: Copy contract
1 hour: Generate merkle tree from subgraph data
1 hour: Write claim UI component (optional, can skip)
1 hour: Testing
4. Safe Multisig Configuration
Safe Roles & Permissions
Safe Address: Your existing Safe multisig
Signers: 3-5 team members (recommend 3-of-5 for speed)

Contracts Owned by Safe:

PhasorToken - Owner (for potential future mint role)
MasterChef - Owner (add/modify pools, adjust emissions, pause)
MerkleDistributor - No owner needed (immutable once deployed)
Critical Functions Safe Controls:


// PhasorToken (minimal - it's fixed supply)
- transferOwnership() - Transfer to DAO later

// MasterChef (active management)
- add(allocPoint, lpToken) - Add new farm pools
- set(pid, allocPoint) - Adjust pool rewards
- setRewardPerBlock(amount) - Adjust emission rate
- pause() - Emergency stop all farms
- unpause() - Resume farms

// Future: Enable protocol fees
- factory.setFeeTo(address) - Start collecting fees
Safe Setup Checklist
Before Deploy:

✅ Deploy Safe on Monad testnet (if not already)
✅ Add 3-5 signers with threshold (3-of-5 recommended)
✅ Test Safe can execute transactions
✅ Fund Safe with MON for gas
During Deploy:

Deploy PHASOR with Safe as initialOwner
Deploy MasterChef with Safe as owner
Safe transfers 400M PHASOR to MasterChef
Safe calls MasterChef.add() for each pool
Deploy MerkleDistributor (no owner)
Safe transfers 100M PHASOR to MerkleDistributor
After Deploy:

Verify all contracts on explorer
Test deposit/withdraw on testnet
Generate airdrop merkle tree
Create WMON-PHASOR liquidity (50M PHASOR from Safe)
5. Staking & Launchpad (Post-MVP, Week 3+)
REMOVED FROM 2-WEEK SPRINT

These features each add 5-7 days of dev time:

xPHASOR staking contract
Fee distribution mechanism
Boosted farm rewards
Launchpad contracts (fair launch, LBP, etc.)
Trading fee discounts
Why Remove:

Farming alone drives TVL
Can iterate after launch
Less security risk (smaller attack surface)
Faster time to market
Post-MVP Plan:

Week 3: Add xPHASOR staking + fee share
Week 4: Enable protocol fees (factory.setFeeTo)
Week 5-6: Build launchpad (start with fair launch only)
Week 7+: Add boosted rewards, LBP, governance
5. Launchpad
Launch Models Supported
The launchpad must support 4 launch types with composable features:

A. Fair Launch (Fixed Price Sale)
Fixed token price (e.g., 1 PHASOR = 100 NEW_TOKEN)
Individual purchase caps (min/max per wallet)
Total raise cap
Overflow refund if oversubscribed
Whitelist support (optional)
B. Liquidity Bootstrapping Pool (LBP/Dutch Auction)
Descending price auction (starts high, drops over time)
Price discovery mechanism
Weight changes: 95/5 → 50/50 over 72 hours
Discourages bots and whales
Based on Balancer V1 LBP design
C. Tiered/Whitelist Sales
Multiple sale rounds:
Tier 1: Whitelist (guaranteed allocation)
Tier 2: PHASOR stakers (proportional allocation)
Tier 3: Public FCFS (first come first served)
Different prices per tier
Allocation based on xPHASOR holdings
D. Token Vesting/Lockup
Linear vesting schedule (e.g., 10% TGE, 90% over 6 months)
Cliff period (e.g., 1-month cliff then monthly unlock)
Vesting applies to purchased tokens
Users claim unlocked tokens periodically
Smart Contracts Required
1. LaunchpadFactory.sol (New)


// Location: packages/core/contracts/launchpad/LaunchpadFactory.sol
// Purpose: Create and manage multiple token launches

// Functions:
// - createLaunch(params) - Deploy new launch contract
// - getLaunches() - Query all launches
// - setFeeReceiver(address) - Platform fee destination
2. FairLaunch.sol (New)


// Location: packages/core/contracts/launchpad/FairLaunch.sol
// Purpose: Fixed-price token sales with caps

// Configuration:
// - Token being sold
// - Price (in PHASOR, USDC, or MON)
// - Hard cap (max raise)
// - Soft cap (min raise for success)
// - Individual min/max purchase
// - Sale duration (start/end timestamps)
// - Whitelist merkle root (optional)

// Functions:
// - contribute(amount) - Buy tokens
// - claim() - Claim purchased tokens (after sale ends)
// - refund() - Get refund if sale fails or oversubscribed
// - finalize() - Project owner finalizes sale, receives funds
3. LBPLaunch.sol (New)


// Location: packages/core/contracts/launchpad/LBPLaunch.sol
// Base: Simplified Balancer V1 LBP

// Configuration:
// - Token pair (PROJECT_TOKEN / PHASOR)
// - Initial weights (e.g., 95% / 5%)
// - Final weights (e.g., 50% / 50%)
// - Weight change duration (e.g., 72 hours)
// - Starting balances

// Mechanism:
// - Acts as AMM pool with changing weights
// - Price = (reserveOut/weightOut) / (reserveIn/weightIn)
// - As weight shifts, price drops even without buys
// - Built-in slippage protection
4. TieredLaunch.sol (New)


// Location: packages/core/contracts/launchpad/TieredLaunch.sol
// Purpose: Multi-tier sales with allocation based on stake

// Tiers:
// 1. Whitelist: Merkle proof verification
// 2. Staker: Allocation = (user_xPHASOR / total_xPHASOR) * pool
// 3. Public: FCFS with individual caps

// Functions:
// - contributeWhitelist(proof, amount) - Tier 1 purchase
// - contributeStaker(amount) - Tier 2 purchase (checks xPHASOR)
// - contributePublic(amount) - Tier 3 purchase
// - progressToNextTier() - Advance sale stage
5. VestingVault.sol (New)


// Location: packages/core/contracts/launchpad/VestingVault.sol
// Purpose: Hold and vest purchased tokens

// Configuration per user:
// - Total purchased amount
// - TGE (token generation event) unlock %
// - Cliff duration
// - Vesting duration
// - Vesting interval (daily/weekly/monthly)

// Functions:
// - getClaimable(user) - Calculate unlocked tokens
// - claim() - Withdraw unlocked tokens
// - schedule(user) - View vesting schedule
Launchpad Fee Structure
Platform Fee: 2% of funds raised (paid in raise currency)
Token Requirement: Project must provide 5% of supply to PHASOR treasury
Liquidity Lock: 50% of raise must go to DEX liquidity (locked 6 months)
6. Frontend Implementation (Week 2)
Philosophy: Copy Existing Patterns
Your codebase already has great patterns:

useSwap.ts - Perfect template for farm hooks
SwapCard.tsx - Copy for FarmCard.tsx
AddLiquidityCard.tsx - Copy for StakeModal.tsx
Strategy: Don't reinvent, duplicate and modify.

New Pages/Routes
A. /farms - Yield Farming Dashboard (ONLY page needed for MVP)


Components (MVP - Keep it simple):
├─ FarmList.tsx - Table of 4 farms with APR, TVL, your stake
├─ FarmCard.tsx - Expandable row with deposit/withdraw/harvest
└─ (No separate modals - inline forms are faster to build)

Hooks (Copy from useSwap.ts pattern):
├─ useFarms.ts - Fetch 4 pools from MasterChef
├─ useUserFarmPositions.ts - User's staked amounts
├─ useFarmActions.ts - deposit(), withdraw(), harvest() combined
└─ usePendingRewards.ts - Claimable PHASOR per pool
Implementation Time: Day 8-10 (3 days)

Day 8: Build FarmList + FarmCard components
Day 9: Write farm hooks (copy useSwap patterns)
Day 10: Integration, styling, testing
What to Copy:


// packages/phasor-dex/hooks/useSwap.ts:37-95
// This is PERFECT template for farm hooks
// Replace:
// - inputToken/outputToken → lpToken
// - swap() → deposit()/withdraw()
// - quote → pendingRewards
B. (OPTIONAL) /airdrop - Claim Page


Optional - users can claim via Etherscan
If time permits (Day 11):
├─ ClaimAirdrop.tsx - Merkle proof verification + claim button
└─ useAirdropClaim.ts - Check eligibility, claim function
C. NO OTHER PAGES FOR MVP

No /stake (not building xPHASOR yet)
No /launchpad (post-MVP feature)
No /governance (way post-MVP)
Navigation Updates
File: packages/phasor-dex/components/layout/Header.tsx

Add to NAV_ITEMS (30 seconds):


{ label: "Farms", href: "/farms" },
// That's it for MVP
Configuration Updates (Critical Files)
File: packages/phasor-dex/config/chains.ts


export const CONTRACTS = {
  FACTORY: "0x1780bCf4103D3F501463AD3414c7f4b654bb7aFd", // existing
  ROUTER: "0x...", // existing
  WMON: "0x...", // existing
  // NEW for MVP:
  PHASOR: "0x...", // Deploy day 2
  MASTER_CHEF: "0x...", // Deploy day 5
  MERKLE_DISTRIBUTOR: "0x...", // Deploy day 3 (optional)
};
File: packages/phasor-dex/config/abis.ts


// NEW - Add these 2 ABIs only
export const PHASOR_ABI = erc20Abi; // It's just ERC20, use viem's built-in
export const MASTER_CHEF_ABI = [...]; // Copy from MasterChef.sol after compile
File: packages/phasor-dex/types/index.ts


// NEW types for MVP (minimal)
export interface Farm {
  pid: number;
  lpToken: Address;
  token0: Token;
  token1: Token;
  allocPoint: bigint;
  totalStaked: bigint;
  apr: number; // calculated client-side
}

export interface UserFarmPosition {
  pid: number;
  stakedAmount: bigint;
  pendingReward: bigint;
}

// That's it - no Launch types, no Vesting types (not building those yet)
Token List Update
File: packages/phasor-dex/public/tokenlist.json

Add PHASOR (after deploy):


{
  "chainId": 10143,
  "address": "0x...", // Fill in after deployment
  "name": "Phasor Token",
  "symbol": "PHASOR",
  "decimals": 18,
  "logoURI": "ipfs://..." // Or host on your domain
}
7. Subgraph Extensions (Optional for MVP)
MVP Decision: SKIP SUBGRAPH INITIALLY
Why Skip:

Adds 2-3 days of work
Frontend can query contracts directly (your existing pattern)
Subgraph is for UX optimization, not required functionality
Can add in week 3 after launch
What You Lose:

Historical farm APR charts
Total value locked aggregation
User position history
What Still Works:

Real-time farm data (query MasterChef directly)
User positions (query userInfo)
APR calculation (client-side from emissions + TVL)
Post-MVP (Week 3):
Add minimal subgraph entities:


type Farm @entity {
  id: ID!
  pid: BigInt!
  lpToken: Bytes!
  allocPoint: BigInt!
  totalStaked: BigDecimal!
}

type FarmPosition @entity {
  id: ID! # user-pid
  user: Bytes!
  farm: Farm!
  amount: BigDecimal!
  rewardsEarned: BigDecimal!
}
Mappings: Just Deposit, Withdraw, Harvest events from MasterChef

Deployment: Use existing packages/v2-subgraph/scripts/deploy-local.sh pattern

8. 2-Week Deployment Strategy
WEEK 1: Smart Contracts (Day 1-7)
Day 1-2: PHASOR Token
Tasks:

Create packages/core/contracts/PhasorToken.sol
Copy OpenZeppelin ERC20 + ERC20Permit + Ownable
Write basic tests (packages/core/test/PhasorToken.t.sol)
Deploy to Anvil local, test transfers/approvals/permits
Deliverable: Working token contract with tests passing

Day 3-5: MasterChef
Tasks:

Fork SushiSwap MasterChef V2 into packages/core/contracts/MasterChef.sol
Modify constructor (PHASOR address, Safe as owner)
Add Pausable from OpenZeppelin
Write comprehensive tests (packages/core/test/MasterChef.t.sol):
Deposit LP tokens
Withdraw LP tokens
Harvest rewards
Multiple users, multiple pools
Emergency withdraw
Owner functions (add/set pool, pause)
Deploy to Anvil, test full flows
Deliverable: Working MasterChef with tests passing

Day 6: Testnet Deployment
Tasks:

Update cannonfile.toml with PHASOR + MasterChef
Deploy to Monad testnet
Setup Safe multisig (if not already)
Safe transfers 400M PHASOR to MasterChef
Safe calls MasterChef.add() for 4 pools:
WMON-USDC (40%)
WMON-PHASOR (35%)
WMON-USDT (20%)
WMON-WETH (5%)
Create WMON-PHASOR liquidity (50M PHASOR from Safe)
Deliverable: Contracts live on testnet, farms active

Day 7: Testing & Merkle Tree
Tasks:

Test deposit/withdraw/harvest on testnet with your own wallet
Query subgraph for historical LP holders
Generate airdrop eligibility list (CSV)
Create merkle tree with @uniswap/merkle-distributor-cli
Deploy MerkleDistributor (optional)
Write down all contract addresses for frontend config
Deliverable: Tested contracts, airdrop ready (optional)

WEEK 2: Frontend (Day 8-14)
Day 8-9: Farm Components
Tasks:

Create packages/phasor-dex/app/farms/page.tsx
Create packages/phasor-dex/components/farm/FarmList.tsx
Create packages/phasor-dex/components/farm/FarmCard.tsx
Copy-paste patterns from SwapCard.tsx and AddLiquidityCard.tsx
Add "Farms" to navigation in Header.tsx
Deliverable: UI components rendering (no data yet)

Day 10: Farm Hooks
Tasks:

Create packages/phasor-dex/hooks/useFarms.ts
Query MasterChef.poolLength()
Query MasterChef.poolInfo(pid) for each pool
Fetch LP token addresses, get pair data
Calculate TVL from reserves
Create packages/phasor-dex/hooks/useUserFarmPositions.ts
Query MasterChef.userInfo(pid, userAddress)
Query MasterChef.pendingReward(pid, userAddress)
Create packages/phasor-dex/hooks/useFarmActions.ts
deposit(pid, amount)
withdraw(pid, amount)
harvest(pid)
Handle approvals (LP token → MasterChef)
Calculate APR client-side:

const yearlyRewards = rewardPerBlock * blocksPerYear * poolAllocPoint / totalAllocPoint
const rewardValue = yearlyRewards * phasorPrice
const apr = (rewardValue / poolTVL) * 100
Deliverable: Working farm interactions (deposit/withdraw/harvest)

Day 11-12: Integration & Testing
Tasks:

Update packages/phasor-dex/config/chains.ts with contract addresses
Update packages/phasor-dex/config/abis.ts with MasterChef ABI
Add PHASOR to packages/phasor-dex/public/tokenlist.json
Add types to packages/phasor-dex/types/index.ts
End-to-end testing on testnet:
Connect wallet
See 4 farms with APRs
Deposit LP tokens (you need existing LP positions)
Harvest rewards
Withdraw LP tokens
Fix bugs, polish UI, add loading states
Mobile responsive check
Deliverable: Fully functional /farms page on testnet

Day 13: Mainnet Deployment
Tasks:

Final security review of contracts
Deploy PHASOR to Monad mainnet
Deploy MasterChef to mainnet
Verify contracts on Monad explorer
Safe transfers 400M PHASOR to MasterChef
Safe adds 4 farm pools
Safe creates WMON-PHASOR liquidity (50M PHASOR)
Deploy MerkleDistributor with 100M PHASOR (optional)
Update frontend config with mainnet addresses
Deploy frontend to production (Vercel/your hosting)
Test on mainnet with small amounts
Deliverable: Live on mainnet!

Day 14: Launch & Monitor
Tasks:

Announce launch on Twitter/Discord
Share PHASOR contract address
Share farms link
Monitor for bugs, user feedback
Watch TVL grow
Be ready to pause via Safe if issues arise
Collect metrics (users, deposits, APRs)
Deliverable: Successful MVP launch, live farms earning yield

Emergency Procedures
If Critical Bug Found:

Safe calls MasterChef.pause() immediately
Assess impact, develop fix
Deploy new MasterChef (keep PHASOR same)
Safe transfers PHASOR to new MasterChef
Communicate with users, migrate positions
If Gas Costs Too High:

Optimize batch operations (updatePool before mass deposits)
Consider gas rebates from treasury
Document gas costs in UI
If APRs Too Low/High:

Safe calls MasterChef.setRewardPerBlock() to adjust
Safe calls MasterChef.set(pid, newAllocPoint) to rebalance pools
Monitor for 24h, iterate
9. Testing Strategy (Minimal for Speed)
Smart Contract Tests (Foundry)
Priority Tests (must pass before deploy):


packages/core/test/
├─ PhasorToken.t.sol - Transfer, approve, permit (1 hour)
└─ MasterChef.t.sol - Deposit, withdraw, harvest, rewards math (4 hours)
Test Focus:

PhasorToken: Basic ERC20 + permit functionality
MasterChef: Core scenarios:
Single user deposits → harvests → withdraws
Multiple users, reward distribution is proportional
Adding pools, changing allocations
Emergency withdraw (user loses pending rewards)
Pause/unpause by owner
Run Tests:


cd packages/core
forge test -vvv
Gas Benchmarks:

Deposit: ~100-150k gas
Withdraw: ~80-120k gas
Harvest: ~60-100k gas
Emergency Withdraw: ~50k gas
Frontend Testing (Manual Only for MVP)
Skip automated E2E tests - they take 2 days to setup

Manual Testing Checklist:

 Connect wallet on testnet
 See 4 farms with correct token pairs
 Approve LP token
 Deposit LP tokens
 See staked balance update
 See pending rewards increase over time
 Harvest rewards, receive PHASOR
 Withdraw LP tokens
 Emergency withdraw works
 Test on mobile (responsive)
Time: 2-3 hours of manual testing on Day 11

10. Security Considerations (MVP Focus)
Why MVP is Lower Risk
No custom math: Using SushiSwap's proven MasterChef
Fixed supply token: No minting = no supply manipulation
No oracles: Rewards are time-based, no external price feeds
No flash loan surface: Can't borrow LP tokens
Simple architecture: Token + staking contract only
Critical Security Checks
Before Deployment:

✅ Solidity 0.8.20+: Built-in overflow protection
✅ OpenZeppelin imports: Battle-tested base contracts
✅ Safe as owner: No EOA with admin rights
✅ Pausable: Emergency stop mechanism
✅ Fixed supply: Token can't be minted after deployment
MasterChef Specific:

✅ Reward debt prevents double-claiming (SushiSwap's math)
✅ Emergency withdraw doesn't depend on calculations
✅ Owner functions protected by onlyOwner (Safe)
✅ No delegatecall (safer)
Known Risks (Acceptable for MVP):

No audit: MasterChef is SushiSwap's code (audited), but our deployment isn't
Mitigation: Start with low TVL, monitor closely
Safe key management: If Safe compromised, attacker can drain MasterChef
Mitigation: Use hardware wallets, geographic distribution of signers
Contract bugs: Even forks can have integration issues
Mitigation: Comprehensive testing, pause function, start small
Post-Launch Monitoring
Day 1-7 Watch List:

Unexpected reward distributions
Users unable to withdraw
Gas costs exceeding estimates
Exploits discovered in SushiSwap MasterChef (monitor their Discord)
Safe Actions Available:

pause() - Stop all deposits/withdraws
setRewardPerBlock(0) - Stop emissions
Transfer remaining PHASOR out of MasterChef (if needed)
Audit Plan (Post-MVP)
Week 3-4: Get professional audit

Recommended: Sherlock, Code4rena (competitive audits, $5-15K)
Alternative: Internal review by experienced Solidity dev
Publish report publicly
Until audit: Keep TVL <$500K, make users aware it's unaudited MVP

11. Success Metrics (2 Weeks Post-Launch)
Target Goals (Realistic for MVP)
Primary Metrics:

TVL: $250K-$1M across all farms (depends on PHASOR price)
Unique Farmers: 50-200 users
PHASOR Price: $0.01-$0.05 (depends on initial liquidity depth)
Daily Harvest Transactions: 20-100
Health Indicators:

Zero critical bugs
<5% user complaints about UX
Gas costs within acceptable range (<$2 per transaction)
APRs competitive with other farms (100-500%)
Simple Monitoring (No Fancy Dashboards Needed)
Manual Daily Checks:

Open /farms page
Check TVL is increasing
Check APRs are reasonable
Scan Discord/Twitter for bug reports
Check Safe has enough MON for gas
On-Chain Checks (via Etherscan-style explorer):


MasterChef.totalAllocPoint() - should be 100
MasterChef.rewardPerBlock() - should be ~11.4K PHASOR
PHASOR.balanceOf(MasterChef) - should be decreasing as rewards paid
Week 2-4: Add basic analytics (Dune or custom subgraph)

12. Go-to-Market (Simple MVP Launch)
Pre-Launch (Day 12-13)
Minimal Marketing (you're solo, keep it simple):

Tweet announcing launch date
Post in relevant Monad/DeFi communities
Share contract addresses once deployed
Document: "Farms launching [date], 4 pools, 400M PHASOR over 4 years"
Launch Day (Day 14)
Announcement:


🚀 Phasor Farms are LIVE!

Earn PHASOR by staking LP tokens:
- WMON-USDC: 40% APR
- WMON-PHASOR: 35% APR
- WMON-USDT: 20% APR
- WMON-WETH: 5% APR

[Link to farms]

⚠️ Unaudited MVP - start with small amounts
Launch Checklist:

 Contracts deployed and verified
 Frontend live
 Tweet sent
 Monitoring active
 Safe signers ready for emergency actions
First Week Post-Launch
Respond to user feedback
Fix minor UI bugs
Share TVL milestones
Thank early farmers
Monitor for security issues
NO big marketing yet - you want to find bugs with small TVL first

13. Post-MVP Roadmap (Week 3+)
Week 3-4: Staking (xPHASOR)
Goal: Let users stake PHASOR to earn fee share

Contracts:

xPHASOR.sol (fork SushiBar)
FeeDistributor.sol
Enable factory.setFeeTo()
Frontend:

/stake page
Stake/unstake PHASOR
View claimable fees
Value: Revenue sharing attracts long-term holders

Week 5-6: Launchpad (Fair Launch Only)
Goal: First token launch on platform

Contracts:

LaunchpadFactory.sol
FairLaunch.sol (fixed price model)
VestingVault.sol
Frontend:

/launchpad page
Create launch (admin)
Participate in sale (users)
Claim tokens with vesting
Value: Platform revenue (2% fee), attracts projects

Week 7-8: Boosted Rewards
Goal: Reward PHASOR stakers with higher farm yields

Logic: Add boost calculation to MasterChef:


boostedReward = baseReward * min(2.5, 1 + staked_PHASOR / (LP_value * 0.4))
Value: Incentivizes PHASOR staking, reduces sell pressure

Week 9-10: Audit & Optimization
Goal: Get security audit, optimize gas

Actions:

Professional audit (Sherlock/Code4rena)
Fix findings
Gas optimization pass
Expand TVL cap
Value: Trust, safety, readiness to scale

Week 11-12: Advanced Features
Liquidity bootstrapping pools (LBP)
Tiered launchpad sales
Trading fee discounts for stakers
Governance (snapshot voting)
14. Risks & Mitigation (MVP)
MVP-Specific Risks
Risk	Impact	Likelihood	Mitigation
Unaudited contracts	Critical	Medium	Start with low TVL cap ($500K), monitor closely, audit in week 3
Solo dev burnout	High	High	Ruthlessly prioritize, ask for help, iterate post-launch
Low user adoption	Medium	Medium	Market in Monad community, competitive APRs, good UX
Safe key loss	Critical	Low	Multiple signers, hardware wallets, backup recovery process
PHASOR dump after airdrop	Medium	High	Lock airdrop for 1 week, smaller initial airdrop, focus on farmers
Gas costs prohibitive	Medium	Low	Monad is fast/cheap, but batch operations in MasterChef
Missing 2-week deadline	High	Medium	Cut scope aggressively, delay airdrop, skip subgraph
14. Post-MVP Roadmap
Phase 2 Features (3-6 months post-launch)
Governance: Snapshot voting for parameter changes
Limit Orders: Off-chain order book
Concentrated Liquidity: Uniswap V3 style pools
Cross-chain Bridge: Expand to other L1s/L2s
Leveraged Farming: Borrow to farm (with collateral)
Phase 3 Features (6-12 months)
Options Trading: DOPEX-style options vaults
NFT Marketplace: Trade NFTs, use as collateral
Perpetual Swaps: Leverage trading with funding rates
Insurance Fund: Protect against smart contract failures
15. Critical Files (2-Week MVP Only)
New Smart Contracts

packages/core/contracts/
├─ PhasorToken.sol (Day 1-2)
├─ MasterChef.sol (Day 3-5)
└─ MerkleDistributor.sol (Day 7, optional)
New Tests

packages/core/test/
├─ PhasorToken.t.sol (Day 2)
└─ MasterChef.t.sol (Day 3-5)
Frontend - New Page

packages/phasor-dex/app/
└─ farms/page.tsx (Day 8-9)
Frontend - New Components

packages/phasor-dex/components/
└─ farm/
    ├─ FarmList.tsx (Day 8)
    └─ FarmCard.tsx (Day 9)
Frontend - New Hooks

packages/phasor-dex/hooks/
├─ useFarms.ts (Day 10)
├─ useUserFarmPositions.ts (Day 10)
└─ useFarmActions.ts (Day 10)
Frontend - Config Updates

packages/phasor-dex/
├─ config/chains.ts (MODIFY - add PHASOR, MASTER_CHEF)
├─ config/abis.ts (MODIFY - add MASTER_CHEF_ABI)
├─ types/index.ts (MODIFY - add Farm types)
├─ public/tokenlist.json (MODIFY - add PHASOR)
└─ components/layout/Header.tsx (MODIFY - add Farms link)
Deployment Files (Modify Existing)

cannonfile.toml or cannonfile.local.toml (MODIFY)
script/deploy-local.sh (reference for deployment flow)
Total New Files: ~10-12 files
Modified Files: ~5 files
Lines of Code: ~1500-2000 (mostly copy-paste from SushiSwap/OZ)

16. Day-by-Day Execution Plan
WEEK 1: Contracts
Day 1 (Monday):

 Setup: Fork SushiSwap MasterChef repo locally
 Create PhasorToken.sol (copy OpenZeppelin)
 Write basic tests for PhasorToken
 Deploy to Anvil, test locally
Deliverable: Working PHASOR token
Day 2 (Tuesday):

 Copy MasterChef.sol from SushiSwap
 Modify constructor (PHASOR address, Safe owner)
 Add Pausable from OpenZeppelin
 Remove SushiSwap-specific features (rewarders, complex rewards)
Deliverable: Modified MasterChef.sol
Day 3 (Wednesday):

 Write MasterChef tests (deposit, withdraw)
 Test reward calculations
 Test multiple users
 Test owner functions
Deliverable: Passing tests
Day 4 (Thursday):

 Test emergency withdraw
 Test pause/unpause
 Gas optimization pass
 Review security checklist
Deliverable: Production-ready contracts
Day 5 (Friday):

 Deploy PHASOR to Monad testnet
 Deploy MasterChef to testnet
 Verify contracts on explorer
 Document all addresses
Deliverable: Testnet deployment
Day 6 (Saturday):

 Setup Safe multisig (if not done)
 Safe transfers 400M PHASOR to MasterChef
 Get existing LP token addresses for 4 pairs
 Safe calls MasterChef.add() for 4 pools
 Create WMON-PHASOR liquidity (50M PHASOR)
Deliverable: Farms configured on testnet
Day 7 (Sunday):

 Test deposit/withdraw with your wallet
 Test harvest rewards
 Verify APR calculations manually
 (Optional) Generate airdrop merkle tree
 (Optional) Deploy MerkleDistributor
Deliverable: Tested, working farms
WEEK 2: Frontend
Day 8 (Monday):

 Create /app/farms/page.tsx
 Create FarmList component (table layout)
 Create FarmCard component (expandable row)
 Add "Farms" to Header navigation
 Basic styling (copy from pools page)
Deliverable: UI rendering (no data)
Day 9 (Tuesday):

 Create useFarms.ts hook
 Query MasterChef for pool info
 Fetch LP token details for each pool
 Calculate TVL from reserves
 Display farms in UI
Deliverable: Farms displaying with data
Day 10 (Wednesday):

 Create useUserFarmPositions.ts hook
 Create useFarmActions.ts hook (deposit/withdraw/harvest)
 Implement approval flow for LP tokens
 Calculate APR client-side
 Add deposit/withdraw forms to FarmCard
Deliverable: Full farming functionality
Day 11 (Thursday):

 Update config/chains.ts with mainnet addresses (TBD)
 Update config/abis.ts with MasterChef ABI
 Add PHASOR to tokenlist.json
 Add types to types/index.ts
 End-to-end testing on testnet
 Fix bugs, polish UI
Deliverable: Ready for mainnet
Day 12 (Friday):

 More testing, edge cases
 Mobile responsive check
 Add loading states, error handling
 Add tooltips, help text
 Performance check (slow queries?)
Deliverable: Polished UI
Day 13 (Saturday - DEPLOY DAY):

 Final security review
 Deploy PHASOR to Monad mainnet
 Deploy MasterChef to mainnet
 Verify contracts
 Safe transfers 400M PHASOR to MasterChef
 Safe adds 4 farm pools
 Safe creates WMON-PHASOR liquidity
 Update frontend config with mainnet addresses
 Deploy frontend to production
 Test with small amounts
Deliverable: LIVE ON MAINNET
Day 14 (Sunday - LAUNCH DAY):

 Final testing
 Announce launch on Twitter
 Share links in communities
 Monitor for bugs
 Watch TVL grow
 Respond to user feedback
 Celebrate! 🎉
Deliverable: Successful MVP launch
17. Quick Reference: What We're Building
MVP Scope (2 Weeks)
✅ PHASOR Token - Fixed supply ERC20 with permit
✅ MasterChef Farming - 4 pools, LP staking, PHASOR rewards
✅ Frontend - /farms page, deposit/withdraw/harvest
✅ Safe Integration - Multisig controls pools and emissions

NOT in MVP (Post-Launch)
❌ xPHASOR staking
❌ Fee distribution
❌ Boosted rewards
❌ Launchpad
❌ Governance
❌ Subgraph (initially)
❌ Professional audit (week 3-4)

Key Decisions
Fork Strategy: SushiSwap MasterChef V2 (audited, proven)
Token Supply: 1B fixed (no minting)
Initial Pools: 4 only (WMON pairs)
Distribution: Safe controls 450M, MasterChef has 400M, airdrop 100M, liquidity 50M
Timeline: 7 days contracts, 7 days frontend
Launch Strategy: Soft launch, find bugs with low TVL, scale after audit
18. Resources & Battle-Tested Code
Must Copy From These Repos
1. PhasorToken.sol


Source: OpenZeppelin Contracts v5.0.0
File: contracts/token/ERC20/ERC20.sol
      contracts/token/ERC20/extensions/ERC20Permit.sol
      contracts/access/Ownable.sol
URL: https://github.com/OpenZeppelin/openzeppelin-contracts
2. MasterChef.sol


Source: SushiSwap MasterChef V2
File: contracts/MasterChefV2.sol
URL: https://github.com/sushiswap/sushiswap/blob/master/protocols/masterchef/contracts/MasterChefV2.sol
Audit: Quantstamp, PeckShield
3. MerkleDistributor.sol (Optional)


Source: Uniswap Merkle Distributor
File: contracts/MerkleDistributor.sol
URL: https://github.com/Uniswap/merkle-distributor
Tool: @uniswap/merkle-distributor-cli
Testing References
SushiSwap MasterChef tests
OpenZeppelin test suite
Your existing useSwap.ts pattern for frontend hooks
19. Emergency Contacts & Contingencies
If You Get Stuck
Smart Contracts:

OpenZeppelin forum: https://forum.openzeppelin.com/
SushiSwap Discord: https://discord.gg/sushiswap
Foundry TG: https://t.me/foundry_rs
Frontend:

wagmi GitHub discussions
Your existing codebase (great patterns already!)
Deployment:

Cannon documentation
Your existing deploy scripts work great
If You Need to Delay Launch
Acceptable to Skip:

Airdrop (can do after launch)
4th farm pool (start with 3)
Perfect UI polish
Subgraph integration
NOT Acceptable to Skip:

Testing (must work on testnet)
Security review (at least basic checklist)
Safe multisig setup
Contract verification
Backup Plan: 1-Week Delay
If you need 3 weeks instead of 2:

Week 1-2: Contracts (same)
Week 3: Frontend + deploy
Gives buffer for testing and bug fixes
20. Final Checklist (Pre-Launch)
Contracts ✓
 PhasorToken compiles, tests pass
 MasterChef compiles, tests pass
 Deployed to testnet
 Verified on explorer
 Safe is owner of both
 400M PHASOR in MasterChef
 4 pools added with correct allocations
 WMON-PHASOR liquidity created (50M)
Frontend ✓
 /farms page renders
 Farms display with data
 Deposit works
 Withdraw works
 Harvest works
 APRs calculate correctly
 Mobile responsive
 Config updated with mainnet addresses
Security ✓
 No private keys in code
 Safe has 3+ signers
 Safe signers tested transaction approval
 Pause function tested
 Emergency procedures documented
 Users warned about unaudited status
Launch ✓
 Tweet drafted
 Community posts ready
 Monitoring plan in place
 Safe signers available for 24h
 Backup plan if bugs found
Summary
This is an aggressive but achievable 2-week sprint to launch farming on Phasor DEX. Success depends on:

Ruthless prioritization - Only PHASOR + MasterChef + basic UI
Copy battle-tested code - Don't reinvent, fork SushiSwap/OZ
Safe integration - Multisig controls everything critical
Iterate post-launch - Ship MVP, add features weekly after
You have the skills (Solidity, deployment, React), the infrastructure (working DEX, Safe, testnet), and now the plan. Let's ship it! 🚀

Ready to Start?
When you're ready to begin implementation, we'll work together day-by-day following this plan. I can help with:

Writing the smart contracts (PhasorToken, MasterChef)
Creating tests
Setting up deployment scripts
Building frontend components
Writing hooks
Debugging issues
Optimizing gas costs
Let's ship this MVP in 2 weeks! 💪

