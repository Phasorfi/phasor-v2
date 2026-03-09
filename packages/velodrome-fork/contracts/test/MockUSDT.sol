// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockERC20.sol";

/// @title MockUSDT
/// @notice Mock USD Tether for testing (6 decimals)
contract MockUSDT is MockERC20 {
    constructor(uint256 _initialSupply) MockERC20("Mock USD Tether", "USDT", 6, _initialSupply) {}
}
