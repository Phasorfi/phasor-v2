// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;

/// @notice Minimal interface for Velodrome VotingEscrow (vePHASOR)
/// @dev Used for ve-gated auction participation
interface IVotingEscrow {
    /// @notice Get the voting power (veNFT balance) of an account
    /// @param account The address to check
    /// @return Total voting power across all veNFTs owned by account
    function balanceOf(address account) external view returns (uint256);
}
