// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/token/PhasorToken.sol";
import "../contracts/governance/VotingEscrow.sol";
import "../contracts/governance/interfaces/IVotingEscrow.sol";

contract VotingEscrowTest is Test {
    PhasorToken public phasor;
    VotingEscrow public ve;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    uint256 public constant INITIAL_BALANCE = 1_000_000 * 1e18;
    uint256 public constant WEEK = 7 days;
    uint256 public constant MAXTIME = 4 * 365 days;

    function setUp() public {
        // Align timestamp to week boundary to avoid rounding issues in tests
        uint256 alignedTime = (block.timestamp / WEEK + 1) * WEEK;
        vm.warp(alignedTime);

        vm.startPrank(owner);

        // Deploy PHASOR token
        phasor = new PhasorToken();

        // Deploy VotingEscrow
        ve = new VotingEscrow(address(phasor));

        // Transfer tokens to users
        phasor.transfer(user1, INITIAL_BALANCE);
        phasor.transfer(user2, INITIAL_BALANCE);

        vm.stopPrank();
    }

    // ============ Create Lock Tests ============

    function testCreateLock() public {
        uint256 amount = 1000 * 1e18;
        uint256 unlockTime = block.timestamp + 365 days;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount);

        uint256 tokenId = ve.createLock(amount, unlockTime);
        vm.stopPrank();

        assertEq(tokenId, 1, "First token ID should be 1");
        assertEq(ve.ownerOf(tokenId), user1, "User1 should own the NFT");
        assertEq(ve.totalLocked(), amount, "Total locked should match");
        assertEq(ve.balanceOf(user1), 1, "User1 should have 1 NFT");

        // Check lock data
        VotingEscrow.LockedBalance memory lock = ve.locked(tokenId);
        assertEq(lock.amount, uint128(amount), "Lock amount should match");
        assertGt(lock.end, block.timestamp, "Unlock time should be in future");
    }

    function testCreateLockMinDuration() public {
        uint256 amount = 1000 * 1e18;
        uint256 unlockTime = block.timestamp + 1 weeks;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount);
        uint256 tokenId = ve.createLock(amount, unlockTime);
        vm.stopPrank();

        // Voting power should be minimal (1 week / 4 years ≈ 0.48%)
        uint256 votingPower = ve.balanceOfNFT(tokenId);
        uint256 expectedPower = (amount * 1 weeks) / MAXTIME;
        assertApproxEqRel(votingPower, expectedPower, 0.01e18, "Voting power should be ~0.48%");
    }

    function testCreateLockMaxDuration() public {
        uint256 amount = 1000 * 1e18;
        uint256 unlockTime = block.timestamp + MAXTIME;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount);
        uint256 tokenId = ve.createLock(amount, unlockTime);
        vm.stopPrank();

        // Voting power should be close to full amount (minus rounding)
        uint256 votingPower = ve.balanceOfNFT(tokenId);
        assertApproxEqRel(votingPower, amount, 0.01e18, "Voting power should be ~100%");
    }

    function testCreateLockZeroAmountReverts() public {
        vm.prank(user1);
        vm.expectRevert(IVotingEscrow.ZeroAmount.selector);
        ve.createLock(0, block.timestamp + 365 days);
    }

    function testCreateLockPastTimeReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        vm.expectRevert(IVotingEscrow.InvalidUnlockTime.selector);
        ve.createLock(1000 * 1e18, block.timestamp - 1 weeks);
        vm.stopPrank();
    }

    function testCreateLockTooShortReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        // 3 days rounds down to 0 weeks from an aligned timestamp, so it's InvalidUnlockTime
        vm.expectRevert(IVotingEscrow.InvalidUnlockTime.selector);
        ve.createLock(1000 * 1e18, block.timestamp + 3 days);
        vm.stopPrank();
    }

    function testCreateLockTooLongReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        vm.expectRevert(IVotingEscrow.UnlockTimeTooLong.selector);
        ve.createLock(1000 * 1e18, block.timestamp + 5 * 365 days);
        vm.stopPrank();
    }

    // ============ Voting Power Decay Tests ============

    function testVotingPowerDecay() public {
        uint256 amount = 1000 * 1e18;
        uint256 unlockTime = block.timestamp + 365 days;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount);
        uint256 tokenId = ve.createLock(amount, unlockTime);
        vm.stopPrank();

        // Get actual lock end (after week rounding)
        VotingEscrow.LockedBalance memory lock = ve.locked(tokenId);
        uint256 actualEnd = lock.end;
        uint256 startTime = block.timestamp;

        uint256 initialPower = ve.balanceOfNFT(tokenId);

        // Warp 50% of lock duration
        uint256 midTime = startTime + (actualEnd - startTime) / 2;
        vm.warp(midTime);

        uint256 midPower = ve.balanceOfNFT(tokenId);
        assertApproxEqRel(midPower, initialPower / 2, 0.05e18, "Power should be ~50% at midpoint");

        // Warp to just before unlock (use actual end time)
        vm.warp(actualEnd - 1 hours);

        uint256 nearEndPower = ve.balanceOfNFT(tokenId);
        assertLt(nearEndPower, midPower, "Power should be less near end");
        assertGt(nearEndPower, 0, "Power should still be > 0 before unlock");

        // Warp past unlock
        vm.warp(actualEnd + 1 hours);

        uint256 expiredPower = ve.balanceOfNFT(tokenId);
        assertEq(expiredPower, 0, "Power should be 0 after unlock");
    }

    // ============ Increase Amount Tests ============

    function testIncreaseAmount() public {
        uint256 initialAmount = 1000 * 1e18;
        uint256 additionalAmount = 500 * 1e18;
        uint256 unlockTime = block.timestamp + 365 days;

        vm.startPrank(user1);
        phasor.approve(address(ve), initialAmount + additionalAmount);
        uint256 tokenId = ve.createLock(initialAmount, unlockTime);

        uint256 initialPower = ve.balanceOfNFT(tokenId);

        ve.increaseAmount(tokenId, additionalAmount);
        vm.stopPrank();

        uint256 newPower = ve.balanceOfNFT(tokenId);
        uint256 expectedIncrease = (initialPower * additionalAmount) / initialAmount;

        assertApproxEqRel(newPower, initialPower + expectedIncrease, 0.01e18, "Power should increase proportionally");

        VotingEscrow.LockedBalance memory lock = ve.locked(tokenId);
        assertEq(lock.amount, uint128(initialAmount + additionalAmount), "Lock amount should increase");
    }

    function testIncreaseAmountNotOwnerReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        uint256 tokenId = ve.createLock(1000 * 1e18, block.timestamp + 365 days);
        vm.stopPrank();

        vm.startPrank(user2);
        phasor.approve(address(ve), 500 * 1e18);
        vm.expectRevert(IVotingEscrow.NotTokenOwner.selector);
        ve.increaseAmount(tokenId, 500 * 1e18);
        vm.stopPrank();
    }

    function testIncreaseAmountExpiredReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 2000 * 1e18);
        uint256 tokenId = ve.createLock(1000 * 1e18, block.timestamp + 1 weeks);
        vm.stopPrank();

        // Warp past unlock
        vm.warp(block.timestamp + 2 weeks);

        vm.startPrank(user1);
        vm.expectRevert(IVotingEscrow.LockExpired.selector);
        ve.increaseAmount(tokenId, 500 * 1e18);
        vm.stopPrank();
    }

    // ============ Increase Unlock Time Tests ============

    function testIncreaseUnlockTime() public {
        uint256 amount = 1000 * 1e18;
        uint256 initialUnlock = block.timestamp + 180 days;
        uint256 newUnlock = block.timestamp + 365 days;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount);
        uint256 tokenId = ve.createLock(amount, initialUnlock);

        uint256 initialPower = ve.balanceOfNFT(tokenId);

        ve.increaseUnlockTime(tokenId, newUnlock);
        vm.stopPrank();

        uint256 newPower = ve.balanceOfNFT(tokenId);
        assertGt(newPower, initialPower, "Power should increase with longer lock");
    }

    function testIncreaseUnlockTimeShorterReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        uint256 tokenId = ve.createLock(1000 * 1e18, block.timestamp + 365 days);

        vm.expectRevert(IVotingEscrow.InvalidUnlockTime.selector);
        ve.increaseUnlockTime(tokenId, block.timestamp + 180 days);
        vm.stopPrank();
    }

    // ============ Withdraw Tests ============

    function testWithdrawAfterExpiry() public {
        uint256 amount = 1000 * 1e18;
        uint256 unlockTime = block.timestamp + 1 weeks;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount);
        uint256 tokenId = ve.createLock(amount, unlockTime);
        vm.stopPrank();

        uint256 balanceBefore = phasor.balanceOf(user1);

        // Warp past unlock
        vm.warp(block.timestamp + 2 weeks);

        vm.prank(user1);
        ve.withdraw(tokenId);

        uint256 balanceAfter = phasor.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, amount, "Should receive full amount");
        assertEq(ve.totalLocked(), 0, "Total locked should be 0");

        // NFT should be burned
        vm.expectRevert();
        ve.ownerOf(tokenId);
    }

    function testWithdrawBeforeExpiryReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        uint256 tokenId = ve.createLock(1000 * 1e18, block.timestamp + 365 days);

        vm.expectRevert(IVotingEscrow.LockNotExpired.selector);
        ve.withdraw(tokenId);
        vm.stopPrank();
    }

    function testWithdrawNotOwnerReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        uint256 tokenId = ve.createLock(1000 * 1e18, block.timestamp + 1 weeks);
        vm.stopPrank();

        vm.warp(block.timestamp + 2 weeks);

        vm.prank(user2);
        vm.expectRevert(IVotingEscrow.NotTokenOwner.selector);
        ve.withdraw(tokenId);
    }

    // ============ Merge Tests ============

    function testMergeLocks() public {
        uint256 amount1 = 1000 * 1e18;
        uint256 amount2 = 500 * 1e18;
        uint256 unlock1 = block.timestamp + 180 days;
        uint256 unlock2 = block.timestamp + 365 days;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount1 + amount2);
        uint256 tokenId1 = ve.createLock(amount1, unlock1);
        uint256 tokenId2 = ve.createLock(amount2, unlock2);

        ve.merge(tokenId1, tokenId2);
        vm.stopPrank();

        // tokenId1 should be burned
        vm.expectRevert();
        ve.ownerOf(tokenId1);

        // tokenId2 should have combined amount and later unlock time
        VotingEscrow.LockedBalance memory lock = ve.locked(tokenId2);
        assertEq(lock.amount, uint128(amount1 + amount2), "Merged amount should be sum");

        // Total locked should be sum
        assertEq(ve.totalLocked(), amount1 + amount2, "Total locked should be sum");

        // User should have 1 NFT
        assertEq(ve.balanceOf(user1), 1, "User should have 1 NFT after merge");
    }

    function testMergeSameTokenReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        uint256 tokenId = ve.createLock(1000 * 1e18, block.timestamp + 365 days);

        vm.expectRevert(IVotingEscrow.SameToken.selector);
        ve.merge(tokenId, tokenId);
        vm.stopPrank();
    }

    function testMergeDifferentOwnersReverts() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        uint256 tokenId1 = ve.createLock(1000 * 1e18, block.timestamp + 365 days);
        vm.stopPrank();

        vm.startPrank(user2);
        phasor.approve(address(ve), 500 * 1e18);
        uint256 tokenId2 = ve.createLock(500 * 1e18, block.timestamp + 365 days);
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert(IVotingEscrow.NotTokenOwner.selector);
        ve.merge(tokenId1, tokenId2);
    }

    // ============ Total Voting Power Tests ============

    function testTotalVotingPowerAccuracy() public {
        uint256 amount1 = 1000 * 1e18;
        uint256 amount2 = 2000 * 1e18;
        uint256 unlock1 = block.timestamp + 365 days;
        uint256 unlock2 = block.timestamp + 2 * 365 days;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount1);
        uint256 tokenId1 = ve.createLock(amount1, unlock1);
        vm.stopPrank();

        vm.startPrank(user2);
        phasor.approve(address(ve), amount2);
        uint256 tokenId2 = ve.createLock(amount2, unlock2);
        vm.stopPrank();

        uint256 power1 = ve.balanceOfNFT(tokenId1);
        uint256 power2 = ve.balanceOfNFT(tokenId2);
        uint256 totalPower = ve.totalVotingPower();

        assertEq(totalPower, power1 + power2, "Total power should be sum of individual powers");
    }

    // ============ Weekly Rounding Tests ============

    function testWeeklyRounding() public {
        uint256 amount = 1000 * 1e18;
        // Unlock time not on week boundary (10 days = 1 week + 3 days)
        // Since timestamp is aligned, this should round to 1 week
        uint256 unlockTime = block.timestamp + 10 days;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount);
        uint256 tokenId = ve.createLock(amount, unlockTime);
        vm.stopPrank();

        VotingEscrow.LockedBalance memory lock = ve.locked(tokenId);

        // Should be rounded down to nearest week
        assertEq(lock.end % WEEK, 0, "Unlock time should be rounded to week");
        // Should be exactly 1 week from the aligned timestamp
        assertEq(lock.end, block.timestamp + 1 weeks, "Should round down to 1 week");
    }

    // ============ NFT Transfer Tests ============

    function testNFTTransferUpdatesOwner() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 1000 * 1e18);
        uint256 tokenId = ve.createLock(1000 * 1e18, block.timestamp + 2 weeks);

        // Transfer to user2
        ve.transferFrom(user1, user2, tokenId);
        vm.stopPrank();

        assertEq(ve.ownerOf(tokenId), user2, "User2 should now own the NFT");
        assertEq(ve.balanceOf(user1), 0, "User1 should have 0 NFTs");
        assertEq(ve.balanceOf(user2), 1, "User2 should have 1 NFT");

        // Warp to unlock and user2 should be able to withdraw
        vm.warp(block.timestamp + 3 weeks);

        vm.prank(user2);
        ve.withdraw(tokenId);

        assertEq(phasor.balanceOf(user2), INITIAL_BALANCE + 1000 * 1e18, "User2 should receive tokens");
    }

    // ============ Tokens Of Owner Tests ============

    function testTokensOfOwner() public {
        vm.startPrank(user1);
        phasor.approve(address(ve), 3000 * 1e18);

        uint256 tokenId1 = ve.createLock(1000 * 1e18, block.timestamp + 365 days);
        uint256 tokenId2 = ve.createLock(1000 * 1e18, block.timestamp + 365 days);
        uint256 tokenId3 = ve.createLock(1000 * 1e18, block.timestamp + 365 days);
        vm.stopPrank();

        uint256[] memory tokens = ve.tokensOfOwner(user1);
        assertEq(tokens.length, 3, "Should have 3 tokens");
        assertEq(tokens[0], tokenId1, "First token should be tokenId1");
        assertEq(tokens[1], tokenId2, "Second token should be tokenId2");
        assertEq(tokens[2], tokenId3, "Third token should be tokenId3");
    }

    // ============ Historical Voting Power Tests ============

    function testBalanceOfNFTAt() public {
        uint256 amount = 1000 * 1e18;
        uint256 unlockTime = block.timestamp + 365 days;

        vm.startPrank(user1);
        phasor.approve(address(ve), amount);
        uint256 tokenId = ve.createLock(amount, unlockTime);
        vm.stopPrank();

        uint256 createTime = block.timestamp;
        uint256 initialPower = ve.balanceOfNFTAt(tokenId, createTime);

        // Warp forward
        vm.warp(block.timestamp + 180 days);

        // Query historical power
        uint256 historicalPower = ve.balanceOfNFTAt(tokenId, createTime);
        assertEq(historicalPower, initialPower, "Historical power should match");

        // Current power should be less
        uint256 currentPower = ve.balanceOfNFT(tokenId);
        assertLt(currentPower, initialPower, "Current power should be less than initial");
    }
}
