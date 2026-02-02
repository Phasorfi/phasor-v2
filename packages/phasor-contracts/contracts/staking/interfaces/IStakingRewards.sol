// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStakingRewards
 * @notice Interface for the StakingRewards contract
 * @dev Time-weighted staking with ve-boost multipliers
 */
interface IStakingRewards {
    // ============ Structs ============

    /// @notice Individual deposit with timestamp for time-weighting
    struct Deposit {
        uint128 amount;     // Amount staked
        uint48 timestamp;   // When deposited
    }

    // ============ Events ============

    /// @notice Emitted when LP tokens are staked
    event Staked(address indexed user, uint256 amount, uint256 veTokenId);

    /// @notice Emitted when LP tokens are withdrawn
    event Withdrawn(address indexed user, uint256 amount);

    /// @notice Emitted when rewards are claimed
    event RewardPaid(address indexed user, uint256 reward);

    /// @notice Emitted when new rewards are added
    event RewardAdded(uint256 reward);

    /// @notice Emitted when user updates their veNFT for boost
    event VeTokenIdUpdated(address indexed user, uint256 oldTokenId, uint256 newTokenId);

    /// @notice Emitted when staking token is set
    event StakingTokenSet(address indexed stakingToken);

    // ============ Errors ============

    error ZeroAmount();
    error InsufficientBalance();
    error NotVeTokenOwner();
    error NotDistributor();
    error StakingTokenAlreadySet();
    error StakingTokenNotSet();

    // ============ View Functions - Tokens ============

    /// @notice Get the rewards token (PHASOR)
    function rewardsToken() external view returns (address);

    /// @notice Get the staking token (LP token)
    function stakingToken() external view returns (address);

    /// @notice Get the VotingEscrow contract
    function votingEscrow() external view returns (address);

    /// @notice Get the RewardsDistributor contract
    function rewardsDistributor() external view returns (address);

    // ============ View Functions - Balances ============

    /// @notice Get total staked LP tokens
    function totalSupply() external view returns (uint256);

    /// @notice Get total effective supply (with multipliers)
    function totalEffectiveSupply() external view returns (uint256);

    /// @notice Get user's staked balance
    function balanceOf(address account) external view returns (uint256);

    /// @notice Get user's effective balance (with multipliers)
    function effectiveBalanceOf(address account) external view returns (uint256);

    /// @notice Get user's deposits
    function getUserDeposits(address account) external view returns (Deposit[] memory);

    /// @notice Get user's veNFT token ID used for boost
    function userVeTokenId(address account) external view returns (uint256);

    // ============ View Functions - Multipliers ============

    /// @notice Get user's time multiplier (1e18 = 1x, 3e18 = 3x max)
    function getTimeMultiplier(address account) external view returns (uint256);

    /// @notice Get user's ve-boost (1e18 = 1x, 2.5e18 = 2.5x max)
    function getVeBoost(address account) external view returns (uint256);

    /// @notice Get user's combined multiplier (time × ve-boost)
    function getTotalMultiplier(address account) external view returns (uint256);

    // ============ View Functions - Rewards ============

    /// @notice Get pending rewards for a user
    function earned(address account) external view returns (uint256);

    /// @notice Get current reward rate per second
    function rewardRate() external view returns (uint256);

    /// @notice Get timestamp when current reward period ends
    function periodFinish() external view returns (uint256);

    /// @notice Get duration of reward periods
    function rewardsDuration() external view returns (uint256);

    /// @notice Get last time rewards were applicable
    function lastTimeRewardApplicable() external view returns (uint256);

    /// @notice Get current reward per token stored
    function rewardPerToken() external view returns (uint256);

    // ============ View Functions - Constants ============

    /// @notice Minimum time multiplier (1x)
    function MIN_MULTIPLIER() external view returns (uint256);

    /// @notice Maximum time multiplier (3x)
    function MAX_MULTIPLIER() external view returns (uint256);

    /// @notice Time to reach max multiplier (90 days)
    function BONUS_PERIOD() external view returns (uint256);

    // ============ Write Functions ============

    /// @notice Stake LP tokens with optional veNFT for boost
    /// @param amount Amount of LP tokens to stake
    /// @param veTokenId veNFT token ID for boost (0 = no boost)
    function stake(uint256 amount, uint256 veTokenId) external;

    /// @notice Withdraw LP tokens (LIFO order)
    /// @param amount Amount to withdraw
    function withdraw(uint256 amount) external;

    /// @notice Claim pending rewards
    function getReward() external;

    /// @notice Withdraw all and claim rewards
    function exit() external;

    /// @notice Update veNFT used for boost
    /// @param veTokenId New veNFT token ID (0 = remove boost)
    function updateVeTokenId(uint256 veTokenId) external;

    // ============ Admin Functions ============

    /// @notice Set the staking token (can only be called once)
    /// @param _stakingToken Address of the LP token
    function setStakingToken(address _stakingToken) external;

    /// @notice Add rewards to the pool (only distributor)
    /// @param reward Amount of rewards to add
    function notifyRewardAmount(uint256 reward) external;
}
