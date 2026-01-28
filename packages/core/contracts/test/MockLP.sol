// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockLP
 * @notice Mock LP token for testing
 */
contract MockLP is ERC20 {
    constructor() ERC20("Mock LP Token", "MLP") {
        _mint(msg.sender, 1000000 * 1e18);
    }
}
