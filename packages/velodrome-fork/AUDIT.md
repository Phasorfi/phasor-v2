# Security & Audit Information

## Velodrome V2 Audits

This codebase is a fork of Velodrome Finance V2, which has been audited by multiple security firms.

### Official Audits

| Auditor | Date | Report |
|---------|------|--------|
| Spearbit | 2022-2023 | [Velodrome V2 Audit](https://github.com/velodrome-finance/contracts/tree/main/audits) |
| Code4rena | 2023 | [Contest Results](https://code4rena.com/contests/2023-06-velodrome-finance) |

### Bug Bounty

Velodrome maintains an active bug bounty program on Immunefi:
- **Program:** https://immunefi.com/bounty/velodromefinance/
- **Max Bounty:** Up to $150,000

### Security Page

Official security information: https://velodrome.finance/security

## Phasor Custom Code

The following changes have been made to the original Velodrome codebase:

### Rebranding (Low Risk)
- Token renamed from VELO to PHASOR
- Variable and function names updated accordingly
- No logic changes

### Time Multiplier (Medium Risk - Requires Review)

**Location:** `contracts/gauges/Gauge.sol`

**Custom Code (~35 lines):**
```solidity
// Constants
uint256 public constant TIME_MULTIPLIER_MIN = 1e18;
uint256 public constant TIME_MULTIPLIER_MAX = 3e18;
uint256 public constant TIME_MULTIPLIER_PERIOD = 90 days;

// Mapping
mapping(address => uint256) public userFirstStakeTime;

// Function
function getTimeMultiplier(address _account) public view returns (uint256);

// Modified earned() function
// Modified _depositFor() function
```

**Risk Assessment:**
- ✅ Cannot be exploited via flash loans (time-based)
- ✅ Does not affect voting power
- ✅ Does not affect LP token accounting
- ✅ Linear calculation with bounded values
- ⚠️ New logic that hasn't been audited as part of Velodrome

## Audit Checklist for Phasor

### High Priority (Custom Code)
- [ ] Review `getTimeMultiplier()` calculation for overflows
- [ ] Review `earned()` modification for accounting errors
- [ ] Review `_depositFor()` first stake time tracking
- [ ] Verify time multiplier cannot exceed MAX
- [ ] Verify time multiplier starts at MIN for new users
- [ ] Test behavior when user withdraws all and re-deposits

### Medium Priority (Integration)
- [ ] Verify Gauge works with Uniswap V2 LP tokens
- [ ] Verify Voter integration is correct
- [ ] Verify Minter integration is correct
- [ ] Test full reward distribution cycle

### Low Priority (Rebranding)
- [ ] Verify all VELO→PHASOR renames are complete
- [ ] Verify no logic changes in renamed code
- [ ] Verify interfaces match implementations

## Known Velodrome Issues (Fixed)

The following issues were identified in Velodrome audits and have been addressed:

1. **Gauge Reward Rounding** - Mitigated by 18 decimal requirement
2. **Flash Loan Voting** - Mitigated by checkpoint system
3. **Epoch Boundary Issues** - Mitigated by VelodromeTimeLibrary

## Deployment Security

### Pre-Deployment
- [ ] All contracts compiled with same Solidity version
- [ ] No compiler warnings
- [ ] All tests passing
- [ ] Deployment script reviewed

### Post-Deployment
- [ ] Ownership transferred to multisig
- [ ] Minter role assigned correctly
- [ ] Initial parameters verified
- [ ] Contract verification on block explorer

## Contact

For security concerns regarding Phasor-specific code:
- Create a private issue in the repository
- Contact the team through official channels

For Velodrome base code issues:
- Use Immunefi bug bounty program
- Contact Velodrome security team
