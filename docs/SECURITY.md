# Security Documentation

## Overview

This document outlines security considerations for the Phasor DEX smart contracts.

## Audit Status

| Component | Status | Notes |
|-----------|--------|-------|
| Uniswap V2 Core | Audited | Original Uniswap audits apply |
| Uniswap V2 Periphery | Audited | Original Uniswap audits apply |
| PhasorToken | Unaudited | Simple ERC20, low risk |
| MasterChef | Unaudited | Based on audited SushiSwap V2 |
| Launchpad | Unaudited | Custom implementation |

**Recommendation**: Get professional audit before mainnet deployment.

## Security Patterns Used

### Reentrancy Protection

All state-changing functions in MasterChef and FairLaunch use OpenZeppelin's `ReentrancyGuard`:

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MasterChef is ReentrancyGuard {
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        // ...
    }
}
```

### Safe Token Transfers

All ERC20 transfers use OpenZeppelin's `SafeERC20`:

```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MasterChef {
    using SafeERC20 for IERC20;

    function deposit(uint256 _pid, uint256 _amount) external {
        pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
    }
}
```

### Access Control

Owner-only functions are protected with OpenZeppelin's `Ownable`:

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";

contract PhasorToken is ERC20, Ownable {
    function mint(address to, uint256 amount) external onlyOwner {
        // ...
    }
}
```

### Clone Pattern

LaunchpadFactory uses EIP-1167 minimal proxy for gas-efficient deployments:

```solidity
import "@openzeppelin/contracts/proxy/Clones.sol";

contract LaunchpadFactory {
    using Clones for address;

    function createFairLaunch(...) external returns (address) {
        address launch = fairLaunchTemplate.clone();
        // ...
    }
}
```

## Known Risks & Limitations

### Forked Code

The Uniswap V2 core and periphery contracts are unmodified forks. While these have been battle-tested:

- Any vulnerabilities in Uniswap V2 affect this deployment
- The init code hash must be correctly calculated for the Library

### MasterChef Centralization

The MasterChef owner can:
- Add new pools
- Modify allocation points
- Transfer ownership

**Mitigation**: Consider transferring ownership to a multisig or timelock.

### PhasorToken Minting

Only MasterChef can mint PHASOR (as owner), but there's no timelock on minting operations.

**Mitigation**: The MAX_SUPPLY cap prevents unlimited inflation.

### FairLaunch Trust Model

- Sale creators can cancel before finalization
- Platform takes a 2% fee
- Soft cap logic requires trust in timing

### Price Oracle

The DEX does not use external price oracles. Prices are determined by:
- AMM reserves (x * y = k)
- Arbitrage with external markets

This can lead to price manipulation in low-liquidity pools.

## Common Attack Vectors

### Flash Loan Attacks

**Risk**: Manipulate AMM prices within a single transaction.

**Status**: Not directly mitigated. Standard AMM behavior.

**Impact**: Price manipulation, MEV extraction.

### Front-Running / MEV

**Risk**: Miners or MEV searchers can front-run user transactions.

**Status**: Inherent to public mempool transactions.

**Mitigation**: Users can set reasonable slippage tolerance.

### Reentrancy

**Risk**: Re-enter contract during external calls.

**Status**: Mitigated with `ReentrancyGuard` on all sensitive functions.

### Integer Overflow/Underflow

**Risk**: Arithmetic errors leading to incorrect calculations.

**Status**: Solidity 0.8.x has built-in overflow checks.

### Access Control

**Risk**: Unauthorized access to admin functions.

**Status**: Protected with OpenZeppelin `Ownable`.

## Security Checklist for Deployment

### Pre-Deployment

- [ ] All tests passing
- [ ] Gas optimization reviewed
- [ ] Admin functions have proper access control
- [ ] No hardcoded addresses (use configuration)
- [ ] Event emissions for all state changes
- [ ] Proper error messages

### Deployment

- [ ] Use secure deployer wallet (hardware wallet for mainnet)
- [ ] Verify contracts on block explorer
- [ ] Double-check constructor arguments
- [ ] Transfer ownership to multisig (if applicable)

### Post-Deployment

- [ ] Verify contract state matches expectations
- [ ] Test all user flows on testnet first
- [ ] Set up monitoring for unusual activity
- [ ] Document admin procedures

## Responsible Disclosure

If you discover a security vulnerability:

1. **Do not** disclose publicly
2. **Do not** exploit the vulnerability
3. Contact the team privately via [TBD contact method]
4. Provide detailed reproduction steps
5. Allow reasonable time for fix before disclosure

## OpenZeppelin Dependencies

| Contract | Version | Purpose |
|----------|---------|---------|
| `ERC20` | v5.1.0 | Token standard |
| `Ownable` | v5.1.0 | Access control |
| `ReentrancyGuard` | v5.1.0 | Reentrancy protection |
| `SafeERC20` | v5.1.0 | Safe token transfers |
| `Clones` | v5.1.0 | Minimal proxy |

## Contract Upgrade Path

Current contracts are **not upgradeable**. For future upgrades:

1. Deploy new implementation
2. Migrate liquidity (if applicable)
3. Update frontend to point to new contracts
4. Deprecate old contracts

For critical fixes, consider:
- Emergency pause functionality (not currently implemented)
- Timelock for sensitive operations
- Proxy pattern for upgradeability (trade-off with complexity)

## Gas Considerations

| Operation | Approximate Gas |
|-----------|-----------------|
| Swap | ~150,000 |
| Add Liquidity | ~200,000 |
| Remove Liquidity | ~180,000 |
| MasterChef Deposit | ~110,000 |
| MasterChef Withdraw | ~230,000 |
| FairLaunch Commit | ~100,000 |
| FairLaunch Claim | ~150,000 |

Gas costs may vary based on:
- Token contract implementations
- State changes required
- Vesting wallet creation
