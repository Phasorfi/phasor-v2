// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVotingEscrow
 * @notice Interface for the VotingEscrow (vePHASOR) contract
 * @dev Vote-escrowed PHASOR - ERC721 NFT representing locked PHASOR with decaying voting power
 */
interface IVotingEscrow {
    // ============ Structs ============

    /// @notice Lock information for a veNFT
    struct LockedBalance {
        uint128 amount;  // PHASOR locked
        uint48 start;    // Lock start timestamp
        uint48 end;      // Unlock timestamp (week-rounded)
    }

    // ============ Events ============

    /// @notice Emitted when a new lock is created
    event LockCreated(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 unlockTime
    );

    /// @notice Emitted when tokens are added to a lock
    event LockAmountIncreased(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amountAdded,
        uint256 newTotal
    );

    /// @notice Emitted when a lock's duration is extended
    event LockTimeExtended(
        address indexed user,
        uint256 indexed tokenId,
        uint256 oldUnlockTime,
        uint256 newUnlockTime
    );

    /// @notice Emitted when a lock is withdrawn
    event LockWithdrawn(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount
    );

    /// @notice Emitted when two locks are merged
    event LocksMerged(
        address indexed user,
        uint256 indexed fromTokenId,
        uint256 indexed toTokenId,
        uint256 amount
    );

    /// @notice Emitted when total locked supply changes
    event SupplyUpdated(uint256 prevSupply, uint256 newSupply);

    // ============ Errors ============

    error ZeroAmount();
    error LockNotExpired();
    error LockExpired();
    error InvalidUnlockTime();
    error UnlockTimeTooShort();
    error UnlockTimeTooLong();
    error NotTokenOwner();
    error SameToken();

    // ============ View Functions ============

    /// @notice Get the PHASOR token address
    function phasor() external view returns (address);

    /// @notice Get lock information for a tokenId
    function locked(uint256 tokenId) external view returns (LockedBalance memory);

    /// @notice Get total PHASOR locked across all veNFTs
    function totalLocked() external view returns (uint256);

    /// @notice Get voting power of a veNFT at current time
    /// @param tokenId The veNFT token ID
    /// @return Voting power (decays linearly to 0 at unlock time)
    function balanceOfNFT(uint256 tokenId) external view returns (uint256);

    /// @notice Get voting power of a veNFT at a specific timestamp
    /// @param tokenId The veNFT token ID
    /// @param timestamp The timestamp to query
    /// @return Voting power at that timestamp
    function balanceOfNFTAt(uint256 tokenId, uint256 timestamp) external view returns (uint256);

    /// @notice Get total voting power across all veNFTs at current time
    /// @return Total voting power
    function totalVotingPower() external view returns (uint256);

    /// @notice Get total voting power at a specific timestamp
    /// @param timestamp The timestamp to query
    /// @return Total voting power at that timestamp
    function totalVotingPowerAt(uint256 timestamp) external view returns (uint256);

    /// @notice Get all token IDs owned by an address
    /// @param owner The address to query
    /// @return Array of token IDs
    function tokensOfOwner(address owner) external view returns (uint256[] memory);

    // ============ Constants ============

    /// @notice Duration of one week in seconds
    function WEEK() external view returns (uint256);

    /// @notice Maximum lock duration (4 years)
    function MAXTIME() external view returns (uint256);

    /// @notice Minimum lock duration (1 week)
    function MIN_LOCK_TIME() external view returns (uint256);

    // ============ Write Functions ============

    /// @notice Create a new lock
    /// @param amount Amount of PHASOR to lock
    /// @param unlockTime Timestamp when lock expires (will be rounded to week)
    /// @return tokenId The ID of the newly minted veNFT
    function createLock(uint256 amount, uint256 unlockTime) external returns (uint256 tokenId);

    /// @notice Increase the amount of PHASOR in an existing lock
    /// @param tokenId The veNFT token ID
    /// @param amount Additional PHASOR to lock
    function increaseAmount(uint256 tokenId, uint256 amount) external;

    /// @notice Extend the unlock time of an existing lock
    /// @param tokenId The veNFT token ID
    /// @param newUnlockTime New unlock timestamp (must be later than current)
    function increaseUnlockTime(uint256 tokenId, uint256 newUnlockTime) external;

    /// @notice Withdraw PHASOR after lock expires
    /// @param tokenId The veNFT token ID (will be burned)
    function withdraw(uint256 tokenId) external;

    /// @notice Merge two locks into one
    /// @param fromTokenId The veNFT to merge from (will be burned)
    /// @param toTokenId The veNFT to merge into
    function merge(uint256 fromTokenId, uint256 toTokenId) external;
}
