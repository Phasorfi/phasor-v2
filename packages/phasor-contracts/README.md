# PHASOR Contracts

Custom smart contracts for the Phasor DEX ecosystem.

## Overview

This package contains all custom Phasor contracts, separate from the Uniswap V2 fork.

## Contracts

### Token (`contracts/token/`)

| Contract | Description |
|----------|-------------|
| `PhasorToken.sol` | ERC20 governance token with 1B max supply |

### Governance (`contracts/governance/`)

| Contract | Description |
|----------|-------------|
| `VotingEscrow.sol` | veNFT vote escrow (Velodrome-style) - lock PHASOR for vePHASOR |

### Staking (`contracts/staking/`)

| Contract | Description |
|----------|-------------|
| `StakingRewards.sol` | Time-weighted LP staking with ve-boost multipliers |
| `RewardsDistributor.sol` | Weekly PHASOR emission and distribution |

### Launchpad (`contracts/launchpad/`)

| Contract | Description |
|----------|-------------|
| `FairLaunch.sol` | Pro-rata token sale with soft/hard caps |
| `LaunchpadFactory.sol` | Clone factory for deploying launches |
| `TokenVesting.sol` | Linear vesting with cliff support |

## Staking System

The staking system combines:
- **Velodrome-style vote escrow** - Lock PHASOR for 1 week to 4 years
- **Ampleforth Geyser time multipliers** - 1x → 3x over 90 days of staking
- **ve-boost** - Up to 2.5x based on vePHASOR voting power
- **Max combined boost**: 7.5x (3x time × 2.5x ve)

See [docs/STAKING_SYSTEM.md](docs/STAKING_SYSTEM.md) for detailed documentation.

## Development

All commands run from **repository root**:

```bash
# Build contracts
forge build

# Run all tests
forge test

# Run only phasor-contracts tests
forge test --match-path "packages/phasor-contracts/test/*.t.sol" -vv

# Gas report
forge test --gas-report
```

## Test Coverage

| Contract | Tests | Status |
|----------|-------|--------|
| PhasorToken | 4 | Passing |
| VotingEscrow | 24 | Passing |
| StakingRewards | 24 | Passing |
| StakingIntegration | 11 | Passing |
| FairLaunch | 7 | Passing |
| **Total** | **70** | **Passing** |

## Dependencies

- OpenZeppelin Contracts v5.1.0 (ERC20, ERC721, Ownable, ReentrancyGuard, SafeERC20, Pausable)
- Foundry (forge-std)

## Documentation

- [Staking System](docs/STAKING_SYSTEM.md) - Detailed staking architecture and usage
- [Smart Contracts](../../docs/SMART_CONTRACTS.md) - Full API reference

## Security

- All state-changing functions use `ReentrancyGuard`
- Token transfers use `SafeERC20`
- Access control via `Ownable`
- Emergency pause functionality on staking contracts

**Note**: These contracts have not been audited. Use at your own risk.
