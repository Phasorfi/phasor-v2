# Phasor Staking System

A dual time-weighted staking system combining Velodrome-style vote-escrowed tokens with Synthetix reward distribution.

## Overview

The staking system consists of three core contracts:

1. **VotingEscrow (vePHASOR)** - Time-locked PHASOR tokens represented as NFTs
2. **StakingRewards** - LP token staking with time and ve-boost multipliers
3. **RewardsDistributor** - Weekly PHASOR emission and distribution

## Architecture

```
                    ┌──────────────────┐
                    │  PhasorToken     │
                    │  (ERC20)         │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │  VotingEscrow   │  │ RewardsDistrib. │  │  StakingRewards │
    │  (vePHASOR)     │  │ (Weekly Emit)   │  │  (LP Staking)   │
    └─────────────────┘  └─────────────────┘  └─────────────────┘
              │                   │                    │
              │                   │                    │
              └───────────────────┴────────────────────┘
                        Boosts rewards
```

## Contracts

### VotingEscrow

**Location:** `contracts/governance/VotingEscrow.sol`

An ERC721-based vote escrow system inspired by Velodrome/Curve. Users lock PHASOR tokens for a period (1 week to 4 years) and receive a veNFT representing their voting power.

**Key Features:**
- NFT-based locks (ERC721Enumerable)
- Linear voting power decay: `votingPower = amount × (remainingTime / MAXTIME)`
- Week-rounded unlock times for gas efficiency
- Lock operations: create, increase amount, increase time, withdraw, merge

**Constants:**
- `WEEK`: 7 days
- `MAXTIME`: 4 years (208 weeks)
- `MIN_LOCK_TIME`: 1 week

**Functions:**
```solidity
// Create a new lock
function createLock(uint256 amount, uint256 unlockTime) external returns (uint256 tokenId)

// Increase locked amount
function increaseAmount(uint256 tokenId, uint256 amount) external

// Extend lock duration
function increaseUnlockTime(uint256 tokenId, uint256 newUnlockTime) external

// Withdraw after lock expires
function withdraw(uint256 tokenId) external

// Merge two locks into one
function merge(uint256 fromTokenId, uint256 toTokenId) external

// View voting power
function balanceOfNFT(uint256 tokenId) external view returns (uint256)
function totalVotingPower() external view returns (uint256)
```

### StakingRewards

**Location:** `contracts/staking/StakingRewards.sol`

Time-weighted LP staking with ve-boost multipliers. Combines:
- Synthetix accumulator pattern for O(1) gas efficiency
- Ampleforth Geyser time-multipliers (1x → 3x over 90 days)
- Velodrome ve-boost (up to 2.5x based on vePHASOR)

**Multiplier System:**

| Component | Formula | Range |
|-----------|---------|-------|
| Time Multiplier | `1 + 2 × (stakingDuration / 90 days)` | 1x → 3x |
| ve-Boost | Velodrome formula (see below) | 1x → 2.5x |
| Combined | `timeMultiplier × veBoost` | 1x → 7.5x |

**ve-Boost Formula (Velodrome-style):**
```
baseAmount = userStaked × 0.4
boostedAmount = totalStaked × (userVeBalance / totalVeSupply) × 0.6
effectiveBalance = min(baseAmount + boostedAmount, userStaked × 2.5)
veBoost = effectiveBalance / userStaked
```

**LIFO Withdrawal:**
Withdrawals use Last-In-First-Out (LIFO) to preserve older deposit timestamps, maximizing time multipliers.

**Functions:**
```solidity
// Stake LP tokens with optional veNFT boost
function stake(uint256 amount, uint256 veTokenId) external

// Withdraw LP tokens (LIFO)
function withdraw(uint256 amount) external

// Claim PHASOR rewards
function getReward() external

// Withdraw all and claim rewards
function exit() external

// Update veNFT used for boost
function updateVeTokenId(uint256 veTokenId) external

// View functions
function getTimeMultiplier(address account) external view returns (uint256)
function getVeBoost(address account) external view returns (uint256)
function getTotalMultiplier(address account) external view returns (uint256)
function earned(address account) external view returns (uint256)
```

### RewardsDistributor

**Location:** `contracts/staking/RewardsDistributor.sol`

Manages weekly PHASOR emissions across multiple staking pools.

**Key Features:**
- Weekly emission: 700,000 PHASOR/week
- Multi-pool support with allocation points
- Keeper role for automated distribution
- Owner can adjust emission rate and pool allocations

**Functions:**
```solidity
// Distribute rewards to all pools (keeper or owner)
function distribute() external

// Add a new staking pool
function addPool(address stakingContract, uint256 allocPoints) external

// Update pool allocation
function updatePool(uint256 pid, uint256 allocPoints) external

// Set weekly emission rate
function setWeeklyEmission(uint256 amount) external

// Set keeper address
function setKeeper(address keeper, bool status) external
```

## Usage Examples

### Creating a vePHASOR Lock

```solidity
// Approve PHASOR for VotingEscrow
phasor.approve(address(votingEscrow), 10000e18);

// Create 1-year lock
uint256 tokenId = votingEscrow.createLock(
    10000e18,                           // 10,000 PHASOR
    block.timestamp + 365 days          // 1 year lock
);

// Check voting power
uint256 votingPower = votingEscrow.balanceOfNFT(tokenId);
```

### Staking LP Tokens with ve-Boost

```solidity
// Approve LP tokens
lpToken.approve(address(stakingRewards), 1000e18);

// Stake with ve-boost (using veNFT tokenId 1)
stakingRewards.stake(1000e18, 1);

// Check multipliers
uint256 timeMult = stakingRewards.getTimeMultiplier(msg.sender);
uint256 veBoost = stakingRewards.getVeBoost(msg.sender);
uint256 totalMult = stakingRewards.getTotalMultiplier(msg.sender);

// After time passes, claim rewards
stakingRewards.getReward();
```

### Withdrawing with LIFO

```solidity
// Multiple deposits over time
stakingRewards.stake(500e18, 0);  // Day 0
// ... 30 days pass ...
stakingRewards.stake(300e18, 0);  // Day 30
// ... 30 days pass ...
stakingRewards.stake(200e18, 0);  // Day 60

// Withdraw 400 tokens
// LIFO removes: 200 from Day 60, then 200 from Day 30
// The Day 0 deposit (500) keeps its 60+ day multiplier
stakingRewards.withdraw(400e18);
```

## Security Features

### Emergency Controls
- `Pausable`: Owner can pause stake/withdraw in emergencies
- `getReward()` remains available when paused
- `recoverERC20()`: Recover accidentally sent tokens (not staking/reward tokens)

### Access Control
- VotingEscrow: Only NFT owner can modify their lock
- StakingRewards: Only users can manage their own stakes
- RewardsDistributor: Only owner/keeper can distribute

### Reentrancy Protection
All contracts use OpenZeppelin's `ReentrancyGuard` on state-modifying functions.

## Deployment

The staking system is deployed via Cannon (see `cannonfile.local-full.toml`):

1. **PhasorToken** - Native token
2. **VotingEscrow** - Depends on PhasorToken
3. **RewardsDistributor** - Depends on PhasorToken (receives ownership)
4. **StakingRewards** - Depends on VotingEscrow, RewardsDistributor

Post-deployment setup:
1. Set staking token on StakingRewards
2. Add StakingRewards pool to RewardsDistributor
3. Transfer PhasorToken ownership to RewardsDistributor

## Testing

Run the test suite:
```bash
forge test --match-path 'packages/phasor-contracts/test/*.sol'
```

Test coverage:
- **VotingEscrow.t.sol** - 24 tests covering all lock operations
- **StakingRewards.t.sol** - 24 tests covering staking and multipliers
- **StakingIntegration.t.sol** - 11 tests covering system integration

## Known Limitations

1. **Time Multiplier Tracking**: The `totalEffectiveSupply` doesn't auto-update when time multipliers increase. This is mitigated by users interacting with the contract regularly.

2. **ve-Boost Updates**: When `totalSupply` changes, existing users' ve-boosts change relative to the pool. The boost is checked live, so users always get their current correct boost.

3. **Week Rounding**: Unlock times are rounded down to week boundaries. A lock created for "1 week" might be slightly less than 7 days.

## References

- [Velodrome Finance](https://docs.velodrome.finance/)
- [Curve Vote Escrow](https://curve.readthedocs.io/dao-vecrv.html)
- [Synthetix StakingRewards](https://github.com/Synthetixio/synthetix/blob/develop/contracts/StakingRewards.sol)
- [Ampleforth Geyser](https://www.ampleforth.org/geyser/)
