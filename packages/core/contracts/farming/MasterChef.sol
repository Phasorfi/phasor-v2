// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../token/PhasorToken.sol";

/**
 * @title MasterChef
 * @notice Distributes PHASOR rewards to LP token stakers
 * @dev Based on SushiSwap MasterChef V2 pattern
 */
contract MasterChef is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Info of each user's staking position
    struct UserInfo {
        uint256 amount;     // LP tokens provided
        uint256 rewardDebt; // Reward debt for calculation
    }

    /// @notice Info of each pool
    struct PoolInfo {
        IERC20 lpToken;           // LP token contract
        uint256 allocPoint;       // Allocation points assigned to pool
        uint256 lastRewardBlock;  // Last block number rewards were calculated
        uint256 accPhasorPerShare; // Accumulated PHASOR per share, times 1e12
    }

    /// @notice PHASOR token
    PhasorToken public phasor;
    /// @notice PHASOR tokens created per block
    uint256 public phasorPerBlock;
    /// @notice Block number when rewards start
    uint256 public startBlock;

    /// @notice Info of each pool
    PoolInfo[] public poolInfo;
    /// @notice Info of each user that stakes LP tokens
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    /// @notice Total allocation points across all pools
    uint256 public totalAllocPoint = 0;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    /**
     * @notice Constructor
     * @param _phasor PHASOR token address
     * @param _phasorPerBlock PHASOR tokens to distribute per block
     * @param _startBlock Block number when rewards start
     */
    constructor(
        PhasorToken _phasor,
        uint256 _phasorPerBlock,
        uint256 _startBlock
    ) Ownable(msg.sender) {
        phasor = _phasor;
        phasorPerBlock = _phasorPerBlock;
        startBlock = _startBlock;
    }

    /// @notice Returns number of pools
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @notice Add a new LP pool
     * @param _allocPoint Allocation points for this pool
     * @param _lpToken LP token address
     */
    function add(uint256 _allocPoint, IERC20 _lpToken) external onlyOwner {
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint += _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accPhasorPerShare: 0
        }));
    }

    /**
     * @notice Update pool's allocation points
     * @param _pid Pool ID
     * @param _allocPoint New allocation points
     */
    function set(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    /**
     * @notice Update reward variables for a pool
     * @dev MUST be called before any state changes
     * @param _pid Pool ID
     */
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = block.number - pool.lastRewardBlock;
        uint256 phasorReward = multiplier * phasorPerBlock * pool.allocPoint / totalAllocPoint;
        phasor.mint(address(this), phasorReward);
        pool.accPhasorPerShare += phasorReward * 1e12 / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    /**
     * @notice View pending PHASOR rewards for a user
     * @param _pid Pool ID
     * @param _user User address
     * @return Pending PHASOR rewards
     */
    function pendingPhasor(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accPhasorPerShare = pool.accPhasorPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = block.number - pool.lastRewardBlock;
            uint256 phasorReward = multiplier * phasorPerBlock * pool.allocPoint / totalAllocPoint;
            accPhasorPerShare += phasorReward * 1e12 / lpSupply;
        }
        return user.amount * accPhasorPerShare / 1e12 - user.rewardDebt;
    }

    /**
     * @notice Deposit LP tokens to earn PHASOR
     * @param _pid Pool ID
     * @param _amount Amount of LP tokens to deposit
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        updatePool(_pid);
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        if (user.amount > 0) {
            uint256 pending = user.amount * pool.accPhasorPerShare / 1e12 - user.rewardDebt;
            if (pending > 0) {
                safePhasorTransfer(msg.sender, pending);
                emit Harvest(msg.sender, _pid, pending);
            }
        }

        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
        }

        user.rewardDebt = user.amount * pool.accPhasorPerShare / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @notice Withdraw LP tokens and harvest PHASOR rewards
     * @param _pid Pool ID
     * @param _amount Amount of LP tokens to withdraw
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        updatePool(_pid);
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: insufficient balance");

        uint256 pending = user.amount * pool.accPhasorPerShare / 1e12 - user.rewardDebt;
        if (pending > 0) {
            safePhasorTransfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }

        if (_amount > 0) {
            user.amount -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }

        user.rewardDebt = user.amount * pool.accPhasorPerShare / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @notice Withdraw without caring about rewards (EMERGENCY ONLY)
     * @param _pid Pool ID
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        pool.lpToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    /**
     * @notice Safe PHASOR transfer function (handles rounding errors)
     * @param _to Recipient address
     * @param _amount Amount to transfer
     */
    function safePhasorTransfer(address _to, uint256 _amount) internal {
        uint256 phasorBal = phasor.balanceOf(address(this));
        if (_amount > phasorBal) {
            phasor.transfer(_to, phasorBal);
        } else {
            phasor.transfer(_to, _amount);
        }
    }
}
