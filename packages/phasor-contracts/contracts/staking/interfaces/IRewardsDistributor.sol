// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../token/PhasorToken.sol";

/**
 * @title IRewardsDistributor
 * @notice Interface for the RewardsDistributor contract
 * @dev Weekly distribution of PHASOR rewards to staking pools
 */
interface IRewardsDistributor {
    // ============ Structs ============

    /// @notice Information about a staking pool
    struct PoolInfo {
        address stakingContract;  // StakingRewards contract address
        uint256 weight;           // Allocation weight
        bool active;              // Whether pool is active
    }

    // ============ Events ============

    /// @notice Emitted when a new pool is added
    event PoolAdded(uint256 indexed pid, address indexed stakingContract, uint256 weight);

    /// @notice Emitted when pool weight is updated
    event PoolWeightUpdated(uint256 indexed pid, uint256 oldWeight, uint256 newWeight);

    /// @notice Emitted when pool is activated/deactivated
    event PoolActiveStatusUpdated(uint256 indexed pid, bool active);

    /// @notice Emitted when rewards are distributed
    event RewardsDistributed(uint256 totalAmount, uint256 timestamp);

    /// @notice Emitted when weekly emission is updated
    event WeeklyEmissionUpdated(uint256 oldEmission, uint256 newEmission);

    /// @notice Emitted when a keeper is added/removed
    event KeeperUpdated(address indexed keeper, bool status);

    // ============ Errors ============

    error NotKeeper();
    error TooEarly();
    error PoolNotFound();
    error InvalidWeight();
    error PoolAlreadyExists();

    // ============ View Functions ============

    /// @notice Get the PHASOR token contract
    function phasor() external view returns (PhasorToken);

    /// @notice Get number of pools
    function poolLength() external view returns (uint256);

    /// @notice Get pool information
    function pools(uint256 pid) external view returns (PoolInfo memory);

    /// @notice Get total weight across all active pools
    function totalWeight() external view returns (uint256);

    /// @notice Get weekly emission amount
    function weeklyEmission() external view returns (uint256);

    /// @notice Get last distribution timestamp
    function lastDistributionTime() external view returns (uint256);

    /// @notice Get distribution interval (7 days)
    function DISTRIBUTION_INTERVAL() external view returns (uint256);

    /// @notice Check if address is a keeper
    function keepers(address account) external view returns (bool);

    /// @notice Get time until next distribution is possible
    function timeUntilNextDistribution() external view returns (uint256);

    /// @notice Check if distribution is possible now
    function canDistribute() external view returns (bool);

    /// @notice Calculate rewards for a specific pool
    function getPoolReward(uint256 pid) external view returns (uint256);

    // ============ Write Functions ============

    /// @notice Add a new staking pool
    /// @param stakingContract Address of the StakingRewards contract
    /// @param weight Allocation weight for this pool
    function addPool(address stakingContract, uint256 weight) external;

    /// @notice Update pool weight
    /// @param pid Pool ID
    /// @param weight New weight
    function setPoolWeight(uint256 pid, uint256 weight) external;

    /// @notice Activate or deactivate a pool
    /// @param pid Pool ID
    /// @param active Whether pool should be active
    function setPoolActive(uint256 pid, bool active) external;

    /// @notice Update weekly emission amount
    /// @param _weeklyEmission New emission amount
    function setWeeklyEmission(uint256 _weeklyEmission) external;

    /// @notice Add or remove a keeper
    /// @param keeper Address to update
    /// @param status Whether address should be a keeper
    function setKeeper(address keeper, bool status) external;

    /// @notice Distribute weekly rewards to all active pools
    function distribute() external;

    /// @notice Distribute rewards to a specific pool
    /// @param pid Pool ID
    function distributeToPool(uint256 pid) external;
}
