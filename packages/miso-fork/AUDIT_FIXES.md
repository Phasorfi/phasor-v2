# MISO Security Audit Status

## Code4rena Audit (September 2021)

Source: https://code4rena.com/reports/2021-09-sushimiso

### HIGH Severity Findings - All Fixed

| ID | Issue | Status | Location |
|----|-------|--------|----------|
| H-01 | PostAuctionLauncher pool liquidity manipulation | Fixed | `PostAuctionLauncher.sol:246-247` - Added check `require(pair == address(0) \|\| getLPBalance() == 0)` |
| H-02 | SushiToken delegate accounting error | Fixed | `SushiToken.sol:310-313` - Uses `_afterTokenTransfer` with correct delegate tracking |
| H-03 | Crowdsale token withdrawal failure | Fixed | `Crowdsale.sol:319` - Added `require(!marketStatus.finalized)` check in `_addCommitment()` |

## Notes

- All HIGH severity issues from the Code4rena audit have been addressed in the current codebase
- No additional fixes required for this fork
