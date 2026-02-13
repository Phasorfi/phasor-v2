# Smart Contracts Documentation

## Overview

The Phasor DEX smart contracts are organized into three packages:

1. **core** - Uniswap V2 AMM (forked, do not modify)
2. **periphery** - Router and helpers (forked, do not modify)
3. **phasor-contracts** - Custom PHASOR ecosystem

## Uniswap V2 DEX (Forked)

### UniswapV2Factory

Creates and tracks trading pairs.

```solidity
// Create a new pair
function createPair(address tokenA, address tokenB) external returns (address pair);

// Get pair address
function getPair(address tokenA, address tokenB) external view returns (address pair);

// Get all pairs
function allPairs(uint256 index) external view returns (address pair);
function allPairsLength() external view returns (uint256);
```

### UniswapV2Pair

AMM pool implementing constant product formula (x * y = k).

```solidity
// Get reserves
function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

// Mint LP tokens (called by Router)
function mint(address to) external returns (uint256 liquidity);

// Burn LP tokens (called by Router)
function burn(address to) external returns (uint256 amount0, uint256 amount1);

// Execute swap (called by Router)
function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
```

### UniswapV2Router02

User-facing contract for swaps and liquidity operations.

```solidity
// Swap exact tokens for tokens
function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external returns (uint256[] memory amounts);

// Add liquidity
function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

// Remove liquidity
function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB);
```

---

## PHASOR Ecosystem (Custom)

Located in `packages/phasor-contracts/contracts/`

### PhasorToken

**Path**: `token/PhasorToken.sol`

ERC20 governance token with controlled minting.

| Property | Value |
|----------|-------|
| Name | Phasor Token |
| Symbol | PHASOR |
| Decimals | 18 |
| Max Supply | 1,000,000,000 (1 billion) |
| Initial Supply | 100,000,000 (100 million) |

```solidity
// Only owner (MasterChef) can mint
function mint(address to, uint256 amount) external onlyOwner;

// Check max supply
uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;
```

**Ownership**: After deployment, ownership is transferred to MasterChef so it can mint rewards.

### MasterChef

**Path**: `farming/MasterChef.sol`

Yield farming contract distributing PHASOR rewards to LP stakers. Based on SushiSwap V2 pattern.

| Parameter | Value |
|-----------|-------|
| Reward Rate | 100 PHASOR per block |
| Total Pools | 6 (configurable) |

**Pool Structure**:
```solidity
struct PoolInfo {
    IERC20 lpToken;           // LP token contract
    uint256 allocPoint;       // Allocation points (share of rewards)
    uint256 lastRewardBlock;  // Last block rewards were calculated
    uint256 accPhasorPerShare; // Accumulated PHASOR per share (scaled by 1e12)
}
```

**Key Functions**:
```solidity
// Deposit LP tokens to earn PHASOR
function deposit(uint256 _pid, uint256 _amount) external;

// Withdraw LP tokens (also harvests rewards)
function withdraw(uint256 _pid, uint256 _amount) external;

// Emergency withdraw without rewards
function emergencyWithdraw(uint256 _pid) external;

// View pending rewards
function pendingPhasor(uint256 _pid, address _user) external view returns (uint256);

// Admin: Add new pool
function add(uint256 _allocPoint, IERC20 _lpToken) external onlyOwner;
```

**Reward Calculation**:
```
pending = (user.amount * pool.accPhasorPerShare / 1e12) - user.rewardDebt
```

**Default Pools** (set by deploy script):

| Pool ID | Pair | Allocation | Share |
|---------|------|------------|-------|
| 0 | WMON-USDC | 4000 | 40% |
| 1 | WMON-USDT | 2000 | 20% |
| 2 | WMON-WETH | 2000 | 20% |
| 3 | WMON-WBTC | 1000 | 10% |
| 4 | WMON-SOL | 500 | 5% |
| 5 | WMON-FOLKS | 500 | 5% |

### LaunchpadFactory

**Path**: `launchpad/LaunchpadFactory.sol`

Factory for creating FairLaunch token sales using EIP-1167 clone pattern.

```solidity
struct CreateLaunchParams {
    address saleToken;        // Token being sold
    address paymentToken;     // Payment token (address(0) for ETH)
    uint256 totalTokens;      // Total tokens for sale
    uint256 tokensForLiquidity; // Tokens reserved for LP
    uint256 startTime;        // Sale start timestamp
    uint256 endTime;          // Sale end timestamp
    uint256 softCap;          // Minimum raise (0 = no minimum)
    uint256 hardCap;          // Maximum raise (0 = no maximum)
    uint256 vestingDuration;  // Vesting period (0 = no vesting)
    uint256 vestingCliff;     // Cliff before vesting starts
    uint256 liquidityBps;     // % of raise for liquidity (basis points)
}

// Create a new fair launch
function createFairLaunch(CreateLaunchParams calldata params) external returns (address launch);

// View functions
function getAllLaunches() external view returns (address[] memory);
function getLaunchesByCreator(address creator) external view returns (address[] memory);
function launchCount() external view returns (uint256);
```

**Platform Fee**: 2% (200 basis points), configurable by owner.

### FairLaunch

**Path**: `launchpad/FairLaunch.sol`

Individual token sale with pro-rata distribution.

**Sale Lifecycle**:
1. **Created** - Sale configured, tokens deposited
2. **Active** - Users can commit ETH/tokens
3. **Ended** - Sale period finished
4. **Finalized** - Creator finalizes, LP created
5. **Claimable** - Users claim tokens (or refund if soft cap not met)

```solidity
// Commit funds to the sale
function commit(uint256 minAllocation) external payable;

// Finalize sale (creator only, after end time)
function finalize() external;

// Claim tokens after finalization
function claim() external;

// Withdraw if soft cap not met or sale cancelled
function withdraw() external;

// Cancel sale (creator only, before finalization)
function cancel() external;

// View allocation
function getAllocation(address user) external view returns (uint256);
```

**Pro-rata Distribution**:
```
userAllocation = (userCommitment / totalRaised) * totalTokens
```

### TokenVesting

**Path**: `launchpad/TokenVesting.sol`

Linear vesting contract with cliff support.

```solidity
// View vested amount
function releasable() external view returns (uint256);

// Release vested tokens
function release() external;

// View parameters
function beneficiary() external view returns (address);
function totalAmount() external view returns (uint256);
function released() external view returns (uint256);
```

**Vesting Formula**:
```
if (block.timestamp < start + cliff) return 0;
vested = totalAmount * (block.timestamp - start) / duration;
releasable = vested - released;
```

---

## Deployment Order

Contracts must be deployed in this order (handled by Cannon):

```
1. WMON (Wrapped Monad)
2. UniswapV2Factory
3. UniswapV2Router02
4. Mock Tokens (USDC, USDT, WETH, WBTC, SOL, FOLKS)
5. PhasorToken
6. MasterChef (receives PhasorToken ownership)
7. FairLaunchTemplate
8. LaunchpadFactory
```

---

## Contract Interactions

### Swap Flow
```
User → Router.swapExactTokensForTokens()
         → Pair.swap()
            → Transfer tokens
            → Emit Swap event
```

### Add Liquidity Flow
```
User → Router.addLiquidity()
         → Factory.getPair() or createPair()
         → Transfer tokens to Pair
         → Pair.mint()
            → Mint LP tokens to user
            → Emit Mint event
```

### Farming Flow
```
User → MasterChef.deposit(poolId, amount)
         → Transfer LP tokens to MasterChef
         → Calculate and mint pending PHASOR rewards
         → Update reward debt
         → Emit Deposit event
```

### Fair Launch Flow
```
Creator → LaunchpadFactory.createFairLaunch(params)
            → Clone FairLaunch template
            → Transfer sale tokens to clone
            → Emit LaunchCreated

Users → FairLaunch.commit{value: amount}()
          → Record commitment
          → Emit Committed

Creator → FairLaunch.finalize() (after end time)
            → Calculate liquidity amount
            → Add liquidity via Router
            → Lock LP tokens
            → Emit Finalized

Users → FairLaunch.claim()
          → Calculate pro-rata allocation
          → Transfer tokens (or create vesting wallet)
          → Emit Claimed
```

---

## Security Patterns

1. **ReentrancyGuard** - All state-changing functions in MasterChef and FairLaunch
2. **SafeERC20** - All token transfers use OpenZeppelin SafeERC20
3. **Ownable** - Admin functions protected
4. **Clone Pattern** - Gas-efficient deployment via EIP-1167

---

## Testing

Run all tests from repository root:

```bash
forge test                                    # All tests
forge test --match-path "packages/phasor-contracts/test/*.t.sol" -vv  # PHASOR tests only
forge test --gas-report                       # With gas report
```

**Test Coverage**:
- PhasorToken: 4 tests (supply, minting, access control, max supply)
- MasterChef: 6 tests (pools, deposit, harvest, withdraw, multi-user, emergency)
- FairLaunch: 7 tests (basic flow, pro-rata, soft cap, hard cap, vesting, cancel, tracking)
