// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../governance/interfaces/IVotingEscrow.sol";
import "./interfaces/IStakingRewards.sol";

/**
 * @title StakingRewards
 * @notice Time-weighted LP staking with ve-boost multipliers
 * @dev Combines:
 *      - Synthetix accumulator pattern for O(1) gas efficiency
 *      - Ampleforth Geyser time-multipliers (1x → 3x over 90 days)
 *      - Velodrome ve-boost (up to 2.5x based on vePHASOR)
 *      - Per-deposit tracking with LIFO withdrawal
 *      - Max combined boost: 7.5x (3x time × 2.5x ve)
 */
contract StakingRewards is IStakingRewards, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @inheritdoc IStakingRewards
    uint256 public constant MIN_MULTIPLIER = 1e18;  // 1x

    /// @inheritdoc IStakingRewards
    uint256 public constant MAX_MULTIPLIER = 3e18;  // 3x

    /// @inheritdoc IStakingRewards
    uint256 public constant BONUS_PERIOD = 90 days;

    /// @notice Maximum ve-boost (2.5x)
    uint256 public constant MAX_VE_BOOST = 25e17;  // 2.5e18

    // ============ Immutable State ============

    /// @inheritdoc IStakingRewards
    address public immutable rewardsToken;

    /// @inheritdoc IStakingRewards
    address public immutable votingEscrow;

    /// @inheritdoc IStakingRewards
    address public immutable rewardsDistributor;

    // ============ Mutable State ============

    /// @inheritdoc IStakingRewards
    address public stakingToken;

    /// @inheritdoc IStakingRewards
    uint256 public rewardsDuration = 7 days;

    // Synthetix accumulator state
    /// @inheritdoc IStakingRewards
    uint256 public periodFinish;
    /// @inheritdoc IStakingRewards
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    // Totals
    /// @inheritdoc IStakingRewards
    uint256 public totalSupply;
    /// @inheritdoc IStakingRewards
    uint256 public totalEffectiveSupply;

    // Per-user state
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) private _balances;

    // Per-deposit tracking for time-weighting
    mapping(address => Deposit[]) private _userDeposits;

    // ve-boost per user
    /// @inheritdoc IStakingRewards
    mapping(address => uint256) public userVeTokenId;

    // ============ Constructor ============

    /**
     * @notice Initialize the StakingRewards contract
     * @param _rewardsToken Address of the PHASOR token
     * @param _votingEscrow Address of the VotingEscrow contract
     * @param _rewardsDistributor Address of the RewardsDistributor
     */
    constructor(
        address _rewardsToken,
        address _votingEscrow,
        address _rewardsDistributor
    ) Ownable(msg.sender) {
        require(_rewardsToken != address(0), "Invalid rewards token");
        require(_votingEscrow != address(0), "Invalid voting escrow");
        require(_rewardsDistributor != address(0), "Invalid distributor");

        rewardsToken = _rewardsToken;
        votingEscrow = _votingEscrow;
        rewardsDistributor = _rewardsDistributor;
    }

    // ============ Modifiers ============

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    modifier onlyDistributor() {
        if (msg.sender != rewardsDistributor) revert NotDistributor();
        _;
    }

    // ============ View Functions - Balances ============

    /// @inheritdoc IStakingRewards
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    /// @inheritdoc IStakingRewards
    function effectiveBalanceOf(address account) public view returns (uint256) {
        uint256 balance = _balances[account];
        if (balance == 0) return 0;

        uint256 multiplier = getTotalMultiplier(account);
        return (balance * multiplier) / 1e18;
    }

    /// @inheritdoc IStakingRewards
    function getUserDeposits(address account) external view returns (Deposit[] memory) {
        return _userDeposits[account];
    }

    // ============ View Functions - Multipliers ============

    /// @inheritdoc IStakingRewards
    function getTimeMultiplier(address account) public view returns (uint256) {
        Deposit[] storage deposits = _userDeposits[account];
        uint256 depositsLength = deposits.length;

        if (depositsLength == 0 || _balances[account] == 0) {
            return MIN_MULTIPLIER;
        }

        // Calculate weighted average multiplier across all deposits
        uint256 weightedMultiplier = 0;
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < depositsLength; i++) {
            uint256 age = block.timestamp - deposits[i].timestamp;
            uint256 multiplier = _calculateTimeMultiplier(age);
            weightedMultiplier += uint256(deposits[i].amount) * multiplier;
            totalAmount += deposits[i].amount;
        }

        return weightedMultiplier / totalAmount;
    }

    /// @inheritdoc IStakingRewards
    function getVeBoost(address account) public view returns (uint256) {
        uint256 balance = _balances[account];
        if (balance == 0) return 1e18;

        uint256 veTokenId = userVeTokenId[account];
        if (veTokenId == 0) return 1e18;

        // Verify ownership (VotingEscrow inherits ERC721)
        try IERC721(votingEscrow).ownerOf(veTokenId) returns (address owner) {
            if (owner != account) return 1e18;
        } catch {
            return 1e18;
        }

        // Get voting power
        uint256 veBalance = IVotingEscrow(votingEscrow).balanceOfNFT(veTokenId);
        uint256 veTotal = IVotingEscrow(votingEscrow).totalVotingPower();

        if (veTotal == 0 || veBalance == 0) return 1e18;

        // Velodrome boost formula:
        // baseAmount = balance × 0.4 (40% guaranteed)
        // boostedAmount = totalSupply × veBalance × 0.6 / veTotal
        // effectiveBalance = min(baseAmount + boostedAmount, balance × 2.5)
        uint256 baseAmount = (balance * 4) / 10;
        uint256 boostedAmount = (totalSupply * veBalance * 6) / (veTotal * 10);

        uint256 effectiveBalance = baseAmount + boostedAmount;
        uint256 maxEffective = (balance * 25) / 10;  // 2.5x cap

        if (effectiveBalance > maxEffective) {
            effectiveBalance = maxEffective;
        }

        // Return as multiplier (1e18 = 1x)
        // boost = effectiveBalance / balance, but we want this relative to the 40% base
        // If effectiveBalance == baseAmount (no boost): return 1e18
        // If effectiveBalance == maxEffective (2.5x): return 2.5e18
        return (effectiveBalance * 1e18) / balance;
    }

    /// @inheritdoc IStakingRewards
    function getTotalMultiplier(address account) public view returns (uint256) {
        uint256 timeMultiplier = getTimeMultiplier(account);
        uint256 veBoost = getVeBoost(account);
        return (timeMultiplier * veBoost) / 1e18;
    }

    // ============ View Functions - Rewards ============

    /// @inheritdoc IStakingRewards
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    /// @inheritdoc IStakingRewards
    function rewardPerToken() public view returns (uint256) {
        if (totalEffectiveSupply == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored +
            ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / totalEffectiveSupply;
    }

    /// @inheritdoc IStakingRewards
    function earned(address account) public view returns (uint256) {
        uint256 effectiveBalance = effectiveBalanceOf(account);
        return ((effectiveBalance * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) + rewards[account];
    }

    // ============ Write Functions ============

    /// @inheritdoc IStakingRewards
    function stake(uint256 amount, uint256 veTokenId) external nonReentrant whenNotPaused updateReward(msg.sender) {
        if (stakingToken == address(0)) revert StakingTokenNotSet();
        if (amount == 0) revert ZeroAmount();

        // Validate veNFT ownership if provided
        if (veTokenId > 0) {
            address veOwner = IERC721(votingEscrow).ownerOf(veTokenId);
            if (veOwner != msg.sender) revert NotVeTokenOwner();
            userVeTokenId[msg.sender] = veTokenId;
        }

        // Update effective supply before balance change
        _updateEffectiveSupply(msg.sender, true);

        // Record deposit with timestamp
        _userDeposits[msg.sender].push(Deposit({
            amount: uint128(amount),
            timestamp: uint48(block.timestamp)
        }));

        // Update balances
        totalSupply += amount;
        _balances[msg.sender] += amount;

        // Update effective supply after balance change
        _updateEffectiveSupply(msg.sender, false);

        // Transfer LP tokens
        IERC20(stakingToken).safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount, veTokenId);
    }

    /// @inheritdoc IStakingRewards
    function withdraw(uint256 amount) public nonReentrant whenNotPaused updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        if (_balances[msg.sender] < amount) revert InsufficientBalance();

        // Update effective supply before balance change
        _updateEffectiveSupply(msg.sender, true);

        // Remove from deposits (LIFO - most recent first)
        _removeFromDeposits(msg.sender, amount);

        // Update balances
        totalSupply -= amount;
        _balances[msg.sender] -= amount;

        // Update effective supply after balance change
        _updateEffectiveSupply(msg.sender, false);

        // Transfer LP tokens back
        IERC20(stakingToken).safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /// @inheritdoc IStakingRewards
    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            IERC20(rewardsToken).safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /// @inheritdoc IStakingRewards
    function exit() external {
        withdraw(_balances[msg.sender]);
        getReward();
    }

    /// @inheritdoc IStakingRewards
    function updateVeTokenId(uint256 veTokenId) external nonReentrant updateReward(msg.sender) {
        uint256 oldTokenId = userVeTokenId[msg.sender];

        if (veTokenId > 0) {
            address veOwner = IERC721(votingEscrow).ownerOf(veTokenId);
            if (veOwner != msg.sender) revert NotVeTokenOwner();
        }

        // Update effective supply before changing boost
        _updateEffectiveSupply(msg.sender, true);

        userVeTokenId[msg.sender] = veTokenId;

        // Update effective supply after changing boost
        _updateEffectiveSupply(msg.sender, false);

        emit VeTokenIdUpdated(msg.sender, oldTokenId, veTokenId);
    }

    // ============ Admin Functions ============

    /// @inheritdoc IStakingRewards
    function setStakingToken(address _stakingToken) external onlyOwner {
        if (stakingToken != address(0)) revert StakingTokenAlreadySet();
        require(_stakingToken != address(0), "Invalid staking token");

        stakingToken = _stakingToken;
        emit StakingTokenSet(_stakingToken);
    }

    /// @inheritdoc IStakingRewards
    function notifyRewardAmount(uint256 reward) external onlyDistributor updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = (periodFinish - block.timestamp) * rewardRate;
            rewardRate = (reward + remaining) / rewardsDuration;
        }

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;

        emit RewardAdded(reward);
    }

    /// @notice Pause staking (emergency only)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause staking
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Update rewards duration (only when period is finished)
    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        require(block.timestamp > periodFinish, "Period not finished");
        require(_rewardsDuration > 0, "Duration must be > 0");
        rewardsDuration = _rewardsDuration;
    }

    /// @notice Recover tokens sent by mistake (not staking or rewards token)
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        require(tokenAddress != stakingToken, "Cannot recover staking token");
        require(tokenAddress != rewardsToken, "Cannot recover rewards token");
        IERC20(tokenAddress).safeTransfer(owner(), tokenAmount);
    }

    // ============ Internal Functions ============

    /**
     * @notice Calculate time multiplier based on staking duration
     * @param stakingDuration Time since deposit in seconds
     * @return Multiplier (1e18 = 1x, 3e18 = 3x)
     */
    function _calculateTimeMultiplier(uint256 stakingDuration) internal pure returns (uint256) {
        if (stakingDuration >= BONUS_PERIOD) {
            return MAX_MULTIPLIER;
        }
        // Linear interpolation: MIN + (MAX - MIN) × (duration / BONUS_PERIOD)
        return MIN_MULTIPLIER + ((MAX_MULTIPLIER - MIN_MULTIPLIER) * stakingDuration) / BONUS_PERIOD;
    }

    /**
     * @notice Update effective supply tracking
     * @param account User address
     * @param isRemoving True if removing from effective supply (before balance change)
     */
    function _updateEffectiveSupply(address account, bool isRemoving) internal {
        uint256 effectiveBalance = effectiveBalanceOf(account);

        if (isRemoving) {
            if (effectiveBalance <= totalEffectiveSupply) {
                totalEffectiveSupply -= effectiveBalance;
            } else {
                totalEffectiveSupply = 0;
            }
        } else {
            totalEffectiveSupply += effectiveBalance;
        }
    }

    /**
     * @notice Remove amount from deposits using LIFO (Last In, First Out)
     * @dev Removes newest deposits first to preserve time multiplier on older deposits
     * @param account User address
     * @param amount Amount to remove
     */
    function _removeFromDeposits(address account, uint256 amount) internal {
        Deposit[] storage deposits = _userDeposits[account];
        uint256 remaining = amount;

        // Remove from newest deposits first (LIFO)
        while (remaining > 0 && deposits.length > 0) {
            uint256 lastIdx = deposits.length - 1;
            uint256 depositAmount = deposits[lastIdx].amount;

            if (depositAmount <= remaining) {
                remaining -= depositAmount;
                deposits.pop();
            } else {
                deposits[lastIdx].amount = uint128(depositAmount - remaining);
                remaining = 0;
            }
        }
    }
}
