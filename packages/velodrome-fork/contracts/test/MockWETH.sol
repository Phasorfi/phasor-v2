// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockERC20.sol";

/// @title MockWETH
/// @notice Mock Wrapped ETH for testing (18 decimals)
contract MockWETH is MockERC20 {
    constructor(uint256 _initialSupply) MockERC20("Wrapped Ether", "WETH", 18, _initialSupply) {}
}
