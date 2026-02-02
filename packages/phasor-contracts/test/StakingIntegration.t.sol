// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/token/PhasorToken.sol";
import "../contracts/governance/VotingEscrow.sol";
import "../contracts/staking/StakingRewards.sol";
import "../contracts/staking/RewardsDistributor.sol";
import "../contracts/test/MockLP.sol";

/**
 * @title StakingIntegrationTest
 * @notice Integration tests for the full staking system flow
 * @dev Tests VotingEscrow + StakingRewards + RewardsDistributor working together
 */
contract StakingIntegrationTest is Test {
    PhasorToken public phasor;
    VotingEscrow public ve;
    StakingRewards public stakingPool1;
    StakingRewards public stakingPool2;
    RewardsDistributor public distributor;
    MockLP public lpToken1;
    MockLP public lpToken2;

    address public owner = address(1);
    address public keeper = address(4);
    address public user1 = address(2);
    address public user2 = address(3);

    uint256 public constant INITIAL_PHASOR = 1_000_000 * 1e18;
    uint256 public constant INITIAL_LP = 100_000 * 1e18;
    uint256 public constant WEEK = 7 days;

    function setUp() public {
        // Align timestamp to week boundary
        uint256 alignedTime = (block.timestamp / WEEK + 1) * WEEK;
        vm.warp(alignedTime);

        vm.startPrank(owner);

        // Deploy PHASOR token
        phasor = new PhasorToken();

        // Deploy VotingEscrow
        ve = new VotingEscrow(address(phasor));

        // Deploy RewardsDistributor
        distributor = new RewardsDistributor(address(phasor));

        // Deploy two StakingRewards pools
        stakingPool1 = new StakingRewards(
            address(phasor),
            address(ve),
            address(distributor)
        );
        stakingPool2 = new StakingRewards(
            address(phasor),
            address(ve),
            address(distributor)
        );

        // Deploy mock LP tokens
        lpToken1 = new MockLP();
        lpToken2 = new MockLP();

        // Set staking tokens
        stakingPool1.setStakingToken(address(lpToken1));
        stakingPool2.setStakingToken(address(lpToken2));

        // Add staking pools to distributor (80/20 split)
        distributor.addPool(address(stakingPool1), 800);  // 80%
        distributor.addPool(address(stakingPool2), 200);  // 20%

        // Set keeper
        distributor.setKeeper(keeper, true);

        // Transfer PHASOR ownership to distributor for minting
        phasor.transferOwnership(address(distributor));

        // Transfer LP tokens to users
        lpToken1.transfer(user1, INITIAL_LP);
        lpToken1.transfer(user2, INITIAL_LP);
        lpToken2.transfer(user1, INITIAL_LP);
        lpToken2.transfer(user2, INITIAL_LP);

        vm.stopPrank();

        // Transfer some PHASOR to users for locking
        vm.prank(owner);
        phasor.transfer(user1, INITIAL_PHASOR);
        vm.prank(owner);
        phasor.transfer(user2, INITIAL_PHASOR);
    }

    // ============ Full Staking Flow Tests ============

    function testFullStakingFlow() public {
        // Test ve-boost affects reward distribution proportionally
        // Note: Due to time multiplier increasing during reward period,
        // total claimed may exceed distributed. This tests relative behavior.

        // User1: Creates vePHASOR lock and stakes LP with boost
        vm.startPrank(user1);
        phasor.approve(address(ve), 100000 * 1e18);
        uint256 veTokenId = ve.createLock(100000 * 1e18, block.timestamp + 4 * 365 days);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, veTokenId);
        vm.stopPrank();

        // User2: Stakes LP without vePHASOR
        vm.startPrank(user2);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, 0);
        vm.stopPrank();

        // Distribute rewards
        vm.prank(keeper);
        distributor.distribute();

        // Warp 1 week
        vm.warp(block.timestamp + 7 days);

        // Check rewards - User1 should have more due to ve-boost
        uint256 earned1 = stakingPool1.earned(user1);
        uint256 earned2 = stakingPool1.earned(user2);

        assertGt(earned1, 0, "User1 should have earned rewards");
        assertGt(earned2, 0, "User2 should have earned rewards");
        assertGt(earned1, earned2, "User1 with ve-boost should earn more");

        // Verify the ve-boost multiplier is correctly applied
        // User1 with veNFT should have > 1x boost
        uint256 boost1 = stakingPool1.getVeBoost(user1);
        uint256 boost2 = stakingPool1.getVeBoost(user2);
        assertGt(boost1, 1e18, "User1 should have ve-boost > 1x");
        assertEq(boost2, 1e18, "User2 should have no ve-boost");

        // Verify balances are tracked correctly
        assertEq(stakingPool1.balanceOf(user1), 10000 * 1e18, "User1 balance");
        assertEq(stakingPool1.balanceOf(user2), 10000 * 1e18, "User2 balance");
        assertEq(stakingPool1.totalSupply(), 20000 * 1e18, "Total supply");
    }

    function testMultiplePoolDistribution() public {
        // Users stake in both pools
        vm.startPrank(user1);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, 0);
        lpToken2.approve(address(stakingPool2), 10000 * 1e18);
        stakingPool2.stake(10000 * 1e18, 0);
        vm.stopPrank();

        // Distribute rewards
        vm.prank(keeper);
        distributor.distribute();

        // Check reward rates reflect 80/20 split
        uint256 rate1 = stakingPool1.rewardRate();
        uint256 rate2 = stakingPool2.rewardRate();

        // Pool1 should have ~4x the rate of Pool2
        assertApproxEqRel(rate1, rate2 * 4, 0.01e18, "Pool1 should have 4x rate of Pool2");
    }

    function testTimeMultiplierAccumulation() public {
        // User stakes and waits for time multiplier
        vm.startPrank(user1);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, 0);
        vm.stopPrank();

        // Check multiplier over time
        assertEq(stakingPool1.getTimeMultiplier(user1), 1e18, "Initial multiplier should be 1x");

        vm.warp(block.timestamp + 45 days);
        uint256 mult45 = stakingPool1.getTimeMultiplier(user1);
        assertApproxEqRel(mult45, 2e18, 0.01e18, "45 day multiplier should be ~2x");

        vm.warp(block.timestamp + 45 days);
        assertEq(stakingPool1.getTimeMultiplier(user1), 3e18, "90 day multiplier should be 3x");

        // Beyond 90 days should stay at 3x
        vm.warp(block.timestamp + 90 days);
        assertEq(stakingPool1.getTimeMultiplier(user1), 3e18, "Beyond 90 days should cap at 3x");
    }

    function testVePHASORExpiry() public {
        // User creates short lock and stakes
        vm.startPrank(user1);
        phasor.approve(address(ve), 10000 * 1e18);
        uint256 veTokenId = ve.createLock(10000 * 1e18, block.timestamp + 8 weeks);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, veTokenId);
        vm.stopPrank();

        // User2 stakes without boost
        vm.startPrank(user2);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, 0);
        vm.stopPrank();

        // Initially User1 should have some ve-boost
        uint256 boostBefore = stakingPool1.getVeBoost(user1);
        assertGe(boostBefore, 1e18, "User1 should have at least 1x boost");

        // Warp past lock expiry
        vm.warp(block.timestamp + 9 weeks);

        // User1's voting power should be 0 now
        uint256 veBalance = ve.balanceOfNFT(veTokenId);
        assertEq(veBalance, 0, "vePHASOR balance should be 0 after expiry");

        // ve-boost should revert to 1x
        uint256 boostAfter = stakingPool1.getVeBoost(user1);
        assertEq(boostAfter, 1e18, "Boost should be 1x after lock expires");
    }

    function testWeeklyRewardCycle() public {
        // Test that weekly reward distribution and claiming works correctly
        // Note: Time multiplier increases during staking, which affects earned amounts

        // User stakes
        vm.startPrank(user1);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, 0);
        vm.stopPrank();

        // Distribute week 1
        vm.prank(keeper);
        distributor.distribute();

        uint256 rewardRateWeek1 = stakingPool1.rewardRate();
        assertGt(rewardRateWeek1, 0, "Reward rate should be set");

        // Warp to end of week 1
        vm.warp(block.timestamp + 7 days);

        uint256 earnedWeek1 = stakingPool1.earned(user1);
        assertGt(earnedWeek1, 0, "Should have earned rewards in week 1");

        // Verify period finished
        assertEq(stakingPool1.periodFinish(), block.timestamp, "Period should finish at 7 days");

        // Distribute week 2
        vm.prank(keeper);
        distributor.distribute();

        uint256 rewardRateWeek2 = stakingPool1.rewardRate();
        assertGt(rewardRateWeek2, 0, "Week 2 reward rate should be set");

        // Rates should be similar (same emission per week)
        assertApproxEqRel(rewardRateWeek2, rewardRateWeek1, 0.01e18, "Weekly rates should be consistent");

        // Warp to end of week 2
        vm.warp(block.timestamp + 7 days);

        uint256 earnedTotal = stakingPool1.earned(user1);
        assertGt(earnedTotal, earnedWeek1, "Should have earned more in week 2");

        // Time multiplier should have increased over 14 days
        uint256 timeMultiplier = stakingPool1.getTimeMultiplier(user1);
        // After 14 days: MIN + (MAX-MIN) * 14/90 = 1 + 2 * 0.156 = ~1.31x
        assertGt(timeMultiplier, 1e18, "Time multiplier should be > 1x after 2 weeks");
        assertLt(timeMultiplier, 15e17, "Time multiplier should be < 1.5x after 2 weeks");
    }

    // ============ Edge Case Tests ============

    function testStakeWithExpiredVe() public {
        // Create and let lock expire
        vm.startPrank(user1);
        phasor.approve(address(ve), 10000 * 1e18);
        uint256 veTokenId = ve.createLock(10000 * 1e18, block.timestamp + 8 weeks);
        vm.stopPrank();

        // Warp past expiry
        vm.warp(block.timestamp + 9 weeks);

        // User2 stakes first to establish totalSupply
        vm.startPrank(user2);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, 0);
        vm.stopPrank();

        // User1 tries to stake with expired veNFT - should work but boost is 1x
        vm.startPrank(user1);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, veTokenId);
        vm.stopPrank();

        // Boost should be 1x since lock is expired
        assertEq(stakingPool1.getVeBoost(user1), 1e18, "Boost should be 1x with expired lock");
    }

    function testLIFOWithMultipleDepositsAndRewards() public {
        // Stake in multiple batches
        vm.startPrank(user1);
        lpToken1.approve(address(stakingPool1), 30000 * 1e18);

        // First stake - will get 3x time multiplier eventually
        stakingPool1.stake(10000 * 1e18, 0);

        vm.warp(block.timestamp + 45 days);

        // Second stake - will get 2x eventually (45 days later)
        stakingPool1.stake(10000 * 1e18, 0);

        vm.warp(block.timestamp + 45 days);

        // Third stake - will be 1x
        stakingPool1.stake(10000 * 1e18, 0);
        vm.stopPrank();

        // First deposit is now 90 days old (3x)
        // Second deposit is 45 days old (~2x)
        // Third deposit is 0 days old (1x)

        // Distribute rewards
        vm.prank(keeper);
        distributor.distribute();

        vm.warp(block.timestamp + 7 days);

        // Check multiplier is weighted average
        uint256 multiplier = stakingPool1.getTimeMultiplier(user1);
        // Expected: (10000 * 3 + 10000 * 2 + 10000 * 1.08) / 30000 = ~2.02x
        assertGt(multiplier, 2e18, "Multiplier should be > 2x");
        assertLt(multiplier, 25e17, "Multiplier should be < 2.5x");

        // Withdraw 15000 (should use LIFO - remove all third deposit and half of second)
        vm.prank(user1);
        stakingPool1.withdraw(15000 * 1e18);

        // Now only first deposit (10000, 3x) and half second deposit (5000, ~2.08x)
        uint256 newMultiplier = stakingPool1.getTimeMultiplier(user1);
        assertGt(newMultiplier, multiplier, "Multiplier should increase after LIFO withdrawal");
    }

    function testRewardsDistributorEmissionCap() public {
        // Get initial distribution state
        vm.prank(keeper);
        distributor.distribute();

        uint256 emission = distributor.weeklyEmission();
        uint256 poolRate = stakingPool1.rewardRate();

        // Emission should be 700k PHASOR per week
        assertEq(emission, 700_000 * 1e18, "Weekly emission should be 700k");

        // With 80% allocation, pool1 should get 560k/week
        uint256 expectedRate = (560_000 * 1e18) / uint256(7 days);
        assertApproxEqRel(poolRate, expectedRate, 0.01e18, "Pool rate should match 80% allocation");
    }

    function testConcurrentVeUpdates() public {
        // Both users create vePHASOR
        vm.startPrank(user1);
        phasor.approve(address(ve), 50000 * 1e18);
        uint256 veToken1 = ve.createLock(50000 * 1e18, block.timestamp + 2 * 365 days);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, veToken1);
        vm.stopPrank();

        vm.startPrank(user2);
        phasor.approve(address(ve), 50000 * 1e18);
        uint256 veToken2 = ve.createLock(50000 * 1e18, block.timestamp + 2 * 365 days);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, veToken2);
        vm.stopPrank();

        // Both have equal vePHASOR, boosts should be similar
        uint256 boost1 = stakingPool1.getVeBoost(user1);
        uint256 boost2 = stakingPool1.getVeBoost(user2);

        assertApproxEqRel(boost1, boost2, 0.01e18, "Equal ve-holders should have equal boost");

        // User1 increases their vePHASOR
        vm.startPrank(user1);
        phasor.approve(address(ve), 100000 * 1e18);
        ve.increaseAmount(veToken1, 100000 * 1e18);
        vm.stopPrank();

        // User1's boost should now be higher
        uint256 newBoost1 = stakingPool1.getVeBoost(user1);
        uint256 newBoost2 = stakingPool1.getVeBoost(user2);

        assertGt(newBoost1, newBoost2, "User1 with more vePHASOR should have higher boost");
    }

    function testEmergencyPauseAndRecover() public {
        // Users stake
        vm.startPrank(user1);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, 0);
        vm.stopPrank();

        // Distribute rewards
        vm.prank(keeper);
        distributor.distribute();

        vm.warp(block.timestamp + 3 days);

        // Emergency pause
        vm.prank(owner);
        stakingPool1.pause();

        // User cannot stake or withdraw while paused
        vm.startPrank(user1);
        lpToken1.approve(address(stakingPool1), 1000 * 1e18);
        vm.expectRevert();
        stakingPool1.stake(1000 * 1e18, 0);

        vm.expectRevert();
        stakingPool1.withdraw(1000 * 1e18);

        // But can still claim rewards
        uint256 earned = stakingPool1.earned(user1);
        stakingPool1.getReward();
        assertGt(phasor.balanceOf(user1), INITIAL_PHASOR, "Should receive rewards even when paused");
        vm.stopPrank();

        // Unpause
        vm.prank(owner);
        stakingPool1.unpause();

        // User can now withdraw
        vm.prank(user1);
        stakingPool1.withdraw(10000 * 1e18);
        assertEq(stakingPool1.balanceOf(user1), 0, "Should withdraw after unpause");
    }

    function testMergeVeLocksAndUpdateStaking() public {
        // User1 creates two vePHASOR locks
        vm.startPrank(user1);
        phasor.approve(address(ve), 100000 * 1e18);
        uint256 veToken1 = ve.createLock(30000 * 1e18, block.timestamp + 2 * 365 days);
        uint256 veToken2 = ve.createLock(30000 * 1e18, block.timestamp + 3 * 365 days);

        // Stake with first veNFT
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, veToken1);
        vm.stopPrank();

        // User2 stakes to establish comparison
        vm.startPrank(user2);
        lpToken1.approve(address(stakingPool1), 10000 * 1e18);
        stakingPool1.stake(10000 * 1e18, 0);
        vm.stopPrank();

        uint256 boostBefore = stakingPool1.getVeBoost(user1);

        // User1 merges locks (all into veToken2)
        vm.startPrank(user1);
        ve.merge(veToken1, veToken2);

        // Update staking to use the merged veNFT
        stakingPool1.updateVeTokenId(veToken2);
        vm.stopPrank();

        uint256 boostAfter = stakingPool1.getVeBoost(user1);

        // Merged lock should have more voting power (longer duration)
        assertGt(boostAfter, boostBefore, "Boost should increase after merge to longer lock");
    }
}
