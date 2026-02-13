// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IPhasor
/// @notice Interface for the Phasor token
/// @custom:phasor-changes Renamed from IVelo to IPhasor
interface IPhasor is IERC20 {
    error NotMinter();
    error NotOwner();

    /// @notice Mint an amount of tokens to an account
    ///         Only callable by Minter.sol
    /// @return True if success
    function mint(address account, uint256 amount) external returns (bool);

    /// @notice Address of Minter.sol
    function minter() external view returns (address);
}
