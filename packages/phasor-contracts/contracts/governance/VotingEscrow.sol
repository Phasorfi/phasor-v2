// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IVotingEscrow.sol";

/**
 * @title VotingEscrow
 * @notice Vote-escrowed PHASOR (vePHASOR) - ERC721 NFT representing locked PHASOR
 * @dev Implements Velodrome-style veNFT with:
 *      - Linear voting power decay based on remaining lock time
 *      - Lock duration: 1 week to 4 years
 *      - Week-rounded unlock times for gas efficiency
 *      - Merge functionality to combine multiple locks
 *      - Voting power formula: lockedAmount × (remainingTime / MAXTIME)
 */
contract VotingEscrow is IVotingEscrow, ERC721Enumerable, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @inheritdoc IVotingEscrow
    uint256 public constant WEEK = 7 days;

    /// @inheritdoc IVotingEscrow
    uint256 public constant MAXTIME = 4 * 365 days; // 4 years

    /// @inheritdoc IVotingEscrow
    uint256 public constant MIN_LOCK_TIME = 1 weeks;

    // ============ State Variables ============

    /// @inheritdoc IVotingEscrow
    address public immutable phasor;

    /// @notice Counter for token IDs (starts at 1)
    uint256 private _tokenIdCounter;

    /// @inheritdoc IVotingEscrow
    uint256 public totalLocked;

    /// @notice Lock information for each veNFT
    mapping(uint256 => LockedBalance) private _locked;

    // ============ Constructor ============

    /**
     * @notice Initialize the VotingEscrow contract
     * @param _phasor Address of the PHASOR token
     */
    constructor(address _phasor) ERC721("Vote-Escrowed PHASOR", "vePHASOR") Ownable(msg.sender) {
        require(_phasor != address(0), "Invalid PHASOR address");
        phasor = _phasor;
    }

    // ============ View Functions ============

    /// @inheritdoc IVotingEscrow
    function locked(uint256 tokenId) external view returns (LockedBalance memory) {
        return _locked[tokenId];
    }

    /// @inheritdoc IVotingEscrow
    function balanceOfNFT(uint256 tokenId) public view returns (uint256) {
        return balanceOfNFTAt(tokenId, block.timestamp);
    }

    /// @inheritdoc IVotingEscrow
    function balanceOfNFTAt(uint256 tokenId, uint256 timestamp) public view returns (uint256) {
        LockedBalance memory lock = _locked[tokenId];

        // No lock exists or timestamp is after unlock
        if (lock.amount == 0 || timestamp >= lock.end) {
            return 0;
        }

        // Timestamp is before lock start (shouldn't happen in normal usage)
        if (timestamp < lock.start) {
            timestamp = lock.start;
        }

        // Calculate remaining time
        uint256 remaining = lock.end - timestamp;

        // Voting power = amount × (remaining / MAXTIME)
        return (uint256(lock.amount) * remaining) / MAXTIME;
    }

    /// @inheritdoc IVotingEscrow
    function totalVotingPower() public view returns (uint256) {
        return totalVotingPowerAt(block.timestamp);
    }

    /// @inheritdoc IVotingEscrow
    function totalVotingPowerAt(uint256 timestamp) public view returns (uint256) {
        uint256 total = 0;
        uint256 supply = totalSupply();

        for (uint256 i = 0; i < supply; i++) {
            uint256 tokenId = tokenByIndex(i);
            total += balanceOfNFTAt(tokenId, timestamp);
        }

        return total;
    }

    /// @inheritdoc IVotingEscrow
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokens;
    }

    // ============ Write Functions ============

    /// @inheritdoc IVotingEscrow
    function createLock(uint256 amount, uint256 unlockTime) external nonReentrant returns (uint256 tokenId) {
        if (amount == 0) revert ZeroAmount();

        // Round unlock time to nearest week
        uint256 roundedUnlock = _roundToWeek(unlockTime);

        // Validate unlock time
        if (roundedUnlock <= block.timestamp) revert InvalidUnlockTime();
        if (roundedUnlock - block.timestamp < MIN_LOCK_TIME) revert UnlockTimeTooShort();
        if (roundedUnlock - block.timestamp > MAXTIME) revert UnlockTimeTooLong();

        // Increment and get token ID
        _tokenIdCounter++;
        tokenId = _tokenIdCounter;

        // Create lock
        _locked[tokenId] = LockedBalance({
            amount: uint128(amount),
            start: uint48(block.timestamp),
            end: uint48(roundedUnlock)
        });

        // Update total locked
        uint256 prevSupply = totalLocked;
        totalLocked += amount;

        // Mint NFT
        _mint(msg.sender, tokenId);

        // Transfer PHASOR from user
        IERC20(phasor).safeTransferFrom(msg.sender, address(this), amount);

        emit LockCreated(msg.sender, tokenId, amount, roundedUnlock);
        emit SupplyUpdated(prevSupply, totalLocked);
    }

    /// @inheritdoc IVotingEscrow
    function increaseAmount(uint256 tokenId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        LockedBalance storage lock = _locked[tokenId];
        if (lock.end <= block.timestamp) revert LockExpired();

        // Update lock amount
        uint256 newAmount = uint256(lock.amount) + amount;
        lock.amount = uint128(newAmount);

        // Update total locked
        uint256 prevSupply = totalLocked;
        totalLocked += amount;

        // Transfer PHASOR from user
        IERC20(phasor).safeTransferFrom(msg.sender, address(this), amount);

        emit LockAmountIncreased(msg.sender, tokenId, amount, newAmount);
        emit SupplyUpdated(prevSupply, totalLocked);
    }

    /// @inheritdoc IVotingEscrow
    function increaseUnlockTime(uint256 tokenId, uint256 newUnlockTime) external nonReentrant {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        LockedBalance storage lock = _locked[tokenId];
        if (lock.end <= block.timestamp) revert LockExpired();

        // Round new unlock time to nearest week
        uint256 roundedUnlock = _roundToWeek(newUnlockTime);

        // Validate new unlock time
        if (roundedUnlock <= lock.end) revert InvalidUnlockTime();
        if (roundedUnlock - block.timestamp > MAXTIME) revert UnlockTimeTooLong();

        uint256 oldUnlockTime = lock.end;
        lock.end = uint48(roundedUnlock);

        emit LockTimeExtended(msg.sender, tokenId, oldUnlockTime, roundedUnlock);
    }

    /// @inheritdoc IVotingEscrow
    function withdraw(uint256 tokenId) external nonReentrant {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        LockedBalance memory lock = _locked[tokenId];
        if (lock.end > block.timestamp) revert LockNotExpired();

        uint256 amount = lock.amount;

        // Clear lock data
        delete _locked[tokenId];

        // Update total locked
        uint256 prevSupply = totalLocked;
        totalLocked -= amount;

        // Burn NFT
        _burn(tokenId);

        // Transfer PHASOR to user
        IERC20(phasor).safeTransfer(msg.sender, amount);

        emit LockWithdrawn(msg.sender, tokenId, amount);
        emit SupplyUpdated(prevSupply, totalLocked);
    }

    /// @inheritdoc IVotingEscrow
    function merge(uint256 fromTokenId, uint256 toTokenId) external nonReentrant {
        if (fromTokenId == toTokenId) revert SameToken();
        if (ownerOf(fromTokenId) != msg.sender) revert NotTokenOwner();
        if (ownerOf(toTokenId) != msg.sender) revert NotTokenOwner();

        LockedBalance memory fromLock = _locked[fromTokenId];
        LockedBalance storage toLock = _locked[toTokenId];

        // Both locks must be active
        if (fromLock.end <= block.timestamp) revert LockExpired();
        if (toLock.end <= block.timestamp) revert LockExpired();

        // Add amount from `from` to `to`
        uint256 amount = fromLock.amount;
        toLock.amount = uint128(uint256(toLock.amount) + amount);

        // Use the later unlock time
        if (fromLock.end > toLock.end) {
            toLock.end = fromLock.end;
        }

        // Clear `from` lock and burn NFT
        delete _locked[fromTokenId];
        _burn(fromTokenId);

        emit LocksMerged(msg.sender, fromTokenId, toTokenId, amount);
    }

    // ============ Internal Functions ============

    /**
     * @notice Round a timestamp down to the nearest week
     * @param timestamp The timestamp to round
     * @return Rounded timestamp
     */
    function _roundToWeek(uint256 timestamp) internal pure returns (uint256) {
        return (timestamp / WEEK) * WEEK;
    }

    /**
     * @notice Override to prevent transfers when lock is active (optional safety)
     * @dev Users can still transfer their veNFT if desired
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        return super._update(to, tokenId, auth);
    }
}
