// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockERC20.sol";

/// @title MockSOL
/// @notice Mock Wrapped SOL for testing (9 decimals)
contract MockSOL is MockERC20 {
    constructor(uint256 _initialSupply) MockERC20("Wrapped SOL", "SOL", 9, _initialSupply) {}
}
