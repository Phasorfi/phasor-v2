// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockERC20.sol";

/// @title MockUSDC
/// @notice Mock USD Coin for testing (6 decimals)
contract MockUSDC is MockERC20 {
    constructor(uint256 _initialSupply)
        MockERC20("Mock USD Coin", "USDC", 6, _initialSupply)
    {}
}
