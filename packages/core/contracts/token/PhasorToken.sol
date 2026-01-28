// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PhasorToken
 * @notice Native token for the Phasor DEX ecosystem
 * @dev ERC20 token with minting controlled by owner (MasterChef)
 */
contract PhasorToken is ERC20, Ownable {
    /// @notice Maximum supply cap - 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;

    /**
     * @notice Constructor that mints initial supply to deployer
     * @dev Mints 100M tokens (10% of max supply) to deployer for initial distribution
     */
    constructor() ERC20("Phasor Token", "PHASOR") Ownable(msg.sender) {
        // Mint initial supply to deployer (10% of max)
        _mint(msg.sender, 100_000_000 * 1e18);
    }

    /**
     * @notice Mint new PHASOR tokens
     * @dev Only owner (MasterChef) can mint. Enforces max supply cap.
     * @param to Address to receive minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "PhasorToken: exceeds max supply");
        _mint(to, amount);
    }
}
