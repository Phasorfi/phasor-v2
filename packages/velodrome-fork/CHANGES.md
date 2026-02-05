# Phasor Changes from Velodrome V2

## Overview

This fork of Velodrome V2 contains minimal changes for deployment on Monad as the Phasor DEX staking and governance system.

**Upstream Repository:** https://github.com/velodrome-finance/contracts
**Fork Date:** 2026-02-03

## Changes Summary

| File | Type | Description |
|------|------|-------------|
| `Velo.sol` → `Phasor.sol` | Rename | Token name/symbol change |
| `IVelo.sol` → `IPhasor.sol` | Rename | Interface rename |
| `Minter.sol` | Rebrand | Updated to use IPhasor instead of IVelo |
| `IMinter.sol` | Rebrand | Updated interface references |
| `Gauge.sol` | **CUSTOM FEATURE** | Time multiplier (1x→3x over 90 days) |
| `IGauge.sol` | Interface | Added time multiplier functions |

## Detailed Changes

### 1. Token Rebranding

**Files Changed:**
- `contracts/Velo.sol` → `contracts/Phasor.sol`
- `contracts/interfaces/IVelo.sol` → `contracts/interfaces/IPhasor.sol`

**Changes:**
```diff
- contract Velo is IVelo, ERC20Permit {
-     constructor() ERC20("VelodromeV2", "VELO") ERC20Permit("VelodromeV2") {
+ contract Phasor is IPhasor, ERC20Permit {
+     constructor() ERC20("Phasor", "PHASOR") ERC20Permit("Phasor") {
```

**Impact:** Cosmetic only - no logic changes.

### 2. Minter Rebranding

**Files Changed:**
- `contracts/Minter.sol`
- `contracts/interfaces/IMinter.sol`

**Changes:**
- Import changed from `IVelo` to `IPhasor`
- Variable renamed from `velo` to `phasor`
- SafeERC20 usage updated
- Comments updated from VELO to PHASOR

**Impact:** Variable naming only - no logic changes.

### 3. Time Multiplier (Gauge.sol) - CUSTOM FEATURE

**This is the ONLY significant custom addition to Velodrome code.**

**Files Changed:**
- `contracts/gauges/Gauge.sol`
- `contracts/interfaces/IGauge.sol`

**Purpose:** Reward long-term stakers with bonus emissions.

**Mechanism:**
- New stakers start at 1x multiplier
- Multiplier increases linearly over 90 days
- Maximum 3x multiplier after 90 days
- Multiplier affects reward calculations only (not voting power or LP balance)

**Constants Added:**
```solidity
uint256 public constant TIME_MULTIPLIER_MIN = 1e18;        // 1x base
uint256 public constant TIME_MULTIPLIER_MAX = 3e18;        // 3x maximum
uint256 public constant TIME_MULTIPLIER_PERIOD = 90 days;  // Time to reach max
```

**Mapping Added:**
```solidity
mapping(address => uint256) public userFirstStakeTime;
```

**Functions Added:**
```solidity
function getTimeMultiplier(address _account) public view returns (uint256);
```

**Modified Functions:**
- `_depositFor()` - Tracks first stake time
- `earned()` - Applies time multiplier to reward calculation

**Security Considerations:**
- Does NOT affect voting power (veNFT is unchanged)
- Does NOT affect LP token balances
- Only affects reward distribution rate
- Cannot be exploited via flash loans (time-based)
- First stake time is immutable once set (only set if 0)

**Lines Changed:** ~35 lines in Gauge.sol, ~20 lines in IGauge.sol

## Unchanged Files

The following Velodrome contracts remain unchanged:

- `VotingEscrow.sol` - Full Velodrome implementation
- `Voter.sol` - Full gauge voting system
- `RewardsDistributor.sol` - Rebase distribution to veNFT holders
- `VotingReward.sol` - Fee distribution to voters
- `FeesVotingReward.sol` - Trading fees for voters
- `ManagedReward.sol` - Delegation rewards
- `VeArtProxy.sol` - NFT artwork
- `FactoryRegistry.sol` - Registry for pool/gauge factories
- `GaugeFactory.sol` - Creates Gauge contracts
- `VeloGovernor.sol` - On-chain governance
- `EpochGovernor.sol` - Epoch-based governance

## Verification

To verify this fork against upstream Velodrome:

```bash
# Clone upstream
git clone https://github.com/velodrome-finance/contracts.git velodrome-upstream

# Diff against our fork
diff -r packages/velodrome-fork/contracts velodrome-upstream/contracts \
  --exclude="Phasor.sol" \
  --exclude="IPhasor.sol"
```

Expected differences:
- Renamed files: `Phasor.sol`, `IPhasor.sol`
- Modified files: `Minter.sol`, `IMinter.sol`, `Gauge.sol`, `IGauge.sol`
- Total custom logic: ~35 lines in Gauge.sol

## Audit Notes

### What Auditors Should Focus On

1. **Time Multiplier Logic** (Gauge.sol lines with "PHASOR CUSTOM" comments)
   - Review `getTimeMultiplier()` calculation
   - Review `earned()` modification
   - Review `_depositFor()` first stake time tracking

2. **Rebranding Changes**
   - Verify no unintentional logic changes in renamed files
   - Verify all `velo` → `phasor` renames are complete

### What Can Be Skipped

All other contracts are unchanged from audited Velodrome V2 code. Auditors can reference existing Velodrome audits:
- Spearbit audit
- Code4rena audit

See [AUDIT.md](./AUDIT.md) for links to Velodrome security information.

## Integration Notes

### Using with Uniswap V2

This fork is designed to work with Uniswap V2 LP tokens from `packages/core` rather than Velodrome's native Pool.sol. The Gauge contract accepts any ERC20 as stakingToken.

### Deployment Order

1. Deploy Phasor token
2. Deploy VotingEscrow (uses Phasor address)
3. Deploy FactoryRegistry
4. Deploy GaugeFactory
5. Deploy Voter (references VotingEscrow, FactoryRegistry)
6. Deploy Minter (references Voter, VotingEscrow)
7. Deploy RewardsDistributor (references VotingEscrow)
8. Transfer Phasor minter role to Minter contract
