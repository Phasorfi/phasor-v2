// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/token/PhasorToken.sol";
import "../contracts/governance/VotingEscrow.sol";
import "../contracts/staking/StakingRewards.sol";
import "../contracts/staking/RewardsDistributor.sol";
import "../contracts/staking/interfaces/IStakingRewards.sol";
import "../contracts/test/MockLP.sol";

contract StakingRewardsTest is Test {
    PhasorToken public phasor;
    VotingEscrow public ve;
    StakingRewards public staking;
    RewardsDistributor public distributor;
    MockLP public lpToken;

    address public owner = address(1);
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

        // Deploy StakingRewards
        staking = new StakingRewards(
            address(phasor),
            address(ve),
            address(distributor)
        );

        // Deploy mock LP token
        lpToken = new MockLP();

        // Set staking token
        staking.setStakingToken(address(lpToken));

        // Add staking pool to distributor
        distributor.addPool(address(staking), 1000);

        // Transfer PHASOR ownership to distributor for minting
        phasor.transferOwnership(address(distributor));

        // Transfer LP tokens to users
        lpToken.transfer(user1, INITIAL_LP);
        lpToken.transfer(user2, INITIAL_LP);

        // Transfer some PHASOR to users for locking
        // Owner has 100M, transfer some before ownership transfer
        vm.stopPrank();

        // Owner still has the initial 100M PHASOR, give some to users
        vm.prank(owner);
        phasor.transfer(user1, INITIAL_PHASOR);
        vm.prank(owner);
        phasor.transfer(user2, INITIAL_PHASOR);
    }

    // ============ Stake Tests ============

    function testStakeWithoutBoost() public {
        uint256 amount = 1000 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount);
        staking.stake(amount, 0);
        vm.stopPrank();

        assertEq(staking.balanceOf(user1), amount, "Balance should match");
        assertEq(staking.totalSupply(), amount, "Total supply should match");

        // Time multiplier should be 1x at day 0
        uint256 timeMultiplier = staking.getTimeMultiplier(user1);
        assertEq(timeMultiplier, 1e18, "Time multiplier should be 1x");

        // ve-boost should be 1x without veNFT
        uint256 veBoost = staking.getVeBoost(user1);
        assertEq(veBoost, 1e18, "ve-boost should be 1x");

        // Total multiplier should be 1x
        uint256 totalMultiplier = staking.getTotalMultiplier(user1);
        assertEq(totalMultiplier, 1e18, "Total multiplier should be 1x");
    }

    function testStakeZeroReverts() public {
        vm.prank(user1);
        vm.expectRevert(IStakingRewards.ZeroAmount.selector);
        staking.stake(0, 0);
    }

    // ============ Time Multiplier Tests ============

    function testTimeMultiplierRamp() public {
        uint256 amount = 1000 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount);
        staking.stake(amount, 0);
        vm.stopPrank();

        // Day 0: 1x multiplier
        uint256 mult0 = staking.getTimeMultiplier(user1);
        assertEq(mult0, 1e18, "Day 0 should be 1x");

        // Day 30: should be ~1.67x
        vm.warp(block.timestamp + 30 days);
        uint256 mult30 = staking.getTimeMultiplier(user1);
        assertApproxEqRel(mult30, 1.666666e18, 0.01e18, "Day 30 should be ~1.67x");

        // Day 60: should be ~2.33x
        vm.warp(block.timestamp + 30 days);
        uint256 mult60 = staking.getTimeMultiplier(user1);
        assertApproxEqRel(mult60, 2.333333e18, 0.01e18, "Day 60 should be ~2.33x");

        // Day 90: should be 3x
        vm.warp(block.timestamp + 30 days);
        uint256 mult90 = staking.getTimeMultiplier(user1);
        assertEq(mult90, 3e18, "Day 90 should be 3x");
    }

    function testTimeMultiplierCap() public {
        uint256 amount = 1000 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount);
        staking.stake(amount, 0);
        vm.stopPrank();

        // Warp 180 days (past 90 day cap)
        vm.warp(block.timestamp + 180 days);

        uint256 multiplier = staking.getTimeMultiplier(user1);
        assertEq(multiplier, 3e18, "Multiplier should cap at 3x");
    }

    // ============ ve-Boost Tests ============

    function testVeBoostWithOwnership() public {
        // ve-boost is relative - need two stakers to see the effect
        // User with veNFT gets proportionally more than user without
        uint256 lpAmount = 1000 * 1e18;
        uint256 lockAmount = 100000 * 1e18;

        // User2 stakes first WITHOUT veNFT
        vm.startPrank(user2);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, 0);
        vm.stopPrank();

        // User1 creates a vePHASOR lock and stakes WITH veNFT
        vm.startPrank(user1);
        phasor.approve(address(ve), lockAmount);
        uint256 veTokenId = ve.createLock(lockAmount, block.timestamp + 4 * 365 days);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, veTokenId);
        vm.stopPrank();

        // User1 has veNFT, User2 doesn't
        // User1 should have boost > 1x (since they have vePHASOR and other staker doesn't)
        uint256 veBoost1 = staking.getVeBoost(user1);
        uint256 veBoost2 = staking.getVeBoost(user2);

        assertGt(veBoost1, 1e18, "ve-boost should be > 1x with veNFT");
        assertEq(veBoost2, 1e18, "ve-boost should be 1x without veNFT");
        assertGt(veBoost1, veBoost2, "User with veNFT should have higher boost");
    }

    function testVeBoostNoNFT() public {
        uint256 amount = 1000 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount);
        staking.stake(amount, 0);
        vm.stopPrank();

        uint256 veBoost = staking.getVeBoost(user1);
        assertEq(veBoost, 1e18, "ve-boost should be 1x without veNFT");
    }

    function testVeBoostLostOnTransfer() public {
        // Need multiple stakers to see ve-boost effect
        uint256 lpAmount = 1000 * 1e18;
        uint256 lockAmount = 100000 * 1e18;

        // User2 stakes first WITHOUT veNFT to create relative boost scenario
        vm.startPrank(user2);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, 0);
        vm.stopPrank();

        // User1 creates lock and stakes with boost
        vm.startPrank(user1);
        phasor.approve(address(ve), lockAmount);
        uint256 veTokenId = ve.createLock(lockAmount, block.timestamp + 4 * 365 days);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, veTokenId);

        uint256 boostBefore = staking.getVeBoost(user1);
        assertGt(boostBefore, 1e18, "Should have boost before transfer");

        // Transfer veNFT to user2
        ve.transferFrom(user1, user2, veTokenId);
        vm.stopPrank();

        // Boost should now be 1x since user1 no longer owns the veNFT
        uint256 boostAfter = staking.getVeBoost(user1);
        assertEq(boostAfter, 1e18, "Boost should be 1x after NFT transfer");
    }

    function testVeBoostMaxCap() public {
        uint256 lpAmount = 1000 * 1e18;
        uint256 lockAmount = 500000 * 1e18; // Large lock

        // User1 creates a large lock
        vm.startPrank(user1);
        phasor.approve(address(ve), lockAmount);
        uint256 veTokenId = ve.createLock(lockAmount, block.timestamp + 4 * 365 days);

        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, veTokenId);
        vm.stopPrank();

        // ve-boost should be capped at 2.5x
        uint256 veBoost = staking.getVeBoost(user1);
        assertLe(veBoost, 25e17, "ve-boost should be capped at 2.5x");
    }

    // ============ Combined Multiplier Tests ============

    function testCombinedMultipliers() public {
        // Need multiple stakers to see ve-boost effect
        uint256 lpAmount = 1000 * 1e18;
        uint256 lockAmount = 100000 * 1e18;

        // User2 stakes first WITHOUT veNFT
        vm.startPrank(user2);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, 0);
        vm.stopPrank();

        // User1 creates lock and stakes WITH veNFT
        vm.startPrank(user1);
        phasor.approve(address(ve), lockAmount);
        uint256 veTokenId = ve.createLock(lockAmount, block.timestamp + 4 * 365 days);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, veTokenId);
        vm.stopPrank();

        // Warp to max time multiplier (90 days)
        vm.warp(block.timestamp + 90 days);

        uint256 timeMultiplier = staking.getTimeMultiplier(user1);
        uint256 veBoost = staking.getVeBoost(user1);
        uint256 totalMultiplier = staking.getTotalMultiplier(user1);

        // Total should be time x ve
        uint256 expectedTotal = (timeMultiplier * veBoost) / 1e18;
        assertEq(totalMultiplier, expectedTotal, "Total should be time x ve");

        // At max time (3x) with ve-boost, combined should be > 3x
        assertGt(totalMultiplier, 3e18, "Combined multiplier should be > 3x");

        // Compare with user2 who has no veNFT (only 3x time multiplier)
        uint256 totalMultiplier2 = staking.getTotalMultiplier(user2);
        assertEq(totalMultiplier2, 3e18, "User2 should have exactly 3x (time only)");
        assertGt(totalMultiplier, totalMultiplier2, "User1 combined should exceed User2");
    }

    // ============ Multiple Deposits Tests ============

    function testMultipleDeposits() public {
        uint256 amount1 = 1000 * 1e18;
        uint256 amount2 = 500 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount1 + amount2);

        // First deposit
        staking.stake(amount1, 0);

        // Warp 45 days
        vm.warp(block.timestamp + 45 days);

        // Second deposit
        staking.stake(amount2, 0);
        vm.stopPrank();

        // Check deposits
        IStakingRewards.Deposit[] memory deposits = staking.getUserDeposits(user1);
        assertEq(deposits.length, 2, "Should have 2 deposits");
        assertEq(deposits[0].amount, amount1, "First deposit amount");
        assertEq(deposits[1].amount, amount2, "Second deposit amount");

        // Time multiplier should be weighted average
        // First deposit: 45 days old = ~2x
        // Second deposit: 0 days old = 1x
        // Weighted: (1000 * 2 + 500 * 1) / 1500 = ~1.67x
        uint256 multiplier = staking.getTimeMultiplier(user1);
        assertGt(multiplier, 1e18, "Multiplier should be > 1x");
        assertLt(multiplier, 2e18, "Multiplier should be < 2x (weighted avg)");
    }

    // ============ LIFO Withdrawal Tests ============

    function testLIFOWithdrawal() public {
        uint256 amount1 = 1000 * 1e18;
        uint256 amount2 = 500 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount1 + amount2);

        // First deposit
        staking.stake(amount1, 0);

        // Warp 45 days
        vm.warp(block.timestamp + 45 days);

        // Second deposit
        staking.stake(amount2, 0);

        // Withdraw 300 (should come from second deposit)
        staking.withdraw(300 * 1e18);
        vm.stopPrank();

        IStakingRewards.Deposit[] memory deposits = staking.getUserDeposits(user1);
        assertEq(deposits.length, 2, "Should still have 2 deposits");
        assertEq(deposits[0].amount, amount1, "First deposit unchanged");
        assertEq(deposits[1].amount, 200 * 1e18, "Second deposit reduced");
    }

    function testLIFOPreservesOldMultipliers() public {
        uint256 amount1 = 1000 * 1e18;
        uint256 amount2 = 500 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount1 + amount2);

        // First deposit
        staking.stake(amount1, 0);

        // Warp 60 days
        vm.warp(block.timestamp + 60 days);

        // Second deposit
        staking.stake(amount2, 0);

        // Get multiplier with both deposits
        uint256 multiplierBefore = staking.getTimeMultiplier(user1);

        // Withdraw entire second deposit (500)
        staking.withdraw(amount2);

        // Multiplier should be higher now (only old deposit remains)
        uint256 multiplierAfter = staking.getTimeMultiplier(user1);
        vm.stopPrank();

        assertGt(multiplierAfter, multiplierBefore, "Multiplier should increase after removing new deposit");
    }

    // ============ Withdraw Tests ============

    function testWithdraw() public {
        uint256 amount = 1000 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount);
        staking.stake(amount, 0);

        uint256 balanceBefore = lpToken.balanceOf(user1);
        staking.withdraw(amount);
        uint256 balanceAfter = lpToken.balanceOf(user1);
        vm.stopPrank();

        assertEq(balanceAfter - balanceBefore, amount, "Should receive LP back");
        assertEq(staking.balanceOf(user1), 0, "Staking balance should be 0");
    }

    function testWithdrawInsufficientReverts() public {
        uint256 amount = 1000 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount);
        staking.stake(amount, 0);

        vm.expectRevert(IStakingRewards.InsufficientBalance.selector);
        staking.withdraw(amount + 1);
        vm.stopPrank();
    }

    // ============ Reward Distribution Tests ============

    function testRewardDistribution() public {
        uint256 lpAmount = 1000 * 1e18;

        // User stakes
        vm.startPrank(user1);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, 0);
        vm.stopPrank();

        // Distribute rewards
        vm.prank(owner);
        distributor.distribute();

        // Check reward rate is set
        uint256 rewardRate = staking.rewardRate();
        assertGt(rewardRate, 0, "Reward rate should be > 0");
    }

    function testRewardAccrual() public {
        uint256 lpAmount = 1000 * 1e18;

        // User stakes
        vm.startPrank(user1);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, 0);
        vm.stopPrank();

        // Distribute rewards
        vm.prank(owner);
        distributor.distribute();

        // Warp 1 day
        vm.warp(block.timestamp + 1 days);

        // Check earned rewards
        uint256 earned = staking.earned(user1);
        assertGt(earned, 0, "Should have earned rewards");
    }

    function testRewardClaim() public {
        uint256 lpAmount = 1000 * 1e18;

        // User stakes
        vm.startPrank(user1);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, 0);
        vm.stopPrank();

        // Distribute rewards
        vm.prank(owner);
        distributor.distribute();

        // Warp 1 day
        vm.warp(block.timestamp + 1 days);

        uint256 phasorBefore = phasor.balanceOf(user1);

        vm.prank(user1);
        staking.getReward();

        uint256 phasorAfter = phasor.balanceOf(user1);
        assertGt(phasorAfter, phasorBefore, "Should have received PHASOR rewards");
    }

    function testMultipleUsersProportional() public {
        uint256 amount1 = 2000 * 1e18;
        uint256 amount2 = 1000 * 1e18;

        // Both users stake (user1 stakes 2x as much)
        vm.startPrank(user1);
        lpToken.approve(address(staking), amount1);
        staking.stake(amount1, 0);
        vm.stopPrank();

        vm.startPrank(user2);
        lpToken.approve(address(staking), amount2);
        staking.stake(amount2, 0);
        vm.stopPrank();

        // Distribute rewards
        vm.prank(owner);
        distributor.distribute();

        // Warp 1 day
        vm.warp(block.timestamp + 1 days);

        uint256 earned1 = staking.earned(user1);
        uint256 earned2 = staking.earned(user2);

        // User1 should earn ~2x what user2 earns
        assertApproxEqRel(earned1, earned2 * 2, 0.01e18, "User1 should earn ~2x user2");
    }

    // ============ Exit Tests ============

    function testExit() public {
        uint256 lpAmount = 1000 * 1e18;

        // User stakes
        vm.startPrank(user1);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, 0);
        vm.stopPrank();

        // Distribute rewards
        vm.prank(owner);
        distributor.distribute();

        // Warp 1 day
        vm.warp(block.timestamp + 1 days);

        uint256 lpBefore = lpToken.balanceOf(user1);
        uint256 phasorBefore = phasor.balanceOf(user1);

        vm.prank(user1);
        staking.exit();

        uint256 lpAfter = lpToken.balanceOf(user1);
        uint256 phasorAfter = phasor.balanceOf(user1);

        assertEq(lpAfter - lpBefore, lpAmount, "Should receive all LP back");
        assertGt(phasorAfter, phasorBefore, "Should receive PHASOR rewards");
        assertEq(staking.balanceOf(user1), 0, "Staking balance should be 0");
    }

    // ============ Update veTokenId Tests ============

    function testUpdateVeTokenId() public {
        // Need multiple stakers to see ve-boost effect
        uint256 lpAmount = 1000 * 1e18;
        uint256 lockAmount = 100000 * 1e18;

        // User2 stakes first to create relative boost scenario
        vm.startPrank(user2);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, 0);
        vm.stopPrank();

        // User1 stakes without boost first
        vm.startPrank(user1);
        lpToken.approve(address(staking), lpAmount);
        staking.stake(lpAmount, 0);

        uint256 boostBefore = staking.getVeBoost(user1);
        assertEq(boostBefore, 1e18, "No boost initially");

        // Create veNFT
        phasor.approve(address(ve), lockAmount);
        uint256 veTokenId = ve.createLock(lockAmount, block.timestamp + 4 * 365 days);

        // Update to use veNFT
        staking.updateVeTokenId(veTokenId);
        vm.stopPrank();

        uint256 boostAfter = staking.getVeBoost(user1);
        assertGt(boostAfter, 1e18, "Should have boost after update");
    }

    // ============ Pause Tests ============

    function testPauseStake() public {
        vm.prank(owner);
        staking.pause();

        vm.startPrank(user1);
        lpToken.approve(address(staking), 1000 * 1e18);
        vm.expectRevert();
        staking.stake(1000 * 1e18, 0);
        vm.stopPrank();
    }

    function testPauseWithdraw() public {
        // Stake first
        vm.startPrank(user1);
        lpToken.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18, 0);
        vm.stopPrank();

        // Pause
        vm.prank(owner);
        staking.pause();

        // Withdraw should fail
        vm.prank(user1);
        vm.expectRevert();
        staking.withdraw(500 * 1e18);
    }

    function testUnpause() public {
        vm.startPrank(owner);
        staking.pause();
        staking.unpause();
        vm.stopPrank();

        // Should work now
        vm.startPrank(user1);
        lpToken.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18, 0);
        vm.stopPrank();

        assertEq(staking.balanceOf(user1), 1000 * 1e18);
    }

    // ============ Effective Supply Tests ============

    function testEffectiveSupplyTracking() public {
        uint256 amount = 1000 * 1e18;

        vm.startPrank(user1);
        lpToken.approve(address(staking), amount);
        staking.stake(amount, 0);
        vm.stopPrank();

        // Initial effective supply = amount * 1x = amount
        uint256 effectiveSupply = staking.totalEffectiveSupply();
        assertEq(effectiveSupply, amount, "Initial effective supply should match");

        // Warp to increase multiplier
        vm.warp(block.timestamp + 90 days);

        // Stake more to trigger update
        vm.startPrank(user1);
        lpToken.approve(address(staking), 1);
        staking.stake(1, 0);
        vm.stopPrank();

        // Effective supply should be higher now
        uint256 newEffectiveSupply = staking.totalEffectiveSupply();
        assertGt(newEffectiveSupply, effectiveSupply, "Effective supply should increase");
    }
}
