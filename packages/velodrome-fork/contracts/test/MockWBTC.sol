// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockERC20.sol";

/// @title MockWBTC
/// @notice Mock Wrapped Bitcoin for testing (8 decimals)
contract MockWBTC is MockERC20 {
    constructor(uint256 _initialSupply)
        MockERC20("Wrapped Bitcoin", "WBTC", 8, _initialSupply)
    {}
}
