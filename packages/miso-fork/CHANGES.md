# MISO Fork Changes

Forked from: https://github.com/sushiswap/miso
Fork date: 2026-02-03
License: GPL-3.0

## Customizations for Phasor DEX

### ve-Gated Tiered Launchpad

Added vePHASOR gating to all auction contracts. Users must hold minimum vePHASOR balance to participate in IDOs.

**Files modified:**
- `contracts/interfaces/IVotingEscrow.sol` (new)
- `contracts/Auctions/BatchAuction.sol`
- `contracts/Auctions/Crowdsale.sol`
- `contracts/Auctions/DutchAuction.sol`
- `contracts/Auctions/HyperbolicAuction.sol`

**Changes per auction contract:**
1. Added `votingEscrow` and `minVeBalance` state variables
2. Added `onlyVeHolders` modifier
3. Added `setVeGating(address, uint256)` admin function
4. Applied modifier to `commitEth()`, `commitTokens()`, `commitTokensFrom()`

**Usage:**
```solidity
// Admin configures ve-gating after auction creation
auction.setVeGating(votingEscrowAddress, minBalanceRequired);
```

See [AUDIT_FIXES.md](./AUDIT_FIXES.md) for security audit status.

## Integration Notes

- Uses Solidity 0.6.12 (original version)
- Compatible with Uniswap V2 Router/Factory interface
- PostAuctionLauncher creates DEX liquidity automatically
- ve-gating is optional (disabled when votingEscrow is address(0))
