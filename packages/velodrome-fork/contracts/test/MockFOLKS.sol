// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockERC20.sol";

/// @title MockFOLKS
/// @notice Mock Folks Finance token for testing (6 decimals)
contract MockFOLKS is MockERC20 {
    constructor(uint256 _initialSupply) MockERC20("Folks Finance", "FOLKS", 6, _initialSupply) {}
}
