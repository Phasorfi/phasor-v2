// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../token/PhasorToken.sol";
import "./interfaces/IStakingRewards.sol";
import "./interfaces/IRewardsDistributor.sol";

/**
 * @title RewardsDistributor
 * @notice Weekly distribution of PHASOR rewards to staking pools
 * @dev Manages multiple StakingRewards pools with weighted allocation
 *      - Mints PHASOR weekly (requires ownership of PhasorToken)
 *      - Distributes to pools based on allocation weights
 *      - Supports keepers for automated distribution
 */
contract RewardsDistributor is IRewardsDistributor, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @inheritdoc IRewardsDistributor
    uint256 public constant DISTRIBUTION_INTERVAL = 7 days;

    // ============ State Variables ============

    /// @inheritdoc IRewardsDistributor
    PhasorToken public immutable phasor;

    /// @notice Array of all pools
    PoolInfo[] private _pools;

    /// @inheritdoc IRewardsDistributor
    uint256 public totalWeight;

    /// @inheritdoc IRewardsDistributor
    uint256 public weeklyEmission = 700_000 * 1e18;  // 700k PHASOR/week

    /// @inheritdoc IRewardsDistributor
    uint256 public lastDistributionTime;

    /// @inheritdoc IRewardsDistributor
    mapping(address => bool) public keepers;

    /// @notice Mapping to check if a staking contract is already added
    mapping(address => bool) private _poolExists;

    // ============ Constructor ============

    /**
     * @notice Initialize the RewardsDistributor
     * @param _phasor Address of the PHASOR token
     */
    constructor(address _phasor) Ownable(msg.sender) {
        require(_phasor != address(0), "Invalid PHASOR address");
        phasor = PhasorToken(_phasor);
        keepers[msg.sender] = true;
        emit KeeperUpdated(msg.sender, true);
    }

    // ============ Modifiers ============

    modifier onlyKeeper() {
        if (!keepers[msg.sender] && msg.sender != owner()) revert NotKeeper();
        _;
    }

    // ============ View Functions ============

    /// @inheritdoc IRewardsDistributor
    function poolLength() external view returns (uint256) {
        return _pools.length;
    }

    /// @inheritdoc IRewardsDistributor
    function pools(uint256 pid) external view returns (PoolInfo memory) {
        return _pools[pid];
    }

    /// @inheritdoc IRewardsDistributor
    function timeUntilNextDistribution() external view returns (uint256) {
        if (lastDistributionTime == 0) return 0;

        uint256 nextTime = lastDistributionTime + DISTRIBUTION_INTERVAL;
        if (block.timestamp >= nextTime) return 0;

        return nextTime - block.timestamp;
    }

    /// @inheritdoc IRewardsDistributor
    function canDistribute() public view returns (bool) {
        return lastDistributionTime == 0 || block.timestamp >= lastDistributionTime + DISTRIBUTION_INTERVAL;
    }

    /// @inheritdoc IRewardsDistributor
    function getPoolReward(uint256 pid) public view returns (uint256) {
        if (pid >= _pools.length) return 0;

        PoolInfo storage pool = _pools[pid];
        if (!pool.active || pool.weight == 0 || totalWeight == 0) return 0;

        return (weeklyEmission * pool.weight) / totalWeight;
    }

    // ============ Write Functions ============

    /// @inheritdoc IRewardsDistributor
    function addPool(address stakingContract, uint256 weight) external onlyOwner {
        require(stakingContract != address(0), "Invalid staking contract");
        if (_poolExists[stakingContract]) revert PoolAlreadyExists();
        if (weight == 0) revert InvalidWeight();

        _poolExists[stakingContract] = true;
        _pools.push(PoolInfo({
            stakingContract: stakingContract,
            weight: weight,
            active: true
        }));

        totalWeight += weight;

        emit PoolAdded(_pools.length - 1, stakingContract, weight);
    }

    /// @inheritdoc IRewardsDistributor
    function setPoolWeight(uint256 pid, uint256 weight) external onlyOwner {
        if (pid >= _pools.length) revert PoolNotFound();

        PoolInfo storage pool = _pools[pid];
        uint256 oldWeight = pool.weight;

        // Update total weight
        totalWeight = totalWeight - oldWeight + weight;
        pool.weight = weight;

        emit PoolWeightUpdated(pid, oldWeight, weight);
    }

    /// @inheritdoc IRewardsDistributor
    function setPoolActive(uint256 pid, bool active) external onlyOwner {
        if (pid >= _pools.length) revert PoolNotFound();

        PoolInfo storage pool = _pools[pid];

        if (pool.active && !active) {
            // Deactivating - remove weight from total
            totalWeight -= pool.weight;
        } else if (!pool.active && active) {
            // Activating - add weight to total
            totalWeight += pool.weight;
        }

        pool.active = active;

        emit PoolActiveStatusUpdated(pid, active);
    }

    /// @inheritdoc IRewardsDistributor
    function setWeeklyEmission(uint256 _weeklyEmission) external onlyOwner {
        uint256 oldEmission = weeklyEmission;
        weeklyEmission = _weeklyEmission;

        emit WeeklyEmissionUpdated(oldEmission, _weeklyEmission);
    }

    /// @inheritdoc IRewardsDistributor
    function setKeeper(address keeper, bool status) external onlyOwner {
        require(keeper != address(0), "Invalid keeper address");
        keepers[keeper] = status;

        emit KeeperUpdated(keeper, status);
    }

    /// @inheritdoc IRewardsDistributor
    function distribute() external nonReentrant onlyKeeper {
        if (!canDistribute()) revert TooEarly();

        uint256 totalDistributed = 0;

        // Mint rewards
        phasor.mint(address(this), weeklyEmission);

        // Distribute to each active pool
        for (uint256 i = 0; i < _pools.length; i++) {
            PoolInfo storage pool = _pools[i];

            if (pool.active && pool.weight > 0) {
                uint256 amount = getPoolReward(i);
                if (amount > 0) {
                    // Transfer and notify
                    IERC20(address(phasor)).safeTransfer(pool.stakingContract, amount);
                    IStakingRewards(pool.stakingContract).notifyRewardAmount(amount);
                    totalDistributed += amount;
                }
            }
        }

        lastDistributionTime = block.timestamp;

        emit RewardsDistributed(totalDistributed, block.timestamp);
    }

    /// @inheritdoc IRewardsDistributor
    function distributeToPool(uint256 pid) external nonReentrant onlyKeeper {
        if (pid >= _pools.length) revert PoolNotFound();

        PoolInfo storage pool = _pools[pid];
        require(pool.active, "Pool not active");
        require(pool.weight > 0, "Pool has no weight");

        uint256 amount = getPoolReward(pid);
        require(amount > 0, "No rewards to distribute");

        // Mint and distribute to specific pool
        phasor.mint(address(this), amount);
        IERC20(address(phasor)).safeTransfer(pool.stakingContract, amount);
        IStakingRewards(pool.stakingContract).notifyRewardAmount(amount);

        emit RewardsDistributed(amount, block.timestamp);
    }

    // ============ Emergency Functions ============

    /**
     * @notice Recover tokens sent by mistake (not PHASOR)
     * @param tokenAddress Token to recover
     * @param tokenAmount Amount to recover
     */
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        require(tokenAddress != address(phasor), "Cannot recover PHASOR");
        IERC20(tokenAddress).safeTransfer(owner(), tokenAmount);
    }
}
